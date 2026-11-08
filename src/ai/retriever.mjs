const CJK = /[\u4e00-\u9fff]/;
const WORD = /[\u4e00-\u9fff]+|[a-z]+|\d+(?:\.?\d+)?/g;

export function termsOf(text) {
  const clean = (text || '')
    .toLowerCase()
    .replace(/[$\\{}^_~`|]/g, ' ')
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

function buildFreq(terms) {
  const f = new Map();
  for (const t of terms) f.set(t, (f.get(t) || 0) + 1);
  return f;
}

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

const NOISE_TOKENS = new Set([
  'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p',
  'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
  'int', 'sum', 'frac', 'lim', 'quad', 'mathrm', 'begin', 'end', 'array', 'text',
  'log', 'ln', 'sin', 'cos', 'tan', 'cot', 'left', 'right', 'infty', 'cdot', 'times',
  'sqrt', 'partial', 'to', 'forall', 'exists', 'le', 'ge', 'ne', 'equiv', 'neq', 'propto',
  'mapsto', 'longrightarrow', 'longrightarrow', 'xrightarrow', 'approx', 'cdots', 'dots', 'vert',
]);

function isStrong(t) {
  return /^(?:[a-z]+|\d+(?:\.\d+)*)$/.test(t);
}

function termWeight(t) {
  if (!CJK.test(t)) {
    if (NOISE_TOKENS.has(t)) return 0.2;
    if (/^\d+(?:\.\d+)*$/.test(t)) return 3.0;
    if (/^[a-z]+$/.test(t)) return 4.0;
    return 1.5;
  }
  if (t.length === 1) return 0.6;
  if (t.length >= 3) return 1.8;
  return 1.0;
}

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

  const titleTermsCache = new Map();
  const titleTerms = (chunk, idx) => {
    if (!titleTermsCache.has(idx)) {
      titleTermsCache.set(idx, new Set(termsOf(chunk.title || '')));
    }
    return titleTermsCache.get(idx);
  };

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

      const tSet = titleTerms(d.chunk, d.idx);
      if (tSet.size) {
        let titleBonus = 0;
        for (const t of qStrong) if (tSet.has(t)) titleBonus += 2.6;
        for (const t of qCword) if (tSet.has(t)) titleBonus += 1.2;
        if (titleBonus === 0 && qSet.size && tSet.size) {
          const any = [...tSet].some((t) => qSet.has(t));
          if (any) titleBonus += 0.6;
        }
        score += titleBonus;
      }

      score += typeBoost(qTerms, d.chunk.type);

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
