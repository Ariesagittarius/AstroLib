// src/server/plugins/bupt-proxy/dev-server-plugin.mjs
// Vite Dev Server 插件：为北京邮电大学「人人有算力」AI 资源服务平台提供本地中继反代
// 原理：Node.js 本地进程自动绕过本地科学上网客户端对校内域名的 fake-ip 劫持，
// 直接建立至校内专用网关 10.3.19.2 的 TLS SNI 连接，并支持全双工 SSE 流式透明转发与鉴权预填。

import https from 'node:https';
import net from 'node:net';
import dns from 'node:dns';
import zlib from 'node:zlib';

const BUPT_GATEWAY_HOST = 'myai.bupt.edu.cn';
const BUPT_CAMPUS_IP = '10.3.19.2';
const PROXY_PATH_PREFIX = '/api/proxy/bupt';
const DEFAULT_BUPT_SUBPATH = '/llm-gw/v1/chat/completions';

// 自定义 SNI 直连解析器：强制将 myai.bupt.edu.cn 映射为校内专用 IP 10.3.19.2
function customLookup(hostname, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  if (hostname === BUPT_GATEWAY_HOST) {
    if (options && options.all) {
      return callback(null, [{ address: BUPT_CAMPUS_IP, family: 4 }]);
    }
    return callback(null, BUPT_CAMPUS_IP, 4);
  }
  return dns.lookup(hostname, options, callback);
}

const directAgent = new https.Agent({
  lookup: customLookup,
  keepAlive: true,
});

// 内存缓存校园网探针结果（15 秒），避免每次页面请求都发起 TCP 探测
let _campusCache = { isCampus: false, lastCheck: 0 };

async function probeCampusNetwork() {
  const now = Date.now();
  if (now - _campusCache.lastCheck < 15000) {
    return _campusCache.isCampus;
  }
  return new Promise((resolve) => {
    let resolved = false;
    const finish = (result) => {
      if (resolved) return;
      resolved = true;
      try {
        socket.destroy();
      } catch {}
      _campusCache = { isCampus: result, lastCheck: Date.now() };
      resolve(result);
    };

    const socket = net.createConnection({ host: BUPT_CAMPUS_IP, port: 443, timeout: 1500 }, () => {
      finish(true);
    });

    socket.on('error', () => finish(false));
    socket.on('timeout', () => finish(false));
  });
}

/**
 * 构造与启动 BUPT AI 本地中继 Vite Dev Server 插件
 */
