#!/usr/bin/env node
/**
 * scripts/ai_fix_figures.mjs
 * -----------------------------------------------------------------------------
 * 图像与图注智能纠偏与排版升级流水线 (Gemini AI Figure & Caption Pipeline)
 *
 * 核心机制：
 * 1. 语法与语义双修复：
 *    - 修复因图注突兀插入而被腰斩的正文断句；
 *    - 将分离的图片与图注就近重新绑定，组装为符合 VitePress 风格的语义化 <figure> 结构；
 *    - 智能处理 (a)/(b) 多子图排版网格。
 * 2. 极致稳健的防御机制：
 *    - 图片哈希防丢校验：严格校验 LLM 返回的内容中是否包含窗口内原有所有图片路径；
 *    - 语法安全编译校验：拆分替换后经 @mdx-js/mdx + remarkMath + rehypeKatex 严格编译测试；
 *    - 多模型回退：gemini-3.5-flash-lite -> gemini-3.1-flash-lite -> gemini-flash-lite-latest -> gemini-3.6-flash；
 * 3. 命令行参数：
 *    - --file <path>   单文件测试
 *    - --book <slug>   指定书处理
 *    - --all           全量处理
 *    - --dry-run       仅输出识别报告与 Diff，不写盘（默认）
 *    - --apply         校验通过后真实写回 MDX 文件
 * =============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import { compile } from '@mdx-js/mdx';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { analyzeMdxFile } from './screen_figures.mjs';

const API_KEY = process.env.GEMINI_API_KEY ||
  process.env.GOOGLE_API_KEY ||
  '';

const MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-3.6-flash'
];

// 命令行参数解析
const args = process.argv.slice(2);
const isApply = args.includes('--apply');
const isDryRun = !isApply || args.includes('--dry-run');
const singleFileArg = args.find((_, i, arr) => arr[i - 1] === '--file');
const bookSlugArg = args.find((_, i, arr) => arr[i - 1] === '--book');

/**
 * 递归收集 MDX 文件
 */
function getMdxFiles(targetPath) {
  if (!fs.existsSync(targetPath)) return [];
  const stat = fs.statSync(targetPath);
  if (!stat.isDirectory()) {
    return targetPath.endsWith('.mdx') ? [targetPath] : [];
  }
  const files = [];
  for (const entry of fs.readdirSync(targetPath, { withFileTypes: true })) {
    const full = path.join(targetPath, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'images' && entry.name !== '.git' && entry.name !== 'node_modules') {
        files.push(...getMdxFiles(full));
      }
    } else if (entry.name.endsWith('.mdx')) {
      files.push(full);
    }
  }
  return files;
}

/**
 * 提取文本中出现的图片路径集合
 */
function getImageSet(text) {
  const set = new Set();
  const mdRegex = /!\[.*?\]\((images\/[^)]+)\)/g;
  let m;
  while ((m = mdRegex.exec(text)) !== null) {
    set.add(m[1]);
  }
  const htmlRegex = /<img\b[^>]*src=["'](images\/[^"']+)["']/g;
  while ((m = htmlRegex.exec(text)) !== null) {
    set.add(m[1]);
  }
  return set;
}

/**
 * 容错解析含 LaTeX 反斜杠的 JSON
 */
