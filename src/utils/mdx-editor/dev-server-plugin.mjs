/**
 * dev-server-plugin：在线可视化精修工具 · dev server 写回端点（Vite 插件版）
 *
 * 为什么不用 Astro middleware？
 *   dev 模式下 `/__edit__/*` 请求不匹配任何具体页面路由，devMatch 会落到一条
 *   prerendered 路由（routeData.prerender === true）。Astro 的 createRequest 在
 *   isPrerendered 时会 `url.search = ""`（清空 query）并把 body 置 null，
 *   导致 middleware 拿不到 query 参数与 POST body —— 表现为 source/apply 全部
 *   报“缺少有效的 file / line”“缺少 file / op”，而 health（无参数）正常。
 *
 * 本插件在 Vite dev server 的 connect middleware 层直接处理 /__edit__/*：
 *   1) 位于 Astro 的请求处理（astroDevHandler）之前注册，请求根本不会进入
 *      Astro 的 Request 构造 → 原始 req.url（含 query）与 req body 完整可用；
 *   2) 复用 M1 的 apply-op / locate-block / parse（与 scan-mdx 同款编译管线）；
 *   3) 仅 dev 注册（astro.config.mjs 中 IS_DEV 时挂载），生产构建零污染。
 *
 * 端点与协议：
 *   GET  /__edit__/health
 *   GET  /__edit__/source?file=&line=        读取某行所在块的源码
 *   POST /__edit__/apply  { file, op, payload }  单条操作写盘（含校验）
 *   POST /__edit__/apply-batch { file, ops } 批量草稿保存：内存依次应用全部操作，
 *                                             全部通过校验后一次性写盘（M3）
 *   POST /__edit__/preview-block { file, op, payload }
 *                                             不写盘：返回该块应用操作后的渲染
 *                                             HTML 片段（正文块尽力预览，M3）
 *   GET  /__edit__/cards?file=                列出文件内全部卡片（供"移入卡片"定位）
 *   POST /__edit__/undo   { file }            撤销最近一次写回（单条或 batch）
 *   GET  /__edit__/log                        本会话操作历史
 */

import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeKatex from 'rehype-katex';
import rehypeStringify from 'rehype-stringify';
import * as remarkMdx from 'remark-mdx';
import { visit } from 'unist-util-visit';
import { applyOp } from './apply-op.mjs';
import { locateBlock, CARD_KINDS } from './locate-block.mjs';
import { parseFile, stripFrontmatter, detectEol, linesText, lineOffsets } from './parse.mjs';

const mdxPlugin = remarkMdx.remarkMdx ?? remarkMdx.default ?? remarkMdx;

/** 项目根探测（与旧 middleware 相同：候选 cwd / import.meta.url 上级 / 上上级） */
function resolveProjectRoot() {
  const candidates = [
    process.cwd(),
    fileURLToPath(new URL('../', import.meta.url)),
    fileURLToPath(new URL('../../', import.meta.url)),
  ];
  for (const base of candidates) {
    try {
      const p = path.resolve(base);
      if (fsSync.existsSync(path.join(p, 'package.json')) && fsSync.existsSync(path.join(p, 'astro.config.mjs'))) {
        return p;
      }
    } catch {
      /* 跳过 */
    }
  }
  return process.cwd();
}
const ROOT = resolveProjectRoot();
const CONTENT_ROOT = path.join(ROOT, 'src', 'content', 'docs');

/**
 * 行号空间约定（重要）：
 *   页面注入的 data-src-line 是【全文行号】（Astro 编译 MDX 时 position 保留
 *   frontmatter 偏移，M1 实测：h2 在全文第 14 行 → data-src-line="14"）。
 *   而 locateBlock / applyOp 内部解析时剥离 frontmatter，使用【body 行号】。
 *   因此本插件所有端点收到 line / targetLine 后先换算：bodyLine = line - offset
 *   （offset = frontmatter 占用的换行数，见 parse.mjs）。
 */

/** 会话内撤销栈：file → Array<{ before, after, op, payload, time }> */
const history = new Map();

