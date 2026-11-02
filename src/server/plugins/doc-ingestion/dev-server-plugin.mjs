/**
 * src/server/plugins/doc-ingestion/dev-server-plugin.mjs
 * ============================================================================
 * Vite Dev Server 插件：MinerU 文档摄取与自动解析服务接口 (/api/ingest/*)
 * ============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import { TaskManager } from './task-manager.ts';

const INGEST_PATH_PREFIX = '/api/ingest';

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

async function readBufferBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

async function readJsonBody(req) {
  const raw = (await readBufferBody(req)).toString('utf-8');
  if (!raw.trim()) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function ingestDevServerPlugin() {
  const taskManager = TaskManager.getInstance();

  return {
    name: 'astrolib-doc-ingestion-dev-server',
    configureServer(server) {
      // 彻底防止 Vite watcher 监听 task/ 临时摄取目录，避免 Windows 解压文件时的 EBUSY 锁文件崩溃
      if (server.watcher) {
        try {
          server.watcher.unwatch('**/task/**');
          server.watcher.unwatch(path.resolve('task'));
        } catch {
          // ignore
        }
      }

      server.middlewares.use(async (req, res, next) => {
        const rawUrl = req.url || '';
        if (!rawUrl.startsWith(INGEST_PATH_PREFIX)) {
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

        const urlObj = new URL(rawUrl, 'http://localhost');
        const pathname = urlObj.pathname;
        const query = Object.fromEntries(urlObj.searchParams.entries());

        try {
          // 2. 健康探活与环境诊断 /api/ingest/health
          if (req.method === 'GET' && pathname === `${INGEST_PATH_PREFIX}/health`) {
            const apiToken = taskManager.getApiClient().getToken();
            const localStatus = await taskManager.getLocalRunner().checkEnvironment();
            return sendJson(res, 200, {
              status: 'ok',
              api: {
                hasToken: Boolean(apiToken),
                tokenPrefix: apiToken ? apiToken.slice(0, 8) + '...' : null,
              },
              local: localStatus,
              timestamp: Date.now(),
            });
          }

          // 2.1 更新 MinerU API Token /api/ingest/token
          if (req.method === 'POST' && pathname === `${INGEST_PATH_PREFIX}/token`) {
            const body = await readJsonBody(req);
            const token = body.token;
            if (!token || typeof token !== 'string') {
              return sendJson(res, 400, { error: '请提供有效的 token 字符串' });
            }
            taskManager.getApiClient().setToken(token);
            return sendJson(res, 200, { success: true, message: 'MinerU API Token 已更新' });
          }

          // 3. 上传 PDF /api/ingest/upload
          if (req.method === 'POST' && pathname === `${INGEST_PATH_PREFIX}/upload`) {
            const fileBuffer = await readBufferBody(req);
            if (!fileBuffer || fileBuffer.length === 0) {
              return sendJson(res, 400, { error: '上传内容为空' });
            }

            // 从请求头获取文件名与参数
            let rawFileName = req.headers['x-file-name'];
            let fileName = 'document.pdf';
            if (rawFileName) {
              try {
                fileName = decodeURIComponent(String(rawFileName));
              } catch {
                fileName = String(rawFileName);
              }
            }

            const rawEngine = req.headers['x-engine'];
            const engine = rawEngine === 'local' ? 'local' : rawEngine === 'agent' ? 'agent' : 'api';
            const pageRanges = req.headers['x-page-ranges'] ? String(req.headers['x-page-ranges']) : undefined;

            const taskMeta = await taskManager.createTask(fileName, fileBuffer, {
              engine,
              pageRanges,
            });

            return sendJson(res, 200, {
              success: true,
              task: taskMeta,
            });
          }

          // 4. 触发解析 /api/ingest/parse
          if (req.method === 'POST' && pathname === `${INGEST_PATH_PREFIX}/parse`) {
            const body = await readJsonBody(req);
            const taskId = body.taskId;
            if (!taskId) {
              return sendJson(res, 400, { error: '缺少 taskId' });
            }

            const engine = body.engine === 'local' ? 'local' : body.engine === 'agent' ? 'agent' : 'api';
            const updatedTask = taskManager.startParse(taskId, engine);
            return sendJson(res, 200, { success: true, task: updatedTask });
          }

          // 4.1 AI Agent 专用免密极速轻量解析 /api/ingest/agent-parse
          if (req.method === 'POST' && pathname === `${INGEST_PATH_PREFIX}/agent-parse`) {
            const buffer = await readBufferBody(req);
            if (!buffer || buffer.length === 0) {
              return sendJson(res, 400, { error: '文件内容为空' });
            }
            if (buffer.length > 10 * 1024 * 1024) {
              return sendJson(res, 400, { error: 'Agent 免密解析仅支持 <= 10MB 的文件' });
            }

            const tempId = `agent_tmp_${Date.now()}`;
            const tempDir = path.join(taskManager.getBaseDir(), '.agent_temp', tempId);
            fs.mkdirSync(tempDir, { recursive: true });
            const tempPdf = path.join(tempDir, 'doc.pdf');
            fs.writeFileSync(tempPdf, buffer);

            try {
              const { markdown } = await taskManager.getApiClient().parseWithAgentApi(tempPdf);
              return sendJson(res, 200, { success: true, markdown });
            } finally {
              fs.rmSync(tempDir, { recursive: true, force: true });
            }
          }

          // 5. 查询任务状态 /api/ingest/status
          if (req.method === 'GET' && pathname === `${INGEST_PATH_PREFIX}/status`) {
            const taskId = query.taskId;
            if (!taskId) {
              return sendJson(res, 400, { error: '缺少 taskId' });
            }
            const task = taskManager.getTask(taskId);
            if (!task) {
              return sendJson(res, 404, { error: `未找到任务 ${taskId}` });
            }
            return sendJson(res, 200, { task });
          }

          // 6. 获取解析结果 (Markdown + Blocks + Images) /api/ingest/result
          if (req.method === 'GET' && pathname === `${INGEST_PATH_PREFIX}/result`) {
            const taskId = query.taskId;
            if (!taskId) {
              return sendJson(res, 400, { error: '缺少 taskId' });
            }
            const result = taskManager.getResult(taskId);
            if (!result) {
              const task = taskManager.getTask(taskId);
              if (task && task.status !== 'completed') {
                return sendJson(res, 202, { message: '解析尚未完成', status: task.status, progress: task.progress });
              }
              return sendJson(res, 404, { error: `未找到任务 ${taskId} 的成果数据` });
            }
            return sendJson(res, 200, { result });
          }

          // 7. 流式传输原版 PDF /api/ingest/pdf?taskId=...
          if (req.method === 'GET' && pathname === `${INGEST_PATH_PREFIX}/pdf`) {
            const taskId = query.taskId;
            if (!taskId) return sendJson(res, 400, { error: '缺少 taskId' });

            const pdfPath = path.join(taskManager.getBaseDir(), taskId, 'origin.pdf');
            if (!fs.existsSync(pdfPath)) {
              return sendJson(res, 404, { error: '未找到对应 PDF 文件' });
            }

            const stat = fs.statSync(pdfPath);
            res.writeHead(200, {
              'Content-Type': 'application/pdf',
              'Content-Length': stat.size,
              'Access-Control-Allow-Origin': '*',
              'Accept-Ranges': 'bytes',
              'Cache-Control': 'public, max-age=3600',
            });
            fs.createReadStream(pdfPath).pipe(res);
            return;
          }

          // 8. 访问提取出的图片资源 /api/ingest/image?taskId=...&name=...
          if (req.method === 'GET' && pathname === `${INGEST_PATH_PREFIX}/image`) {
            const taskId = query.taskId;
            const imageName = query.name;
            if (!taskId || !imageName) {
              return sendJson(res, 400, { error: '缺少 taskId 或 image name' });
            }

            const taskDir = path.join(taskManager.getBaseDir(), taskId, 'unpacked');
            // 递归搜索该图片
            let foundPath = null;
            const findImg = (dir) => {
              if (!fs.existsSync(dir)) return;
              const entries = fs.readdirSync(dir, { withFileTypes: true });
              for (const ent of entries) {
                const full = path.join(dir, ent.name);
                if (ent.isFile() && ent.name === imageName) {
                  foundPath = full;
                  return;
                }
                if (ent.isDirectory()) {
                  findImg(full);
                  if (foundPath) return;
                }
              }
            };

            findImg(taskDir);

            if (!foundPath || !fs.existsSync(foundPath)) {
              return sendJson(res, 404, { error: '图片不存在' });
            }

            const ext = path.extname(imageName).toLowerCase();
            const mimeMap = {
              '.png': 'image/png',
              '.jpg': 'image/jpeg',
              '.jpeg': 'image/jpeg',
              '.webp': 'image/webp',
              '.svg': 'image/svg+xml',
            };
            const contentType = mimeMap[ext] || 'application/octet-stream';

            res.writeHead(200, {
              'Content-Type': contentType,
              'Access-Control-Allow-Origin': '*',
              'Cache-Control': 'public, max-age=86400',
            });
            fs.createReadStream(foundPath).pipe(res);
            return;
          }

          // 9. 下载清洗数据包 ZIP /api/ingest/download-zip?taskId=...
          if (req.method === 'GET' && pathname === `${INGEST_PATH_PREFIX}/download-zip`) {
            const taskId = query.taskId;
            if (!taskId) return sendJson(res, 400, { error: '缺少 taskId' });

            const zipPath = path.join(taskManager.getBaseDir(), taskId, 'unpacked', 'result_archive.zip');
            if (fs.existsSync(zipPath)) {
              const stat = fs.statSync(zipPath);
              res.writeHead(200, {
                'Content-Type': 'application/zip',
                'Content-Length': stat.size,
                'Content-Disposition': `attachment; filename="mineru_clean_${taskId}.zip"`,
                'Access-Control-Allow-Origin': '*',
              });
              fs.createReadStream(zipPath).pipe(res);
              return;
            }

            return sendJson(res, 404, { error: 'ZIP 归档尚未生成或已过期' });
          }

          // 10. 一键转入 AstroLib 书籍合集 /api/ingest/export-book
          if (req.method === 'POST' && pathname === `${INGEST_PATH_PREFIX}/export-book`) {
            const body = await readJsonBody(req);
            const { taskId, collectionSlug, bookSlug, bookTitle } = body;
            if (!taskId || !collectionSlug || !bookSlug) {
              return sendJson(res, 400, { error: '缺少必要参数 taskId, collectionSlug, bookSlug' });
            }

            const exportResult = await taskManager.exportToCollection(
              taskId,
              collectionSlug,
              bookSlug,
              bookTitle || bookSlug
            );

            return sendJson(res, 200, { success: true, exportResult });
          }

          // 未匹配的子路由
          return sendJson(res, 404, { error: `未知的摄取 API 路径: ${pathname}` });
        } catch (err) {
          return sendJson(res, 500, {
            error: err instanceof Error ? err.message : String(err),
          });
        }
      });
    },
  };
}
