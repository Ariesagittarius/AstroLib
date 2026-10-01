import fs from 'node:fs';

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
            let bodyBuffer = await readBody(req);

            if (subPath.includes('/openai/chat/completions')) {
              try {
                const parsed = JSON.parse(bodyBuffer.toString('utf-8'));
                if (Array.isArray(parsed.messages)) {
                  let mutated = false;
                  for (const m of parsed.messages) {
                    if (m && m.role === 'assistant' && Array.isArray(m.tool_calls)) {
                      for (const tc of m.tool_calls) {
                        if (!tc.extra_content?.google?.thought_signature) {
                          tc.extra_content = {
                            ...(tc.extra_content || {}),
                            google: {
                              ...((tc.extra_content && tc.extra_content.google) || {}),
                              thought_signature: 'skip_thought_signature_validator',
                            },
                          };
                          mutated = true;
                        }
                      }
                    }
                  }
                  if (mutated) {
                    bodyBuffer = Buffer.from(JSON.stringify(parsed));
                  }
                }
              } catch {

              }
            }
            fetchOptions.body = bodyBuffer;
          }

          const upstreamRes = await fetch(targetUrl, fetchOptions);

          const responseHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': '*',
          };

          const upstreamContentType = upstreamRes.headers.get('content-type') || '';
          if (upstreamContentType) {
            responseHeaders['Content-Type'] = upstreamContentType;
          }
          const upstreamCacheControl = upstreamRes.headers.get('cache-control');
          if (upstreamCacheControl) {
            responseHeaders['Cache-Control'] = upstreamCacheControl;
          }

          if (upstreamContentType.includes('text/event-stream')) {
            responseHeaders['Cache-Control'] = 'no-cache, no-transform';
            responseHeaders['Connection'] = 'keep-alive';
            responseHeaders['X-Accel-Buffering'] = 'no';
          }

          res.writeHead(upstreamRes.status, responseHeaders);

          try {
            fs.writeFileSync('.astro/gemini-last-req.json', JSON.stringify({
              time: new Date().toISOString(),
              url: targetUrl,
              status: upstreamRes.status,
              headers: Object.fromEntries(upstreamRes.headers.entries()),
              body: hasBody && fetchOptions.body ? fetchOptions.body.toString('utf-8') : null,
            }, null, 2));
            fs.writeFileSync('.astro/gemini-raw-stream.log', '');
          } catch {}

          if (upstreamRes.body) {
            for await (const chunk of upstreamRes.body) {
              if (res.writableEnded) break;
              try {
                fs.appendFileSync('.astro/gemini-raw-stream.log', chunk);
              } catch {}
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
