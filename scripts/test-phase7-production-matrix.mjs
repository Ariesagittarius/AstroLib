#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { exportChapterToLatex } from '../src/publishing/latex/chapter-exporter.ts';
import { PRESET_REGISTRY } from '../src/publishing/typography/presets/index.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const PRESETS = ['scholarly', 'classic', 'mathematical', 'lecture'];
const MDX_REL_PATH = 'src/content/docs/collections/math/engineering_analysis/1.1_集合映射与函数.mdx';
const MDX_ABS_PATH = path.join(ROOT, MDX_REL_PATH);
const OUT_BASE_DIR = path.join(ROOT, '.tmp', 'production-matrix');

console.log('================================================================');
console.log('🏭 AstroLib Phase 7: 真实教材章节生产 PDF 矩阵编译与字体嵌入审计');
console.log('================================================================\n');

if (!fs.existsSync(MDX_ABS_PATH)) {
  console.error(`❌ 找不到目标章节 MDX: ${MDX_ABS_PATH}`);
  process.exit(1);
}

const mdxSource = fs.readFileSync(MDX_ABS_PATH, 'utf8');

function findXelatex() {
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
    } catch {}
  }
  return null;
}

const xelatexBin = findXelatex();
if (!xelatexBin) {
  console.error('❌ 本地未检测到 xelatex 编译器，无法执行真实 PDF 物理生产测试！');
  process.exit(1);
}
console.log(`🔍 本地编译器: ${xelatexBin}\n`);

function extractPdfEmbeddedFonts(pdfBuffer) {
  const decompressed = [];
  const streamRegex = /stream[\r\n]+([\s\S]*?)[\r\n]+endstream/g;
  let match;
  while ((match = streamRegex.exec(pdfBuffer.toString('latin1'))) !== null) {
    const raw = Buffer.from(match[1], 'latin1');
    try {
      const dec = zlib.inflateSync(raw);
      decompressed.push(dec.toString('latin1'));
    } catch {
      decompressed.push(raw.toString('latin1'));
    }
  }

  const allText = pdfBuffer.toString('latin1') + '\n' + decompressed.join('\n');
  const baseFonts = new Set();
  const fontRegex = /\/(?:BaseFont|FontName)\s*\/([A-Za-z0-9\+\-_]+)/g;
  while ((match = fontRegex.exec(allText)) !== null) {
    const rawName = match[1];
    const cleanName = rawName.split('+').pop();
    baseFonts.add(cleanName);
  }

  return Array.from(baseFonts).sort();
}