export function buptProxyDevServerPlugin() {
  return {
    name: 'astrolib-bupt-proxy-dev-server',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const rawUrl = req.url || '';
        if (!rawUrl.startsWith(PROXY_PATH_PREFIX)) {
          return next();
        }

        // 1. 响应浏览器 CORS 预检
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

        // 2. 健康与校园网连通探测端点 (极速 2ms TCP 探针，零阻塞)
        if (
          req.method === 'GET' &&
          (pathname === `${PROXY_PATH_PREFIX}/health` || pathname === `${PROXY_PATH_PREFIX}/health/`)
        ) {
          const isCampus = await probeCampusNetwork();
          if (!res.headersSent && !res.writableEnded) {
            res.writeHead(200, {
              'Content-Type': 'application/json; charset=utf-8',
              'Access-Control-Allow-Origin': '*',
            });
            res.end(
              JSON.stringify({
                ok: true,
                isCampus,
                status: isCampus ? 'ready' : 'unreachable',
                provider: 'bupt',
                target: BUPT_CAMPUS_IP,
                timestamp: Date.now(),
              })
            );
          }
          return;
        }

        // 3. 计算目标上游 URL（自动规范化 subPath）
        let subPath = pathname.slice(PROXY_PATH_PREFIX.length);
        if (!subPath || subPath === '/') {
          subPath = DEFAULT_BUPT_SUBPATH;
        } else if (!subPath.startsWith('/llm-gw/v1/')) {
          // 若前端直接请求 /api/proxy/bupt/chat/completions，自动补全网关前缀
          subPath = `/llm-gw/v1${subPath.startsWith('/') ? '' : '/'}${subPath}`;
        }

        const targetUrl = `https://${BUPT_GATEWAY_HOST}${subPath}${parsedUrl.search}`;

        // 4. 清洗并构造转发请求头
        const forwardHeaders = {};
        const HOP_BY_HOP_HEADERS = new Set([
          'host',
          'origin',
          'referer',
          'connection',
          'transfer-encoding',
          'accept-encoding',
          'cookie',
          'sec-fetch-mode',
          'sec-fetch-site',
          'sec-fetch-dest',
        ]);

        for (const [key, value] of Object.entries(req.headers)) {
          if (!key || HOP_BY_HOP_HEADERS.has(key.toLowerCase())) continue;
          forwardHeaders[key] = value;
        }

        forwardHeaders['Host'] = BUPT_GATEWAY_HOST;
        // 显式声明要求明文，避免上游 gzip 压缩导致浏览器本地中继解析异常
        forwardHeaders['accept-encoding'] = 'identity';

        // 若请求中未包含 Authorization 且环境变量存在 BUPT_API_KEY，自动补齐
        if (!forwardHeaders['authorization'] && process.env.BUPT_API_KEY) {
          forwardHeaders['authorization'] = `Bearer ${process.env.BUPT_API_KEY.trim()}`;
        }

        // 5. 读取请求体
        const hasBody = ['POST', 'PUT', 'PATCH'].includes(req.method || '');

        async function readBody(readable) {
          const chunks = [];
          for await (const chunk of readable) {
            chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
          }
          return Buffer.concat(chunks);
        }

        let bodyBuffer = null;
        if (hasBody) {
          bodyBuffer = await readBody(req);
          forwardHeaders['content-length'] = Buffer.byteLength(bodyBuffer);
        }

        // 6. 发起上游请求与流式透传
        const clientReq = https.request(
          targetUrl,
          {
            agent: directAgent,
            method: req.method,
            headers: forwardHeaders,
          },
          (upstreamRes) => {
            if (res.headersSent || res.writableEnded) return;

            const responseHeaders = {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
              'Access-Control-Allow-Headers': '*',
            };

            const upstreamContentType = upstreamRes.headers['content-type'] || '';
            if (upstreamContentType) {
              responseHeaders['Content-Type'] = upstreamContentType;
            }
            const upstreamCacheControl = upstreamRes.headers['cache-control'];
            if (upstreamCacheControl) {
              responseHeaders['Cache-Control'] = upstreamCacheControl;
            }

            if (upstreamContentType.includes('text/event-stream')) {
              responseHeaders['Cache-Control'] = 'no-cache, no-transform';
              responseHeaders['Connection'] = 'keep-alive';
              responseHeaders['X-Accel-Buffering'] = 'no';
            }

            res.writeHead(upstreamRes.statusCode || 200, responseHeaders);

            // 自动透明解压：若上游忽略 identity 仍返回 gzip/deflate/br，自动解压后推送纯净文本至浏览器
            let stream = upstreamRes;
            const contentEncoding = (upstreamRes.headers['content-encoding'] || '').toLowerCase();
            if (contentEncoding === 'gzip') {
              stream = upstreamRes.pipe(zlib.createGunzip());
            } else if (contentEncoding === 'deflate') {
              stream = upstreamRes.pipe(zlib.createInflate());
            } else if (contentEncoding === 'br') {
              stream = upstreamRes.pipe(zlib.createBrotliDecompress());
            }

            stream.on('data', (chunk) => {
              if (!res.writableEnded) {
                res.write(chunk);
              }
            });

            stream.on('end', () => {
              if (!res.writableEnded) {
                res.end();
              }
            });

            stream.on('error', (err) => {
              console.error(`[bupt-proxy] 上游流传输/解压中断:`, err?.message || err);
              if (!res.writableEnded) res.end();
            });
          }
        );

        // 客户端提前关闭时，终止上游请求
        res.on('close', () => {
          if (!res.writableFinished) {
            clientReq.destroy();
          }
        });

        clientReq.on('error', (err) => {
          console.error(`[bupt-proxy] 转发 BUPT 网关请求失败 (${targetUrl}):`, err?.message || err);
          if (!res.headersSent) {
            res.writeHead(502, {
              'Content-Type': 'application/json; charset=utf-8',
              'Access-Control-Allow-Origin': '*',
            });
          }
          if (!res.writableEnded) {
            res.end(
              JSON.stringify({
                error: {
                  message: `[本地中继反代] 转发北京邮电大学算力网关失败: ${err?.message || '网络连接超时或上游未响应'}。请确保已连接校园网或北邮 VPN。`,
                  code: 'UPSTREAM_PROXY_ERROR',
                  status: 'UNAVAILABLE',
                },
              })
            );
          }
        });

        if (bodyBuffer) {
          clientReq.write(bodyBuffer);
        }
        clientReq.end();
      });
    },
  };
}
