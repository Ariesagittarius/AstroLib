import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMdx from 'remark-mdx';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeKatex from 'rehype-katex';
import rehypeStringify from 'rehype-stringify';
import katex from 'katex';

function slugify(s = '') {
  return encodeURIComponent(String(s).trim().replace(/\s+/g, '-'));
}
function escAttr(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function card(className, tag, title) {
  const rawT = title ?? '';
  const plainT = plainTitle(rawT);
  const id = plainT ? ` id="${escAttr(slugify(plainT))}"` : '';
  const headerHtml = rawT ? `<div class="card-header">${renderTitleMath(rawT)}</div>` : '';
  return `<div class="${className} toc-chunk" data-title="${escAttr(plainT)}"${id}>${headerHtml}<div class="card-body">`;
}

function qrVideoBlock(id, title, url) {
  const cleanTitle = (title || '').replace(/^二维码\s*\d+(\.\d+)*\s*/, '').replace(/[\.\。\s]+$/, '').trim();
  let category = '数字资源';
  if (/课件|讲义|PPT/i.test(cleanTitle)) category = '教学课件';
  else if (/视频|微课|讲解/i.test(cleanTitle)) category = '微课视频';
  else if (/演示|仿真|动画/i.test(cleanTitle)) category = '动态演示';

  const fullTitle = id ? `${id} ${cleanTitle}`.trim() : cleanTitle || '配套资源';
  const fullTitleHtml = renderTitleMath(fullTitle);
  const linkHtml = url ? ` <a href="${escAttr(url)}" class="academic-resource-link qr-video-link" target="_blank">[查看资源]</a>` : '';
  return `<div class="academic-resource-card qr-video-card"><div class="academic-resource-inner qr-video-inner"><span class="academic-resource-category qr-video-tag">${category}</span><span class="academic-resource-title qr-video-title">${fullTitleHtml}</span>${linkHtml}</div></div>`;
}

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
  DigitalResource: (t, node) => [
    qrVideoBlock(attrValue(node, 'id'), attrValue(node, 'title') || t, attrValue(node, 'url')),
    '',
  ],
};

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

function renderLeftoverMath(html) {

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

  return html.replace(/<a\s+([^>]*)href=["']([^"']*)["']([^>]*)>([\s\S]*?)<\/a>/g, (m, pre, href, post, inner) => {
    const h = href.trim();
    if (h === '' || h.startsWith('#') || /^(https?:|mailto:|tel:)/i.test(h)) return m;
    return `<span class="unlinked">${inner}</span>`;
  });
}

function normalizeVoidTags(html) {
  return html.replace(/<(br|hr|wbr|img|input|source|col|embed|area|base|link|meta)(\s[^>]*)?>/gi, (m, tag, rest) => {
    const r = rest ?? '';
    if (/\/\s*$/.test(r)) return m;
    return `<${tag}${r}/>`;
  });
}

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

export function renderTitleMath(title) {
  return withQuietKatex(() => renderLeftoverMath(title));
}

export function plainTitle(title) {
  return String(title)
    .replace(/\$\$([\s\S]+?)\$\$/g, '$1')
    .replace(/\$([^$\n]+?)\$/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function renderChapter(mdxSource) {

  let title = '';
  let body = mdxSource;
  const fm = body.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (fm) {
    const meta = fm[1];
    const t = meta.match(/title:\s*['"](.*?)['"]/);
    if (t) title = t[1];
    body = body.slice(fm[0].length);
  }

  body = body.replace(/\r\n/g, '\n').replace(/^import\s+[^\n]*$/gm, '');

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

  html = withQuietKatex(() => renderLeftoverMath(html));

  const images = new Set();
  html = rewriteImages(html, images);

  html = unlinkInternal(html);
  html = normalizeVoidTags(html);

  return { title: title || '', body: html, images };
}
