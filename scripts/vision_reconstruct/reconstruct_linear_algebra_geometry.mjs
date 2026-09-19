import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { streamGeminiVision } from './gemini_vision_client.mjs';

const ROOT_DIR = process.cwd();
const lagPagesDir = path.join(ROOT_DIR, 'test/data/lag_pages');
const outputDir = path.join(ROOT_DIR, 'test/output/lag');
const bookContentDir = path.join(ROOT_DIR, 'src/content/docs/collections/math/linear_algebra_geometry');

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
if (!fs.existsSync(bookContentDir)) fs.mkdirSync(bookContentDir, { recursive: true });

/**
 * 全书物理页码与章节规划表
 * 常数偏移: PHYSICAL_PAGE = BOOK_PAGE + 10
 */
export const SECTIONS = [
  // ===================== 第 1 章 行列式 (Phys 11 ~ 41) =====================
  {
    chapter: 1,
    section: '1.1',
    title: '二三阶行列式',
    displayTitle: '1.1 二、三阶行列式',
    dir: lagPagesDir,
    leadIn: '行列式是由解线性方程组产生的，是线性代数学中的一个重要基本概念，它作为一种重要的数学工具，在自然科学的许多领域内都有广泛的应用。本节首先介绍二、三阶行列式，建立对角线法则与二元、三元线性方程组公式解的内在联系。\n\n',
    batches: [
      { start: 11, end: 14, note: '从第 11 页“第 1 章 行列式”与“§1.1 二、三阶行列式”开始，涵盖二阶行列式、三阶行列式、对角线法则（配图 fig_1_1.png）、例 1、例 2 及例 3，至第 14 页“§1.2”标题前终结输出' }
    ]
  },
  {
    chapter: 1,
    section: '1.2',
    title: '全排列及其逆序数',
    displayTitle: '1.2 全排列及其逆序数',
    dir: lagPagesDir,
    leadIn: '为了定义一般的 $n$ 阶行列式，需要引入全排列及其逆序数的概念。本节介绍排列的逆序数计算方法、奇排列与偶排列的定义，以及对换改变排列奇偶性的核心定理。\n\n',
    batches: [
      { start: 14, end: 15, note: '从第 14 页中间“§1.2 全排列及其逆序数”开始，涵盖排列定义、逆序数定义与计算公式、例 4、定理 1 对换性质、推论 1 与推论 2，至第 15 页“§1.3”大标题前终结输出' }
    ]
  },
  {
    chapter: 1,
    section: '1.3',
    title: 'n阶行列式的概念',
    displayTitle: '1.3 n 阶行列式的概念',
    dir: lagPagesDir,
    leadIn: '利用全排列和逆序数的概念，可以将二、三阶行列式推广到一般的 $n$ 阶行列式。本节给出 $n$ 阶行列式的一般代数定义，并讨论上三角、下三角与对角行列式的特殊求值公式。\n\n',
    batches: [
      { start: 15, end: 18, note: '从第 15 页底部的“§1.3 n 阶行列式的概念”开始，涵盖三阶展开式结构、定义 4（n 阶行列式代数定义）、例 5（上三角行列式）、例 6 及定理 2（按列指标排定顺序的等价定义），至第 18 页“§1.4”大标题前终结输出' }
    ]
  },
  {
    chapter: 1,
    section: '1.4',
    title: '行列式的性质',
    displayTitle: '1.4 行列式的性质',
    dir: lagPagesDir,
    leadIn: '按定义计算高阶行列式需要计算 $n!$ 项的代数和，计算量极其巨大。为了简化计算，本节系统阐述行列式的基本性质（包括转置、换行、倍乘、拆项及初等行变换性质），为行列式的化简与求值提供坚实的理论依据。\n\n',
    batches: [
      { start: 18, end: 20, note: '从第 18 页“§1.4 行列式的性质”开始，涵盖性质 1（转置行列式相等）至性质 4（两行相同或成比例则为零），包含证明与推论' },
      { start: 21, end: 23, note: '涵盖性质 5（单行拆项可加性）、性质 6（初等行变换保值性）、例 7 至例 9 典型计算，至第 23 页“§1.5”大标题前终结输出' }
    ]
  },
  {
    chapter: 1,
    section: '1.5',
    title: '行列式的展开定理',
    displayTitle: '1.5 行列式的展开定理',
    dir: lagPagesDir,
    leadIn: '本节介绍行列式按行（列）展开的降阶计算方法，建立余子式与代数余子式的概念，证明行列式按行展开定理，并总结常用的高阶行列式计算技巧。\n\n',
    batches: [
      { start: 24, end: 27, note: '从第 24 页“§1.5 行列式的展开定理”开始，涵盖余子式与代数余子式定义、引理、定理 3（按一行列展开定理）及其推论，例 10' },
      { start: 28, end: 32, note: '涵盖例 11 至例 14 典型技巧（爪型、递推、Vandermonde 行列式）以及带*号的拉普拉斯定理，至第 32 页“§1.6”大标题前终结输出' }
    ]
  },
  {
    chapter: 1,
    section: '1.6',
    title: '克拉默法则',
    displayTitle: '1.6 克拉默法则',
    dir: lagPagesDir,
    leadIn: '克拉默法则（Cramer\'s Rule）揭示了含有 $n$ 个方程的 $n$ 元线性方程组的解与方程组系数行列式之间的内在代数联系。本节证明克拉默法则，并讨论齐次线性方程组存在非零解的充要条件。\n\n',
    batches: [
      { start: 33, end: 36, note: '从第 33 页“§1.6 克拉默法则”开始，涵盖定理 4（Cramer 法则）、证明与例 15、例 16，定理 5（齐次方程组零解充要条件）与定理 6，至第 36 页遇到“习题一”大标题时立即终结输出，严禁输出课后习题题目' }
    ]
  }
];

