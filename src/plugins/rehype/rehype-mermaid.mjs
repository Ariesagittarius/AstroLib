/**
 * rehype-mermaid：在 HTML AST (HAST) 中拦截 language-mermaid 代码块，
 * 将其转换为自带 data-mermaid-code 属性的 .mermaid-container DOM 结构，
 * 避免 Expressive Code 将流程图代码块误渲染为带有语法高亮 HTML 标签的代码框。
 */

import { visitParents, SKIP } from 'unist-util-visit-parents';
import { toText } from 'hast-util-to-text';

function isMermaidCode(classes) {
  if (!Array.isArray(classes)) return false;
  return classes.includes('language-mermaid') || classes.includes('mermaid');
}

export function rehypeMermaid() {
  return (tree) => {
    const jobs = [];

    visitParents(tree, 'element', (element, parents) => {
      const classes = Array.isArray(element.properties?.className)
        ? element.properties.className
        : [];

      if (element.tagName !== 'code' || !isMermaidCode(classes)) return;

      const parent = parents[parents.length - 1];
      if (!parent) return;

      let scope = element;
      let holder = parent;

      if (parent.type === 'element' && parent.tagName === 'pre') {
        scope = parent;
        holder = parents[parents.length - 2];
      }

      jobs.push({ scope, holder });
      return SKIP;
    });

    for (const { scope, holder } of jobs) {
      if (!holder) continue;
      const rawCode = toText(scope, { whitespace: 'pre' });

      const container = {
        type: 'element',
        tagName: 'div',
        properties: {
          className: ['mermaid-container'],
          dataMermaidCode: encodeURIComponent(rawCode),
          dataFeature: 'mermaid',
        },
        children: [
          {
            type: 'element',
            tagName: 'div',
            properties: {
              className: ['mermaid-render'],
            },
            children: [
              {
                type: 'element',
                tagName: 'pre',
                properties: {
                  className: ['mermaid'],
                },
                children: [
                  {
                    type: 'text',
                    value: rawCode,
                  },
                ],
              },
            ],
          },
        ],
      };

      const index = holder.children.indexOf(scope);
      if (index !== -1) {
        holder.children.splice(index, 1, container);
      }
    }
  };
}

export default rehypeMermaid;
