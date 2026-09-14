import fs from 'node:fs';
import path from 'node:path';
import { compile } from '@mdx-js/mdx';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import katex from 'katex';
import rehypeImageBlur from '../src/plugins/rehype/rehype-image-blur.mjs';

const detailFile = process.argv.find(a => a.startsWith('--detail='))?.split('=')[1];
const showLines = process.argv.includes('--lines');
const skipMath = process.argv.includes('--skip-math');
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
const mathErrors = [];
const imageErrors = [];

for (const file of files) {
  const content = fs.readFileSync(file, 'utf-8');
  const relFile = path.relative(process.cwd(), file).replace(/\\/g, '/');

  const body = content.replace(/^---[\s\S]*?---\r?\n?/, '');

  let fileHasError = false;

  try {
    const compiled = await compile({ value: body, path: file }, {
      remarkPlugins: [remarkMath],
      rehypePlugins: [[rehypeKatex, { strict: false }], rehypeImageBlur],
      jsx: true,
    });
    const compiledStr = String(compiled);
    if (compiledStr.includes('katex-error')) {
      fileHasError = true;
      const idx = compiledStr.indexOf('katex-error');
      const snippet = compiledStr.slice(Math.max(0, idx - 40), Math.min(compiledStr.length, idx + 250));
      failures.push({
        file: relFile,
        message: snippet.replace(/\s+/g, ' '),
      });
    }
  } catch (err) {
    fileHasError = true;
    failures.push({
      file: relFile,
      message: err.message,
      line: err.line,
      column: err.column,
      place: err.place,
      stack: err.stack ? err.stack.split('\n').slice(0, 6).join('\n') : '',
    });
  }

  const lineOffsets = [0];
  for (let i = 0; i < content.length; i++) {
    if (content.charCodeAt(i) === 10) lineOffsets.push(i + 1);
  }
  const getLine = (idx) => {
    let low = 0, high = lineOffsets.length - 1;
    while (low <= high) {
      const mid = (low + high) >> 1;
      if (lineOffsets[mid] <= idx) low = mid + 1;
      else high = mid - 1;
    }
    return high + 1;
  };

  if (!skipMath) {

    const displayMatches = content.matchAll(/\$\$([\s\S]+?)\$\$/g);
    for (const m of displayMatches) {
      const raw = m[1].trim();
      if (!raw) continue;
      try {
        katex.renderToString(raw, { displayMode: true, throwOnError: true, strict: false });
      } catch (err) {
        fileHasError = true;
        mathErrors.push({
          file: relFile,
          type: 'display',
          line: getLine(m.index),
          message: err.message,
          snippet: raw.replace(/\s+/g, ' ').slice(0, 100),
        });
      }
    }

    const noBlocks = content.replace(/```[\s\S]*?```/g, (m) => ' '.repeat(m.length))
      .replace(/\$\$[\s\S]+?\$\$/g, (m) => ' '.repeat(m.length));

    const inlineMatches = noBlocks.matchAll(/(?<!\\)\$([^$\n\r]+?)(?<!\\)\$/g);
    for (const m of inlineMatches) {
      const raw = m[1].trim();
      if (!raw) continue;
      try {
        katex.renderToString(raw, { displayMode: false, throwOnError: true, strict: false });
      } catch (err) {
        fileHasError = true;
        mathErrors.push({
          file: relFile,
          type: 'inline',
          line: getLine(m.index),
          message: err.message,
          snippet: raw.replace(/\s+/g, ' ').slice(0, 100),
        });
      }
    }
  }

  const mdImgMatches = content.matchAll(/!\[.*?\]\((.*?)\)/g);
  const htmlImgMatches = content.matchAll(/<img\s+[^>]*src=["'](.*?)["']/g);
  for (const m of [...mdImgMatches, ...htmlImgMatches]) {
    const rawPath = (m[1] || '').trim();
    if (!rawPath || rawPath.startsWith('http://') || rawPath.startsWith('https://') || rawPath.startsWith('data:')) {
      continue;
    }
    const cleanPath = rawPath.split('?')[0].split('#')[0];
    let resolvedPath = '';
    if (cleanPath.startsWith('/')) {
      resolvedPath = path.resolve('public', cleanPath.slice(1));
    } else {
      resolvedPath = path.resolve(path.dirname(file), cleanPath);
    }
    if (!fs.existsSync(resolvedPath)) {
      fileHasError = true;
      imageErrors.push({
        file: relFile,
        ref: rawPath,
        resolved: path.relative(process.cwd(), resolvedPath).replace(/\\/g, '/'),
        line: getLine(m.index),
      });
    }
  }

  if (!fileHasError) ok++;
}

console.log(`\n扫描目录: ${targetDir}`);
console.log(`文件通过: ${ok} / ${files.length}`);
if (failures.length) {
  console.log(`\n❌ MDX/JSX 语法编译失败: ${failures.length} 个文件\n`);
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

if (mathErrors.length) {
  console.log(`\n📐 KaTeX 公式语法异常: ${mathErrors.length} 处\n`);
  for (const m of mathErrors) {
    console.log(`${m.file}:${m.line} [${m.type}]`);
    console.log(`  错误: ${m.message}`);
    console.log(`  公式: ${m.snippet}`);
  }
}

if (imageErrors.length) {
  console.log(`\n🖼️ 图片资产缺失 (ImageNotFound): ${imageErrors.length} 处\n`);
  for (const img of imageErrors) {
    console.log(`${img.file}:${img.line}`);
    console.log(`  引用路径: ${img.ref}`);
    console.log(`  磁盘定位: ${img.resolved} (文件不存在)`);
  }
}

if (!failures.length && !mathErrors.length && !imageErrors.length) {
  console.log('🎉 所有 MDX 语法、KaTeX 数学公式与本地图片资产均校验通过！');
} else {
  process.exit(1);
}
