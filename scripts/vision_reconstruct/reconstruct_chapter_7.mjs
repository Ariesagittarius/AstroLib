import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { streamGeminiVision } from './gemini_vision_client.mjs';

const ROOT_DIR = process.cwd();
const ch7PagesDir = path.join(ROOT_DIR, 'test/data/ch7_pages');
const outputDir = path.join(ROOT_DIR, 'test/output');
const rebuildDir = path.join(ROOT_DIR, 'src/content/docs/collections/math/engineering_analysis_rebuild');

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
if (!fs.existsSync(rebuildDir)) fs.mkdirSync(rebuildDir, { recursive: true });

export const SECTIONS = [
  {
    chapter: 7,
    section: '7.1',
    title: '常数项级数',
    displayTitle: '7.1 常数项级数',
    dir: ch7PagesDir,
    leadIn: '本节讨论常数项级数的概念、性质与审敛准则，它们是学习函数项级数的基础。在学习这部分内容的时候，应当注意它与数列极限相应内容之间的关系。\n\n',
    batches: [
      { start: 269, end: 275, note: '从第 269 页“第七章 第一节”大标题开始，涵盖常数项级数概念、性质与收敛原理' },
      { start: 276, end: 282, note: '涵盖正项级数审敛准则：比较法、比值法、根值法与积分法' },
      { start: 283, end: 288, note: '涵盖交错级数 Leibniz 判别法与绝对收敛、条件收敛，至第 288 页遇到“习题 7.1”时终结输出' }
    ]
  },
  {
    chapter: 7,
    section: '7.2',
    title: '函数项级数',
    displayTitle: '7.2 函数项级数',
    dir: ch7PagesDir,
    leadIn: '所谓函数项级数，是指它的每一项都是函数的无穷级数。本节主要讨论一般的函数项级数的收敛性问题，包括处处收敛和一致收敛以及一致收敛的函数项级数所具有的重要性质。\n\n',
    batches: [
      { start: 289, end: 293, note: '从第 289 页“第二节”大标题开始，涵盖函数项级数处处收敛性与一致收敛性概念与审敛法' },
      { start: 294, end: 298, note: '涵盖一致收敛级数的连续性、可积性与可导性性质，至第 298 页遇到“习题 7.2”时终结输出' }
    ]
  },
  {
    chapter: 7,
    section: '7.3',
    title: '幂级数',
    displayTitle: '7.3 幂级数',
    dir: ch7PagesDir,
    leadIn: '在本节和下一节中将研究两类常用的函数项级数——幂级数与 Fourier 级数。本节研究幂级数的收敛性、幂级数在收敛区间内的性质以及函数展开为幂级数的问题。\n\n',
    batches: [
      { start: 298, end: 305, note: '从第 298 页底部的“第三节”大标题开始，涵盖幂级数的概念、收敛半径与 Abel 定理' },
      { start: 306, end: 312, note: '涵盖幂级数的运算与和函数分析性质' },
      { start: 313, end: 318, note: '涵盖函数展开为 Taylor 级数与常用函数的幂级数展开，至第 318 页遇到“习题 7.3”时终结输出' }
    ]
  },
  {
    chapter: 7,
    section: '7.4',
    title: 'Fourier级数',
    displayTitle: '7.4 Fourier 级数',
    dir: ch7PagesDir,
    leadIn: '本节讨论另一类在理论上和应用中都有重要价值的函数项级数——Fourier 级数。Fourier 级数是一种三角级数，是研究周期性物理现象的重要数学工具。本节主要讨论怎样将一个已知函数表示为三角级数的问题，也就是将函数展开为 Fourier 级数的问题。\n\n',
    batches: [
      { start: 318, end: 323, note: '从第 318 页大标题开始，涵盖周期函数与三角级数、三角函数系正交性与 Fourier 级数' },
      { start: 324, end: 328, note: '涵盖 Fourier 级数收敛定理、奇偶延拓与正弦/余弦级数' },
      { start: 329, end: 333, note: '涵盖一般周期的 Fourier 级数与复数形式，至第 333 页遇到“习题 7.4”时终结输出' }
    ]
  }
];

export function buildPrompt(sec, batch, isFirstBatch, isLastBatch) {
  const boundaryDirective = isFirstBatch && isLastBatch
    ? `【范围边界指令】：本节为单次完整输出（Phys ${batch.start} ~ ${batch.end}）。${batch.note}。遇到课后习题时立即终结输出，严禁输出课后习题题目！`
    : isFirstBatch
    ? `【范围边界指令】：当前是本节第 1 批（Phys ${batch.start} ~ ${batch.end}）。${batch.note}。请完整输出该范围内全部内容，保持与后续批次衔接。`
    : isLastBatch
    ? `【范围边界指令】：当前是本节末尾批（Phys ${batch.start} ~ ${batch.end}）。${batch.note}。在正文末尾遇到课后习题（“习题 7.X”）时必须立即终结输出，严禁输出课后习题题目！`
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
   - 【例题分流】：较短例题可直接写在标题位（如 <Example title="例 1.1 求级数和">）；长例题或应用题，title 仅写简短主题（如 <Example title="例 1.1 弹性小球往复跳动时间">），详细长题干放入卡片正文，严禁整段塞进 title 造成全体加粗；
   - 【严禁卡片嵌套大纲】：原书小节与并列知识点必须使用 ### 小标题，严禁用 <Knowledge> 包裹大纲，严禁将 <Example> 嵌套在 <Knowledge> 内部！

3. 100% 工业级 KaTeX 纯净度与独立块级：
   - 变量符号统一用 $...$（如 $a_n, S_n, x, q, u_n(x), \\sum_{n=1}^{\\infty} a_n$）；
   - 【带编号公式】：所有带 \\tag{X.Y} 的公式必须作为独立块级公式，且前后必须留有纯空行：
     
     $$
     formula \\tag{X.Y}
     $$
     
     严禁写在行内 $...$ 中，严禁紧贴正文不留空行；
   - 严禁在 cases 或环境内部嵌套 \\tag{X}，编号统一使用 (1), (2)。

4. 响应式配图规范：
   - 级数收敛示意图、Fourier 逼近波形图统一使用：
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
  let targetSection = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--section' && args[i + 1]) targetSection = args[i + 1];
  }

  console.log(`\n=============================================================`);
  console.log(`🌟 启动《工科数学分析》第七章（无穷级数）Gemma 视觉长程全自动推倒重建`);
  if (targetSection) {
    console.log(`🌟 目标：单节精修 [${targetSection}]`);
  } else {
    console.log(`🌟 目标：第七章 (7.1~7.4) 全量 4 个小节`);
  }
  console.log(`=============================================================\n`);

  let queue = SECTIONS;
  if (targetSection) {
    queue = SECTIONS.filter(s => s.section === targetSection);
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
  console.log(`\n🎉🎉🎉 第七章全自动推倒重建全部顺利完成！总耗时 ${totalTimeSec}s`);
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

if (process.argv[1]?.includes('reconstruct_chapter_7.mjs')) {
  main().catch(err => {
    console.error('Fatal error during chapter 7 reconstruction:', err);
    process.exit(1);
  });
}
