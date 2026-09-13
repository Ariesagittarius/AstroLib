import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { streamGeminiVision } from './gemini_vision_client.mjs';

const ROOT_DIR = process.cwd();
const ch1PagesDir = path.join(ROOT_DIR, 'test/data/ch1_pages');
const outputDir = path.join(ROOT_DIR, 'test/output');
const rebuildDir = path.join(ROOT_DIR, 'src/content/docs/collections/math/engineering_analysis_rebuild');

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
if (!fs.existsSync(rebuildDir)) fs.mkdirSync(rebuildDir, { recursive: true });

export const SECTIONS = [
  {
    chapter: 1,
    section: '1.1',
    title: '集合映射与函数',
    displayTitle: '1.1 集合 映射与函数',
    dir: ch1PagesDir,
    leadIn: '在中学已经学习过函数的一些基本知识，为了加深对函数概念的理解，本节将在集合与映射的基础上进一步介绍函数及其相关的概念、函数的运算性质（包括复合运算与逆运算）以及初等函数等。\n\n',
    batches: [
      { start: 21, end: 29, note: '从第 21 页“第一章 第一节”大标题开始，涵盖集合及其运算、映射与逆映射概念' },
      { start: 30, end: 39, note: '涵盖函数的概念、性质、复合运算与初等函数，至第 39 页遇到“习题 1.1”时终结输出' }
    ]
  },
  {
    chapter: 1,
    section: '1.2',
    title: '数列的极限',
    displayTitle: '1.2 数列的极限',
    dir: ch1PagesDir,
    leadIn: '极限是深入研究变量变化规律的一个基本概念，是研究微积分的重要工具和思想方法。本节将着重介绍数列极限的概念、收敛数列的性质、判别数列收敛性的方法以及数列极限的求法，为进一步学习函数极限和微积分的其他知识打好基础。\n\n',
    batches: [
      { start: 40, end: 49, note: '从第 40 页底部的“第二节 数列的极限”大标题开始，涵盖数列极限的定义与收敛数列的基本性质' },
      { start: 50, end: 59, note: '涵盖单调有界收敛准则、Cauchy 收敛原理与夹逼准则，至第 59 页遇到“习题 1.2”时终结输出' }
    ]
  },
  {
    chapter: 1,
    section: '1.3',
    title: '函数的极限',
    displayTitle: '1.3 函数的极限',
    dir: ch1PagesDir,
    leadIn: '本节的任务是类比于数列将极限的概念、理论和方法推广到函数中去。我们根据函数的特点先将极限概念推广到函数，然后再介绍函数极限的性质、求函数极限的方法和判定函数极限的存在准则。\n\n',
    batches: [
      { start: 60, end: 69, note: '从第 60 页底部的“第三节 函数的极限”大标题开始，涵盖函数极限的各种变化形态及定义、单侧极限' },
      { start: 70, end: 78, note: '涵盖函数极限的运算法则、两个重要极限与夹逼准则，至第 78 页遇到“习题 1.3”时终结输出' }
    ]
  },
  {
    chapter: 1,
    section: '1.4',
    title: '无穷小量与无穷大量',
    displayTitle: '1.4 无穷小量与无穷大量',
    dir: ch1PagesDir,
    leadIn: '无穷小量与无穷大量是与极限有密切关系的两个概念，在微积分理论中起着重要作用。本节重点讲解无穷小量的概念、性质及其阶，以及用无穷小等价代换求极限的方法，最后简要介绍无穷大量。\n\n',
    batches: [
      { start: 79, end: 88, note: '从第 79 页底部的“第四节”大标题开始，涵盖无穷小量性质、阶的比较、等价无穷小替换与无穷大量，至第 88 页遇到“习题 1.4”时终结输出' }
    ]
  },
  {
    chapter: 1,
    section: '1.5',
    title: '连续函数',
    displayTitle: '1.5 连续函数',
    dir: ch1PagesDir,
    leadIn: '连续函数是微积分研究的主要对象。本节利用函数的极限讨论函数连续性的概念与间断点的分类，连续函数的基本性质与初等函数的连续性，以及闭区间上连续函数的重要性质（包括一致连续性）与应用。\n\n',
    batches: [
      { start: 89, end: 98, note: '从第 89 页底部的“第五节”大标题开始，涵盖函数连续性定义、间断点分类与连续函数的运算法则' },
      { start: 99, end: 107, note: '涵盖闭区间上连续函数的有界性、最值定理、介值定理与一致连续性，至第 107 页遇到“习题 1.5”时终结输出' }
    ]
  }
];

