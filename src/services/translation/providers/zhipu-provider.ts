/**
 * src/services/translation/providers/zhipu-provider.ts
 * ============================================================================
 * 智谱开放平台 GLM-4-Flash 学术翻译服务提供商 (Zhipu AI GLM-4 Translator)
 * ============================================================================
 * 优势与特点：
 * 1. 采用智谱开放平台官方永久免费模型 GLM-4-Flash，国内免翻直连；
 * 2. 具备优秀的中英文理科与计算机专业语境推导能力，术语精准规范；
 * 3. 严格遵从指令，原样保护 ⟦ASTRO_TOK_N⟧ 结构占位符与数学环境；
 * 4. 自动过滤思考链与多余代码块包裹，输出沉静严谨的学术教材译文。
 * ============================================================================
 */

import fs from 'node:fs';
import type { ITranslationProvider, TranslateOptions, TranslationProviderId } from '../types.ts';

const ZHIPU_OFFICIAL_ENDPOINT = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
const DEFAULT_MODEL = 'glm-4-flash';

const ACADEMIC_SYSTEM_PROMPT = `你是一名精通高校计算机科学与离散数学教材的资深学术翻译专家。
你的任务是将输入的英文专业教材内容准确、地道、严谨地翻译为简体中文。

【铁律规范（严禁违反）】：
1. 文本中形如 ⟦ASTRO_TOK_N⟧ 或 <span class="notranslate"...> 的所有占位符是数学公式、算法代码和排版结构的保护标记，你必须原封不动、原样保留在译文中对应的位置，严禁翻译、拆解、删除或替换其中的任何字符！
2. 保持高校经典教材庄重、沉静、精确的学术文风，术语需规范（例如：primality -> 素性测试，modular arithmetic -> 模运算，strongly connected components -> 强连通分量，dynamic programming -> 动态规划，amortized analysis -> 摊还分析）。
3. 严格仅输出翻译后的文本正文，严禁添加“好的”、“以下是翻译”等任何额外寒暄、说明或包裹代码块。`;

export class ZhipuTranslateProvider implements ITranslationProvider {
  id: TranslationProviderId = 'zhipu';
  label = '智谱 GLM-4 (免费)';
  desc = '智谱开放平台 GLM-4-Flash 官方永久免费模型，国内免翻直连，推理迅速、学术翻译精准';

  async translate(text: string, options: TranslateOptions = {}): Promise<string> {
    const trimmed = text.trim();
    if (!trimmed) return text;

    const apiKey = this.resolveApiKey(options.apiKey);
    const endpoint = options.endpoint || ZHIPU_OFFICIAL_ENDPOINT;
    const model = options.model || DEFAULT_MODEL;

    if (!apiKey) {
      throw new Error('[Zhipu Translate Provider] 未检测到有效的智谱 API Key，请在侧栏或偏好设置中配置智谱密钥 (open.bigmodel.cn)。');
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json; charset=utf-8',
      'Authorization': `Bearer ${apiKey}`,
    };

    const payload = {
      model,
      temperature: 0.1, // 低温度保证学术翻译的严谨度与术语一致性
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
      let errMsg = `HTTP ${response.status}: ${errText || response.statusText}`;
      try {
        const json = JSON.parse(errText);
        if (json?.error?.message) {
          errMsg = json.error.message;
        }
      } catch {}

      if (response.status === 401 || errMsg.includes('Authorization') || errMsg.includes('身份验证失败')) {
        throw new Error('[Zhipu Translate Provider] 智谱 API 身份验证失败，请检查配置的 API Key 是否正确 (open.bigmodel.cn)。');
      }
      if (response.status === 429) {
        throw new Error('[Zhipu Translate Provider] 智谱 API 请求频次受限 (429)，请稍后重试。');
      }
      throw new Error(`[Zhipu Translate Provider] ${errMsg}`);
    }

    const data = await response.json();
    if (data?.error) {
      const msg = data.error.message || JSON.stringify(data.error);
      throw new Error(`[Zhipu Translate Provider] ${msg}`);
    }

    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== 'string') {
      throw new Error('[Zhipu Translate Provider] 响应未包含有效的 choices[0].message.content 翻译内容。');
    }

    return this.cleanTranslatedOutput(content);
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
      const res = await this.translate('Health check', {});
      return Boolean(res && res.length > 0);
    } catch {
      return false;
    }
  }

  /**
   * 智能检索有效 API Key：
   * 1. 显式入参 options.apiKey
   * 2. 服务端环境变量 process.env.ZHIPU_API_KEY
   * 3. 本地 .env 文件中的 ZHIPU_API_KEY 配置
   * 4. 浏览器 LocalStorage 中的 astrolib_ai_provider_key_zhipu
   */
  private resolveApiKey(explicitKey?: string): string {
    const trimmed = (explicitKey || '').trim();
    if (trimmed && !trimmed.startsWith('ghp_')) {
      return trimmed;
    }

    let envKey = '';
    if (typeof process !== 'undefined') {
      envKey = (process.env?.ZHIPU_API_KEY || '').trim();
      if (!envKey) {
        try {
          if (fs.existsSync('.env')) {
            const envContent = fs.readFileSync('.env', 'utf-8');
            const m = envContent.match(/^ZHIPU_API_KEY\s*=\s*(.+)$/m);
            if (m) envKey = m[1].trim();
          }
        } catch {}
      }
    }

    if (envKey) return envKey;

    if (typeof localStorage !== 'undefined') {
      const localKey = (localStorage.getItem('astrolib_ai_provider_key_zhipu') || '').trim();
      if (localKey && !localKey.startsWith('ghp_')) {
        return localKey;
      }
    }

    return '';
  }

  /**
   * 清洗模型输出，移除 <think> 思考链与多余的 markdown 代码块包裹
   */
  public cleanTranslatedOutput(raw: string): string {
    let text = raw.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    if (text.startsWith('```') && text.endsWith('```')) {
      text = text.replace(/^```(?:markdown|md|text)?\n([\s\S]*?)\n```$/i, '$1').trim();
    }
    return text.trim();
  }
}
