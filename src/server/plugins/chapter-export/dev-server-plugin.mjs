/**
 * dev-server-plugin.mjs: 章节 LaTeX / PDF 导出 · Vite dev server 端点插件
 *
 * 在 Vite connect middleware 层拦截 /__chapter_export__/* 请求：
 * 1) GET /__chapter_export__/health 探活与编译器探测
 * 2) GET /__chapter_export__/export?pathname=...&format=tex|zip|pdf
 *    - 实时解析当前页面对应的 MDX 章节文件
 *    - 调用 scripts/export-chapter-latex.mjs 执行独立进程导出与编译
 *    - format=tex: 下载独立 .tex 源码
 *    - format=zip: 下载含 .tex、.sty 宏包与插图的完整离线可编译压缩包
 *    - format=pdf: 调用本地 XeLaTeX 双遍编译并直出 PDF 流
 *
 * 遵循架构规则：
 * - 纯 .mjs 模块，绝不向 astro.config.mjs 引入未转译的 TypeScript 依赖
 * - 仅在 dev 模式（isEffective('chapterExport')）下挂载，生产构建零污染
 * - 纯 Publishing/Processing 服务，不修改磁盘上的 MDX 源数据 (Rule 9)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { cleanSlug } from '../../../utils/slug.mjs';
import { collections } from '../../../config/collections.config.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');

function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-cache, no-store, must-revalidate',
  });
  res.end(body);
}

/**
 * 探测本地可用的 XeLaTeX 编译器绝对路径
 */
function findXelatexBin() {
  const candidates = [
    'xelatex',
    'D:\\texlive\\2026\\bin\\windows\\xelatex.exe',
    'C:\\texlive\\2026\\bin\\windows\\xelatex.exe',
    'C:\\texlive\\2025\\bin\\windows\\xelatex.exe',
    'C:\\texlive\\2024\\bin\\windows\\xelatex.exe',
  ];

  for (const cand of candidates) {
    try {
      execSync(`"${cand}" --version`, { stdio: 'ignore' });
      return cand;
    } catch (e) {}
  }
  return null;
}

/**
 * 根据前端传入的 pathname 查找对应的本地 MDX 章节文件
 * 兼容 Astro Content Layer 默认的 cleanSlug 规则 (如 2.2_... -> 22_...)
 */
