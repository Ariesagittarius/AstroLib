#!/usr/bin/env node
/**
 * scripts/clean-cjk-punctuation.mjs
 * 离线学术标点与呼吸间距持久化清洗工具
 *
 * 用法:
 *   node scripts/clean-cjk-punctuation.mjs [目录或文件] [--dry-run] [--comma=，] [--stop=．|。]
 *
 * 示例:
 *   node scripts/clean-cjk-punctuation.mjs src/content/docs/collections/math/engineering_analysis --dry-run
 *   node scripts/clean-cjk-punctuation.mjs src/content/docs/collections/math/engineering_analysis
 */

import fs from 'node:fs';
import path from 'node:path';
import { normalizeCjkPunctuation } from '../src/plugins/rehype/rehype-cjk-punctuation.mjs';

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run') || args.includes('-d');
const fullStopOpt = args.find(a => a.startsWith('--stop='))?.split('=')[1] || '．';
const commaOpt = args.find(a => a.startsWith('--comma='))?.split('=')[1] || '，';

const targetArg = args.find(a => !a.startsWith('-')) || 'src/content/docs/collections/math/engineering_analysis';

function walk(dir, list = []) {
  if (!fs.existsSync(dir)) return list;
  const stat = fs.statSync(dir);
  if (!stat.isDirectory()) {
    if (dir.endsWith('.mdx') || dir.endsWith('.md')) list.push(dir);
    return list;
  }
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, list);
    else if (entry.name.endsWith('.mdx') || entry.name.endsWith('.md')) list.push(full);
  }
  return list;
}

/**
 * 保护性清洗 MDX 源码正文：
 * 隔离 frontmatter、代码块、行内代码、行间公式、行内公式与 HTML/JSX 标签
 */
export function cleanMdxPunctuation(rawContent, options = {}) {
  // 1. 拆离 frontmatter
  let frontmatter = '';
  let body = rawContent;
  const fmMatch = rawContent.match(/^---[\s\S]*?---\r?\n?/);
  if (fmMatch) {
    frontmatter = fmMatch[0];
    body = rawContent.slice(frontmatter.length);
  }

  // 2. 占位隔离保护
  const placeholders = [];
  function protect(regex) {
    body = body.replace(regex, (match) => {
      const token = `__CJK_PUNCT_PROTECT_${placeholders.length}__`;
      placeholders.push({ token, match });
      return token;
    });
  }

  // 隔离围栏代码块
  protect(/```[\s\S]*?```/g);
  // 隔离行内代码
  protect(/`[^`\n]+`/g);
  // 隔离独立行显示数学公式 ($$ ... $$)
  protect(/\$\$[\s\S]*?\$\$/g);
  // 隔离行内公式 ($ ... $)
  protect(/\$[^$\n]+\$/g);
  // 隔离 import / export 语句行
  protect(/^(?:import|export)\s+[\s\S]*?;(?:\r?\n|$)/gm);
  // 隔离 JSX / HTML 标签（包含组件如 <Knowledge ...> 或 </Knowledge>）
  protect(/<\/?[a-zA-Z0-9_\-]+(?:\s+[^>]*)?\/?>/g);

  // 3. 对暴露的正文文本进行标点规范化
  body = normalizeCjkPunctuation(body, {
    comma: options.comma || commaOpt,
    fullStop: options.fullStop || fullStopOpt,
  });

  // 4. 恢复占位符（逆序还原防止嵌套引用）
  for (let i = placeholders.length - 1; i >= 0; i--) {
    const { token, match } = placeholders[i];
    body = body.replace(token, () => match);
  }

  return frontmatter + body;
}

const files = walk(path.resolve(targetArg));
console.log('================================================================');
console.log(`📚 学术标点与呼吸间距离线清洗工具 ${isDryRun ? '(演练模式)' : '(写入模式)'}`);
console.log(`🎯 目标: ${targetArg} (共 ${files.length} 个文件)`);
console.log(`⚙️ 标点映射: 逗号 -> '${commaOpt}', 句号 -> '${fullStopOpt}'`);
console.log('================================================================\n');

let modifiedCount = 0;

for (const file of files) {
  const original = fs.readFileSync(file, 'utf8');
  const cleaned = cleanMdxPunctuation(original);

  if (cleaned !== original) {
    modifiedCount++;
    const relPath = path.relative(process.cwd(), file).replace(/\\/g, '/');
    console.log(`📝 [${isDryRun ? '需修改' : '已优化'}] ${relPath}`);
    if (!isDryRun) {
      fs.writeFileSync(file, cleaned, 'utf8');
    }
  }
}

console.log('\n----------------------------------------------------------------');
console.log(`✨ 完成！共扫描 ${files.length} 个文件，${isDryRun ? '可优化' : '已更新'} ${modifiedCount} 个文件。`);
