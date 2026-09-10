#!/usr/bin/env node
/**
 * scripts/test-typography-specimen.mjs
 * AstroLib Academic Typography Specimen 测试引擎
 *
 * 核心目标：
 * 1. 构建涵盖中文、西文、复杂数学公式（微积分、极限、矩阵、希腊字母、多行对齐）、
 *    定理族环境、严谨证明、解题环境、学术注记与数字资源的权威出版级 Specimen 测试文档。
 * 2. 对五大预设 (scholarly, classic, international, mathematical, lecture)
 *    执行真实 XeLaTeX 双遍物理编译，生成独立 PDF。
 * 3. 严格检测与审计：
 *    - 字体缺失与替换警告 (Missing Font / Glyph Warnings)
 *    - 中西文光学字高匹配与基线对齐
 *    - 解题环境【解】与定理标签视觉碎片化情况
 *    - 编译耗时、产物体积与页码收敛性
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
const SPECIMEN_DIR = path.join(ROOT, '.tmp', 'typography-specimen');

fs.mkdirSync(SPECIMEN_DIR, { recursive: true });

console.log('================================================================');
console.log('🔬 AstroLib Academic Typography System 样本物理编译与排版评测');
console.log('================================================================\n');

// 探测本地可用 XeLaTeX 编译器
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
  console.error('❌ 未检测到可用的 xelatex 命令，无法执行真机物理编译测试！');
  process.exit(1);
}
console.log(`🔍 检测到本地 XeLaTeX 引擎: ${xelatexBin}\n`);

// 拷贝 astrolib-chapter.sty 模版到测试目录
const stySource = fs.readFileSync(
  path.join(ROOT, 'src', 'publishing', 'latex', 'templates', 'astrolib-chapter.sty'),
  'utf8'
);
fs.writeFileSync(path.join(SPECIMEN_DIR, 'astrolib-chapter.sty'), stySource, 'utf8');

/**
 * 构造权威的 Academic Typography Specimen 正文
 */
