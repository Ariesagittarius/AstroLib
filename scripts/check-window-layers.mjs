#!/usr/bin/env node
/**
 * scripts/check-window-layers.mjs
 * ============================================================================
 * AstroLib Window Layer Linter (视窗层级规范守护脚本)
 * ============================================================================
 * 目的：阻止未来再次产生未经声明的硬编码大型 z-index 魔数（如 2147483xxx, 999999 等）。
 *
 * 规则：
 *   1. 跨组件全局视窗层级必须使用语义化设计令牌：var(--layer-*)。
 *   2. 局部组件微层级（Local Stacking Context）允许使用 <= 10 的局部小整数 (-1, 0, 1, 2, 3, 4, 5, 10)。
 *   3. 严禁使用 >= 50 的裸数值魔数（如 50, 99, 100, 1000, 99999, 999999, 2147483xxx）。
 * ============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';

const SRC_DIR = path.resolve('src');
const ALLOWED_EXTS = new Set(['.css', '.astro', '.ts', '.tsx', '.mjs']);

// 局部组件微层级允许的数值上限（用于 badge, outline marker, 局部图标等）
const MAX_LOCAL_Z_INDEX = 10;

function walkDir(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath, fileList);
    } else if (entry.isFile() && ALLOWED_EXTS.has(path.extname(entry.name))) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split(/\r?\n/);
  const violations = [];

  // 匹配 z-index: <value>;
  const zIndexRegex = /z-index\s*:\s*([^;!]+)(?:!important)?\s*;/gi;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // 忽略注释行
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
      continue;
    }

    let match;
    while ((match = zIndexRegex.exec(line)) !== null) {
      const rawVal = match[1].trim();

      // 允许使用语义变量与 CSS 关键字
      if (
        rawVal.startsWith('var(--layer-') ||
        rawVal.startsWith('var(--sl-z-index') ||
        rawVal.startsWith('calc(') ||
        rawVal === 'auto' ||
        rawVal === 'inherit' ||
        rawVal === 'initial' ||
        rawVal === 'unset'
      ) {
        continue;
      }

      // 检查纯数字
      const numVal = parseInt(rawVal, 10);
      if (!isNaN(numVal)) {
        // 允许局部小数值 (<= MAX_LOCAL_Z_INDEX)
        if (numVal <= MAX_LOCAL_Z_INDEX && numVal >= -1) {
          continue;
        }

        // 违规：使用了未授权的裸大型数字
        let recommendation = 'var(--layer-sticky)';
        if (numVal >= 800 && numVal < 1000) recommendation = 'var(--layer-system)';
        else if (numVal >= 700) recommendation = 'var(--layer-toast)';
        else if (numVal >= 600) recommendation = 'var(--layer-modal)';
        else if (numVal >= 500) recommendation = 'var(--layer-dialog)';
        else if (numVal >= 400) recommendation = 'var(--layer-drawer)';
        else if (numVal >= 300) recommendation = 'var(--layer-popover)';
        else if (numVal >= 200) recommendation = 'var(--layer-floating)';
        else if (numVal >= 100) recommendation = 'var(--layer-sticky)';

        violations.push({
          line: i + 1,
          value: rawVal,
          lineContent: line.trim(),
          recommendation,
        });
      }
    }
  }

  return violations;
}

console.log('🔍 [Window Layer Lint] 正在扫描全站视窗层级规范...');

const allFiles = walkDir(SRC_DIR);
let totalViolations = 0;
const reports = [];

for (const file of allFiles) {
  const violations = checkFile(file);
  if (violations.length > 0) {
    totalViolations += violations.length;
    reports.push({ file: path.relative(process.cwd(), file).replace(/\\/g, '/'), violations });
  }
}

if (totalViolations === 0) {
  console.log(`✅ [Window Layer Lint] 扫描完成！共校验 ${allFiles.length} 个文件，未发现未声明的大型硬编码 z-index。`);
  process.exit(0);
} else {
  console.error(`❌ [Window Layer Lint] 发现 ${totalViolations} 处违规硬编码 z-index 魔数：\n`);
  for (const rep of reports) {
    console.error(`📄 ${rep.file}:`);
    for (const v of rep.violations) {
      console.error(`   第 ${v.line} 行: "z-index: ${v.value};"`);
      console.error(`   → 代码: ${v.lineContent}`);
      console.error(`   → 建议: 使用语义令牌 ${v.recommendation} 替换\n`);
    }
  }
  console.error('💡 提示：所有全局视窗层级必须使用 src/styles/tokens/layers.css 中定义的 --layer-* 变量。');
  console.error('   局部微层级（如指示线、badge）仅限使用 <= 10 的局部小数值。');
  process.exit(1);
}

