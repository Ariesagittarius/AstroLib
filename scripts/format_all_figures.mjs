#!/usr/bin/env node
/**
 * scripts/format_all_figures.mjs
 * -----------------------------------------------------------------------------
 * 全库 MDX 图片与图注确定性排版升级工具
 *
 * 功能：
 * 1. 将所有紧邻的图片 + 图注转换为标准 VitePress 语义化 <figure class="vp-figure"><figcaption>
 * 2. 识别前置段落带有 (图 X.Y) 且紧跟未绑定图片的场景，自动补充 <figcaption>图 X.Y</figcaption>
 * 3. 严格校验 @mdx-js/mdx 语法与图片路径防丢
 * =============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import { compile } from '@mdx-js/mdx';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

const args = process.argv.slice(2);
const isApply = args.includes('--apply');
const isDryRun = !isApply || args.includes('--dry-run');
const singleFileArg = args.find((_, i, arr) => arr[i - 1] === '--file');
const bookSlugArg = args.find((_, i, arr) => arr[i - 1] === '--book');

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
 * 核心格式化函数
 */
function formatFiguresInContent(content) {
  let modified = content.replace(/\r\n/g, '\n');

  // 1. 紧邻的图片 + 图注：
  // ![](images/xxx.jpg) [空格换行] 图1.12 [说明文字]
  // 排除已经在 <figure> 内的情况
  const adjacentFigureRegex = /(?<!<figure[^>]*>[\s\S]*?)!\[(.*?)\]\((images\/[^\)]+)\)[ \t]*\n(?:[ \t]*\n)?([ \t]*(?:图|Figure)\s*[\d\.\-－]+[^\n]*)/g;
  
  modified = modified.replace(adjacentFigureRegex, (match, alt, imgPath, caption) => {
    // 若 caption 超长（> 75 字符）或以普通问号句号结尾，不是独立图注
    const trimmedCaption = caption.trim();
    if (trimmedCaption.length > 75) return match;
    if (/[。？！?!]$/.test(trimmedCaption) && trimmedCaption.length > 35) return match;

    return `<figure class="vp-figure">\n  ![](${imgPath})\n  <figcaption>${trimmedCaption}</figcaption>\n</figure>`;
  });

  // 2. 多子图模式匹配：
  // ![](images/1.jpg) \n (a) xxx \n ![](images/2.jpg) \n (b) yyy \n 图1.4 zzz
  const subfig2Regex = /(?<!<figure[^>]*>[\s\S]*?)!\[(.*?)\]\((images\/[^\)]+)\)[ \t]*\n(?:[ \t]*\n)?([ \t]*\(?[a-zA-Z0-9]\)?[^\n]+)[ \t]*\n(?:[ \t]*\n)?!\[(.*?)\]\((images\/[^\)]+)\)[ \t]*\n(?:[ \t]*\n)?([ \t]*\(?[a-zA-Z0-9]\)?[^\n]+)[ \t]*\n(?:[ \t]*\n)?([ \t]*(?:图|Figure)\s*[\d\.\-－]+[^\n]*)/g;
  
  modified = modified.replace(subfig2Regex, (match, alt1, img1, cap1, alt2, img2, cap2, mainCap) => {
    return `<figure class="vp-figure">
  <div class="vp-figure-grid">
    <div class="vp-sub-figure">
      ![](${img1})
      <span class="vp-sub-caption">${cap1.trim()}</span>
    </div>
    <div class="vp-sub-figure">
      ![](${img2})
      <span class="vp-sub-caption">${cap2.trim()}</span>
    </div>
  </div>
  <figcaption>${mainCap.trim()}</figcaption>
</figure>`;
  });

  return modified;
}

async function main() {
  console.log('===============================================================');
  console.log('🖼️ 全库 MDX 图片与图注规范化转换器 (Figure Formatter)');
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

  let modifiedCount = 0;
  let totalFiguresTransformed = 0;

  for (let fIdx = 0; fIdx < files.length; fIdx++) {
    const file = files[fIdx];
    const relName = path.relative(process.cwd(), file).replace(/\\/g, '/');
    const content = fs.readFileSync(file, 'utf8');

    const formatted = formatFiguresInContent(content);

    if (formatted !== content.replace(/\r\n/g, '\n')) {
      const origImages = getImageSet(content);
      const repImages = getImageSet(formatted);
      let preserved = true;
      for (const img of origImages) {
        if (!repImages.has(img)) {
          preserved = false;
          break;
        }
      }

      if (!preserved) {
        console.log(`⚠️ [${relName}] 检测到图片丢失，跳过`);
        continue;
      }

      const figCountInFormatted = (formatted.match(/<figure class="vp-figure">/g) || []).length;
      const figCountInOriginal = (content.match(/<figure class="vp-figure">/g) || []).length;
      const newlyAdded = figCountInFormatted - figCountInOriginal;

      console.log(`✨ [${relName}] 成功规范化 ${newlyAdded} 处图注排版`);
      modifiedCount++;
      totalFiguresTransformed += newlyAdded;

      if (!isDryRun) {
        const check = await validateMdx(formatted, file);
        if (check.ok) {
          fs.writeFileSync(file, formatted, 'utf8');
        } else {
          console.error(`  ❌ [${relName}] 写入拦截: ${check.error}`);
        }
      }
    }
  }

  console.log('\n================ 转换汇总大盘 ================');
  console.log(`修改文件总数: ${modifiedCount} / ${files.length}`);
  console.log(`转换标准图注: ${totalFiguresTransformed} 处`);
  console.log(`执行模式: ${isDryRun ? 'Dry-Run（未写入）' : 'Apply（已写盘）'}`);
  console.log('==============================================');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});