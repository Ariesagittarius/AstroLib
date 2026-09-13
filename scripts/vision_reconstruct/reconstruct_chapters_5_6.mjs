import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { streamGeminiVision } from './gemini_vision_client.mjs';

const ROOT_DIR = process.cwd();
const ch5PagesDir = path.join(ROOT_DIR, 'test/data/ch5_pages');
const ch6PagesDir = path.join(ROOT_DIR, 'test/data/ch6_pages');
const outputDir = path.join(ROOT_DIR, 'test/output');
const rebuildDir = path.join(ROOT_DIR, 'src/content/docs/collections/math/engineering_analysis_rebuild');

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
if (!fs.existsSync(rebuildDir)) fs.mkdirSync(rebuildDir, { recursive: true });

// Specification of all 15 sections across Chapters 5 and 6
export const SECTIONS = [
  // ================= Chapter 5: 多元函数微分学及其应用 =================
  {
    chapter: 5,
    section: '5.1',
    title: 'n维Euclid空间Rn中点集的初步知识',
    displayTitle: '5.1 n 维 Euclid 空间 $\\mathbf{R}^n$ 中点集的初步知识',
    dir: ch5PagesDir,
    leadIn: '由于多元函数的定义域是 $n$ 维Euclid空间 $\\mathbf{R}^n$ 中的子集，因此，本节先介绍 $\\mathbf{R}^n$ 中点集的初步知识。\n\n',
    batches: [
      { start: 1, end: 10, note: '从第 1 页开始，至第 10 页遇到“习题 5.1”或“第二节”大标题时终结输出' }
    ]
  },
  {
    chapter: 5,
    section: '5.2',
    title: '多元函数的极限与连续性',
    displayTitle: '5.2 多元函数的极限与连续性',
    dir: ch5PagesDir,
    leadIn: '本节首先介绍多元数量值函数与多元向量值函数的概念，然后将一元函数的极限和连续性概念推广到多元函数，并讨论多元连续函数的性质。\n\n',
    batches: [
      { start: 10, end: 22, note: '从第 10 页底部的“第二节 多元函数的极限与连续性”大标题开始，至第 22 页遇到“习题 5.2”或“第三节”时终结输出' }
    ]
  },
  {
    chapter: 5,
    section: '5.3',
    title: '多元数量值函数的导数与微分',
    displayTitle: '5.3 多元数量值函数的导数与微分',
    dir: ch5PagesDir,
    leadIn: '本节将把一元函数的导数与微分概念推广到多元数量值函数。我们以二元函数为主进行讲解，然后推广到 $n$ 元函数。先介绍多元数量值函数的偏导数与全微分以及方向导数与梯度，再介绍高阶偏导数与高阶全微分以及复合函数的链式法则，最后介绍隐函数及其微分法。\n\n',
    batches: [
      { start: 22, end: 34, note: '从第 22 页底部的“第三节”大标题开始，主要涵盖 3.1 偏导数 与 3.2 全微分初步' },
      { start: 35, end: 46, note: '涵盖方向导数与梯度、高阶偏导数' },
      { start: 47, end: 58, note: '涵盖复合函数求导法则与隐函数微分法，至第 58 页遇到“习题 5.3”时终结输出' }
    ]
  },
  {
    chapter: 5,
    section: '5.4',
    title: '多元函数的Taylor公式与极值问题',
    displayTitle: '5.4 多元函数的 Taylor 公式与极值问题',
    dir: ch5PagesDir,
    leadIn: '本节中，首先把一元函数的 Taylor 公式推广到多元函数，然后讨论多元函数的极值与最大值、最小值问题。\n\n',
    batches: [
      { start: 59, end: 66, note: '从第 59 页大标题开始，涵盖 Taylor 公式与无条件极值' },
      { start: 67, end: 74, note: '涵盖条件极值 Lagrange 乘数法与最小二乘法，至第 74 页遇到“习题 5.4”时终结输出' }
    ]
  },
  {
    chapter: 5,
    section: '5.5',
    title: '多元向量值函数的导数与微分',
    displayTitle: '5.5 多元向量值函数的导数与微分',
    dir: ch5PagesDir,
    leadIn: '本节将数量值函数的导数与微分概念及其运算法则推广到向量值函数。我们将一元和多元向量值函数作为统一整体讨论，然后推广到 $n$ 元向量值函数，并讨论由方程组确定的隐函数微分法。\n\n',
    batches: [
      { start: 74, end: 83, note: '从第 74 页底部的“第五节”大标题开始，涵盖向量值函数导数与微分' },
      { start: 84, end: 93, note: '涵盖复合求导链式法则、Jacobi 矩阵与隐函数方程组，至第 93 页遇到“习题 5.5”时终结输出' }
    ]
  },
  {
    chapter: 5,
    section: '5.6',
    title: '多元函数微分学在几何上的简单应用',
    displayTitle: '5.6 多元函数微分学在几何上的简单应用',
    dir: ch5PagesDir,
    leadIn: '本节从空间曲线和曲面的参数表示出发，应用多元函数微分学的知识，以向量为工具，研究空间曲线的切线与法平面、以及曲面的切平面与法线。\n\n',
    batches: [
      { start: 93, end: 108, note: '从第 93 页底部的“第六节”大标题开始，涵盖曲线切线法平面与曲面切平面法线，至第 108 页遇到“习题 5.6”时终结输出' }
    ]
  },
  {
    chapter: 5,
    section: '5.7',
    title: '空间曲线的曲率与挠率',
    displayTitle: '5.7 空间曲线的曲率与挠率',
    dir: ch5PagesDir,
    leadIn: '本节将应用多元函数微分学的知识进一步对空间曲线的形态作更深入的研究。为此，先介绍 Frenet 标架，然后研究空间曲线的曲率与挠率。\n\n',
    batches: [
      { start: 108, end: 119, note: '从第 108 页底部的“第七节”大标题开始，涵盖空间曲线弧长与曲率' },
      { start: 120, end: 130, note: '涵盖挠率与 Frenet 公式，至第 130 页遇到“习题 5.7”或第五章习题时终结输出' }
    ]
  },

  // ================= Chapter 6: 多元函数积分学及其应用 =================
  {
    chapter: 6,
    section: '6.1',
    title: '多元数量值函数积分的概念与性质',
    displayTitle: '6.1 多元数量值函数积分的概念与性质',
    dir: ch6PagesDir,
    leadIn: '本节介绍与方向性无关的多元函数积分，称为多元数量值函数的积分或第一大类型积分，讲解其概念与性质。\n\n',
    batches: [
      { start: 134, end: 140, note: '从第 134 页“第六章 第一节”大标题开始，至第 140 页遇到“习题 6.1”或“第二节”大标题时终结输出' }
    ]
  },
  {
    chapter: 6,
    section: '6.2',
    title: '二重积分的计算',
    displayTitle: '6.2 二重积分的计算',
    dir: ch6PagesDir,
    leadIn: '从本节开始，我们分别讲解各种多元函数积分的计算方法。为了导出二重积分的计算公式，首先介绍二重积分在直角坐标与极坐标下的计算。\n\n',
    batches: [
      { start: 140, end: 151, note: '从第 140 页底部的“第二节”大标题开始，涵盖直角坐标系下的二重积分计算' },
      { start: 152, end: 162, note: '涵盖极坐标变换、对称性简化与换元法，至第 162 页遇到“习题 6.2”时终结输出' }
    ]
  },
  {
    chapter: 6,
    section: '6.3',
    title: '三重积分的计算',
    displayTitle: '6.3 三重积分的计算',
    dir: ch6PagesDir,
    leadIn: '本节讲解三重积分的计算方法，包括在直角坐标系、柱面坐标系与球面坐标系下的计算与换元法。\n\n',
    batches: [
      { start: 162, end: 170, note: '从第 162 页底部的“第三节”大标题开始，涵盖直角坐标与柱面坐标' },
      { start: 171, end: 176, note: '涵盖球面坐标与换元法，至第 176 页遇到“习题 6.3”时终结输出' }
    ]
  },
  {
    chapter: 6,
    section: '6.4',
    title: '含参变量的积分与反常重积分',
    displayTitle: '6.4 含参变量的积分与反常重积分',
    dir: ch6PagesDir,
    leadIn: '在实际问题中经常会遇到包含参变量的积分以及无界区域上的反常重积分。本节讨论含参变量积分的性质以及反常重积分的概念与审敛法。\n\n',
    batches: [
      { start: 177, end: 181, note: '从第 177 页底部的“第四节”大标题开始，涵盖含参变量正常积分的性质与连续性、可微性、可积性' },
      { start: 182, end: 186, note: '涵盖反常重积分的概念与审敛法，至第 186 页遇到“习题 6.4”时终结输出' }
    ]
  },
  {
    chapter: 6,
    section: '6.5',
    title: '重积分的应用',
    displayTitle: '6.5 重积分的应用',
    dir: ch6PagesDir,
    leadIn: '本节介绍重积分在几何与物理中的应用，重点阐明建立积分表达式的微元法。\n\n',
    batches: [
      { start: 187, end: 190, note: '从第 187 页底部的“第五节”大标题开始，涵盖重积分在几何上的应用（曲面面积与体积）' },
      { start: 191, end: 194, note: '涵盖重积分在物理上的应用（质心、转动惯量与引力），至第 194 页遇到“习题 6.5”时终结输出' }
    ]
  },
  {
    chapter: 6,
    section: '6.6',
    title: '第一型线积分与面积分',
    displayTitle: '6.6 第一型线积分与面积分',
    dir: ch6PagesDir,
    leadIn: '本节讨论第一型曲线积分与第一型曲面积分的概念、性质与计算方法。\n\n',
    batches: [
      { start: 195, end: 201, note: '从第 195 页底部的“第六节”大标题开始，涵盖第一型曲线积分概念、性质与计算' },
      { start: 202, end: 208, note: '涵盖第一型曲面积分概念、性质与计算，至第 208 页遇到“习题 6.6”时终结输出' }
    ]
  },
  {
    chapter: 6,
    section: '6.7',
    title: '第二型线积分与面积分',
    displayTitle: '6.7 第二型线积分与面积分',
    dir: ch6PagesDir,
    leadIn: '从本节开始，我们将介绍多元函数积分学中的第二大类——与方向性有关的第二型曲线积分与曲面积分。\n\n',
    batches: [
      { start: 208, end: 216, note: '从第 208 页底部的“第七节”大标题开始，涵盖第二型曲线积分的概念与计算' },
      { start: 217, end: 226, note: '涵盖第二型曲面积分的概念与计算，至第 226 页遇到“习题 6.7”时终结输出' }
    ]
  },
  {
    chapter: 6,
    section: '6.8',
    title: '各种积分的联系及其在场论中的应用',
    displayTitle: '6.8 各种积分的联系及其在场论中的应用',
    dir: ch6PagesDir,
    leadIn: '在多元微积分中，我们已经学习了重积分、曲线积分与曲面积分。本节探讨这些积分之间的内在联系（Green 公式、Gauss 公式、Stokes 公式），并建立场论基础（梯度、散度、旋度）。\n\n',
    batches: [
      { start: 227, end: 235, note: '从第 227 页底部的“第八节”大标题开始，涵盖 8.1 Green 公式及其平面曲线积分路径无关性' },
      { start: 236, end: 245, note: '涵盖 8.2 Gauss 公式与通量' },
      { start: 246, end: 255, note: '涵盖 8.3 Stokes 公式与环流量' },
      { start: 256, end: 264, note: '涵盖 8.4 场论初步（梯度、散度、旋度与保守场），至第 264 页遇到“习题 6.8”时终结输出' }
    ]
  }
];