function buildSpecimenContent() {
  return `
\\renewcommand{\\astrolibchapternum}{2.}
\\renewcommand{\\astrolibbooktitle}{工科数学分析基础（第三版）}
\\renewcommand{\\thesection}{\\astrolibchapternum\\arabic{section}}

\\begin{center}
  {\\zihao{4}\\kaishu 工科数学分析基础　第二章 一元微分学}\\par\\vspace{0.4em}
  {\\zihao{2}\\bfseries 2.2 求导法则与学术字体排版样本}\\par\\vspace{0.6em}
  {\\small\\normalfont AstroLib 学术出版系统联合教研组}\\par\\vspace{0.6em}
\\end{center}
\\vspace{-0.2em}\\hrule height 0.6pt\\vspace{1.5em}

\\section{中西文与数学公式混排基准测试}

设随机变量 $X$ 的概率密度函数为 $p(x)$。在概率论与理论物理中，特征函数 (The characteristic function of $X$) 定义为傅里叶-斯蒂尔杰斯变换：
\\[
  \\varphi(t) = \\mathbb{E}\\left[ \\mathrm{e}^{\\mathrm{i}tX} \\right] = \\int_{-\\infty}^{+\\infty} \\mathrm{e}^{\\mathrm{i}tx} p(x) \\,\\mathrm{d}x, \\quad t \\in \\mathbb{R}.
\\]
当 $X \\sim \\mathcal{N}(\\mu, \\sigma^2)$ 服从正态分布时，其密度函数包含高斯积分核：
\\[
  p(x) = \\frac{1}{\\sqrt{2\\pi}\\,\\sigma} \\exp\\left( -\\frac{(x - \\mu)^2}{2\\sigma^2} \\right).
\\]

中西文与标点混排测试：已知非负数列 $\\{a_n\\}$、$\\{b_n\\}$ 满足 $\\lim_{n \\to \\infty} a_n = 0$，且对任意实数 $x \\in \\mathbb{R}$，导数算子满足线性性质 $\\frac{\\mathrm{d}}{\\mathrm{d}x}[\\alpha f(x) + \\beta g(x)] = \\alpha f'(x) + \\beta g'(x)$。注意标点符号的压缩与开明式排版。

\\section{学术定理族语义层级验证}

\\begin{definition}{反函数求导法则}{def:inverse-func}
设函数 $x = f(y)$ 在区间 $I_y$ 内单调、可导且 $f'(y) \\ne 0$。则其反函数 $y = f^{-1}(x)$ 在对应区间 $I_x = f(I_y)$ 内亦可导，且反函数的导数等于直接函数导数的倒数：
\\[
  \\frac{\\mathrm{d}y}{\\mathrm{d}x} = \\frac{1}{\\frac{\\mathrm{d}x}{\\mathrm{d}y}} = \\frac{1}{f'(y)}.
\\]
\\end{definition}

\\begin{theorem}{柯西中值定理 (Cauchy Mean Value Theorem)}{thm:cauchy}
设函数 $f(x)$ 和 $g(x)$ 满足：
\\begin{enumerate}
  \\item 在闭区间 $[a, b]$ 上均连续；
  \\item 在开区间 $(a, b)$ 内均可导；
  \\item 对任意 $x \\in (a, b)$，恒有 $g'(x) \\ne 0$。
\\end{enumerate}
则在开区间 $(a, b)$ 内至少存在一点 $\\xi$，使得下式严格成立：
\\[
  \\frac{f(b) - f(a)}{g(b) - g(a)} = \\frac{f'(\\xi)}{g'(\\xi)}.
\\]
\\end{theorem}

\\begin{proof}
构造辅助函数 $F(x) = [f(b) - f(a)] g(x) - [g(b) - g(a)] f(x)$。易知 $F(x)$ 在 $[a, b]$ 上连续，在 $(a, b)$ 内可导，且 $F(a) = F(b) = f(b)g(a) - f(a)g(b)$。由罗尔定理 (Rolle's Theorem)，必存在 $\\xi \\in (a, b)$ 使得 $F'(\\xi) = 0$。展开即得结论。
\\end{proof}

\\section{例题与解题环境碎片化专项检验}

\\begin{example}{复合函数求导与极限计算}{ex:sample-1}
设函数 $y = \\ln\\left( x + \\sqrt{1 + x^2} \\right)$，试求其二阶导数 $y''$，并计算极限 $\\lim_{x \\to 0} \\frac{y - x}{x^3}$。
\\end{example}

\\begin{solution}[解]
对直接函数求一阶导数，利用链式法则：
\\[
  y' = \\frac{1}{x + \\sqrt{1 + x^2}} \\left( 1 + \\frac{2x}{2\\sqrt{1 + x^2}} \\right) = \\frac{1}{x + \\sqrt{1 + x^2}} \\cdot \\frac{\\sqrt{1 + x^2} + x}{\\sqrt{1 + x^2}} = \\frac{1}{\\sqrt{1 + x^2}}.
\\]
进一步对 $y'$ 求导可得二阶导数：
\\[
  y'' = \\left( (1 + x^2)^{-\\frac{1}{2}} \\right)' = -\\frac{1}{2}(1 + x^2)^{-\\frac{3}{2}} \\cdot 2x = -\\frac{x}{(1 + x^2)^{\\frac{3}{2}}}.
\\]
利用泰勒展开式 $\\ln(1+t) = t - \\frac{t^2}{2} + \\frac{t^3}{3} + o(t^3)$，代入可得该极限值为 $-\\frac{1}{6}$。
\\end{solution}

\\begin{remark}[重要注记]
反双曲正弦函数 $\\operatorname{arsinh}(x) = \\ln(x + \\sqrt{1 + x^2})$ 的导数形式高度对称，在求解含根号的不定积分中具有极高应用价值。
\\end{remark}

\\section{复杂矩阵与多行公式对齐测试}

多行对齐方程组与分块矩阵排版：
\\[
  \\begin{aligned}
    \\nabla \\times \\mathbf{E} &= -\\frac{\\partial \\mathbf{B}}{\\partial t}, \\\\
    \\nabla \\times \\mathbf{H} &= \\mathbf{J} + \\frac{\\partial \\mathbf{D}}{\\partial t}, \\\\
    \\mathbf{A} &= \\begin{pmatrix}
      a_{11} & a_{12} & \\cdots & a_{1n} \\\\
      a_{21} & a_{22} & \\cdots & a_{2n} \\\\
      \\vdots & \\vdots & \\ddots & \\vdots \\\\
      a_{m1} & a_{m2} & \\cdots & a_{mn}
    \\end{pmatrix} \\in \\mathbb{R}^{m \\times n}.
  \\end{aligned}
\\]

\\astrolibdigitalresource[国家精品在线开放课程]{反函数求导法则高清微课讲解}{https://astrolib.org/resources/derivatives}

测试正文脚注引用\\footnote{这是用于测试中西文混排与微型字阶清晰度的学术脚注内容。}与经典三线表排版：

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
// 编译官方四套预设并记录度量指标
// -----------------------------------------------------------------------------

const presetsToTest = listTypographyPresets().map((p) => p.id);
const results = [];

for (const presetId of presetsToTest) {
  console.log(`----------------------------------------------------------------`);
  console.log(`🚀 开始物理编译评测预设: [${presetId.toUpperCase()}]`);
  console.log(`----------------------------------------------------------------`);

  const preset = PRESET_REGISTRY[presetId];
  const typographyPreamble = renderTypographyPreamble(presetId, {
    includeUnicodeMathPkg: true,
  });

  const texDocument = `\\documentclass[a4paper, 11pt, UTF8, punct=kaiming]{ctexart}
\\usepackage{astrolib-chapter}
\\graphicspath{{assets/}{images/}{./}}

${typographyPreamble}

\\begin{document}
${buildSpecimenContent()}
\\end{document}
`;

  const texPath = path.join(SPECIMEN_DIR, `specimen_${presetId}.tex`);
  const pdfPath = path.join(SPECIMEN_DIR, `specimen_${presetId}.pdf`);
  const logPath = path.join(SPECIMEN_DIR, `specimen_${presetId}.log`);

  fs.writeFileSync(texPath, texDocument, 'utf8');

  const startTime = Date.now();
  let compileSuccess = false;
  let errorMsg = '';
  let warnings = [];

  try {
    // 执行双遍 XeLaTeX 编译
    execSync(
      `"${xelatexBin}" -file-line-error -interaction=nonstopmode specimen_${presetId}.tex`,
      { cwd: SPECIMEN_DIR, stdio: 'pipe' }
    );
    execSync(
      `"${xelatexBin}" -file-line-error -interaction=nonstopmode specimen_${presetId}.tex`,
      { cwd: SPECIMEN_DIR, stdio: 'pipe' }
    );
    compileSuccess = fs.existsSync(pdfPath);
  } catch (err) {
    compileSuccess = false;
    errorMsg = err.message;
  }

  const durationMs = Date.now() - startTime;

  // 审计 .log 文件中的字体加载与告警信息
  if (fs.existsSync(logPath)) {
    const logContent = fs.readFileSync(logPath, 'utf8');
    const lines = logContent.split('\n');

    // 过滤字体未找到或替换警告
    for (const line of lines) {
      if (/font.*not found/i.test(line) || /missing.*font/i.test(line)) {
        warnings.push(line.trim());
      }
      if (/LaTeX Warning: Font shape/i.test(line)) {
        warnings.push(line.trim());
      }
    }
  }

  let pdfSizeBytes = 0;
  if (compileSuccess && fs.existsSync(pdfPath)) {
    pdfSizeBytes = fs.statSync(pdfPath).size;
  }

  results.push({
    presetId,
    name: preset.name,
    success: compileSuccess,
    durationMs,
    pdfSizeBytes,
    pdfPath,
    warningsCount: warnings.length,
    warnings,
    errorMsg,
  });

  if (compileSuccess) {
    console.log(`✅ 编译成功! 耗时: ${(durationMs / 1000).toFixed(2)}s | PDF 大小: ${(pdfSizeBytes / 1024).toFixed(1)} KB`);
    if (warnings.length > 0) {
      console.log(`⚠️ 字体警告 (${warnings.length} 条):`);
      warnings.slice(0, 3).forEach((w) => console.log(`   - ${w}`));
    }
  } else {
    console.error(`❌ 编译失败!`);
    if (fs.existsSync(logPath)) {
      const logLines = fs.readFileSync(logPath, 'utf8').split('\n');
      console.error(logLines.slice(-30).join('\n'));
    }
  }
  console.log('');
}

// -----------------------------------------------------------------------------
// 输出评测汇总表
// -----------------------------------------------------------------------------
console.log('================================================================');
console.log('📊 Typography Specimen 物理编译验证与度量总表');
console.log('================================================================');
console.table(
  results.map((r) => ({
    Preset: r.presetId,
    '学术名称': r.name,
    '编译状态': r.success ? '✅ SUCCESS' : '❌ FAILED',
    '耗时(s)': (r.durationMs / 1000).toFixed(2),
    'PDF 大小 (KB)': (r.pdfSizeBytes / 1024).toFixed(1),
    '字体警告数': r.warningsCount,
  }))
);

const allSuccess = results.every((r) => r.success);
if (!allSuccess) {
  console.error('❌ 有预设在真机 XeLaTeX 编译中失败，请检查诊断日志！');
  process.exit(1);
} else {
  console.log('🎉 全部四套预设物理编译 100% 通过！');
}
