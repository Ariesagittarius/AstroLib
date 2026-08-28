// scripts/epub/mdx-pipeline.mjs
// 将单篇 MDX 章节渲染为 EPUB 可用的 XHTML 正文片段：
//  - 解析 frontmatter（标题）
//  - remark-mdx 解析自定义组件标签，转换为带卡片样式的 HTML 包装
//  - remark-math + rehype-katex 渲染公式（与站点一致的 KaTeX HTML 输出）
//  - 兜底渲染 raw HTML（如 <table>）内残留的 $...$ / $$...$$ 公式
//  - 图片路径重写（images/x.jpg -> ../images/x.jpg）并收集引用
//  - 内部链接去链化
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMdx from 'remark-mdx';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeKatex from 'rehype-katex';
import rehypeStringify from 'rehype-stringify';
import katex from 'katex';

// ---------------------------------------------------------------- 组件映射
function slugify(s = '') {
  return encodeURIComponent(String(s).trim().replace(/\s+/g, '-'));
}
function escAttr(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

// 卡片式组件：学术规范卡片
function card(className, tag, title) {
  const rawT = title ?? '';
  const plainT = plainTitle(rawT);
  const id = plainT ? ` id="${escAttr(slugify(plainT))}"` : '';
  const headerHtml = rawT ? `<div class="card-header">${renderTitleMath(rawT)}</div>` : '';
  return `<div class="${className} toc-chunk" data-title="${escAttr(plainT)}"${id}>${headerHtml}<div class="card-body">`;
}

function qrVideoBlock(id, title, url) {
  const cleanTitle = (title || '').replace(/^二维码\s*\d+(\.\d+)*\s*/, '').replace(/[\.\。\s]+$/, '').trim();
  const fullTitle = id ? `${id} ${cleanTitle}`.trim() : cleanTitle || '微课讲解';
  const fullTitleHtml = renderTitleMath(fullTitle);
  const linkHtml = url ? ` <a href="${escAttr(url)}" class="qr-video-link" target="_blank">[查看视频]</a>` : '';
  return `<div class="qr-video-card"><div class="qr-video-inner"><span class="qr-video-tag">微课</span><span class="qr-video-title">${fullTitleHtml}</span>${linkHtml}</div></div>`;
}

// 组件名 -> [open, close]
const COMPONENT_MAP = {
  Guide: () => [
    `<div class="guide-block toc-chunk" data-title="章节导读" id="section-guide"><div class="guide-header">章节导读</div><div class="guide-content">`,
    `</div></div>`,
  ],
  Knowledge: (t) => [card('knowledge-card', '知识', t), `</div></div>`],
  Example: (t) => [card('example-card', '例题', t), `</div></div>`],
  Analysis: () => [
    `<div class="analysis-block"><div class="analysis-header">思路分析</div><div class="analysis-content">`,
    `</div></div>`,
  ],
  // Solution 原为 <details>（点击展开），EPUB 阅读器对 details 支持不一，
  // 直接输出展开的板块，保证解析步骤始终可见。
  Solution: (t) => {
    const titleText = t || '解析与步骤';
    const headerHtml = `<div class="solution-header">${renderTitleMath(titleText)}</div>`;
    return [
      `<div class="solution-block">${headerHtml}<div class="solution-content">`,
      `</div></div>`,
    ];
  },
  Variant: (t) => [card('variant-card', '变式', t), `</div></div>`],
  Note: () => [
    `<div class="note-block"><div class="note-header">注记说明</div><div class="note-content">`,
    `</div></div>`,
  ],
  Block: (t) => {
    const plainT = plainTitle(t || '');
    const id = plainT ? ` id="${escAttr(slugify(plainT))}"` : '';
    const headerHtml = t ? `<div class="fallback-header">${renderTitleMath(t)}</div>` : '';
    return [
      `<div class="fallback-block toc-chunk" data-title="${escAttr(plainT)}"${id}>${headerHtml}<div class="fallback-content">`,
      `</div></div>`,
    ];
  },
  Method: (t) => [card('method-card', '方法', t), `</div></div>`],
  Exercise: (t) => [card('exercise-card', '习题', t), `</div></div>`],
  Summary: (t) => [card('summary-card', '总结', t), `</div></div>`],
  Section: (t) => {
    const plainT = plainTitle(t || '');
    const id = plainT ? ` id="${escAttr(slugify(plainT))}"` : '';
    const headerHtml = t ? `<div class="fallback-header">${renderTitleMath(t)}</div>` : '';
    return [
      `<div class="fallback-block toc-chunk" data-title="${escAttr(plainT)}"${id}>${headerHtml}<div class="fallback-content">`,
      `</div></div>`,
    ];
  },
  QRCodeVideo: (t, node) => [
    qrVideoBlock(attrValue(node, 'id'), attrValue(node, 'title') || t, attrValue(node, 'url')),
    '',
  ],
};

// 需要原样透传的原始 HTML 标签（保留表格等结构，内部 $...$ 由兜底 pass 渲染）
const PASSTHROUGH_TAGS = new Set([
  'table', 'tr', 'td', 'th', 'thead', 'tbody', 'tfoot', 'caption', 'colgroup', 'col',
  'a', 'b', 'p', 'img', 'br', 'hr', 'sub', 'sup', 'strong', 'em', 'span', 'div',
  'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre', 'code',
  'figure', 'figcaption', 'details', 'summary', 'center', 'font', 'u', 'i', 's',
  'small', 'big', 'tt', 'ins', 'del', 'abbr', 'kbd', 'samp', 'var', 'q', 'cite',
  'dl', 'dt', 'dd', 'nav', 'header', 'footer', 'section', 'article', 'aside', 'main',
  'mark', 'time', 'wbr', 'input', 'label', 'select', 'option', 'button', 'textarea',
  'form', 'iframe', 'video', 'audio', 'source', 'picture', 'object', 'embed',
]);
const VOID_TAGS = new Set(['img', 'br', 'hr', 'input', 'wbr', 'source', 'embed', 'col', 'area', 'base', 'link', 'meta']);

function attrValue(node, name) {
  const attrs = node.attributes || [];
  for (const a of attrs) {
    if (a.type !== 'mdxJsxAttribute' || a.name !== name) continue;
    const v = a.value;
    if (v == null) return '';
    if (typeof v === 'string') return v;
    if (v.type === 'mdxJsxAttributeValueExpression') return String(v.value ?? '').replace(/^['"]|['"]$/g, '');
    return String(v);
  }
  return undefined;
}

// 将透传元素重新序列化为 HTML 字符串（子节点中的数学节点还原为 $...$，稍后兜底渲染）
function serializeHtmlNode(node) {
  if (!node) return '';
  switch (node.type) {
    case 'text':
      return node.value;
    case 'inlineMath':
      return `$${node.value}$`;
    case 'math':
      return `$$\n${node.value}\n$$`;
    case 'mdxJsxFlowElement':
    case 'mdxJsxTextElement': {
      const name = node.name;
      const attrs = (node.attributes || [])
        .filter((a) => a.type === 'mdxJsxAttribute')
        .map((a) => {
          const v = a.value;
          if (v == null) return a.name;
          let vs = typeof v === 'string' ? v : String(v.value ?? '');
          return `${a.name}="${escAttr(vs)}"`;
        })
        .join(' ');
      const inner = (node.children || []).map(serializeHtmlNode).join('');
      if (VOID_TAGS.has(name)) return `<${name}${attrs ? ' ' + attrs : ''}/>`;
      return `<${name}${attrs ? ' ' + attrs : ''}>${inner}</${name}>`;
    }
    case 'html':
      return node.value;
    default:
      if (node.children) return (node.children || []).map(serializeHtmlNode).join('');
      return '';
  }
}

// mdast 转换：mdxJsx 元素 -> 组件包装 / 透传 HTML
function transformChildren(nodes) {
  const out = [];
  for (const node of nodes) {
    if (node && (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement')) {
      const name = node.name;
      if (COMPONENT_MAP[name]) {
        const [open, close] = COMPONENT_MAP[name](attrValue(node, 'title'), node);
        out.push({ type: 'html', value: open }, ...transformChildren(node.children || []), { type: 'html', value: close });
      } else if (PASSTHROUGH_TAGS.has(name)) {
        out.push({ type: 'html', value: serializeHtmlNode(node) });
      } else {
        // 未知组件：降级为普通 div 包装，保留内容
        out.push(
          { type: 'html', value: `<div class="unknown-block">` },
          ...transformChildren(node.children || []),
          { type: 'html', value: '</div>' }
        );
      }
    } else if (node && node.children) {
      node.children = transformChildren(node.children);
      out.push(node);
    } else {
      out.push(node);
    }
  }
  return out;
}

function remarkComponentTransform() {
  return (tree) => {
    tree.children = transformChildren(tree.children);
  };
}

function cleanMathEntities(tex) {
  if (!tex) return '';
  return tex
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&')
    .replace(/&ge;/g, '\\ge ')
    .replace(/&le;/g, '\\le ')
    .replace(/&ne;/g, '\\neq ')
    .replace(/&plusmn;/g, '\\pm ')
    .replace(/&times;/g, '\\times ')
    .replace(/&infin;/g, '\\infty ')
    .replace(/&approx;/g, '\\approx ')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\\right\s*:/g, '\\right.')
    .replace(/\\tag\s*\{[^}]*\}\s*(\\tag\s*\{[^}]*\})/g, '$1');
}

// ---------------------------------------------------------------- 兜底公式渲染
function renderLeftoverMath(html) {
  // 按 HTML 标签拆分，确保绝不在 <...tag attributes...> 内部替换公式
  const tokens = String(html).split(/(<[^>]+>)/g);
  let inCode = false;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.startsWith('<')) {
      if (/^<code\b/i.test(token) || /^<pre\b/i.test(token) || /^<script\b/i.test(token) || /^<style\b/i.test(token)) {
        inCode = true;
      } else if (/^<\/(code|pre|script|style)>/i.test(token)) {
        inCode = false;
      }
      continue;
    }

    if (inCode || !token.includes('$')) continue;

    // 显示公式 $$...$$
    let text = token.replace(/\$\$([\s\S]+?)\$\$/g, (m, tex) => {
      if (!tex.trim()) return m;
      const cleanTex = cleanMathEntities(tex.trim());
      try {
        return katex.renderToString(cleanTex, {
          displayMode: true, output: 'html', throwOnError: false, strict: false,
        });
      } catch {
        return m;
      }
    });

    // 行内公式 $...$
    text = text.replace(/(^|[^$\\])\$([^$\n]+?)\$(?![0-9])/g, (m, pre, tex) => {
      if (!tex.trim() || /^\s|\s$/.test(tex)) return m;
      const cleanTex = cleanMathEntities(tex);
      try {
        return pre + katex.renderToString(cleanTex, {
          displayMode: false, output: 'html', throwOnError: false, strict: false,
        });
      } catch {
        return m;
      }
    });

    tokens[i] = text;
  }

  return tokens.join('');
}

