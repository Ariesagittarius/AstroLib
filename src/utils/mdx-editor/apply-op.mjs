import { compile } from '@mdx-js/mdx';
import remarkMath from 'remark-math';
import { parseFile, lineOffsets, linesText, detectEol } from './parse.mjs';
import { locateBlock, isCardKind } from './locate-block.mjs';

const COMPONENT_BY_KIND = {
  example: 'Example',
  variant: 'Variant',
  knowledge: 'Knowledge',
  note: 'Note',
  solution: 'Solution',
  block: 'Block',
  method: 'Method',
  guide: 'Guide',
  exercise: 'Exercise',
  summary: 'Summary',
  analysis: 'Analysis',
};

function escapeAttr(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/{/g, '&#123;')
    .replace(/}/g, '&#125;');
}

function unescapeAttr(s) {
  return String(s)
    .replace(/&quot;/g, '"')
    .replace(/&#123;/g, '{')
    .replace(/&#125;/g, '}')
    .replace(/&amp;/g, '&');
}

export async function validateMdx(content) {
  try {
    const { body } = parseFile(content);
    await compile(body, { remarkPlugins: [remarkMath], jsx: true });
    return null;
  } catch (err) {
    return err?.message || String(err?.reason || err);
  }
}

function toLines(content) {
  const eol = detectEol(content);
  return { eol, lines: content.split(/\r?\n/) };
}
function fromLines({ eol, lines }) {
  return lines.join(eol);
}

function spliceBlock(lines, s, e) {
  const aText = lines.splice(s - 1, e - s + 1).join('\n');

  const idx = s - 1;
  if (lines[idx] === '' && lines[idx - 1] === '') lines.splice(idx, 1);
  else if (lines[idx] === '' && lines[idx + 1] === '') lines.splice(idx, 1);
  return { aText };
}

function insertBlock(lines, idx, text) {
  const parts = text.split('\n');
  if (lines[idx - 1] !== '' && lines[idx - 1] !== undefined && parts[0] !== '') {
    lines.splice(idx, 0, '');
    idx++;
  }
  lines.splice(idx, 0, ...parts);
  const endIdx = idx + parts.length;
  if (lines[endIdx] !== '' && lines[endIdx] !== undefined && parts[parts.length - 1] !== '') {
    lines.splice(endIdx, 0, '');
  }
}

function collapseBlankLines(arr) {
  const out = [];
  let prevBlank = false;
  for (const l of arr) {
    const blank = l.trim() === '';
    if (blank && prevBlank) continue;
    out.push(l);
    prevBlank = blank;
  }
  return out;
}

function cardInnerText(cardText, compName) {
  const gt = cardText.indexOf('>');
  if (gt === -1) return null;
  const closeTag = '</' + compName + '>';
  const ci = cardText.lastIndexOf(closeTag);
  if (ci === -1) {

    return cardText.slice(gt + 1).trim();
  }
  let inner = cardText.slice(gt + 1, ci);
  inner = inner.replace(/^\s*\r?\n/, '').replace(/\r?\n\s*$/, '');
  return inner;
}

async function opReplaceBlock(content, payload) {
  const loc = locateBlock(content, payload.line);
  if (!loc) return err(`第 ${payload.line} 行未命中任何块`);
  const { body, offset } = parseFile(content);
  const offs = lineOffsets(content);
  const eol = detectEol(content);
  const fullS = offs[loc.startLine + offset - 1];
  const fullE = offs[loc.endLine + offset] ?? content.length;
  let newText = String(payload.newText ?? '').replace(/\r?\n/g, eol);
  if (fullE < content.length && !newText.endsWith(eol)) {
    newText += eol;
  }
  return ok(content.slice(0, fullS) + newText + content.slice(fullE));
}

async function opEditFormula(content, payload) {
  const { line, oldLatex, newLatex } = payload;
  const loc = locateBlock(content, line);
  if (!loc) return err(`第 ${line} 行未命中任何块`);
  if (oldLatex == null || newLatex == null) return err('缺少 oldLatex / newLatex');

  let newBlockText;
  if (loc.kind === 'formula') {

    const m = loc.text.match(/^\s*\$\$\r?\n?([\s\S]*?)\r?\n?\$\$\s*$/);
    if (!m) {
      newBlockText = '$$\n' + newLatex + '\n$$';
    } else {
      newBlockText = '$$\n' + newLatex + '\n$$';
    }
  } else {

    const candidates = [
      ['$$' + oldLatex + '$$', '$$' + newLatex + '$$'],
      ['$' + oldLatex + '$', '$' + newLatex + '$'],
    ];
    let applied = false;
    for (const [oldFrag, newFrag] of candidates) {
      const idx = loc.text.indexOf(oldFrag);
      if (idx === -1) continue;
      if (loc.text.indexOf(oldFrag, idx + 1) !== -1) {
        return err('该公式源码在块内出现多次，无法唯一替换；请改用"编辑源码"手动修改');
      }
      newBlockText = loc.text.slice(0, idx) + newFrag + loc.text.slice(idx + oldFrag.length);
      applied = true;
      break;
    }
    if (!applied) return err(`在块内未找到公式源码：${oldLatex}`);
  }
  return opReplaceBlock(content, { line, newText: newBlockText });
}

async function opMoveBlock(content, payload) {
  const { line, targetLine, position } = payload;
  const a = locateBlock(content, line);
  const b = locateBlock(content, targetLine);
  if (!a || !b) return err('移动源或目标未命中块');
  if (a.startLine === b.startLine && a.endLine === b.endLine) return err('目标块与源块相同');

  if (a.startLine <= b.startLine && b.endLine <= a.endLine) return err('目标块位于源块内部，无法移动');
  if (b.startLine <= a.startLine && a.endLine <= b.endLine) return err('源块位于目标块内部，无法移动');

  const { body, offset } = parseFile(content);
  const { eol, lines } = toLines(content);

  const as = a.startLine + offset, ae = a.endLine + offset;
  let bs = b.startLine + offset, be = b.endLine + offset;

  const { aText } = spliceBlock(lines, as, ae);

  if (as < bs) {
    const removed = ae - as + 1;
    bs -= removed;
    be -= removed;
  }

  const idx = position === 'before' ? bs - 1 : be;
  insertBlock(lines, idx, aText);
  return ok(fromLines({ eol, lines }));
}

async function opUnwrap(content, payload) {
  const loc = locateBlock(content, payload.line);
  if (!loc) return err('未命中块');
  const card = isCardKind(loc.kind) ? loc : loc.parentCard;
  if (!card) return err('该块不在卡片内，无法"转为正文"');

  const cardLoc = locateBlock(content, card.startLine);
  if (!cardLoc) return err('无法定位卡片源码');
  const comp = cardLoc.node?.name || COMPONENT_BY_KIND[cardLoc.kind] || 'Block';
  const { body, offset } = parseFile(content);
  const cardText = linesText(body, lineOffsets(body), cardLoc.startLine, cardLoc.endLine);
  const inner = cardInnerText(cardText, comp);
  if (inner == null) return err('卡片源码结构无法解析');
  if (!inner.trim()) return err('卡片内容为空，无法转为正文');

  let title = '';
  for (const a of cardLoc?.node?.attributes || []) {
    if (a.type === 'mdxJsxAttribute' && a.name === 'title' && typeof a.value === 'string') {
      title = a.value;
      break;
    }
  }
  title = unescapeAttr(title).trim();
  const newText = title ? `## ${title}\n\n${inner}` : inner;
  return opReplaceBlock(content, { line: cardLoc.startLine, newText });
}

async function opExtract(content, payload) {
  const loc = locateBlock(content, payload.line);
  if (!loc) return err('未命中块');
  if (isCardKind(loc.kind)) return err('请选择卡片内部的段落/列表等，而不是卡片本身');
  const card = loc.parentCard;
  if (!card) return err('该块不在卡片内，无法移出');

  const { body, offset } = parseFile(content);
  const cardLoc = locateBlock(content, card.startLine);
  const comp = cardLoc?.node?.name || 'Block';
  const cardText = linesText(body, lineOffsets(body), card.startLine, card.endLine);
  const inner = cardInnerText(cardText, comp);
  if (inner == null) return err('卡片源码结构无法解析');

  const innerLines = inner.split('\n');
  const blockText = loc.text.replace(/\n$/, '');
  const blockLines = blockText.split('\n');
  let startIdx = -1;
  for (let i = 0; i <= innerLines.length - blockLines.length; i++) {
    if (innerLines.slice(i, i + blockLines.length).join('\n') === blockText) {
      startIdx = i;
      break;
    }
  }
  if (startIdx === -1) return err('无法在卡片内定位该块（文本匹配失败）');
  const rest = collapseBlankLines([
    ...innerLines.slice(0, startIdx),
    ...innerLines.slice(startIdx + blockLines.length),
  ]).join('\n');
  if (!rest.trim()) {

    const offs0 = lineOffsets(content);
    const s0 = offs0[card.startLine + offset - 1];
    const e0 = offs0[card.endLine + offset] ?? content.length;
    return ok(content.slice(0, s0) + loc.text + content.slice(e0));
  }

  const openTag = cardText.slice(0, cardText.indexOf('>') + 1);
  const newCardText = openTag + '\n\n' + rest + '\n\n</' + comp + '>';

  const offs = lineOffsets(content);
  const eol = detectEol(content);
  const fullS = offs[card.startLine + offset - 1];
  const fullE = offs[card.endLine + offset] ?? content.length;
  const newText = (newCardText + '\n\n' + loc.text).replace(/\n/g, eol);
  return ok(content.slice(0, fullS) + newText + content.slice(fullE));
}

async function opWrap(content, payload) {
  const { line, cardType, title } = payload;
  const loc = locateBlock(content, line);
  if (!loc) return err('未命中块');
  if (loc.parentCard) return err('该块已在卡片内，请直接移动或编辑');
  if (isCardKind(loc.kind)) return err('不能把卡片再包进卡片');
  const comp = COMPONENT_BY_KIND[cardType] || cardType;
  if (!comp) return err(`未知卡片类型：${cardType}`);

  const { body, offset } = parseFile(content);
  const blockText = linesText(body, lineOffsets(body), loc.startLine, loc.endLine);
  const titleAttr = title ? ` title="${escapeAttr(title)}"` : '';
  const newText = `<${comp}${titleAttr}>\n\n${blockText}\n\n</${comp}>`;
  return opReplaceBlock(content, { line, newText });
}

async function opWrapRange(content, payload) {
  const { startLine, endLine, cardType, title } = payload;
  const s = Math.min(startLine, endLine);
  const e = Math.max(startLine, endLine);
  const { body, offset } = parseFile(content);
  const offs = lineOffsets(body);
  const fullOffs = lineOffsets(content);
  const eol = detectEol(content);

  const locS = locateBlock(content, s);
  const locE = locateBlock(content, e);
  if (!locS || !locE) return err('范围定位失败');

  const actualStart = locS.startLine;
  const actualEnd = locE.endLine;
  const rangeText = linesText(body, offs, actualStart, actualEnd);

  const comp = COMPONENT_BY_KIND[cardType] || cardType;
  const titleAttr = title ? ` title="${escapeAttr(title)}"` : '';
  const newCard = `<${comp}${titleAttr}>\n\n${rangeText.trim()}\n\n</${comp}>`;

  const fullS = fullOffs[actualStart + offset - 1];
  const fullE = fullOffs[actualEnd + offset] ?? content.length;
  const formattedNew = newCard.replace(/\n/g, eol);
  return ok(content.slice(0, fullS) + formattedNew + content.slice(fullE));
}

async function opChangeCardType(content, payload) {
  const { line, cardType } = payload;
  const loc = locateBlock(content, line);
  if (!loc) return err('未命中卡片');
  const card = isCardKind(loc.kind) ? loc : loc.parentCard;
  if (!card) return err('该块不是卡片，无法更换卡片类型');

  const cardLoc = locateBlock(content, card.startLine);
  if (!cardLoc) return err('无法定位卡片');
  const oldComp = cardLoc.node?.name || COMPONENT_BY_KIND[cardLoc.kind] || 'Block';
  const newComp = COMPONENT_BY_KIND[cardType] || cardType;
  if (!newComp) return err(`未知目标卡片类型：${cardType}`);

  const { body, offset } = parseFile(content);
  const cardText = linesText(body, lineOffsets(body), cardLoc.startLine, cardLoc.endLine);

  const openRe = new RegExp(`^<${oldComp}(\\s|>)`);
  if (!openRe.test(cardText)) return err('卡片开标签结构异常');
  let newCardText = cardText.replace(openRe, `<${newComp}$1`);

  const closeRe = new RegExp(`</${oldComp}>$`);
  if (closeRe.test(newCardText.trim())) {
    newCardText = newCardText.replace(new RegExp(`</${oldComp}>(\\s*)$`), `</${newComp}>$1`);
  }

  return opReplaceBlock(content, { line: cardLoc.startLine, newText: newCardText });
}

async function opUpdateTitle(content, payload) {
  const { line, title } = payload;
  const loc = locateBlock(content, line);
  if (!loc) return err('未命中卡片');
  const card = isCardKind(loc.kind) ? loc : loc.parentCard;
  if (!card) return err('该块不是卡片，无法修改卡片标题');

  const cardLoc = locateBlock(content, card.startLine);
  if (!cardLoc) return err('无法定位卡片');
  const comp = cardLoc.node?.name || COMPONENT_BY_KIND[cardLoc.kind] || 'Block';

  const { body, offset } = parseFile(content);
  const cardText = linesText(body, lineOffsets(body), cardLoc.startLine, cardLoc.endLine);
  const gt = cardText.indexOf('>');
  if (gt === -1) return err('卡片开标签格式无法识别');
  const openTag = cardText.slice(0, gt + 1);
  const rest = cardText.slice(gt + 1);

  const cleanTitle = String(title ?? '').trim();
  let newOpenTag;
  if (/title="[^"]*"/.test(openTag)) {
    newOpenTag = cleanTitle
      ? openTag.replace(/title="[^"]*"/, `title="${escapeAttr(cleanTitle)}"`)
      : openTag.replace(/\s*title="[^"]*"/, '');
  } else if (/title=\{[^\}]*\}/.test(openTag)) {
    newOpenTag = cleanTitle
      ? openTag.replace(/title=\{[^\}]*\}/, `title="${escapeAttr(cleanTitle)}"`)
      : openTag.replace(/\s*title=\{[^\}]*\}/, '');
  } else {

    if (cleanTitle) {
      newOpenTag = openTag.replace(new RegExp(`^<${comp}`), `<${comp} title="${escapeAttr(cleanTitle)}"`);
    } else {
      newOpenTag = openTag;
    }
  }

  const newCardText = newOpenTag + rest;
  return opReplaceBlock(content, { line: cardLoc.startLine, newText: newCardText });
}