export function buildPrompt(sec, batch, isFirstBatch, isLastBatch) {
  const boundaryDirective = isFirstBatch && isLastBatch
    ? `【范围边界指令】：本节为单次完整输出（Phys ${batch.start} ~ ${batch.end}）。${batch.note}。遇到课后习题时立即终结输出，严禁输出课后习题题目！`
    : isFirstBatch
    ? `【范围边界指令】：当前是本节第 1 批（Phys ${batch.start} ~ ${batch.end}）。${batch.note}。请完整输出该范围内全部内容，保持与后续批次衔接。`
    : isLastBatch
    ? `【范围边界指令】：当前是本节末尾批（Phys ${batch.start} ~ ${batch.end}）。${batch.note}。在正文末尾遇到课后习题（“习题 5.X”或“习题 6.X”）时必须立即终结输出，严禁输出课后习题题目！`
    : `【范围边界指令】：当前是本节中间语义批（Phys ${batch.start} ~ ${batch.end}）。${batch.note}。请直接继续数学推导，不要重复上一批的内容，也不要输出课后习题。`;

  return `【核心指令】：思考过程请保持极简（不超过 80 字大纲），把全部输出配额用于生成完整的 MDX 正文！

你是一名顶级大学数学教材出版总监与 AstroLib MDX 结构化专家。
你正在对《工科数学分析基础》第 ${sec.section} 节《${sec.title}》进行全视觉高保真推倒重建。
传入的图片是原书对应章节的 150 DPI 高清扫描原版物理页面。

${boundaryDirective}

请直接阅读并理解图片中的版面布局、数学推导与公式，将其高保真、结构化地输出为符合 AstroLib 规范的纯净 MDX 正文。

必须严格遵守以下六大铁律契约：

1. 边栏批注彻底抽离为 <SideNote>：
   - 原书版面中印刷在右侧边栏的“想一想”、“注”、“注意”、“思路分析”、“几何解释”等批注，必须从主栏推导中完全抽离；
   - 封装为 <SideNote title="...">内容</SideNote>，放置在对应段落开头或卡片内部；
   - 主栏推导句子必须保持绝对完整连贯，严禁被边栏批注插断或掐头去尾。

2. 语义卡片闭合与层级规范（杜绝错位与嵌套）：
   - 核心定理/定义使用 <Knowledge title="...">...</Knowledge>，定理证明使用 <Solution title="证明">...</Solution>；
   - 例题题面使用 <Example title="...">...</Example>，解题过程使用 <Solution title="解">...</Solution>；
   - 【例题分流】：较短例题可直接写在标题位（如 <Example title="例 5.1 求函数 ... 的极限">）；长例题或应用题，title 仅写简短主题（如 <Example title="例 5.4 空间薄板引力问题">），详细长题干放入卡片正文，严禁整段塞进 title 造成全体加粗；
   - 【严禁卡片嵌套大纲】：原书小节与并列知识点（如“1. 偏导数的定义”、“2. 高阶偏导数”）必须使用 ### 小标题，严禁用 <Knowledge> 包裹大纲，严禁将 <Example> 嵌套在 <Knowledge> 内部！

3. 100% 工业级 KaTeX 纯净度与独立块级：
   - 变量符号统一用 $...$（如 $\\boldsymbol{x}, \\boldsymbol{y}, \\nabla f, \\frac{\\partial f}{\\partial x}, \\mathrm{d}s, \\mathrm{d}S, \\mathrm{d}V$）；
   - 向量加粗统一采用 \\boldsymbol{v} 或 \\mathbf{R}^n；
   - 【带编号公式】：所有带 \\tag{X.Y} 的公式必须作为独立块级公式，且前后必须留有纯空行：
     
     $$
     formula \\tag{X.Y}
     $$
     
     严禁写在行内 $...$ 中，严禁紧贴正文不留空行。

4. 响应式配图规范（本章配图均已在 images/ 就绪）：
   - 几何图形、曲面与立体示意图统一使用：
     <figure class="vp-figure">
       ![](./images/fig_${sec.chapter}_X.png)
       <figcaption>图 ${sec.chapter}.X 说明</figcaption>
     </figure>
   - 【严禁对纯公式表格插入伪图片】：对于积分表、极值充分条件判别表等，必须使用 Markdown 表格或 KaTeX 矩阵/数组排版，严禁为其生成伪图片引用！

5. 融媒体微课组件化：
   - 遇到二维码微课，统一转化为 <QRCodeVideo id="${sec.chapter}.X.Y" title="..." url="#" />，删去残留文字碎片。

6. 课后习题彻底解耦：
   - 本文属于教材正文精读，课后习题已由独立题库系统承载。
   - 严禁输出课后习题的题目！在正文内容结束后立即终结 MDX 输出。

输出要求：
- 直接输出 MDX 正文内容；
- 严禁在最外层包裹 \`\`\`mdx ... \`\`\` 代码块；
- 严禁输出前言、客套话或废话。
`;
}

