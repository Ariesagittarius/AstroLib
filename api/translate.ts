/**
 * api/translate.ts
 * ============================================================================
 * AstroLib 生产环境翻译服务端点 (Vercel Serverless Function - Self-Contained)
 * ============================================================================
 * 职责：
 * 1. 响应 CORS 预检 (OPTIONS)，支持生产域名与本地跨域调用；
 * 2. GET /api/translate -> 健康探活与提供商列表；
 * 3. POST /api/translate -> 服务端翻译兜底支持（独立自包含，零外部相对导入，杜绝 Vercel 打包崩溃）；
 * 4. POST /api/translate/batch -> 批量段落翻译；
 * 5. 全面兼容 Node.js runtime (req, res) 与 Web standard Request / Edge runtime。
 * ============================================================================
 */

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Max-Age': '86400',
  'Cache-Control': 'no-cache, no-store, must-revalidate',
};

const DEFAULT_PROVIDERS = [
  { id: 'google', label: 'Google 翻译 (官方/默认)', desc: 'Google 官方成熟机器翻译引擎，响应迅速、翻译稳定' },
  { id: 'zhipu', label: '智谱 GLM-4 (免费)', desc: '智谱开放平台 GLM-4-Flash 官方永久免费模型，国内免翻直连' },
  { id: 'gemini', label: 'Google Gemini (学术推理)', desc: 'Google 官方前沿学术与理科推理模型' },
  { id: 'bupt', label: '北京邮电大学 (校内专属)', desc: '北京邮电大学「人人有算力」校内专属服务，免翻直连' },
];

async function translateWithGoogle(text: string, apiKey?: string): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed) return text;

  // 1. Google Cloud Translation API (v2) if API Key provided
  if (apiKey && apiKey.startsWith('AIzaSy')) {
    try {
      const url = `https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(apiKey)}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ q: trimmed, source: 'en', target: 'zh-CN', format: 'text' }),
      });
      if (res.ok) {
        const data = await res.json();
        const trans = data?.data?.translations?.[0]?.translatedText;
        if (typeof trans === 'string' && trans) return trans;
      }
    } catch {}
  }

  // 2. Chrome Extension Endpoint (clients5)
  try {
    const res = await fetch('https://clients5.google.com/translate_a/t?client=dict-chrome-ex', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
      },
      body: new URLSearchParams({ sl: 'en', tl: 'zh-CN', q: trimmed }),
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && typeof data[0] === 'string') {
        return data.join('');
      }
      if (Array.isArray(data) && Array.isArray(data[0])) {
        return data[0].filter((p: any) => typeof p === 'string').join('');
      }
    }
  } catch {}

  // 3. Fallback GTX
  try {
    const gtxUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=zh-CN&dt=t&q=${encodeURIComponent(trimmed)}`;
    const gtxRes = await fetch(gtxUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    });
    if (gtxRes.ok) {
      const data = await gtxRes.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const full = data[0]
          .filter((part: any) => Array.isArray(part) && typeof part[0] === 'string')
          .map((part: any) => part[0])
          .join('');
        if (full) return full;
      }
    }
  } catch {}

  return trimmed;
}

async function translateWithZhipu(text: string, apiKey: string): Promise<string> {
  const res = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'glm-4-flash',
      temperature: 0.1,
      messages: [
        {
          role: 'system',
          content: '你是一个无状态的高校教材纯文本翻译引擎。你的唯一任务是将输入的英文直接翻译为规范的简体中文。严禁扩写，仅输出翻译结果。',
        },
        {
          role: 'user',
          content: `请直接翻译以下英文内容为简体中文（仅输出译文）：\n<source_text>\n${text}\n</source_text>`,
        },
      ],
    }),
  });
  if (!res.ok) {
    throw new Error(`智谱 API 异常: HTTP ${res.status}`);
  }
  const data = await res.json();
  let content = data?.choices?.[0]?.message?.content || '';
  content = content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  content = content.replace(/<\/?(?:source_text|translation|translated_text)>/gi, '').trim();
  if (content.startsWith('```') && content.endsWith('```')) {
    content = content.replace(/^```(?:markdown|md|text)?\n([\s\S]*?)\n```$/i, '$1').trim();
  }
  return content.replace(/^(?:好的[，,！!]?|以下是翻译[：:]?|翻译如下[：:]?|译文[：:]?)\s*/i, '').trim();
}

async function translateText(text: string, options: any = {}): Promise<{ success: boolean; translatedText: string; provider: string; error?: string }> {
  const provider = options.provider || 'google';
  const apiKey = options.apiKey || (typeof process !== 'undefined' ? process.env?.ZHIPU_API_KEY || process.env?.GOOGLE_TRANSLATE_API_KEY : '');

  try {
    let translated = '';
    if (provider === 'zhipu' && apiKey) {
      translated = await translateWithZhipu(text, apiKey);
    } else {
      translated = await translateWithGoogle(text, apiKey);
    }
    return {
      success: true,
      translatedText: translated || text,
      provider,
    };
  } catch (err: any) {
    return {
      success: false,
      translatedText: text,
      provider,
      error: err?.message || '翻译失败',
    };
  }
}

