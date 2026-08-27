// 一次性扫描脚本：用与 Astro 相同的 MDX 编译管线检查指定目录下的所有 .mdx 文件
import fs from 'node:fs';
import path from 'node:path';
import { compile } from '@mdx-js/mdx';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeImageBlur from '../src/utils/rehype-image-blur.mjs';

const detailFile = process.argv.find(a => a.startsWith('--detail='))?.split('=')[1];
const showLines = process.argv.includes('--lines');
const targetDir = process.argv.slice(2).find(a => !a.startsWith('--'))
  || 'src/content/docs/collections/math/math_analysis';

function walk(dir, list = []) {
  if (!fs.existsSync(dir)) return list;
  const stat = fs.statSync(dir);
  if (!stat.isDirectory()) {
    if (dir.endsWith('.mdx')) list.push(dir);
    return list;
  }
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, list);
    else if (entry.name.endsWith('.mdx')) list.push(full);
  }
  return list;
}

const files = walk(path.resolve(targetDir));
let ok = 0;
const failures = [];

for (const file of files) {
  const content = fs.readFileSync(file, 'utf-8');
  // 剥离 frontmatter（Astro 会单独处理，编译 MDX 时不含它）
  const body = content.replace(/^---[\s\S]*?---\r?\n?/, '');
  try {
    await compile({ value: body, path: file }, {
      remarkPlugins: [remarkMath],
      rehypePlugins: [[rehypeKatex, { strict: false }], rehypeImageBlur],
      jsx: true,
    });
    ok++;
  } catch (err) {
    failures.push({
      file: path.relative(process.cwd(), file),
      message: err.message,
      line: err.line,
      column: err.column,
      place: err.place,
      stack: err.stack ? err.stack.split('\n').slice(0, 6).join('\n') : '',
    });
  }
}

console.log(`\n扫描目录: ${targetDir}`);
console.log(`通过: ${ok} / ${files.length}`);
if (failures.length) {
  console.log(`失败: ${failures.length}\n`);
  for (const f of failures) {
    if (detailFile && f.file.replace(/\\/g, '/').includes(detailFile)) {
      console.log(`### ${f.file}`);
      console.log(f.message);
      if (f.line) console.log(`line=${f.line} column=${f.column}`);
      if (f.place && typeof f.place === 'object') console.log(JSON.stringify(f.place));
      if (f.stack) console.log(f.stack);
      console.log('');
    } else if (!detailFile) {
      console.log(f.file);
      console.log('  ' + f.message.split('\n')[0]);
      if (showLines && f.line) {
        const raw = fs.readFileSync(f.file, 'utf8').split(/\r?\n/);
        const target = f.line - 1;
        if (raw[target - 1]) console.log(`  ${target}: ${raw[target - 1].slice(0, 90)}`);
        if (raw[target]) console.log(`  ${target + 1}: ${raw[target].slice(0, 90)}`);
        if (raw[target + 1]) console.log(`  ${target + 2}: ${raw[target + 1].slice(0, 90)}`);
      }
    }
  }
}