async function opMergeBlocks(content, payload) {
  const { startLine, endLine } = payload;
  const s = Math.min(startLine, endLine);
  const e = Math.max(startLine, endLine);
  const { body, offset } = parseFile(content);
  const offs = lineOffsets(body);
  const fullOffs = lineOffsets(content);
  const eol = detectEol(content);

  const locS = locateBlock(content, s);
  const locE = locateBlock(content, e);
  if (!locS || !locE) return err('合并范围定位失败');

  const actualStart = locS.startLine;
  const actualEnd = locE.endLine;
  const rawText = linesText(body, offs, actualStart, actualEnd);

  const mergedText = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .join(' ');

  const fullS = fullOffs[actualStart + offset - 1];
  const fullE = fullOffs[actualEnd + offset] ?? content.length;
  return ok(content.slice(0, fullS) + mergedText + content.slice(fullE));
}

async function opDelete(content, payload) {
  const loc = locateBlock(content, payload.line);
  if (!loc) return err('未命中块');
  const { body, offset } = parseFile(content);
  const { eol, lines } = toLines(content);
  const s = loc.startLine + offset, e = loc.endLine + offset;
  spliceBlock(lines, s, e);
  return ok(fromLines({ eol, lines }));
}

async function opDeleteRange(content, payload) {
  const { startLine, endLine } = payload;
  const s = Math.min(startLine, endLine);
  const e = Math.max(startLine, endLine);
  const { body, offset } = parseFile(content);
  const locS = locateBlock(content, s);
  const locE = locateBlock(content, e);
  if (!locS || !locE) return err('删除范围定位失败');

  const actualStart = locS.startLine + offset;
  const actualEnd = locE.endLine + offset;
  const { eol, lines } = toLines(content);
  spliceBlock(lines, actualStart, actualEnd);
  return ok(fromLines({ eol, lines }));
}

