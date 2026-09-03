import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..', '..');
const DATA_DIR = path.join(ROOT, 'src', 'data', 'exercises');
const SRC_DATA = path.join(DATA_DIR, 'engineering_analysis_exercises.json');
const FEEDBACK_FILE = path.join(DATA_DIR, 'feedbacks.json');
const COMMUNITY_SOL_FILE = path.join(DATA_DIR, 'community_ai_solutions.json');

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(data));
}

function sanitizeLatexValue(val) {
  if (typeof val === 'string') {
    let str = val;
    str = str.replace(/\x0c/g, '\\f');
    str = str.replace(/\x08/g, '\\b');
    str = str.replace(/\x0b/g, '\\v');
    str = str.replace(/\r(?!\n)/g, '\\r');
    str = str.replace(/\t([a-zA-Z])/g, '\\t$1');
    str = str.replace(/(\$\$[\s\S]+?\$\$|\$[^\$\n]+?\$)/g, (m) => m.replace(/\t/g, ' '));
    str = str.replace(/(\$\$[\s\S]+?\$\$|\$[^\$\n]+?\$)/g, (m) =>
      m.replace(/\n(u|eq|ne|not|nabla|notin|nrightarrow|natural|nearrow|nwarrow|neg|normalsize)\b/g, '\\n$1')
    );
    str = str.replace(/\\iiiint_{\\Omega}/g, '\\iiint_{\\Omega}');
    str = str.replace(/\\overparen\{([^}]+)\}/g, '\\stackrel{\\frown}{$1}');
    str = str.replace(/\\wideparen\{([^}]+)\}/g, '\\stackrel{\\frown}{$1}');
    return str;
  } else if (Array.isArray(val)) {
    return val.map(sanitizeLatexValue);
  } else if (val && typeof val === 'object') {
    const res = {};
    for (const [k, v] of Object.entries(val)) {
      res[k] = sanitizeLatexValue(v);
    }
    return res;
  }
  return val;
}

export function exerciseDevServerPlugin() {
  return {
    name: 'astrolib-exercise-dev-server',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url, 'http://localhost');
        const pathname = url.pathname;

        if (!pathname.startsWith('/api/exercise')) {
          return next();
        }

        if (req.method === 'OPTIONS') {
          res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          });
          return res.end();
        }

        if (pathname === '/api/exercise/save-source' && req.method === 'POST') {
          try {
            const body = await parseJsonBody(req);
            const { question_id, chapter, question_data } = body;

            if (!question_id || !question_data) {
              return sendJson(res, 400, { error: '缺少 question_id 或 question_data' });
            }

            if (!fs.existsSync(SRC_DATA)) {
              return sendJson(res, 500, { error: '源数据文件不存在: ' + SRC_DATA });
            }

            const rawData = JSON.parse(fs.readFileSync(SRC_DATA, 'utf-8'));
            let found = false;
            const chapters = rawData.chapters || {};

            const cleanQuestionData = sanitizeLatexValue(question_data);

            const chKeys = chapter ? [String(chapter)] : Object.keys(chapters);
            for (const chKey of chKeys) {
              const qList = chapters[chKey] || [];
              const idx = qList.findIndex((q) => q.id === question_id);
              if (idx !== -1) {

                qList[idx] = {
                  ...qList[idx],
                  ...cleanQuestionData,
                  id: question_id,
                };
                found = true;
                break;
              }
            }

            if (!found) {
              return sendJson(res, 404, { error: `未在题库中找到题目: ${question_id}` });
            }

            fs.writeFileSync(SRC_DATA, JSON.stringify(rawData, null, 2), 'utf-8');

            try {
              execSync('node scripts/build-exercise-data.mjs', { cwd: ROOT, stdio: 'pipe' });
            } catch (buildErr) {
              console.warn('[exercise-dev-server] 重新生成 public 题库数据警告:', buildErr);
            }

            console.log(`[exercise-dev-server] 题目 ${question_id} 源码已热持久化至源 JSON`);
            return sendJson(res, 200, {
              success: true,
              message: `题目 [${question_id}] 源码修改已成功持久化，并完成题库增量编译！`,
            });
          } catch (err) {
            console.error('[exercise-dev-server] 保存源码错误:', err);
            return sendJson(res, 500, { error: '保存失败: ' + err.message });
          }
        }

        if (pathname === '/api/exercise/feedback' && req.method === 'POST') {
          try {
            const body = await parseJsonBody(req);
            let feedbacks = [];
            if (fs.existsSync(FEEDBACK_FILE)) {
              try {
                feedbacks = JSON.parse(fs.readFileSync(FEEDBACK_FILE, 'utf-8'));
              } catch {}
            }
            feedbacks.unshift(body);
            fs.writeFileSync(FEEDBACK_FILE, JSON.stringify(feedbacks, null, 2), 'utf-8');
            console.log(`[exercise-dev-server] 收到读者对 [${body.question_id}] 的勘误反馈`);
            return sendJson(res, 200, { success: true, message: '反馈已记录到本地' });
          } catch (err) {
            return sendJson(res, 500, { error: err.message });
          }
        }

        if (pathname === '/api/exercise/community-solutions' && req.method === 'GET') {
          try {
            const questionId = url.searchParams.get('question_id');
            let solutions = [];
            if (fs.existsSync(COMMUNITY_SOL_FILE)) {
              try {
                solutions = JSON.parse(fs.readFileSync(COMMUNITY_SOL_FILE, 'utf-8'));
              } catch {}
            }
            if (questionId) {
              solutions = solutions.filter((s) => s.question_id === questionId);
            }
            return sendJson(res, 200, solutions);
          } catch (err) {
            return sendJson(res, 500, { error: err.message });
          }
        }

        if (pathname === '/api/exercise/community-solutions' && req.method === 'POST') {
          try {
            const body = await parseJsonBody(req);
            let solutions = [];
            if (fs.existsSync(COMMUNITY_SOL_FILE)) {
              try {
                solutions = JSON.parse(fs.readFileSync(COMMUNITY_SOL_FILE, 'utf-8'));
              } catch {}
            }
            solutions.unshift(body);
            fs.writeFileSync(COMMUNITY_SOL_FILE, JSON.stringify(solutions, null, 2), 'utf-8');
            console.log(`[exercise-dev-server] 题目 [${body.question_id}] 上传了新的 AI 题解 (模型: ${body.model_name})`);
            return sendJson(res, 200, { success: true, data: body });
          } catch (err) {
            return sendJson(res, 500, { error: err.message });
          }
        }

        if (pathname === '/api/exercise/community-solutions/upvote' && req.method === 'POST') {
          try {
            const body = await parseJsonBody(req);
            const { id } = body;
            let solutions = [];
            if (fs.existsSync(COMMUNITY_SOL_FILE)) {
              try {
                solutions = JSON.parse(fs.readFileSync(COMMUNITY_SOL_FILE, 'utf-8'));
              } catch {}
            }
            const item = solutions.find((s) => s.id === id);
            if (item) {
              item.upvotes = (item.upvotes || 0) + 1;
              fs.writeFileSync(COMMUNITY_SOL_FILE, JSON.stringify(solutions, null, 2), 'utf-8');
              return sendJson(res, 200, { success: true, upvotes: item.upvotes });
            }
            return sendJson(res, 404, { error: '未找到对应题解' });
          } catch (err) {
            return sendJson(res, 500, { error: err.message });
          }
        }

        next();
      });
    },
  };
}
