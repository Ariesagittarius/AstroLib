/**
 * src/services/translation/providers/gemini-provider.ts
 * ============================================================================
 * Google Gemini 学术翻译服务提供商 (Gemini Academic Translator)
 * ============================================================================
 * 优势：
 * 1. 深度理解计算机科学算法与离散数学专业领域语境；
 * 2. 严格遵从指令，原样保护 ⟦ASTRO_TOK_N⟧ 结构占位符；
 * 3. 产出自然、地道、符合中国高校学术专著习惯的译文。
 * ============================================================================
 */

import type { ITranslationProvider, TranslateOptions, TranslationProviderId } from '../types.ts';

const DEFAULT_GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
const DEV_PROXY_ENDPOINT = '/api/proxy/gemini/v1beta/openai/chat/completions';
const DEFAULT_MODEL = 'gemini-3.8-flash';

const ACADEMIC_SYSTEM_PROMPT = `你是一名精通高校计算机科学与离散数学教材的资深学术翻译专家。
你的任务是将输入的英文专业教材内容准确、地道、严谨地翻译为简体中文。

【铁律规范（严禁违反）】：
1. 文本中形如 ⟦ASTRO_TOK_N⟧ 或 <span class="notranslate"...> 的所有占位符是数学公式、算法代码和排版结构的保护标记，你必须原封不动、原样保留在译文中对应的位置，严禁翻译、拆解、删除或替换其中的任何字符！
2. 保持高校经典教材庄重、沉静、精确的学术文风，术语需规范（例如：primality -> 素性测试，modular arithmetic -> 模运算，strongly connected components -> 强连通分量，dynamic programming -> 动态规划，amortized analysis -> 摊还分析）。
3. 严格仅输出翻译后的文本正文，严禁添加“好的”、“以下是翻译”等任何额外寒暄、说明或包裹代码块。`;

export class GeminiTranslateProvider implements ITranslationProvider {
  id: TranslationProviderId = 'gemini';
  label = 'Google Gemini (学术推理)';
  desc = '前沿理科推理模型，精通高校计算机与离散数学专业语境，术语翻译极度地道';

  async translate(text: string, options: TranslateOptions = {}): Promise<string> {
    const trimmed = text.trim();
    if (!trimmed) return text;

    const apiKey =
      options.apiKey ||
      (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : '') ||
      (typeof localStorage !== 'undefined' ? localStorage.getItem('astrolib_ai_provider_key_gemini') || '' : '');

    const endpoint = this.resolveEndpoint(options.endpoint);
    const model = options.model || DEFAULT_MODEL;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json; charset=utf-8',
    };
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const payload = {
      model,
      temperature: 0.1, // 低温度以保证翻译的一致性与严谨度
      messages: [
        { role: 'system', content: ACADEMIC_SYSTEM_PROMPT },
        { role: 'user', content: trimmed },
      ],
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`[Gemini Translate Provider] HTTP ${response.status}: ${errText || response.statusText}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== 'string') {
      throw new Error('[Gemini Translate Provider] 响应未包含有效的翻译内容');
    }

    return content.trim();
  }

  async translateBatch(texts: string[], options: TranslateOptions = {}): Promise<string[]> {
    if (!texts.length) return [];

    const results: string[] = new Array(texts.length);
    const BATCH_SIZE = 3;

    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      const chunk = texts.slice(i, i + BATCH_SIZE);
      const chunkPromises = chunk.map(async (t, offset) => {
        try {
          const res = await this.translate(t, options);
          results[i + offset] = res;
        } catch {
          results[i + offset] = t;
        }
      });
      await Promise.all(chunkPromises);
    }

    return results;
  }

  async checkHealth(): Promise<boolean> {
    try {
      const res = await this.translate('Hello', {});
      return Boolean(res && res.length > 0);
    } catch {
      return false;
    }
  }

  private resolveEndpoint(customEndpoint?: string): string {
    if (customEndpoint) return customEndpoint;
    // 浏览器端在开发态优先复用本地 Vite 反代避免 CORS
    if (typeof window !== 'undefined') {
      const isDev = Boolean(
        window.location.hostname === 'localhost' ||
          window.location.hostname === '127.0.0.1' ||
          (typeof import.meta !== 'undefined' && (import.meta as any).env?.DEV)
      );
      if (isDev) return DEV_PROXY_ENDPOINT;
    }
    return DEFAULT_GEMINI_ENDPOINT;
  }
}
