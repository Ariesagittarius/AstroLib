/**
 * src/ai/chunker.mjs
 * -----------------------------------------------------------------------------
 * 能力层原语：把一篇 MDX 切成语义片段（chunk）。
 *
 * 复用现有全站约定，不重复造轮子：
 *   · 卡片识别：与 rehype-cross-ref / PageSidebarOverride 相同的组件名集合，
 *     以及相同的“卡片 id = title.trim().replace(/\s+/g, '-')”锚点规则；
 *   · 类型检测：与 parseTitleFromConfig 一致的“标题前缀 → 模块 key”分词；
 *   · 标题锚点：与 Astro 默认一致的 github-slugger slug。
 *
 * 片段是“读者已熟悉的语义单元”（例题/定理/定义/标题），而非任意长度文本，
 * 因此检索命中即能精确跳转到源卡片（url 由 indexer 用 cleanSlug 拼装）。
 *
 * 纯函数、无 Node 副作用（不 import fs）；仅依赖 github-slugger，可在构建期
 * 与客户端复用同一份逻辑。
 * =============================================================================
 */
import { slug as githubSlug } from 'github-slugger';

/** 与 rehype-cross-ref COMPONENT_CLASS 保持一致的卡片组件名集合 */
export const CARD_NAMES = new Set([
  'Example', 'Variant', 'Knowledge', 'Summary', 'Method', 'Conclusion',
  'Block', 'Exercise', 'Solution', 'Guide', 'Note',
]);

/** 单片段文本上限：索引与生成上下文均以它为界，控制体积与成本 */
export const CHUNK_TEXT_CAP = 2000;

/** 剔除 emoji（与客户端 EMOJI_RE 一致） */
const EMOJI_RE = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}\u{27BF}\uFE0F]/gu;

/**
 * 与 parseTitleFromConfig 一致的标题分词：返回 { type: 模块key, number: 编号 }。
 * modules 为某本书的 modules 配置（collections.config.mjs 里 book.modules）。
 */
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

/** 剥离 frontmatter，返回正文与 frontmatter title */
export function splitFrontmatter(source) {
  const s = source.replace(/^\uFEFF/, '');
  const m = s.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { title: '', body: s };
  const titleMatch = m[1].match(/^title:\s*['"](.*?)['"]/m);
  return { title: titleMatch ? titleMatch[1].trim() : '', body: s.slice(m[0].length) };
}

/** 把 MDX 片段转为可检索的纯文本（保留中文/数字/字母与公式源码，剥离 JSX/图片/强调） */
export function mdToText(text) {
  let s = (text || '')
    .replace(/<[^>]*>/g, ' ')                         // JSX 组件标签与属性
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')            // 图片 ![alt](url)
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')          // 链接 [text](url) -> text
    .replace(/`([^`]*)`/g, '$1')                      // 行内代码
    .replace(/(\*\*|__|\*|_|~~)/g, ' ')               // 强调/删除线标记
    .replace(/^#{1,6}\s+/gm, ' ')                     // 标题记号
    .replace(/[ \t]+/g, ' ')                          // 折叠空白
    .trim();
  return s;
}

/** 截断片段到上限（在词边界处截断，避免切断中文词） */
export function capText(text, cap = CHUNK_TEXT_CAP) {
  if (text.length <= cap) return text;
  const cut = text.slice(0, cap);
  const lastSpace = cut.lastIndexOf(' ');
  return lastSpace > cap * 0.6 ? cut.slice(0, lastSpace) : cut;
}

/**
 * 按标题分节：每节 = 一个标题行到下一标题行之间的正文。
 * bodyAfterHeading 去掉标题行本身（避免把标题重复计入正文）。
 */
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

/** 从节正文中提取卡片块（组件名 + title + 内容），返回 [{component, title, body, offset}] */
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

/** 去掉节正文里的所有卡片块（含其内部内容），得到“卡片外的散文” */
function stripCards(secText) {
  return secText
    .replace(new RegExp(`<(${Array.from(CARD_NAMES).join('|')})\\b[^>]*>[\\s\\S]*?<\\/\\1>`, 'g'), ' ')
    .replace(new RegExp(`<(${Array.from(CARD_NAMES).join('|')})\\b[^>]*\\/\\s*>`, 'g'), ' ');
}

/**
 * 把一个 MDX 文件切成 chunks。
 *
 * @param {{
 *   source: string,
 *   modules?: Record<string, any>,
 * }} params
 * @returns {Array<{
 *   kind: 'card' | 'heading',
 *   type: string,
 *   title: string,     // 卡片 title 或标题文本
 *   number: string,    // 编号（卡片才有；标题为 ''）
 *   text: string,      // 可检索纯文本（已 cap）
 *   anchor: string,    // 用于生成 url 的锚点（卡片=title 去空格，标题=github slug）
 *   line: number,      // 在源文件中的大致位置（调试用）
 * }>}
 */
export function chunkMdx({ source, modules = {} }) {
  const { title: pageTitle, body } = splitFrontmatter(source);
  const sections = buildSections(body);
  const chunks = [];

  for (const sec of sections) {
    const secHeading = sec.heading;
    const secText = sec.body || '';

    // 1) 卡片片段
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

    // 2) 散文片段（卡片之外的正文）：有实质内容则单独成段，保证未被卡片覆盖的正文也可检索
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
