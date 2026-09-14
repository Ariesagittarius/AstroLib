#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import {
  exportChapterToLatex,
  createChapterZipPackage,
} from '../src/publishing/latex/chapter-exporter.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
  console.log(`
📚 AstroLib 章节 LaTeX / PDF 导出工具

用法:
  node scripts/export-chapter-latex.mjs <mdx-path> [options]

参数:
  <mdx-path>       MDX 章节文件路径（支持相对或绝对路径）

选项:
  --out <dir>            输出产物目录 (默认: .tmp/export/<章节名>/)
  --zip                  生成包含 .tex、.sty 及配图 assets 的离线编译 ZIP 包
  --compile              调用本地 XeLaTeX 引擎执行双遍编译生成 PDF
  --book <title>         指定全书书名
  --course <name>        指定课程名称
  --typography <preset>  学术排版预设 (scholarly | classic | mathematical | lecture，默认: scholarly)
  --font-size <pt>       正文字号 (10.5 | 11 | 12，默认: 11)
  --paper-size <size>    纸张规格 (a4 | b5，默认: a4)
`);
  process.exit(0);
}

let targetMdx = '';
let outDirArg = '';
let shouldZip = false;
let shouldCompile = false;
let customBook = '';
let customCourse = '';
let typography = 'scholarly';
let resolutionMode = 'deterministic';
let mathFont = 'typst';
let cjkFont = 'default';
let fontSize = 11;
let paperSize = 'a4';

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--zip') {
    shouldZip = true;
  } else if (arg === '--compile') {
    shouldCompile = true;
  } else if (arg === '--out' && i + 1 < args.length) {
    outDirArg = args[++i];
  } else if (arg === '--book' && i + 1 < args.length) {
    customBook = args[++i];
  } else if (arg === '--course' && i + 1 < args.length) {
    customCourse = args[++i];
  } else if (arg === '--typography' && i + 1 < args.length) {
    typography = args[++i];
  } else if (arg === '--mode' && i + 1 < args.length) {
    resolutionMode = args[++i];
  } else if (arg === '--math-font' && i + 1 < args.length) {
    mathFont = args[++i];
  } else if (arg === '--cjk-font' && i + 1 < args.length) {
    cjkFont = args[++i];
  } else if (arg === '--font-size' && i + 1 < args.length) {
    fontSize = parseFloat(args[++i]);
  } else if (arg === '--paper-size' && i + 1 < args.length) {
    paperSize = args[++i];
  } else if (!arg.startsWith('-') && !targetMdx) {
    targetMdx = arg;
  }
}

if (!targetMdx) {
  console.error('❌ 错误: 未指定目标 MDX 文件路径');
  process.exit(1);
}

const resolvedMdxPath = path.isAbsolute(targetMdx)
  ? targetMdx
  : path.resolve(process.cwd(), targetMdx);

if (!fs.existsSync(resolvedMdxPath)) {
  console.error(`❌ 找不到文件: ${resolvedMdxPath}`);
  process.exit(1);
}

const relToDocs = path.relative(path.join(ROOT, 'src', 'content', 'docs'), resolvedMdxPath);
const pathParts = relToDocs.split(path.sep);
let colSlug = '';
let bookSlug = '';

if (pathParts[0] === 'collections' && pathParts.length >= 4) {
  colSlug = pathParts[1];
  bookSlug = pathParts[2];
}

const fileBaseName = path.basename(resolvedMdxPath, path.extname(resolvedMdxPath));
const mdxSource = fs.readFileSync(resolvedMdxPath, 'utf8');

console.log('------------------------------------------------------------');
console.log(`📖 正在导出章节: ${fileBaseName}`);
console.log(`📂 文件来源: ${path.relative(ROOT, resolvedMdxPath)}`);
console.log('------------------------------------------------------------');

const exportResult = exportChapterToLatex({
  mdxSource,
  slug: fileBaseName,
  bookSlug,
  colSlug,
  bookTitle: customBook,
  courseName: customCourse,
  latexConfig: {
    typography,
    resolutionMode,
    mathFont,
    cjkFont,
    fontSize,
    paperSize,
    documentclass: 'ctexart',
  },
});