async function opInsertIntoCard(content, payload) {
  const { line, targetLine } = payload;
  const loc = locateBlock(content, line);
  if (!loc) return err(`第 ${line} 行未命中任何块`);
  if (isCardKind(loc.kind)) return err('不能把整张卡片插入另一张卡片；请选择正文段落/列表/公式等');
  if (loc.parentCard) return err('该块已在卡片内，请直接编辑或使用"移出卡片"');

  const cardLoc = locateBlock(content, targetLine);
  if (!cardLoc) return err(`第 ${targetLine} 行未命中目标卡片`);
  if (!isCardKind(cardLoc.kind)) return err(`目标必须是卡片（第 ${targetLine} 行不是卡片）`);

  const { body, offset } = parseFile(content);
  const comp = cardLoc.node?.name || COMPONENT_BY_KIND[cardLoc.kind] || 'Block';
  const cardText = linesText(body, lineOffsets(body), cardLoc.startLine, cardLoc.endLine);
  const openTag = cardText.slice(0, cardText.indexOf('>') + 1);
  const inner = cardInnerText(cardText, comp);
  if (inner == null) return err('卡片源码结构无法解析');

  const blockText = loc.text.replace(/\n$/, '');
  const newInner = inner.trim() ? inner + '\n\n' + blockText : blockText;
  const newCardText = openTag + '\n\n' + newInner + '\n\n</' + comp + '>';

  const { eol, lines } = toLines(content);
  const bs = loc.startLine + offset, be = loc.endLine + offset;
  const cs = cardLoc.startLine + offset, ce = cardLoc.endLine + offset;
  const cardLen = ce - cs + 1;
  const newCardLines = newCardText.split('\n');

  if (cs > bs) {

    const beforeLen = lines.length;
    lines.splice(bs - 1, be - bs + 1);
    let idx = bs - 1;
    if (lines[idx] === '' && lines[idx - 1] === '') lines.splice(idx, 1);
    else if (lines[idx] === '' && lines[idx + 1] === '') lines.splice(idx, 1);
    const shift = beforeLen - lines.length;
    lines.splice(cs - shift - 1, cardLen, ...newCardLines);
  } else {

    lines.splice(cs - 1, cardLen, ...newCardLines);
    const shift = newCardLines.length - cardLen;
    const nbs = bs + shift, nbe = be + shift;
    lines.splice(nbs - 1, nbe - nbs + 1);
    let idx = nbs - 1;
    if (lines[idx] === '' && lines[idx - 1] === '') lines.splice(idx, 1);
    else if (lines[idx] === '' && lines[idx + 1] === '') lines.splice(idx, 1);
  }
  return ok(fromLines({ eol, lines }));
}

