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
   * 计算机科学与数学高频跨语言双语同义词/同义概念词典
   */
  private static readonly CS_MATH_COGNATES: Record<string, string[]> = {
    prologue: ['序言', '前言'],
    preface: ['前言', '序言'],
    algorithm: ['算法'],
    algorithms: ['算法'],
    algorithmic: ['算法'],
    multiply: ['乘法', '相乘'],
    multiplication: ['乘法'],
    addition: ['加法'],
    divide: ['分治', '除法'],
    conquer: ['分治'],
    recurrence: ['递归'],
    recursion: ['递归'],
    recursive: ['递归'],
    complexity: ['复杂'],
    integer: ['整数'],
    integers: ['整数'],
    graph: ['图'],
    graphs: ['图论'],
    tree: ['树'],
    trees: ['树'],
    matrix: ['矩阵'],
    matrices: ['矩阵'],
    polynomial: ['多项'],
    theorem: ['定理'],
    proof: ['证明'],
    exercise: ['习题', '练习'],
    exercises: ['习题', '练习'],
    sort: ['排序'],
    sorting: ['排序'],
    search: ['搜索'],
    flow: ['网络流'],
    greedy: ['贪心'],
    dynamic: ['动态'],
    programming: ['规划'],
    linear: ['线性'],
    reduction: ['归约'],
    reductions: ['归约'],
    approximation: ['近似'],
    np: ['np'],
    dijkstra: ['dijkstra', '狄克斯特拉'],
    karatsuba: ['karatsuba', '卡拉楚巴'],
    rsa: ['rsa'],
  };

  /**
   * 提取中英文本中的跨语言词元特征集合（含数学公式、数值、拉丁专有词与汉字二元组）
   */
  public static tokenizeMultilingual(text: string): Set<string> {
    const tokens = new Set<string>();
    const lower = text.toLowerCase();

    // 1. 提取所有数值 (例如 02.1, 1960, 3, 1.585)
    const numbers = lower.match(/\b\d+(?:\.\d+)?\b/g);
    if (numbers) {
      numbers.forEach((n) => tokens.add(n));
    }

    // 2. 提取 LaTeX 数学公式表达式与核心符号
    const mathFormulas = lower.match(/\$[^$]+\$/g);
    if (mathFormulas) {
      mathFormulas.forEach((m) => {
        // 清洗多余空格后加入公式整体
        tokens.add(m.replace(/\s+/g, ''));
      });
    }

    // 3. 提取拉丁英文词汇并进行跨语言同义概念映射
    const latinWords = lower.match(/\b[a-z]{2,}\b/g);
    if (latinWords) {
      latinWords.forEach((word) => {
        tokens.add(word);
        const mapped = this.CS_MATH_COGNATES[word];
        if (mapped) {
          mapped.forEach((cn) => tokens.add(cn));
        }
      });
    }

    // 4. 提取汉字二元组 (Bigrams)，精确捕获中文语素
    const hanChars = text.match(/[\u4e00-\u9fa5]/g);
    if (hanChars && hanChars.length >= 2) {
      for (let i = 0; i < hanChars.length - 1; i++) {
        tokens.add(hanChars[i] + hanChars[i + 1]);
      }
    }

    return tokens;
  }

  /**
   * 兜底轻量比对矩阵生成（融合词元 Jaccard 相似度、结构角色相容性与相对位置先验）
   */
  public static fallbackLexicalMatrix(sources: ParagraphToken[], targets: ParagraphToken[]): number[][] {
    const M = sources.length;
    const N = targets.length;
    const matrix: number[][] = Array.from({ length: M }, () => new Array(N).fill(0));

    const srcSets = sources.map((s) => this.tokenizeMultilingual(s.text));
    const tgtSets = targets.map((t) => this.tokenizeMultilingual(t.text));

    for (let i = 0; i < M; i++) {
      const setA = srcSets[i];
      const typeA = sources[i]?.type;

      for (let j = 0; j < N; j++) {
        const setB = tgtSets[j];
        const typeB = targets[j]?.type;

        let intersection = 0;
        setA.forEach((w) => {
          if (setB.has(w)) intersection++;
        });

        const union = setA.size + setB.size - intersection;
        let jaccard = union > 0 ? intersection / union : 0;

        // 若双方类型一致（如均为 heading、math 或 card），给予结构相容性温和偏置
        let typeBonus = 0;
        if (typeA && typeB && typeA === typeB) {
          typeBonus = typeA === 'heading' ? 0.15 : 0.08;
        }

        // 相对位置相近度先验
        const relPosA = M > 1 ? i / (M - 1) : 0;
        const relPosB = N > 1 ? j / (N - 1) : 0;
        const posProx = Math.max(0, 1 - Math.abs(relPosA - relPosB) * 1.3);

        // 综合加权评分 (Jaccard 权重 0.55 + 位置 0.35 + 结构 0.10)
        let sim = jaccard * 0.55 + posProx * 0.35 + typeBonus;
        sim = Math.max(0, Math.min(1, sim));

        matrix[i][j] = Math.round(sim * 1000) / 1000;
      }
    }

    return matrix;
  }
}
