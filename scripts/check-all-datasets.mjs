import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const EX_DIR = path.join(ROOT, 'src', 'data', 'exercises');

const files = fs.readdirSync(EX_DIR).filter(f => f.endsWith('.json'));
console.log('JSON files in exercises:', files);

for (const f of files) {
  const content = JSON.parse(fs.readFileSync(path.join(EX_DIR, f), 'utf8'));
  if (content.chapters) {
    let count = 0;
    for (const ql of Object.values(content.chapters)) count += ql.length;
    console.log(`${f}: ${count} questions (chapters format)`);
  } else if (content.questions) {
    console.log(`${f}: ${content.questions.length} questions (questions array format)`);
  } else if (Array.isArray(content)) {
    console.log(`${f}: ${content.length} items (array format)`);
  } else {
    console.log(`${f}: object with keys ${Object.keys(content).slice(0, 5).join(', ')}`);
  }
}
