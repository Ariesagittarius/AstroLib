import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { streamGemmaVision } from './gemma_vision_client.mjs';

const ROOT_DIR = process.cwd();
const chPagesDir = path.join(ROOT_DIR, 'test/data/ch4_pages');
const outputDir = path.join(ROOT_DIR, 'test/output');
const rebuildDir = path.join(ROOT_DIR, 'src/content/docs/collections/math/engineering_analysis_rebuild');

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
if (!fs.existsSync(rebuildDir)) fs.mkdirSync(rebuildDir, { recursive: true });

const SECTIONS = [
  {
    chapter: 4,
    section: '4.1',
    title: '几类简单的微分方程',
    startPage: 262,
    endPage: 282,
    leadIn: `本节主要讨论几类能直接利用积分方法求解的简单微分方程及其应用。\n\n`
  },
  {
    chapter: 4,
    section: '4.2',
    title: '高阶线性微分方程',
    startPage: 284,
    endPage: 308,
    leadIn: `本节讨论高阶线性微分方程的有关概念、解的性质与结构，以及常系数高阶线性微分方程的求解方法。\n\n`
  },
  {
    chapter: 4,
    section: '4.3',
    title: '线性微分方程组',
    startPage: 310,
    endPage: 335,
    leadIn: `本节讨论线性微分方程组解的结构、常系数线性微分方程组的求解方法及其应用。\n\n`
  }
];

