import path from 'node:path';
import { visit } from 'unist-util-visit';

const CARD_COMPONENTS = {
  Example: 'example',
  Variant: 'variant',
  Knowledge: 'knowledge',
  Note: 'note',
  Solution: 'solution',
  Block: 'block',
  Method: 'method',
  Guide: 'guide',
  Exercise: 'exercise',
  Summary: 'summary',
  Analysis: 'analysis',
  QRCodeVideo: 'qrcodevideo',
};

const BLOCK_KIND = {
  p: 'paragraph',
  h2: 'heading',
  h3: 'heading',
  h4: 'heading',
  h5: 'heading',
  h6: 'heading',
  ul: 'list',
  ol: 'list',
  table: 'table',
  blockquote: 'quote',
  pre: 'code',
};

const str = (v) => (v == null ? '' : String(v));

export default function rehypeEditorAnnotate() {
  return (tree, file) => {

    let srcFile = '';
    try {
      const fp = file?.path;
      if (fp) srcFile = path.relative(process.cwd(), fp).split('\\').join('/');
    } catch {

    }

    visit(tree, 'mdxJsxFlowElement', (node) => {
      const kind = CARD_COMPONENTS[node.name];
      if (!kind) return;
      if (!node.position?.start?.line) return;
      const attrs = node.attributes || [];
      const add = (name, value) => {
        attrs.push({ type: 'mdxJsxAttribute', name, value: str(value) });
      };
      add('data-src-file', srcFile);
      add('data-src-line', node.position.start.line);
      add('data-src-kind', kind);
      node.attributes = attrs;
    });

    visit(tree, 'element', (el) => {
      const props = el.properties || (el.properties = {});
      if (props.dataSrcLine !== undefined) return;

      const kind = BLOCK_KIND[el.tagName];
      if (kind) {
        const pos = el.position?.start?.line;
        if (!pos) return;
        props.dataSrcFile = srcFile;
        props.dataSrcLine = pos;
        props.dataSrcKind = kind;
        return;
      }

      const classes = Array.isArray(props.className) ? props.className : [];
      if (classes.includes('katex-display') || classes.includes('math-display')) {
        const pos = el.position?.start?.line || props.dataKatexLine;
        if (!pos) return;
        props.dataSrcFile = srcFile;
        props.dataSrcLine = Number(pos);
        props.dataSrcKind = 'formula';
      }
    });
  };
}
