/**
 * rehype-math-promote：构建期智能识别并提升正文漏网数学变量与简式
 *
 * 背景：教材 OCR（如 MinerU）转录时，常将中文夹杂的单字母变量（如“n 阶”、“点 P”、“为 x 自身”）、
 * Unicode 上标等式（如“y = 0.4x²”）及列表短等式（如“(1) L(0)=0;”）遗漏识别为纯文本，
 * 导致其走正文字体（无衬线直立体），与 KaTeX 的 Computer Modern 衬线数学斜体产生强烈字形冲突。
 *
 * 本插件在 rehype-katex 之前执行：
 *   1. 遍历正文中的 text 文本节点，通过严格的中西文边界断言识别出数学变量与等式；
 *   2. 将其拆分提升为 <code class="math-inline"> 节点；
 *   3. 紧随其后的 rehype-katex 会原生将这些节点渲染为标准的 KaTeX 衬线数学公式，
 *      并无缝享有 data-latex 源码回填与公式一键复制功能。
 */

import { visit } from 'unist-util-visit';

const CJK_CHAR = '[\\u4e00-\\u9fa5]';
const CJK_PUNCT_START = '[（(、“‘\\{\\[《,，;；:：]';
const CJK_PUNCT_END = '[）)）、”’\\}\\]》;；:：,，.。！？]';
const QUANTIFIERS = '[阶次个元维点面线轴向域环集群值根解图表式系数导数函数常数变量时刻]';

// 组合正则：
// 1. Unicode 上标等式：y = 0.4x² 或 y=ax³(a>0)
// 2. 函数等式：L(0) = 0
// 3. 常见下标变量：如 点 rp -> r_p（仅限 r/R/x/y/p/q 后接单个字符）
// 4. 中文语境单字母数学变量：如 n 阶、点 P、为 x 自身
const COMBINED_MATH_RE = new RegExp(
  '(' +
    // Group 1: 上标等式或多项式
    '([a-zA-Z]\\s*=\\s*[0-9a-zA-Z\\.\\s\\+\\-\\*/\\(\\)]*[²³⁴⁵⁶⁷⁸⁹⁰]+(?:\\([a-zA-Z0-9><=\\s]+\\))?)' +
    '|' +
    // Group 2: 函数短等式
    '(?<=^|[\\s(（,，;；])([a-zA-Z]\\([0-9a-zA-Z\\s,]*\\)\\s*=\\s*[0-9a-zA-Z\\s]+)(?=[\\s;；)）\\.,。，]|$)' +
    '|' +
    // Group 3: 常见下标变量（如 rp 为点）
    '(?<=点|设|为|及|对|与|在|\\s)([rRxyzpPqQ])([pq0-9])(?=\\s|[，。的为是])' +
    '|' +
    // Group 4: 单字母数学变量
    `(?<=^|${CJK_CHAR}\\s*|${CJK_PUNCT_START}\\s*)([a-zA-Z])(?=\\s*${CJK_CHAR}|\\s*${CJK_PUNCT_END}|\\s*${QUANTIFIERS}|$)` +
  ')',
  'gu'
);

// 绝不遍历内部的标签列表
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

/**
 * 将包含数学片段的普通文本拆分为 HAST 节点列表
 * @param {string} rawText 原始文本
 * @returns {Array<import('hast').ElementContent>}
 */
function splitTextToHast(rawText) {
  const parts = [];
  let lastIndex = 0;

  for (const match of rawText.matchAll(COMBINED_MATH_RE)) {
    const matchIndex = match.index;
    const matchText = match[0];

    // 检查防误伤条件：纯英文词汇环境（如 "a book"）
    const beforeText = rawText.slice(Math.max(0, matchIndex - 8), matchIndex);
    const afterText = rawText.slice(matchIndex + matchText.length, matchIndex + matchText.length + 8);
    if (/[a-zA-Z]{2,}\s+$/.test(beforeText) && /^\s+[a-zA-Z]{2,}/.test(afterText)) {
      continue;
    }
    // 排除题型选项开头的 A. B. C. D.
    if ((matchText === 'A' || matchText === 'B' || matchText === 'C' || matchText === 'D') && /^\s*[.．、]/.test(afterText)) {
      if (matchIndex < 3 || /[\n\r]\s*$/.test(beforeText)) {
        continue;
      }
    }

    // 压入前面的普通文本
    if (matchIndex > lastIndex) {
      parts.push({ type: 'text', value: rawText.slice(lastIndex, matchIndex) });
    }

    let mathValue = matchText;
    // 上标转换
    if (/[²³⁴⁵⁶⁷⁸⁹⁰]/.test(mathValue)) {
      mathValue = mathValue.replace(/²/g, '^2').replace(/³/g, '^3').replace(/⁴/g, '^4');
    } else if (/^[rRxyzpPqQ][pq0-9]$/.test(mathValue)) {
      mathValue = `${mathValue[0]}_{${mathValue[1]}}`;
    }

    // 构造 <code class="math-inline"> 节点供 rehype-katex 编译
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
