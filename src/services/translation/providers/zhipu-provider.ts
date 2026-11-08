import fs from 'node:fs';
import type { ITranslationProvider, TranslateOptions, TranslationProviderId } from '../types.ts';

const ZHIPU_OFFICIAL_ENDPOINT = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
const DEFAULT_MODEL = 'glm-4-flash';

const ACADEMIC_SYSTEM_PROMPT = `你是一个无状态的高校教材纯文本翻译引擎。
你的唯一任务是将输入的英文直接翻译为规范的简体中文。

【核心铁律（必须严格执行，违者翻译无效）】：
1. 【绝不扩写，绝不添油加醋】：严禁在译文中添加任何原文没有的事实、原理分析、算法说明或背景科普！原文如果只有一两个单词或一个简短标题（如 "2.3 Mergesort"），译文也绝对只能输出对应的一两个单词或简短标题（如 "2.3 归并排序"），严禁输出任何后续解释段落！
2. 【严格 1:1 对等翻译】：句子数量与结构必须与原文严格 1:1 对应。原文没有的句子，译文中严禁出现。
3. 【原样保留所有标记符号】：形如 ⟦ASTRO_TOK_N⟧ 或 <span class="notranslate"...> 的占位符是数学公式与代码结构的保护标记，必须原封不动在译文对应位置保留，绝对禁止翻译、修改、拆分或删除其中的任何字符！
4. 【计算机与理科规范术语】：保持高校教材学术文风，术语严谨（例如：mergesort -> 归并排序，recurrence relations -> 递推关系，divide-and-conquer -> 分治算法，amortized analysis -> 摊还分析）。
5. 【纯净输出】：仅输出翻译结果本身。严禁添加“好的”、“以下是翻译：”、代码块（\`\`\`）或任何前后缀说明。`;

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
      temperature: 0.1,
      messages: [
        { role: 'system', content: ACADEMIC_SYSTEM_PROMPT },
        {
          role: 'user',
          content: `请直接翻译以下英文内容为简体中文（严禁扩写、严禁添加任何解释、严禁添加原文没有的内容，仅输出译文）：\n<source_text>\n${trimmed}\n</source_text>`,
        },
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

    return this.cleanTranslatedOutput(content, trimmed);
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

  public cleanTranslatedOutput(raw: string, sourceText = ''): string {
    let text = raw.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    text = text.replace(/<\/?(?:source_text|text_to_translate|translation|translated_text)>/gi, '').trim();
    if (text.startsWith('```') && text.endsWith('```')) {
      text = text.replace(/^```(?:markdown|md|text)?\n([\s\S]*?)\n```$/i, '$1').trim();
    }
    text = text.replace(/^(?:好的[，,！!]?|以下是翻译[：:]?|翻译如下[：:]?|译文[：:]?)\s*/i, '').trim();

    const trimmedSource = sourceText.trim();
    const isSingleLine = !trimmedSource.includes('\n');
    const wordCount = trimmedSource.split(/\s+/).length;
    const isShortHeading = isSingleLine && (trimmedSource.startsWith('#') || wordCount <= 8);

    if (isShortHeading && text) {
      const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      let firstLine = lines[0] || text;
      if (wordCount <= 5 && firstLine.length > 30) {
        const sentenceMatch = firstLine.match(/^([^。！？\n]+[。！？]?)/);
        if (sentenceMatch && sentenceMatch[1].length < firstLine.length) {
          firstLine = sentenceMatch[1].trim();
        }
      }
      text = firstLine;
    }

    return text.trim();
  }
}