function resolveMdxPathFromUrl(pathname) {
  if (!pathname) return null;
  let decoded = pathname;
  try {
    decoded = decodeURIComponent(pathname);
    if (decoded.includes('%')) {
      decoded = decodeURIComponent(decoded);
    }
  } catch (e) {}

  // 匹配 /collections/:colSlug/:bookSlug/:chapterSlug?
  const match = decoded.match(/\/collections\/([^/]+)\/([^/]+)(?:\/([^/?#]+))?/);
  if (!match) return null;

  const [, colSlug, bookSlug, rawPart] = match;
  let rawChapterSlug = rawPart;
  if (!rawChapterSlug) {
    const col = collections.find((c) => c.slug === colSlug || c.id === colSlug);
    const book = col?.books?.find((b) => b.slug === bookSlug || b.id === bookSlug);
    if (book?.entryPoint) {
      rawChapterSlug = book.entryPoint;
    }
  }
  if (!rawChapterSlug) return null;

  const bookDir = path.join(ROOT, 'src', 'content', 'docs', 'collections', colSlug, bookSlug);
  if (!fs.existsSync(bookDir)) return null;

  const targetCleanSlug = cleanSlug(rawChapterSlug);
  const normalizeKey = (s) => s.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '').toLowerCase();
  const targetKey = normalizeKey(rawChapterSlug);

  // 在书籍目录中匹配文件
  const files = fs.readdirSync(bookDir);
  for (const file of files) {
    if (!file.endsWith('.mdx') && !file.endsWith('.md')) continue;
    const nameWithoutExt = path.basename(file, path.extname(file));
    const fileCleanSlug = cleanSlug(nameWithoutExt);

    if (
      nameWithoutExt === rawChapterSlug ||
      fileCleanSlug === targetCleanSlug ||
      fileCleanSlug === rawChapterSlug ||
      cleanSlug(rawChapterSlug) === nameWithoutExt ||
      normalizeKey(nameWithoutExt) === targetKey
    ) {
      return {
        filePath: path.join(bookDir, file),
        colSlug,
        bookSlug,
        slug: nameWithoutExt,
      };
    }
  }

  return null;
}

async function handle(req, res) {
  const raw = req.url || '';
  const url = new URL(raw, 'http://localhost');
  if (!url.pathname.startsWith('/__chapter_export__')) return false;

  // 1. 探活与能力探测
  if (url.pathname === '/__chapter_export__/health') {
    const xelatexBin = findXelatexBin();
    sendJson(res, 200, {
      ok: true,
      chapterExport: true,
      hasLocalXelatex: !!xelatexBin,
      engine: xelatexBin || 'none',
    });
    return true;
  }

  // 2. 导出主端点
  if (url.pathname === '/__chapter_export__/export' && req.method === 'GET') {
    const pagePathname = url.searchParams.get('pathname');
    const format = url.searchParams.get('format') || 'tex';
    const typography = url.searchParams.get('typography');
    const mode = url.searchParams.get('mode');
    const mathFont = url.searchParams.get('mathFont');
    const cjkFont = url.searchParams.get('cjkFont');
    const fontSize = url.searchParams.get('fontSize');
    const paperSize = url.searchParams.get('paperSize');

    if (!pagePathname) {
      sendJson(res, 400, { ok: false, message: '缺少 pathname 参数' });
      return true;
    }

    const resolved = resolveMdxPathFromUrl(pagePathname);
    if (!resolved) {
      sendJson(res, 404, { ok: false, message: `未找到章节 MDX: ${pagePathname}` });
      return true;
    }

    try {
      const scriptPath = path.join(ROOT, 'scripts', 'export-chapter-latex.mjs');
      const tempOutDir = path.join(ROOT, '.tmp', 'dev-chapter-compile', `${Date.now()}_${resolved.slug}`);
      fs.mkdirSync(tempOutDir, { recursive: true });

      const cmdArgs = [
        `"${process.execPath}"`,
        `"${scriptPath}"`,
        `"${resolved.filePath}"`,
        `--out "${tempOutDir}"`,
      ];

      if (typography) {
        cmdArgs.push(`--typography "${typography}"`);
      } else {
        if (mathFont) cmdArgs.push(`--math-font "${mathFont}"`);
        if (cjkFont) cmdArgs.push(`--cjk-font "${cjkFont}"`);
      }
      if (mode) cmdArgs.push(`--mode "${mode}"`);
      if (fontSize) cmdArgs.push(`--font-size "${fontSize}"`);
      if (paperSize) cmdArgs.push(`--paper-size "${paperSize}"`);

      if (format === 'zip') {
        cmdArgs.push('--zip');
      } else if (format === 'pdf') {
        cmdArgs.push('--compile');
      }

      // 运行独立导出脚本
      execSync(cmdArgs.join(' '), {
        cwd: ROOT,
        stdio: 'pipe',
      });

      const noCacheHeaders = {
        'cache-control': 'no-cache, no-store, must-revalidate',
        'pragma': 'no-cache',
        'expires': '0',
      };

      // 寻找产物并返回
      const outFiles = fs.readdirSync(tempOutDir);

      if (format === 'tex') {
        const texFile = outFiles.find((f) => f.startsWith('chapter_') && f.endsWith('.tex')) || outFiles.find((f) => f.endsWith('.tex'));
        if (!texFile) throw new Error('未找到生成的 .tex 文件');

        const texContent = fs.readFileSync(path.join(tempOutDir, texFile), 'utf8');
        const safeName = encodeURIComponent(texFile);
        res.writeHead(200, {
          'content-type': 'text/plain; charset=utf-8',
          'content-disposition': `attachment; filename="${safeName}"; filename*=UTF-8''${safeName}`,
          ...noCacheHeaders,
        });
        res.end(texContent);
        return true;
      }

      if (format === 'zip') {
        const zipFile = outFiles.find((f) => f.endsWith('.zip'));
        if (!zipFile) throw new Error('未找到生成的 .zip 压缩包');

        const zipBuffer = fs.readFileSync(path.join(tempOutDir, zipFile));
        const safeName = encodeURIComponent(zipFile);
        res.writeHead(200, {
          'content-type': 'application/zip',
          'content-disposition': `attachment; filename="${safeName}"; filename*=UTF-8''${safeName}`,
          'content-length': zipBuffer.length,
          ...noCacheHeaders,
        });
        res.end(zipBuffer);
        return true;
      }

      if (format === 'pdf') {
        const pdfFile = outFiles.find((f) => f.endsWith('.pdf'));
        if (!pdfFile) {
          const logFile = path.join(tempOutDir, 'main.log');
          const logContent = fs.existsSync(logFile) ? fs.readFileSync(logFile, 'utf8') : '';
          sendJson(res, 500, {
            ok: false,
            message: '未生成 PDF 目标产物，请检查本地 LaTeX 环境',
            logSnippet: logContent.split('\n').slice(-30).join('\n'),
          });
          return true;
        }

        const pdfBuffer = fs.readFileSync(path.join(tempOutDir, pdfFile));
        const safeName = encodeURIComponent(pdfFile);
        res.writeHead(200, {
          'content-type': 'application/pdf',
          'content-disposition': `attachment; filename="${safeName}"; filename*=UTF-8''${safeName}`,
          'content-length': pdfBuffer.length,
          ...noCacheHeaders,
        });
        res.end(pdfBuffer);
        return true;
      }

      sendJson(res, 400, { ok: false, message: `不支持的导出格式: ${format}` });
      return true;
    } catch (err) {
      console.error('[chapter-export-plugin] 导出失败:', err);
      sendJson(res, 500, {
        ok: false,
        message: String(err?.message || err),
      });
      return true;
    }
  }

  sendJson(res, 404, { ok: false, message: '未知的导出接口端点' });
  return true;
}

export default function devChapterExportServerPlugin() {
  return {
    name: 'vite-plugin-chapter-export-server',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        try {
          const handled = await handle(req, res);
          if (!handled) next();
        } catch (err) {
          console.error('[chapter-export-plugin] middleware 异常:', err);
          next(err);
        }
      });
    },
  };
}
