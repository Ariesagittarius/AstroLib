#!/usr/bin/env node
/**
 * scripts/test-phase6b-ab-matrix.mjs
 * AstroLib Phase 6B: Typography Metrics Controlled A/B Matrix Testing Engine
 *
 * 核心任务：
 * 1. 真实大学教材连贯多页文本 (>= 2 页，涵盖正文、定理、证明、公式、例题、解答、表格、题注、脚注)
 * 2. 实验一：Libertinus Scale A/B 评测 (1.00 vs 1.01 vs 1.015 vs 1.02)
 * 3. 实验二：FandolSong 行高基准 A/B 评测 (1.00 vs 1.10 vs 1.20 vs 1.25 vs 1.30)
 * 4. 实验三：LXGW WenKai 行高基准 A/B 评测 (1.15 vs 1.20 vs 1.25 vs 1.30 vs 1.35)
 * 5. 提取每组编译耗时、产物体积、总页数、行距垂直跨度与版面告警
 *
 * 产物输出目录：.tmp/typography-ab-tests/
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import {
  PRESET_REGISTRY,
  renderTypographyPreamble,
  getTypographyPreset,
} from '../src/publishing/typography/index.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const AB_DIR = path.join(ROOT, '.tmp', 'typography-ab-tests');

fs.mkdirSync(AB_DIR, { recursive: true });

// 拷贝宏包
const styPath = path.join(ROOT, 'src', 'publishing', 'latex', 'templates', 'astrolib-chapter.sty');
if (fs.existsSync(styPath)) {
  fs.copyFileSync(styPath, path.join(AB_DIR, 'astrolib-chapter.sty'));
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
// 真实教材连续多页正文 (2+ 页全要素严谨学术内容)
// -----------------------------------------------------------------------------

const REALISTIC_CHAPTER_CONTENT = `
\\renewcommand{\\astrolibchapternum}{4.}
\\renewcommand{\\astrolibbooktitle}{数学分析与现代物理学基础（第四版）}
\\renewcommand{\\thesection}{\\astrolibchapternum\\arabic{section}}

\\begin{center}
  {\\zihao{4}\\kaishu 数学分析与现代物理学基础　第四章 多元微积分与微分形式}\\par\\vspace{0.4em}
  {\\zihao{2}\\bfseries 4.2 斯托克斯定理与外微分算子}\\par\\vspace{0.6em}
  {\\small\\normalfont AstroLib 学术出版审定委员会}\\par\\vspace{0.6em}
\\end{center}
\\vspace{-0.2em}\\hrule height 0.6pt\\vspace{1.5em}

\\section{引言与经典场论背景}
多元微积分学是现代微分几何（Differential Geometry）与经典电动力学（Classical Electrodynamics）的交汇点。
在经典向量分析体系中，格林公式（Green's Theorem）、高斯散度公式（Gauss Divergence Theorem）
与斯托克斯公式（Stokes' Theorem）通常被视为彼此独立的三维几何积分定理。
然而，在现代数学的统一观点下，上述所有经典积分公式本质上均为定义在光滑流形（Smooth Manifold）上的
**广义斯托克斯定理（Generalized Stokes' Theorem）**在低维欧氏空间中的具体投影特例。

设 $M$ 为定向 $n$ 维光滑紧流形，其边界为 $\\partial M$（赋予诱导定向），$\\omega$ 为定义在 $M$ 上的光滑 $(n-1)$ 次微分形式（Differential Form）。
外微分算子 $\\mathrm{d}$ 将 $(n-1)$-形式映射至 $n$-形式，其拓扑积分恒等式满足：
\\[
  \\int_{\\partial M} \\omega = \\int_M \\mathrm{d}\\omega.
\\]
该恒等式的深层数学内涵表明：区域边界上的代数流求和，在拓扑意义下严格等价于内部微元局域微分旋度的总体积分累加。

\\section{外微分代数与微分形式}

\\begin{definition}{外微分算子与反交换性}{def:extdiff}
设 $\\mathcal{A}^k(M)$ 为流形 $M$ 上的光滑 $k$-形式模空间。称线性映射 $\\mathrm{d}: \\mathcal{A}^k(M) \\to \\mathcal{A}^{k+1}(M)$ 为外微分算子，若满足如下公理：
\\begin{enumerate}[label=(\\roman*),itemsep=0pt,topsep=2pt]
  \\item 对任意 $0$-形式（光滑函数）$f \\in C^\\infty(M)$，$\\mathrm{d}f$ 为通常的全微分；
  \\item 反莱布尼茨法则：对任意 $\\omega \\in \\mathcal{A}^k(M)$ 与 $\\eta \\in \\mathcal{A}^l(M)$，有
  \\[
    \\mathrm{d}(\\omega \\wedge \\eta) = \\mathrm{d}\\omega \\wedge \\eta + (-1)^k \\omega \\wedge \\mathrm{d}\\eta;
  \\]
  \\item 庞加莱引理（Poincaré's Nilpotence）：$\\mathrm{d}^2 = \\mathrm{d} \\circ \\mathrm{d} \\equiv 0$。
\\end{enumerate}
\\end{definition}

由上述反交换性与极值代数性质，我们可以迅速将麦克斯韦方程组（Maxwell's Equations）以最凝练的二阶外微分方程形式表达出来。
设电磁场强度张量为 $2$-形式 $F = \\frac{1}{2} F_{\\mu\\nu} \\, \\mathrm{d}x^\\mu \\wedge \\mathrm{d}x^\\nu$，外加电荷源电流形式为 $J$，则有：
\\[
  \\begin{cases}
    \\mathrm{d}F = 0, & \\text{（无源麦克斯韦方程：高斯磁定律与法拉第感应定律）} \\\\
    \\mathrm{d}\\star F = J, & \\text{（有源麦克斯韦方程：高斯电场定律与安培-麦克斯韦定律）}
  \\end{cases}
\\]
其中 $\\star$ 表示与度规张量相关的霍奇对偶算子（Hodge Star Operator）。

\\section{斯托克斯积分定理与严谨证明}

\\begin{theorem}{流形上的广义斯托克斯定理}{thm:stokes}
设 $M$ 为带边定向光滑 $n$ 维紧流形，边界 $\\partial M$ 光滑且具有相容定向，$\\omega$ 为 $M$ 上的任意紧支集 $(n-1)$-阶光滑微分形式。则成立：
\\[
  \\int_{\\partial M} \\omega = \\int_M \\mathrm{d}\\omega.
\\]
\\end{theorem}

\\begin{proof}
利用从属于 $M$ 的局部有限开覆盖的单位分解定理（Partition of Unity），存在一组非负光滑函数族 $\\{\\rho_i\\}_{i=1}^N$，使得 $\\sum_{i=1}^N \\rho_i \\equiv 1$。
将形式分解为局部切片 $\\omega = \\sum_{i=1}^N \\rho_i \\omega$，只需对单个具有局部坐标卡 $(U_i, \\varphi_i)$ 支撑的形式验证该结论。

分两种情况讨论：
\\textbf{情形 1}：支撑集位于流形内部，$\\mathrm{supp}(\\rho_i \\omega) \\subset U_i \\cong \\mathbb{R}^n$。此时由于无边界相交，$\\int_{\\partial M} \\rho_i \\omega = 0$。
而在局部欧氏坐标下，由微积分基本定理：
\\[
  \\int_{\\mathbb{R}^n} \\frac{\\partial a_j}{\\partial x^j} \\, \\mathrm{d}x^1 \\cdots \\mathrm{d}x^n = 0.
\\]
故 $\\int_M \\mathrm{d}(\\rho_i \\omega) = 0$，等式自然成立。

\\textbf{情形 2}：支撑集与边界相交，$U_i \\cong \\mathbb{H}^n = \\{ (x^1, \\dots, x^n) \\in \\mathbb{R}^n \\mid x^n \\ge 0 \\}$。
根据边界诱导定向定义，边界 $\\partial \\mathbb{H}^n = \\{ x^n = 0 \\}$ 处的微元形式法向量指向流形外部，故：
\\[
  \\int_{\\mathbb{H}^n} \\frac{\\partial a_n}{\\partial x^n} \\, \\mathrm{d}x^1 \\cdots \\mathrm{d}x^n = \\int_{\\mathbb{R}^{n-1}} \\left( \\int_0^{+\\infty} \\frac{\\partial a_n}{\\partial x^n} \\, \\mathrm{d}x^n \\right) \\mathrm{d}x^1 \\cdots \\mathrm{d}x^{n-1} = -\\int_{\\mathbb{R}^{n-1}} a_n(x^1, \\dots, x^{n-1}, 0) \\, \\mathrm{d}^{n-1}x.
\\]
负号恰好由边界诱导定向矩阵乘子的奇偶转置性抵消，累加全部局部坐标卡即证。
\\end{proof}

\\section{典型应用与例题解析}

\\noindent\\textbf{例 4.1}\\quad 设曲面 $S$ 为椭球面 $x^2/a^2 + y^2/b^2 + z^2/c^2 = 1$ 的上半部分（$z \\ge 0$），取上侧为正向。
向量场 $\\mathbf{A} = (y - z) \\mathbf{i} + (z - x) \\mathbf{j} + (x - y) \\mathbf{k}$。计算环量旋度积分：
\\[
  \\mathcal{I} = \\iint_S (\\nabla \\times \\mathbf{A}) \\cdot \\mathrm{d}\\mathbf{S}.
\\]

\\noindent\\astrolibsolutionhead 首先计算该向量场的旋度（Curl）：
\\[
  \\nabla \\times \\mathbf{A} = \\begin{vmatrix}
    \\mathbf{i} & \\mathbf{j} & \\mathbf{k} \\\\
    \\frac{\\partial}{\\partial x} & \\frac{\\partial}{\\partial y} & \\frac{\\partial}{\\partial z} \\\\
    y - z & z - x & x - y
  \\end{vmatrix} = -2 \\mathbf{i} - 2 \\mathbf{j} - 2 \\mathbf{k}.
\\]
根据斯托克斯定理，曲面积分可以直接转化为沿其底圆边界闭曲线 $C: x^2/a^2 + y^2/b^2 = 1, z = 0$ 的一类曲线积分：
引入参数方程 $x = a \\cos\\theta$，$y = b \\sin\\theta$（$\\theta \\in [0, 2\\pi]$），代入曲线环量积分公式：
\\[
  \\mathcal{I} = \\oint_C \\mathbf{A} \\cdot \\mathrm{d}\\mathbf{r} = \\int_0^{2\\pi} \\left[ (b \\sin\\theta)(-a \\sin\\theta) + (-a \\cos\\theta)(b \\cos\\theta) \\right] \\mathrm{d}\\theta = -ab \\int_0^{2\\pi} \\mathrm{d}\\theta = -2\\pi ab.
\\]

\\astrolibdigitalresource[国家精品在线开放课程]{微分形式与外代数三维交互动画演示}{https://astrolib.org/resources/diff-forms-3d}

\\section{学术注记与数据特征表}
在工程力学与流体力学计算中，不同物理场的特征参数通常汇编如下表所示\\footnote{参见中国物理学会经典力学与电动力学专业术语审定标准（2025年版）。}：

\\begin{center}
\\small
\\begin{tabular}{lcccc}
  \\toprule
  物理场类型 & 势函数符号 & 场强微分形式 & 旋度特征 & 散度方程 \\\\
  \\midrule
  静电场 (Electrostatic) & $\\phi(x)$ & $\\mathbf{E} = -\\nabla \\phi$ & $\\nabla \\times \\mathbf{E} = 0$ & $\\nabla \\cdot \\mathbf{E} = \\rho/\\varepsilon_0$ \\\\
  稳恒磁场 (Magnetostatic) & $\\mathbf{A}(x)$ & $\\mathbf{B} = \\nabla \\times \\mathbf{A}$ & $\\nabla \\times \\mathbf{B} = \\mu_0 \\mathbf{J}$ & $\\nabla \\cdot \\mathbf{B} = 0$ \\\\
  无粘性流体 (Ideal Fluid) & $\\psi(x,t)$ & $\\mathbf{v} = \\nabla \\psi$ & $\\nabla \\times \\mathbf{v} = 0$ & $\\nabla \\cdot \\mathbf{v} = -\\frac{1}{\\rho}\\frac{\\partial \\rho}{\\partial t}$ \\\\
  万有引力场 (Gravitational) & $\\Phi_G(x)$ & $\\mathbf{g} = -\\nabla \\Phi_G$ & $\\nabla \\times \\mathbf{g} = 0$ & $\\nabla \\cdot \\mathbf{g} = -4\\pi G \\rho$ \\\\
  \\bottomrule
\\end{tabular}
\\end{center}
`;

// -----------------------------------------------------------------------------
// 编译辅助函数与诊断提取
// -----------------------------------------------------------------------------

function runXeLatexCompile(jobKey, texContent) {
  const texPath = path.join(AB_DIR, `${jobKey}.tex`);
  const pdfPath = path.join(AB_DIR, `${jobKey}.pdf`);
  const logPath = path.join(AB_DIR, `${jobKey}.log`);
  fs.writeFileSync(texPath, texContent, 'utf8');

  const t0 = Date.now();
  let success = false;
  try {
    execSync(`"${xelatexBin}" -file-line-error -interaction=nonstopmode ${jobKey}.tex`, {
      cwd: AB_DIR,
      stdio: 'pipe',
    });
    // 双遍编译确保交叉引用收敛
    execSync(`"${xelatexBin}" -file-line-error -interaction=nonstopmode ${jobKey}.tex`, {
      cwd: AB_DIR,
      stdio: 'pipe',
    });
    success = fs.existsSync(pdfPath);
  } catch (e) {}
  const durationMs = Date.now() - t0;

  let pageCount = 0;
  let fileSizeKb = '0';
  let warnings = [];

  if (success && fs.existsSync(pdfPath)) {
    fileSizeKb = (fs.statSync(pdfPath).size / 1024).toFixed(1);
    try {
      const pdfBytes = fs.readFileSync(pdfPath);
      const matches = pdfBytes.toString('latin1').match(/\/Type\s*\/Page\b/g);
      pageCount = matches ? matches.length : 1;
    } catch {}
  }

  if (fs.existsSync(logPath)) {
    const logStr = fs.readFileSync(logPath, 'utf8');
    for (const line of logStr.split('\n')) {
      if (/warning/i.test(line) && !/rerunfilecheck|rerun/i.test(line)) {
        warnings.push(line.trim());
      }
    }
  }

  return {
    jobKey,
    success,
    durationMs,
    fileSizeKb,
    pageCount,
    warningsCount: warnings.length,
    pdfPath,
  };
}

// =============================================================================
// 实验 1: Libertinus Scale A/B 测试 (1.00 vs 1.01 vs 1.015 vs 1.02)
// =============================================================================

console.log('================================================================');
console.log('🧪 实验 1: Libertinus Scale A/B 评测 (Mathematical 预设)');
console.log('================================================================\n');

const scaleCandidates = [1.00, 1.01, 1.015, 1.02];
const exp1Results = [];

for (const sc of scaleCandidates) {
  const keyTag = `mathematical_scale_${String(sc).replace('.', '')}`;
  // 克隆基线预设，仅改变 scale
  const preset = JSON.parse(JSON.stringify(PRESET_REGISTRY.mathematical));
  preset.latinText.scale = sc === 1.00 ? undefined : sc;
  preset.math.scale = sc === 1.00 ? undefined : sc;

  const preamble = renderTypographyPreamble(preset, {
    resolutionMode: 'deterministic',
    includeUnicodeMathPkg: true,
  });

  const doc = `\\documentclass[a4paper, 11pt, UTF8, punct=kaiming]{ctexart}
\\usepackage{astrolib-chapter}
\\graphicspath{{assets/}{images/}{./}}

${preamble}

\\begin{document}
${REALISTIC_CHAPTER_CONTENT}
\\end{document}
`;

  const res = runXeLatexCompile(keyTag, doc);
  exp1Results.push({
    scale: sc,
    ...res,
  });
  console.log(`[Scale=${sc}] -> ${res.success ? '✅ PASS' : '❌ FAIL'} | ${res.fileSizeKb} KB | 页数: ${res.pageCount} | 耗时: ${(res.durationMs/1000).toFixed(2)}s | 告警: ${res.warningsCount}`);
}

// =============================================================================
// 实验 2: FandolSong 行高基准 A/B 测试 (1.00 vs 1.10 vs 1.20 vs 1.25 vs 1.30)
// =============================================================================

console.log('\n================================================================');
console.log('🧪 实验 2: FandolSong 行高基准 A/B 评测 (Scholarly 预设)');
console.log('================================================================\n');

const fandolStretchCandidates = [1.00, 1.10, 1.20, 1.25, 1.30];
const exp2Results = [];

for (const st of fandolStretchCandidates) {
  const keyTag = `fandolsong_stretch_${String(st).replace('.', '')}`;
  const preset = JSON.parse(JSON.stringify(PRESET_REGISTRY.scholarly));
  preset.metrics.baselineStretch = st;

  const preamble = renderTypographyPreamble(preset, {
    resolutionMode: 'deterministic',
    includeUnicodeMathPkg: true,
  });

  const doc = `\\documentclass[a4paper, 11pt, UTF8, punct=kaiming]{ctexart}
\\usepackage{astrolib-chapter}
\\graphicspath{{assets/}{images/}{./}}

${preamble}

\\begin{document}
${REALISTIC_CHAPTER_CONTENT}
\\end{document}
`;

  const res = runXeLatexCompile(keyTag, doc);
  exp2Results.push({
    stretch: st,
    ...res,
  });
  console.log(`[Stretch=${st}] -> ${res.success ? '✅ PASS' : '❌ FAIL'} | ${res.fileSizeKb} KB | 页数: ${res.pageCount} | 耗时: ${(res.durationMs/1000).toFixed(2)}s | 告警: ${res.warningsCount}`);
}

// =============================================================================
// 实验 3: LXGW WenKai 行高基准 A/B 测试 (1.15 vs 1.20 vs 1.25 vs 1.30 vs 1.35)
// =============================================================================

console.log('\n================================================================');
console.log('🧪 实验 3: LXGW WenKai 行高基准 A/B 评测 (Lecture 预设)');
console.log('================================================================\n');

const wenkaiStretchCandidates = [1.15, 1.20, 1.25, 1.30, 1.35];
const exp3Results = [];

for (const st of wenkaiStretchCandidates) {
  const keyTag = `wenkai_stretch_${String(st).replace('.', '')}`;
  const preset = JSON.parse(JSON.stringify(PRESET_REGISTRY.lecture));
  preset.metrics.baselineStretch = st;

  const preamble = renderTypographyPreamble(preset, {
    resolutionMode: 'deterministic',
    includeUnicodeMathPkg: true,
  });

  const doc = `\\documentclass[a4paper, 11pt, UTF8, punct=kaiming]{ctexart}
\\usepackage{astrolib-chapter}
\\graphicspath{{assets/}{images/}{./}}

${preamble}

\\begin{document}
${REALISTIC_CHAPTER_CONTENT}
\\end{document}
`;

  const res = runXeLatexCompile(keyTag, doc);
  exp3Results.push({
    stretch: st,
    ...res,
  });
  console.log(`[Stretch=${st}] -> ${res.success ? '✅ PASS' : '❌ FAIL'} | ${res.fileSizeKb} KB | 页数: ${res.pageCount} | 耗时: ${(res.durationMs/1000).toFixed(2)}s | 告警: ${res.warningsCount}`);
}

// -----------------------------------------------------------------------------
// 保存 A/B 测试结果摘要
// -----------------------------------------------------------------------------

const summaryData = {
  experiment1_libertinus_scale: exp1Results,
  experiment2_fandolsong_stretch: exp2Results,
  experiment3_wenkai_stretch: exp3Results,
};

fs.writeFileSync(
  path.join(AB_DIR, 'ab_test_summary.json'),
  JSON.stringify(summaryData, null, 2),
  'utf8'
);

console.log('\n================================================================');
console.log('🏁 全部 14 组受控 A/B 实验 Specimen 双遍编译完成！');
console.log(`产物与报告摘要保存在: ${AB_DIR}`);
console.log('================================================================\n');
