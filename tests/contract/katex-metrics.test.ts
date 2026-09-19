import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { walkFiles } from '../helpers/fs-helpers.ts';

describe('KaTeX Character Metrics Pitfalls Contract', () => {
  it('MDX 正文中的公式不应包含引发 KaTeX metrics 警告的裸 Unicode 罗马数字与 circled tag', () => {
    const docsDir = path.resolve('src/content/docs/collections/math/engineering_analysis');
    if (!fs.existsSync(docsDir)) return;

    const mdxFiles = walkFiles(docsDir, (f) => f.endsWith('.mdx'));
    const romanInMathRegex = /\$[^$\n]*[ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩⅪⅫⅰⅱⅲⅳⅴⅵⅶⅷⅸⅹ][^$\n]*\$/g;
    const circledTagRegex = /\\tag\{[①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳]\}/g;

    const violations: string[] = [];

    for (const file of mdxFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      if (romanInMathRegex.test(content)) {
        violations.push(`${path.basename(file)}: 公式中包含 Unicode 罗马数字 (应转为标准 ASCII)`);
      }
      if (circledTagRegex.test(content)) {
        violations.push(`${path.basename(file)}: 公式中包含 \\tag{①} (应转为 \\tag{\\textcircled{1}})`);
      }
    }

    expect(violations).toEqual([]);
  });
});