const targetDir = outDirArg
  ? path.resolve(process.cwd(), outDirArg)
  : path.join(ROOT, '.tmp', 'export', exportResult.cleanTitle);

fs.mkdirSync(targetDir, { recursive: true });

const texFilePath = path.join(targetDir, exportResult.filename);
fs.writeFileSync(texFilePath, exportResult.tex, 'utf8');

const mainTexPath = path.join(targetDir, 'main.tex');
fs.writeFileSync(mainTexPath, exportResult.tex, 'utf8');

const styFilePath = path.join(targetDir, 'astrolib-chapter.sty');
fs.writeFileSync(styFilePath, exportResult.styleSource, 'utf8');

if (exportResult.assets.length > 0) {
  for (const asset of exportResult.assets) {
    const dest = path.join(targetDir, asset.targetPath);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    try {
      fs.copyFileSync(asset.localPath, dest);
    } catch (e) {
      console.warn(`⚠️ 无法复制配图 ${asset.localPath}:`, e.message);
    }
  }
}

console.log(`✅ LaTeX 源码已生成: ${path.relative(ROOT, texFilePath)}`);
console.log(`✅ 独立样式包已就绪: ${path.relative(ROOT, styFilePath)}`);
console.log(`✅ 配图资源已复制: ${exportResult.assets.length} 张`);

if (shouldZip) {
  const zipBuffer = createChapterZipPackage(exportResult);
  const zipPath = path.join(targetDir, `${exportResult.cleanTitle}.zip`);
  fs.writeFileSync(zipPath, zipBuffer);
  console.log(`📦 离线 ZIP 归档包已生成: ${path.relative(ROOT, zipPath)} (${(zipBuffer.length / 1024).toFixed(1)} KB)`);
}

if (shouldCompile) {
  console.log('\n⏳ 正在探测本地 XeLaTeX 编译器...');
  const candidates = [
    'xelatex',
    'D:\\texlive\\2026\\bin\\windows\\xelatex.exe',
    'C:\\texlive\\2026\\bin\\windows\\xelatex.exe',
    'C:\\texlive\\2025\\bin\\windows\\xelatex.exe',
    'C:\\texlive\\2024\\bin\\windows\\xelatex.exe',
  ];

  let xelatexBin = null;
  for (const cand of candidates) {
    try {
      execSync(`"${cand}" --version`, { stdio: 'ignore' });
      xelatexBin = cand;
      break;
    } catch (e) {}
  }

  if (!xelatexBin) {
    console.warn('⚠️ 未在系统 PATH 中找到 xelatex，跳过物理 PDF 编译');
  } else {
    console.log(`🚀 使用编译器: ${xelatexBin}`);
    try {
      console.log('⏳ 执行第 1 遍编译 (生成目录与排版布局)...');
      execSync(`"${xelatexBin}" -file-line-error -interaction=nonstopmode main.tex`, {
        cwd: targetDir,
        stdio: 'pipe',
      });

      console.log('⏳ 执行第 2 遍编译 (解析引用与标号)...');
      execSync(`"${xelatexBin}" -file-line-error -interaction=nonstopmode main.tex`, {
        cwd: targetDir,
        stdio: 'pipe',
      });

      const pdfSrc = path.join(targetDir, 'main.pdf');
      const targetPdfName = `${exportResult.cleanTitle}.pdf`;
      const pdfDest = path.join(targetDir, targetPdfName);

      if (fs.existsSync(pdfSrc)) {
        fs.copyFileSync(pdfSrc, pdfDest);
        const stat = fs.statSync(pdfDest);
        console.log(`\n🎉 PDF 编译完成！`);
        console.log(`📄 目标 PDF: ${path.relative(ROOT, pdfDest)} (${(stat.size / 1024).toFixed(1)} KB)`);
      }
    } catch (err) {
      console.error('❌ XeLaTeX 编译失败:');
      const logPath = path.join(targetDir, 'main.log');
      if (fs.existsSync(logPath)) {
        const log = fs.readFileSync(logPath, 'utf8');
        console.error(log.split('\n').slice(-40).join('\n'));
      } else {
        console.error(err.message);
      }
      process.exit(1);
    }
  }
}

console.log('\n✨ 章节导出完成！产物位于: ' + path.relative(ROOT, targetDir));
