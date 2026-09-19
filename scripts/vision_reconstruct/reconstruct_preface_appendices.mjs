import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { streamGeminiVision } from './gemini_vision_client.mjs';

const ROOT_DIR = process.cwd();
const probePagesDir = path.join(ROOT_DIR, 'test/data/probe_pages');
const outputDir = path.join(ROOT_DIR, 'test/output');
const rebuildDir = path.join(ROOT_DIR, 'src/content/docs/collections/math/engineering_analysis_rebuild');

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
if (!fs.existsSync(rebuildDir)) fs.mkdirSync(rebuildDir, { recursive: true });

export const TASKS = [
  {
    id: '00_preface',
    targetFile: '00_前言.mdx',
    title: '工科数学分析基础（第三版）前言',
    displayTitle: '前言',
    batches: [
      {
        pages: [5, 6, 7].map(p => path.join(probePagesDir, `shangce_phys_${p}.jpg`)),
        instruction: '请将原书《第三版前言》（上册物理第 5~7 页）高保真整理为符合 AstroLib 规范的学术 MDX。包含教材修订背景、难度与内容调整、编写思想、双色边注栏目（想一想/注意/注）与二维码融媒体说明、致谢与编者落款（2017年4月于西安交通大学）。使用标准 Markdown 层次与优雅学术排版。'
      }
    ]
  },
  {
    id: '01_intro',
    targetFile: '01_绪论.mdx',
    title: '绪论',
    displayTitle: '绪论',
    batches: [
      {
        pages: [18, 19, 20].map(p => path.join(probePagesDir, `shangce_phys_${p}.jpg`)),
        instruction: `请将《绪论》（上册物理第 18~20 页）高保真重构为符合 AstroLib 规范的学术 MDX。
必须严格遵守：
1. 数学发展的三个阶段（常量数学、变量数学、现代数学）使用清晰的二级或三级标题展开；
2. 【例 1】（求变速直线运动瞬时速度）题设使用 <Example title="例 1 变速直线运动的瞬时速度">，推导与极限分析使用 <Solution title="分析与求解">；
3. 【例 2】（求变速直线运动位移）题设使用 <Example title="例 2 变速直线运动的位移">，四步法“第一步 分”、“第二步 匀”、“第三步 合”、“第四步 精”以及公式 (0.3)、(0.4) 必须完整包裹在 <Solution title="分析与求解"> 中；
4. 边栏批注抽离为 <SideNote title="...">；
5. 微积分基本思想方法总结（“以匀代非匀”、极限转化与辩证法、大学数学分析的学习方法）作为正文段落。
严禁正文开头出现 # 一级标题。`
      }
    ]
  },
  {
    id: 'a1_appendix1_2',
    targetFile: 'a1_附录1-2_参数表示极坐标与常见曲线.mdx',
    title: '附录1-2_参数表示极坐标与常见曲线',
    displayTitle: '附录 1-2 参数表示、极坐标与常见曲线',
    batches: [
      {
        pages: [340, 341, 342, 343].map(p => path.join(probePagesDir, `shangce_phys_${p}.jpg`)),
        instruction: `请将【附录 1 函数的参数表示与极坐标表示】（上册物理第 340~343 页）高保真重构为符合 AstroLib 规范的学术 MDX。
内容包含：
一、函数的参数表示（概念、例 1.1 摆线/旋轮线方程建立、例 1.2 椭圆参数方程、例 1.3 圆的渐开线方程）；
二、极坐标系与函数的极坐标表示（极坐标概念、极坐标与直角坐标转换、极坐标方程）。
例题与解答严格使用 <Example> 和 <Solution>。图文配图使用 <figure class="vp-figure">，图片路径统一使用 ./images/ 目录中的图片。`
      },
      {
        pages: [344, 345, 346, 347, 348, 349, 350].map(p => path.join(probePagesDir, `shangce_phys_${p}.jpg`)),
        instruction: `请将【附录 2 常见曲线及其方程】（上册物理第 344~350 页）高保真重构为符合 AstroLib 规范的学术 MDX。
内容包含：
常见平面曲线的直角坐标方程、参数方程、极坐标方程及其图形：
1. 幂函数与多项式曲线；
2. 摆线、次摆线（外摆线、内摆线、星形线）；
3. 螺线（阿基米德螺线、对数螺线、双曲螺线）；
4. 玫瑰线（三叶玫瑰线、四叶玫瑰线）；
5. 卵形线、心形线、双纽线、卡西尼卵形线；
6. 悬链线、曳物线、概率曲线、箕舌线。
所有公式统一采用规范 KaTeX 排版，配图使用 <figure class="vp-figure">，杜绝任何语法报错。`
      }
    ]
  },
  {
    id: 'a2_appendix3_4',
    targetFile: 'a2_附录3-4_三角函数公式与反三角函数.mdx',
    title: '附录3-4_三角函数公式与反三角函数',
    displayTitle: '附录 3-4 三角函数公式与反三角函数',
    batches: [
      {
        pages: [351, 352, 353, 354].map(p => path.join(probePagesDir, `shangce_phys_${p}.jpg`)),
        instruction: `请将【附录 3 常用的三角函数公式】与【附录 4 反三角函数定义及其图形】（上册物理第 351~354 页，共 4 页）高保真重构为符合 AstroLib 规范的学术 MDX。
内容包含：
一、附录 3 常用的三角函数公式：
1. 和差与积的关系式（和差化积、积化和差共 8 式）；
2. 倍角公式与半角公式；
3. 万能置换公式；
4. 诱导公式与基本三角恒等式。
二、附录 4 反三角函数定义及其图形：
1. 反正弦函数 arcsin x、反余弦函数 arccos x、反正切函数 arctan x、反余切函数 arccot x 的严格定义、主值区间、图像与奇偶单调性质；
2. 常用反三角函数公式与恒等变换关系。
公式排版精美对齐，配图包裹在 <figure class="vp-figure"> 中。`
      }
    ]
  },
  {
    id: 'a3_appendix5_6',
    targetFile: 'a3_附录5-6_复数与积分表.mdx',
    title: '附录5-6_复数与积分表',
    displayTitle: '附录 5-6 复数与简明积分表',
    batches: [
      {
        pages: [355, 356, 357].map(p => path.join(probePagesDir, `shangce_phys_${p}.jpg`)),
        instruction: `请将【附录 5 复数及其运算】（上册物理第 355~357 页）高保真重构为符合 AstroLib 规范的学术 MDX。
内容包含：
一、复数的概念（虚数单位 i、实部 Re、虚部 Im、纯虚数、共轭复数、复平面与高斯平面）；
二、复数的表示法（代数形式、三角形式、指数形式与 Euler 公式 e^{i theta} = cos theta + i sin theta）；
三、复数的运算（加减法、乘除法、De Moivre 棣莫弗定理、复数开方根 De Moivre 公式与几何意义）。
核心定理使用 <Knowledge title="...">，例题使用 <Example> 和 <Solution>。`
      },
      {
        pages: [358, 359, 360, 361, 362, 363].map(p => path.join(probePagesDir, `shangce_phys_${p}.jpg`)),
        instruction: `请将【附录 6 简明积分表】（上册物理第 358~363 页）高保真重构为符合 AstroLib 规范的学术 MDX。
完整结构化收录原书简明积分表各分类分类公式：
一、含有 a+bx 的积分（公式 1~12）；
二、含有 a^2 \\pm x^2 或 x^2 - a^2 的积分；
三、含有 \\sqrt{a+bx} 的积分；
四、含有 \\sqrt{x^2 \\pm a^2} 与 \\sqrt{a^2 - x^2} 的积分；
五、含有 \\sqrt{ax^2+bx+c} 的积分；
六、含有三角函数的积分；
七、含有反三角函数的积分；
八、含有指数函数与对数函数的积分。
所有积分公式采用清晰的 Markdown 列表或独立数学块级公式编号呈现（如 1. \\int ... = ... + C），注意保持 KaTeX 语法 100% 正确无误。`
      }
    ]
  },
  {
    id: 'a4_appendix_volume2',
    targetFile: 'a4_下册附录_部分曲面和空间立体的图形.mdx',
    title: '下册附录_部分曲面和空间立体的图形',
    displayTitle: '下册附录 部分曲面和空间立体的图形',
    batches: [
      {
        pages: [338, 339, 340, 341, 342, 343].map(p => path.join(probePagesDir, `xiace_phys_${p}.jpg`)),
        instruction: `请将【下册附录 部分曲面和空间立体的图形】（下册物理第 338~343 页，共 6 页）高保真重构为符合 AstroLib 规范的学术 MDX。
内容包含原书为增强空间想象力、便于计算多元重积分所列出的 17 组典型曲面与空间立体图形：
1. z = xy 的三维曲面图形（含两种视角对比与马鞍点特性）；
2. 双曲抛物面 z = x^2 - y^2；
3. 旋转抛物面与椭圆抛物面；
4. z = ln(x^2+y^2-1) 与 z = e^{-y} cos x；
5. z = \\frac{xy(x^2-y^2)}{x^2+y^2} 与 z = \\cos(x-y)；
6. f(x,y) = \\frac{\\sin(x^2+y^2)}{x^2+y^2} 帽状曲面；
7~17. 空间立体及其在坐标面上的投影柱面、球面与圆柱面相交体（第一卦限立体、Vivian 窗口相贯立体等不同半径比例 R 与 a 的情况）。
每组图形配有清晰的数学方程、几何特征描述与 <figure class="vp-figure"> 配图。`
      }
    ]
  }
];

