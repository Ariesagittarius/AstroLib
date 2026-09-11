import { visit } from 'unist-util-visit';

const CJK_CHAR = '[\\u4e00-\\u9fa5]';
const CJK_PUNCT_START = '[（(、“‘\\{\\[《,，;；:：]';
const CJK_PUNCT_END = '[）)）、”’\\}\\]》;；:：,，.。！？]';
const QUANTIFIERS = '[阶次个元维点面线轴向域环集群值根解图表式系数导数函数常数变量时刻]';

const COMBINED_MATH_RE = new RegExp(
  '(' +

    '([a-zA-Z]\\s*=\\s*[0-9a-zA-Z\\.\\s\\+\\-\\*/\\(\\)]*[²³⁴⁵⁶⁷⁸⁹⁰]+(?:\\([a-zA-Z0-9><=\\s]+\\))?)' +
    '|' +

    '(?<=^|[\\s(（,，;；])([a-zA-Z]\\([0-9a-zA-Z\\s,]*\\)\\s*=\\s*[0-9a-zA-Z\\s]+)(?=[\\s;；)）\\.,。，]|$)' +
    '|' +

    '(?<=点|设|为|及|对|与|在|\\s)([rRxyzpPqQ])([pq0-9])(?=\\s|[，。的为是])' +
    '|' +

    `(?<=^|${CJK_CHAR}\\s*|${CJK_PUNCT_START}\\s*)([a-zA-Z])(?=\\s*${CJK_CHAR}|\\s*${CJK_PUNCT_END}|\\s*${QUANTIFIERS}|$)` +
  ')',
  'gu'
);

const IGNORED_TAGS = new Set([
  'pre', 'code', 'kbd', 'samp', 'var',
  'script', 'style', 'textarea',
  'a', 'button', 'input', 'select',
  'svg', 'canvas', 'figure'
]);

function shouldSkipElement(element) {
  if (IGNORED_TAGS.has(element.tagName)) return true;
  const classes = Array.isArray(element.properties?.className)
    ? element.properties.className
    : [];
  return (
    classes.includes('katex') ||
    classes.includes('katex-display') ||
    classes.includes('math-inline') ||
    classes.includes('math-display') ||
    classes.includes('language-math') ||
    classes.includes('expressive-code') ||
    classes.includes('astro-code')
  );
}

function splitTextToHast(rawText) {
  const parts = [];
  let lastIndex = 0;

  for (const match of rawText.matchAll(COMBINED_MATH_RE)) {
    const matchIndex = match.index;
    const matchText = match[0];

    const beforeText = rawText.slice(Math.max(0, matchIndex - 8), matchIndex);
    const afterText = rawText.slice(matchIndex + matchText.length, matchIndex + matchText.length + 8);
    if (/[a-zA-Z]{2,}\s+$/.test(beforeText) && /^\s+[a-zA-Z]{2,}/.test(afterText)) {
      continue;
    }

    if ((matchText === 'A' || matchText === 'B' || matchText === 'C' || matchText === 'D') && /^\s*[.．、]/.test(afterText)) {
      if (matchIndex < 3 || /[\n\r]\s*$/.test(beforeText)) {
        continue;
      }
    }

    if (matchIndex > lastIndex) {
      parts.push({ type: 'text', value: rawText.slice(lastIndex, matchIndex) });
    }

    let mathValue = matchText;

    if (/[²³⁴⁵⁶⁷⁸⁹⁰]/.test(mathValue)) {
      mathValue = mathValue.replace(/²/g, '^2').replace(/³/g, '^3').replace(/⁴/g, '^4');
    } else if (/^[rRxyzpPqQ][pq0-9]$/.test(mathValue)) {
      mathValue = `${mathValue[0]}_{${mathValue[1]}}`;
    }

    parts.push({
      type: 'element',
      tagName: 'code',
      properties: { className: ['math-inline'] },
      children: [{ type: 'text', value: mathValue.trim() }]
    });

    lastIndex = matchIndex + matchText.length;
  }

  if (lastIndex < rawText.length) {
    parts.push({ type: 'text', value: rawText.slice(lastIndex) });
  }

  return parts;
}

export default function rehypeMathPromote() {
  return (tree) => {
    visit(tree, 'element', (node) => {
      if (shouldSkipElement(node)) {
        return;
      }

      if (!Array.isArray(node.children) || node.children.length === 0) {
        return;
      }

      const newChildren = [];
      let hasChanged = false;

      for (const child of node.children) {
        if (child.type === 'text' && child.value && /[a-zA-Z]/.test(child.value)) {
          const parts = splitTextToHast(child.value);
          if (parts.length > 1 || (parts.length === 1 && parts[0].type === 'element')) {
            newChildren.push(...parts);
            hasChanged = true;
            continue;
          }
        }
        newChildren.push(child);
      }

      if (hasChanged) {
        node.children = newChildren;
      }
    });
  };
}
