import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { walkFiles } from '../helpers/fs-helpers.ts';

describe('Rule 5 — Public Directory Hygiene Contract', () => {
  it('public/ 目录不得含有任何测试产物、编译中间文件与临时日志', () => {
    const publicDir = path.resolve('public');
    const forbiddenExts = new Set(['.aux', '.idx', '.mst', '.log', '.tmp', '.toc', '.tex', '.typ']);
    const allFiles = walkFiles(publicDir);

    const violations: string[] = [];

    for (const file of allFiles) {
      const ext = path.extname(file).toLowerCase();
      const base = path.basename(file).toLowerCase();

      if (forbiddenExts.has(ext)) {
        violations.push(`含有非法编译/临时后缀文件: ${path.relative(publicDir, file)}`);
      }
      if (base.startsWith('test_') || base.startsWith('temp_')) {
        violations.push(`含有非法测试产物文件: ${path.relative(publicDir, file)}`);
      }
    }

    expect(violations).toEqual([]);
  });
});
