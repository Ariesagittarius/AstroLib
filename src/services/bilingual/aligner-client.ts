/**
 * src/services/bilingual/aligner-client.ts
 * ============================================================================
 * AstroLib 双语对照与关联分析客户端调度中心 (Bilingual Aligner Client)
 * ============================================================================
 * 负责客户端：
 * 1. 从左右双栏文章 DOM 中提取段落序列与文本 Token；
 * 2. 调度服务端/端侧推理端点（/__bilingual__/align）；
 * 3. 维护客户端结果缓存（避免重复滚动与对比时重复推理）；
 * 4. 离线/服务未就绪时的容错自适应。
 * ============================================================================
 */

import { BipartiteMatcher } from './bipartite-matcher.ts';
import type { AlignmentMatrixResult, ParagraphLink, ParagraphToken } from './types.ts';

export class BilingualAlignerClient {
  private static cache = new Map<string, AlignmentMatrixResult>();

  /**
   * 从 DOM 容器中提取段落结构与文本 Token
   */
  static extractTokens(container: HTMLElement, prefix: 'src' | 'tgt'): ParagraphToken[] {
    if (!container) return [];

    const tokens: ParagraphToken[] = [];
    const selector = [
      'h1',
      'h2',
      'h3',
      'h4',
      'p',
      'blockquote',
      '.knowledge-card',
      '.example-card',
      '.variant-card',
      '.method-card',
      '.summary-card',
      '.exercise-card',
      'pre',
      '.katex-display',
    ].join(', ');

    const elements = container.querySelectorAll<HTMLElement>(selector);
    let index = 0;

    elements.forEach((el) => {
      // 避免重复提取嵌套在卡片内部的普通段落
      if (el.tagName.toLowerCase() === 'p' && el.closest('.knowledge-card, .example-card, .variant-card, .method-card, .summary-card, .exercise-card')) {
        return;
      }

      const text = el.innerText?.trim() || '';
      if (!text || text.length < 2) return;

      const id = `${prefix}-p-${index}`;
      el.setAttribute('data-trans-id', id);

      let type: ParagraphToken['type'] = 'paragraph';
      const tag = el.tagName.toLowerCase();
      if (tag.startsWith('h')) {
        type = 'heading';
      } else if (tag === 'blockquote') {
        type = 'quote';
      } else if (el.classList.contains('katex-display')) {
        type = 'math';
      } else if (tag === 'pre') {
        type = 'code';
      } else if (el.className.includes('-card')) {
        type = 'card';
      }

      tokens.push({
        id,
        index,
        text,
        type,
      });

      index++;
    });

    return tokens;
  }

  /**
   * 调度向量对齐计算
   */
  static async computeAlignment(
    sources: ParagraphToken[],
    targets: ParagraphToken[],
    options: {
      threshold?: number;
      monotonicBias?: number;
      bypassCache?: boolean;
    } = {}
  ): Promise<AlignmentMatrixResult> {
    const threshold = options.threshold ?? 0.6;
    const cacheKey = `${sources.map((s) => s.text.slice(0, 20)).join('|')}:::${targets.map((t) => t.text.slice(0, 20)).join('|')}:::${threshold}`;

    if (!options.bypassCache && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const startTime = performance.now();

    try {
      // 发送至服务端端点
      const resp = await fetch('/__bilingual__/align', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceTexts: sources.map((s) => s.text),
          targetTexts: targets.map((t) => t.text),
          threshold,
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        const matrix = data.matrix as number[][];
        const links = BipartiteMatcher.extractLinks(matrix, sources, targets, {
          threshold,
          monotonicBias: options.monotonicBias,
        });

        const result: AlignmentMatrixResult = {
          sourceParagraphs: sources,
          targetParagraphs: targets,
          matrix,
          links,
          inferenceTimeMs: data.inferenceTimeMs || Math.round(performance.now() - startTime),
          engine: data.engine || 'node-onnx',
        };

        this.cache.set(cacheKey, result);
        return result;
      }
    } catch {
      // 后台服务离线或未运行时的降级处理：使用轻量词法相似度兜底
    }

    // 本地降级轻量对齐（基于 Jaccard + 共有词元匹配）
    const matrix = this.fallbackLexicalMatrix(sources, targets);
    const links = BipartiteMatcher.extractLinks(matrix, sources, targets, {
      threshold,
      monotonicBias: options.monotonicBias,
    });

    const result: AlignmentMatrixResult = {
      sourceParagraphs: sources,
      targetParagraphs: targets,
      matrix,
      links,
      inferenceTimeMs: Math.round(performance.now() - startTime),
      engine: 'lexical-fallback',
    };

    this.cache.set(cacheKey, result);
    return result;
  }

  /**
   * 兜底轻量比对矩阵生成
   */
  private static fallbackLexicalMatrix(sources: ParagraphToken[], targets: ParagraphToken[]): number[][] {
    const M = sources.length;
    const N = targets.length;
    const matrix: number[][] = Array.from({ length: M }, () => new Array(N).fill(0));

    const tokenize = (text: string) => {
      return new Set(
        text
          .toLowerCase()
          .replace(/[^\w\u4e00-\u9fa5]/g, ' ')
          .split(/\s+/)
          .filter((w) => w.length > 1)
      );
    };

    const srcSets = sources.map((s) => tokenize(s.text));
    const tgtSets = targets.map((t) => tokenize(t.text));

    for (let i = 0; i < M; i++) {
      const setA = srcSets[i];
      for (let j = 0; j < N; j++) {
        const setB = tgtSets[j];
        if (setA.size === 0 || setB.size === 0) continue;

        let intersection = 0;
        setA.forEach((w) => {
          if (setB.has(w)) intersection++;
        });

        const union = setA.size + setB.size - intersection;
        let sim = union > 0 ? intersection / union : 0;

        // 若相对位置相近，给予基础温和先验
        const relPosA = M > 1 ? i / (M - 1) : 0;
        const relPosB = N > 1 ? j / (N - 1) : 0;
        const posProx = Math.max(0, 1 - Math.abs(relPosA - relPosB) * 1.5);
        sim = Math.min(1, sim * 0.7 + posProx * 0.3);

        matrix[i][j] = Math.round(sim * 1000) / 1000;
      }
    }

    return matrix;
  }
}
