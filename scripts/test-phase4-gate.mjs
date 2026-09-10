#!/usr/bin/env node
/**
 * scripts/test-phase4-gate.mjs
 * AstroLib Phase 4.5 架构关卡综合验证与审计套件
 *
 * 核心任务：
 * 1. 5 套 Presets × 双态 (deterministic vs adaptive) 编译测试 (共 10 组 Specimen)
 * 2. 8 组 Legacy Combination Matrix (cjkFont × mathFont) 规范化正交编译测试
 * 3. 嵌入字体深度审计 (Requested vs Resolved vs Embedded)
 * 4. 视觉排版层级与解题环境碎片化审查
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import {
  PRESET_REGISTRY,
  listTypographyPresets,
  renderTypographyPreamble,
  resolveTypographyConfig,
  normalizeLegacyIntent,
} from '../src/publishing/typography/index.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const GATE_DIR = path.join(ROOT, '.tmp', 'typography-gate');

fs.mkdirSync(GATE_DIR, { recursive: true });

console.log('================================================================');
console.log('🛡️ AstroLib Phase 4.5 Typography Gate: 双态解析与 Legacy 矩阵审计');
console.log('================================================================\n');

// 探测本地 xelatex
function findXelatex() {
  const candidates = [
    'xelatex',
    'D:\\texlive\\2026\\bin\\windows\\xelatex.exe',
    'C:\\texlive\\2026\\bin\\windows\\xelatex.exe',
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
  console.error('❌ 未检测到 xelatex 编译器！');
  process.exit(1);
}
console.log(`🔍 本地编译器: ${xelatexBin}\n`);

// 拷贝宏包
const stySource = fs.readFileSync(
  path.join(ROOT, 'src', 'publishing', 'latex', 'templates', 'astrolib-chapter.sty'),
  'utf8'
);
fs.writeFileSync(path.join(GATE_DIR, 'astrolib-chapter.sty'), stySource, 'utf8');

// Python 字体提取辅助函数
function inspectPdfEmbeddedFonts(pdfPath) {
  if (!fs.existsSync(pdfPath)) return [];
  try {
    const pyCode = `
import zlib, re, sys
pdf_path = sys.argv[1]
with open(pdf_path, 'rb') as f:
    data = f.read()
decompressed_chunks = []
for m in re.finditer(rb'stream[\\r\\n]+([\\s\\S]*?)[\\r\\n]+endstream', data):
    raw = m.group(1)
    try:
        decompressed_chunks.append(zlib.decompress(raw))
    except:
        decompressed_chunks.append(raw)
all_text = data + b'\\n' + b'\\n'.join(decompressed_chunks)
base_fonts = set()
for match in re.finditer(rb'/(?:BaseFont|FontName)\\s*/([A-Za-z0-9\\+\\-_]+)', all_text):
    clean = match.group(1).decode('latin1', errors='ignore').split('+')[-1]
    base_fonts.add(clean)
print(';'.join(sorted(base_fonts)))
`;
    const out = execSync(`python -c "${pyCode.replace(/\n/g, ' ')}" "${pdfPath}"`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    }).trim();
    return out ? out.split(';') : [];
  } catch (e) {
    return ['inspect_error'];
  }
}

// 核心 Specimen 正文
const SPECIMEN_BODY = `
\\renewcommand{\\astrolibchapternum}{2.}
\\renewcommand{\\astrolibbooktitle}{工科数学分析基础（第三版）}
\\renewcommand{\\thesection}{\\astrolibchapternum\\arabic{section}}

\\begin{center}
  {\\zihao{4}\\kaishu 工科数学分析基础　第二章 一元微分学}\\par\\vspace{0.4em}
  {\\zihao{2}\\bfseries 2.2 求导法则与学术排版评测样本}\\par\\vspace{0.6em}
  {\\small\\normalfont AstroLib 架构审定委员会}\\par\\vspace{0.6em}
\\end{center}
\\vspace{-0.2em}\\hrule height 0.6pt\\vspace{1.5em}

