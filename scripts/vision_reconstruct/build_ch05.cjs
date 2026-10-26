const fs = require('fs');
const path = require('path');
const katex = require('katex');

const { ch05QuestionsPart1 } = require('./ch05_data_part1.cjs');
const { ch05QuestionsPart2 } = require('./ch05_data_part2.cjs');

const ch05Questions = [...ch05QuestionsPart1, ...ch05QuestionsPart2];

console.log(`Loaded ${ch05Questions.length} questions.`);

if (ch05Questions.length !== 20) {
  console.error(`Expected exactly 20 questions, but found ${ch05Questions.length}.`);
  process.exit(1);
}

for (let i = 0; i < 20; i++) {
  const expectedId = `LAG-TB-CH05-Q${String(i + 1).padStart(2, '0')}`;
  if (ch05Questions[i].id !== expectedId) {
    console.error(`Question at index ${i} has id ${ch05Questions[i].id}, expected ${expectedId}`);
    process.exit(1);
  }
}

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

for (const q of ch05Questions) {
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

console.log(`Ch05 Total questions: ${ch05Questions.length}, KaTeX errors: ${errCount}`);

if (errCount === 0) {
  const outDir = path.join(__dirname, '../../src/data/exercises/raw_lag');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  const outFile = path.join(outDir, 'ch05.json');
  fs.writeFileSync(outFile, JSON.stringify(ch05Questions, null, 2), 'utf-8');
  console.log(`Successfully saved Chapter 5 exercises to ${outFile}`);
} else {
  console.error(`Failed with ${errCount} KaTeX errors.`);
  process.exit(1);
}
