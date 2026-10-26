import https from 'node:https';
import dns from 'node:dns';
import fs from 'node:fs';
import type { ITranslationProvider, TranslateOptions, TranslationProviderId } from '../types.ts';

const BUPT_OFFICIAL_ENDPOINT = 'https://myai.bupt.edu.cn/llm-gw/v1/chat/completions';
const BUPT_DEV_PROXY_ENDPOINT = '/api/proxy/bupt/chat/completions';
const BUPT_GATEWAY_HOST = 'myai.bupt.edu.cn';
const BUPT_CAMPUS_IP = '10.3.19.2';
const DEFAULT_MODEL = 'deepseek-v4-flash';

const ACADEMIC_SYSTEM_PROMPT = `你是一个无状态的高校教材纯文本翻译引擎。
你的唯一任务是将输入的英文直接翻译为规范的简体中文。

【核心铁律（必须严格执行，违者翻译无效）】：
1. 【绝不扩写，绝不添油加醋】：严禁在译文中添加任何原文没有的事实、原理分析、算法说明或背景科普！原文如果只有一两个单词或一个简短标题（如 "2.3 Mergesort"），译文也绝对只能输出对应的一两个单词或简短标题（如 "2.3 归并排序"），严禁输出任何后续解释段落！
2. 【严格 1:1 对等翻译】：句子数量与结构必须与原文严格 1:1 对应。原文没有的句子，译文中严禁出现。
3. 【原样保留所有标记符号】：形如 ⟦ASTRO_TOK_N⟧ 或 <span class="notranslate"...> 的占位符是数学公式与代码结构的保护标记，必须原封不动在译文对应位置保留，绝对禁止翻译、修改、拆分或删除其中的任何字符！
4. 【计算机与理科规范术语】：保持高校教材学术文风，术语严谨（例如：mergesort -> 归并排序，recurrence relations -> 递推关系，divide-and-conquer -> 分治算法，amortized analysis -> 摊还分析）。
5. 【纯净输出】：仅输出翻译结果本身。严禁添加“好的”、“以下是翻译：”、代码块（\`\`\`）或任何前后缀说明。`;

export class BuptTranslateProvider implements ITranslationProvider {
  id: TranslationProviderId = 'bupt';
  label = 'DeepSeek (北邮校内)';
  desc = '北京邮电大学「人人有算力」校内专属服务，搭载 DeepSeek 理科推理模型，免翻直连、术语精准';

  async translate(text: string, options: TranslateOptions = {}): Promise<string> {
    const trimmed = text.trim();
    if (!trimmed) return text;

    let apiKey = (options.apiKey || '').trim();
    if (apiKey && !apiKey.startsWith('sk-')) {

      const serverKey = typeof process !== 'undefined' ? (process.env?.BUPT_API_KEY || '').trim() : '';
      if (serverKey && serverKey.startsWith('sk-')) {
        apiKey = serverKey;
      }
    }
    if (!apiKey) {
      apiKey =
        (typeof process !== 'undefined' ? (process.env?.BUPT_API_KEY || '').trim() : '') ||
        (typeof localStorage !== 'undefined' ? (localStorage.getItem('astrolib_ai_provider_key_bupt') || '').trim() : '');
    }

    const endpoint = this.resolveEndpoint(options.endpoint);
    const model = options.model || DEFAULT_MODEL;

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

    let rawContent = '';

    if (typeof window === 'undefined') {
      rawContent = await this.requestNode(payload, apiKey, endpoint);
    } else {

      const headers: Record<string, string> = {
        'Content-Type': 'application/json; charset=utf-8',
      };
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        throw new Error(`[Bupt Translate Provider] HTTP ${response.status}: ${errText || response.statusText}`);
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;
      if (typeof content !== 'string') {
        throw new Error('[Bupt Translate Provider] 响应未包含有效的翻译内容');
      }
      rawContent = content;
    }

    return this.cleanTranslatedOutput(rawContent, trimmed);
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
      const res = await this.translate('test', {});
      return Boolean(res && res.length > 0);
    } catch {
      return false;
    }
  }

  private async requestNode(payload: any, apiKey: string, endpointUrl: string): Promise<string> {

    if (!apiKey || !apiKey.startsWith('sk-')) {
      try {
        if (fs.existsSync('.env')) {
          const envContent = fs.readFileSync('.env', 'utf-8');
          const m = envContent.match(/^BUPT_API_KEY\s*=\s*(.+)$/m);
          if (m) apiKey = m[1].trim();
        }
      } catch {}
    }

    const parsed = new URL(endpointUrl);
    const isBuptHost = parsed.hostname === BUPT_GATEWAY_HOST;

    let agent: any = undefined;
    if (isBuptHost) {
      const customLookup = (hostname: string, opts: any, cb: any) => {
        if (typeof opts === 'function') {
          cb = opts;
          opts = {};
        }
        if (hostname === BUPT_GATEWAY_HOST) {
          if (opts && opts.all) {
            return cb(null, [{ address: BUPT_CAMPUS_IP, family: 4 }]);
          }
          return cb(null, BUPT_CAMPUS_IP, 4);
        }
        return dns.lookup(hostname, opts, cb);
      };
      agent = new https.Agent({ lookup: customLookup, keepAlive: true });
    }

    const postData = JSON.stringify(payload);
    const headers: Record<string, string | number> = {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Length': Buffer.byteLength(postData),
    };
    if (isBuptHost) {
      headers['Host'] = BUPT_GATEWAY_HOST;
    }
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    return new Promise<string>((resolve, reject) => {
      const req = https.request(
        endpointUrl,
        {
          method: 'POST',
          headers,
          agent,
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              try {
                const json = JSON.parse(data);
                const content = json?.choices?.[0]?.message?.content;
                if (typeof content !== 'string') {
                  return reject(new Error('[Bupt Translate Provider] 响应未包含有效的翻译内容 choices[0].message.content'));
                }
                resolve(content);
              } catch (err: any) {
                reject(new Error(`[Bupt Translate Provider] JSON 解析失败: ${err.message}`));
              }
            } else {
              reject(new Error(`[Bupt Translate Provider] HTTP ${res.statusCode}: ${data}`));
            }
          });
        }
      );
      req.on('error', reject);
      req.write(postData);
      req.end();
    });
  }

  private resolveEndpoint(customEndpoint?: string): string {
    if (customEndpoint) return customEndpoint;

    if (typeof window !== 'undefined') {
      const isDev = Boolean(
        window.location.hostname === 'localhost' ||
          window.location.hostname === '127.0.0.1' ||
          (typeof import.meta !== 'undefined' && (import.meta as any).env?.DEV)
      );
      if (isDev) return BUPT_DEV_PROXY_ENDPOINT;
    }
    return BUPT_OFFICIAL_ENDPOINT;
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
