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

    }
  }
  return process.cwd();
}
const ROOT = resolveProjectRoot();
const CONTENT_ROOT = path.join(ROOT, 'src', 'content', 'docs');

const history = new Map();

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

async function compileBlockHtml(text, attrs) {
  try {

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

function countNewlines(s, end) {
  let n = 0;
  for (let i = 0; i < end; i++) {
    if (s.charCodeAt(i) === 10) n++;
  }
  return n;
}

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

export async function applyBatchToSource(source, ops) {
  let current = source;
  let shift = 0;
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

    if (payload.line !== undefined && Number.isFinite(Number(payload.line))) {
      const origLine = Number(payload.line);
      const approxBody = origLine - offset + shift;

      let line = null;
      if (item.anchorText) {
        line = findAnchorLine(normBody, item.anchorText, approxBody);
      }
      if (line == null) {

        const loc = locateBlock(current, approxBody);
        line = loc ? loc.startLine : approxBody;
      }
      p2.line = Math.max(1, line);
    }

    if (payload.startLine !== undefined && payload.endLine !== undefined) {
      const s = Number(payload.startLine) - offset + shift;
      const e = Number(payload.endLine) - offset + shift;
      p2.startLine = Math.max(1, s);
      p2.endLine = Math.max(1, e);
    }

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

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

async function handle(req, res) {
  const raw = req.url || '';
  const url = new URL(raw, 'http://localhost');
  if (!url.pathname.startsWith('/__edit__')) return false;

  if (url.pathname === '/__edit__/health') {
    sendJson(res, 200, { ok: true, dev: true });
    return true;
  }

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

    const eol = detectEol(before);
    const out = result.content.endsWith('\n') ? result.content : result.content + eol;
    await fs.writeFile(file, out, 'utf8');

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
      html,
      kind: loc.kind,
      fullLine: loc.startLine + offset2,
      endFullLine: loc.endLine + offset2,
    });
    return true;
  }

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

        text: linesText(body, lineOffsets(body), node.position.start.line, node.position.end.line),
      });
    });
    sendJson(res, 200, { ok: true, cards });
    return true;
  }

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