/** 校验并规范化文件路径（防目录穿越）；返回绝对路径或 null */
function safeResolve(file) {
  if (typeof file !== 'string' || !file) return null;
  const full = path.resolve(ROOT, file);
  if (!full.startsWith(CONTENT_ROOT + path.sep)) return null;
  if (!full.endsWith('.mdx')) return null;
  return full;
}

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : null;
};

const rel = (abs) => path.relative(ROOT, abs).split('\\').join('/');

/* ------------------------------------------------------------------ *
 *  预览与批量保存的辅助函数
 * ------------------------------------------------------------------ */

/**
 * 把单块源码文本编译为 HTML 片段（remark-math + rehype-katex，与站点同款）。
 * 用于"尽力预览"：正文块（段落/标题/列表/公式等，不含 JSX 组件）修改后，
 * 服务端即时编译出真实渲染片段，前端替换 DOM，实现无整页刷新的即时效果。
 * 块源码含 JSX 组件（卡片等）时 remark-rehype 无法处理 → 返回 null，
 * 前端降级为"已修改标记"（保存后统一刷新查看完整效果）。
 * @param {string} text 块源码（LF 归一）
 * @param {Record<string,string>} attrs 注入到产物根元素的属性（data-src-*）
 * @returns {Promise<string|null>}
 */
async function compileBlockHtml(text, attrs) {
  try {
    // 先解析 mdast：若块源码含 JSX 组件（mdxJsxFlowElement/mdxJsxTextElement），
    // remark-rehype 不会抛错而是静默剥离组件外壳，导致预览与真实渲染不一致
    // （卡片外壳丢失等）→ 直接返回 null，前端降级为"已修改标记"。
    const mdast = unified().use(remarkParse).use(mdxPlugin).use(remarkMath).parse(text);
    let hasJsx = false;
    visit(mdast, (node) => {
      if (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') hasJsx = true;
    });
    if (hasJsx) return null;

    const file = await unified()
      .use(remarkParse)
      .use(mdxPlugin)
      .use(remarkMath)
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeKatex, { output: 'html', strict: false, throwOnError: false })
      .use(() => (tree) => {
        const root = tree.children?.[0];
        if (root?.type === 'element') {
          for (const [k, v] of Object.entries(attrs || {})) root.properties[k] = v;
        }
      })
      .use(rehypeStringify)
      .process(text);
    return String(file);
  } catch {
    return null;
  }
}

/** 统计字符串前 end 个字符内的换行数 */
function countNewlines(s, end) {
  let n = 0;
  for (let i = 0; i < end; i++) {
    if (s.charCodeAt(i) === 10) n++;
  }
  return n;
}

/**
 * 在（LF 归一的）body 文本中定位锚点文本，返回 body 行号（1-based）。
 * 多匹配时取与 approxLine 最接近的一次（重复段落场景下最可能是目标）。
 * @returns {number|null} 未找到返回 null
 */
function findAnchorLine(normBody, anchorText, approxLine) {
  if (!anchorText || normBody.indexOf(anchorText) === -1) return null;
  let best = null;
  let bestDist = Infinity;
  let from = 0;
  let idx;
  while ((idx = normBody.indexOf(anchorText, from)) !== -1) {
    const line = countNewlines(normBody, idx) + 1;
    const dist = Math.abs(line - approxLine);
    if (dist < bestDist) {
      bestDist = dist;
      best = line;
    }
    from = idx + anchorText.length;
  }
  return best;
}

/**
 * 批量应用一组编辑操作到 MDX 源码（纯函数，支持服务端与单元测试）
 * @param {string} source
 * @param {Array<{ op: string; payload: Record<string, unknown>; anchorText?: string; targetAnchorText?: string }>} ops
 * @returns {Promise<{ ok: boolean; content?: string; applied?: any[]; message?: string }>}
 */
