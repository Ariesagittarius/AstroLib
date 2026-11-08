const fs = require('fs');
const path = require('path');
const katex = require('katex');

const part1 = require('./ch04_part1.cjs');
const part2 = require('./ch04_part2.cjs');

const ch04Questions = [...part1, ...part2];

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

for (const q of ch04Questions) {
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

console.log(`Ch04 Total questions: ${ch04Questions.length}, KaTeX errors: ${errCount}`);
if (errCount === 0) {
  const outFile = path.join(__dirname, '../../src/data/exercises/raw_lag/ch04.json');
  fs.writeFileSync(outFile, JSON.stringify(ch04Questions, null, 2), 'utf-8');
  console.log(`Saved Chapter 4 to ${outFile}`);
} else {
  process.exit(1);
}
