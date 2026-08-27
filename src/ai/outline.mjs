/**
 * src/ai/outline.mjs
 * -----------------------------------------------------------------------------
 * 能力层原语：基于「书内索引 chunks」重建章节结构，为 LLM 提供两种导航能力：
 *   1) 大纲/编号定位：从标题/编号找到某一章，列出它的全部卡片（类型 + 编号 + 标题 + 跳转 url）。
 *   2) 区间正文读取：从某个片段（id/标题/编号/url）出发，向后取一段连续正文。
 *
 * 说明：索引本身是「卡片 + 章节标题」的扁平数组，标题型片段（kind==='heading'）标记一章的开头，
 *     其后的卡片归属该章；据此在读取时原地重建结构即可，无需改动索引格式或重建体积。
 * 本文件为纯函数、无 Node 副作用（不 import fs），可在浏览器与 Node 复用。
 * =============================================================================
 */

/**
 * 从章节/卡片标题里抽出编号（如 "11.2.3 其他著名…"、"$8.5.2$ 用凸性…" → "8.5.2"）。
 * 处理标题前的 $…$ 噪声（数学排版包裹），取最前面的形如 1 / 1.2 / 1.2.3 的数字。
 */
export function numberIn(title) {
  const s = (title || '').replace(/\$/g, '').trim();
  const m = s.match(/^(\d+(?:\.\d+)*)\s*/);
  return m ? m[1] : '';
}

/** 编号的层级深度（"15.1.3" → 3；首页/导言无编号 → 1） */
export function depthOf(title) {
  const n = numberIn(title);
  return n ? n.split('.').length : 1;
}

/** 编号的最高层级（"15.1.3" → "15"；无编号 → ""） */
export function topNumber(title) {
  const n = numberIn(title);
  return n ? n.split('.')[0] : '';
}

/**
 * 重建本书的章节结构（按编号的最高层级聚合成「章」，章下含「小节」与「卡片」）。
 * @param {Array<{ kind, type, title, number, text, url, id }>} chunks
 * @returns {{
 *   chapters: Array<{
 *     number:string, title:string, url:string,
 *     sections: Array<{ number:string, title:string, url:string, cards:Array<{id,type,number,title,url}> }>,
 *   }>,
 *   sections: Array<{ number:string, title:string, url:string, cards:Array }>,
 *   leadCards: Array,
 * }}
 */
export function buildOutline(chunks) {
  const sections = [];
  let curSec = null;
  const leadCards = [];

  for (const c of chunks) {
    if (c.kind === 'heading' && c.title) {
      curSec = { number: numberIn(c.title), title: c.title, url: c.url, cards: [] };
      sections.push(curSec);
    } else if (c.kind === 'card') {
      const card = { id: c.id, type: c.type, number: c.number || numberIn(c.title), title: c.title, url: c.url };
      if (curSec) curSec.cards.push(card);
      else leadCards.push(card);
    }
  }

  // 按「最高层级编号」聚合成章（无编号的归入「导言」）
  const chapters = [];
  const map = new Map();
  for (const s of sections) {
    const top = topNumber(s.title);
    const key = top || '__lead__';
    if (!map.has(key)) {
      const ch = { number: top, title: s.title, url: s.url, sections: [] };
      map.set(key, ch);
      chapters.push(ch);
    }
    map.get(key).sections.push(s);
  }

  return { chapters, sections, leadCards };
}

/**
 * 按查询串找到「章」：先用章号/小节号前缀精确匹配，再退化到「标题子串」匹配（忽略空格/大小写）。
 * @param {Array} chapters buildOutline 返回的 chapters
 * @param {string} q
 * @returns {object|null}
 */
export function matchChapter(chapters, q) {
  const s = (q || '').replace(/\s+/g, '').toLowerCase();
  if (!s) return chapters[0] || null;
  const matchNum = (n) => {
    if (!n) return false;
    return s === n || s === n.toLowerCase() || n.startsWith(s) || n.toLowerCase().startsWith(s);
  };
  for (const ch of chapters) {
    if (matchNum(ch.number)) return ch;
    for (const sec of ch.sections) {
      if (matchNum(sec.number)) return ch;
    }
  }
  for (const ch of chapters) {
    const t = (ch.title || '').replace(/\s+/g, '').toLowerCase();
    if (t.includes(s)) return ch;
    for (const sec of ch.sections) {
      if ((sec.title || '').replace(/\s+/g, '').toLowerCase().includes(s)) return ch;
    }
  }
  return null;
}

/**
 * 定位一个片段的下标（供区间读取使用）。
 * 支持：精确 id / url / 标题相等 / 标题子串 / 编号前缀。
 * 标题匹配会先做归一化（去掉 $…$ 数学包裹、空白与大小写），避免 `$Fourier$` 这类噪声阻断定位。
 * @param {Array<{ id, title, number?, url, kind }>} chunks
 * @param {string} loc
 * @returns {number} -1 表示未找到
 */
export function findChunkIndex(chunks, loc) {
  const s = (loc || '').trim();
  if (!s) return -1;
  const normLoc = normForMatch(s);
  const num = numberIn(s);

  let i = chunks.findIndex((c) => String(c.id || '') === String(s));
  if (i >= 0) return i;

  i = chunks.findIndex((c) => (c.url || '') === s);
  if (i >= 0) return i;

  i = chunks.findIndex((c) => normForMatch(c.title) === normLoc);
  if (i >= 0) return i;

  i = chunks.findIndex((c) => normForMatch(c.title) && normForMatch(c.title).includes(normLoc));
  if (i >= 0) return i;

  if (num) {
    i = chunks.findIndex((c) => {
      const cn = c.number || numberIn(c.title);
      return cn && (cn === num || cn.startsWith(num));
    });
    if (i >= 0) return i;
  }
  return -1;
}

/** 用于匹配的归一化：去数学包裹符号、空白，转小写 */
function normForMatch(x) {
  return (x || '').toLowerCase().replace(/[\$\\{}^_~`|]/g, '').replace(/\s+/g, '');
}

/**
 * 取从 startLoc 起、向后的 count 个片段（含起始），每个带全文（受 CHUNK_TEXT_CAP 上限约束）。
 * @param {Array} chunks
 * @param {{ start:string, count?:number, end?:string }} opts
 * @returns {{ found:boolean, startIndex:number, items:Array<{kind,type,title,number,url,text}> }}
 */
export function sectionFrom(chunks, { start, count = 3, end } = {}) {
  const startIndex = findChunkIndex(chunks, start);
  if (startIndex < 0) return { found: false, startIndex: -1, items: [] };

  let endIndex;
  if (end) {
    endIndex = findChunkIndex(chunks, end);
    if (endIndex < 0) endIndex = startIndex + Math.max(1, count) - 1;
    else if (endIndex < startIndex) endIndex = startIndex;
  } else {
    endIndex = startIndex + Math.max(1, Math.min(12, count)) - 1;
  }
  if (endIndex >= chunks.length) endIndex = chunks.length - 1;

  const items = [];
  for (let k = startIndex; k <= endIndex; k++) {
    const c = chunks[k];
    items.push({ kind: c.kind, type: c.type, title: c.title, number: c.number, url: c.url, text: c.text || '' });
  }
  return { found: true, startIndex, items };
}
