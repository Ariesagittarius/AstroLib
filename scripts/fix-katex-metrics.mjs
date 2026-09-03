import fs from 'node:fs';
import path from 'node:path';
import { compile } from '@mdx-js/mdx';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import katex from 'katex';

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run') || args.includes('--check');
const showDetail = args.includes('--detail') || args.includes('-v');
const runCompileCheck = args.includes('--compile');

const targetArg = args.find(a => !a.startsWith('-'));
const targetDir = targetArg || 'src/content/docs/collections';

const romanMap = {
  'Ⅰ': 'I', 'Ⅱ': 'II', 'Ⅲ': 'III', 'Ⅳ': 'IV', 'Ⅴ': 'V',
  'Ⅵ': 'VI', 'Ⅶ': 'VII', 'Ⅷ': 'VIII', 'Ⅸ': 'IX', 'Ⅹ': 'X',
  'Ⅺ': 'XI', 'Ⅻ': 'XII',
  'ⅰ': 'i', 'ⅱ': 'ii', 'ⅲ': 'iii', 'ⅳ': 'iv', 'ⅴ': 'v',
  'ⅵ': 'vi', 'ⅶ': 'vii', 'ⅷ': 'viii', 'ⅸ': 'ix', 'ⅹ': 'x'
};

const circledMap = {
  '①': 1, '②': 2, '③': 3, '④': 4, '⑤': 5,
  '⑥': 6, '⑦': 7, '⑧': 8, '⑨': 9, '⑩': 10,
  '⑪': 11, '⑫': 12, '⑬': 13, '⑭': 14, '⑮': 15,
  '⑯': 16, '⑰': 17, '⑱': 18, '⑲': 19, '⑳': 20
};

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

const mathHtmlEntities = {
  '&gt;': '>',
  '&lt;': '<',
  '&amp;': '&',
  '&ge;': '\\ge ',
  '&le;': '\\le ',
  '&ne;': '\\neq ',
  '&plusmn;': '\\pm ',
  '&times;': '\\times ',
  '&infin;': '\\infty ',
  '&#39;': "'",
  '&quot;': '"',
};

const greekSymbols = [
  'alpha', 'beta', 'gamma', 'delta', 'epsilon', 'varepsilon', 'zeta', 'eta',
  'theta', 'vartheta', 'iota', 'kappa', 'lambda', 'mu', 'nu', 'xi', 'pi',
  'varpi', 'rho', 'varrho', 'sigma', 'varsigma', 'tau', 'upsilon', 'phi',
  'varphi', 'chi', 'psi', 'omega', 'Gamma', 'Delta', 'Theta', 'Lambda',
  'Xi', 'Pi', 'Sigma', 'Upsilon', 'Phi', 'Psi', 'Omega'
];

export function fixMathString(mathStr) {
  let s = mathStr;

  for (const [ent, repl] of Object.entries(mathHtmlEntities)) {
    if (s.includes(ent)) {
      s = s.replaceAll(ent, repl);
    }
  }

  for (const [r, repl] of Object.entries(romanMap)) {
    if (s.includes(r)) {
      s = s.replaceAll(r, repl);
    }
  }

  s = s.replace(/\\tag\s*\{([①-⑳])\}/g, (m, c) => `\\tag{\\textcircled{${circledMap[c]}}}`);

  s = s.replace(/\\textcircled\s*\{([①-⑳])\}/g, (m, c) => `\\textcircled{${circledMap[c]}}`);

  s = s.replace(/(\\underbrace\{[^}]*\}_\s*\{?)([①-⑳])(\}?)/g, (m, p1, c, p3) => `${p1}\\textcircled{${circledMap[c]}}${p3}`);

  s = s.replace(/([①-⑳])/g, (m, c) => `\\textcircled{${circledMap[c]}}`);

  s = s.replace(/\\right\s*:/g, '\\right.');

  for (const g of greekSymbols) {
    const reg = new RegExp(`\\\\textbf\\s*\\{\\s*\\\\${g}\\s*\\}`, 'g');
    if (reg.test(s)) {
      s = s.replace(reg, `\\boldsymbol{\\${g}}`);
    }
  }

  s = s.replace(/\\tag\s*\{[^}]*\}\s*(\\tag\s*\{[^}]*\})/g, '$1');

  return s;
}

