/**
 * rehype-cjk-punctuation：构建期学术出版级标点规范化与呼吸间距自愈插件
 *
 * 背景：
 * MinerU OCR 从数学教材 PDF 识别文本时，常将中文语境下的逗号与句号转录为 ASCII 半角 ',' 和 '.'，
 * 且往往紧挨汉字，没有西文规范要求的后置空格。在现代西文字体中，半角标点极窄且无字面边距，
 * 导致中文断句模糊、挤压粘连，完全丧失了学术专著的句间呼吸感。
 *
 * 铁律（零误伤原则）：
 * 1. 绝对不触碰任何数学公式（.katex / .katex-display 等）、代码块（pre / code）、超链接（a）及徽章内部；
 * 2. 使用 visitParents 检查全量祖先链，祖先含有受保护容器时立即退出；
 * 3. 标点转换必须与中文字符强绑定，公式后跟的标点只有明确后接汉字时才允许映射；
 * 4. 严格排除纯数字间的小数点（3.14）、版本号、章节编号（4.1）、省略号（...）及西文词组。
 */

import { visitParents } from 'unist-util-visit-parents';

const CJK_CHAR = '[\\u4e00-\\u9fa5\\u3400-\\u4dbf]';

// 绝对不遍历的标签
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

/**
 * 处理纯正文文本中的中文标点规范化
 * @param {string} text 原始文本
 * @param {Object} options 配置项
 * @returns {string} 处理后的文本
 */
export function normalizeCjkPunctuation(text, options = {}) {
  const {
    comma = '，',          // 默认转为全角逗号
    fullStop = '．',       // 默认转为数理专著标准实心圆点 '．'（亦可设为 '。'）
  } = options;

  let s = text;

  // 1. 保护多点省略号（... 或 ……）
  const ellipsisTokens = [];
  s = s.replace(/\.{3,}|…+/g, (match) => {
    const token = `__ELLIPSIS_${ellipsisTokens.length}__`;
    ellipsisTokens.push({ token, val: match });
    return token;
  });

  const H_SPACE = '[ \\t]';

  // 2. 治理中文语境下的半角逗号 ','
  // 2a. 汉字之后的半角逗号（可选后跟水平空格）接汉字/公式/引号/括号/行尾等
  // 例如: "本节中,我们" -> "本节中，我们"
  // 例如: "推广到多元函数,然后" -> "推广到多元函数，然后"
  const reComma1 = new RegExp(`(${CJK_CHAR})${H_SPACE}*,${H_SPACE}*(?=${CJK_CHAR}|\\$|[“‘（\\[【\\(]|${H_SPACE}|\\r?\\n|$)`, 'gu');
  s = s.replace(reComma1, `$1${comma}`);

  // 2b. 文本节点开头的逗号（紧跟在行内数学公式之后）接汉字
  // 例如: "$f(x)$ , 它是用" -> 节点文本为 " , 它是用" -> 转换为 "，它是用"
  // 关键：必须后接中文汉字 CJK_CHAR！绝不匹配孤立逗号或后接英文/数字的逗号！
  const reComma2 = new RegExp(`^${H_SPACE}*,${H_SPACE}*(?=${CJK_CHAR})`, 'u');
  s = s.replace(reComma2, `${comma}`);

  // 2c. 汉字后跟半角逗号，接拉丁字母/变量
  // 例如: "回顾一元函数的 Taylor 公式, 它是用" 中的 "公式, 它是用" -> 规范化
  const reComma3 = new RegExp(`(${CJK_CHAR})${H_SPACE}*,${H_SPACE}*(?=[a-zA-Z])`, 'gu');
  s = s.replace(reComma3, `$1${comma} `);

  // 3. 治理中文语境下的半角句号 '.'
  // 3a. 汉字之后的半角句号，且后接汉字/行尾/句末/公式（严格保留换行符）
  // 例如: "最小值问题.本节与" -> "最小值问题．本节与"
  // 例如: "均写成列向量." -> "均写成列向量．"
  const reStop1 = new RegExp(`(${CJK_CHAR})${H_SPACE}*\\.${H_SPACE}*(?=${CJK_CHAR}|\\$|[“‘（\\[【\\(]|${H_SPACE}|\\r?\\n|$)`, 'gu');
  s = s.replace(reStop1, `$1${fullStop}`);

  // 3b. 文本节点开头的句号（紧跟在行内数学公式之后），且后接汉字
  // 例如: "$...$ . 由于" -> 节点文本为 " . 由于" -> 转换为 "．由于"
  // 关键：必须后接中文汉字 CJK_CHAR！绝不匹配公式内部标点！
  const reStop2 = new RegExp(`^${H_SPACE}*\\.${H_SPACE}*(?=${CJK_CHAR})`, 'u');
  s = s.replace(reStop2, `${fullStop}`);

  // 3c. 汉字之后的半角句号，后接英文说明
  const reStop3 = new RegExp(`(${CJK_CHAR})${H_SPACE}*\\.${H_SPACE}*(?=[a-zA-Z])`, 'gu');
  s = s.replace(reStop3, `$1${fullStop} `);

  // 4. 恢复多点省略号
  for (const { token, val } of ellipsisTokens) {
    s = s.replace(token, val);
  }

  return s;
}

/**
 * Rehype 插件入口：全量祖先链安全拦截
 */
export function rehypeCjkPunctuation(options = {}) {
  return (tree) => {
    visitParents(tree, 'text', (node, ancestors) => {
      if (typeof node.value !== 'string') return;
      if (!node.value.includes(',') && !node.value.includes('.')) return;

      // 铁律：只要任何一个祖先属于受保护元素（数学公式、代码块、超链接、徽章等），坚决跳过
      const isProtected = ancestors.some((ancestor) => isProtectedElement(ancestor));
      if (isProtected) return;

      node.value = normalizeCjkPunctuation(node.value, options);
    });
  };
}

export default rehypeCjkPunctuation;
