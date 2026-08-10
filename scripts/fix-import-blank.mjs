// 批量修复：在文件顶部 import 块之后补一个空行（保留原行尾风格）
// 原因：MDX 的 ESM 解析器会把“import 行 + 后续无空行内容”整体当作 JS 解析，
// 导致组件内 $...$ 公式的 { } 被当成 JSX 表达式而编译失败。
import fs from 'node:fs';
import path from 'node:path';
import { compile } from '@mdx-js/mdx';
import remarkMath from 'remark-math';

function walk(dir, list = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, list);
    else if (entry.name.endsWith('.mdx')) list.push(full);
  }
  return list;
}

async function compiles(body) {
  try {
    await compile(body.replace(/^---[\s\S]*?---\r?\n?/, '').replace(/\r/g, ''), {
      remarkPlugins: [remarkMath],
      jsx: true,
    });
    return true;
  } catch {
    return false;
  }
}

const dir = process.argv[2] || 'src/content/docs/collections/math/math_analysis';
const files = walk(path.resolve(dir));
let fixedCount = 0;
const stillBroken = [];

for (const file of files) {
  const original = fs.readFileSync(file, 'utf8');
  if (await compiles(original)) continue;

  const eol = original.includes('\r\n') ? '\r\n' : '\n';
  const fixed = original.replace(
    /((?:^import [^\r\n]+\r?\n)+)(?=\S)/m,
    (m) => m + eol
  );

  if (fixed === original) {
    stillBroken.push({ file: path.relative(process.cwd(), file), reason: 'import 块正则未命中' });
    continue;
  }

  fs.writeFileSync(file, fixed, 'utf8');
  fixedCount++;

  if (await compiles(fixed)) {
    console.log('已修复:', path.relative(process.cwd(), file));
  } else {
    stillBroken.push({ file: path.relative(process.cwd(), file), reason: '修复后仍有其它错误' });
  }
}

console.log(`\n本次通过补空行修复: ${fixedCount} 个文件`);
if (stillBroken.length) {
  console.log('仍需处理:');
  for (const b of stillBroken) console.log(' -', b.file, `(${b.reason})`);
}
