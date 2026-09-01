#!/usr/bin/env node
/**
 * scripts/ai_fix_card_boundaries.mjs
 * -----------------------------------------------------------------------------
 * 维度二：基于 Gemini API (Flash-Lite) 的卡片边界智能比对、审计与自动化修复流水线。
 *
 * 核心机制：
 * 1. 极致精简 Token（Token-Frugal Pipeline）：
 *    · 预过滤：仅提取 >= 2 个段落且含有正文特征的疑似误吞卡片，跳过单段/结构清晰卡片；
 *    · 公式脱敏压缩：提取 preview 时将长 LaTeX 公式精简为 [公式]，降低 60%~70% 的 Token 消耗；
 *    · 批量聚合：单次 API 请求并发检测 5~8 个卡片；
 *    · 轻量模型优先：使用 gemini-3.5-flash-lite / gemini-3.1-flash-lite。
 * 2. 语法安全：
 *    · 拆分后经 @mdx-js/mdx 与 acorn 严格校验，杜绝任何编译破坏；
 * 3. 命令行参数：
 *    · --file <path>   单文件测试
 *    · --dry-run       仅输出识别报告与 Diff，不写盘（默认）
 *    · --apply         校验通过后真实写回 MDX 文件
 *    · --book <slug>   指定书处理
 *    · --all           全量处理
 * =============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import { compile } from '@mdx-js/mdx';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

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
      if (entry.name !== 'images' && entry.name !== '.git') {
        files.push(...getMdxFiles(full));
      }
    } else if (entry.name.endsWith('.mdx')) {
      files.push(full);
    }
  }
  return files;
}

/**
 * 将卡片内容智能切分为逻辑段落（保持完整源码）
 */
function splitCardIntoParagraphs(body) {
  const rawParts = body.split(/\r?\n\s*\r?\n/).map(p => p.trim()).filter(Boolean);
  const paragraphs = [];
  let currentGroup = [];

  for (const part of rawParts) {
    if (part.startsWith('$$') && part.endsWith('$$') && currentGroup.length > 0) {
      currentGroup.push(part);
    } else {
      if (currentGroup.length > 0) {
        paragraphs.push(currentGroup.join('\n\n'));
        currentGroup = [];
      }
      currentGroup.push(part);
    }
  }
  if (currentGroup.length > 0) {
    paragraphs.push(currentGroup.join('\n\n'));
  }
  return paragraphs;
}

/**
 * 为 LLM 生成紧凑的段落文本摘要（脱敏长公式以大幅精简 Token）
 */
function compressParagraphForLLM(p) {
  const simplified = p
    .replace(/\$\$[\s\S]*?\$\$/g, ' [公式] ')
    .replace(/\$[^$\n]+\$/g, ' [公式] ')
    .replace(/!\[.*?\]\(.*?\)/g, ' [插图] ')
    .replace(/<QRCodeVideo[^>]*\/>/g, ' [微课视频] ')
    .replace(/\s+/g, ' ')
    .trim();
  return simplified.length > 180 ? `${simplified.slice(0, 180)}...` : simplified;
}

/**
 * 预过滤：提取疑似误吞正文的卡片
 */
