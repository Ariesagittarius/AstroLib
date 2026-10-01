/**
 * api/translate.ts
 * ============================================================================
 * AstroLib 生产环境翻译服务端点 (Vercel Serverless Function)
 * ============================================================================
 * 职责：
 * 1. 响应 CORS 预检 (OPTIONS)，支持生产域名与本地跨域调用；
 * 2. GET /api/translate -> 健康探活与提供商列表；
 * 3. POST /api/translate -> 调用 TranslationService 完成单段文本/整篇翻译（含公式遮蔽与还原）；
 * 4. POST /api/translate/batch -> 批量段落翻译；
 * 5. 全面兼容 Node.js runtime (req, res) 与 Web standard Request / Edge runtime。
 * ============================================================================
 */

import { translationService } from '../src/services/translation/service.ts';

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Max-Age': '86400',
  'Cache-Control': 'no-cache, no-store, must-revalidate',
};

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
      defaultProvider: translationService.getDefaultProviderId(),
      providers: translationService.listProviders(),
      timestamp: Date.now(),
    });
  }

  if (req.method === 'POST') {
    try {
      const body = await readNodeBody(req);
      const { text, paragraphs, provider, sourceLang, targetLang, preserveStructure, apiKey, endpoint, model } = body;

      if (Array.isArray(paragraphs)) {
        const results = await translationService.translateParagraphs(paragraphs, {
          provider,
          sourceLang,
          targetLang,
          preserveStructure: preserveStructure !== false,
          apiKey,
          endpoint,
          model,
        });
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

      const result = await translationService.translate(text, {
        provider,
        sourceLang,
        targetLang,
        preserveStructure: preserveStructure !== false,
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
        defaultProvider: translationService.getDefaultProviderId(),
        providers: translationService.listProviders(),
        timestamp: Date.now(),
      },
      { headers: CORS_HEADERS }
    );
  }

  if (req.method === 'POST') {
    try {
      const body = await req.json().catch(() => ({}));
      const { text, paragraphs, provider, sourceLang, targetLang, preserveStructure, apiKey, endpoint, model } = body;

      if (Array.isArray(paragraphs)) {
        const results = await translationService.translateParagraphs(paragraphs, {
          provider,
          sourceLang,
          targetLang,
          preserveStructure: preserveStructure !== false,
          apiKey,
          endpoint,
          model,
        });
        return Response.json({ ok: true, paragraphs: results }, { headers: CORS_HEADERS });
      }

      if (!text || typeof text !== 'string') {
        return Response.json(
          { ok: false, error: '缺少有效的待翻译文本 (text)' },
          { status: 400, headers: CORS_HEADERS }
        );
      }

      const result = await translationService.translate(text, {
        provider,
        sourceLang,
        targetLang,
        preserveStructure: preserveStructure !== false,
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
