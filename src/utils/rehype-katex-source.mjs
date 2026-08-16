/**
 * rehype-katex-source：让每个 KaTeX 公式在最终 HTML 中携带原始 LaTeX 源码。
 *
 * rehype-katex 渲染后会丢掉 LaTeX 原文（只剩排版后的 SVG/HTML），
 * 导致前端无法实现“复制公式”功能。本模块用两个极小的 rehype 插件，
 * 夹在 rehype-katex 前后各跑一次，把源码“绕行”并写回成品：
 *
 *   1. rehypeKatexAnnotate（在 rehype-katex 之前）：
 *      把每个数学节点包进一个携带 `data-katex-src` 的透明占位符。
 *   2. rehypeKatexPromote（在 rehype-katex 之后）：
 *      把占位符上的源码提升到 KaTeX 根元素（.katex / .katex-display）
 *      的 `data-latex` 属性上，再解包占位符。
 *
 * 最终 DOM 与不启用本插件时完全一致，仅多出 `data-latex` 一个属性，
 * 不引入任何额外包装元素，不影响现有布局与样式。
 */

import { visitParents, SKIP } from 'unist-util-visit-parents';
import { visit } from 'unist-util-visit';
import { toText } from 'hast-util-to-text';

/** 数学节点的类名标记（与 rehype-katex 判定的口径完全一致） */
function isMathClasses(classes) {
  return (
    classes.includes('language-math') ||
    classes.includes('math-display') ||
    classes.includes('math-inline')
  );
}

/**
 * 第一步（rehype-katex 之前）：为数学节点包一层携带源码的占位符。
 * 行内公式 $...$ 的渲染单元是 <code>，行间公式 $$...$$ 的渲染单元是
 * 外层 <pre>（rehype-katex 会把整个 <pre> 替换为 .katex-display），
 * 因此占位符必须包住与 rehype-katex 相同的“作用域元素”。
 */
export function rehypeKatexAnnotate() {
  return (tree) => {
    /** @type {Array<{scope: import('hast').Element, holder: import('hast').Parent}>} */
    const jobs = [];

    visitParents(tree, 'element', (element, parents) => {
      const classes = Array.isArray(element.properties?.className)
        ? element.properties.className
        : [];
      if (!isMathClasses(classes)) return;

      const parent = parents[parents.length - 1];
      if (!parent) return;

      let scope = element;
      let holder = parent;
      if (
        element.tagName === 'code' &&
        classes.includes('language-math') &&
        parent.type === 'element' &&
        parent.tagName === 'pre'
      ) {
        scope = parent;
        holder = parents[parents.length - 2];
      }
      jobs.push({ scope, holder });
      return SKIP;
    });

    for (const { scope, holder } of jobs) {
      if (!holder) continue;
      // 防御：避免重复包裹（正常情况下每个节点只会被访问一次）
      if (scope.properties?.dataKatexSrc) continue;
      const source = toText(scope, { whitespace: 'pre' });
      const placeholder = {
        type: 'element',
        tagName: 'span',
        properties: { dataKatexSrc: source },
        children: [scope],
      };
      const index = holder.children.indexOf(scope);
      holder.children.splice(index, 1, placeholder);
    }
  };
}

/**
 * 第二步（rehype-katex 之后）：把源码提升到 KaTeX 根元素上并解包占位符，
 * 最终不残留任何额外元素。
 */
export function rehypeKatexPromote() {
  return (tree) => {
    visit(tree, 'element', (element, index, parent) => {
      if (
        element.tagName !== 'span' ||
        !element.properties ||
        !('dataKatexSrc' in element.properties) ||
        !parent
      ) {
        return;
      }

      const root = element.children.find((child) => child.type === 'element');
      if (root) {
        root.properties = { ...root.properties, dataLatex: element.properties.dataKatexSrc };
      }

      // 用占位符的子元素替换占位符本身（解包），并从该位置继续遍历
      parent.children.splice(index, 1, ...element.children);
      return [SKIP, index];
    });
  };
}
