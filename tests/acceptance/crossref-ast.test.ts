import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { createProcessor } from '@mdx-js/mdx';
import { VFile } from 'vfile';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { rehypeKatexAnnotate, rehypeKatexPromote } from '@/plugins/rehype/rehype-katex-source.mjs';
import { rehypeCrossRef } from '@/plugins/rehype/rehype-cross-ref.mjs';
import { collections } from '@/config/collections.config.ts';

describe('Cross-Reference AST Plugin Acceptance Suite', () => {
  const root = path.resolve('.');
  const sampleMdx = path.join(
    root,
    'src/content/docs/collections/math/engineering_analysis/1.5_连续函数.mdx'
  );

  it('成功处理 MDX AST 并生成构建期交叉引用徽章与元数据', async () => {
    expect(fs.existsSync(sampleMdx)).toBe(true);
    const content = fs.readFileSync(sampleMdx, 'utf-8');
    const body = content.replace(/^---[\s\S]*?---\r?\n?/, '');

    const processor = createProcessor({
      remarkPlugins: [remarkMath],
      rehypePlugins: [
        rehypeKatexAnnotate,
        [rehypeKatex, { output: 'html', strict: false, throwOnError: false }],
        rehypeKatexPromote,
        [rehypeCrossRef, { collections }],
      ],
      jsx: true,
      outputFormat: 'function-body',
    });

    const vfile = new VFile({ value: body, path: sampleMdx });
    const result = await processor.process(vfile);
    const code = String(result);

    expect(code).toBeDefined();
    expect(code.length).toBeGreaterThan(1000);

    // 检查交叉引用关键属性与标记
    expect(code).toContain('data-xref-built');
    expect(code).toContain('block-ref-badge');

    const blockBadges = (code.match(/block-ref-badge/g) || []).length;
    expect(blockBadges).toBeGreaterThan(0);
  });

  it('能够优雅处理没有定理或公式的普通 MDX 内容', async () => {
    const plainMdx = `# 简短测试标题\n\n这是一段普通的文本段落，不含任何交叉引用。`;
    const processor = createProcessor({
      remarkPlugins: [remarkMath],
      rehypePlugins: [
        rehypeKatexAnnotate,
        [rehypeKatex, { output: 'html', strict: false, throwOnError: false }],
        rehypeKatexPromote,
        [rehypeCrossRef, { collections }],
      ],
      jsx: true,
      outputFormat: 'function-body',
    });

    const vfile = new VFile({ value: plainMdx, path: 'test-plain.mdx' });
    const result = await processor.process(vfile);
    const code = String(result);

    expect(code).toContain('简短测试标题');
    expect(code).toContain('这是一段普通的文本段落');
  });
});
