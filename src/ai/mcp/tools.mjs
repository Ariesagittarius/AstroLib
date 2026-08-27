import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { collections } from '../../config/collections.config.mjs';
import { generateBookSidebar } from '../../utils/sidebar.mjs';
import { buildBookIndex, walkDir } from '../indexer.mjs';
import { createRetriever } from '../retriever.mjs';
import { CHUNK_TEXT_CAP, mdToText } from '../chunker.mjs';
import { buildOutline, matchChapter, sectionFrom, numberIn } from '../outline.mjs';

const COLLECTION_ROOT = path.resolve('src/content/docs/collections');

const indexCache = new Map();

function resolveBook(col, book) {
  for (const c of collections) {
    if (c.slug !== col) continue;
    const b = c.books.find((x) => x.slug === book);
    if (b) {
      return {
        colSlug: c.slug,
        bookSlug: b.slug,
        title: b.title,
        modules: b.modules || {},
        dir: path.join(COLLECTION_ROOT, c.slug, b.slug),
      };
    }
  }
  throw new Error(`未找到图书 ${col}/${book}（检查 collections.config.mjs）`);
}

function getIndex(col, book) {
  const key = `${col}/${book}`;
  if (!indexCache.has(key)) {
    const meta = resolveBook(col, book);
    indexCache.set(key, buildBookIndex({
      colSlug: meta.colSlug,
      bookSlug: meta.bookSlug,
      bookDir: meta.dir,
      modules: meta.modules,
      title: meta.title,
    }));
  }
  return indexCache.get(key);
}

function sliceSearch({ col, book, pattern, mode = 'regex', limit = 20 }) {
  if (!pattern) throw new Error('缺少 pattern');
  const meta = resolveBook(col, book);
  if (!fs.existsSync(meta.dir)) return { hits: [] };
  let re = null;
  if (mode === 'regex') {
    try { re = new RegExp(pattern, 'i'); } catch { re = null; }
  }
  const hits = [];
  const files = walkDir(meta.dir);
  for (const file of files) {
    if (hits.length >= limit) break;
    const lines = fs.readFileSync(file, 'utf-8').split(/\r?\n/);
    const relDoc = path.relative(path.resolve('src/content/docs'), file).replace(/\\/g, '/');
    for (let i = 0; i < lines.length; i++) {
      const text = mdToText(lines[i]).trim();
      if (!text) continue;
      const ok = re ? re.test(text) : text.toLowerCase().includes(String(pattern).toLowerCase());
      if (ok) {
        hits.push({ doc: relDoc, line: i + 1, text: text.slice(0, 220) });
        if (hits.length >= limit) break;
      }
    }
  }
  return { hits, mode, pattern, limit };
}

