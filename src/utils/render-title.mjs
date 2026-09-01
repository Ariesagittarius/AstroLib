/**
 * render-title：构建期渲染卡片标题中的数学公式（性能优化）
 *
 * 背景：此前卡片组件把原始标题（可能含 $...$）作为纯文本输出，再由客户端在每次
 * SPA 切换后对每个带 $ 的卡片标题逐个 renderMathInElement（auto-render）二次渲染，
 * 属于“公式扫描”这一切换开销的一部分。
 *
 * 本工具把同一套“拆 $...$ → KaTeX”逻辑下沉到构建期：
 *   - 普通文本按 HTML 转义后原样输出；
 *   - $...$ / $$...$$ 段用 katex.renderToString 渲染（与客户端 auto-render 相同的
 *     分隔符规则与 throwOnError:false 行为，视觉一致）；
 *   - 组件用 set:html 注入结果，客户端不再扫描标题公式。
 *
 * 重要：组件的 data-title 属性与锚点 id 仍使用“原始标题”（含 $），因此
 * TOC 提取、跨页索引、引用解析等下游逻辑完全不受影响。
 */
import katex from 'katex';

/** HTML 转义（set:html 注入前的安全处理，保证标题中的 < > & 原样显示） */
function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 分隔符拆分：$$...$$（display）优先，其次 $...$（inline） */
const MATH_SPLIT_RE = /(\$\$[^$]+\$\$|\$[^$]+\$)/g;

/** 清理并修复 LaTeX 字符串中的控制字符与转义序列 */
function sanitizeMathLatex(val) {
  if (typeof val !== 'string') return '';
  let str = val;
  str = str.replace(/\x0c/g, '\\f');
  str = str.replace(/\x08/g, '\\b');
  str = str.replace(/\x0b/g, '\\v');
  str = str.replace(/\r(?!\n)/g, '\\r');
  str = str.replace(/\t([a-zA-Z])/g, '\\t$1');
  str = str.replace(/(\$\$[\s\S]+?\$\$|\$[^\$\n]+?\$)/g, (m) => m.replace(/\t/g, ' '));
  str = str.replace(/(\$\$[\s\S]+?\$\$|\$[^\$\n]+?\$)/g, (m) =>
    m.replace(/\n(u|eq|ne|not|nabla|notin|nrightarrow|natural|nearrow|nwarrow|neg|normalsize)\b/g, '\\n$1')
  );
  str = str.replace(/\\iiiint_{\\Omega}/g, '\\iiint_{\\Omega}');
  str = str.replace(/\\overparen\{([^}]+)\}/g, '\\stackrel{\\frown}{$1}');
  str = str.replace(/\\wideparen\{([^}]+)\}/g, '\\stackrel{\\frown}{$1}');
  return str;
}

const KATEX_OPTIONS = {
  output: 'htmlAndMathml',
  throwOnError: false,
  strict: false,
  macros: {
    '\\overparen': '\\stackrel{\\frown}{#1}',
    '\\wideparen': '\\stackrel{\\frown}{#1}',
    '\\iiiint': '\\int\\!\\!\\int\\!\\!\\int\\!\\!\\int',
  },
};

/**
 * 把可能含数学公式的标题渲染为安全 HTML。
 * @param {string|undefined} title 原始标题（保留 $...$）
 * @returns {string} 可直接 set:html 的 HTML
 */
export function renderTitleHtml(title) {
  const text = sanitizeMathLatex(String(title ?? ''));
  if (!text.includes('$')) return escapeHtml(text);

  return text
    .split(MATH_SPLIT_RE)
    .map((part) => {
      if (!part) return '';
      if (part.startsWith('$$') && part.endsWith('$$') && part.length > 4) {
        try {
          return katex.renderToString(part.slice(2, -2), { ...KATEX_OPTIONS, displayMode: true });
        } catch {
          return escapeHtml(part);
        }
      }
      if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
        try {
          return katex.renderToString(part.slice(1, -1), KATEX_OPTIONS);
        } catch {
          return escapeHtml(part);
        }
      }
      return escapeHtml(part);
    })
    .join('');
}
