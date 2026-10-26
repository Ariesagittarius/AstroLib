import { translationService } from '../../../services/translation/service.ts';

const PROXY_PATH_PREFIX = '/api/translate';

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': '*',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
  });
  res.end(JSON.stringify(data));
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf-8');
  if (!raw.trim()) return {};
  return JSON.parse(raw);
}

export function translationDevServerPlugin() {
  return {
    name: 'astrolib-translation-dev-server',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const rawUrl = req.url || '';
        if (!rawUrl.startsWith(PROXY_PATH_PREFIX)) {
          return next();
        }

        if (req.method === 'OPTIONS') {
          res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Max-Age': '86400',
          });
          return res.end();
        }

        const parsedUrl = new URL(rawUrl, 'http://localhost');
        const pathname = parsedUrl.pathname;

        try {

          if (req.method === 'GET' && pathname === `${PROXY_PATH_PREFIX}/health`) {
            return sendJson(res, 200, {
              ok: true,
              status: 'ready',
              defaultProvider: translationService.getDefaultProviderId(),
              timestamp: Date.now(),
            });
          }

          if (req.method === 'GET' && pathname === `${PROXY_PATH_PREFIX}/providers`) {
            return sendJson(res, 200, {
              ok: true,
              defaultProvider: translationService.getDefaultProviderId(),
              providers: translationService.listProviders(),
            });
          }

          if (req.method === 'POST' && (pathname === PROXY_PATH_PREFIX || pathname === `${PROXY_PATH_PREFIX}/`)) {
            const body = await readJsonBody(req);
            const { text, provider, sourceLang, targetLang, preserveStructure, apiKey, endpoint, model } = body;

            if (!text || typeof text !== 'string') {
              return sendJson(res, 400, {
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

            return sendJson(res, result.success ? 200 : 500, {
              ok: result.success,
              ...result,
            });
          }

          if (req.method === 'POST' && pathname === `${PROXY_PATH_PREFIX}/batch`) {
            const body = await readJsonBody(req);
            const { paragraphs, provider, sourceLang, targetLang, preserveStructure } = body;

            if (!Array.isArray(paragraphs)) {
              return sendJson(res, 400, {
                ok: false,
                error: '缺少段落数组 (paragraphs)',
              });
            }

            const results = await translationService.translateParagraphs(paragraphs, {
              provider,
              sourceLang,
              targetLang,
              preserveStructure: preserveStructure !== false,
            });

            return sendJson(res, 200, {
              ok: true,
              paragraphs: results,
            });
          }

          return sendJson(res, 404, {
            ok: false,
            error: `未知翻译端点: ${pathname}`,
          });
        } catch (err) {
          return sendJson(res, 500, {
            ok: false,
            error: err?.message || '翻译服务器内部错误',
          });
        }
      });
    },
  };
}
