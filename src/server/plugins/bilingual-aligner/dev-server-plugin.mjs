/**
 * src/server/plugins/bilingual-aligner/dev-server-plugin.mjs
 * ============================================================================
 * Vite Dev Server 插件：端侧轻量向量对齐与目录多向匹配服务接口 (/__bilingual__/*)
 * ============================================================================
 */

import { BilingualOnnxEngine } from './onnx-engine.ts';

const BILINGUAL_PATH_PREFIX = '/__bilingual__';

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

export function bilingualDevServerPlugin() {
  const engine = BilingualOnnxEngine.getInstance();

  return {
    name: 'astrolib-bilingual-aligner-dev-server',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const rawUrl = req.url || '';
        if (!rawUrl.startsWith(BILINGUAL_PATH_PREFIX)) {
          return next();
        }

        // 1. CORS 预检
        if (req.method === 'OPTIONS') {
          res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Max-Age': '86400',
          });
          return res.end();
        }

        const path = rawUrl.split('?')[0];

        try {
          // 2. 健康探活 /__bilingual__/health
          if (req.method === 'GET' && path === `${BILINGUAL_PATH_PREFIX}/health`) {
            return sendJson(res, 200, {
              status: 'ok',
              engine: 'onnxruntime-node',
              timestamp: Date.now(),
            });
          }

          // 3. 段落向量对齐 /__bilingual__/align
          if (req.method === 'POST' && path === `${BILINGUAL_PATH_PREFIX}/align`) {
            const body = await readJsonBody(req);
            const sourceTexts = body.sourceTexts || [];
            const targetTexts = body.targetTexts || [];

            if (!Array.isArray(sourceTexts) || !Array.isArray(targetTexts)) {
              return sendJson(res, 400, { error: 'sourceTexts and targetTexts must be arrays of strings' });
            }

            const result = await engine.alignParagraphs(sourceTexts, targetTexts);
            return sendJson(res, 200, result);
          }

          // 4. 目录章节对齐 /__bilingual__/toc-match
          if (req.method === 'POST' && path === `${BILINGUAL_PATH_PREFIX}/toc-match`) {
            const body = await readJsonBody(req);
            const sourceChapters = body.sourceChapters || [];
            const targetChapters = body.targetChapters || [];

            const matches = await engine.matchToc(sourceChapters, targetChapters);
            return sendJson(res, 200, { matches });
          }

          return sendJson(res, 404, { error: 'Not Found' });
        } catch (err) {
          console.error('[bilingual-server] Request handler error:', err);
          return sendJson(res, 500, { error: err.message || 'Internal Server Error' });
        }
      });
    },
  };
}