export function buildPrompt(section, title, isFirstBatch, isLastBatch) {
  return `【核心指令】：思考过程请保持极简（不超过 100 字简要大纲），把全部输出配额用于生成完整的 MDX 正文！

你是一名顶级大学数学教材出版总监与 AstroLib MDX 结构化专家。
你正在对《工科数学分析基础》第 ${section} 节《${title}》进行全视觉推倒重建。
传入的图片是原书对应章节的 150 DPI 高清扫描原版页面。

请直接阅读并理解图片中的版面布局、数学推导与公式，将其高保真、结构化地输出为符合 AstroLib 规范的纯净 MDX 正文。

必须严格遵守以下六大铁律契约：

1. 边栏批注彻底抽离为 <SideNote>：
   - 原书版面中印刷在右侧边栏的“想一想”、“注”、“注意”、“思路分析”、“几何解释”等批注，必须从主栏推导中完全抽离；
   - 封装为 <SideNote title="...">内容</SideNote>，放置在对应段落开头或卡片内部；
   - 主栏推导句子必须保持绝对完整连贯，严禁被边栏批注掐断。

2. 语义卡片闭合与层级规范（杜绝错位与嵌套）：
   - 核心定理/定义使用 <Knowledge title="...">...</Knowledge>，定理证明使用 <Solution title="证明">...</Solution>；
   - 例题题面使用 <Example title="...">...</Example>，解题过程使用 <Solution title="解">...</Solution>；
   - 【例题分流】：较短例题可直接保留在标题位（如 <Example title="例 4.1 求微分方程 ...">）；长例题或应用题，title 仅写简短主题（如 <Example title="例 4.1 自由落体运动问题">），详细长题干放入卡片正文，严禁整段塞进 title 造成全体加粗；
   - 【严禁卡片嵌套大纲】：原书小节与并列知识点（如“1. 可分离变量的一阶微分方程”、“2. 一阶线性微分方程”）必须使用 ### 小标题，严禁用 <Knowledge> 包裹大纲，严禁将 <Example> 嵌套在 <Knowledge> 内部！

3. 100% 工业级 KaTeX 纯净度与独立块级：
   - 变量符号统一用 $...$（如 $x, y, y', y'', \\Delta x, \\mathrm{d}x, \\frac{\\mathrm{d}y}{\\mathrm{d}x}$）；
   - 【带编号公式】：所有带 \\tag{X.Y} 的公式必须作为独立块级公式，且前后必须留有纯空行：

     $$
     formula \\tag{X.Y}
     $$

     严禁写在行内 $...$ 中，严禁紧贴正文不留空行（否则 KaTeX 将抛出 parse error 报错）。

4. 响应式配图规范（本章配图均已就绪）：
   - 几何图形、物理模型示意图统一使用：
     <figure class="vp-figure">
       ![](./images/fig_4_X.png)
       <figcaption>图 4.X 说明</figcaption>
     </figure>
   - 【图 4.2 特别规范】：图 4.2 (a)线素场 与 (b)积分曲线族 为组合图，已整合成一张大图，请统一使用 ![](./images/fig_4_2.png)；
   - 【严禁对纯公式表格插入伪图片】：微分方程通解汇总表、特征根表等必须使用 Markdown 表格或 KaTeX 矩阵/数组排版，严禁为其生成伪图片引用（如 <img src="fig_4_x_y.png" />）！

5. 融媒体微课组件化：
   - 遇到二维码微课，统一转化为 <QRCodeVideo id="4.X.Y" title="..." url="#" />，删去残留文字碎片。

6. 课后习题解耦：
   ${isLastBatch ? '- 在正文末尾如果遇到“习题 4.X”大标题或练习题，必须立即终结正文输出，严禁输出课后习题题目！' : '- 当前是本节中间分块，请完整生成所有推导和例题。'}

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

export function postProcessSectionMdx(content) {
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

  text = text.replace(/(<(?:Knowledge|Solution|Example|SideNote|Block|Analysis)[^>]*>)([^\r\n])/g, '$1\n\n$2');
  text = text.replace(/([^\r\n])(<\/(?:Knowledge|Solution|Example|SideNote|Block|Analysis)>)/g, '$1\n\n$2');

  text = text.replace(/<Knowledge[^>]*title=["'][^"']*习题[\s\S]*$/, '');
  text = text.replace(/##\s*习题[\s\S]*$/, '');
  text = text.replace(/###\s*习题[\s\S]*$/, '');
  text = text.replace(/第\s*4\s*章习题[\s\S]*$/, '');
  text = text.replace(/综合练习题[\s\S]*$/, '');

  text = balanceJsxCards(text);

  text = text.replace(/<figure[^>]*>\s*<img[^>]*src=["'][^"']*fig_4_\d+_\d+\.png["'][^>]*>\s*<figcaption>[^<]*<\/figcaption>\s*<\/figure>/gi, '');

  text = text.replace(/!\[(.*?)\]\(images\//g, '![$1](./images/');
  text = text.replace(/!\[(.*?)\]\(\.\/images\/fig_4\.(\d+)\.png\)/g, '![$1](./images/fig_4_$2.png)');

  text = text.replace(/\n{4,}/g, '\n\n\n');

  return text.trim();
}

export function balanceJsxCards(text) {
  const cardNames = ['Knowledge', 'Example', 'Solution', 'SideNote', 'Block', 'Analysis', 'Note', 'Method', 'Guide', 'Variant'];
  const tagRegex = /<(\/)?([a-zA-Z0-9_-]+)(?:\s+[^>]*)?(\/)?>/g;
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
title: '${section} ${title}'
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

async function runSection(sec) {
  console.log(`\n======================================================`);
  console.log(`🚀 开始处理：第 ${sec.section} 节《${sec.title}》`);
  console.log(`📖 物理页范围：Phys ${sec.startPage} ~ ${sec.endPage} (共 ${sec.endPage - sec.startPage + 1} 页)`);
  console.log(`======================================================`);

  const batches = [];
  for (let p = sec.startPage; p <= sec.endPage; p += 3) {
    const bEnd = Math.min(p + 2, sec.endPage);
    const pages = [];
    for (let i = p; i <= bEnd; i++) {
      pages.push(path.join(chPagesDir, `phys_${i}.jpg`));
    }
    batches.push({ start: p, end: bEnd, pages });
  }

  console.log(`[Batches] 规划 ${batches.length} 个批次处理:`);
  batches.forEach((b, idx) => {
    console.log(`  批次 ${idx + 1}: Phys ${b.start} ~ ${b.end} (${b.pages.length} 张原图)`);
  });

  const chunkOutputs = [];
  for (let idx = 0; idx < batches.length; idx++) {
    const b = batches[idx];
    const isFirst = idx === 0;
    const isLast = idx === batches.length - 1;
    const cacheFile = path.join(outputDir, `${sec.section}_batch_${b.start}_${b.end}.mdx`);

    console.log(`\n------------------------------------------------------`);
    console.log(`📦 [${sec.section} 批次 ${idx + 1}/${batches.length}] Phys ${b.start} ~ ${b.end}...`);

    let chunkText = '';
    if (fs.existsSync(cacheFile) && fs.statSync(cacheFile).size > 100) {
      console.log(`  [Cache] 命中已有缓存文件: ${path.basename(cacheFile)}`);
      chunkText = fs.readFileSync(cacheFile, 'utf-8');
    } else {
      const prompt = buildPrompt(sec.section, sec.title, isFirst, isLast);
      let success = false;
      let loopAttempt = 1;
      while (!success) {
        try {
          const { text, thought, durationMs } = await streamGemmaVision(prompt, b.pages);
          chunkText = cleanBatchText(text);

          fs.writeFileSync(cacheFile, chunkText, 'utf-8');
          fs.writeFileSync(cacheFile.replace('.mdx', '_thought.log'), thought, 'utf-8');
          console.log(`  [Done] 批次完成，生成 ${chunkText.length} 字符，已缓存至 ${path.basename(cacheFile)}`);
          success = true;
        } catch (err) {
          console.warn(`\n⚠️ [Batch Loop Retry #${loopAttempt}] 批次遇到上游拥塞 (${err.message})，等待 25 秒后自动重新发起此批次...`);
          loopAttempt++;
          await new Promise(r => setTimeout(r, 25000));
        }
      }
    }

    chunkOutputs.push(chunkText);
  }

  const joinedBody = chunkOutputs.join('\n\n');
  const processedBody = postProcessSectionMdx(joinedBody);
  const finalMdx = buildHeader(sec.section, sec.title, sec.leadIn) + processedBody + buildFooter(sec.chapter, sec.section, sec.title);

  const targetFile = path.join(rebuildDir, `${sec.section}_${sec.title}.mdx`);
  fs.writeFileSync(targetFile, finalMdx, 'utf-8');
  console.log(`\n📄 [Assembly] 已保存第 ${sec.section} 节到：${targetFile} (${finalMdx.length} 字符)`);

  console.log(`🔍 [Scan] 正在校验 ${path.basename(targetFile)}...`);
  try {
    const scanOut = execSync(`node scripts/scan-mdx.mjs "${targetFile}"`, { encoding: 'utf-8' });
    console.log(scanOut.trim());
  } catch (err) {
    console.warn(`⚠️ [Scan Warning] 校验存在报警或轻微异常:\n`, (err.stdout || err.message).trim());
  }

  console.log(`✅ 第 ${sec.section} 节《${sec.title}》完成！\n`);
  return targetFile;
}

