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

/**
 * 把可能含数学公式的标题渲染为安全 HTML。
 * @param {string|undefined} title 原始标题（保留 $...$）
 * @returns {string} 可直接 set:html 的 HTML
 */
export function renderTitleHtml(title) {
  const text = String(title ?? '');
  if (!text.includes('$')) return escapeHtml(text);

  // 与客户端 auto-render 默认一致的输出（htmlAndMathml）与容错选项
  const katexOptions = { output: 'htmlAndMathml', throwOnError: false, strict: false };
  return text
    .split(MATH_SPLIT_RE)
    .map((part) => {
      if (!part) return '';
      if (part.startsWith('$$') && part.endsWith('$$') && part.length > 4) {
        try {
          return katex.renderToString(part.slice(2, -2), { ...katexOptions, displayMode: true });
        } catch {
          return escapeHtml(part);
        }
      }
      if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
        try {
          return katex.renderToString(part.slice(1, -1), katexOptions);
        } catch {
          return escapeHtml(part);
        }
      }
      return escapeHtml(part);
    })
    .join('');
}
