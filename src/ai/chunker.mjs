import { slug as githubSlug } from 'github-slugger';

export const CARD_NAMES = new Set([
  'Example', 'Variant', 'Knowledge', 'Summary', 'Method', 'Conclusion',
  'Block', 'Exercise', 'Solution', 'Guide', 'Note',
]);

export const CHUNK_TEXT_CAP = 2000;

const EMOJI_RE = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}\u{27BF}\uFE0F]/gu;

export function detectType(title, modules) {
  const t = (title || '').trim().replace(EMOJI_RE, '').trim();
  for (const [modKey, modMeta] of Object.entries(modules || {})) {
    const aliases = modMeta.aliases || [modKey];
    for (const alias of aliases) {
      const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`^(${escaped})\\s*(\\$?[\\d\\s\\.].*)$`, 'i');
      const m = t.match(regex);
      if (m) return { type: modKey, number: m[2].trim() };
    }
  }
  if (t.includes('导读')) return { type: '导读', number: '' };
  return { type: '模块', number: t };
}

export function splitFrontmatter(source) {
  const s = source.replace(/^\uFEFF/, '');
  const m = s.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { title: '', body: s };
  const titleMatch = m[1].match(/^title:\s*['"](.*?)['"]/m);
  return { title: titleMatch ? titleMatch[1].trim() : '', body: s.slice(m[0].length) };
}

export function mdToText(text) {
  let s = (text || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/(\*\*|__|\*|_|~~)/g, ' ')
    .replace(/^#{1,6}\s+/gm, ' ')
    .replace(/[ \t]+/g, ' ')
    .trim();
  return s;
}

export function capText(text, cap = CHUNK_TEXT_CAP) {
  if (text.length <= cap) return text;
  const cut = text.slice(0, cap);
  const lastSpace = cut.lastIndexOf(' ');
  return lastSpace > cap * 0.6 ? cut.slice(0, lastSpace) : cut;
}

function buildSections(body) {
  const heads = [];
  const headingRe = /^(#{1,6})\s+(.+?)\s*$/gm;
  let m;
  while ((m = headingRe.exec(body)) !== null) {
    heads.push({ level: m[1].length, text: m[2].trim(), index: m.index, line: lineOf(body, m.index) });
  }

  const sections = [];
  const firstIdx = heads.length ? heads[0].index : body.length;
  const lead = body.slice(0, firstIdx);
  if (lead.trim()) sections.push({ heading: null, body: lead, start: 0 });

  for (let i = 0; i < heads.length; i++) {
    const h = heads[i];
    const end = i + 1 < heads.length ? heads[i + 1].index : body.length;
    const raw = body.slice(h.index, end);
    const bodyAfterHeading = raw.replace(/^#{1,6}\s+.+?\s*$/, '');
    sections.push({ heading: h, body: bodyAfterHeading, start: h.line });
  }
  return sections;
}

function extractCards(secText) {
  const re = new RegExp(
    `<(${Array.from(CARD_NAMES).join('|')})\\b([^>]*?)\\btitle=["']([^"']+)["'][^>]*>([\\s\\S]*?)</\\1>`,
    'g',
  );
  const cards = [];
  let cm;
  while ((cm = re.exec(secText)) !== null) {
    cards.push({ component: cm[1], title: cm[3].trim(), body: cm[4], offset: cm.index });
  }
  return cards;
}

function stripCards(secText) {
  return secText
    .replace(new RegExp(`<(${Array.from(CARD_NAMES).join('|')})\\b[^>]*>[\\s\\S]*?<\\/\\1>`, 'g'), ' ')
    .replace(new RegExp(`<(${Array.from(CARD_NAMES).join('|')})\\b[^>]*\\/\\s*>`, 'g'), ' ');
}

export function chunkMdx({ source, modules = {} }) {
  const { title: pageTitle, body } = splitFrontmatter(source);
  const sections = buildSections(body);
  const chunks = [];

  for (const sec of sections) {
    const secHeading = sec.heading;
    const secText = sec.body || '';

    const cards = extractCards(secText);
    for (const c of cards) {
      const { type, number } = detectType(c.title, modules);
      chunks.push({
        kind: 'card',
        type,
        title: c.title,
        number,
        text: capText(mdToText(c.body)),
        anchor: c.title.replace(/\s+/g, '-'),
        line: sec.start + lineOf(secText, c.offset),
      });
    }

    const prose = mdToText(stripCards(secText));
    if (prose && !/^import\b/.test(prose)) {
      const title = (secHeading && secHeading.text) || pageTitle || '';
      chunks.push({
        kind: 'heading',
        type: '',
        title,
        number: '',
        text: capText(prose),
        anchor: secHeading ? githubSlug(secHeading.text) : '',
        line: sec.start,
      });
    }
  }

  return chunks;
}

function lineOf(text, index) {
  return text.slice(0, index).split('\n').length;
}