export function cleanBatchText(rawText) {
  let cleaned = rawText.trim();

  // Strip thinking outline preamble if present
  cleaned = cleaned.replace(/^---[\s\S]*?\*\*思考大纲\*\*[\s\S]*?---\s*/i, '');
  cleaned = cleaned.replace(/^---[\s\S]*?#\s*教材扫描图内容描述[\s\S]*?---\s*/i, '');
  cleaned = cleaned.replace(/^---[\s\S]*?###\s*思考过程[\s\S]*?---\s*/i, '');
  cleaned = cleaned.replace(/^[\s\S]*?<\/thought>\s*/i, '');

  // Strip outer code blocks
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```[a-zA-Z0-9_-]*\r?\n/, '');
    cleaned = cleaned.replace(/\r?\n```\s*$/, '');
  }

  // Remove trailing exercises if any leaked
  cleaned = cleaned.replace(/##\s*习题\s*[\d\.]+[\s\S]*$/, '');
  cleaned = cleaned.replace(/###\s*习题\s*[\d\.]+[\s\S]*$/, '');
  cleaned = cleaned.replace(/<Knowledge[^>]*title=["'][^"']*习题[\s\S]*$/, '');
  cleaned = cleaned.replace(/<ExerciseTrigger[\s\S]*$/, '');

  return cleaned.trim();
}

export function postProcessSectionMdx(content, chapter) {
  let text = content;

  // 1. Convert any single $ with \tag to $$ display block
  text = text.replace(/(?<!\$)\$(?!\$)([^$\r\n]*?\\tag\{[^{}]+\}[^$\r\n]*?)\$(?!\$)/g, (match, formula) => {
    return `\n\n$$\n${formula.trim()}\n$$\n\n`;
  });

  // 2. Ensure every single-line $$ formula containing \tag is broken into 3 lines with blank lines
  text = text.replace(/(?<!\$)\$\$([^\$\r\n]*?\\tag\{[^{}]+\}[^\$\r\n]*?)\$\$(?!\$)/g, (match, formula) => {
    return `\n\n$$\n${formula.trim()}\n$$\n\n`;
  });

  // 3. Ensure blank line before and after display $$ blocks
  text = text.replace(/([^\r\n])\s*\n\$\$/g, (match, p1) => `${p1}\n\n$$`);
  text = text.replace(/\$\$\s*\n([^\r\n])/g, (match, p1) => `$$\n\n${p1}`);

  // 4. Normalize KaTeX circled numbers in tag
  text = text.replace(/\\tag\{①\}/g, '\\tag{1}');
  text = text.replace(/\\tag\{②\}/g, '\\tag{2}');
  text = text.replace(/\\tag\{③\}/g, '\\tag{3}');
  text = text.replace(/\\tag\{④\}/g, '\\tag{4}');
  text = text.replace(/\\tag\{⑤\}/g, '\\tag{5}');

  // 4b. Cleanup duplicate \end{aligned}
  text = text.replace(/\\end\{aligned\}\s*\\end\{aligned\}/g, '\\end{aligned}');

  // 5. Ensure blank line after opening JSX cards and before closing JSX cards
  text = text.replace(/(<(?:Knowledge|Solution|Example|SideNote|Block|Analysis)(?:\s+(?:"[^"]*"|'[^']*'|[^>'"])*)?>)([^\r\n])/g, '$1\n\n$2');
  text = text.replace(/([^\r\n])(<\/(?:Knowledge|Solution|Example|SideNote|Block|Analysis)>)/g, '$1\n\n$2');

  // 6. Truncate exercises if any leaked
  text = text.replace(/<Knowledge[^>]*title=["'][^"']*习题[\s\S]*$/, '');
  text = text.replace(/##\s*习题[\s\S]*$/, '');
  text = text.replace(/###\s*习题[\s\S]*$/, '');
  text = text.replace(new RegExp(`第\\s*${chapter}\\s*章习题[\\s\\S]*$`), '');
  text = text.replace(/综合练习题[\s\S]*$/, '');

  // 7. Balance JSX tags with token stream
  text = balanceJsxCards(text);

  // 8. Image path normalization
  text = text.replace(/!\[(.*?)\]\(images\//g, '![$1](./images/');
  text = text.replace(new RegExp(`!\\[(.*?)\\]\\(\\./images/fig_${chapter}\\.(\\d+)\\.png\\)`, 'g'), `![$1](./images/fig_${chapter}_$2.png)`);

  // 9. Remove top-level # H1 headings to prevent duplicate H1 with page title
  text = text.replace(/^#[^#\r\n]+\r?\n+/gm, '');

  // 10. Decouple long Example titles (>70 chars) to prevent global bolding and overflow
  text = text.replace(/<Example\s+title="((?:例\s*[\d\.]+|例题\s*[\d\.]+|例\s*\d+)[^"]{70,})">/g, (match, fullTitle) => {
    const m = fullTitle.match(/^(例\s*[\d\.]+|例题\s*[\d\.]+|例\s*\d+)/);
    const prefix = m ? m[1] : '例题';
    const safeTitle = fullTitle.replace(/<([a-zA-Z])/g, '< $1');
    return `<Example title="${prefix}">\n\n${safeTitle}\n\n`;
  });

  // 11. Deduplicate excessive newlines
  text = text.replace(/\n{4,}/g, '\n\n\n');

  return text.trim();
}

export function balanceJsxCards(text) {
  const cardNames = ['Knowledge', 'Example', 'Solution', 'SideNote', 'Block', 'Analysis', 'Note', 'Method', 'Guide', 'Variant'];
  const tagRegex = /<(\/)?([a-zA-Z0-9_-]+)(?:\s+(?:"[^"]*"|'[^']*'|[^>'"])*)?(\/)?>/g;
  let stack = [];
  let toRemove = [];

  let match;
  while ((match = tagRegex.exec(text)) !== null) {
    const isClose = match[1] === '/';
    const tagName = match[2];
    const isSelfClose = match[3] === '/' || match[0].endsWith('/>');

    if (!cardNames.includes(tagName) || isSelfClose) continue;

    if (!isClose) {
      stack.push({ tag: tagName, index: match.index });
    } else {
      if (stack.length > 0 && stack[stack.length - 1].tag === tagName) {
        stack.pop();
      } else {
        const idxInStack = stack.map(s => s.tag).lastIndexOf(tagName);
        if (idxInStack === -1) {
          toRemove.push({ start: match.index, end: match.index + match[0].length });
        } else {
          stack.splice(idxInStack);
        }
      }
    }
  }

  let balancedText = text;
  toRemove.sort((a, b) => b.start - a.start);
  for (const r of toRemove) {
    balancedText = balancedText.slice(0, r.start) + balancedText.slice(r.end);
  }

  while (stack.length > 0) {
    const unclosed = stack.pop();
    balancedText += `\n</${unclosed.tag}>\n`;
  }

  return balancedText;
}

function buildHeader(section, title, leadIn) {
  return `---
title: '${title}'
---
import ExerciseTrigger from '@/components/exercises/ExerciseTrigger.astro';
import QRCodeVideo from '@/components/QRCodeVideo.astro';

import Guide from '@/components/Guide.astro';
import Knowledge from '@/components/Knowledge.astro';
import Example from '@/components/Example.astro';
import Analysis from '@/components/Analysis.astro';
import Solution from '@/components/Solution.astro';
import Variant from '@/components/Variant.astro';
import Note from '@/components/Note.astro';
import SideNote from '@/components/SideNote.astro';
import Block from '@/components/Block.astro';
import Method from '@/components/Method.astro';
import Exercise from '@/components/Exercise.astro';

${leadIn}`;
}

function buildFooter(chapter, section, title) {
  return `\n\n<ExerciseTrigger chapter={${chapter}} section="${section}" title="${section} ${title} 课后真题与自测练习" />\n`;
}

export async function runSection(sec) {
  console.log(`\n======================================================`);
  console.log(`🚀 开始处理：第 ${sec.section} 节《${sec.title}》`);
  console.log(`📖 规划模式：${sec.batches.length === 1 ? '🌟 单节全量一气呵成 (Single-Shot)' : `📦 语义 ${sec.batches.length} 段无缝拼接`}`);
  console.log(`======================================================`);

  const chunkOutputs = [];
  for (let idx = 0; idx < sec.batches.length; idx++) {
    const b = sec.batches[idx];
    const isFirst = idx === 0;
    const isLast = idx === sec.batches.length - 1;
    const cacheFile = path.join(outputDir, `${sec.section}_batch_${b.start}_${b.end}.mdx`);

    const pages = [];
    for (let p = b.start; p <= b.end; p++) {
      const pFile = path.join(sec.dir, `phys_${p}.jpg`);
      if (!fs.existsSync(pFile)) {
        throw new Error(`切片原图缺失: ${pFile}`);
      }
      pages.push(pFile);
    }

    console.log(`\n------------------------------------------------------`);
    console.log(`📦 [${sec.section} 批次 ${idx + 1}/${sec.batches.length}] Phys ${b.start} ~ ${b.end} (${pages.length} 张原图)...`);

    let chunkText = '';
    if (fs.existsSync(cacheFile) && fs.statSync(cacheFile).size > 200) {
      console.log(`  [Cache] 命中已有缓存文件: ${path.basename(cacheFile)} (${fs.statSync(cacheFile).size} 字节)`);
      chunkText = fs.readFileSync(cacheFile, 'utf-8');
    } else {
      const prompt = buildPrompt(sec, b, isFirst, isLast);
      let success = false;
      let loopAttempt = 1;
      while (!success) {
        try {
          const { text, thought, durationMs } = await streamGeminiVision(prompt, pages);
          chunkText = cleanBatchText(text);

          fs.writeFileSync(cacheFile, chunkText, 'utf-8');
          fs.writeFileSync(cacheFile.replace('.mdx', '_thought.log'), thought, 'utf-8');
          console.log(`  [Done] 批次完成! 生成 ${chunkText.length} 字符，已持久化缓存至 ${path.basename(cacheFile)}`);
          success = true;
        } catch (err) {
          console.warn(`\n⚠️ [Batch Loop Retry #${loopAttempt}] 批次遇到异常 (${err.message})，等待 30 秒后自动重新发起此批次...`);
          loopAttempt++;
          await new Promise(r => setTimeout(r, 30000));
        }
      }
    }

    chunkOutputs.push(chunkText);
  }

  // Assemble and Post-Process Section MDX
  const joinedBody = chunkOutputs.join('\n\n');
  const processedBody = postProcessSectionMdx(joinedBody, sec.chapter);
  const finalMdx = buildHeader(sec.section, sec.displayTitle, sec.leadIn) + processedBody + buildFooter(sec.chapter, sec.section, sec.title);

  const targetFile = path.join(rebuildDir, `${sec.section}_${sec.title}.mdx`);
  fs.writeFileSync(targetFile, finalMdx, 'utf-8');
  console.log(`\n📄 [Assembly] 成功组装保存第 ${sec.section} 节到：${targetFile} (${finalMdx.length} 字符)`);

  // Quality scan gate
  console.log(`🔍 [Scan] 正在对 ${path.basename(targetFile)} 执行质量门禁扫描...`);
  try {
    const scanOut = execSync(`node scripts/scan-mdx.mjs "${targetFile}"`, { encoding: 'utf-8' });
    console.log(scanOut.trim());
  } catch (err) {
    console.warn(`⚠️ [Scan Warning] 门禁提示:\n`, (err.stdout || err.message).trim());
  }

  console.log(`✅ 第 ${sec.section} 节《${sec.title}》重建完毕！\n`);
  return targetFile;
}

async function main() {
  const args = process.argv.slice(2);
  let targetChapter = null;
  let targetSection = null;
  let fromSection = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--chapter' && args[i + 1]) targetChapter = parseInt(args[i + 1]);
    if (args[i] === '--section' && args[i + 1]) targetSection = args[i + 1];
    if (args[i] === '--from-section' && args[i + 1]) fromSection = args[i + 1];
  }

  console.log(`\n=============================================================`);
  console.log(`🌟 启动《工科数学分析》第五、六章 Gemma 视觉长程全自动推倒重建`);
  if (targetSection) {
    console.log(`🌟 目标：单节精修 [${targetSection}]`);
  } else if (fromSection) {
    console.log(`🌟 目标：从 [${fromSection}] 开始推进剩余小节`);
  } else if (targetChapter) {
    console.log(`🌟 目标：第 ${targetChapter} 章全量小节`);
  } else {
    console.log(`🌟 目标：第五章 (5.1~5.7) + 第六章 (6.1~6.8) 全量 15 个小节`);
  }
  console.log(`=============================================================\n`);

  let queue = SECTIONS;
  if (targetSection) {
    queue = SECTIONS.filter(s => s.section === targetSection);
  } else if (fromSection) {
    const startIdx = SECTIONS.findIndex(s => s.section === fromSection);
    if (startIdx !== -1) {
      queue = SECTIONS.slice(startIdx);
    }
  } else if (targetChapter) {
    queue = SECTIONS.filter(s => s.chapter === targetChapter);
  }

  if (queue.length === 0) {
    console.error(`❌ 未找到匹配的章节目标！`);
    process.exit(1);
  }

  const startTime = Date.now();
  const completedFiles = [];

  for (let i = 0; i < queue.length; i++) {
    const sec = queue[i];
    console.log(`\n>>>>>>>>>>> [${i + 1}/${queue.length}] 正在推进 ${sec.section}《${sec.title}》 <<<<<<<<<<<`);
    try {
      const file = await runSection(sec);
      completedFiles.push(file);
    } catch (err) {
      console.error(`❌ 处理第 ${sec.section} 节时发生严重未捕获错误:`, err);
      throw err;
    }
  }

  const totalTimeSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n🎉🎉🎉 自动化长程推倒重建全部顺利完成！总耗时 ${totalTimeSec}s`);
  console.log(`完成清单 (${completedFiles.length} 篇)：`);
  completedFiles.forEach(f => console.log(`  - ${f}`));

  console.log(`\n🔍 正在对 rebuild 目录执行全量质量复核扫描...`);
  try {
    const globalScan = execSync(`node scripts/scan-mdx.mjs "src/content/docs/collections/math/engineering_analysis_rebuild"`, { encoding: 'utf-8' });
    console.log(globalScan);
  } catch (err) {
    console.log(err.stdout || err.message);
  }
}

if (process.argv[1]?.includes('reconstruct_chapters_5_6.mjs')) {
  main().catch(err => {
    console.error('Fatal error during chapters 5 & 6 reconstruction:', err);
    process.exit(1);
  });
}
