import katex from 'katex';

function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const MATH_SPLIT_RE = /(\$\$[^$]+\$\$|\$[^$]+\$)/g;

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