async function main() {
  console.log(`\n=============================================================`);
  console.log(`🌟 启动第四章（常微分方程）全视觉端到端自动化连续推倒重建`);
  console.log(`🌟 目标章节：4.1 ~ 4.3 全量 3 个大节 (Phys 262 ~ 335, 共 74 页)`);
  console.log(`=============================================================\n`);

  try {
    console.log(`[Materialize] 正在实体化第四章插图资产...`);
    execSync(`.venv\\Scripts\\python scripts/vision_reconstruct/materialize_figures.py --chapter 4`, { stdio: 'inherit' });
  } catch (err) {
    console.warn(`[Materialize Warning]`, err.message);
  }

  const missingPages = [];
  for (let p = 262; p <= 335; p++) {
    if (!fs.existsSync(path.join(chPagesDir, `phys_${p}.jpg`))) {
      missingPages.push(p);
    }
  }
  if (missingPages.length > 0) {
    console.log(`[Slice] 发现缺失 ${missingPages.length} 页切片，正在自动执行切片...`);
    execSync(`.venv\\Scripts\\python scripts/vision_reconstruct/slice_pdf_pages.py --start 262 --end 335 --out test/data/ch4_pages --dpi 150`, { stdio: 'inherit' });
  } else {
    console.log(`[Slice] 第四章全量 74 页扫描图切片已 100% 就绪。`);
  }

  const startTime = Date.now();
  const completedFiles = [];

  for (const sec of SECTIONS) {
    try {
      const file = await runSection(sec);
      completedFiles.push(file);
    } catch (err) {
      console.error(`❌ 处理第 ${sec.section} 节时发生严重错误:`, err);
      throw err;
    }
  }

  const totalTimeSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n🎉🎉🎉 第四章全量 3 小节自动化连续推倒重建全部完成！耗时 ${totalTimeSec}s`);
  console.log(`已完成文件清单：`);
  completedFiles.forEach(f => console.log(`  - ${f}`));

  console.log(`\n🔍 正在对第四章执行全量质量门禁复核...`);
  try {
    const globalScan = execSync(`node scripts/scan-mdx.mjs "src/content/docs/collections/math/engineering_analysis_rebuild"`, { encoding: 'utf-8' });
    console.log(globalScan);
  } catch (err) {
    console.log(err.stdout || err.message);
  }
}

if (process.argv[1]?.includes('reconstruct_chapter_4.mjs')) {
  main().catch(err => {
    console.error('Fatal error in Chapter 4 reconstruction:', err);
    process.exit(1);
  });
}
