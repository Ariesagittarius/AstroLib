import type { ParagraphLink, ParagraphToken } from './types.ts';

export class BipartiteMatcher {

  static cosineSimilarity(a: Float32Array | number[], b: Float32Array | number[]): number {
    if (a.length !== b.length || a.length === 0) return 0;
    let dot = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      const valA = a[i];
      const valB = b[i];
      dot += valA * valB;
      normA += valA * valA;
      normB += valB * valB;
    }

    if (normA === 0 || normB === 0) return 0;
    const sim = dot / (Math.sqrt(normA) * Math.sqrt(normB));
    return Math.max(0, Math.min(1, Math.round(sim * 10000) / 10000));
  }

  static buildMatrix(
    sourceEmbeddings: (Float32Array | number[])[],
    targetEmbeddings: (Float32Array | number[])[]
  ): number[][] {
    const M = sourceEmbeddings.length;
    const N = targetEmbeddings.length;
    const matrix: number[][] = Array.from({ length: M }, () => new Array(N).fill(0));

    for (let i = 0; i < M; i++) {
      for (let j = 0; j < N; j++) {
        matrix[i][j] = this.cosineSimilarity(sourceEmbeddings[i], targetEmbeddings[j]);
      }
    }

    return matrix;
  }

  static extractLinks(
    matrix: number[][],
    sources: ParagraphToken[],
    targets: ParagraphToken[],
    options: {
      threshold?: number;
      maxPerSource?: number;
      monotonicBias?: number;
    } = {}
  ): ParagraphLink[] {
    const threshold = options.threshold ?? 0.6;
    const maxPerSource = options.maxPerSource ?? 3;
    const monotonicBias = options.monotonicBias ?? 0;

    const M = matrix.length;
    const N = M > 0 ? matrix[0].length : 0;
    if (M === 0 || N === 0) return [];

    const links: ParagraphLink[] = [];

    for (let i = 0; i < M; i++) {
      const candidates: { j: number; score: number; rawScore: number }[] = [];
      const relPosI = M > 1 ? i / (M - 1) : 0;

      for (let j = 0; j < N; j++) {
        let score = matrix[i][j];

        if (monotonicBias > 0) {
          const relPosJ = N > 1 ? j / (N - 1) : 0;
          const posDiff = Math.abs(relPosI - relPosJ);
          const penalty = posDiff * monotonicBias;
          score = Math.max(0, score - penalty);
        }

        if (score >= threshold) {
          candidates.push({ j, score, rawScore: matrix[i][j] });
        }
      }

      candidates.sort((a, b) => b.score - a.score);

      const topCandidates = candidates.slice(0, maxPerSource);
      topCandidates.forEach((c, rank) => {
        links.push({
          sourceIndex: i,
          sourceId: sources[i]?.id ?? `src-${i}`,
          targetIndex: c.j,
          targetId: targets[c.j]?.id ?? `tgt-${c.j}`,
          similarity: c.rawScore,
          isPrimary: rank === 0,
        });
      });
    }

    return links;
  }
}