function sendNodeJson(res: any, statusCode: number, data: any) {
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    for (const [k, v] of Object.entries(CORS_HEADERS)) {
      res.setHeader(k, v);
    }
    return res.status(statusCode).json(data);
  }

  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    ...CORS_HEADERS,
  });
  res.end(JSON.stringify(data));
}

async function readNodeBody(req: any): Promise<any> {
  if (req.body) {
    if (typeof req.body === 'string') {
      try {
        return JSON.parse(req.body);
      } catch {
        return {};
      }
    }
    return req.body;
  }

  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf-8');
  if (!raw.trim()) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/**
 * Node.js Runtime Handler (Vercel Standard Node.js Function)
 */
async function handleNode(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    if (typeof res.status === 'function') {
      for (const [k, v] of Object.entries(CORS_HEADERS)) {
        res.setHeader(k, v);
      }
      return res.status(204).end();
    }
    res.writeHead(204, CORS_HEADERS);
    return res.end();
  }

  if (req.method === 'GET') {
    return sendNodeJson(res, 200, {
      ok: true,
      status: 'ready',
      defaultProvider: 'google',
      providers: DEFAULT_PROVIDERS,
      timestamp: Date.now(),
    });
  }

  if (req.method === 'POST') {
    try {
      const body = await readNodeBody(req);
      const { text, paragraphs, provider, sourceLang, targetLang, apiKey, endpoint, model } = body;

      if (Array.isArray(paragraphs)) {
        const results = await Promise.all(
          paragraphs.map(async (p: any) => {
            const src = typeof p === 'string' ? p : p?.sourceText || '';
            const resSingle = await translateText(src, { provider, apiKey, endpoint, model, sourceLang, targetLang });
            return typeof p === 'string'
              ? resSingle.translatedText
              : { ...p, translatedText: resSingle.translatedText, status: resSingle.success ? 'done' : 'error', error: resSingle.error };
          })
        );
        return sendNodeJson(res, 200, {
          ok: true,
          paragraphs: results,
        });
      }

      if (!text || typeof text !== 'string') {
        return sendNodeJson(res, 400, {
          ok: false,
          error: '缺少有效的待翻译文本 (text)',
        });
      }

      const result = await translateText(text, {
        provider,
        sourceLang,
        targetLang,
        apiKey,
        endpoint,
        model,
      });

      return sendNodeJson(res, result.success ? 200 : 500, {
        ok: result.success,
        ...result,
      });
    } catch (err: any) {
      return sendNodeJson(res, 500, {
        ok: false,
        error: err?.message || '翻译服务器内部异常',
      });
    }
  }

  return sendNodeJson(res, 405, { ok: false, error: 'Method Not Allowed' });
}

/**
 * Web Standard Request / Edge Runtime Handler
 */
async function handleWeb(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method === 'GET') {
    return Response.json(
      {
        ok: true,
        status: 'ready',
        defaultProvider: 'google',
        providers: DEFAULT_PROVIDERS,
        timestamp: Date.now(),
      },
      { headers: CORS_HEADERS }
    );
  }

  if (req.method === 'POST') {
    try {
      const body = await req.json().catch(() => ({}));
      const { text, paragraphs, provider, sourceLang, targetLang, apiKey, endpoint, model } = body;

      if (Array.isArray(paragraphs)) {
        const results = await Promise.all(
          paragraphs.map(async (p: any) => {
            const src = typeof p === 'string' ? p : p?.sourceText || '';
            const resSingle = await translateText(src, { provider, apiKey, endpoint, model, sourceLang, targetLang });
            return typeof p === 'string'
              ? resSingle.translatedText
              : { ...p, translatedText: resSingle.translatedText, status: resSingle.success ? 'done' : 'error', error: resSingle.error };
          })
        );
        return Response.json({ ok: true, paragraphs: results }, { headers: CORS_HEADERS });
      }

      if (!text || typeof text !== 'string') {
        return Response.json(
          { ok: false, error: '缺少有效的待翻译文本 (text)' },
          { status: 400, headers: CORS_HEADERS }
        );
      }

      const result = await translateText(text, {
        provider,
        sourceLang,
        targetLang,
        apiKey,
        endpoint,
        model,
      });

      return Response.json(
        { ok: result.success, ...result },
        { status: result.success ? 200 : 500, headers: CORS_HEADERS }
      );
    } catch (err: any) {
      return Response.json(
        { ok: false, error: err?.message || '翻译服务器内部异常' },
        { status: 500, headers: CORS_HEADERS }
      );
    }
  }

  return Response.json({ ok: false, error: 'Method Not Allowed' }, { status: 405, headers: CORS_HEADERS });
}

/**
 * Universal Handler Entrypoint
 */
export default async function handler(req: any, res?: any) {
  if (!res && typeof req?.headers?.get === 'function') {
    return handleWeb(req);
  }
  return handleNode(req, res);
}

export async function GET(req: Request) {
  return handleWeb(req);
}

export async function POST(req: Request) {
  return handleWeb(req);
}

export async function OPTIONS(req: Request) {
  return handleWeb(req);
}