export const TOOLS = [
  {
    name: 'list_books',
    description: '列出题库里的合集与图书（col/book/title），用于确定后续工具参数。',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    run: () =>
      collections.map((c) => ({
        collection: c.slug,
        title: c.title,
        books: c.books.map((b) => ({ col: c.slug, book: b.slug, title: b.title })),
      })),
  },
  {
    name: 'book_toc',
    description: '获取一本书的目录结构（章节树），用于确定检索范围或定位章节。',
    inputSchema: {
      type: 'object',
      properties: { col: { type: 'string' }, book: { type: 'string' } },
      required: ['col', 'book'],
      additionalProperties: false,
    },
    run: (args) => {
      const meta = resolveBook(args.col, args.book);
      return { title: meta.title, toc: generateBookSidebar(meta.dir) };
    },
  },
  {
    name: 'book_slice_search',
    description: '在书的 MDX 原文里做正则/子串行级检索，返回命中的薄切片（文档+行+文本）。适合无明确渠道时模糊定位。',
    inputSchema: {
      type: 'object',
      properties: {
        col: { type: 'string' },
        book: { type: 'string' },
        pattern: { type: 'string' },
        mode: { type: 'string', enum: ['regex', 'substring'] },
        limit: { type: 'number' },
      },
      required: ['col', 'book', 'pattern'],
      additionalProperties: false,
    },
    run: sliceSearch,
  },
  {
    name: 'book_retrieve',
    description: '对书内索引做关键词/混合打分检索，返回 topK 语义片段（类型+标题+url+文本）。适合“提问/找知识”场景。',
    inputSchema: {
      type: 'object',
      properties: {
        col: { type: 'string' },
        book: { type: 'string' },
        question: { type: 'string' },
        topK: { type: 'number' },
      },
      required: ['col', 'book', 'question'],
      additionalProperties: false,
    },
    run: ({ col, book, question, topK = 8 }) => {
      const idx = getIndex(col, book);
      const retriever = createRetriever(idx.chunks);
      const results = retriever.search(question, { topK });
      return {
        meta: idx.meta,
        results: results.map((r) => ({
          id: r.chunk.id,
          type: r.chunk.type,
          title: r.chunk.title,
          url: r.chunk.url,
          score: Number(r.score.toFixed(3)),
          text: r.chunk.text.slice(0, CHUNK_TEXT_CAP),
        })),
      };
    },
  },
  {
    name: 'book_chunk',
    description: '按 id 取一本书中的单个片段全文（用于获取更完整上下文）。',
    inputSchema: {
      type: 'object',
      properties: { col: { type: 'string' }, book: { type: 'string' }, id: { type: 'string' } },
      required: ['col', 'book', 'id'],
      additionalProperties: false,
    },
    run: ({ col, book, id }) => {
      const idx = getIndex(col, book);
      const chunk = idx.chunks.find((c) => c.id === id);
      return chunk || null;
    },
  },
  {
    name: 'book_chapter_outline',
    description: '按章号/标题查看某章的大纲：小节标题 + 该章各卡片的类型/编号/标题/跳转 url（用于按标题或编号定位知识点所在章节/段落编号）。不给 chapter 则返回全书章节列表。',
    inputSchema: {
      type: 'object',
      properties: { col: { type: 'string' }, book: { type: 'string' }, chapter: { type: 'string' } },
      required: ['col', 'book'],
      additionalProperties: false,
    },
    run: ({ col, book, chapter }) => {
      const idx = getIndex(col, book);
      const { chapters } = buildOutline(idx.chunks);
      if (!chapter) {
        return {
          meta: idx.meta,
          chapters: chapters.slice(0, 120).map((ch) => ({
            number: ch.number, title: ch.title, url: ch.url,
            sectionCount: ch.sections.length,
            cardCount: ch.sections.reduce((s, sec) => s + sec.cards.length, 0),
          })),
          count: chapters.length,
        };
      }
      const ch = matchChapter(chapters, String(chapter));
      if (!ch) return { found: false };
      return {
        found: true,
        meta: idx.meta,
        chapter: {
          number: ch.number, title: ch.title, url: ch.url,
          sections: ch.sections.map((sec) => ({
            number: sec.number, title: sec.title, url: sec.url, cards: sec.cards.slice(0, 120),
          })),
        },
      };
    },
  },
  {
    name: 'book_read_section',
    description: '从某个片段（id/标题/编号）出发，向后读取一段连续正文（含全文与截断标记），用于精读某章/某范围的原文。',
    inputSchema: {
      type: 'object',
      properties: {
        col: { type: 'string' }, book: { type: 'string' },
        start: { type: 'string' },
        count: { type: 'number' },
        end: { type: 'string' },
      },
      required: ['col', 'book', 'start'],
      additionalProperties: false,
    },
    run: ({ col, book, start, count = 3, end }) => {
      const idx = getIndex(col, book);
      const c = Math.max(1, Math.min(12, Number(count) || 3));
      const res = sectionFrom(idx.chunks, { start: String(start), count: c, end: end ? String(end) : undefined });
      if (!res.found) return { found: false };
      const items = res.items.map((it) => ({
        kind: it.kind, type: it.type, title: it.title, number: it.number, url: it.url,
        text: it.text.slice(0, 1400), truncated: it.text.length > 1400,
      }));
      return { found: true, startIndex: res.startIndex, count: items.length, items };
    },
  },
  {
    name: 'python_exec',
    description: '对输入字符串执行一段 Python（如做文本聚合/统计/片段变换）。需环境有 python 二进制（可用 AI_PYTHON 指定）。',
    inputSchema: {
      type: 'object',
      properties: { code: { type: 'string' }, input: { type: 'string' } },
      required: ['code'],
      additionalProperties: false,
    },
    run: ({ code, input = '' }) => {
      const py = process.env.AI_PYTHON || 'python';
      const out = execFileSync(py, ['-c', code], {
        input,
        encoding: 'utf-8',
        maxBuffer: 4 * 1024 * 1024,
        timeout: 15000,
      });
      return { stdout: out.slice(0, 8000) };
    },
  },
];

export async function execute(name, args = {}) {
  const tool = TOOLS.find((t) => t.name === name);
  if (!tool) throw new Error(`未知工具：${name}`);
  return tool.run(args);
}