function buildHeader(title, displayTitle) {
  return `---
title: '${displayTitle}'
---
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

export function postProcessMdx(content) {
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

  text = text.replace(/^#[^#\r\n]+\r?\n+/gm, '');

  text = text.replace(/!\[(.*?)\]\(images\//g, '![$1](./images/');

  text = balanceJsxCards(text);

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

export async function processTask(task) {
  console.log(`\n======================================================`);
  console.log(`🚀 [Task Start] 正在推进：${task.displayTitle} (${task.targetFile})`);
  console.log(`📦 总批次数：${task.batches.length} 次`);
  console.log(`======================================================`);

  const chunkOutputs = [];

  for (let i = 0; i < task.batches.length; i++) {
    const b = task.batches[i];
    const cacheFile = path.join(outputDir, `${task.id}_batch_${i + 1}.mdx`);

    console.log(`\n------------------------------------------------------`);
    console.log(`📦 [批次 ${i + 1}/${task.batches.length}] 输入原图 ${b.pages.length} 张...`);

    let chunkText = '';
    if (fs.existsSync(cacheFile) && fs.statSync(cacheFile).size > 200) {
      console.log(`  [Cache] 命中已有磁盘缓存: ${path.basename(cacheFile)} (${fs.statSync(cacheFile).size} 字节)`);
      chunkText = fs.readFileSync(cacheFile, 'utf-8');
    } else {
      for (const p of b.pages) {
        if (!fs.existsSync(p)) throw new Error(`原图文件不存在: ${p}`);
      }

      const prompt = `【核心指令】：思考过程请保持极简（不超过 80 字大纲），把全部输出配额用于生成完整的 MDX 正文！

你是一名顶级大学数学教材出版总监与 AstroLib MDX 结构化专家。
你正在对《工科数学分析基础》【${task.displayTitle}】进行全视觉高保真推倒重建与数据清洗。
传入的图片是原书对应章节的 150 DPI 高清扫描原版物理页面。

【具体任务要求】：
${b.instruction}

必须严格遵守以下六大铁律契约：
1. 边栏批注彻底抽离为 <SideNote>：
   - 原书版面中印刷在右侧边栏的“想一想”、“注”、“注意”、“思路分析”、“几何解释”等批注，必须从主栏推导中完全抽离；
   - 封装为 <SideNote title="...">内容</SideNote>，放置在对应段落开头或卡片内部；
   - 主栏句子必须保持绝对完整连贯，严禁被边栏批注掐断。
2. 语义卡片闭合与层级规范：
   - 核心概念/定理使用 <Knowledge title="...">...</Knowledge>，证明推导使用 <Solution title="证明">...</Solution>；
   - 例题题面使用 <Example title="...">...</Example>，解答过程使用 <Solution title="解">...</Solution>；
   - 杜绝卡片早泄与裸奔，正文开头严禁输出 # 一级标题。
3. 100% 工业级 KaTeX 纯净度：
   - 变量符号统一包裹 $...$，公式编号统一写在独立 $$ 块内且使用 \\tag{...}，严禁在 cases 内部嵌套 \\tag{}。
4. 响应式配图规范：
   - 图形统一使用 <figure class="vp-figure"><img src="./images/..." alt="..." /><figcaption>...</figcaption></figure> 或 Markdown 语法。
5. 严禁输出课后习题大题，遇到课后习题时立即终结输出。
6. 直接输出 MDX 正文，严禁在最外层包裹 \`\`\`mdx ... \`\`\` 代码块，严禁客套话。`;

      let success = false;
      let loopAttempt = 1;
      while (!success) {
        try {
          const { text, thought, durationMs } = await streamGeminiVision(prompt, b.pages);
          chunkText = cleanBatchText(text);

          fs.writeFileSync(cacheFile, chunkText, 'utf-8');
          fs.writeFileSync(cacheFile.replace('.mdx', '_thought.log'), thought, 'utf-8');
          console.log(`  [Done] 批次完成! 生成 ${chunkText.length} 字符，已缓存至 ${path.basename(cacheFile)}`);
          success = true;
        } catch (err) {
          console.warn(`\n⚠️ [Retry #${loopAttempt}] 批次遇到异常 (${err.message})，等待 10 秒后自动重试...`);
          loopAttempt++;
          await new Promise(r => setTimeout(r, 10000));
        }
      }
    }

    chunkOutputs.push(chunkText);
  }

  const joinedBody = chunkOutputs.join('\n\n');
  const processedBody = postProcessMdx(joinedBody);
  const finalMdx = buildHeader(task.title, task.displayTitle) + processedBody + '\n';

  const targetPath = path.join(rebuildDir, task.targetFile);
  fs.writeFileSync(targetPath, finalMdx, 'utf-8');
  console.log(`\n📄 [Assembly] 成功落盘到目标路径: ${targetPath} (${finalMdx.length} 字符)`);

  return targetPath;
}

