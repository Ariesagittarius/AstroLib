import { describe, it, expect } from 'vitest';
import { BipartiteMatcher } from '../../src/services/bilingual/bipartite-matcher.ts';
import { BilingualAlignerClient } from '../../src/services/bilingual/aligner-client.ts';
import { BilingualOnnxEngine } from '../../src/server/plugins/bilingual-aligner/onnx-engine.ts';
import type { ParagraphToken } from '../../src/services/bilingual/types.ts';

describe('BipartiteMatcher', () => {
  it('calculates cosine similarity correctly', () => {
    const a = new Float32Array([1, 0, 0]);
    const b = new Float32Array([1, 0, 0]);
    const c = new Float32Array([0, 1, 0]);
    const d = new Float32Array([-1, 0, 0]);

    expect(BipartiteMatcher.cosineSimilarity(a, b)).toBe(1);
    expect(BipartiteMatcher.cosineSimilarity(a, c)).toBe(0);
    expect(BipartiteMatcher.cosineSimilarity(a, d)).toBe(0); // clamped to 0
  });

  it('builds an M x N similarity matrix', () => {
    const embedsA = [
      new Float32Array([1, 0]),
      new Float32Array([0, 1]),
    ];
    const embedsB = [
      new Float32Array([1, 0]),
      new Float32Array([0.7071, 0.7071]),
      new Float32Array([0, 1]),
    ];

    const matrix = BipartiteMatcher.buildMatrix(embedsA, embedsB);
    expect(matrix.length).toBe(2);
    expect(matrix[0].length).toBe(3);
    expect(matrix[0][0]).toBe(1);
    expect(matrix[1][2]).toBe(1);
    expect(matrix[0][1]).toBeGreaterThan(0.7);
  });

  it('filters links by threshold and respects maxPerSource', () => {
    const matrix = [
      [0.9, 0.7, 0.4],
      [0.2, 0.85, 0.65],
    ];
    const sources: ParagraphToken[] = [
      { id: 'src-0', index: 0, text: 'intro', type: 'paragraph' },
      { id: 'src-1', index: 1, text: 'algo', type: 'paragraph' },
    ];
    const targets: ParagraphToken[] = [
      { id: 'tgt-0', index: 0, text: '引言', type: 'paragraph' },
      { id: 'tgt-1', index: 1, text: '算法', type: 'paragraph' },
      { id: 'tgt-2', index: 2, text: '总结', type: 'paragraph' },
    ];

    const links = BipartiteMatcher.extractLinks(matrix, sources, targets, {
      threshold: 0.6,
      maxPerSource: 1,
    });

    expect(links.length).toBe(2);
    expect(links[0].sourceId).toBe('src-0');
    expect(links[0].targetId).toBe('tgt-0');
    expect(links[0].isPrimary).toBe(true);
    expect(links[1].sourceId).toBe('src-1');
    expect(links[1].targetId).toBe('tgt-1');
  });

  it('applies monotonic bias for sequential chapters when enabled', () => {
    const matrix = [
      [0.85, 0.3, 0.86], // src-0 is slightly similar to tgt-2, but tgt-2 is far away
    ];
    const sources: ParagraphToken[] = [
      { id: 'src-0', index: 0, text: 'first paragraph', type: 'paragraph' },
    ];
    const targets: ParagraphToken[] = [
      { id: 'tgt-0', index: 0, text: '第一段', type: 'paragraph' },
      { id: 'tgt-1', index: 1, text: '第二段', type: 'paragraph' },
      { id: 'tgt-2', index: 2, text: '结尾段', type: 'paragraph' },
    ];

    // Without monotonic bias, tgt-2 has higher score (0.86 > 0.85)
    const unbiased = BipartiteMatcher.extractLinks(matrix, sources, targets, {
      threshold: 0.6,
      maxPerSource: 1,
      monotonicBias: 0,
    });
    expect(unbiased[0].targetId).toBe('tgt-2');

    // With monotonic bias, tgt-2 is penalized because of position distance (posDiff = 1.0)
    const biased = BipartiteMatcher.extractLinks(matrix, sources, targets, {
      threshold: 0.6,
      maxPerSource: 1,
      monotonicBias: 0.1,
    });
    expect(biased[0].targetId).toBe('tgt-0');
  });
});

