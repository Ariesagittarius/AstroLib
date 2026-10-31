/**
 * src/services/bilingual/bipartite-matcher.ts
 * ============================================================================
 * AstroLib 双语对照与跨书关联匹配算法引擎 (Bipartite & Fuzzy Matrix Matcher)
 * ============================================================================
 * 纯函数算法模块，负责：
 * 1. 向量余弦相似度计算与矩阵构建
 * 2. 动态阈值多向关联提取
 * 3. 单调性加权（针对翻译对照模式）与全局无序匹配（针对跨书对比模式）
 * ============================================================================
 */

import type { ParagraphLink, ParagraphToken } from './types.ts';

export class BipartiteMatcher {
  /**
   * 计算两个归一化向量的余弦相似度
   */
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

  /**
   * 从两组嵌入向量构建 M x N 相似度矩阵
   */
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

  /**
   * 从相似度矩阵中抽取达到阈值的多向关联连线
   * @param matrix M x N 矩阵
   * @param sources 源段落 Token 列表
   * @param targets 目标段落 Token 列表
   * @param threshold 相似度下限阈值（如 0.60）
   * @param maxPerSource 单个源段落允许的最大连线分支数
   * @param monotonicBias 单调性偏置权重（针对同书双语对照，平滑位置跳跃；跨书时为 0）
   */
  static extractLinks(
    matrix: number[][],
    sources: ParagraphToken[],
    targets: ParagraphToken[],
    options: {
      threshold?: number;
      maxPerSource?: number;
      monotonicBias?: number; // 0.0 ~ 0.3
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

        // 若启用同书单调性位置偏置，适度抑制远距离偶发性关键词撞车
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

      // 按偏置调整后的相似度降序排列
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
