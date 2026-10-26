import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { streamGemmaVision } from './gemma_vision_client.mjs';

const ROOT_DIR = process.cwd();

export function cleanGemmaOutput(rawText) {
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
  cleaned = cleaned.replace(/<ExerciseTrigger[\s\S]*$/, '');

  cleaned = cleaned.replace(/^\$([^\$\n]+?\\tag\{[^\}\n]+\}[^\$\n]*?)\$$/gm, '$$\n$1\n$$');

  cleaned = cleaned.replace(/([^\r\n])\r?\n(\$\$[\s\S]*?\\tag\{[^\}\n]+\}[\s\S]*?\$\$)/g, '$1\n\n$2');
  cleaned = cleaned.replace(/(\$\$[\s\S]*?\\tag\{[^\}\n]+\}[\s\S]*?\$\$)\r?\n([^\r\n])/g, '$1\n\n$2');

  return cleaned.trim();
}

export function buildMdxHeader(section, title) {
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

`;
}

export function buildMdxFooter(chapter, section, title) {
  return `\n\n<ExerciseTrigger chapter={${chapter}} section="${section}" title="${section} ${title} 课后真题与自测练习" />\n`;
}

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
   - 【例题分流】：较短例题可直接保留在标题位（如 <Example title="例 X.Y 求 ... 的导数">）；长例题或应用题，title 仅写简短主题（如 <Example title="例 X.Y 摆线的参数方程求导">），详细长题干放入卡片正文，严禁整段塞进 title 造成全体加粗；
   - 【严禁卡片嵌套大纲】：原书小节与并列知识点（如“1. 近似计算函数值”、“2. 求极限”）必须使用 ### 小标题，严禁用 <Knowledge> 包裹大纲，严禁将 <Example> 嵌套在 <Knowledge> 内部！

3. 100% 工业级 KaTeX 纯净度与独立块级：
   - 变量符号统一用 $...$（如 $x, y, \\Delta x$），规范微商 \\frac{\\mathrm{d}y}{\\mathrm{d}x}、极限 \\lim_{x \\to x_0}；
   - 【带编号公式】：所有带 \\tag{X.Y} 的公式必须作为独立块级公式，且前后必须留有空行：

     $$
     formula \\tag{X.Y}
     $$

     严禁写在行内 $...$ 中，严禁紧贴正文不留空行（否则 KaTeX 将抛出 parse error 报错）。

4. 响应式配图规范：
   - 图片统一使用：
     <figure class="vp-figure">
       ![](./images/fig_X_Y.png)
       <figcaption>图 X.Y 图题说明</figcaption>
     </figure>

5. 融媒体微课组件化：
   - 遇到二维码微课，统一转化为 <QRCodeVideo id="X.Y.Z" title="..." url="#" />，删去残留文字碎片。

6. 课后习题解耦：
   ${isLastBatch ? '- 在正文末尾如果遇到“习题 X.Y”大标题或练习题，必须立即终结正文输出，严禁输出课后习题题目！' : '- 当前是本节中间分块，请完整生成所有推导和例题。'}

输出要求：
- 直接输出 MDX 正文内容；
- 严禁在最外层包裹 \`\`\`mdx ... \`\`\` 代码块；
- 严禁输出前言、客套话或废话。
`;
}