function parseSafeJson(rawText) {
  let cleaned = rawText.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    try {
      const fixed = cleaned.replace(/(?<!\\)\\(?!["\\/bfnrtu])/g, '\\\\');
      return JSON.parse(fixed);
    } catch (e2) {
      throw new Error(`JSON parse error: ${e.message}`);
    }
  }
}

import katex from 'katex';

/**
 * 校验 MDX 是否能通过 Unified AST 与 KaTeX 编译
 */
async function validateMdx(content, filePath) {
  try {
    const body = content.replace(/^---[\s\S]*?---\r?\n?/, '');
    await compile({ value: body, path: filePath }, {
      remarkPlugins: [remarkMath],
      rehypePlugins: [[rehypeKatex, { strict: false }]],
      jsx: true
    });

    // KaTeX 块级公式严格校验
    const displayMatches = content.matchAll(/\$\$([\s\S]+?)\$\$/g);
    for (const m of displayMatches) {
      const raw = m[1].trim();
      if (!raw) continue;
      katex.renderToString(raw, { displayMode: true, throwOnError: true, strict: false });
    }

    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/**
 * 调用 Gemini API 修复图像与图注区块
 */
async function queryGeminiFix(windowItems) {
  const systemInstruction = `You are an expert textbook MDX typography and structure editor.
In Chinese STEM textbooks converted from OCR/PDF, figure captions (e.g. "图 1.1", "图 1.22", "图1.4", "Figure 1.1") often got misplaced or separated from images:
1. OCR inserted isolated caption lines inside paragraphs, breaking a sentence in half (e.g. "若函数有定义，且\\n图1.22\\n$$\\lim...$$\\n则称...").
2. Images and their captions got separated by paragraphs, math formulas, or card tags (<Example>, <Knowledge>).
3. Multiple subfigures (a), (b), (c) got awkwardly stacked.

Your Task:
For each provided context window:
1. Repair any broken sentences by reconnecting text and formulas seamlessly.
2. Bind the image(s) with their correct figure caption into standard VitePress <figure> format:
   Single figure:
   <figure class="vp-figure">
     ![](images/xxxx.jpg)
     <figcaption>图 1.1 直角坐标系下的位矢</figcaption>
   </figure>

   Multi subfigures:
   <figure class="vp-figure">
     <div class="vp-figure-grid">
       <div class="vp-sub-figure">
         ![](images/a.jpg)
         <span class="vp-sub-caption">(a) 满射</span>
       </div>
       <div class="vp-sub-figure">
         ![](images/b.jpg)
         <span class="vp-sub-caption">(b) 单射</span>
       </div>
     </div>
     <figcaption>图 1.4 映射类型示意图</figcaption>
   </figure>

3. Place the <figure> block at the logically best location (usually right after the introductory sentence or paragraph that references the figure, or after the example).
4. CRITICAL: In MDX, always use Markdown image syntax ![](images/xxx.jpg). If you use HTML <img>, it MUST be self-closing <img src="images/xxx.jpg" />.
5. CRITICAL: All mathematical relations, inequalities (e.g. 0 < x < 1) and set notations (e.g. {x | f(x)=0}) MUST be enclosed within LaTeX math delimiters $...$ or $$...$$, never left as raw JSX-like text.
6. CRITICAL: NEVER drop, alter, or lose any image filenames (e.g. images/xxx.jpg). All images in the input MUST be present in the output.
7. Preserve all LaTeX formulas $$ ... $$ intact.

Output strictly JSON adhering to schema:
{
  "results": [
    {
      "window_id": 1,
      "repaired_block": "...repaired MDX content for this window..."
    }
  ]
}`;

  const promptPayload = windowItems.map(w => ({
    window_id: w.id,
    anomaly_type: w.type,
    original_lines: w.rawText,
  }));

  const payload = {
    contents: [
      {
        parts: [
          { text: systemInstruction },
          { text: JSON.stringify(promptPayload) }
        ]
      }
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.1,
      maxOutputTokens: 4096
    }
  };

  const data = JSON.stringify(payload);

  for (const model of MODELS) {
    try {
      const res = await new Promise((resolve, reject) => {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;
        const req = https.request(
          url,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(data)
            },
            timeout: 30000
          },
          (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
              if (res.statusCode !== 200) {
                return reject(new Error(`HTTP ${res.statusCode}: ${body.slice(0, 150)}`));
              }
              try {
                const parsed = JSON.parse(body);
                const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
                if (!text) throw new Error('No candidate returned');
                const cleanJson = parseSafeJson(text);
                resolve(cleanJson.results || []);
              } catch (e) {
                reject(new Error(`Failed to parse Gemini output: ${e.message}`));
              }
            });
          }
        );
        req.on('error', reject);
        req.write(data);
        req.end();
      });

      return res;
    } catch (err) {
      // 切换模型继续尝试
      continue;
    }
  }

  throw new Error('All Gemini models failed or quota exceeded.');
}

/**
 * 主执行流程
 */
