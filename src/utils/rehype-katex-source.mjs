import { visitParents, SKIP } from 'unist-util-visit-parents';
import { visit } from 'unist-util-visit';
import { toText } from 'hast-util-to-text';

function isMathClasses(classes) {
  return (
    classes.includes('language-math') ||
    classes.includes('math-display') ||
    classes.includes('math-inline')
  );
}

export function rehypeKatexAnnotate() {
  return (tree) => {

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

      if (scope.properties?.dataKatexSrc) continue;
      const source = toText(scope, { whitespace: 'pre' });
      const placeholder = {
        type: 'element',
        tagName: 'span',
        position: scope.position,
        properties: {
          dataKatexSrc: source,
          ...(scope.position?.start?.line ? { dataKatexLine: scope.position.start.line } : {}),
        },
        children: [scope],
      };
      const index = holder.children.indexOf(scope);
      holder.children.splice(index, 1, placeholder);
    }
  };
}

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
        root.properties = {
          ...root.properties,
          dataLatex: element.properties.dataKatexSrc,
          ...(element.properties.dataKatexLine ? { dataKatexLine: element.properties.dataKatexLine } : {}),
        };
        if (element.position) root.position = element.position;
      }

      parent.children.splice(index, 1, ...element.children);
      return [SKIP, index];
    });
  };
}