export function updateReadmeGuide() {
  const guidePath = path.join(rebuildDir, '00_内容说明.mdx');
  if (!fs.existsSync(guidePath)) return;

  const content = `---
title: '工科数学分析基础（视觉重建试验版）导读'
---
import Guide from '@/components/Guide.astro';
import Knowledge from '@/components/Knowledge.astro';
import SideNote from '@/components/SideNote.astro';

<Guide title="本书定位与全新重建说明">
本书为 AstroLib 全新多模态视觉数据流水线（Google Gemini 3.5 Flash Lite Multimodal Vision）的推倒重建试验专栏。

**核心变革准则**：
1. **彻底摒弃低质 OCR 修补**：不以旧版 MinerU 降维残缺文本为基础，直接以原版纸质教材 150 DPI 高清扫描原版物理页为唯一真理源；
2. **2D 原生视觉空间拓扑**：利用 Gemini 3.5 Flash Lite 原生多模态图像感知能力，彻底解耦主栏推导与宽边栏批注，全面落地 \`<SideNote>\` 桌面浮动并排、移动端自适应紧凑排版；
3. **AST 容器状态机闭合**：彻底杜绝 \`<Knowledge>\` 与 \`<Example>\` 容器早泄及孤儿证明裸奔；
4. **纯正 KaTeX 数学排版**：消除裸 ASCII 变量与 OCR 字符坏味道（如单侧极限正确还原为 $x \\to x_0^+$，根除多余嵌套 tag 解析错误）；
5. **全书结构完整闭环**：涵盖前言、绪论、第一至七章全量正文及全部后方附录。
</Guide>

## 全书视觉重建章节与附录目录

### 前方导言与绪论
- [前言](/collections/math/engineering_analysis_rebuild/00_前言/)
- [绪论](/collections/math/engineering_analysis_rebuild/01_绪论/)

### 第一章 极限理论与连续函数
- [1.1 集合 映射与函数](/collections/math/engineering_analysis_rebuild/11_集合映射与函数/)
- [1.2 数列的极限](/collections/math/engineering_analysis_rebuild/12_数列的极限/)
- [1.3 函数的极限](/collections/math/engineering_analysis_rebuild/13_函数的极限/)
- [1.4 无穷小量与无穷大量](/collections/math/engineering_analysis_rebuild/14_无穷小量与无穷大量/)
- [1.5 连续函数](/collections/math/engineering_analysis_rebuild/15_连续函数/)

### 第二章 一元函数微分学及其应用
- [2.1 导数的概念](/collections/math/engineering_analysis_rebuild/21_导数的概念/)
- [2.2 求导的基本法则](/collections/math/engineering_analysis_rebuild/22_求导的基本法则/)
- [2.3 微分](/collections/math/engineering_analysis_rebuild/23_微分/)
- [2.4 微分中值定理及其应用](/collections/math/engineering_analysis_rebuild/24_微分中值定理及其应用/)
- [2.5 Taylor定理及其应用](/collections/math/engineering_analysis_rebuild/25_taylor定理及其应用/)
- [2.6 函数性态的研究](/collections/math/engineering_analysis_rebuild/26_函数性态的研究/)

### 第三章 一元函数积分学及其应用
- [3.1 定积分的概念存在条件与性质](/collections/math/engineering_analysis_rebuild/31_定积分的概念存在条件与性质/)
- [3.2 微积分基本公式与基本定理](/collections/math/engineering_analysis_rebuild/32_微积分基本公式与基本定理/)
- [3.3 两种基本积分法](/collections/math/engineering_analysis_rebuild/33_两种基本积分法/)
- [3.4 定积分的应用](/collections/math/engineering_analysis_rebuild/34_定积分的应用/)
- [3.5 反常积分](/collections/math/engineering_analysis_rebuild/35_反常积分/)

### 第四章 常微分方程
- [4.1 几类简单的微分方程](/collections/math/engineering_analysis_rebuild/41_几类简单的微分方程/)
- [4.2 高阶线性微分方程](/collections/math/engineering_analysis_rebuild/42_高阶线性微分方程/)
- [4.3 线性微分方程组](/collections/math/engineering_analysis_rebuild/43_线性微分方程组/)

### 第五章 多元函数微分学
- [5.1 n维Euclid空间Rn中点集的初步知识](/collections/math/engineering_analysis_rebuild/51_n维euclid空间rn中点集的初步知识/)
- [5.2 多元函数的极限与连续性](/collections/math/engineering_analysis_rebuild/52_多元函数的极限与连续性/)
- [5.3 多元数量值函数的导数与微分](/collections/math/engineering_analysis_rebuild/53_多元数量值函数的导数与微分/)
- [5.4 多元函数的Taylor公式与极值问题](/collections/math/engineering_analysis_rebuild/54_多元函数的taylor公式与极值问题/)
- [5.5 多元向量值函数的导数与微分](/collections/math/engineering_analysis_rebuild/55_多元向量值函数的导数与微分/)
- [5.6 多元函数微分学在几何上的简单应用](/collections/math/engineering_analysis_rebuild/56_多元函数微分学在几何上的简单应用/)
- [5.7 空间曲线的曲率与挠率](/collections/math/engineering_analysis_rebuild/57_空间曲线的曲率与挠率/)

### 第六章 多元函数积分学
- [6.1 多元数量值函数积分的概念与性质](/collections/math/engineering_analysis_rebuild/61_多元数量值函数积分的概念与性质/)
- [6.2 二重积分的计算](/collections/math/engineering_analysis_rebuild/62_二重积分的计算/)
- [6.3 三重积分的计算](/collections/math/engineering_analysis_rebuild/63_三重积分的计算/)
- [6.4 含参变量的积分与反常重积分](/collections/math/engineering_analysis_rebuild/64_含参变量的积分与反常重积分/)
- [6.5 重积分的应用](/collections/math/engineering_analysis_rebuild/65_重积分的应用/)
- [6.6 第一型线积分与面积分](/collections/math/engineering_analysis_rebuild/66_第一型线积分与面积分/)
- [6.7 第二型线积分与面积分](/collections/math/engineering_analysis_rebuild/67_第二型线积分与面积分/)
- [6.8 各种积分的联系及其在场论中的应用](/collections/math/engineering_analysis_rebuild/68_各种积分的联系及其在场论中的应用/)

### 第七章 无穷级数
- [7.1 常数项级数](/collections/math/engineering_analysis_rebuild/71_常数项级数/)
- [7.2 函数项级数](/collections/math/engineering_analysis_rebuild/72_函数项级数/)
- [7.3 幂级数](/collections/math/engineering_analysis_rebuild/73_幂级数/)
- [7.4 Fourier级数](/collections/math/engineering_analysis_rebuild/74_fourier级数/)

### 全书附录与参考资料
- [附录 1-2 参数表示、极坐标与常见曲线](/collections/math/engineering_analysis_rebuild/a1_附录1-2_参数表示极坐标与常见曲线/)
- [附录 3-4 三角函数公式与反三角函数](/collections/math/engineering_analysis_rebuild/a2_附录3-4_三角函数公式与反三角函数/)
- [附录 5-6 复数与简明积分表](/collections/math/engineering_analysis_rebuild/a3_附录5-6_复数与积分表/)
- [下册附录 部分曲面和空间立体的图形](/collections/math/engineering_analysis_rebuild/a4_下册附录_部分曲面和空间立体的图形/)
`;

  fs.writeFileSync(guidePath, content, 'utf-8');
  console.log(`\n📚 [Guide Updated] 已成功更新 00_内容说明.mdx 全书阅读索引！`);
}