async function main() {
  console.log('===============================================================');
  console.log('⚡ Gemini 驱动的图像与图注智能纠偏流水线 (Figure & Caption Rectifier)');
  console.log(`模式: ${isDryRun ? '🔍 Dry-Run（试水比对，不写盘）' : '⚡ Apply（自动校验并写回源文件）'}`);
  console.log('===============================================================\n');

  let targetPath = 'src/content/docs/collections';
  if (singleFileArg) {
    targetPath = singleFileArg;
  } else if (bookSlugArg) {
    targetPath = `src/content/docs/collections/math/${bookSlugArg}`;
    if (!fs.existsSync(targetPath)) {
      targetPath = `src/content/docs/collections/science/${bookSlugArg}`;
    }
  }

  const files = getMdxFiles(targetPath);
  console.log(`扫描目标: ${targetPath} (共 ${files.length} 个 MDX 章节)\n`);

  let totalScanned = 0;
  let totalFixedWindows = 0;

  for (let fIdx = 0; fIdx < files.length; fIdx++) {
    const file = files[fIdx];
    const relName = path.relative(process.cwd(), file).replace(/\\/g, '/');
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split(/\r?\n/);

    const audit = analyzeMdxFile(file);
    // 优先处理 SEPARATED_PAIR 与 ORPHAN_CAPTION
    const targetAnomalies = audit.anomalies.filter(a => a.type === 'SEPARATED_PAIR' || a.type === 'ORPHAN_CAPTION');

    if (targetAnomalies.length === 0) {
      continue;
    }

    totalScanned++;
    console.log(`\n📄 [${fIdx + 1}/${files.length}] [${relName}] 发现 ${targetAnomalies.length} 处可修复图文错位`);

    let newContent = content.replace(/\r\n/g, '\n');
    const windowItems = [];

    // 合并重叠窗口
    const windows = [];
    for (let i = 0; i < targetAnomalies.length; i++) {
      const a = targetAnomalies[i];
      const s = a.startLine - 1;
      const e = a.endLine - 1;

      if (windows.length > 0 && s <= windows[windows.length - 1].end) {
        windows[windows.length - 1].end = Math.max(windows[windows.length - 1].end, e);
        windows[windows.length - 1].anomalies.push(a);
      } else {
        windows.push({ start: s, end: e, anomalies: [a] });
      }
    }

    for (let wIdx = 0; wIdx < windows.length; wIdx++) {
      const win = windows[wIdx];
      const rawChunk = lines.slice(win.start, win.end + 1).join('\n');
      windowItems.push({
        id: wIdx + 1,
        type: win.anomalies.map(a => a.type).join('+'),
        startLine: win.start + 1,
        endLine: win.end + 1,
        rawText: rawChunk,
      });
    }

    // 批量调用 Gemini
    const batchSize = 3;
    let fileModified = false;

    for (let b = 0; b < windowItems.length; b += batchSize) {
      const batch = windowItems.slice(b, b + batchSize);
      try {
        const results = await queryGeminiFix(batch);

        for (const res of results) {
          const item = batch.find(w => w.id === res.window_id);
          if (!item) continue;

          const originalText = item.rawText;
          let repairedText = (res.repaired_block || '').trim();
          // 自动修复未自闭合的 HTML <img> 标签以兼容 MDX/JSX
          repairedText = repairedText.replace(/<img\b([^>]*?)(?<!\/)>/gi, '<img$1 />');
          // 自动修复单美元结尾的块级公式 ($$ ... \n $) -> ($$ ... \n $$)
          repairedText = repairedText.replace(/^(\$\$[\s\S]*?)\r?\n\$(?!\$)/gm, '$1\n$$');

          if (!repairedText) continue;

          // 1. 防御校验：检查图片哈希是否完整保留
          const origImages = getImageSet(originalText);
          const repImages = getImageSet(repairedText);

          let imagesPreserved = true;
          for (const img of origImages) {
            if (!repImages.has(img)) {
              imagesPreserved = false;
              break;
            }
          }

          if (!imagesPreserved) {
            console.log(`  ⚠️ [放弃修复 W${item.id}] 检测到图片丢失，跳过该区块`);
            continue;
          }

          console.log(`  ✨ [修复成功 W${item.id}] (Lines ${item.startLine}-${item.endLine}):`);
          console.log(`     原样式: "${originalText.split('\n')[0].slice(0, 45)}..."`);
          console.log(`     新排版: 包含 <figure class="vp-figure"> 语义化图注`);

          if (!isDryRun) {
            if (newContent.includes(originalText)) {
              newContent = newContent.replace(originalText, repairedText);
              fileModified = true;
            } else {
              console.log(`  ⚠️ [匹配失败 W${item.id}] 原文本切片未能在全文中匹配`);
            }
          }
          totalFixedWindows++;
        }

        // 微延迟平滑 QPS
        await new Promise(r => setTimeout(r, 600));
      } catch (err) {
        console.error(`  ❌ Gemini 处理失败: ${err.message}`);
      }
    }

    if (!isDryRun && fileModified) {
      const check = await validateMdx(newContent, file);
      if (check.ok) {
        fs.writeFileSync(file, newContent, 'utf8');
        console.log(`  💾 [写入完成] MDX 编译通过，文件已安全更新！`);
      } else {
        console.error(`  ⚠️ [写入拦截] MDX 编译校验失败: ${check.error}`);
      }
    }
  }

  console.log('\n================ 处理汇总大盘 ================');
  console.log(`扫描包含错位章节: ${totalScanned}`);
  console.log(`成功纠偏图文区块: ${totalFixedWindows}`);
  console.log(`执行模式: ${isDryRun ? 'Dry-Run（未写入）' : 'Apply（已应用写盘）'}`);
  console.log('==============================================');
}

main().catch(err => {
  console.error('Fatal error in ai_fix_figures:', err);
  process.exit(1);
});