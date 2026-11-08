import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = process.cwd();
const outputDir = path.join(ROOT, 'test/output');
const rebuildDir = path.join(ROOT, 'src/content/docs/collections/math/engineering_analysis_rebuild');

console.log('Assembling Section 2.5...');
const p2_5_chunks = [
  fs.readFileSync(path.join(outputDir, '2.5_batch_162_164.mdx'), 'utf-8'),
  fs.readFileSync(path.join(outputDir, '2.5_batch_165_167.mdx'), 'utf-8'),
  fs.readFileSync(path.join(outputDir, '2.5_batch_168_170.mdx'), 'utf-8'),
];

const header2_5 = `---
title: '2.5 Taylor定理及其应用'
---
import ExerciseTrigger from '@/components/exercises/ExerciseTrigger.astro';
import QRCodeVideo from '@/components/QRCodeVideo.astro';

import Guide from '@/components/Guide.astro';
import Knowledge from '@/components/Knowledge.astro';
import Example from '@/components/Example.astro';
import Analysis from '@/components/Analysis.astro';
import Solution from '@/components/Solution.astro';
import Variant from '@/components/Variant.astro';
import Note from '@/components/Note.astro';
import SideNote from '@/components/SideNote.astro';
import Block from '@/components/Block.astro';
import Method from '@/components/Method.astro';
import Exercise from '@/components/Exercise.astro';

用已知点的信息来表达未知点信息，用简单函数逼近（近似表示）复杂函数是数学中的重要思想方法。本节将要介绍的 Taylor 定理就是用高阶多项式来逼近具有足够可微性函数所得到的一个基本定理，它在理论研究和近似计算中有重要的应用。

`;

const footer2_5 = `\n\n<ExerciseTrigger chapter={2} section="2.5" title="2.5 Taylor定理及其应用 课后真题与自测练习" />\n`;

let body2_5 = p2_5_chunks.join('\n\n');

body2_5 = body2_5.replace(/^\$([^\$\n]+?\\tag\{[^\}\n]+\}[^\$\n]*?)\$$/gm, '$$\n$1\n$$');

const file2_5 = path.join(rebuildDir, '2.5_Taylor定理及其应用.mdx');
fs.writeFileSync(file2_5, header2_5 + body2_5.trim() + footer2_5, 'utf-8');
console.log('Saved Section 2.5 to', file2_5);

console.log('Assembling Section 2.6...');
const chunk1 = fs.readFileSync(path.join(outputDir, '2.5_batch_171_173.mdx'), 'utf-8');
const chunk2 = fs.readFileSync(path.join(outputDir, '2.5_batch_174_176.mdx'), 'utf-8');
const chunk3 = fs.readFileSync(path.join(outputDir, '2.5_batch_177_177.mdx'), 'utf-8');
const chunk4 = fs.readFileSync(path.join(outputDir, '2.6_batch_178_180.mdx'), 'utf-8');
let chunk5 = fs.readFileSync(path.join(outputDir, '2.6_batch_181_183.mdx'), 'utf-8');

const cutoffIndex = chunk5.indexOf('<Knowledge title="习题 2.6">');
if (cutoffIndex !== -1) {
  chunk5 = chunk5.slice(0, cutoffIndex).trim();
} else {
  const cutoffIndex2 = chunk5.indexOf('## 习题 2.6');
  if (cutoffIndex2 !== -1) chunk5 = chunk5.slice(0, cutoffIndex2).trim();
}

if (chunk5.endsWith('</Solution>') && !chunk5.includes('</Example>\n\n<Knowledge title="习题')) {
  chunk5 += '\n</Example>';
}

const header2_6 = `---
title: '2.6 函数性态的研究'
---
import ExerciseTrigger from '@/components/exercises/ExerciseTrigger.astro';
import QRCodeVideo from '@/components/QRCodeVideo.astro';

import Guide from '@/components/Guide.astro';
import Knowledge from '@/components/Knowledge.astro';
import Example from '@/components/Example.astro';
import Analysis from '@/components/Analysis.astro';
import Solution from '@/components/Solution.astro';
import Variant from '@/components/Variant.astro';
import Note from '@/components/Note.astro';
import SideNote from '@/components/SideNote.astro';
import Block from '@/components/Block.astro';
import Method from '@/components/Method.astro';
import Exercise from '@/components/Exercise.astro';

有了微分中值定理和 Taylor 公式，就可以利用导数来研究函数在区间上的变化性态。本节主要介绍它们在研究函数的单调性、极值与最值以及曲线的凹凸性等方面的应用。

`;

const footer2_6 = `\n\n<ExerciseTrigger chapter={2} section="2.6" title="2.6 函数性态的研究 课后真题与自测练习" />\n`;

let body2_6 = [chunk1, chunk2, chunk3, chunk4, chunk5].join('\n\n');
body2_6 = body2_6.replace(/^\$([^\$\n]+?\\tag\{[^\}\n]+\}[^\$\n]*?)\$$/gm, '$$\n$1\n$$');

const file2_6 = path.join(rebuildDir, '2.6_函数性态的研究.mdx');
fs.writeFileSync(file2_6, header2_6 + body2_6.trim() + footer2_6, 'utf-8');
console.log('Saved Section 2.6 to', file2_6);

console.log('\nValidating Section 2.5...');
execSync(`node scripts/scan-mdx.mjs "${file2_5}"`, { stdio: 'inherit' });

console.log('\nValidating Section 2.6...');
execSync(`node scripts/scan-mdx.mjs "${file2_6}"`, { stdio: 'inherit' });