\\section{中西文与数学公式混排基准}
设随机变量 $X$ 的概率密度函数为 $p(x)$。在概率论中，特征函数 (The characteristic function of $X$) 定义为：
\\[
  \\varphi(t) = \\mathbb{E}\\left[ \\mathrm{e}^{\\mathrm{i}tX} \\right] = \\int_{-\\infty}^{+\\infty} \\mathrm{e}^{\\mathrm{i}tx} p(x) \\,\\mathrm{d}x, \\quad t \\in \\mathbb{R}.
\\]
当 $X \\sim \\mathcal{N}(\\mu, \\sigma^2)$ 服从正态分布时，其密度函数包含高斯积分核：
\\[
  p(x) = \\frac{1}{\\sqrt{2\\pi}\\,\\sigma} \\exp\\left( -\\frac{(x - \\mu)^2}{2\\sigma^2} \\right).
\\]
中文标点混排：已知非负数列 $\\{a_n\\}$、$\\{b_n\\}$ 满足 $\\lim_{n \\to \\infty} a_n = 0$，且对任意实数 $x \\in \\mathbb{R}$，导数算子满足线性性质。

\\section{学术定理族与解题环境}
\\begin{theorem}{柯西中值定理 (Cauchy Mean Value Theorem)}{thm:cauchy}
设函数 $f(x)$ 和 $g(x)$ 在闭区间 $[a, b]$ 连续，在开区间 $(a, b)$ 可导，且 $g'(x) \\ne 0$。则存在 $\\xi \\in (a, b)$ 使得：
\\[
  \\frac{f(b) - f(a)}{g(b) - g(a)} = \\frac{f'(\\xi)}{g'(\\xi)}.
\\]
\\end{theorem}

\\begin{proof}
构造辅助函数 $F(x) = [f(b) - f(a)] g(x) - [g(b) - g(a)] f(x)$，应用罗尔定理即证。
\\end{proof}

\\begin{solution}[解]
对直接函数求一阶导数，利用链式法则：
\\[
  y' = \\frac{1}{x + \\sqrt{1 + x^2}} \\cdot \\left( 1 + \\frac{x}{\\sqrt{1 + x^2}} \\right) = \\frac{1}{\\sqrt{1 + x^2}}.
\\]
二阶导数即得 $y'' = -\\frac{x}{(1+x^2)^{3/2}}$。
\\end{solution}

