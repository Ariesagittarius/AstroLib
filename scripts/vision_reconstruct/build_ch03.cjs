// scripts/vision_reconstruct/build_ch03.cjs
const fs = require('fs');
const path = require('path');
const katex = require('katex');

const part1 = require('./ch03_part1.cjs');
const part2 = require('./ch03_part2.cjs');
const part3 = require('./ch03_part3.cjs');

const ch03Questions = [...part1, ...part2, ...part3];

console.log(`Loaded ${ch03Questions.length} questions from 3 parts.`);

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

for (const q of ch03Questions) {
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

console.log(`Ch03 Total questions: ${ch03Questions.length}, KaTeX errors: ${errCount}`);

if (ch03Questions.length !== 45) {
  console.error(`Error: Expected exactly 45 questions, but got ${ch03Questions.length}`);
  process.exit(1);
}

if (errCount === 0) {
  const outDir = path.join(__dirname, '../../src/data/exercises/raw_lag');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  const outFile = path.join(outDir, 'ch03.json');
  fs.writeFileSync(outFile, JSON.stringify(ch03Questions, null, 2), 'utf-8');
  console.log(`Successfully saved Chapter 3 (${ch03Questions.length} questions) to ${outFile}`);
} else {
  console.error(`Build failed with ${errCount} KaTeX errors.`);
  process.exit(1);
}
