import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { streamGemmaVision } from './gemma_vision_client.mjs';

const ROOT_DIR = process.cwd();
const chPagesDir = path.join(ROOT_DIR, 'test/data/ch3_pages');
const outputDir = path.join(ROOT_DIR, 'test/output');
const rebuildDir = path.join(ROOT_DIR, 'src/content/docs/collections/math/engineering_analysis_rebuild');

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
if (!fs.existsSync(rebuildDir)) fs.mkdirSync(rebuildDir, { recursive: true });

// Chapter 3 Section Specifications
const SECTIONS = [
  {
    chapter: 3,
    section: '3.1',
    title: '定积分的概念存在条件与性质',
    startPage: 189,
    endPage: 201, // Cuts before 习题 3.1
    leadIn: '本节通过几个实例引出定积分的定义、几何意义以及定积分的存在条件，最后介绍定积分的几个常用性质。\n\n'
  },
  {
    chapter: 3,
    section: '3.2',
    title: '微积分基本公式与基本定理',
    startPage: 203,
    endPage: 211, // Cuts before 习题 3.2
    leadIn: '本节将在讲解微积分基本公式（即 Newton-Leibniz 公式）与基本定理的基础上，阐述微分与积分的关系，将定积分的计算问题转化为求被积函数的原函数或不定积分的问题，说明求积分是求微分的逆运算。\n\n'
  },
  {
    chapter: 3,
    section: '3.3',
    title: '两种基本积分法',
    startPage: 214,
    endPage: 230, // Cuts before 习题 3.3
    leadIn: '利用积分的线性性质和基本积分表，只能计算某些简单函数的积分。因此，还需要进一步寻求计算积分的其他方法。本节介绍两种基本积分法，即换元法与分部积分法，它们分别对应于微分法中的复合函数求导法则与函数乘积的求导法则，也是其他各种特殊积分方法的基础，读者应当熟练掌握。\n\n'
  },
  {
    chapter: 3,
    section: '3.4',
    title: '定积分的应用',
    startPage: 233,
    endPage: 242, // Cuts before 习题 3.4
    leadIn: '在科学技术中有很多量都需要用定积分来表达。本节重点阐述建立这些量的积分表达式的常用方法——微元法，通过几何与物理方面的例子说明运用这种方法的具体步骤。\n\n'
  },
  {
    chapter: 3,
    section: '3.5',
    title: '反常积分',
    startPage: 244,
    endPage: 256, // Cuts before 习题 3.5 & Chapter review exercises
    leadIn: '根据定积分的定义，要使函数 $f$ 在区间 $[a,b]$ 上的定积分有意义，至少要满足两个条件：(1) 积分区间 $[a,b]$ 是有限的；(2) $f$ 是 $[a,b]$ 上的有界函数。但在许多理论和实际问题的研究中，往往要求把定积分的概念加以推广，研究无穷区间上或者无界函数的积分问题，这种积分称为反常积分。反常积分有两种，它们都可以通过对定积分再取一次极限来定义。本节讨论两种反常积分的概念及其审敛准则。\n\n'
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
   - 【例题分流】：较短例题可直接保留在标题位（如 <Example title="例 3.1 求定积分 ...">）；长例题或应用题，title 仅写简短主题（如 <Example title="例 3.1 曲边梯形的面积问题">），详细长题干放入卡片正文，严禁整段塞进 title 造成全体加粗；
   - 【严禁卡片嵌套大纲】：原书小节与并列知识点（如“1. 不定积分的换元法则”、“2. 分部积分法”）必须使用 ### 小标题，严禁用 <Knowledge> 包裹大纲，严禁将 <Example> 嵌套在 <Knowledge> 内部！

3. 100% 工业级 KaTeX 纯净度与独立块级：
   - 变量符号统一用 $...$（如 $x, y, \\Delta x, \\mathrm{d}x, \\int_a^b$）；
   - 【带编号公式】：所有带 \\tag{X.Y} 的公式必须作为独立块级公式，且前后必须留有纯空行：
     
     $$
     formula \\tag{X.Y}
     $$
     
     严禁写在行内 $...$ 中，严禁紧贴正文不留空行（否则 KaTeX 将抛出 parse error 报错）。

4. 响应式配图规范：
   - 几何图形、曲线示意图统一使用：
     <figure class="vp-figure">
       ![](./images/fig_3_X.png)
       <figcaption>图 3.X 图题说明</figcaption>
     </figure>
   - 【严禁对纯公式表格插入伪图片】：公式汇总表（如基本导数表、基本积分表）必须使用 KaTeX 数学公式（如 $$ \begin{array}{|c|c|} ... \end{array} $$）排版，严禁为其生成伪图片引用（如 <img src="fig_3_2_1.png" />）！

5. 融媒体微课组件化：
   - 遇到二维码微课，统一转化为 <QRCodeVideo id="3.X.Y" title="..." url="#" />，删去残留文字碎片。

6. 课后习题解耦：
   ${isLastBatch ? '- 在正文末尾如果遇到“习题 3.X”大标题或练习题，必须立即终结正文输出，严禁输出课后习题题目！' : '- 当前是本节中间分块，请完整生成所有推导和例题。'}

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

export function postProcessSectionMdx(content) {
  let text = content;

  // 1. Convert any single $ with \tag to $$ display block
  text = text.replace(/(?<!\$)\$(?!\$)([^$\n\r]*?\\tag\{[^{}]+\}[^$\n\r]*?)\$(?!\$)/g, (match, formula) => {
    return `\n\n$$\n${formula.trim()}\n$$\n\n`;
  });

  // 2. Ensure every single-line $$ formula containing \tag is broken into 3 lines with blank lines
  text = text.replace(/([^\r\n]?)\s*\$\$([^\r\n]*?\\tag\{[^{}]+\}[^\r\n]*?)\$\$/g, (match, prefix, formula) => {
    const pre = prefix ? `${prefix}\n\n` : '\n\n';
    return `${pre}$$\n${formula.trim()}\n$$\n\n`;
  });

  // 3. For multiline $$ containing \tag, ensure blank lines around $$
  text = text.replace(/([^\r\n])\s*\$\$([\s\S]*?\\tag\{[^{}]+\}[\s\S]*?)\$\$/g, (match, prefix, formula) => {
    return `${prefix}\n\n$$\n${formula.trim()}\n$$\n\n`;
  });

  // 4. Ensure blank line after opening JSX cards and before closing JSX cards
  text = text.replace(/(<(?:Knowledge|Solution|Example|SideNote|Block|Analysis)[^>]*>)([^\r\n])/g, '$1\n\n$2');
  text = text.replace(/([^\r\n])(<\/(?:Knowledge|Solution|Example|SideNote|Block|Analysis)>)/g, '$1\n\n$2');

  // 5. Truncate exercises if any leaked
  text = text.replace(/<Knowledge[^>]*title=["'][^"']*习题[\s\S]*$/, '');
  text = text.replace(/##\s*习题[\s\S]*$/, '');
  text = text.replace(/###\s*习题[\s\S]*$/, '');
  text = text.replace(/第\s*3\s*章习题[\s\S]*$/, '');
  text = text.replace(/综合练习题[\s\S]*$/, '');

  // 6. Close unclosed cards if truncation cut off before closing tag
  const tags = ['Knowledge', 'Example', 'Solution', 'SideNote', 'Block', 'Analysis'];
  for (const tag of tags) {
    const openMatches = (text.match(new RegExp(`<${tag}\\b`, 'g')) || []).length;
    const closeMatches = (text.match(new RegExp(`</${tag}>`, 'g')) || []).length;
    if (openMatches > closeMatches) {
      for (let i = 0; i < openMatches - closeMatches; i++) {
        text += `\n</${tag}>\n`;
      }
    }
  }

  // 7. Remove hallucinated table image placeholders if any
  text = text.replace(/<figure[^>]*>\s*<img[^>]*src=["'][^"']*fig_3_2_1\.png["'][^>]*>\s*<figcaption>[^<]*<\/figcaption>\s*<\/figure>/gi, '');

  // 8. Deduplicate excessive newlines
  text = text.replace(/\n{4,}/g, '\n\n\n');

  return text.trim();
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

  // Build batches (3 pages per batch)
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
      const { text, thought, durationMs } = await streamGemmaVision(prompt, b.pages);
      chunkText = cleanBatchText(text);

      fs.writeFileSync(cacheFile, chunkText, 'utf-8');
      fs.writeFileSync(cacheFile.replace('.mdx', '_thought.log'), thought, 'utf-8');
      console.log(`  [Done] 批次完成，生成 ${chunkText.length} 字符，已缓存至 ${path.basename(cacheFile)}`);
    }

    chunkOutputs.push(chunkText);
  }

  // Assemble and Post-Process Section MDX
  const joinedBody = chunkOutputs.join('\n\n');
  const processedBody = postProcessSectionMdx(joinedBody);
  const finalMdx = buildHeader(sec.section, sec.title, sec.leadIn) + processedBody + buildFooter(sec.chapter, sec.section, sec.title);

  const targetFile = path.join(rebuildDir, `${sec.section}_${sec.title}.mdx`);
  fs.writeFileSync(targetFile, finalMdx, 'utf-8');
  console.log(`\n📄 [Assembly] 已保存第 ${sec.section} 节到：${targetFile} (${finalMdx.length} 字符)`);

  // Quality scan gate
  console.log(`🔍 [Scan] 正在校验 ${path.basename(targetFile)}...`);
  try {
    const scanOut = execSync(`node scripts/scan-mdx.mjs "${targetFile}"`, { encoding: 'utf-8' });
    console.log(scanOut.trim());
  } catch (err) {
    console.warn(`⚠️ [Scan Warning] 校验存在报警或轻微异常，后续可由用户监督核对:\n`, (err.stdout || err.message).trim());
  }

  console.log(`✅ 第 ${sec.section} 节《${sec.title}》完成！\n`);
  return targetFile;
}

async function main() {
  console.log(`\n=============================================================`);
  console.log(`🌟 启动第三章（一元函数积分学及其应用）全视觉端到端自动化连续重构`);
  console.log(`🌟 目标章节：3.1 ~ 3.5 全量 5 个小节 (Phys 189 ~ 256)`);
  console.log(`=============================================================\n`);

  // Materialize chapter figures first
  try {
    console.log(`[Materialize] 正在实体化第三章插图资产...`);
    execSync(`.venv\\Scripts\\python scripts/vision_reconstruct/materialize_figures.py --chapter 3`, { stdio: 'inherit' });
  } catch (err) {
    console.warn(`[Materialize Warning]`, err.message);
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
  console.log(`\n🎉🎉🎉 第三章全量 5 小节自动化连续重构全部完成！耗时 ${totalTimeSec}s`);
  console.log(`已完成文件清单：`);
  completedFiles.forEach(f => console.log(`  - ${f}`));

  // Global validation on Chapter 3
  console.log(`\n🔍 正在对第三章执行全量质量门禁复核...`);
  try {
    const globalScan = execSync(`node scripts/scan-mdx.mjs "src/content/docs/collections/math/engineering_analysis_rebuild"`, { encoding: 'utf-8' });
    console.log(globalScan);
  } catch (err) {
    console.log(err.stdout || err.message);
  }
}

main().catch(err => {
  console.error('Fatal error in Chapter 3 reconstruction:', err);
  process.exit(1);
});
