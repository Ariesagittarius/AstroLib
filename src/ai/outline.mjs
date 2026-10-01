export function numberIn(title) {
  const s = (title || '').replace(/\$/g, '').trim();
  const m = s.match(/^(\d+(?:\.\d+)*)\s*/);
  return m ? m[1] : '';
}

export function depthOf(title) {
  const n = numberIn(title);
  return n ? n.split('.').length : 1;
}

export function topNumber(title) {
  const n = numberIn(title);
  return n ? n.split('.')[0] : '';
}

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

function normForMatch(x) {
  return (x || '').toLowerCase().replace(/[\$\\{}^_~`|]/g, '').replace(/\s+/g, '');
}

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
