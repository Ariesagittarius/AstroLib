/**
 * src/services/translation/service.ts
 * ============================================================================
 * AstroLib 统一翻译系统门面与服务单例 (Unified Translation Service)
 * ============================================================================
 * 职责：
 * 1. 统一管理与调度翻译提供商（Google 翻译为默认，Google Gemini 可选）；
 * 2. 调度结构保护遮蔽引擎（StructurePreservingMasker），实现输入遮蔽与输出还原；
 * 3. 维护内存级 LRU 翻译缓存，避免重复请求并提升交互流畅度；
 * 4. 支持单段快速翻译与段落集合（ParagraphUnit[]）批量有序翻译。
 * ============================================================================
 */

import type {
  ITranslationProvider,
  ParagraphUnit,
  TranslateOptions,
  TranslateResult,
  TranslationProviderId,
} from './types.ts';
import { StructurePreservingMasker } from './masker.ts';
import { GoogleTranslateProvider } from './providers/google-provider.ts';
import { GeminiTranslateProvider } from './providers/gemini-provider.ts';
import { BuptTranslateProvider } from './providers/bupt-provider.ts';
import { ZhipuTranslateProvider } from './providers/zhipu-provider.ts';

const MAX_CACHE_ENTRIES = 500;

export class TranslationService {
  private static instance: TranslationService | null = null;
  private providers = new Map<TranslationProviderId, ITranslationProvider>();
  private defaultProviderId: TranslationProviderId = 'google';
  private cache = new Map<string, string>(); // key: `provider:text` -> translatedText

  private constructor() {
    // 默认内置注册 Google 翻译（默认首选）、Gemini 学术翻译、北邮 DeepSeek 校内服务商与智谱 GLM-4 免费学术翻译
    this.registerProvider(new GoogleTranslateProvider());
    this.registerProvider(new GeminiTranslateProvider());
    this.registerProvider(new BuptTranslateProvider());
    this.registerProvider(new ZhipuTranslateProvider());
  }

  public static getInstance(): TranslationService {
    if (!this.instance) {
      this.instance = new TranslationService();
    }
    return this.instance;
  }

  public registerProvider(provider: ITranslationProvider): void {
    this.providers.set(provider.id, provider);
  }

  public getProvider(id?: TranslationProviderId): ITranslationProvider {
    const targetId = id || this.defaultProviderId;
    let provider = this.providers.get(targetId);
    if (!provider && (targetId === 'deepseek' || targetId === ('bupt-deepseek' as any))) {
      provider = this.providers.get('bupt');
    }
    if (!provider) {
      // 找不到指定提供商时回退至 Google 翻译
      const fallback = this.providers.get('google');
      if (fallback) return fallback;
      throw new Error(`[TranslationService] 未找到翻译提供商: ${targetId}`);
    }
    return provider;
  }

  public listProviders(): Array<{ id: TranslationProviderId; label: string; desc: string }> {
    return Array.from(this.providers.values()).map((p) => ({
      id: p.id,
      label: p.label,
      desc: p.desc,
    }));
  }

  public setDefaultProvider(id: TranslationProviderId): void {
    if (this.providers.has(id)) {
      this.defaultProviderId = id;
    }
  }

  public getDefaultProviderId(): TranslationProviderId {
    return this.defaultProviderId;
  }

  /**
   * 翻译单段文本或整篇 Markdown/MDX
   */
  public async translate(text: string, options: TranslateOptions = {}): Promise<TranslateResult> {
    const trimmed = text.trim();
    if (!trimmed) {
      return {
        success: true,
        translatedText: text,
        originalText: text,
        provider: options.provider || this.defaultProviderId,
        tokensPreserved: 0,
        tokensRestored: 0,
      };
    }

    const providerId = options.provider || this.defaultProviderId;
    const provider = this.getProvider(providerId);
    const preserveStructure = options.preserveStructure !== false;

    // 检查缓存
    const cacheKey = `${providerId}:${options.targetLang || 'zh-CN'}:${trimmed}`;
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      return {
        success: true,
        translatedText: cached,
        originalText: text,
        provider: providerId,
        tokensPreserved: 0,
        tokensRestored: 0,
      };
    }

    try {
      let textToSend = trimmed;
      let tokens = new Map();

      // 步骤 1: 结构遮蔽
      if (preserveStructure) {
        const maskResult = StructurePreservingMasker.mask(trimmed, false);
        textToSend = maskResult.maskedText;
        tokens = maskResult.tokens;
      }

      // 步骤 2: 调用翻译提供商
      const rawTranslated = await provider.translate(textToSend, options);

      // 步骤 3: 结构还原与容错
      let finalTranslated = rawTranslated;
      let restoredCount = 0;
      if (preserveStructure && tokens.size > 0) {
        const unmaskResult = StructurePreservingMasker.unmask(rawTranslated, tokens);
        finalTranslated = unmaskResult.restoredText;
        restoredCount = unmaskResult.restoredCount;
      }

      // 写入 LRU 缓存
      this.setCache(cacheKey, finalTranslated);

      return {
        success: true,
        translatedText: finalTranslated,
        originalText: text,
        provider: providerId,
        tokensPreserved: tokens.size,
        tokensRestored: restoredCount,
      };
    } catch (err: any) {
      return {
        success: false,
        translatedText: text,
        originalText: text,
        provider: providerId,
        tokensPreserved: 0,
        tokensRestored: 0,
        error: err?.message || '翻译失败',
      };
    }
  }

  /**
   * 批量翻译段落单元数组（用于双语对照与侧边栏）
   */
  public async translateParagraphs(
    paragraphs: ParagraphUnit[],
    options: TranslateOptions = {}
  ): Promise<ParagraphUnit[]> {
    if (!paragraphs.length) return [];

    const updated = [...paragraphs];
    // 并发控制：5 个一组
    const CHUNK_SIZE = 5;

    for (let i = 0; i < updated.length; i += CHUNK_SIZE) {
      const chunk = updated.slice(i, i + CHUNK_SIZE);
      await Promise.all(
        chunk.map(async (unit) => {
          // 跳过空文本或非翻译类单元（如纯公式块若不需要翻译文本）
          if (!unit.sourceText.trim()) return;

          // 严格跳过行间公式块与算法代码块的翻译
          if (unit.type === 'math' || unit.type === 'code') {
            unit.status = 'done';
            unit.translatedText = unit.sourceText;
            return;
          }

          unit.status = 'translating';
          const res = await this.translate(unit.sourceText, options);
          if (res.success) {
            unit.translatedText = res.translatedText;
            unit.status = 'done';
          } else {
            unit.status = 'error';
            unit.error = res.error;
            unit.translatedText = unit.sourceText;
          }
        })
      );
    }

    return updated;
  }

  private setCache(key: string, value: string): void {
    if (this.cache.size >= MAX_CACHE_ENTRIES) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }
}

export const translationService = TranslationService.getInstance();
