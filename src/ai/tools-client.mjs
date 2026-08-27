/**
 * src/ai/tools-client.mjs
 * -----------------------------------------------------------------------------
 * 客户端可执行的检索工具：把“书内查找”能力暴露给 LLM（OpenAI function-calling），
 * 全部基于【已加载的书内索引】+【注入的图书清单】实现，静态站零后端、零每令牌外成本。
 *
 * 与 src/ai/mcp/tools.mjs（Node 侧，含 fs/child_process/python_exec）不同，这里的
 * 工具只做可安全在浏览器执行的检索：
 *   list_books / book_toc / book_retrieve / book_chunk / book_slice_search /
 *   book_chapter_outline / book_read_section。
 * python_exec 等文件级工具保留在 Node MCP server。
 *
 * 相关性改进：
 *   · book_retrieve 采用“强标识符加权”打分（见 retriever.mjs），并返回命中词；
 *   · book_chapter_outline 让模型按标题/编号直接查看某章大纲（小节 + 各卡片编号/锚点）；
 *   · book_read_section 让模型直接读取一片连续正文（含全文与被截断标记）；
 *   · book_slice_search 返回命中上下文窗口 + 可跳转 url。
 *
 * 每个结果都“薄切片化”：文本截断到固定上限，避免把超长内容塞进模型上下文。
 * =============================================================================
 */
import { createRetriever } from './retriever.mjs';
import { buildOutline, matchChapter, sectionFrom } from './outline.mjs';

const TEXT_CAP = 800;             // 检索/取片段单条文本上限
const SECTION_TEXT_CAP = 1400;    // 区间读取单条文本上限（正文较长）

/** 截断文本到上限，尾部不切片尽量在词边界 */
function cap(s, n = TEXT_CAP) {
  const t = (s || '').trim();
  if (t.length <= n) return { text: t, truncated: false };
  const cut = t.slice(0, n);
  const sp = cut.lastIndexOf(' ');
  return { text: sp > n * 0.6 ? cut.slice(0, sp) : cut, truncated: true };
}

/** 把单一文本截断为字符串（用于旧字段兼容） */
function capStr(s, n = TEXT_CAP) {
  return cap(s, n).text;
}

/** 在文本里取命中词附近的一张“上下文窗口”切片（供正则/子串命中时给模型定位） */
function matchWindow(text, needle, mode, radius = 130) {
  const t = (text || '').trim();
  if (!t) return '';
  let index = -1;
  if (mode === 'regex') {
    let re = null;
    try { re = new RegExp(needle, 'i'); } catch { re = null; }
    if (re) { const m = re.exec(t); if (m) index = m.index; }
  } else {
    index = t.toLowerCase().indexOf(String(needle).toLowerCase());
  }
  if (index < 0) return t.slice(0, radius * 2);
  const start = Math.max(0, index - radius);
  const end = Math.min(t.length, index + String(needle).length + radius);
  return `${start > 0 ? '…' : ''}${t.slice(start, end)}${end < t.length ? '…' : ''}`;
}

/**
 * 生成用于 OpenAI function-calling 的工具定义数组（请求体的 tools 字段）。
 * @returns {Array<{type:'function', function:{name:string, description:string, parameters:object}}>}
 */
