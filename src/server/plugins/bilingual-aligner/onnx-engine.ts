import { BipartiteMatcher } from '../../../services/bilingual/bipartite-matcher.ts';
import { BilingualAlignerClient } from '../../../services/bilingual/aligner-client.ts';

export interface AlignResultPayload {
  matrix: number[][];
  inferenceTimeMs: number;
  engine: string;
}

export interface TocMatchItem {
  sourceId: string;
  sourceTitle: string;
  targetId: string;
  targetTitle: string;
  confidence: number;
}

export class BilingualOnnxEngine {
  private static instance: BilingualOnnxEngine | null = null;
  private pipelineInstance: any = null;
  private isLoading = false;
  private loadError: Error | null = null;
  private lastUsedTimestamp = 0;
  private readonly modelName = 'Xenova/paraphrase-multilingual-MiniLM-L12-v2';

  static getInstance(): BilingualOnnxEngine {
    if (!this.instance) {
      this.instance = new BilingualOnnxEngine();
    }
    return this.instance;
  }

  private async getPipeline(): Promise<any> {
    if (this.pipelineInstance) {
      this.lastUsedTimestamp = Date.now();
      return this.pipelineInstance;
    }

    if (this.isLoading) {

      while (this.isLoading) {
        await new Promise((r) => setTimeout(r, 100));
      }
      if (this.pipelineInstance) return this.pipelineInstance;
    }

    this.isLoading = true;
    this.loadError = null;

    try {
      const { pipeline } = await import('@huggingface/transformers');

      const loadWithTimeout = async () => {
        try {
          return await pipeline('feature-extraction', this.modelName, {
            dtype: 'q8',
            device: 'dml',
          });
        } catch {
          return await pipeline('feature-extraction', this.modelName, {
            dtype: 'q8',
            device: 'cpu',
          });
        }
      };

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Model load timeout')), 2500)
      );

      this.pipelineInstance = await Promise.race([loadWithTimeout(), timeoutPromise]);
      this.lastUsedTimestamp = Date.now();
      return this.pipelineInstance;
    } catch (err: any) {
      this.loadError = err;
      return null;
    } finally {
      this.isLoading = false;
    }
  }

  async embedTexts(texts: string[]): Promise<number[][] | null> {
    const pipe = await this.getPipeline();
    if (!pipe) return null;

    try {

      const cleanTexts = texts.map((t) => t.slice(0, 512).trim() || 'empty');
      const output = await pipe(cleanTexts, { pooling: 'mean', normalize: true });

      const embeddings: number[][] = [];
      const dim = output.dims[output.dims.length - 1];
      const data = output.data as Float32Array;

      for (let i = 0; i < texts.length; i++) {
        const start = i * dim;
        const vec = Array.from(data.subarray(start, start + dim));
        embeddings.push(vec);
      }

      return embeddings;
    } catch (err) {
      console.warn('[bilingual-engine] Embed error, falling back to lexical:', err);
      return null;
    }
  }

  async alignParagraphs(sourceTexts: string[], targetTexts: string[]): Promise<AlignResultPayload> {
    const startTime = performance.now();

    const srcEmbeds = await this.embedTexts(sourceTexts);
    const tgtEmbeds = await this.embedTexts(targetTexts);

    if (srcEmbeds && tgtEmbeds) {
      const matrix = BipartiteMatcher.buildMatrix(srcEmbeds, tgtEmbeds);
      return {
        matrix,
        inferenceTimeMs: Math.round(performance.now() - startTime),
        engine: 'node-onnx (paraphrase-multilingual-MiniLM)',
      };
    }

    const matrix = this.fallbackLexicalMatrix(sourceTexts, targetTexts);
    return {
      matrix,
      inferenceTimeMs: Math.round(performance.now() - startTime),
      engine: 'lexical-fallback',
    };
  }

  async matchToc(
    sourceChapters: { id: string; title: string }[],
    targetChapters: { id: string; title: string }[]
  ): Promise<TocMatchItem[]> {
    const srcTitles = sourceChapters.map((c) => c.title);
    const tgtTitles = targetChapters.map((c) => c.title);

    const { matrix } = await this.alignParagraphs(srcTitles, tgtTitles);
    const results: TocMatchItem[] = [];

    for (let i = 0; i < sourceChapters.length; i++) {
      let bestJ = -1;
      let maxSim = -1;

      for (let j = 0; j < targetChapters.length; j++) {
        if (matrix[i][j] > maxSim) {
          maxSim = matrix[i][j];
          bestJ = j;
        }
      }

      if (bestJ >= 0 && maxSim >= 0.35) {
        results.push({
          sourceId: sourceChapters[i].id,
          sourceTitle: sourceChapters[i].title,
          targetId: targetChapters[bestJ].id,
          targetTitle: targetChapters[bestJ].title,
          confidence: maxSim,
        });
      }
    }

    return results;
  }

  public buildLexicalMatrix(sourceTexts: string[], targetTexts: string[]): number[][] {
    return this.fallbackLexicalMatrix(sourceTexts, targetTexts);
  }

  private fallbackLexicalMatrix(sourceTexts: string[], targetTexts: string[]): number[][] {
    const M = sourceTexts.length;
    const N = targetTexts.length;
    const matrix: number[][] = Array.from({ length: M }, () => new Array(N).fill(0));

    const srcSets = sourceTexts.map((s) => BilingualAlignerClient.tokenizeMultilingual(s));
    const tgtSets = targetTexts.map((t) => BilingualAlignerClient.tokenizeMultilingual(t));

    for (let i = 0; i < M; i++) {
      const setA = srcSets[i];
      for (let j = 0; j < N; j++) {
        const setB = tgtSets[j];
        if (setA.size === 0 || setB.size === 0) continue;

        let common = 0;
        setA.forEach((w) => {
          if (setB.has(w)) common++;
        });

        const union = setA.size + setB.size - common;
        const jaccard = union > 0 ? common / union : 0;

        const relPosA = M > 1 ? i / (M - 1) : 0;
        const relPosB = N > 1 ? j / (N - 1) : 0;
        const posProximity = Math.max(0, 1 - Math.abs(relPosA - relPosB) * 1.3);

        const sim = Math.max(0, Math.min(1, jaccard * 0.6 + posProximity * 0.4));
        matrix[i][j] = Math.round(sim * 1000) / 1000;
      }
    }

    return matrix;
  }
}