function extractSuspectCards(fileContent, filePath) {
  const cardRegex = /<(Example|Knowledge|Note)\b([^>]*?)>([\s\S]*?)<\/\1>/g;
  const cards = [];
  let match;

  while ((match = cardRegex.exec(fileContent)) !== null) {
    const fullTag = match[0];
    const tagName = match[1];
    const attrs = match[2];
    const body = match[3];
    const titleMatch = attrs.match(/title=["'](.*?)["']/);
    const title = titleMatch ? titleMatch[1] : '';

    // 若包含子组件 <Solution>，说明已有明确解答闭合结构
    if (body.includes('<Solution')) continue;

    const paragraphs = splitCardIntoParagraphs(body);
    if (paragraphs.length < 2) continue;

    // 检查第 2 段及以后是否含有正文叙事、总结、引申或新概念特征
    const suspectParas = paragraphs.slice(1).filter(p => {
      return /^(其实|根据|由此可见|一般地|在下一[节章]|本节主要|综上所述|应当指出|我们称|俗称|这就是说|下面(?:我们|讨论|介绍|利用|给出)|定义\s*[\d.]|定理\s*[\d.]|例\s*[\d.]|注[:：])/.test(p)
        || p.includes('\\tag{')
        || p.length > 120;
    });

    if (suspectParas.length > 0) {
      cards.push({
        rawMatch: fullTag,
        index: match.index,
        tagName,
        attrs,
        title,
        body,
        paragraphs,
        filePath,
      });
    }
  }
  return cards;
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

/**
 * 调用 Gemini API (带多模型回退与轻量化 Payload)
 */
async function queryGeminiBoundary(batchCards) {
  const promptItems = batchCards.map((c, i) => {
    return {
      card_id: i + 1,
      card_type: c.tagName,
      card_title: c.title,
      paragraphs: c.paragraphs.map((p, pIdx) => ({
        p_index: pIdx + 1,
        text: compressParagraphForLLM(p)
      }))
    };
  });

  const systemInstruction = `You are an expert mathematical textbook structure editor.
In Chinese STEM textbooks converted via OCR, card components (<Example>, <Knowledge>, <Note>) sometimes mistakenly swallowed subsequent regular textbook narrative paragraphs because OCR lacks closing tags.

Task:
For each card, analyze the paragraphs [1, 2, ...].
Determine if paragraph 2 or later belongs to regular textbook body text (e.g. sequence introductions, mapping definitions, broad summary, subsequent concepts).
If swallowed:
- set "has_swallowed": true
- set "split_after_p": <number> (the 1-based paragraph index where the card SHOULD end; paragraphs after this index will be extracted outside the card as body text).
If NOT swallowed (the whole content belongs to this single card/example/definition):
- set "has_swallowed": false
- set "split_after_p": -1

Output strictly JSON adhering to schema:
{
  "results": [
    { "card_id": 1, "has_swallowed": true, "split_after_p": 1 }
  ]
}`;

  const payload = {
    contents: [
      {
        parts: [
          { text: systemInstruction },
          { text: JSON.stringify(promptItems) }
        ]
      }
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.1,
      maxOutputTokens: 1024
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
            timeout: 20000
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
      // 若 429 或 404，尝试下一个模型
      continue;
    }
  }

  throw new Error('All Gemini models failed or quota exceeded.');
}

/**
 * 校验 MDX 是否能通过编译
 */
async function validateMdx(content, filePath) {
  try {
    const body = content.replace(/^---[\s\S]*?---\r?\n?/, '');
    await compile({ value: body, path: filePath }, {
      remarkPlugins: [remarkMath],
      rehypePlugins: [[rehypeKatex, { strict: false }]],
      jsx: true
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/**
 * 主执行流程
 */
async function main() {
  console.log('=== Gemini 驱动的卡片边界智能校准流水线 ===');
  console.log(`模式: ${isDryRun ? '🔍 试水/Dry-Run（不修改源文件）' : '⚡ Apply（自动校验并写回源文件）'}`);

  let targetPath = 'src/content/docs/collections';
  if (singleFileArg) {
    targetPath = singleFileArg;
  } else if (bookSlugArg) {
    targetPath = `src/content/docs/collections/math/${bookSlugArg}`;
  }

  const files = getMdxFiles(targetPath);
  console.log(`扫描目标: ${targetPath} (共发现 ${files.length} 个 MDX 章节)`);

  let totalSuspectCards = 0;
  let totalFixedCards = 0;
  let estimatedTokensUsed = 0;

  let fileIdx = 0;
  for (const file of files) {
    fileIdx++;
    const percent = ((fileIdx / files.length) * 100).toFixed(1);
    const relName = path.relative(process.cwd(), file).replace(/\\/g, '/');
    const content = fs.readFileSync(file, 'utf8');
    const suspectCards = extractSuspectCards(content, file);

    if (suspectCards.length === 0) {
      console.log(`\n[${fileIdx}/${files.length} (${percent}%)] 📄 [${relName}] 未发现异常卡片`);
      continue;
    }

    totalSuspectCards += suspectCards.length;
    console.log(`\n[${fileIdx}/${files.length} (${percent}%)] 📄 [${relName}] 发现 ${suspectCards.length} 处疑似误吞卡片`);

    const batchSize = 6;
    let newContent = content;

    for (let i = 0; i < suspectCards.length; i += batchSize) {
      const batch = suspectCards.slice(i, i + batchSize);
      try {
        const results = await queryGeminiBoundary(batch);
        estimatedTokensUsed += 200 + batch.length * 50;

        for (const res of results) {
          const cardIdx = (res.card_id || 1) - 1;
          const card = batch[cardIdx];
          if (!card) continue;

          if (res.has_swallowed && res.split_after_p > 0 && res.split_after_p < card.paragraphs.length) {
            const splitIdx = res.split_after_p;
            const insideParas = card.paragraphs.slice(0, splitIdx);
            const outsideParas = card.paragraphs.slice(splitIdx);

            const updatedCardBlock = `<${card.tagName}${card.attrs}>\n${insideParas.join('\n\n')}\n</${card.tagName}>\n\n${outsideParas.join('\n\n')}`;

            console.log(`  ✂️ 【${card.title || card.tagName}】判定误吞:`);
            console.log(`     保留在卡片内: 前 ${splitIdx} 个段落`);
            console.log(`     移出为正文: 后 ${outsideParas.length} 个段落 (首段: "${outsideParas[0].replace(/\s+/g, ' ').slice(0, 35)}...")`);

            if (!isDryRun) {
              newContent = newContent.replace(card.rawMatch, updatedCardBlock);
            }
            totalFixedCards++;
          } else {
            console.log(`  ✅ 【${card.title || card.tagName}】判定正常 (属于完整单一例题/知识点)`);
          }
        }
        // 微缓冲平滑请求速率
        await new Promise(r => setTimeout(r, 600));
      } catch (err) {
        console.error(`  ❌ Gemini 判定失败: ${err.message}`);
      }
    }

    if (!isDryRun && newContent !== content) {
      const check = await validateMdx(newContent, file);
      if (check.ok) {
        fs.writeFileSync(file, newContent, 'utf8');
        console.log(`  💾 [写入成功] MDX 编译校验通过并已保存！`);
      } else {
        console.error(`  ⚠️ [放弃写入] 修正后 MDX 编译未通过: ${check.error}`);
      }
    }
  }

  console.log('\n================ 处理汇总 ================');
  console.log(`扫描章节总数: ${files.length}`);
  console.log(`疑似卡片总数: ${totalSuspectCards}`);
  console.log(`识别修正卡片: ${totalFixedCards}`);
  console.log(`预估 Token 消耗: ~${estimatedTokensUsed} Tokens`);
  console.log('==========================================');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