describe('BilingualOnnxEngine', () => {
  it('instantiates as singleton', () => {
    const engine1 = BilingualOnnxEngine.getInstance();
    const engine2 = BilingualOnnxEngine.getInstance();
    expect(engine1).toBe(engine2);
  });

  it('provides fallback lexical matrix when offline or loading', async () => {
    const engine = BilingualOnnxEngine.getInstance();
    const src = ['Sorting algorithm with divide and conquer', 'Graph search DFS'];
    const tgt = ['分治排序算法', '图搜索深度优先遍历'];

    const matrix = engine.buildLexicalMatrix(src, tgt);
    expect(matrix.length).toBe(2);
    expect(matrix[0].length).toBe(2);
  });
});

describe('BilingualAlignerClient (Multilingual Paragraph Tokenizer & Fallback)', () => {
  it('extracts numbers, math formulas, Latin terms and Chinese bigrams', () => {
    const enText = 'Karatsuba discovered a divide-and-conquer algorithm in 1960 with $T(n) = 3T(n/2) + O(n)$.';
    const tokensEn = BilingualAlignerClient.tokenizeMultilingual(enText);

    expect(tokensEn.has('1960')).toBe(true);
    expect(tokensEn.has('karatsuba')).toBe(true);
    expect(tokensEn.has('$t(n)=3t(n/2)+o(n)$')).toBe(true);
    // Cognate mapping: algorithm -> 算法, divide -> 分治
    expect(tokensEn.has('算法')).toBe(true);
    expect(tokensEn.has('分治')).toBe(true);

    const zhText = '1960 年卡拉楚巴提出分治算法，得到递推式 $T(n) = 3T(n/2) + O(n)$。';
    const tokensZh = BilingualAlignerClient.tokenizeMultilingual(zhText);

    expect(tokensZh.has('1960')).toBe(true);
    expect(tokensZh.has('分治')).toBe(true);
    expect(tokensZh.has('算法')).toBe(true);
    expect(tokensZh.has('$t(n)=3t(n/2)+o(n)$')).toBe(true);
  });

  it('aligns Algorithms Chapter 02.1 paragraphs using fallbackLexicalMatrix', () => {
    const sources: ParagraphToken[] = [
      { id: 'src-0', index: 0, text: '# 02.1 Multiplication', type: 'heading' },
      { id: 'src-1', index: 1, text: 'The algorithm we all learned in school takes $O(n^2)$ time to multiply two $n$-bit integers.', type: 'paragraph' },
      { id: 'src-2', index: 2, text: 'In 1960, Anatoly Karatsuba discovered a revolutionary divide-and-conquer algorithm with recurrence $T(n) = 3T(n/2) + O(n)$.', type: 'paragraph' },
    ];

    const targets: ParagraphToken[] = [
      { id: 'tgt-0', index: 0, text: '# 02.1 整数乘法算法与分治策略', type: 'heading' },
      { id: 'tgt-1', index: 1, text: '计算两个 $n$ 位整数需要做 $n^2$ 次乘法，时间复杂度为 $O(n^2)$。', type: 'paragraph' },
      { id: 'tgt-2', index: 2, text: '1960 年卡拉楚巴（Anatoly Karatsuba）提出了一种分治算法，由此导出的递归关系为 $T(n) = 3T(n/2) + O(n)$。', type: 'paragraph' },
    ];

    const matrix = BilingualAlignerClient.fallbackLexicalMatrix(sources, targets);

    // Diagonal elements should be highest
    expect(matrix[0][0]).toBeGreaterThan(matrix[0][1]);
    expect(matrix[1][1]).toBeGreaterThan(matrix[1][0]);
    expect(matrix[2][2]).toBeGreaterThan(matrix[2][0]);

    // Heading match score
    expect(matrix[0][0]).toBeGreaterThan(0.5);
    // Formula and number match scores
    expect(matrix[1][1]).toBeGreaterThan(0.5);
    expect(matrix[2][2]).toBeGreaterThan(0.5);

    const links = BipartiteMatcher.extractLinks(matrix, sources, targets, {
      threshold: 0.5,
      maxPerSource: 1,
      monotonicBias: 0.1,
    });

    expect(links.length).toBe(3);
    expect(links[0].sourceId).toBe('src-0');
    expect(links[0].targetId).toBe('tgt-0');
    expect(links[1].sourceId).toBe('src-1');
    expect(links[1].targetId).toBe('tgt-1');
    expect(links[2].sourceId).toBe('src-2');
    expect(links[2].targetId).toBe('tgt-2');
  });
});

