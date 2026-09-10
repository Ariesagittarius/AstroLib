#!/usr/bin/env node
/**
 * scripts/generate-metrics-specimens.mjs
 * AstroLib Phase 6A: Typography Metrics Specimen Matrix Generator
 *
 * 任务：
 * 为 4 套已注册预设生成：
 * A. Baseline Specimen (纯净基准排版标本)
 * B. Diagnostic Measurement Specimen (带有光学度量标尺与高亮对齐参考线的诊断标本)
 *
 * 规范：
 * - 产物仅输出到 .tmp/typography-metrics/
 * - 严格作为 Diagnostic Specimen，禁止覆盖任何生产 Golden PDF
 * - 零修改现有 Preset 数据与行为
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import {
  PRESET_REGISTRY,
  listTypographyPresets,
  renderTypographyPreamble,
} from '../src/publishing/typography/index.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const METRICS_DIR = path.join(ROOT, '.tmp', 'typography-metrics');

fs.mkdirSync(METRICS_DIR, { recursive: true });

// 拷贝宏包
const styPath = path.join(ROOT, 'src', 'publishing', 'latex', 'templates', 'astrolib-chapter.sty');
if (fs.existsSync(styPath)) {
  fs.copyFileSync(styPath, path.join(METRICS_DIR, 'astrolib-chapter.sty'));
}

// 探测本地可用 xelatex
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
  console.error('❌ 未找到可用 xelatex 编译器');
  process.exit(1);
}

// -----------------------------------------------------------------------------
// 标本通用正文生成器
// -----------------------------------------------------------------------------

function buildSpecimenBody(isDiagnostic = false) {
  const diagnosticSection = isDiagnostic
    ? `
\\section*{光学基线与字高测量对齐区 (Optical Alignment Diagnostics)}
\\noindent
\\begingroup
\\setlength{\\fboxsep}{0pt}%
\\setlength{\\fboxrule}{0.2pt}%
\\color{black}%
\\textbf{1. 中西文字阶与基准线对齐 (CJK / Latin / Math Baseline)}\\\\
基线对齐参考字串（含红色基准线与上缘包围盒）：\\\\
\\vspace{0.4em}
\\noindent
\\rlap{\\color{red!60}\\rule[0pt]{0.95\\linewidth}{0.3pt}}%
\\rlap{\\color{blue!40}\\rule[7.194pt]{0.95\\linewidth}{0.2pt}}%
\\rlap{\\color{gray!40}\\rule[5.245pt]{0.95\\linewidth}{0.2pt}}%
\\fbox{汉}\\fbox{H}\\fbox{x}\\fbox{a}\\fbox{g} \\quad
\\fbox{学}\\fbox{H}\\fbox{X}\\fbox{$x$}\\fbox{$\\phi$} \\quad
\\fbox{微}\\fbox{M}\\fbox{$\\int$}\\fbox{$\\sum$} \\quad
\\fbox{积}\\fbox{g}\\fbox{p}\\fbox{$\\partial$}
\\quad\\small\\color{gray!80}[红:基线 / 蓝:CapH / 灰:xH]
\\vspace{0.8em}
\\endgroup
`
    : '';

  return `
\\renewcommand{\\astrolibchapternum}{3.}
\\renewcommand{\\astrolibbooktitle}{数学分析与现代物理学导论}

\\section{函数极限与微积分基本定理}

${diagnosticSection}

\\subsection{学术正文与多语种混排 (Ordinary Text)}
微积分学（Calculus）是近代数学的基础，其核心由微分学（Differential Calculus）与积分学（Integral Calculus）构成。
设函数 $f: [a, b] \\to \\mathbb{R}$ 在区间 $[a, b]$ 上连续，则根据实数连续性公理，
存在介值与极值性质。在现代分析体系中，我们通常采用柯西（A.-L. Cauchy）与维尔斯特拉斯（K. Weierstrass）的
严格 $\\varepsilon$-$\\delta$ 语言来刻画收敛过程。

\\subsection{定理与数学证明环境 (Theorem \\& Proof)}

\\begin{theorem}{微积分基本定理 (Fundamental Theorem of Calculus)}{thm:ftc}
设函数 $f(x)$ 在闭区间 $[a, b]$ 上连续，构造变上限积分函数
\\[
  F(x) = \\int_a^x f(t) \\, \\mathrm{d}t, \\quad x \\in [a, b].
\\]
则 $F(x)$ 在 $[a, b]$ 上处处可导，且导数满足：
\\[
  F'(x) = \\frac{\\mathrm{d}}{\\mathrm{d}x} \\left( \\int_a^x f(t) \\, \\mathrm{d}t \\right) = f(x).
\\]
\\end{theorem}

\\begin{proof}
任取 $x \\in (a, b)$，令增量 $\\Delta x$ 满足 $x + \\Delta x \\in [a, b]$。根据定积分的可加性：
\\[
  F(x + \\Delta x) - F(x) = \\int_a^{x + \\Delta x} f(t) \\, \\mathrm{d}t - \\int_a^x f(t) \\, \\mathrm{d}t = \\int_x^{x + \\Delta x} f(t) \\, \\mathrm{d}t.
\\]
由第一积分中值定理，存在 $\\xi \\in [x, x + \\Delta x]$，使得该积分等于 $f(\\xi) \\Delta x$。由于 $f$ 连续，当 $\\Delta x \\to 0$ 时 $\\xi \\to x$，故：
\\[
  \\lim_{\\Delta x \\to 0} \\frac{F(x + \\Delta x) - F(x)}{\\Delta x} = \\lim_{\\xi \\to x} f(\\xi) = f(x).
\\]
证毕。
\\end{proof}

\\subsection{例题分析与解答环境 (Solution \\& Remark)}

\\noindent\\textbf{例 3.1}\\quad 计算如下多元向量场沿闭合光滑曲面的通量：
\\[
  \\Phi = \\oiint_S \\mathbf{F} \\cdot \\mathrm{d}\\mathbf{S}, \\quad \\mathbf{F}(x, y, z) = x^3 \\mathbf{i} + y^3 \\mathbf{j} + z^3 \\mathbf{k}.
\\]

\\noindent\\astrolibsolutionhead 依据高斯散度定理（Divergence Theorem），该通量可转化为闭区域 $V$ 上的三重积分：
\\[
  \\Phi = \\iiint_V \\nabla \\cdot \\mathbf{F} \\, \\mathrm{d}V = 3 \\iiint_V (x^2 + y^2 + z^2) \\, \\mathrm{d}x \\mathrm{d}y \\mathrm{d}z.
\\]
引入球坐标变换 $x = r \\sin\\theta \\cos\\varphi$，$y = r \\sin\\theta \\sin\\varphi$，$z = r \\cos\\theta$，可得雅可比行列式 $|J| = r^2 \\sin\\theta$，代入计算即得精确解。

\\astrolibdigitalresource[国家精品在线开放课程]{高斯散度定理与物理场通量微课}{https://astrolib.org/course/divergence}

\\subsection{脚注与表格微型排版 (Footnote \\& Tabular)}
测试正文脚注引用\\footnote{这是用于测试中西文混排与微型字阶清晰度的学术脚注内容，需验证不同预设下的可读性。}与经典三线表：

\\begin{center}
\\small
\\begin{tabular}{lccc}
  \\toprule
  函数名称 $f(x)$ & 导函数 $f'(x)$ & 收敛半径 $R$ & 奇偶性 \\\\
  \\midrule
  $\\sin x$ & $\\cos x$ & $+\\infty$ & 奇函数 \\\\
  $\\cos x$ & $-\\sin x$ & $+\\infty$ & 偶函数 \\\\
  $\\mathrm{e}^x$ & $\\mathrm{e}^x$ & $+\\infty$ & 非奇非偶 \\\\
  $\\ln(1+x)$ & $\\frac{1}{1+x}$ & $1$ & 非奇非偶 \\\\
  \\bottomrule
\\end{tabular}
\\end{center}
`;
}

// -----------------------------------------------------------------------------
// 编译流程
// -----------------------------------------------------------------------------

console.log('================================================================');
console.log('📐 AstroLib Phase 6A: Specimen Matrix 编译生成器');
console.log('================================================================\n');

const presets = listTypographyPresets();
const specimenResults = [];

for (const preset of presets) {
  const pId = preset.id;
  for (const isDiag of [false, true]) {
    const typeLabel = isDiag ? 'diagnostic' : 'baseline';
    const jobKey = `specimen_${pId}_${typeLabel}`;

    const preamble = renderTypographyPreamble(pId, {
      resolutionMode: 'deterministic',
      includeUnicodeMathPkg: true,
    });

    const texDoc = `\\documentclass[a4paper, 11pt, UTF8, punct=kaiming]{ctexart}
\\usepackage{astrolib-chapter}
\\usepackage{xcolor}
\\graphicspath{{assets/}{images/}{./}}

${preamble}

\\begin{document}
${buildSpecimenBody(isDiag)}
\\end{document}
`;

    const texPath = path.join(METRICS_DIR, `${jobKey}.tex`);
    const pdfPath = path.join(METRICS_DIR, `${jobKey}.pdf`);
    fs.writeFileSync(texPath, texDoc, 'utf8');

    const t0 = Date.now();
    let success = false;
    try {
      execSync(`"${xelatexBin}" -file-line-error -interaction=nonstopmode ${jobKey}.tex`, {
        cwd: METRICS_DIR,
        stdio: 'pipe',
      });
      success = fs.existsSync(pdfPath);
    } catch (e) {}
    const dur = Date.now() - t0;

    specimenResults.push({
      preset: pId,
      type: typeLabel,
      success,
      durationMs: dur,
      pdfKb: success ? (fs.statSync(pdfPath).size / 1024).toFixed(1) : '0',
      pdfPath,
    });

    console.log(`[${success ? 'OK' : 'FAIL'}] ${jobKey} -> ${(dur / 1000).toFixed(2)}s | ${success ? fs.statSync(pdfPath).size + ' B' : 'Failed'}`);
  }
}

console.log('\n================================================================');
console.log(`🏁 Specimen Matrix 编译完成: ${specimenResults.filter((r) => r.success).length} / ${specimenResults.length} 成功`);
console.log(`产物保存在: ${METRICS_DIR}`);
console.log('================================================================\n');