// ---------------------------------------------------------------- 图片与链接处理
function rewriteImages(html, imageNames) {
  return html.replace(/(src\s*=\s*["'])([^"']*)(["'])/g, (m, pre, src, post) => {
    const s = src.trim();
    let name = null;
    if (s.startsWith('images/')) name = s.slice('images/'.length);
    else if (s.startsWith('./images/')) name = s.slice('./images/'.length);
    else return m;
    imageNames.add(name);
    return `${pre}../images/${name}${post}`;
  });
}

function unlinkInternal(html) {
  // 保留站内锚点(#)、外部链接(http/https/mailto)与空链接；其余内部页面链接去链化
  return html.replace(/<a\s+([^>]*)href=["']([^"']*)["']([^>]*)>([\s\S]*?)<\/a>/g, (m, pre, href, post, inner) => {
    const h = href.trim();
    if (h === '' || h.startsWith('#') || /^(https?:|mailto:|tel:)/i.test(h)) return m;
    return `<span class="unlinked">${inner}</span>`;
  });
}

// 空元素补全为 XHTML 自闭合形式（部分 raw HTML 进入输出时的容错）
function normalizeVoidTags(html) {
  return html.replace(/<(br|hr|wbr|img|input|source|col|embed|area|base|link|meta)(\s[^>]*)?>/gi, (m, tag, rest) => {
    const r = rest ?? '';
    if (/\/\s*$/.test(r)) return m; // 已是自闭合形式
    return `<${tag}${r}/>`;
  });
}