export async function applyBatchToSource(source, ops) {
  let current = source;
  let shift = 0; // 已应用操作导致的累计行数偏移（全文行号空间）
  const applied = [];

  for (let i = 0; i < ops.length; i++) {
    const item = ops[i] || {};
    const op = item.op;
    const payload = item.payload || {};
    if (typeof op !== 'string') {
      return { ok: false, message: `第 ${i + 1} 个操作缺少 op` };
    }

    const { body: curBody, offset } = stripFrontmatter(current);
    const normBody = curBody.replace(/\r\n/g, '\n');
    const p2 = { ...payload };

    // 处理单行 line
    if (payload.line !== undefined && Number.isFinite(Number(payload.line))) {
      const origLine = Number(payload.line);
      const approxBody = origLine - offset + shift;

      let line = null;
      if (item.anchorText) {
        line = findAnchorLine(normBody, item.anchorText, approxBody);
      }
      if (line == null) {
        // AST 容错重定位：当子块被修改导致父块 anchorText 失配时，按偏移后的行号定位
        const loc = locateBlock(current, approxBody);
        line = loc ? loc.startLine : approxBody;
      }
      p2.line = Math.max(1, line);
    }

    // 处理范围 startLine / endLine
    if (payload.startLine !== undefined && payload.endLine !== undefined) {
      const s = Number(payload.startLine) - offset + shift;
      const e = Number(payload.endLine) - offset + shift;
      p2.startLine = Math.max(1, s);
      p2.endLine = Math.max(1, e);
    }

    // 处理目标 targetLine (move-block / insert-into-card / insert-range-into-card)
    if (payload.targetLine !== undefined && Number.isFinite(Number(payload.targetLine))) {
      const origTarget = Number(payload.targetLine);
      const approxTarget = origTarget - offset + shift;
      let tl = null;
      if (item.targetAnchorText) {
        tl = findAnchorLine(normBody, item.targetAnchorText, approxTarget);
      }
      if (tl == null) {
        const loc = locateBlock(current, approxTarget);
        tl = loc ? loc.startLine : approxTarget;
      }
      p2.targetLine = Math.max(1, tl);
    }

    const result = await applyOp(current, op, p2);
    if (!result.ok) {
      return { ok: false, message: `第 ${i + 1} 个操作（${op}）失败：${result.message}` };
    }

    const beforeLines = current.split(/\r?\n/).length;
    const afterLines = result.content.split(/\r?\n/).length;
    shift += afterLines - beforeLines;
    current = result.content;
    applied.push({ op, payload });
  }

  return { ok: true, content: current, applied };
}

/** 递归收集节点文本（卡片预览用） */
function collectText(node) {
  let out = '';
  for (const c of node.children || []) {
    if (c.type === 'text') out += c.value;
    else if (typeof c.value === 'string' && c.value) out += c.value;
    else out += collectText(c);
  }
  return out.replace(/\s+/g, ' ').trim();
}

function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  res.end(body);
}

/** 读取请求体（connect 的 req 是 async iterable） */
async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

