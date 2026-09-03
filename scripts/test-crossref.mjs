import { createProcessor } from '@mdx-js/mdx';
import { VFile } from 'vfile';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import fs from 'node:fs';
import path from 'node:path';
import { rehypeKatexAnnotate, rehypeKatexPromote } from '../src/utils/rehype-katex-source.mjs';
import { rehypeCrossRef } from '../src/utils/rehype-cross-ref.mjs';
import { collections } from '../src/config/collections.config.mjs';

const target = process.argv[2] || 'src/content/docs/collections/math/engineering_analysis/1.5_连续函数.mdx';
const file = path.resolve(target);
const content = fs.readFileSync(file, 'utf-8');
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

const vfile = new VFile({ value: body, path: file });
const result = await processor.process(vfile);
const code = String(result);

const stats = {
  totalKB: Math.round(code.length / 1024),
  xrefBuilt: code.includes('data-xref-built'),
  blockBadges: (code.match(/block-ref-badge/g) || []).length,
  interactiveBlock: (code.match(/block-ref-badge interactive-badge/g) || []).length,
  figBadges: (code.match(/fig-ref-badge/g) || []).length,
  interactiveFig: (code.match(/fig-ref-badge interactive-badge/g) || []).length,
  figTargetCaption: (code.match(/fig-target-caption/g) || []).length,
};
console.log(JSON.stringify(stats, null, 2));

const idx = code.indexOf('block-ref-badge');
if (idx >= 0) {
  console.log('--- first badge context ---');
  console.log(code.slice(Math.max(0, idx - 80), idx + 320).replace(/\s+/g, ' '));
}