// ---------------------------------------------------------------- 主入口
// 静默 KaTeX 的 "No character metrics" 提示（OCR 文本中偶见的 ①、Ⅰ 等字符，
// 在 EPUB 阅读器中会回退到系统字体正常显示，无需告警刷屏）
function withQuietKatex(fn) {
  const original = console.warn;
  console.warn = (...args) => {
    if (typeof args[0] === 'string' && args[0].includes('No character metrics')) return;
    original(...args);
  };
  try {
    return fn();
  } finally {
    console.warn = original;
  }
}

/**
 * 渲染标题中的行内公式（$...$ -> KaTeX HTML）
 * @param {string} title
 * @returns {string}
 */
export function renderTitleMath(title) {
  return withQuietKatex(() => renderLeftoverMath(title));
}

/**
 * 把标题中的公式标记去掉，保留纯文本（用于目录 / 元数据）
 * @param {string} title
 * @returns {string}
 */
export function plainTitle(title) {
  return String(title)
    .replace(/\$\$([\s\S]+?)\$\$/g, '$1')
    .replace(/\$([^$\n]+?)\$/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * 渲染一篇 MDX 章节
 * @param {string} mdxSource
 * @returns {{ title: string, body: string, images: Set<string> }}
 */
export async function renderChapter(mdxSource) {
  // 1. frontmatter
  let title = '';
  let body = mdxSource;
  const fm = body.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (fm) {
    const meta = fm[1];
    const t = meta.match(/title:\s*['"](.*?)['"]/);
    if (t) title = t[1];
    body = body.slice(fm[0].length);
  }
  // 2. 统一换行符（CRLF -> LF），去除 import 语句
  //    注意：不能删除空行！在 CRLF 内容上删除空行会破坏 remark-mdx 对
  //    {{...}} 表达式/公式的解析（acorn 报错）。
  body = body.replace(/\r\n/g, '\n').replace(/^import\s+[^\n]*$/gm, '');

  // 3. 统一管线
  const file = await withQuietKatex(() =>
    unified()
      .use(remarkParse)
      .use(remarkMdx)
      .use(remarkMath)
      .use(remarkComponentTransform)
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeKatex, { output: 'html', strict: false, throwOnError: false })
      .use(rehypeStringify, { allowDangerousHtml: true })
      .process(body)
  );

  let html = String(file);

  // 4. 兜底：raw HTML 内的残留公式
  html = withQuietKatex(() => renderLeftoverMath(html));

  // 5. 图片路径重写
  const images = new Set();
  html = rewriteImages(html, images);

  // 6. 内部链接去链化 + 空元素规范化
  html = unlinkInternal(html);
  html = normalizeVoidTags(html);

  return { title: title || '', body: html, images };
}
