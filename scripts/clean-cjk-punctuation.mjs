#!/usr/bin/env node

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

export function cleanMdxPunctuation(rawContent, options = {}) {

  let frontmatter = '';
  let body = rawContent;
  const fmMatch = rawContent.match(/^---[\s\S]*?---\r?\n?/);
  if (fmMatch) {
    frontmatter = fmMatch[0];
    body = rawContent.slice(frontmatter.length);
  }

  const placeholders = [];
  function protect(regex) {
    body = body.replace(regex, (match) => {
      const token = `__CJK_PUNCT_PROTECT_${placeholders.length}__`;
      placeholders.push({ token, match });
      return token;
    });
  }

  protect(/```[\s\S]*?```/g);

  protect(/`[^`\n]+`/g);

  protect(/\$\$[\s\S]*?\$\$/g);

  protect(/\$[^$\n]+\$/g);

  protect(/^(?:import|export)\s+[\s\S]*?;(?:\r?\n|$)/gm);

  protect(/<\/?[a-zA-Z0-9_\-]+(?:\s+[^>]*)?\/?>/g);

  body = normalizeCjkPunctuation(body, {
    comma: options.comma || commaOpt,
    fullStop: options.fullStop || fullStopOpt,
  });

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
