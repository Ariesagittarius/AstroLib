/**
 * mdx-editor/apply-op：编辑操作执行 —— 把前端发来的结构化操作应用到 MDX 源码。
 *
 * 所有操作都在"body 行号空间"定位（见 parse.mjs），写盘时统一换算全文行号
 * 并保留原文件行尾符（CRLF/LF）。每次应用前用 @mdx-js/mdx 编译校验新内容，
 * 失败则拒绝写入（不会产生半成品文件）。
 *
 * 操作协议（payload 字段见各函数）：
 *   replace-block  { line, newText }              整块源码替换（含改标题/改文本）
 *   edit-formula   { line, oldLatex, newLatex }   行内/行间公式替换
 *   move-block     { line, targetLine, position } 块移动（before|after）
 *   unwrap         { line }                       卡片 → 正文（剥掉 JSX 外壳）
 *   extract        { line }                       卡片内块移出到卡片之后
 *   wrap           { line, cardType, title }      正文块 → 包成卡片
 *   wrap-range     { startLine, endLine, cardType, title } 范围包裹
 *   change-card-type { line, cardType }           修改卡片类型
 *   update-title   { line, title }                修改卡片标题
 *   merge-blocks   { startLine, endLine }         合并相邻块
 *   delete         { line }                       删除块（清理相邻空行）
 *   delete-range   { startLine, endLine }         删除范围
 *   insert-into-card { line, targetLine }         插入块到卡片
 *   insert-range-into-card { startLine, endLine, targetLine } 插入范围到卡片
 */

import { compile } from '@mdx-js/mdx';
import remarkMath from 'remark-math';
import { parseFile, lineOffsets, linesText, detectEol, FM_RE } from './parse.mjs';
import { locateBlock, isCardKind } from './locate-block.mjs';

/** 卡片 kind → 组件名（wrap 生成 JSX 时用） */
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
  qrcodevideo: 'QRCodeVideo',
};

/** MDX JSX 属性值转义：花括号会触发表达式解析，引号需转义 */
function escapeAttr(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/{/g, '&#123;')
    .replace(/}/g, '&#125;');
}

