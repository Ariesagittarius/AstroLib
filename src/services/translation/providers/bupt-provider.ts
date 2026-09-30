/**
 * src/services/translation/providers/bupt-provider.ts
 * ============================================================================
 * 北京邮电大学「人人有算力」DeepSeek 学术翻译服务提供商 (BUPT DeepSeek Translator)
 * ============================================================================
 * 优势与特点：
 * 1. 依托北京邮电大学「人人有算力」校内专用大模型算力网关，国内直连免翻；
 * 2. 搭载 DeepSeek 理科推理模型（deepseek-v4-flash），学术推理与数学公式表达力强；
 * 3. 严格遵从指令，原样保护 ⟦ASTRO_TOK_N⟧ 结构占位符与数学环境；
 * 4. 自动过滤模型思考过程 (<think>...</think>)，直接呈现高质量标准中文译文。
 * ============================================================================
 */

import https from 'node:https';
import dns from 'node:dns';
import fs from 'node:fs';
import type { ITranslationProvider, TranslateOptions, TranslationProviderId } from '../types.ts';

const BUPT_OFFICIAL_ENDPOINT = 'https://myai.bupt.edu.cn/llm-gw/v1/chat/completions';
const BUPT_DEV_PROXY_ENDPOINT = '/api/proxy/bupt/chat/completions';
const BUPT_GATEWAY_HOST = 'myai.bupt.edu.cn';
const BUPT_CAMPUS_IP = '10.3.19.2';
const DEFAULT_MODEL = 'deepseek-v4-flash';

const ACADEMIC_SYSTEM_PROMPT = `你是一名精通高校计算机科学与离散数学教材的资深学术翻译专家。
你的任务是将输入的英文专业教材内容准确、地道、严谨地翻译为简体中文。

【铁律规范（严禁违反）】：
1. 文本中形如 ⟦ASTRO_TOK_N⟧ 或 <span class="notranslate"...> 的所有占位符是数学公式、算法代码和排版结构的保护标记，你必须原封不动、原样保留在译文中对应的位置，严禁翻译、拆解、删除或替换其中的任何字符！
2. 保持高校经典教材庄重、沉静、精确的学术文风，术语需规范（例如：primality -> 素性测试，modular arithmetic -> 模运算，strongly connected components -> 强连通分量，dynamic programming -> 动态规划，amortized analysis -> 摊还分析）。
3. 严格仅输出翻译后的文本正文，严禁添加“好的”、“以下是翻译”等任何额外寒暄、说明或包裹代码块。`;

export class BuptTranslateProvider implements ITranslationProvider {
  id: TranslationProviderId = 'bupt';
  label = 'DeepSeek (北邮校内)';
  desc = '北京邮电大学「人人有算力」校内专属服务，搭载 DeepSeek 理科推理模型，免翻直连、术语精准';

  async translate(text: string, options: TranslateOptions = {}): Promise<string> {
    const trimmed = text.trim();
    if (!trimmed) return text;

    let apiKey = (options.apiKey || '').trim();
    if (apiKey && !apiKey.startsWith('sk-')) {
      // 客户端传入的 key 非 sk- 开头（例如残留了 GitHub Token），对于 BUPT LiteLLM 网关必定 401
      // 优先回退至服务端 .env 配置
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
      temperature: 0.1, // 低温度以保证学术翻译的一致性与严谨度
      messages: [
        { role: 'system', content: ACADEMIC_SYSTEM_PROMPT },
        { role: 'user', content: trimmed },
      ],
    };

    let rawContent = '';

    // Node.js 服务端 / CLI 环境下：针对校内 host 建立直连 IP 10.3.19.2 的安全 SNI 连接，绕过代理干扰
    if (typeof window === 'undefined') {
      rawContent = await this.requestNode(payload, apiKey, endpoint);
    } else {
      // 浏览器环境：通过本地 Dev Proxy 反代或生产直连端点
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

    // 后处理：清除 DeepSeek 可能输出的 <think>...</think> 思考标签与代码块包裹
    return this.cleanTranslatedOutput(rawContent);
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

  /**
   * Node.js 环境下通过直连 Agent 执行 HTTP 请求
   */
  private async requestNode(payload: any, apiKey: string, endpointUrl: string): Promise<string> {
    // 若运行在 CLI 或非 Vite 环境下且 process.env 未注入，或传入了非法前缀 key，自动从 .env 回填
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
    // 浏览器端在开发态优先复用本地 Vite 反代避免 CORS 与代理干扰
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

  /**
   * 清洗模型输出，移除 <think> 思考链与多余的 markdown 代码块包裹
   */
  private cleanTranslatedOutput(raw: string): string {
    let text = raw.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    if (text.startsWith('```') && text.endsWith('```')) {
      text = text.replace(/^```(?:markdown|md|text)?\n([\s\S]*?)\n```$/i, '$1').trim();
    }
    return text.trim();
  }
}