export function fixContent(content) {
  const eol = content.includes('\r\n') ? '\r\n' : '\n';
  const lines = content.split(/\r?\n/);
  const newLines = [];
  let inBlock = false;

  const preprocessedLines = lines.map(line => {
    if (line.trim() === '$') {
      return line.replace('$', () => '$$');
    }
    return line;
  });

  for (let line of preprocessedLines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('$$')) {
      inBlock = !inBlock;
      newLines.push(line);
      continue;
    }

    if (inBlock) {
      let fixedLine = line;

      fixedLine = fixedLine.replace(/(\^\{[^\}]*?)([①-⑳])(\})/g, (m, p1, c, p3) => `${p1}\\textcircled{${circledMap[c]}}${p3}`);
      fixedLine = fixMathString(fixedLine);
      newLines.push(fixedLine);
      continue;
    }

    let fixedLine = line;

    fixedLine = fixedLine.replace(/\$\s*\^\{?\\text\{([①-⑳])\}\}?\s*\$/g, '<sup>$1</sup>');
    fixedLine = fixedLine.replace(/\$\s*\^\{?([①-⑳])\}?\s*\$/g, '<sup>$1</sup>');

    fixedLine = fixedLine.replace(/\$([^\$\n]+?)\^\{\\textcircled\{([①-⑳])\}\}\$/g, '$$$1$$<sup>$2</sup>');
    fixedLine = fixedLine.replace(/\$([^\$\n]+?)\^\{\\text\{([①-⑳])\}\}\$/g, '$$$1$$<sup>$2</sup>');
    fixedLine = fixedLine.replace(/\$([^\$\n]+?)\^\{([①-⑳])\}\$/g, '$$$1$$<sup>$2</sup>');
    fixedLine = fixedLine.replace(/\$([^\$\n]+?)\^([①-⑳])\$/g, '$$$1$$<sup>$2</sup>');

    fixedLine = fixedLine.replace(/\$([^\$\n]+?)\s*([①-⑳])\$/g, (m, math, c) => {
      if (/^[①-⑳\s\+\-\*\\times]+$/.test(math.trim() + c)) {
        return `$${fixMathString(math + c)}$`;
      }
      return `$${math.trim()}$<sup>${c}</sup>`;
    });

    fixedLine = fixedLine.replace(/(?<!\\)\$(.+?)(?<!\\)\$/g, (match, mathContent) => {
      return `$${fixMathString(mathContent)}$`;
    });

    newLines.push(fixedLine);
  }

  return newLines.join(eol);
}

async function verifyMdx(content) {
  const body = content.replace(/^---[\s\S]*?---\r?\n?/, '');
  await compile(body, {
    remarkPlugins: [remarkMath],
    rehypePlugins: [[rehypeKatex, { strict: false }]],
    jsx: true,
  });
}

async function main() {
  const resolvedDir = path.resolve(targetDir);
  console.log(`\n🔍 开始检查 KaTeX 字符规范: ${path.relative(process.cwd(), resolvedDir) || '.'}`);
  if (isDryRun) {
    console.log('ℹ️  运行模式: [检查模式 / Dry Run] (不写入文件)');
  } else {
    console.log('⚡ 运行模式: [自动修复并写入]');
  }

  const files = walk(resolvedDir);
  console.log(`📂 找到 ${files.length} 个 MDX 文件`);

  let modifiedCount = 0;
  const modifiedList = [];
  const compileErrors = [];

  for (const file of files) {
    const original = fs.readFileSync(file, 'utf-8');
    const fixed = fixContent(original);

    if (fixed !== original) {
      modifiedCount++;
      const relPath = path.relative(process.cwd(), file);
      const diffLines = [];
      const origLines = original.split(/\r?\n/);
      const fixedLines = fixed.split(/\r?\n/);

      for (let i = 0; i < origLines.length; i++) {
        if (origLines[i] !== fixedLines[i]) {
          diffLines.push({
            lineNum: i + 1,
            orig: origLines[i],
            fixed: fixedLines[i]
          });
        }
      }

      modifiedList.push({ file: relPath, diffLines });

      if (!isDryRun) {
        fs.writeFileSync(file, fixed, 'utf-8');
      }

      if (runCompileCheck) {
        try {
          await verifyMdx(fixed);
        } catch (err) {
          compileErrors.push({ file: relPath, message: err.message });
        }
      }
    }
  }

  console.log(`\n📊 检查结果:`);
  console.log(`- 扫描文件数: ${files.length}`);
  console.log(`- 存在不规范字符的文件: ${modifiedCount}`);

  if (modifiedCount > 0) {
    console.log('\n📝 涉及文件清单:');
    for (const item of modifiedList) {
      console.log(`  • ${item.file} (${item.diffLines.length} 处修改)`);
      if (showDetail) {
        for (const d of item.diffLines) {
          console.log(`    [Line ${d.lineNum}]`);
          console.log(`    - ${d.orig}`);
          console.log(`    + ${d.fixed}`);
        }
        console.log('');
      }
    }
  }

  if (compileErrors.length > 0) {
    console.error('\n❌ 编译校验异常:');
    for (const err of compileErrors) {
      console.error(`  • ${err.file}: ${err.message}`);
    }
    process.exit(1);
  }

  if (isDryRun && modifiedCount > 0) {
    console.log(`\n💡 提示: 请运行 'node scripts/fix-katex-metrics.mjs' 执行全量自动修复。`);
  } else if (!isDryRun && modifiedCount > 0) {
    console.log(`\n✅ 修复完成！共修复 ${modifiedCount} 个文件。`);
  } else {
    console.log('\n🎉 所有公式字符均符合 KaTeX 规范，无需修改。');
  }
}

main().catch(err => {
  console.error('执行出错:', err);
  process.exit(1);
});
