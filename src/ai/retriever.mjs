/**
 * src/ai/retriever.mjs
 * -----------------------------------------------------------------------------
 * 能力层原语：基于书内索引的关键词/混合打分检索（纯 JS，可在浏览器与 Node 复用）。
 *
 * 设计要点：
 *   · 分词面向中文/数学：CJK 运行切 bigram（对“导数/极限/收敛”覆盖好），
 *     拉丁/数字词按整词保留（公式源码里的 Bessel/Parseval/Fourier/15.1 等可命中）。
 *   · 打分 = 词频 × BM25 式 idf × 词权重，叠加标题命中加权、类型加成与查询词覆盖加成：
 *       - 强标识符加权：拉丁专名（Bessel/Parseval/Fourier）与数字串（15.1/2π）是
 *         最具辨识度的主题词，命中加权最高（×4.0/×3.0），避免高频中文 bigram
 *         （“不等式/等式/逼近”）靠词频累加把它们稀释掉；
 *       - 去噪：LaTeX/数学“背景噪声词”（int/sum/frac、单字母变量 a/b/n/x…）命中
 *         只给极低权重，不让公式噪声撑高得分；
 *       - 覆盖加成：命中的「不同查询词」占比越高，越可能正是问题所指（多关键词问题）。
 *   · createRetriever 对整书索引只做一次 doc-frequency 预计算，之后每次 search
 *     只需对问题做一遍分词打分，满足响应式 UI。
 *   · mode: 'keyword'（V1，零依赖）| 'hybrid'（预留：将来索引叠加静态向量时增加
 *     余弦相似度项；当前与 keyword 等价）。
 *
 * 纯函数、无 Node 副作用，便于构建期与客户端共用。
 * =============================================================================
 */

const CJK = /[\u4e00-\u9fff]/;
const WORD = /[\u4e00-\u9fff]+|[a-z]+|\d+(?:\.?\d+)?/g;

