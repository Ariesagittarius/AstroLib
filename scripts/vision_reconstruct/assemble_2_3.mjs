import fs from 'node:fs';
import path from 'node:path';

const part1Path = path.join(process.cwd(), 'test/output/2.3_batch_141_143.mdx');
const part2Path = path.join(process.cwd(), 'test/output/2.3_batch_144_146.mdx');
const targetPath = path.join(
  process.cwd(),
  'src/content/docs/collections/math/engineering_analysis_rebuild/2.3_微分.mdx'
);

let part1 = fs.readFileSync(part1Path, 'utf-8');
let part2 = fs.readFileSync(part2Path, 'utf-8');

// Normalize headings from # 3.x to ## 3.x
part1 = part1.replace(/^#\s*3\./gm, '## 3.');
part2 = part2.replace(/^#\s*3\./gm, '## 3.');

// Fix the unclosed Knowledge tag around line 55 in part2
part2 = part2.replace(
  /在 \(3\.3\) 式中，取 \$x_0=0\$[\s\S]*?<\/Knowledge>/,
  `<Knowledge title="常用近似计算公式">
在 (3.3) 式中，取 $x_0=0$，当 $|\\Delta x| = |x|$ 充分小时，有
$$
f(x) \\approx f(0) + f'(0)x.
$$
由此容易得到下面一些常用的近似公式：当 $|x| \\ll 1$ 时，
$$
e^x \\approx 1+x, \\quad \\sin x \\approx x, \\quad \\tan x \\approx x, \\quad (1+x)^\\alpha \\approx 1+\\alpha x, \\quad \\ln(1+x) \\approx x. \\tag{3.5}
$$
</Knowledge>`
);

// Strip trailing divider ***
part2 = part2.replace(/\r?\n\*\*\*\s*$/, '');

const header = `---
title: '2.3 微分'
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

微分是与导数密切相关又有本质区别的一个重要概念。本节主要介绍微分的概念、计算及简单应用，说明在“微小局部”用线性函数代替非线性函数是微积分的基本思想方法之一。

`;

const footer = `\n\n<ExerciseTrigger chapter={2} section="2.3" title="2.3 微分 课后真题与自测练习" />\n`;

const fullContent = header + part1.trim() + '\n\n' + part2.trim() + footer;
fs.writeFileSync(targetPath, fullContent, 'utf-8');
console.log('Successfully written to', targetPath);
