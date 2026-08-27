import { generateBookRelationGraph } from './generator.mjs';

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
  if (!url.pathname.startsWith('/__relation_graph__')) return false;

  if (url.pathname === '/__relation_graph__/health') {
    sendJson(res, 200, { ok: true, relationGraph: true });
    return true;
  }

  if (url.pathname === '/__relation_graph__/data' && req.method === 'GET') {
    const col = url.searchParams.get('col');
    const book = url.searchParams.get('book');

    if (!col || !book) {
      sendJson(res, 400, { ok: false, message: '缺少 col 或 book 参数' });
      return true;
    }

    try {
      const data = generateBookRelationGraph(col, book);
      if (!data) {
        sendJson(res, 404, { ok: false, message: `未找到书籍数据: ${col}/${book}` });
      } else {
        sendJson(res, 200, data);
      }
    } catch (err) {
      sendJson(res, 500, { ok: false, message: String(err?.message || err) });
    }
    return true;
  }

  sendJson(res, 404, { ok: false, message: '未知的关系图端点' });
  return true;
}

export default function devRelationGraphServerPlugin() {
  return {
    name: 'vite-plugin-relation-graph-server',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        handle(req, res).then((handled) => {
          if (!handled) next();
        }).catch((err) => {
          console.error('[relation-graph-server] 内部异常:', err);
          next();
        });
      });
    },
  };
}