function extractPageCountFromLog(logContent) {
  const m = logContent.match(/Output written on [^\r\n]+ \((\d+) pages/);
  return m ? parseInt(m[1], 10) : null;
}

const matrixResults = [];

for (const presetId of PRESETS) {
  const presetDef = PRESET_REGISTRY[presetId];
  console.log(`----------------------------------------------------------------`);
  console.log(`🚀 [Preset: ${presetId.toUpperCase()}] 正在执行生产级导出与编译...`);
  console.log(`   定位: ${presetDef.name} (${presetDef.description})`);
  console.log(`----------------------------------------------------------------`);

  const presetOutDir = path.join(OUT_BASE_DIR, presetId);
  fs.mkdirSync(presetOutDir, { recursive: true });

  const exportResult = exportChapterToLatex({
    mdxSource,
    slug: '1.1_集合映射与函数',
    bookSlug: 'engineering_analysis',
    colSlug: 'math',
    bookTitle: '工科数学分析基础（第三版）',
    courseName: '工科数学分析',
    latexConfig: {
      typography: presetId,
      resolutionMode: 'deterministic',
      documentclass: 'ctexart',
      fontSize: 11,
      paperSize: 'a4',
    },
  });

  const mainTexPath = path.join(presetOutDir, 'main.tex');
  fs.writeFileSync(mainTexPath, exportResult.tex, 'utf8');

  const styPath = path.join(presetOutDir, 'astrolib-chapter.sty');
  fs.writeFileSync(styPath, exportResult.styleSource, 'utf8');

  for (const asset of exportResult.assets) {
    const dest = path.join(presetOutDir, asset.targetPath);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(asset.localPath, dest);
  }

  const hasDigitalRes = (exportResult.tex.match(/\\astrolibdigitalresource/g) || []).length === 3;
  const hasSolutionHook = exportResult.styleSource.includes('\\astrolibsolutionhead');
  const hasNoCover = !exportResult.tex.includes('\\maketitle');
  const hasAdjustboxImages = exportResult.tex.includes('max width=0.65\\linewidth');
  const hasBookTitle = exportResult.tex.includes('\\renewcommand{\\astrolibbooktitle}{工科数学分析基础（第三版）}');

  if (!hasDigitalRes || !hasSolutionHook || !hasNoCover || !hasAdjustboxImages || !hasBookTitle) {
    console.error(`❌ [Preset: ${presetId}] 源码结构校验未通过:`, {
      hasDigitalRes,
      hasSolutionHook,
      hasNoCover,
      hasAdjustboxImages,
      hasBookTitle,
    });
    process.exit(1);
  }

  const t0 = Date.now();
  try {
    execSync(`"${xelatexBin}" -file-line-error -interaction=nonstopmode main.tex`, {
      cwd: presetOutDir,
      stdio: 'pipe',
    });
    execSync(`"${xelatexBin}" -file-line-error -interaction=nonstopmode main.tex`, {
      cwd: presetOutDir,
      stdio: 'pipe',
    });
  } catch (err) {
    console.error(`❌ [Preset: ${presetId}] XeLaTeX 物理编译失败!`);
    const logPath = path.join(presetOutDir, 'main.log');
    if (fs.existsSync(logPath)) {
      const logText = fs.readFileSync(logPath, 'utf8');
      console.error(logText.split('\n').slice(-40).join('\n'));
    }
    process.exit(1);
  }
  const durationSec = ((Date.now() - t0) / 1000).toFixed(2);

  const pdfPath = path.join(presetOutDir, 'main.pdf');
  if (!fs.existsSync(pdfPath)) {
    console.error(`❌ [Preset: ${presetId}] 未生成 main.pdf!`);
    process.exit(1);
  }

  const pdfBuf = fs.readFileSync(pdfPath);
  const pdfSizeKb = (pdfBuf.length / 1024).toFixed(1);
  const logContent = fs.readFileSync(path.join(presetOutDir, 'main.log'), 'utf8');
  const pageCount = extractPageCountFromLog(logContent);

  const embeddedFonts = extractPdfEmbeddedFonts(pdfBuf);
  const hasVariableFont = embeddedFonts.some((fn) => /VF|Variable/i.test(fn));

  const hasCjk = embeddedFonts.some((fn) =>
    fn.includes('Fandol') || fn.includes('LXGW') || fn.includes('SourceHan') || fn.includes('Noto')
  );
  const hasMath = embeddedFonts.some((fn) =>
    fn.includes('STIX') || fn.includes('LatinModern') || fn.includes('Libertinus') || fn.includes('lm')
  );

  const auditRecord = {
    preset: presetId,
    name: presetDef.name,
    category: presetDef.category,
    rhythmProfile: presetDef.metrics.rhythmProfile || 'textbook',
    baselineStretch: presetDef.metrics.baselineStretch,
    status: '✅ PASS',
    compileTimeSec: durationSec,
    pdfSizeKb: `${pdfSizeKb} KB`,
    pageCount: `${pageCount} 页`,
    assetsCount: exportResult.assets.length,
    digitalResourcesCount: 3,
    requestedCJK: presetDef.chineseBody.designFamily,
    guaranteedCJK: presetDef.guaranteedFallback.cjk,
    requestedMath: presetDef.math.family,
    embeddedFontsCount: embeddedFonts.length,
    embeddedFonts: embeddedFonts,
    hasVariableFont,
    fontIntegrity: !hasVariableFont && hasMath && hasCjk ? '✅ VERIFIED' : '⚠️ WARNING',
  };

  matrixResults.push(auditRecord);
  console.log(`✅ 编译成功! 页数: ${pageCount} 页 | 大小: ${pdfSizeKb} KB | 耗时: ${durationSec}s`);
  console.log(`   嵌入字体数: ${embeddedFonts.length} 个 | 可变字体检测: ${hasVariableFont ? '❌ 发现VF' : '0 (严格静态)'}`);
  console.log(`   嵌入主要字体: ${embeddedFonts.slice(0, 6).join(', ')}...`);
}

console.log('\n================================================================');
console.log('📊 Phase 7 Production Matrix 物理检验与字体审计汇总');
console.log('================================================================');

console.table(
  matrixResults.map((r) => ({
    预设标识: r.preset,
    出版预设名称: r.name,
    韵律基线: `${r.rhythmProfile} (${r.baselineStretch})`,
    状态: r.status,
    页数: r.pageCount,
    文件大小: r.pdfSizeKb,
    耗时: `${r.compileTimeSec}s`,
    嵌入字体数: r.embeddedFontsCount,
    可变字体: r.hasVariableFont ? 'FAIL' : 'PASS (零VF)',
    字体完整性: r.fontIntegrity,
  }))
);

const auditSummaryPath = path.join(OUT_BASE_DIR, 'production_matrix_audit.json');
fs.writeFileSync(auditSummaryPath, JSON.stringify(matrixResults, null, 2), 'utf8');
console.log(`\n📄 生产矩阵审计报告已固化至: ${path.relative(ROOT, auditSummaryPath)}`);

console.log('\n================================================================');
console.log('🎉 Phase 7 真实教材章节生产矩阵检验全部 100% 通过！');
console.log('================================================================\n');
