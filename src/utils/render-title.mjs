import katex from 'katex';

function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const MATH_SPLIT_RE = /(\$\$[^$]+\$\$|\$[^$]+\$)/g;

export function renderTitleHtml(title) {
  const text = String(title ?? '');
  if (!text.includes('$')) return escapeHtml(text);

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
