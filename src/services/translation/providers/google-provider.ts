/**
 * src/services/translation/providers/google-provider.ts
 * ============================================================================
 * Google 翻译服务提供商 (Google Translate Provider - Default)
 * ============================================================================
 * 策略：
 * 1. 优先检测是否存在官方 API 密钥（GOOGLE_TRANSLATE_API_KEY 或 options.apiKey）；
 *    若存在，走官方 Google Cloud Translation API (v2)；
 * 2. 若未配置 API 密钥，平滑降级至 Google 翻译直连接口 (GTX Web 兼容协议)；
 *    开箱即用，读者无需自备付费 Key 即可即时体验全书双语对照；
 * 3. 支持单段快速翻译与批量切片并发翻译。
 * ============================================================================
 */

import type { ITranslationProvider, TranslateOptions, TranslationProviderId } from '../types.ts';

const GOOGLE_CLOUD_V2_ENDPOINT = 'https://translation.googleapis.com/language/translate/v2';
const GOOGLE_CHROME_ENDPOINT = 'https://clients5.google.com/translate_a/t';
const GOOGLE_GTX_ENDPOINT = 'https://translate.googleapis.com/translate_a/single';

export class GoogleTranslateProvider implements ITranslationProvider {
  id: TranslationProviderId = 'google';
  label = 'Google 翻译 (官方/默认)';
  desc = 'Google 官方成熟机器翻译引擎，响应迅速、翻译稳定，开箱即用';

  /**
   * 翻译单段文本
   */
  async translate(text: string, options: TranslateOptions = {}): Promise<string> {
    const trimmed = text.trim();
    if (!trimmed) return text;

    const sourceLang = options.sourceLang || 'en';
    const targetLang = options.targetLang || 'zh-CN';
    // 只有当明确传入以 AIzaSy 开头的 Google 格式密钥或服务端配置了 GOOGLE_TRANSLATE_API_KEY 时才走付费接口
    // 杜绝其他服务商 (如智谱、DeepSeek) 的密钥误传入导致 Google 400 Bad Request
    const isGoogleKey = Boolean(options.apiKey && options.apiKey.startsWith('AIzaSy'));
    const apiKey = isGoogleKey ? options.apiKey : (typeof process !== 'undefined' ? process.env?.GOOGLE_TRANSLATE_API_KEY : '');

    // 模式 A: 官方 Google Cloud Translation API
    if (apiKey) {
      return this.translateWithCloudApi(trimmed, sourceLang, targetLang, apiKey);
    }

    // 模式 B: 开箱即用官方直连（优先 Chrome 扩展高速高配额接口，自动降级至 GTX）
    try {
      return await this.translateWithChromeExt(trimmed, sourceLang, targetLang);
    } catch {
      return this.translateWithGtx(trimmed, sourceLang, targetLang);
    }
  }

  /**
   * 批量翻译文本数组
   */
  async translateBatch(texts: string[], options: TranslateOptions = {}): Promise<string[]> {
    if (!texts.length) return [];

    // 为保证请求稳定与防拥塞，按 5 条为一个并行批次执行
    const results: string[] = new Array(texts.length);
    const BATCH_SIZE = 5;

    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      const chunk = texts.slice(i, i + BATCH_SIZE);
      const chunkPromises = chunk.map(async (t, offset) => {
        try {
          const res = await this.translate(t, options);
          results[i + offset] = res;
        } catch (err) {
          // 降级保护：若某段翻译失败，暂存原文本
          results[i + offset] = t;
        }
      });
      await Promise.all(chunkPromises);
    }

    return results;
  }

  /**
   * 连通性健康探测
   */
  async checkHealth(): Promise<boolean> {
    try {
      const res = await this.translate('test', { sourceLang: 'en', targetLang: 'zh-CN' });
      return Boolean(res && res.length > 0);
    } catch {
      return false;
    }
  }

  /**
   * 官方 Google Cloud Translation API (v2)
   */
  private async translateWithCloudApi(
    text: string,
    sourceLang: string,
    targetLang: string,
    apiKey: string
  ): Promise<string> {
    const url = `${GOOGLE_CLOUD_V2_ENDPOINT}?key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({
        q: text,
        source: sourceLang,
        target: targetLang,
        format: 'text',
      }),
    });

    if (!response.ok) {
      throw new Error(`[Google Cloud Translate API] HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const translated = data?.data?.translations?.[0]?.translatedText;
    if (typeof translated !== 'string') {
      throw new Error('[Google Cloud Translate API] 无效的响应数据结构');
    }

    return this.decodeHtmlEntities(translated);
  }

  /**
   * Google Chrome 扩展官方翻译协议 (高速、稳定、支持 POST 大段文本、零 429 频控)
   */
  private async translateWithChromeExt(text: string, sourceLang: string, targetLang: string): Promise<string> {
    const url = `${GOOGLE_CHROME_ENDPOINT}?client=dict-chrome-ex`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
      },
      body: new URLSearchParams({
        sl: sourceLang,
        tl: targetLang,
        q: text,
      }),
    });

    if (!response.ok) {
      throw new Error(`[Google Chrome Translate API] HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    if (Array.isArray(data) && typeof data[0] === 'string') {
      return data.join('');
    }
    if (Array.isArray(data) && Array.isArray(data[0])) {
      return data[0].filter((p: any) => typeof p === 'string').join('');
    }
    throw new Error('[Google Chrome Translate API] 未识别的响应结构');
  }

  /**
   * 开箱即用 Google 翻译协议 (GTX)
   */
  private async translateWithGtx(text: string, sourceLang: string, targetLang: string): Promise<string> {
    const params = new URLSearchParams({
      client: 'gtx',
      sl: sourceLang,
      tl: targetLang,
      dt: 't',
      q: text,
    });

    const url = `${GOOGLE_GTX_ENDPOINT}?${params.toString()}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
      },
    });

    if (!response.ok) {
      throw new Error(`[Google GTX Translate] HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    if (!Array.isArray(data) || !Array.isArray(data[0])) {
      throw new Error('[Google GTX Translate] 返回的数据格式不符合预期');
    }

    // 拼接多句翻译片段
    const fullText = data[0]
      .filter((part: any) => Array.isArray(part) && typeof part[0] === 'string')
      .map((part: any) => part[0])
      .join('');

    return fullText || text;
  }

  /**
   * 解码 HTML 实体（如 &quot;, &#39;, &amp; 等）
   */
  private decodeHtmlEntities(str: string): string {
    return str
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&');
  }
}