async function handle(req, res) {
  const raw = req.url || '';
  const url = new URL(raw, 'http://localhost');
  if (!url.pathname.startsWith('/__edit__')) return false;

  // ---- 探活 ----
  if (url.pathname === '/__edit__/health') {
    sendJson(res, 200, { ok: true, dev: true });
    return true;
  }

  // ---- 读取块源码 ----
  if (url.pathname === '/__edit__/source' && req.method === 'GET') {
    const file = safeResolve(url.searchParams.get('file'));
    const line = num(url.searchParams.get('line'));
    if (!file || !line) {
      sendJson(res, 400, { ok: false, message: '缺少有效的 file / line' });
      return true;
    }
    const content = await fs.readFile(file, 'utf8');
    const { offset } = parseFile(content);
    const loc = locateBlock(content, line - offset);
    if (!loc) {
      sendJson(res, 404, { ok: false, message: `第 ${line} 行未命中任何块` });
      return true;
    }
    sendJson(res, 200, {
      ok: true,
      file: rel(file),
      kind: loc.kind,
      startLine: loc.startLine,
      endLine: loc.endLine,
      text: loc.text,
      parentCard: loc.parentCard,
    });
    return true;
  }

  // ---- 应用操作 ----
  if (url.pathname === '/__edit__/apply' && req.method === 'POST') {
    let body;
    try {
      body = JSON.parse((await readBody(req)) || '{}');
    } catch {
      sendJson(res, 400, { ok: false, message: '请求体不是有效 JSON' });
      return true;
    }
    const file = safeResolve(body?.file);
    const op = body?.op;
    const payload = body?.payload || {};
    if (!file || !op) {
      sendJson(res, 400, { ok: false, message: '缺少 file / op' });
      return true;
    }

    const before = await fs.readFile(file, 'utf8');
    const { offset } = parseFile(before);
    // 全文行号 → body 行号（data-src-line 是全文空间）
    const toBody = (n) => (typeof n === 'number' && Number.isFinite(n) ? n - offset : n);
    const payload2 = {
      ...payload,
      line: toBody(payload.line),
      ...(payload.targetLine !== undefined ? { targetLine: toBody(payload.targetLine) } : {}),
    };
    const result = await applyOp(before, op, payload2);
    if (!result.ok) {
      sendJson(res, 400, result);
      return true;
    }

    // 写盘（保持原行尾符）
    const eol = detectEol(before);
    const out = result.content.endsWith('\n') ? result.content : result.content + eol;
    await fs.writeFile(file, out, 'utf8');

    // 记录撤销栈
    const stack = history.get(file) || [];
    stack.push({ before, after: out, op, payload, time: Date.now() });
    if (stack.length > 50) stack.shift();
    history.set(file, stack);

    sendJson(res, 200, {
      ok: true,
      message: `已应用操作 ${op}`,
      file: rel(file),
      undoCount: stack.length,
    });
    return true;
  }

  // ---- 批量保存（M3 草稿模式）：内存依次应用全部操作，全部校验通过后一次性写盘 ----
  if (url.pathname === '/__edit__/apply-batch' && req.method === 'POST') {
    let body;
    try {
      body = JSON.parse((await readBody(req)) || '{}');
    } catch {
      sendJson(res, 400, { ok: false, message: '请求体不是有效 JSON' });
      return true;
    }
    const file = safeResolve(body?.file);
    const ops = body?.ops;
    if (!file || !Array.isArray(ops) || !ops.length) {
      sendJson(res, 400, { ok: false, message: '缺少 file 或 ops 列表' });
      return true;
    }

    const before = await fs.readFile(file, 'utf8');
    const result = await applyBatchToSource(before, ops);
    if (!result.ok) {
      sendJson(res, 400, { ok: false, message: result.message });
      return true;
    }

    // 全部成功 → 一次性写盘（保持原行尾符）
    const eol = detectEol(before);
    const out = result.content.endsWith('\n') ? result.content : result.content + eol;
    await fs.writeFile(file, out, 'utf8');
    const stack = history.get(file) || [];
    stack.push({ before, after: out, op: 'batch', payload: { count: result.applied.length }, time: Date.now() });
    if (stack.length > 50) stack.shift();
    history.set(file, stack);

    sendJson(res, 200, {
      ok: true,
      message: `已保存 ${result.applied.length} 处修改`,
      file: rel(file),
      savedCount: result.applied.length,
      undoCount: stack.length,
    });
    return true;
  }

  // ---- 单块预览（M3 尽力预览）：应用操作到内存副本，返回该块渲染后的 HTML ----
  if (url.pathname === '/__edit__/preview-block' && req.method === 'POST') {
    let body;
    try {
      body = JSON.parse((await readBody(req)) || '{}');
    } catch {
      sendJson(res, 400, { ok: false, message: '请求体不是有效 JSON' });
      return true;
    }
    const file = safeResolve(body?.file);
    const op = body?.op;
    const payload = body?.payload || {};
    if (!file || !op) {
      sendJson(res, 400, { ok: false, message: '缺少 file / op' });
      return true;
    }

    const before = await fs.readFile(file, 'utf8');
    const { offset } = parseFile(before);
    const toBody = (n) => (typeof n === 'number' && Number.isFinite(n) ? n - offset : n);
    const payload2 = { ...payload, line: toBody(payload.line) };
    const result = await applyOp(before, op, payload2);
    if (!result.ok) {
      sendJson(res, 400, result);
      return true;
    }

    // 应用后定位该块：replace-block / edit-formula 替换的是块区间，
    // 块起点行号不变（行数变化只影响其后的块），用原行号即可命中。
    const after = result.content;
    const { offset: offset2 } = parseFile(after);
    const loc = locateBlock(after, payload2.line);
    if (!loc) {
      sendJson(res, 404, { ok: false, message: '无法定位修改后的块' });
      return true;
    }
    const html = await compileBlockHtml(loc.text, {
      'data-src-file': rel(file),
      'data-src-line': String(loc.startLine + offset2),
      'data-src-kind': loc.kind,
    });
    sendJson(res, 200, {
      ok: true,
      html, // null = 含组件，无法独立预览 → 前端降级为"已修改标记"
      kind: loc.kind,
      fullLine: loc.startLine + offset2,
      endFullLine: loc.endLine + offset2,
    });
    return true;
  }

  // ---- 卡片列表（供"移入卡片"定位；line 为全文行号，与 data-src-line 一致） ----
  if (url.pathname === '/__edit__/cards' && req.method === 'GET') {
    const file = safeResolve(url.searchParams.get('file'));
    if (!file) {
      sendJson(res, 400, { ok: false, message: '缺少有效的 file' });
      return true;
    }
    const content = await fs.readFile(file, 'utf8');
    const { mdast, body, offset } = parseFile(content);
    const cards = [];
    visit(mdast, 'mdxJsxFlowElement', (node) => {
      const kind = (node.name || '').toLowerCase();
      if (!CARD_KINDS.has(kind)) return;
      if (!node.position?.start?.line) return;
      let title = '';
      for (const a of node.attributes || []) {
        if (a.type === 'mdxJsxAttribute' && a.name === 'title' && typeof a.value === 'string') {
          title = a.value;
          break;
        }
      }
      cards.push({
        line: node.position.start.line + offset,
        kind,
        title,
        preview: collectText(node).slice(0, 60),
        // 卡片完整源码文本（LF 归一），作为"移入卡片"操作的目标锚点
        text: linesText(body, lineOffsets(body), node.position.start.line, node.position.end.line),
      });
    });
    sendJson(res, 200, { ok: true, cards });
    return true;
  }

  // ---- 撤销 ----
  if (url.pathname === '/__edit__/undo' && req.method === 'POST') {
    let body;
    try {
      body = JSON.parse((await readBody(req)) || '{}');
    } catch {
      sendJson(res, 400, { ok: false, message: '请求体不是有效 JSON' });
      return true;
    }
    const file = safeResolve(body?.file);
    if (!file) {
      sendJson(res, 400, { ok: false, message: '缺少 file' });
      return true;
    }
    const stack = history.get(file) || [];
    const entry = stack.pop();
    if (!entry) {
      sendJson(res, 400, { ok: false, message: '该文件没有可撤销的操作' });
      return true;
    }
    await fs.writeFile(file, entry.before, 'utf8');
    sendJson(res, 200, { ok: true, message: '已撤销：' + (entry.op || ''), undoCount: stack.length });
    return true;
  }

  // ---- 操作历史 ----
  if (url.pathname === '/__edit__/log' && req.method === 'GET') {
    const entries = [];
    for (const [file, stack] of history) {
      for (const e of stack) {
        entries.push({ file: rel(file), op: e.op, payload: e.payload, time: e.time });
      }
    }
    entries.sort((a, b) => b.time - a.time);
    sendJson(res, 200, { ok: true, entries: entries.slice(0, 100) });
    return true;
  }

  sendJson(res, 404, { ok: false, message: '未知端点' });
  return true;
}

/**
 * Vite dev server 插件：在 connect middleware 层拦截 /__edit__/*。
 * 注册时机早于 Astro 的请求处理（Astro 的 ssrHandler 在其 configureServer 的
 * 后置钩子中 use，本插件在普通 configureServer 中 use → 排在其前）。
 */
export default function devEditServerPlugin() {
  return {
    name: 'dev-edit-server',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        try {
          const handled = await handle(req, res);
          if (!handled) next();
        } catch (err) {
          sendJson(res, 500, { ok: false, message: String(err?.message || err) });
        }
      });
    },
  };
}
