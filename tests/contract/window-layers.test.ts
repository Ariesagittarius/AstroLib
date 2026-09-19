import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { walkFiles } from '../helpers/fs-helpers.ts';

describe('Window Layers Invariant Contract', () => {
  it('所有组件必须使用语义化层叠令牌 var(--layer-*)，严禁硬编码 >= 50 的 z-index 魔数', () => {
    const srcDir = path.resolve('src');
    const allowedExts = new Set(['.css', '.astro', '.ts', '.tsx', '.mjs']);
    const maxLocalZIndex = 10;
    const zIndexRegex = /z-index\s*:\s*([^;!]+)(?:!important)?\s*;/gi;

    const files = walkFiles(srcDir, (f) => allowedExts.has(path.extname(f)));
    const violations: Array<{ file: string; line: number; raw: string; reason: string }> = [];

    for (const filePath of files) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split(/\r?\n/);

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
          continue;
        }

        let match: RegExpExecArray | null;
        zIndexRegex.lastIndex = 0;
        while ((match = zIndexRegex.exec(line)) !== null) {
          const rawVal = match[1].trim();

          if (
            rawVal.startsWith('var(--layer-') ||
            rawVal.startsWith('var(--sl-z-index') ||
            rawVal.startsWith('calc(') ||
            rawVal === 'inherit' ||
            rawVal === 'initial' ||
            rawVal === 'unset' ||
            rawVal === 'auto'
          ) {
            continue;
          }

          const numVal = parseInt(rawVal, 10);
          if (!Number.isNaN(numVal)) {
            if (numVal <= maxLocalZIndex) {
              continue;
            }
            violations.push({
              file: path.relative(srcDir, filePath),
              line: i + 1,
              raw: rawVal,
              reason: `数值 ${numVal} 超过了局部微层级上限 (${maxLocalZIndex})，必须使用 var(--layer-*) 设计令牌`,
            });
            continue;
          }

          violations.push({
            file: path.relative(srcDir, filePath),
            line: i + 1,
            raw: rawVal,
            reason: `未识别的非法 z-index 声明，必须使用 var(--layer-*) 语义设计令牌`,
          });
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
