/**
 * dev-server-plugin.mjs：书籍模块巡检与查重工具 · Vite dev server 端点插件
 *
 * 在 Vite connect middleware 层拦截 /__inspector__/* 请求，直接从本地磁盘实时
 * 扫描指定书籍的 MDX 章节文件，提取卡片模块与查重信息并返回 JSON。
 * 仅在 dev 模式（isEffective('inspector')）下挂载，生产构建零污染。
 */


import { scanBookModules, listAllBooks } from './scanner.mjs';

function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-cache, no-store, must-revalidate',
  });
  res.end(body);
}

async function handle(req, res) {
  const raw = req.url || '';
  const url = new URL(raw, 'http://localhost');
  if (!url.pathname.startsWith('/__inspector__')) return false;

  // 1. 探活
  if (url.pathname === '/__inspector__/health') {
    sendJson(res, 200, { ok: true, inspector: true });
    return true;
  }

  // 2. 获取所有书籍列表
  if (url.pathname === '/__inspector__/books' && req.method === 'GET') {
    const books = listAllBooks();
    sendJson(res, 200, { ok: true, books });
    return true;
  }

  // 3. 扫描指定书籍的模块与查重信息
  if (url.pathname === '/__inspector__/modules' && req.method === 'GET') {
    const col = url.searchParams.get('col');
    const book = url.searchParams.get('book');

    if (!col || !book) {
      sendJson(res, 400, { ok: false, message: '缺少 col 或 book 参数' });
      return true;
    }

    try {
      const data = scanBookModules(col, book);
      sendJson(res, data.ok ? 200 : 404, data);
    } catch (err) {
      sendJson(res, 500, { ok: false, message: String(err?.message || err) });
    }
    return true;
  }

  sendJson(res, 404, { ok: false, message: '未知的巡检工具端点' });
  return true;
}

export default function devInspectorServerPlugin() {
  return {
    name: 'dev-inspector-server',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        try {
          const handled = await handle(req, res);
          if (!handled) next();
        } catch (err) {
          sendJson(res, 500, { ok: false, message: String(err?.message || err) });
        }
      });
    },
  };
}