export async function reconstructSection(options) {
  const {
    chapter,
    section,
    title,
    startPage,
    endPage,
    vol = 1,
    batchSize = 3,
    force = false,
  } = options;

  console.log(`\n======================================================`);
  console.log(`🚀 开始重构：第 ${section} 节《${title}》`);
  console.log(`📖 物理页范围：Phys ${startPage} ~ ${endPage} (共 ${endPage - startPage + 1} 页)`);
  console.log(`======================================================\n`);

  const pdfName = vol === 1 ? '工科数学分析基础 上册.pdf' : '工科数学分析基础 下册.pdf';
  const pdfPath = path.join(ROOT_DIR, 'test/data', pdfName);
  const chPagesDir = path.join(ROOT_DIR, 'test/data', `ch${chapter}_pages`);
  const outputDir = path.join(ROOT_DIR, 'test/output');

  if (!fs.existsSync(chPagesDir)) {
    fs.mkdirSync(chPagesDir, { recursive: true });
  }
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const missingPages = [];
  for (let p = startPage; p <= endPage; p++) {
    const pageImg = path.join(chPagesDir, `phys_${p}.jpg`);
    if (!fs.existsSync(pageImg)) {
      missingPages.push(p);
    }
  }

  if (missingPages.length > 0) {
    console.log(`[Slice] 发现缺失 ${missingPages.length} 页切图，正在调用 slice_pdf_pages.py...`);
    const sliceCmd = `.venv\\Scripts\\python scripts/vision_reconstruct/slice_pdf_pages.py --pdf "${pdfPath}" --start ${Math.min(...missingPages)} --end ${Math.max(...missingPages)} --out "${chPagesDir}" --dpi 150`;
    execSync(sliceCmd, { stdio: 'inherit' });
  } else {
    console.log(`[Slice] 所有物理页已完成切图 (Phys ${startPage} ~ ${endPage})。`);
  }

  try {
    const matCmd = `.venv\\Scripts\\python scripts/vision_reconstruct/materialize_figures.py --chapter ${chapter}`;
    execSync(matCmd, { stdio: 'inherit' });
  } catch (e) {
    console.warn('[Materialize Warning]', e.message);
  }

  const batches = [];
  for (let p = startPage; p <= endPage; p += batchSize) {
    const bEnd = Math.min(p + batchSize - 1, endPage);
    const pages = [];
    for (let i = p; i <= bEnd; i++) {
      pages.push(path.join(chPagesDir, `phys_${i}.jpg`));
    }
    batches.push({
      start: p,
      end: bEnd,
      pages,
    });
  }

  console.log(`[Batches] 共规划 ${batches.length} 个批次处理：`);
  batches.forEach((b, idx) => {
    console.log(`  批次 ${idx + 1}: Phys ${b.start} ~ ${b.end} (${b.pages.length} 张图片)`);
  });

  const chunkOutputs = [];
  for (let idx = 0; idx < batches.length; idx++) {
    const b = batches[idx];
    const isFirst = idx === 0;
    const isLast = idx === batches.length - 1;
    const cacheFile = path.join(outputDir, `${section}_batch_${b.start}_${b.end}.mdx`);

    console.log(`\n------------------------------------------------------`);
    console.log(`📦 [批次 ${idx + 1}/${batches.length}] 正在处理 Phys ${b.start} ~ ${b.end}...`);

    let chunkText = '';
    if (!force && fs.existsSync(cacheFile) && fs.statSync(cacheFile).size > 100) {
      console.log(`  [Cache] 命中已有缓存文件: ${path.basename(cacheFile)}`);
      chunkText = fs.readFileSync(cacheFile, 'utf-8');
    } else {
      const prompt = buildPrompt(section, title, isFirst, isLast);
      const { text, thought, durationMs } = await streamGemmaVision(prompt, b.pages);
      chunkText = cleanGemmaOutput(text);

      fs.writeFileSync(cacheFile, chunkText, 'utf-8');
      fs.writeFileSync(cacheFile.replace('.mdx', '_thought.log'), thought, 'utf-8');
      console.log(`  [Done] 批次完成，生成 ${chunkText.length} 字符，已缓存至 ${path.basename(cacheFile)}`);
    }

    chunkOutputs.push(chunkText);
  }

  const finalMdxContent =
    buildMdxHeader(section, title) +
    chunkOutputs.join('\n\n') +
    buildMdxFooter(chapter, section, title);

  const rebuildDir = path.join(ROOT_DIR, 'src/content/docs/collections/math/engineering_analysis_rebuild');
  const targetFilePath = path.join(rebuildDir, `${section}_${title}.mdx`);

  fs.writeFileSync(targetFilePath, finalMdxContent, 'utf-8');
  console.log(`\n📄 [Assembly] 成功组装并写入目标文件：${targetFilePath} (${finalMdxContent.length} 字符)`);

  console.log(`\n🔍 [Quality Gate] 正在执行 MDX 语法与 KaTeX 强校验...`);
  try {
    const scanOutput = execSync(`node scripts/scan-mdx.mjs "${targetFilePath}"`, { encoding: 'utf-8' });
    console.log(scanOutput);
  } catch (err) {
    console.error(`❌ [Quality Gate] 校验未通过：\n`, err.stdout || err.message);
    throw err;
  }

  console.log(`🎉 恭喜！第 ${section} 节《${title}》全视觉推倒重建完成并通过全部质量门禁！\n`);
  return targetFilePath;
}

if (process.argv[1]?.endsWith('reconstruct_section.mjs')) {
  const args = process.argv.slice(2);
  const getArg = (flag, def) => {
    const idx = args.indexOf(flag);
    return idx !== -1 && args[idx + 1] ? args[idx + 1] : def;
  };

  const chapter = parseInt(getArg('--chapter', '2'), 10);
  const section = getArg('--section', '2.2');
  const title = getArg('--title', '求导的基本法则');
  const startPage = parseInt(getArg('--start', '121'), 10);
  const endPage = parseInt(getArg('--end', '137'), 10);
  const vol = parseInt(getArg('--vol', '1'), 10);
  const batchSize = parseInt(getArg('--batch-size', '3'), 10);
  const force = args.includes('--force');

  reconstructSection({
    chapter,
    section,
    title,
    startPage,
    endPage,
    vol,
    batchSize,
    force,
  }).catch((err) => {
    console.error('Reconstruction failed:', err);
    process.exit(1);
  });
}