async function opInsertRangeIntoCard(content, payload) {
  const { startLine, endLine, targetLine } = payload;
  const s = Math.min(startLine, endLine);
  const e = Math.max(startLine, endLine);
  const locS = locateBlock(content, s);
  const locE = locateBlock(content, e);
  if (!locS || !locE) return err('插入范围定位失败');

  const cardLoc = locateBlock(content, targetLine);
  if (!cardLoc) return err(`第 ${targetLine} 行未命中目标卡片`);
  if (!isCardKind(cardLoc.kind)) return err(`目标必须是卡片（第 ${targetLine} 行不是卡片）`);

  const { body, offset } = parseFile(content);
  const comp = cardLoc.node?.name || COMPONENT_BY_KIND[cardLoc.kind] || 'Block';
  const cardText = linesText(body, lineOffsets(body), cardLoc.startLine, cardLoc.endLine);
  const openTag = cardText.slice(0, cardText.indexOf('>') + 1);
  const inner = cardInnerText(cardText, comp);
  if (inner == null) return err('卡片源码结构无法解析');

  const rangeText = linesText(body, lineOffsets(body), locS.startLine, locE.endLine).replace(/\n$/, '');
  const newInner = inner.trim() ? inner + '\n\n' + rangeText : rangeText;
  const newCardText = openTag + '\n\n' + newInner + '\n\n</' + comp + '>';

  const { eol, lines } = toLines(content);
  const bs = locS.startLine + offset, be = locE.endLine + offset;
  const cs = cardLoc.startLine + offset, ce = cardLoc.endLine + offset;
  const cardLen = ce - cs + 1;
  const newCardLines = newCardText.split('\n');

  if (cs > bs) {
    const beforeLen = lines.length;
    lines.splice(bs - 1, be - bs + 1);
    let idx = bs - 1;
    if (lines[idx] === '' && lines[idx - 1] === '') lines.splice(idx, 1);
    else if (lines[idx] === '' && lines[idx + 1] === '') lines.splice(idx, 1);
    const shift = beforeLen - lines.length;
    lines.splice(cs - shift - 1, cardLen, ...newCardLines);
  } else {
    lines.splice(cs - 1, cardLen, ...newCardLines);
    const shift = newCardLines.length - cardLen;
    const nbs = bs + shift, nbe = be + shift;
    lines.splice(nbs - 1, nbe - nbs + 1);
    let idx = nbs - 1;
    if (lines[idx] === '' && lines[idx - 1] === '') lines.splice(idx, 1);
    else if (lines[idx] === '' && lines[idx + 1] === '') lines.splice(idx, 1);
  }
  return ok(fromLines({ eol, lines }));
}

const OPS = {
  'replace-block': opReplaceBlock,
  'edit-formula': opEditFormula,
  'move-block': opMoveBlock,
  unwrap: opUnwrap,
  extract: opExtract,
  wrap: opWrap,
  'wrap-range': opWrapRange,
  'change-card-type': opChangeCardType,
  'update-title': opUpdateTitle,
  'merge-blocks': opMergeBlocks,
  delete: opDelete,
  'delete-range': opDeleteRange,
  'insert-into-card': opInsertIntoCard,
  'insert-range-into-card': opInsertRangeIntoCard,
};

const err = (message) => ({ ok: false, message });
const ok = (content) => ({ ok: true, content });

export async function applyOp(content, op, payload) {
  const fn = OPS[op];
  if (!fn) return err(`未知操作：${op}`);
  let result;
  try {
    result = await fn(content, payload || {});
  } catch (e) {
    return err('操作执行异常：' + (e?.message || String(e)));
  }
  if (!result.ok) return result;

  const vErr = await validateMdx(result.content);
  if (vErr) return err('修改后的 MDX 校验未通过，已拒绝写入：\n' + vErr);
  return result;
}

export { COMPONENT_BY_KIND, escapeAttr, unescapeAttr };