async function main() {
  const args = process.argv.slice(2);
  let targetId = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--task' && args[i + 1]) targetId = args[i + 1];
  }

  let queue = TASKS;
  if (targetId) {
    queue = TASKS.filter(t => t.id === targetId);
    if (queue.length === 0) {
      console.error(`未找到指定的 task: ${targetId}`);
      process.exit(1);
    }
  }

  console.log(`\n=============================================================`);
  console.log(`🌟 启动《工科数学分析》前言、绪论与全量附录 Gemini 3.5 Flash Lite 视觉推倒重建`);
  console.log(`🌟 待执行任务数：${queue.length} 个`);
  console.log(`=============================================================\n`);

  const startTime = Date.now();
  const completed = [];

  for (let i = 0; i < queue.length; i++) {
    const task = queue[i];
    console.log(`\n>>>>>>>>>>> [${i + 1}/${queue.length}] 正在推进 ${task.displayTitle} <<<<<<<<<<<`);
    const file = await processTask(task);
    completed.push(file);
  }

  updateReadmeGuide();

  const totalMin = ((Date.now() - startTime) / 60000).toFixed(1);
  console.log(`\n🎉🎉🎉 全部任务推倒重建与清洗完成！总耗时 ${totalMin} 分钟。`);
  completed.forEach(f => console.log(`  - ${f}`));
}

if (process.argv[1]?.includes('reconstruct_preface_appendices.mjs')) {
  main().catch(err => {
    console.error('Fatal error during preface & appendices reconstruction:', err);
    process.exit(1);
  });
}
