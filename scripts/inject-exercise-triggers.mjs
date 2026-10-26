import fs from 'node:fs';
import path from 'node:path';

const dir = 'src/content/docs/collections/math/engineering_analysis';
const files = fs.readdirSync(dir);

const sectionFiles = files.filter(f => /^(\d+)\.(\d+)_.*\.mdx$/.test(f));
console.log('Found', sectionFiles.length, 'section files.');

let modifiedCount = 0;

sectionFiles.forEach(file => {
  const fullPath = path.join(dir, file);
  let content = fs.readFileSync(fullPath, 'utf-8');

  const match = file.match(/^(\d+)\.(\d+)_(.+)\.mdx$/);
  if (!match) return;

  const ch = parseInt(match[1], 10);
  const sec = match[1] + '.' + match[2];
  let secTitle = match[3].replace(/_/g, ' ');

  const titleMatch = content.match(/title:\s*['"](.*?)['"]/);
  if (titleMatch) {
    secTitle = titleMatch[1];
  }

  if (!content.includes('ExerciseTrigger')) {
    const fmEnd = content.indexOf('---', 3);
    if (fmEnd !== -1) {
      const insertPos = fmEnd + 3;
      content = content.slice(0, insertPos) + "\nimport ExerciseTrigger from '@/components/exercises/ExerciseTrigger.astro';" + content.slice(insertPos);
    }
  }

  if (!content.includes('<ExerciseTrigger')) {
    const triggerTag = `\n\n<ExerciseTrigger chapter={${ch}} section="${sec}" title="${secTitle} 课后真题与自测练习" />\n`;
    content = content.trimEnd() + triggerTag;
  }

  fs.writeFileSync(fullPath, content, 'utf-8');
  modifiedCount++;
  console.log(`Updated ${file} -> chapter ${ch}, section ${sec}`);
});

console.log(`Successfully injected ExerciseTrigger into ${modifiedCount} files.`);