export function buildPrompt(sec, batch, isFirstBatch, isLastBatch) {
  const boundaryDirective = isFirstBatch && isLastBatch
    ? `【范围边界指令】：本节为单次完整输出（Phys ${batch.start} ~ ${batch.end}）。${batch.note}。遇到课后习题时立即终结输出，严禁输出课后习题题目！`
    : isFirstBatch
    ? `【范围边界指令】：当前是本节第 1 批（Phys ${batch.start} ~ ${batch.end}）。${batch.note}。请完整输出该范围内全部内容，保持与后续批次衔接。`
    : isLastBatch
    ? `【范围边界指令】：当前是本节末尾批（Phys ${batch.start} ~ ${batch.end}）。${batch.note}。在正文末尾遇到课后习题（“习题 1.X”）时必须立即终结输出，严禁输出课后习题题目！`
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
   - 【例题分流】：较短例题可直接写在标题位（如 <Example title="例 1.1">）；长例题或应用题，title 仅写简短主题，详细长题干放入卡片正文，严禁整段塞进 title 造成全体加粗；
   - 【严禁卡片嵌套大纲】：原书小节与并列知识点必须使用 ### 小标题，严禁用 <Knowledge> 包裹大纲，严禁将 <Example> 嵌套在 <Knowledge> 内部！

3. 100% 工业级 KaTeX 纯净度与独立块级：
   - 变量符号统一用 $...$（如 $x, y, f(x), \lim_{x\to x_0}, \varepsilon, \delta$）；
   - 【带编号公式】：所有带 \\tag{X.Y} 的公式必须作为独立块级公式，且前后必须留有纯空行：
     
     $$
     formula \\tag{X.Y}
     $$
     
     严禁写在行内 $...$ 中，严禁紧贴正文不留空行；
   - 严禁在 cases 或环境内部嵌套 \\tag{X}，编号统一使用 (1), (2)。

4. 响应式配图规范：
   - 函数图像、极限逼近示意图统一使用：
     <figure class="vp-figure">
       ![](./images/fig_${sec.chapter}_X.png)
       <figcaption>图 ${sec.chapter}.X 说明</figcaption>
     </figure>

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

  cleaned = cleaned.replace(/^---[\s\S]*?\*\*思考大纲\*\*[\s\S]*?---\s*/i, '');
  cleaned = cleaned.replace(/^---[\s\S]*?#\s*教材扫描图内容描述[\s\S]*?---\s*/i, '');
  cleaned = cleaned.replace(/^---[\s\S]*?###\s*思考过程[\s\S]*?---\s*/i, '');
  cleaned = cleaned.replace(/^[\s\S]*?<\/thought>\s*/i, '');

  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```[a-zA-Z0-9_-]*\r?\n/, '');
    cleaned = cleaned.replace(/\r?\n```\s*$/, '');
  }

  cleaned = cleaned.replace(/##\s*习题\s*[\d\.]+[\s\S]*$/, '');
  cleaned = cleaned.replace(/###\s*习题\s*[\d\.]+[\s\S]*$/, '');
  cleaned = cleaned.replace(/<Knowledge[^>]*title=["'][^"']*习题[\s\S]*$/, '');
  cleaned = cleaned.replace(/<ExerciseTrigger[\s\S]*$/, '');

  return cleaned.trim();
}

export function postProcessSectionMdx(content, chapter) {
  let text = content;

  text = text.replace(/(?<!\$)\$(?!\$)([^$\r\n]*?\\tag\{[^{}]+\}[^$\r\n]*?)\$(?!\$)/g, (match, formula) => {
    return `\n\n$$\n${formula.trim()}\n$$\n\n`;
  });

  text = text.replace(/(?<!\$)\$\$([^\$\r\n]*?\\tag\{[^{}]+\}[^\$\r\n]*?)\$\$(?!\$)/g, (match, formula) => {
    return `\n\n$$\n${formula.trim()}\n$$\n\n`;
  });

  text = text.replace(/([^\r\n])\s*\n\$\$/g, (match, p1) => `${p1}\n\n$$`);
  text = text.replace(/\$\$\s*\n([^\r\n])/g, (match, p1) => `$$\n\n${p1}`);

  text = text.replace(/\\tag\{①\}/g, '\\tag{1}');
  text = text.replace(/\\tag\{②\}/g, '\\tag{2}');
  text = text.replace(/\\tag\{③\}/g, '\\tag{3}');
  text = text.replace(/\\tag\{④\}/g, '\\tag{4}');
  text = text.replace(/\\tag\{⑤\}/g, '\\tag{5}');
  text = text.replace(/\\end\{aligned\}\s*\\end\{aligned\}/g, '\\end{aligned}');

  text = text.replace(/(<(?:Knowledge|Solution|Example|SideNote|Block|Analysis)(?:\s+(?:"[^"]*"|'[^']*'|[^>'"])*)?>)([^\r\n])/g, '$1\n\n$2');
  text = text.replace(/([^\r\n])(<\/(?:Knowledge|Solution|Example|SideNote|Block|Analysis)>)/g, '$1\n\n$2');

  text = text.replace(/<Knowledge[^>]*title=["'][^"']*习题[\s\S]*$/, '');
  text = text.replace(/##\s*习题[\s\S]*$/, '');
  text = text.replace(/###\s*习题[\s\S]*$/, '');
  text = text.replace(new RegExp(`第\\s*${chapter}\\s*章习题[\\s\\S]*$`), '');
  text = text.replace(/综合练习题[\s\S]*$/, '');

  text = balanceJsxCards(text);

  text = text.replace(/!\[(.*?)\]\(images\//g, '![$1](./images/');
  text = text.replace(new RegExp(`!\\[(.*?)\\]\\(\\./images/fig_${chapter}\\.(\\d+)\\.png\\)`, 'g'), `![$1](./images/fig_${chapter}_$2.png)`);

  text = text.replace(/^#[^#\r\n]+\r?\n+/gm, '');

  text = text.replace(/<Example\s+title="((?:例\s*[\d\.]+|例题\s*[\d\.]+|例\s*\d+)[^"]{70,})">/g, (match, fullTitle) => {
    const m = fullTitle.match(/^(例\s*[\d\.]+|例题\s*[\d\.]+|例\s*\d+)/);
    const prefix = m ? m[1] : '例题';
    const safeTitle = fullTitle.replace(/<([a-zA-Z])/g, '< $1');
    return `<Example title="${prefix}">\n\n${safeTitle}\n\n`;
  });

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
          console.warn(`\n⚠️ [Batch Loop Retry #${loopAttempt}] 批次遇到异常 (${err.message})，等待 15 秒后自动重新发起此批次...`);
          loopAttempt++;
          await new Promise(r => setTimeout(r, 15000));
        }
      }
    }

    chunkOutputs.push(chunkText);
  }

  const joinedBody = chunkOutputs.join('\n\n');
  const processedBody = postProcessSectionMdx(joinedBody, sec.chapter);
  const finalMdx = buildHeader(sec.section, sec.displayTitle, sec.leadIn) + processedBody + buildFooter(sec.chapter, sec.section, sec.title);

  const targetFile = path.join(rebuildDir, `${sec.section}_${sec.title}.mdx`);
  fs.writeFileSync(targetFile, finalMdx, 'utf-8');
  console.log(`\n📄 [Assembly] 成功组装保存第 ${sec.section} 节到：${targetFile} (${finalMdx.length} 字符)`);

  console.log(`✅ 第 ${sec.section} 节《${sec.title}》重建完毕！\n`);
  return targetFile;
}

async function main() {
  const args = process.argv.slice(2);
  let targetSection = null;
  let fromSection = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--section' && args[i + 1]) targetSection = args[i + 1];
    if (args[i] === '--from-section' && args[i + 1]) fromSection = args[i + 1];
  }

  console.log(`\n=============================================================`);
  console.log(`🌟 启动《工科数学分析》第一章 Gemini 3.5 Flash Lite 视觉推倒重建`);
  console.log(`=============================================================\n`);

  let queue = SECTIONS;
  if (targetSection) {
    queue = SECTIONS.filter(s => s.section === targetSection);
  } else if (fromSection) {
    const startIdx = SECTIONS.findIndex(s => s.section === fromSection);
    if (startIdx !== -1) queue = SECTIONS.slice(startIdx);
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
  console.log(`\n🎉 第一章重建全部顺利完成！总耗时 ${totalTimeSec}s`);
  completedFiles.forEach(f => console.log(`  - ${f}`));
}

if (process.argv[1]?.includes('reconstruct_chapter_1.mjs')) {
  main().catch(err => {
    console.error('Fatal error during chapter 1 reconstruction:', err);
    process.exit(1);
  });
}