/** escapeAttr 的逆操作：还原 JSX 属性中的转义（unwrap 把标题转为正文 h2 时用） */
function unescapeAttr(s) {
  return String(s)
    .replace(/&quot;/g, '"')
    .replace(/&#123;/g, '{')
    .replace(/&#125;/g, '}')
    .replace(/&amp;/g, '&');
}

/** 校验新全文：剥离 frontmatter 后用与构建同款的 @mdx-js/mdx 编译 */
export async function validateMdx(content) {
  try {
    const { body } = parseFile(content);
    await compile(body, { remarkPlugins: [remarkMath], jsx: true });
    return null;
  } catch (err) {
    return err?.message || String(err?.reason || err);
  }
}

/** 全文行数组（保留 eol 语义，join(eol) 还原） */
function toLines(content) {
  const eol = detectEol(content);
  return { eol, lines: content.split(/\r?\n/) };
}
function fromLines({ eol, lines }) {
  return lines.join(eol);
}

/**
 * 在全文行数组中删除 [s, e]（1-based 全文行号）并清理相邻空行。
 * 返回 { lines, aText }。
 */
function spliceBlock(lines, s, e) {
  const aText = lines.splice(s - 1, e - s + 1).join('\n');
  // 清理删除点附近的多余空行（最多保留一个）
  const idx = s - 1;
  if (lines[idx] === '' && lines[idx - 1] === '') lines.splice(idx, 1);
  else if (lines[idx] === '' && lines[idx + 1] === '') lines.splice(idx, 1);
  return { aText };
}

/** 在 lines 的 idx 位置插入文本，保证与邻居以空行分隔 */
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

/** 合并连续空行为单个空行（用于卡片内部删除后清理） */
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

/** 取卡片的 children 文本（去掉开标签与闭标签，清理首尾空行） */
function cardInnerText(cardText, compName) {
  const gt = cardText.indexOf('>');
  if (gt === -1) return null;
  const closeTag = '</' + compName + '>';
  const ci = cardText.lastIndexOf(closeTag);
  if (ci === -1) {
    // 容错：有些自闭合或无闭标签
    return cardText.slice(gt + 1).trim();
  }
  let inner = cardText.slice(gt + 1, ci);
  inner = inner.replace(/^\s*\r?\n/, '').replace(/\r?\n\s*$/, '');
  return inner;
}

/* ------------------------------------------------------------------ *
 *  操作实现
 * ------------------------------------------------------------------ */

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
    // 整块行间公式：$$\n...\n$$
    const m = loc.text.match(/^\s*\$\$\r?\n?([\s\S]*?)\r?\n?\$\$\s*$/);
    if (!m) {
      newBlockText = '$$\n' + newLatex + '\n$$';
    } else {
      newBlockText = '$$\n' + newLatex + '\n$$';
    }
  } else {
    // 行内公式：优先 $$..$$ 再 $..$；出现多次则拒绝（需用 replace-block 手工处理）
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
  // 不允许嵌套移动（目标在源内，或源在目标内）
  if (a.startLine <= b.startLine && b.endLine <= a.endLine) return err('目标块位于源块内部，无法移动');
  if (b.startLine <= a.startLine && a.endLine <= b.endLine) return err('源块位于目标块内部，无法移动');

  const { body, offset } = parseFile(content);
  const { eol, lines } = toLines(content);
  // 全文行号
  const as = a.startLine + offset, ae = a.endLine + offset;
  let bs = b.startLine + offset, be = b.endLine + offset;

  // 删除源块
  const { aText } = spliceBlock(lines, as, ae);
  // 行号修正（源在目标前时目标前移）
  if (as < bs) {
    const removed = ae - as + 1;
    bs -= removed;
    be -= removed;
  }
  // 插入
  const idx = position === 'before' ? bs - 1 : be;
  insertBlock(lines, idx, aText);
  return ok(fromLines({ eol, lines }));
}

async function opUnwrap(content, payload) {
  const loc = locateBlock(content, payload.line);
  if (!loc) return err('未命中块');
  const card = isCardKind(loc.kind) ? loc : loc.parentCard;
  if (!card) return err('该块不在卡片内，无法"转为正文"');

  // 重新定位卡片节点以获取组件名与范围
  const cardLoc = locateBlock(content, card.startLine);
  if (!cardLoc) return err('无法定位卡片源码');
  const comp = cardLoc.node?.name || COMPONENT_BY_KIND[cardLoc.kind] || 'Block';
  const { body, offset } = parseFile(content);
  const cardText = linesText(body, lineOffsets(body), cardLoc.startLine, cardLoc.endLine);
  const inner = cardInnerText(cardText, comp);
  if (inner == null) return err('卡片源码结构无法解析');
  if (!inner.trim()) return err('卡片内容为空，无法转为正文');

  // 提取卡片标题
  let title = '';
  for (const a of cardLoc?.node?.attributes || []) {
    if (a.type === 'mdxJsxAttribute' && a.name === 'title' && typeof a.value === 'string') {
      title = a.value;
      break;
    }
  }
  title = unescapeAttr(title).trim();

  let newText;
  const isNoteKind = cardLoc.kind === 'note' || comp.toLowerCase() === 'note';
  const isGenericTitle = !title || ['标注说明', '注意', '注', '说明', '提示', '想一想', '警告'].includes(title);

  if (isNoteKind || isGenericTitle) {
    // 标注说明 / 注意 / 注 等不作为二级标题转出，而是转为普通正文段落
    if (title && title !== '标注说明' && !inner.startsWith(title)) {
      newText = `**${title}**：${inner}`;
    } else {
      newText = inner;
    }
  } else {
    newText = title ? `## ${title}\n\n${inner}` : inner;
  }

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

  // 用文本匹配在被移出块在卡片 children 中的位置
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
    // 卡片内只剩这一个块：移出后卡片为空 → 删除空卡片，该块直接作为正文
    const offs0 = lineOffsets(content);
    const s0 = offs0[card.startLine + offset - 1];
    const e0 = offs0[card.endLine + offset] ?? content.length;
    return ok(content.slice(0, s0) + loc.text + content.slice(e0));
  }

  // 保留原开标签（title 原样含转义），重构卡片外壳
  const openTag = cardText.slice(0, cardText.indexOf('>') + 1);
  const newCardText = openTag + '\n\n' + rest + '\n\n</' + comp + '>';

  // 全文替换卡片区间 → 新卡片 + 空行 + 被移出块（作为正文）
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

  // 替换开标签中的组件名
  const openRe = new RegExp(`^<${oldComp}(\\s|>)`);
  if (!openRe.test(cardText)) return err('卡片开标签结构异常');
  let newCardText = cardText.replace(openRe, `<${newComp}$1`);

  // 替换闭标签
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
    // 追加 title 属性
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

  // 清理多余空行并将连续文字合并为单段落（保留公式和列表结构，合并纯文字段落）
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

  // 两个区间互不重叠（源块在卡片外）。按"起始行在前者先处理"避免行号漂移：
  if (cs > bs) {
    // 卡片在后：先删源块（含空行清理），记录实际行数变化（清理可能多删 1 行）
    const beforeLen = lines.length;
    lines.splice(bs - 1, be - bs + 1);
    let idx = bs - 1;
    if (lines[idx] === '' && lines[idx - 1] === '') lines.splice(idx, 1);
    else if (lines[idx] === '' && lines[idx + 1] === '') lines.splice(idx, 1);
    const shift = beforeLen - lines.length;
    lines.splice(cs - shift - 1, cardLen, ...newCardLines);
  } else {
    // 卡片在前：先替换卡片，源块行号随卡片长度变化后移
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
  return { ok: true, content: lines.join(eol) };
}

/**
 * 把一段文本中的非公式独立英文词块包装为行内公式 $...$
 * 严格保护已有数学公式、代码块、行内代码、ESM import/export 语句、JSX/HTML 标签与属性、Markdown 链接与图片
 */
export function convertEnglishToMath(text) {
  // 匹配所有需严格保护的结构：
  // 1. Frontmatter: ^---\n...\n---
  // 2. ESM import/export 语句: import ... from '...'; 或 export ...
  // 3. 行间公式: $$...$$
  // 4. 行内公式: $...$
  // 5. 代码块: ```...```
  // 6. 行内代码: `...`
  // 7. JSX / HTML 标签与组件 (含跨行与属性): <Tag ...> 或 </Tag> 或 <Tag />
  // 8. Markdown 图片: ![alt](url)
  // 9. Markdown 链接: [text](url)
  // 10. HTML 注释: <!-- ... -->
  // 11. HTML 实体: &...;
  const pattern = /(^---\r?\n[\s\S]*?\r?\n---|(?:^|\n)\s*(?:import|export)\s+[\s\S]*?(?:;(?=\r?\n|$)|(?=\r?\n\r?\n|$))|\$\$[\s\S]*?\$\$|\$(?:\\\$|[^\$\n])+?\$|```[\s\S]*?```|`[^`\n]+?`|<(?:\/?[a-zA-Z][a-zA-Z0-9_\-\.:]*)(?:\s+[\s\S]*?)?>|!\[[^\]]*\]\([^)]+\)|\[[^\]]+\]\([^)]+\)|<!--[\s\S]*?-->|&[a-zA-Z0-9#]+;)/g;

  let lastIdx = 0;
  const segments = [];
  let m;
  let count = 0;
  while ((m = pattern.exec(text)) !== null) {
    if (m.index > lastIdx) {
      segments.push({ type: 'text', val: text.slice(lastIdx, m.index) });
    }
    segments.push({ type: 'protected', val: m[0] });
    lastIdx = m.index + m[0].length;
  }
  if (lastIdx < text.length) {
    segments.push({ type: 'text', val: text.slice(lastIdx) });
  }

  // 匹配英文字词（如 love, ya, a, b, f, x, sin 等，可含单引号如 isn't）
  const enRegex = /([a-zA-Z]+(?:'[a-zA-Z]+)?)/g;

  const result = segments
    .map((seg) => {
      if (seg.type === 'protected') return seg.val;
      return seg.val.replace(enRegex, (match) => {
        count++;
        return `$${match}$`;
      });
    })
    .join('');

  return { text: result, count };
}

async function opConvertEnMath(content, payload) {
  const { line } = payload;
  const loc = locateBlock(content, line);
  if (!loc) return err(`第 ${line} 行未命中任何块`);
  const { text: newBlockText, count } = convertEnglishToMath(loc.text);
  if (count === 0) {
    return err('该块内未发现可转换的非公式独立英文词');
  }
  return opReplaceBlock(content, { line, newText: newBlockText });
}

async function opConvertAllEnMath(content, payload) {
  const { body, offset } = parseFile(content);
  const { text: newBody, count } = convertEnglishToMath(body);
  if (count === 0) {
    return err('全篇未发现可转换的非公式独立英文词');
  }
  const fmMatch = content.match(FM_RE);
  const fm = fmMatch ? fmMatch[0] : '';
  const newContent = fm + newBody;
  return ok(newContent);
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
  'convert-en-math': opConvertEnMath,
  'convert-all-en-math': opConvertAllEnMath,
};

const err = (message) => ({ ok: false, message });
const ok = (content) => ({ ok: true, content });

/**
 * 应用一个操作。
 * @param {string} content 当前文件全文
 * @param {string} op 操作名
 * @param {object} payload 操作载荷
 * @returns {Promise<{ok:boolean, content?:string, message?:string}>}
 */
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

  // 写回前校验（与构建同款编译管线）
  const vErr = await validateMdx(result.content);
  if (vErr) return err('修改后的 MDX 校验未通过，已拒绝写入：\n' + vErr);
  return result;
}

export { COMPONENT_BY_KIND, escapeAttr, unescapeAttr };
