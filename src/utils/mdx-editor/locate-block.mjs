/**
 * mdx-editor/locate-block：块定位 —— 给定文件内容与目标行号（body 空间），
 * 解析 mdast 并返回包含该行的"编辑块"（卡片 / 段落 / 标题 / 列表 / 公式…）。
 *
 * 返回（均为 body 行号空间，1-based）：
 *   { kind, startLine, endLine, text, node, parentCard }
 *   - kind：卡片组件名小写（example/knowledge/…），或
 *           paragraph | heading | list | table | quote | code | formula | hr
 *   - text：块源码文本（LF 归一）
 *   - node：命中的 mdast 节点
 *   - parentCard：若命中节点位于某卡片内，给出该卡片块 { kind, startLine, endLine }
 */

import { parseFile, lineOffsets, linesText } from './parse.mjs';

/** mdast 节点类型 → 块 kind */
const NODE_KIND = {
  heading: 'heading',
  paragraph: 'paragraph',
  list: 'list',
  table: 'table',
  blockquote: 'quote',
  code: 'code',
  math: 'formula',
  thematicBreak: 'hr',
};

/** 卡片 kind 集合（组件名小写） */
export const CARD_KINDS = new Set([
  'example', 'variant', 'knowledge', 'note', 'solution',
  'block', 'method', 'guide', 'exercise', 'summary',
]);

/** 是否卡片节点（mdxJsxFlowElement 一律视为卡片块） */
const isCardNode = (n) => n.type === 'mdxJsxFlowElement';
const cardKind = (n) => (n.name || 'card').toLowerCase();

/**
 * 定位包含 targetLine 的最深层编辑块。
 * 遍历顺序 = 源码顺序；卡片先于其子块访问、子块后访问覆盖 → 点卡片内段落命中段落，
 * 点卡片外壳（标题行等子块不含的行）命中卡片。兄弟块不重叠，无互相覆盖问题。
 * @param {string} content 全文
 * @param {number} targetLine body 行号（1-based）
 */
export function locateBlock(content, targetLine) {
  const { mdast, body, offset } = parseFile(content);
  const offs = lineOffsets(body);

  let hit = null; // { node, kind }
  let hitParentCard = null;
  const cardStack = [];

  function walk(node) {
    if (!node.position?.start?.line) return;
    const inRange = node.position.start.line <= targetLine && targetLine <= node.position.end.line;

    if (isCardNode(node)) {
      if (inRange) {
        hit = { node, kind: cardKind(node) };
        hitParentCard = null;
        cardStack.push(node);
      }
      for (const child of node.children || []) walk(child);
      if (inRange) cardStack.pop();
      return;
    }

    const kind = NODE_KIND[node.type];
    if (kind && inRange) {
      hit = { node, kind };
      hitParentCard = cardStack.length ? cardStack[cardStack.length - 1] : null;
    }
    for (const child of node.children || []) walk(child);
  }

  walk(mdast);
  if (!hit) return null;

  const { node, kind } = hit;
  const startLine = node.position.start.line;
  const endLine = node.position.end.line;
  const text = linesText(body, offs, startLine, endLine);

  let parentCard = null;
  if (hitParentCard) {
    const p = hitParentCard.position;
    parentCard = {
      kind: cardKind(hitParentCard),
      startLine: p.start.line,
      endLine: p.end.line,
    };
  }

  return { kind, startLine, endLine, text, node, parentCard, offset };
}

/** 判断 kind 是否为卡片 */
export function isCardKind(kind) {
  return CARD_KINDS.has(kind);
}
