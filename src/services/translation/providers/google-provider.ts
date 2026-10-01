import type { ITranslationProvider, TranslateOptions, TranslationProviderId } from '../types.ts';

const GOOGLE_CLOUD_V2_ENDPOINT = 'https://translation.googleapis.com/language/translate/v2';
const GOOGLE_CHROME_ENDPOINT = 'https://clients5.google.com/translate_a/t';
const GOOGLE_GTX_ENDPOINT = 'https://translate.googleapis.com/translate_a/single';

export class GoogleTranslateProvider implements ITranslationProvider {
  id: TranslationProviderId = 'google';
  label = 'Google 翻译 (官方/默认)';
  desc = 'Google 官方成熟机器翻译引擎，响应迅速、翻译稳定，开箱即用';

  async translate(text: string, options: TranslateOptions = {}): Promise<string> {
    const trimmed = text.trim();
    if (!trimmed) return text;

    const sourceLang = options.sourceLang || 'en';
    const targetLang = options.targetLang || 'zh-CN';

    const isGoogleKey = Boolean(options.apiKey && options.apiKey.startsWith('AIzaSy'));
    const apiKey = isGoogleKey ? options.apiKey : (typeof process !== 'undefined' ? process.env?.GOOGLE_TRANSLATE_API_KEY : '');

    if (apiKey) {
      return this.translateWithCloudApi(trimmed, sourceLang, targetLang, apiKey);
    }

    try {
      return await this.translateWithChromeExt(trimmed, sourceLang, targetLang);
    } catch {
      return this.translateWithGtx(trimmed, sourceLang, targetLang);
    }
  }

  async translateBatch(texts: string[], options: TranslateOptions = {}): Promise<string[]> {
    if (!texts.length) return [];

    const results: string[] = new Array(texts.length);
    const BATCH_SIZE = 5;

    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      const chunk = texts.slice(i, i + BATCH_SIZE);
      const chunkPromises = chunk.map(async (t, offset) => {
        try {
          const res = await this.translate(t, options);
          results[i + offset] = res;
        } catch (err) {

          results[i + offset] = t;
        }
      });
      await Promise.all(chunkPromises);
    }

    return results;
  }

  async checkHealth(): Promise<boolean> {
    try {
      const res = await this.translate('test', { sourceLang: 'en', targetLang: 'zh-CN' });
      return Boolean(res && res.length > 0);
    } catch {
      return false;
    }
  }

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

    const fullText = data[0]
      .filter((part: any) => Array.isArray(part) && typeof part[0] === 'string')
      .map((part: any) => part[0])
      .join('');

    return fullText || text;
  }

  private decodeHtmlEntities(str: string): string {
    return str
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&');
  }
}