/**
 * 文本清洗器：剥离思维链残留、Markdown围栏及溢出的课后题
 */
export function cleanGeminiOutput(rawText) {
  let cleaned = rawText.trim();

  cleaned = cleaned.replace(/^---[\s\S]*?\*\*思考大纲\*\*[\s\S]*?---\s*/i, '');
  cleaned = cleaned.replace(/^---[\s\S]*?#\s*教材扫描图内容描述[\s\S]*?---\s*/i, '');
  cleaned = cleaned.replace(/^---[\s\S]*?###\s*思考过程[\s\S]*?---\s*/i, '');
  cleaned = cleaned.replace(/^[\s\S]*?<\/thought>\s*/i, '');

  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```[a-zA-Z0-9_-]*\r?\n/, '');
    cleaned = cleaned.replace(/\r?\n```\s*$/, '');
  }

  // 截断课后习题
  cleaned = cleaned.replace(/##\s*习题\s*[\d一二三四五六七八九]+[\s\S]*$/, '');
  cleaned = cleaned.replace(/###\s*习题\s*[\d一二三四五六七八九]+[\s\S]*$/, '');
  cleaned = cleaned.replace(/<Knowledge[^>]*title=["'][^"']*习题[\s\S]*$/, '');
  cleaned = cleaned.replace(/<ExerciseTrigger[\s\S]*$/, '');

  return cleaned.trim();
}

/**
 * AST 卡片自动平衡与闭合器
 */
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

/**
 * MDX 后处理管道：规范 KaTeX、解耦长题干、规范配图路径
 */
export function postProcessSectionMdx(content, chapter) {
  let text = content;

  // 1. 将带 \tag 的行内公式提升为独立块级公式 $$
  text = text.replace(/(?<!\$)\$(?!\$)([^$\r\n]*?\\tag\{[^{}]+\}[^$\r\n]*?)\$(?!\$)/g, (match, formula) => {
    return `\n\n$$\n${formula.trim()}\n$$\n\n`;
  });

  // 2. 保证包含 \tag 的 $$ 单行公式拆为前后空行的 3 行结构
  text = text.replace(/(?<!\$)\$\$([^\$\r\n]*?\\tag\{[^{}]+\}[^\$\r\n]*?)\$\$(?!\$)/g, (match, formula) => {
    return `\n\n$$\n${formula.trim()}\n$$\n\n`;
  });

  // 3. 保证 $$ 块前后必须留有空行
  text = text.replace(/([^\r\n])\s*\n\$\$/g, (match, p1) => `${p1}\n\n$$`);
  text = text.replace(/\$\$\s*\n([^\r\n])/g, (match, p1) => `$$\n\n${p1}`);

  // 4. 标准化 KaTeX tag 内的编号
  text = text.replace(/\\tag\{①\}/g, '\\tag{1}');
  text = text.replace(/\\tag\{②\}/g, '\\tag{2}');
  text = text.replace(/\\tag\{③\}/g, '\\tag{3}');
  text = text.replace(/\\tag\{④\}/g, '\\tag{4}');
  text = text.replace(/\\tag\{⑤\}/g, '\\tag{5}');

  // 5. 保证 JSX 卡片开闭标签前后留有空行
  text = text.replace(/(<(?:Knowledge|Solution|Example|SideNote|Block|Analysis)(?:\s+(?:"[^"]*"|'[^']*'|[^>'"])*)?>)([^\r\n])/g, '$1\n\n$2');
  text = text.replace(/([^\r\n])(<\/(?:Knowledge|Solution|Example|SideNote|Block|Analysis)>)/g, '$1\n\n$2');

  // 6. 严防课后习题泄露
  text = text.replace(/<Knowledge[^>]*title=["'][^"']*习题[\s\S]*$/, '');
  text = text.replace(/##\s*习题[\s\S]*$/, '');
  text = text.replace(/###\s*习题[\s\S]*$/, '');
  text = text.replace(new RegExp(`第\\s*${chapter}\\s*章习题[\\s\\S]*$`), '');
  text = text.replace(/综合练习题[\s\S]*$/, '');

  // 7. AST 卡片配平
  text = balanceJsxCards(text);

  // 8. 规范图片路径为 ./images/fig_X_Y.png
  text = text.replace(/!\[(.*?)\]\(images\//g, '![$1](./images/');
  text = text.replace(new RegExp(`!\\[(.*?)\\]\\(\\./images/fig_${chapter}\\.(\\d+)\\.png\\)`, 'g'), `![$1](./images/fig_${chapter}_$2.png)`);

  // 9. 移除正文多余的 H1 标题
  text = text.replace(/^#[^#\r\n]+\r?\n+/gm, '');

  // 10. 长例题题干分流（>60 字符），防止 title 导致全局加粗与折行挤压
  text = text.replace(/<Example\s+title="((?:例\s*[\d\.]+|例题\s*[\d\.]+|例\s*\d+)[^"]{60,})">/g, (match, fullTitle) => {
    const m = fullTitle.match(/^(例\s*[\d\.]+|例题\s*[\d\.]+|例\s*\d+)/);
    const prefix = m ? m[1] : '例题';
    const safeTitle = fullTitle.replace(/<([a-zA-Z])/g, '< $1');
    return `<Example title="${prefix}">\n\n${safeTitle}\n\n`;
  });

  // 11. 清理多余空行
  text = text.replace(/\n{4,}/g, '\n\n\n');

  return text.trim();
}

export function buildHeader(section, title, leadIn) {
  return `---
title: '${title}'
---
import ExerciseTrigger from '@/components/exercises/ExerciseTrigger.astro';

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

export function buildFooter(chapter, section, title) {
  return `\n\n<ExerciseTrigger chapter={${chapter}} section="${section}" title="${section} ${title} 课后真题与自测练习" />\n`;
}

export function buildPrompt(sec, batch, isFirstBatch, isLastBatch) {
  const boundaryDirective = isFirstBatch && isLastBatch
    ? `【范围边界指令】：本节为单次完整输出（Phys ${batch.start} ~ ${batch.end}）。${batch.note}。遇到课后习题时立即终结输出，严禁输出课后习题题目！`
    : isFirstBatch
    ? `【范围边界指令】：当前是本节第 1 批（Phys ${batch.start} ~ ${batch.end}）。${batch.note}。请完整输出该范围内全部内容，保持与后续批次衔接。`
    : isLastBatch
    ? `【范围边界指令】：当前是本节末尾批（Phys ${batch.start} ~ ${batch.end}）。${batch.note}。在正文末尾遇到课后习题（如“习题一”）时必须立即终结输出，严禁输出课后习题题目！`
    : `【范围边界指令】：当前是本节中间语义批（Phys ${batch.start} ~ ${batch.end}）。${batch.note}。请直接继续数学推导，不要重复上一批的内容，也不要输出课后习题。`;

  return `【核心指令】：思考过程请保持极简（不超过 80 字大纲），把全部输出配额用于生成完整的 MDX 正文！

你是一名顶级大学数学教材出版总监与 AstroLib MDX 结构化专家。
你正在对《线性代数与几何（第2版）》第 ${sec.section} 节《${sec.title}》进行全视觉高保真推倒重建。
传入的图片是原书对应章节的 150 DPI 高清扫描原版物理页面。

${boundaryDirective}

请直接阅读并理解图片中的版面布局、数学推导与公式，将其高保真、结构化地输出为符合 AstroLib 规范的纯净 MDX 正文。

必须严格遵守以下六大铁律契约：

1. 边栏批注彻底抽离为 <SideNote>：
   - 原书版面中印刷在右侧边栏的“注”、“注意”、“说明”、“几何解释”等批注，必须从主栏推导中完全抽离；
   - 封装为 <SideNote title="...">内容</SideNote>，放置在对应段落开头或卡片内部；
   - 主栏推导句子必须保持绝对完整连贯，严禁被边栏批注插断或掐头去尾。

2. 语义卡片闭合与层级规范（杜绝错位与嵌套）：
   - 核心定理/定义使用 <Knowledge title="...">...</Knowledge>，定理证明使用 <Solution title="证明">...</Solution>；
   - 例题题面使用 <Example title="...">...</Example>，解题过程使用 <Solution title="解">...</Solution>；
   - 【例题分流】：较短例题可直接保留在标题位（如 <Example title="例 1 解方程组">）；长例题或应用题，title 仅写简短主题（如 <Example title="例 2">），详细长题设放入卡片正文，严禁整段塞进 title 造成全体加粗；
   - 【严禁卡片嵌套大纲】：原书小节与并列知识点（如“一、二阶行列式”、“二、三阶行列式”）必须使用 ## 二级标题或 ### 三级标题，严禁用 <Knowledge> 包裹大纲，严禁将 <Example> 嵌套在 <Knowledge> 内部！

3. 100% 工业级 KaTeX 纯净度与独立块级：
   - 变量符号统一用 $...$（如 $A, \boldsymbol{x}, \lambda, \det(A)$），严禁裸西文字符；
   - 【带编号公式】：所有带 \\tag{X.Y} 的公式必须作为独立块级公式，且前后必须留有空行：
     
     $$
     formula \\tag{X.Y}
     $$
     
   - 【严防嵌套 tag】：在 cases、aligned 或矩阵等公式环境内部严禁使用 \\tag，内部编号统一使用对齐符与标准括号数字（如 & (1) \\ & (2)）；
   - 杜绝公式内 Unicode 带圈字符（如 ①，②），一律使用 ASCII 标准 (1), (2)。

4. 响应式配图规范：
   - 若版面内包含几何配图（如对角线法则图、空间坐标系、平面直线示意图），统一使用 Markdown 图片语法包裹在 <figure class="vp-figure"> 中：
     
     <figure class="vp-figure">
       ![](./images/fig_X_Y.png)
       <figcaption>图 X.Y 详细说明</figcaption>
     </figure>
     
   - 图片文件名统一遵循 ./images/fig_X_Y.png 规范。

5. 杜绝课后习题平铺：
   - 遇到本节或本章末尾的“习题 X”大标题时，必须立即终结输出，严禁把课后练习题平铺在正文尾部。

请直接输出高质量的 MDX 正文，不加外层 \`\`\`mdx 围栏！`;
}

export async function runSection(sec, options = {}) {
  console.log(`\n======================================================`);
  console.log(`🚀 开始处理：第 ${sec.section} 节《${sec.title}》`);
  console.log(`📖 规划模式：${sec.batches.length === 1 ? '🌟 单节全量一气呵成' : `📦 语义 ${sec.batches.length} 段无缝拼接`}`);
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
        throw new Error(`切片原图缺失: ${pFile}，请先执行 slice_lag_pdf.py`);
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
          const { text, thought, durationMs } = await streamGeminiVision(prompt, pages, options);
          chunkText = cleanGeminiOutput(text);

          if (chunkText.length < 150) {
            throw new Error(`生成正文异常过短 (${chunkText.length} 字符)，触发自动重试...`);
          }

          fs.writeFileSync(cacheFile, chunkText, 'utf-8');
          fs.writeFileSync(cacheFile.replace('.mdx', '_thought.log'), thought, 'utf-8');
          console.log(`  [Done] 批次完成! 生成 ${chunkText.length} 字符，已持久化缓存至 ${path.basename(cacheFile)}`);
          success = true;
        } catch (err) {
          console.warn(`\n⚠️ [Batch Loop Retry #${loopAttempt}] 批次遇到异常 (${err.message})，等待 20 秒后自动重新发起此批次...`);
          loopAttempt++;
          await new Promise(r => setTimeout(r, 20000));
        }
      }
    }

    chunkOutputs.push(chunkText);
  }

  // 组装并执行后处理
  const joinedBody = chunkOutputs.join('\n\n');
  const processedBody = postProcessSectionMdx(joinedBody, sec.chapter);
  const finalMdx = buildHeader(sec.section, sec.displayTitle, sec.leadIn) + processedBody + buildFooter(sec.chapter, sec.section, sec.title);

  const targetFile = path.join(bookContentDir, `${sec.section}_${sec.title}.mdx`);
  fs.writeFileSync(targetFile, finalMdx, 'utf-8');
  console.log(`\n📄 [Assembly] 成功组装保存第 ${sec.section} 节到：${targetFile} (${finalMdx.length} 字符)`);

  // 质量门禁扫描
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
  let apiKey = null;
  let model = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--chapter' && args[i + 1]) targetChapter = parseInt(args[i + 1]);
    if (args[i] === '--section' && args[i + 1]) targetSection = args[i + 1];
    if (args[i] === '--from-section' && args[i + 1]) fromSection = args[i + 1];
    if (args[i] === '--api-key' && args[i + 1]) apiKey = args[i + 1];
    if (args[i] === '--model' && args[i + 1]) model = args[i + 1];
  }

  console.log(`\n=============================================================`);
  console.log(`🌟 启动《线性代数与几何（第2版）》Gemini 视觉长程推倒重建流水线`);
  if (targetSection) {
    console.log(`🌟 目标：单节精修 [${targetSection}]`);
  } else if (fromSection) {
    console.log(`🌟 目标：从 [${fromSection}] 开始推进`);
  } else if (targetChapter) {
    console.log(`🌟 目标：第 ${targetChapter} 章全量小节`);
  } else {
    console.log(`🌟 目标：第 1 章全量小节 (1.1 ~ 1.6)`);
  }
  console.log(`=============================================================\n`);

  let queue = SECTIONS;
  if (targetSection) {
    queue = SECTIONS.filter(s => s.section === targetSection);
  } else if (fromSection) {
    const startIdx = SECTIONS.findIndex(s => s.section === fromSection);
    if (startIdx !== -1) queue = SECTIONS.slice(startIdx);
  } else if (targetChapter) {
    queue = SECTIONS.filter(s => s.chapter === targetChapter);
  }

  const options = {};
  if (apiKey) options.apiKey = apiKey;
  if (model) options.model = model;

  for (const sec of queue) {
    await runSection(sec, options);
  }

  console.log(`\n🎉🎉🎉 流水线指定章节重建完成！\n`);
}

if (process.argv[1]?.includes('reconstruct_linear_algebra_geometry.mjs')) {
  main();
}