/** 归一化文本并切成检索词：CJK bigram + 拉丁/数字整词 */
export function termsOf(text) {
  const clean = (text || '')
    .toLowerCase()
    .replace(/[$\\{}^_~`|]/g, ' ')     // 去掉公式/代码噪声符号
    .replace(/\s+/g, ' ');
  const words = [];
  let m;
  while ((m = WORD.exec(clean)) !== null) {
    const tok = m[0];
    if (CJK.test(tok)) {
      if (tok.length === 1) {
        words.push(tok);
      } else {
        for (let i = 0; i < tok.length - 1; i++) words.push(tok.slice(i, i + 2));
        words.push(tok);
      }
    } else {
      words.push(tok);
    }
  }
  return words;
}

/** 术语 → 频次 */
function buildFreq(terms) {
  const f = new Map();
  for (const t of terms) f.set(t, (f.get(t) || 0) + 1);
  return f;
}

/** 定义类 / 方法类 关键词（用于提升对应类型片段） */
const DEFINITION_WORDS = ['定义', '是什么', '定理', '概念', '性质', '含义', '原则'];
const METHOD_WORDS = ['如何', '怎么', '方法', '步骤', '求', '证明', '计算', '例题', '解法'];
const DEF_TYPES = new Set(['定理', '定义', '性质', '推论', '引理', '命题', '公理', '结论', '结论总结', '经验总结', '知识点']);
const METHOD_TYPES = new Set(['例', '例题', '方法', '方法总结', '解法', '变式']);

function typeBoost(qTerms, chunkType) {
  const q = qTerms.join('');
  let boost = 0;
  if (DEFINITION_WORDS.some((w) => q.includes(w)) && DEF_TYPES.has(chunkType)) boost += 1.2;
  if (METHOD_WORDS.some((w) => q.includes(w)) && METHOD_TYPES.has(chunkType)) boost += 1.0;
  return boost;
}

/** LaTeX/数学“背景噪声词”：命中它们不代表主题相关，只给极低权重 */
const NOISE_TOKENS = new Set([
  'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p',
  'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
  'int', 'sum', 'frac', 'lim', 'quad', 'mathrm', 'begin', 'end', 'array', 'text',
  'log', 'ln', 'sin', 'cos', 'tan', 'cot', 'left', 'right', 'infty', 'cdot', 'times',
  'sqrt', 'partial', 'to', 'forall', 'exists', 'le', 'ge', 'ne', 'equiv', 'neq', 'propto',
  'mapsto', 'longrightarrow', 'longrightarrow', 'xrightarrow', 'approx', 'cdots', 'dots', 'vert',
]);
/** 是否为“强标识符”（拉丁专名/数字串），极具辨识度 */
function isStrong(t) {
  return /^(?:[a-z]+|\d+(?:\.\d+)*)$/.test(t);
}

/**
 * 单个检索词对打分的贡献权重。
 * @param {string} t 已小写的 token
 */
function termWeight(t) {
  if (!CJK.test(t)) {
    if (NOISE_TOKENS.has(t)) return 0.2;          // LaTeX 变量/命令噪声：极低
    if (/^\d+(?:\.\d+)*$/.test(t)) return 3.0;     // 数字串（15.1、2.5）：强标识符
    if (/^[a-z]+$/.test(t)) return 4.0;            // 拉丁专名（bessel/parseval/fourier）：最强
    return 1.5;                                    // 其它（含数字的混合串）
  }
  if (t.length === 1) return 0.6;                  // 中文单字
  if (t.length >= 3) return 1.8;                   // 中文整词（均方逼近、几何意义）：偏概念
  return 1.0;                                      // 中文 bigram（不等式、定理…）
}

/**
 * 创建针对某书索引的检索器（预计算 doc-frequency 一次）。
 * @param {Array<{ text:string, title?:string, type?:string }>} chunks
 */
export function createRetriever(chunks) {
  const docs = chunks.map((chunk, i) => {
    const text = `${chunk.title || ''} ${chunk.text || ''}`;
    const tf = buildFreq(termsOf(text));
    return { chunk, tf, len: tf.size, idx: i };
  });

  const df = new Map();
  for (const d of docs) for (const t of d.tf.keys()) df.set(t, (df.get(t) || 0) + 1);
  const N = Math.max(1, docs.length);
  const idf = (t) => Math.log((N + 1) / ((df.get(t) || 0) + 0.5));

  /** 判断某个词是否在标题中出现（用于标题命中加权）；按数组下标缓存 */
  const titleTermsCache = new Map();
  const titleTerms = (chunk, idx) => {
    if (!titleTermsCache.has(idx)) {
      titleTermsCache.set(idx, new Set(termsOf(chunk.title || '')));
    }
    return titleTermsCache.get(idx);
  };

  /**
   * 检索 topK 片段。
   * @param {string} question
   * @param {{ topK?:number }} opts
   * @returns {Array<{ chunk, score, hits:string[] }>}
   */
  function search(question, opts = {}) {
    const topK = opts.topK || 8;
    const qTerms = termsOf(question);
    if (!qTerms.length) return [];
    const qSet = new Set(qTerms);
    const qStrong = qTerms.filter((t) => isStrong(t) && !NOISE_TOKENS.has(t));
    const qCword = qTerms.filter((t) => CJK.test(t) && t.length >= 3);
    const HIT_TARGET = Math.max(1, qTerms.length);

    const scored = docs.map((d) => {
      let raw = 0;
      let hitTerms = 0;
      for (const qt of qTerms) {
        const tf = d.tf.get(qt) || 0;
        if (tf) {
          raw += tf * idf(qt) * termWeight(qt);
          hitTerms++;
        }
      }
      if (raw === 0) return { chunk: d.chunk, score: 0, hits: [] };

      const len = d.len;
      let score = raw / Math.sqrt(1 + len);

      // 标题命中加权：强标识符/概念词命中标题时加成更高（专名片段优先）
      const tSet = titleTerms(d.chunk, d.idx);
      if (tSet.size) {
        let titleBonus = 0;
        for (const t of qStrong) if (tSet.has(t)) titleBonus += 2.6;
        for (const t of qCword) if (tSet.has(t)) titleBonus += 1.2;
        if (titleBonus === 0 && qSet.size && tSet.size) {
          const any = [...tSet].some((t) => qSet.has(t));
          if (any) titleBonus += 0.6; // 至少一个普通词命中标题，轻微加成
        }
        score += titleBonus;
      }

      // 类型加成（定义/方法类问题）
      score += typeBoost(qTerms, d.chunk.type);

      // 覆盖加成：命中「不同查询词」比例越高，越贴近整题意图
      const coverage = hitTerms / HIT_TARGET;
      score += coverage * 3.0;

      return { chunk: d.chunk, score, hits: [...qSet].filter((t) => d.tf.has(t)) };
    });

    return scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map((s) => ({ chunk: s.chunk, score: s.score, hits: s.hits }));
  }

  return { search, size: N };
}
