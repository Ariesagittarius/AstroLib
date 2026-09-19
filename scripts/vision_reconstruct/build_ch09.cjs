// scripts/vision_reconstruct/build_ch09.cjs
const fs = require('fs');
const path = require('path');
const katex = require('katex');

const part1 = require('./ch09_part1.cjs');
const part2 = require('./ch09_part2.cjs');

const ch09Questions = [...part1, ...part2];

// KaTeX 校验
let errCount = 0;
function testMath(str, qid, field) {
  if (!str) return;
  const matches = str.match(/\$\$([\s\S]+?)\$\$|\$([^\$]+?)\$/g) || [];
  for (const m of matches) {
    const raw = m.startsWith('$$') ? m.slice(2, -2).trim() : m.slice(1, -1).trim();
    try {
      katex.renderToString(raw, { output: 'html', throwOnError: true, strict: false });
    } catch (e) {
      console.error(`[KaTeX Error] ${qid} in ${field}: ${raw} -> ${e.message}`);
      errCount++;
    }
  }
}

for (const q of ch09Questions) {
  testMath(q.content.stem, q.id, 'content.stem');
  testMath(q.solution.answer, q.id, 'solution.answer');
  testMath(q.solution.hints, q.id, 'solution.hints');
  testMath(q.solution.steps, q.id, 'solution.steps');
  if (q.content.sub_questions) {
    for (const sub of q.content.sub_questions) {
      testMath(sub.stem, q.id, 'sub_questions.stem');
      testMath(sub.answer, q.id, 'sub_questions.answer');
    }
  }
}

console.log(`Ch09 Total questions: ${ch09Questions.length}, KaTeX errors: ${errCount}`);
if (errCount === 0 && ch09Questions.length === 20) {
  const outFile = path.join(__dirname, '../../src/data/exercises/raw_lag/ch09.json');
  fs.writeFileSync(outFile, JSON.stringify(ch09Questions, null, 2), 'utf-8');
  console.log(`Saved Chapter 9 to ${outFile}`);
} else {
  console.error(`Validation failed! Questions count: ${ch09Questions.length}, Errors: ${errCount}`);
  process.exit(1);
}
