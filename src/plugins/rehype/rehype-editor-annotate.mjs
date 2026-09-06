/**
 * rehype-editor-annotate：在线可视化精修工具 · 源码位置注入层（仅 dev 启用）
 *
 * 目标：让最终渲染 HTML 的每个"编辑块"携带它在 MDX 源文件中的位置，前端据此
 * 实现"点渲染文本 → 定位源码 → 可视化修改/移动 → 写回本地 .mdx"。
 *
 * 注入信息（行号均为"剥离 frontmatter 后的 body 行号"，与写回端统一约定）：
 *   - 卡片组件节点（mdxJsxFlowElement，如 <Example>）：追加 data-src-file /
 *     data-src-line / data-src-kind 属性 → 编译后成为组件 props → 由 .astro
 *     模板透传到卡片根元素（见 src/utils/src-attrs.mjs）。
 *   - 正文块级元素（p / h2~h6 / ul / ol / table / blockquote / pre）：
 *     直接注入同名字段。
 *
 * 行号空间说明：Astro 编译 MDX 时已剥离 frontmatter，rehype 阶段拿到的
 * position 是 body 行号；写回端（dev server 端点 dev-server-plugin.mjs）定位时
 * 同样在 body 空间解析，只在真正写盘时换算全文行号（见 src/utils/mdx-editor/parse.mjs）。
 */

import path from 'node:path';
import { visit } from 'unist-util-visit';

/** 卡片组件名 → 块 kind（前端据此识别卡片类型，用于"移入卡片/改类型"） */
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

/** 正文块级 HTML 标签 → 块 kind */
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

/** 组件节点的 data 属性统一为字符串 */
const str = (v) => (v == null ? '' : String(v));

export default function rehypeEditorAnnotate() {
  return (tree, file) => {
    // 注入插件运行在 rehype 阶段，file.path 为源文件绝对路径（若可用）。
    // 转成项目根相对路径供写回端使用；不可用时由前端兜底（从页面 URL 推导）。
    let srcFile = '';
    try {
      const fp = file?.path;
      if (fp) srcFile = path.relative(process.cwd(), fp).split('\\').join('/');
    } catch {
      /* 忽略，前端兜底 */
    }

    // 1) 卡片组件节点：追加 mdxJsxAttribute（编译后成为组件 props）
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

    // 2) 正文块级元素 & 独立行间公式块
    visit(tree, 'element', (el) => {
      const props = el.properties || (el.properties = {});
      if (props.dataSrcLine !== undefined) return; // 防重复

      // A) 标准正文块级元素
      const kind = BLOCK_KIND[el.tagName];
      if (kind) {
        const pos = el.position?.start?.line;
        if (!pos) return;
        props.dataSrcFile = srcFile;
        props.dataSrcLine = pos;
        props.dataSrcKind = kind;
        return;
      }

      // B) 独立行间公式块（.katex-display）
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
