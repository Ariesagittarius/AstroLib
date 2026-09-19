// scripts/vision_reconstruct/build_ch07.cjs
const fs = require('fs');
const path = require('path');
const katex = require('katex');

const part1 = require('./ch07_part1.cjs');
const part2 = require('./ch07_part2.cjs');
const part3 = require('./ch07_part3.cjs');

const ch07Questions = [...part1, ...part2, ...part3];

console.log(`Loaded ${ch07Questions.length} questions from 3 parts.`);

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

for (const q of ch07Questions) {
  testMath(q.content.stem, q.id, 'content.stem');
  if (q.content.options) {
    for (const opt of q.content.options) {
      testMath(opt.text, q.id, 'options.text');
    }
  }
  if (q.content.sub_questions) {
    for (const sub of q.content.sub_questions) {
      testMath(sub.stem, q.id, 'sub_questions.stem');
      testMath(sub.answer, q.id, 'sub_questions.answer');
    }
  }
  if (q.solution) {
    testMath(q.solution.answer, q.id, 'solution.answer');
    testMath(q.solution.hints, q.id, 'solution.hints');
    testMath(q.solution.steps, q.id, 'solution.steps');
  }
}

console.log(`Ch07 Total questions: ${ch07Questions.length}, KaTeX errors: ${errCount}`);

if (ch07Questions.length !== 42) {
  console.error(`Error: Expected exactly 42 questions, but got ${ch07Questions.length}`);
  process.exit(1);
}

if (errCount === 0) {
  const outDir = path.join(__dirname, '../../src/data/exercises/raw_lag');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  const outFile = path.join(outDir, 'ch07.json');
  fs.writeFileSync(outFile, JSON.stringify(ch07Questions, null, 2), 'utf-8');
  console.log(`Successfully saved Chapter 7 (${ch07Questions.length} questions) to ${outFile}`);
} else {
  console.error(`Build failed with ${errCount} KaTeX errors.`);
  process.exit(1);
}