\\astrolibdigitalresource[国家精品开放课程]{反函数求导法则高清微课}{https://astrolib.org/res/1}
`;

// =============================================================================
// [任务 1] 4 套 Preset × 双态 (Deterministic vs Adaptive) 评测
// =============================================================================
console.log('--- [阶段 1] 4 套 Preset × 双态解析测试 ---');
const presets = listTypographyPresets().map((p) => p.id);
const modes = ['deterministic', 'adaptive'];
const dualResults = [];

for (const pId of presets) {
  for (const mode of modes) {
    const jobKey = `${pId}_${mode}`;
    const preamble = renderTypographyPreamble(pId, {
      resolutionMode: mode,
      includeUnicodeMathPkg: true,
    });

    const texDoc = `\\documentclass[a4paper, 11pt, UTF8, punct=kaiming]{ctexart}
\\usepackage{astrolib-chapter}
\\graphicspath{{assets/}{images/}{./}}

${preamble}

\\begin{document}
${SPECIMEN_BODY}
\\end{document}
`;

    const texPath = path.join(GATE_DIR, `${jobKey}.tex`);
    const pdfPath = path.join(GATE_DIR, `${jobKey}.pdf`);
    const logPath = path.join(GATE_DIR, `${jobKey}.log`);
    fs.writeFileSync(texPath, texDoc, 'utf8');

    const t0 = Date.now();
    let success = false;
    try {
      execSync(`"${xelatexBin}" -file-line-error -interaction=nonstopmode ${jobKey}.tex`, {
        cwd: GATE_DIR,
        stdio: 'pipe',
      });
      success = fs.existsSync(pdfPath);
    } catch (e) {}
    const dur = Date.now() - t0;

    const embedded = inspectPdfEmbeddedFonts(pdfPath);
    const preset = PRESET_REGISTRY[pId];

    // 分析 CJK 主体嵌入情况
    const hasSourceHan = embedded.some((f) => f.includes('SourceHan'));
    const hasFandolSong = embedded.some((f) => f.includes('FandolSong'));
    const hasWenKai = embedded.some((f) => f.includes('WenKai'));
    const hasSimSun = embedded.some((f) => f.includes('SimSun'));

    let resolvedCjk = 'unknown';
    if (hasSourceHan) resolvedCjk = 'Source Han Serif';
    else if (hasWenKai) resolvedCjk = 'LXGW WenKai';
    else if (hasFandolSong) resolvedCjk = 'FandolSong';
    else if (hasSimSun) resolvedCjk = 'SimSun';

    const isDesignSpecimen =
      (pId === 'classic' && hasFandolSong) ||
      (pId === 'lecture' && hasWenKai) ||
      ((pId === 'scholarly' || pId === 'mathematical') && hasSourceHan);

    dualResults.push({
      preset: pId,
      mode,
      success,
      durationMs: dur,
      pdfKb: success ? (fs.statSync(pdfPath).size / 1024).toFixed(1) : '0',
      requestedCjk: preset.chineseBody.primaryFamily,
      resolvedCjk,
      embeddedFonts: embedded.filter((f) => !f.includes('Identity-H')).slice(0, 4).join(', '),
      specimenType: isDesignSpecimen ? 'Design Specimen (生产态)' : 'Fallback Specimen (回退态)',
    });
  }
}

console.table(
  dualResults.map((r) => ({
    Preset: r.preset,
    Mode: r.mode,
    '编译状态': r.success ? '✅ PASS' : '❌ FAIL',
    '耗时(s)': (r.durationMs / 1000).toFixed(2),
    'PDF (KB)': r.pdfKb,
    '设计请求 CJK': r.requestedCjk,
    '实际嵌入 CJK': r.resolvedCjk,
    '标本属性': r.specimenType,
  }))
);

// =============================================================================
// [任务 2] 8 组 Legacy Combination Matrix (cjkFont × mathFont) 评测
// =============================================================================
console.log('\n--- [阶段 2] Legacy 规范化正交组合矩阵测试 (2 × 4 = 8 组) ---');
const legacyCjks = ['default', 'sourcehan'];
const legacyMaths = ['typst', 'modern', 'times', 'pagella'];
const legacyResults = [];

for (const cjk of legacyCjks) {
  for (const mf of legacyMaths) {
    const jobKey = `legacy_${cjk}_${mf}`;
    const legacyOpts = { cjkFont: cjk, mathFont: mf };
    const intent = normalizeLegacyIntent(legacyOpts);

    const preamble = renderTypographyPreamble(legacyOpts, {
      resolutionMode: 'deterministic',
      includeUnicodeMathPkg: true,
    });

    const texDoc = `\\documentclass[a4paper, 11pt, UTF8, punct=kaiming]{ctexart}
\\usepackage{astrolib-chapter}
\\graphicspath{{assets/}{images/}{./}}

${preamble}

\\begin{document}
${SPECIMEN_BODY}
\\end{document}
`;

    const texPath = path.join(GATE_DIR, `${jobKey}.tex`);
    const pdfPath = path.join(GATE_DIR, `${jobKey}.pdf`);
    fs.writeFileSync(texPath, texDoc, 'utf8');

    const t0 = Date.now();
    let success = false;
    try {
      execSync(`"${xelatexBin}" -file-line-error -interaction=nonstopmode ${jobKey}.tex`, {
        cwd: GATE_DIR,
        stdio: 'pipe',
      });
      success = fs.existsSync(pdfPath);
    } catch (e) {}
    const dur = Date.now() - t0;

    const embedded = inspectPdfEmbeddedFonts(pdfPath);

    legacyResults.push({
      cjkFont: cjk,
      mathFont: mf,
      basePreset: intent.basePresetId,
      mathOverride: intent.overrides?.mathFamily || 'none',
      success,
      pdfKb: success ? (fs.statSync(pdfPath).size / 1024).toFixed(1) : '0',
      embeddedMath: embedded.find((f) => f.includes('Math')) || 'unknown',
    });
  }
}

console.table(
  legacyResults.map((r) => ({
    cjkFont: r.cjkFont,
    mathFont: r.mathFont,
    '映射基准 Preset': r.basePreset,
    '正交公式覆盖': r.mathOverride,
    '编译状态': r.success ? '✅ PASS' : '❌ FAIL',
    'PDF (KB)': r.pdfKb,
    '实装数学字体': r.embeddedMath,
  }))
);

// 统计总判定
const allDualPass = dualResults.every((r) => r.success);
const allLegacyPass = legacyResults.every((r) => r.success);

console.log('\n================================================================');
if (allDualPass && allLegacyPass) {
  console.log('🏁 Phase 4.5 全部 10 组双态 Specimen 与 8 组 Legacy 矩阵 100% 编译通过！');
} else {
  console.error('❌ Phase 4.5 测试存在编译失败项！');
  process.exit(1);
}
console.log('================================================================\n');
