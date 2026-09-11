import { visitParents } from 'unist-util-visit-parents';

const CJK_CHAR = '[\\u4e00-\\u9fa5\\u3400-\\u4dbf]';

const IGNORED_TAGS = new Set([
  'pre', 'code', 'kbd', 'samp', 'var',
  'script', 'style', 'textarea',
  'a', 'button', 'input', 'select',
  'svg', 'canvas', 'figure'
]);

function isProtectedElement(element) {
  if (!element || element.type !== 'element') return false;
  if (IGNORED_TAGS.has(element.tagName)) return true;
  const cls = element.properties?.className;
  const classList = Array.isArray(cls) ? cls : typeof cls === 'string' ? cls.split(/\s+/) : [];
  return classList.some((c) =>
    c === 'katex' ||
    c === 'katex-display' ||
    c === 'katex-html' ||
    c === 'math-inline' ||
    c === 'math-display' ||
    c === 'language-math' ||
    c === 'astro-code' ||
    c === 'expressive-code' ||
    c === 'fig-ref-badge' ||
    c === 'block-ref-badge' ||
    c.startsWith('katex')
  );
}

export function normalizeCjkPunctuation(text, options = {}) {
  const {
    comma = '，',
    fullStop = '．',
  } = options;

  let s = text;

  const ellipsisTokens = [];
  s = s.replace(/\.{3,}|…+/g, (match) => {
    const token = `__ELLIPSIS_${ellipsisTokens.length}__`;
    ellipsisTokens.push({ token, val: match });
    return token;
  });

  const H_SPACE = '[ \\t]';

  const reComma1 = new RegExp(`(${CJK_CHAR})${H_SPACE}*,${H_SPACE}*(?=${CJK_CHAR}|\\$|[“‘（\\[【\\(]|${H_SPACE}|\\r?\\n|$)`, 'gu');
  s = s.replace(reComma1, `$1${comma}`);

  const reComma2 = new RegExp(`^${H_SPACE}*,${H_SPACE}*(?=${CJK_CHAR})`, 'u');
  s = s.replace(reComma2, `${comma}`);

  const reComma3 = new RegExp(`(${CJK_CHAR})${H_SPACE}*,${H_SPACE}*(?=[a-zA-Z])`, 'gu');
  s = s.replace(reComma3, `$1${comma} `);

  const reStop1 = new RegExp(`(${CJK_CHAR})${H_SPACE}*\\.${H_SPACE}*(?=${CJK_CHAR}|\\$|[“‘（\\[【\\(]|${H_SPACE}|\\r?\\n|$)`, 'gu');
  s = s.replace(reStop1, `$1${fullStop}`);

  const reStop2 = new RegExp(`^${H_SPACE}*\\.${H_SPACE}*(?=${CJK_CHAR})`, 'u');
  s = s.replace(reStop2, `${fullStop}`);

  const reStop3 = new RegExp(`(${CJK_CHAR})${H_SPACE}*\\.${H_SPACE}*(?=[a-zA-Z])`, 'gu');
  s = s.replace(reStop3, `$1${fullStop} `);

  for (const { token, val } of ellipsisTokens) {
    s = s.replace(token, val);
  }

  return s;
}

export function rehypeCjkPunctuation(options = {}) {
  return (tree) => {
    visitParents(tree, 'text', (node, ancestors) => {
      if (typeof node.value !== 'string') return;
      if (!node.value.includes(',') && !node.value.includes('.')) return;

      const isProtected = ancestors.some((ancestor) => isProtectedElement(ancestor));
      if (isProtected) return;

      node.value = normalizeCjkPunctuation(node.value, options);
    });
  };
}

export default rehypeCjkPunctuation;
