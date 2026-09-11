const GOOGLE_API_HOST = 'https://generativelanguage.googleapis.com';
const PROXY_PATH_PREFIX = '/api/proxy/gemini';
const DEFAULT_GEMINI_SUBPATH = '/v1beta/openai/chat/completions';

export function geminiProxyDevServerPlugin() {
  return {
    name: 'astrolib-gemini-proxy-dev-server',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const rawUrl = req.url || '';
        if (!rawUrl.startsWith(PROXY_PATH_PREFIX)) {
          return next();
        }

        if (req.method === 'OPTIONS') {
          res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Max-Age': '86400',
          });
          return res.end();
        }

        const parsedUrl = new URL(rawUrl, 'http://localhost');
        const pathname = parsedUrl.pathname;

        if (req.method === 'GET' && (pathname === `${PROXY_PATH_PREFIX}/health` || pathname === `${PROXY_PATH_PREFIX}/health/`)) {
          res.writeHead(200, {
            'Content-Type': 'application/json; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
          });
          return res.end(
            JSON.stringify({
              ok: true,
              status: 'ready',
              provider: 'gemini',
              target: GOOGLE_API_HOST,
              timestamp: Date.now(),
            })
          );
        }

        let subPath = pathname.slice(PROXY_PATH_PREFIX.length);
        if (!subPath || subPath === '/') {
          subPath = DEFAULT_GEMINI_SUBPATH;
        }

        const targetUrl = new URL(`${subPath}${parsedUrl.search}`, GOOGLE_API_HOST).toString();

        const forwardHeaders = new Headers();
        const HOP_BY_HOP_HEADERS = new Set([
          'host',
          'origin',
          'referer',
          'connection',
          'content-length',
          'transfer-encoding',
          'cookie',
          'sec-fetch-mode',
          'sec-fetch-site',
          'sec-fetch-dest',
        ]);

        for (const [key, value] of Object.entries(req.headers)) {
          if (!key || HOP_BY_HOP_HEADERS.has(key.toLowerCase())) continue;
          if (Array.isArray(value)) {
            for (const v of value) forwardHeaders.append(key, v);
          } else if (typeof value === 'string') {
            forwardHeaders.set(key, value);
          }
        }

        const abortController = new AbortController();
        const hasBody = ['POST', 'PUT', 'PATCH'].includes(req.method || '');

        res.on('close', () => {
          if (!res.writableFinished) {
            abortController.abort();
          }
        });

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

        try {
          const fetchOptions = {
            method: req.method,
            headers: forwardHeaders,
            signal: abortController.signal,
          };

          if (hasBody) {
            const bodyBuffer = await readBody(req);
            fetchOptions.body = bodyBuffer;
          }

          const upstreamRes = await fetch(targetUrl, fetchOptions);

          const responseHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': '*',
          };

          const upstreamContentType = upstreamRes.headers.get('content-type');
          if (upstreamContentType) {
            responseHeaders['Content-Type'] = upstreamContentType;
          }
          const upstreamCacheControl = upstreamRes.headers.get('cache-control');
          if (upstreamCacheControl) {
            responseHeaders['Cache-Control'] = upstreamCacheControl;
          }

          res.writeHead(upstreamRes.status, responseHeaders);

          if (upstreamRes.body) {
            for await (const chunk of upstreamRes.body) {
              if (res.writableEnded) break;
              res.write(chunk);
            }
          }
          res.end();
        } catch (err) {
          if (abortController.signal.aborted) {
            if (!res.writableEnded) res.end();
            return;
          }
          console.error(`[gemini-proxy] 转发 Google 请求失败 (${targetUrl}):`, err?.message || err);

          if (!res.headersSent) {
            res.writeHead(502, {
              'Content-Type': 'application/json; charset=utf-8',
              'Access-Control-Allow-Origin': '*',
            });
          }
          res.end(
            JSON.stringify({
              error: {
                message: `[本地中继反代] 转发 Google 请求失败: ${err?.message || '网络连接超时或上游无响应'}`,
                code: 'UPSTREAM_PROXY_ERROR',
                status: 'UNAVAILABLE',
              },
            })
          );
        }
      });
    },
  };
}
