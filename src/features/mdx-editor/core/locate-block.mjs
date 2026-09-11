import { parseFile, lineOffsets, linesText } from './parse.mjs';

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

export const CARD_KINDS = new Set([
  'example', 'variant', 'knowledge', 'note', 'solution',
  'block', 'method', 'guide', 'exercise', 'summary', 'analysis',
  'qrcodevideo',
]);

const isCardNode = (n) => n.type === 'mdxJsxFlowElement';
const cardKind = (n) => (n.name || 'card').toLowerCase();

export function locateBlock(content, targetLine) {
  const { mdast, body, offset } = parseFile(content);
  const offs = lineOffsets(body);

  let hit = null;
  let hitParentCard = null;
  const cardStack = [];

  function walk(node) {
    if (!node.position?.start?.line) return;
    const inRange = node.position.start.line <= targetLine && targetLine <= node.position.end.line;

    if (isCardNode(node)) {
      if (inRange) {
        hit = { node, kind: cardKind(node) };
        hitParentCard = cardStack.length ? cardStack[cardStack.length - 1] : null;
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
  if (!hit) {

    let closestNode = null;
    let closestDist = Infinity;
    let closestKind = null;
    function walkClosest(node) {
      if (!node.position?.start?.line) return;
      const k = isCardNode(node) ? cardKind(node) : NODE_KIND[node.type];
      if (k) {
        const s = node.position.start.line;
        const e = node.position.end.line;
        const dist = targetLine < s ? s - targetLine : targetLine > e ? targetLine - e : 0;
        if (dist < closestDist) {
          closestDist = dist;
          closestNode = node;
          closestKind = k;
        }
      }
      for (const child of node.children || []) walkClosest(child);
    }
    walkClosest(mdast);
    if (closestNode && closestDist <= 3) {
      hit = { node: closestNode, kind: closestKind };
    } else {
      return null;
    }
  }

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

export function locateRange(content, startLine, endLine) {
  const { body, offset } = parseFile(content);
  const offs = lineOffsets(body);
  const s = Math.min(startLine, endLine);
  const e = Math.max(startLine, endLine);
  const text = linesText(body, offs, s, e);
  return { startLine: s, endLine: e, text, offset };
}

export function isCardKind(kind) {
  return CARD_KINDS.has(kind);
}