export function buildToolDefs() {
  return [
    {
      type: 'function',
      function: {
        name: 'list_books',
        description: '列出这家题库里的合集与图书（col/book/title），用于确定检索范围或了解有哪些书。', 
        parameters: {
          type: 'object',
          properties: {},
          additionalProperties: false,
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'book_toc',
        description: '获取当前检索图书的目录结构（章节/卡片标题列表），用于定位章节或确定检索范围。',
        parameters: {
          type: 'object',
          properties: {},
          additionalProperties: false,
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'book_retrieve',
        description: '对当前书知识库做关键词检索，返回 topK 语义片段（类型+标题+正文+跳转 url+命中词）。适合“提问/找知识点”场景。',
        parameters: {
          type: 'object',
          properties: {
            question: { type: 'string', description: '要检索的问题或关键词' },
            topK: { type: 'number', description: '返回片段数（默认 6，1~12）' },
          },
          required: ['question'],
          additionalProperties: false,
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'book_chunk',
        description: '按 id 取当前书中的一个片段全文（用于获取更完整上下文）。',
        parameters: {
          type: 'object',
          properties: {
            id: { type: 'string', description: '片段 id，来自 book_retrieve 返回的 id' },
          },
          required: ['id'],
          additionalProperties: false,
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'book_slice_search',
        description: '在当前书知识库的片段文本里做子串/正则匹配，返回命中的薄切片（类型+标题+跳转 url+命中上下文窗口）。适合“书名/术语/编号”等精确词定位。',
        parameters: {
          type: 'object',
          properties: {
            pattern: { type: 'string', description: '要匹配的子串或正则' },
            mode: { type: 'string', enum: ['substring', 'regex'], description: '匹配方式（默认 substring）' },
            limit: { type: 'number', description: '命中上限（默认 8，1~20）' },
          },
          required: ['pattern'],
          additionalProperties: false,
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'book_chapter_outline',
        description: '按章号/标题查看某章的大纲：小节标题 + 该章各卡片的类型/编号/标题/跳转 url（用来“按标题或编号定位知识点所在章节/段落编号”）。不给 chapter 则返回全书章节列表。',
        parameters: {
          type: 'object',
          properties: {
            chapter: { type: 'string', description: '章号或标题关键词，如 "15"、"11.2"、"Fourier"；留空返回全书章列表' },
          },
          additionalProperties: false,
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'book_read_section',
        description: '从某个片段（id/标题/编号）出发，向后读取一段连续正文（含全文与截断标记）。用于“精读某章/某范围的原文”。',
        parameters: {
          type: 'object',
          properties: {
            start: { type: 'string', description: '起始片段：片段 id、标题、或编号（如 "15.1"、"Fourier系数的几何意义"）' },
            count: { type: 'number', description: '向后读取的片段数（默认 3，1~12）' },
            end: { type: 'string', description: '可选的终止片段（同 start 类型）；给出则读到它为止' },
          },
          required: ['start'],
          additionalProperties: false,
        },
      },
    },
  ];
}

/** 工具名 → 人类可读描述（用于“可用工具”提示，保持简短） */
export function toolsDesc() {
  return [
    'list_books（列出图书）、book_toc（当前书目录）、book_retrieve（检索当前书知识库）、',
    'book_chunk（按 id 取片段全文）、book_slice_search（片段文本子串/正则匹配）、',
    'book_chapter_outline（按编号/标题查看某章大纲与段落编号）、book_read_section（读取某范围正文）',
  ].join('');
}

/**
 * 执行一个客户端工具（供工具循环调用）。
 * @param {string} name
 * @param {object} args
 * @param {{ index:object, bookList:Array, col:string, book:string }} ctx
 * @returns {Promise<any>}
 */
export async function runClientTool(name, args = {}, ctx = {}) {
  const idx = ctx.index;
  switch (name) {
    case 'list_books': {
      const list = ctx.bookList || [];
      return { books: list };
    }
    case 'book_toc': {
      const chunks = idx?.chunks || [];
      const headings = chunks.filter((c) => c.kind === 'heading' && c.title);
      const seen = new Set();
      const toc = [];
      for (const h of headings) {
        const key = `${h.url}|${h.title}`;
        if (seen.has(key)) continue;
        seen.add(key);
        toc.push({ title: h.title, url: h.url });
      }
      return { book: idx?.meta?.book, title: idx?.meta?.title, count: idx?.meta?.count, toc: toc.slice(0, 120) };
    }
    case 'book_retrieve': {
      const chunks = idx?.chunks || [];
      const retriever = createRetriever(chunks);
      const topK = Math.max(1, Math.min(12, Number(args.topK) || 6));
      const results = retriever.search(String(args.question || ''), { topK });
      return {
        results: results.map((r) => {
          const { text, truncated } = cap(r.chunk.text);
          return {
            id: r.chunk.id,
            type: r.chunk.type,
            title: r.chunk.title,
            url: r.chunk.url,
            score: Number(r.score.toFixed(3)),
            matched: (r.hits || []).slice(0, 8),
            text,
            truncated,
          };
        }),
        count: results.length,
      };
    }
    case 'book_chunk': {
      const chunk = (idx?.chunks || []).find((c) => c.id === String(args.id || ''));
      if (!chunk) return { found: false };
      const { text, truncated } = cap(chunk.text);
      return { found: true, id: chunk.id, type: chunk.type, title: chunk.title, url: chunk.url, text, truncated };
    }
    case 'book_slice_search': {
      const m = String(args.pattern || '');
      if (!m) throw new Error('缺少 pattern');
      const limit = Math.max(1, Math.min(20, Number(args.limit) || 8));
      const mode = args.mode === 'regex' ? 'regex' : 'substring';
      let re = null;
      if (mode === 'regex') {
        try { re = new RegExp(m, 'i'); } catch { re = null; }
      }
      // 子串匹配先归一化（去 $…$/空白），避免 `$Fourier$` 这类噪声阻断“Fourier系数”之类精确词
      const norm = (x) => (x || '').toLowerCase().replace(/[\$\\{}^_~`|]/g, '').replace(/\s+/g, '');
      const normPat = mode === 'substring' ? norm(m) : '';
      const hits = [];
      for (const c of idx?.chunks || []) {
        if (hits.length >= limit) break;
        let ok;
        if (mode === 'regex') {
          ok = re ? re.test(c.text || '') : false;
        } else {
          const nt = norm(c.text);
          ok = nt && nt.includes(normPat);
        }
        if (ok) {
          hits.push({
            id: c.id,
            type: c.type,
            title: c.title,
            url: c.url,
            text: capStr(c.text),
            context: matchWindow(c.text, m, mode),
          });
        }
      }
      return { hits, count: hits.length, mode };
    }
    case 'book_chapter_outline': {
      const chunks = idx?.chunks || [];
      const { chapters } = buildOutline(chunks);
      const MAX_CHAP = 120;
      if (!args.chapter) {
        return {
          book: idx?.meta?.book,
          chapters: chapters.slice(0, MAX_CHAP).map((ch) => ({
            number: ch.number,
            title: ch.title,
            url: ch.url,
            sectionCount: ch.sections.length,
            cardCount: ch.sections.reduce((s, sec) => s + sec.cards.length, 0),
          })),
          count: chapters.length,
        };
      }
      const ch = matchChapter(chapters, String(args.chapter));
      if (!ch) return { found: false };
      // 总量上限：单章可能含上千卡片，避免把超长大纲塞进上下文（成本约束）
      const MAX_SECTIONS = 100;
      const MAX_CARDS = 500;
      let budget = MAX_CARDS;
      return {
        found: true,
        chapter: {
          number: ch.number,
          title: ch.title,
          url: ch.url,
          sections: ch.sections.slice(0, MAX_SECTIONS).map((sec) => {
            const cards = [];
            for (const card of sec.cards) {
              if (budget <= 0) break;
              cards.push(card);
              budget--;
            }
            return { number: sec.number, title: sec.title, url: sec.url, cards };
          }),
        },
      };
    }
    case 'book_read_section': {
      const chunks = idx?.chunks || [];
      const count = Math.max(1, Math.min(12, Number(args.count) || 3));
      const res = sectionFrom(chunks, { start: String(args.start || ''), count, end: args.end ? String(args.end) : undefined });
      if (!res.found) return { found: false };
      let total = 0;
      let truncatedAll = false;
      const items = res.items.map((it) => {
        const c = cap(it.text, SECTION_TEXT_CAP);
        total += c.text.length;
        if (c.truncated) truncatedAll = true;
        return { kind: it.kind, type: it.type, title: it.title, number: it.number, url: it.url, text: c.text, truncated: c.truncated };
      });
      return { found: true, startIndex: res.startIndex, count: items.length, items, truncated: truncatedAll };
    }
    default:
      throw new Error(`未知工具：${name}`);
  }
}
