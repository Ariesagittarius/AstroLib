import fs from 'node:fs';
import path from 'node:path';

const presets = ['scholarly', 'classic', 'international', 'mathematical', 'lecture'];

for (const p of presets) {
  const logPath = path.join('.tmp', 'typography-specimen', `specimen_${p}.log`);
  if (!fs.existsSync(logPath)) continue;
  const log = fs.readFileSync(logPath, 'utf8');

  const pagesMatch = log.match(/Output written on .*?\((\d+)\s+pages?/);
  const pages = pagesMatch ? pagesMatch[1] : 'unknown';

  const fontFamilies = new Set();
  const fontSpecMatches = log.matchAll(/Font family '([^']+)' created for font '([^']+)'/g);
  for (const m of fontSpecMatches) {
    fontFamilies.add(`${m[1]} -> ${m[2]}`);
  }

  const cjkWarnings = [];
  const lines = log.split('\n');
  for (const line of lines) {
    if (line.includes('Redefining CJKfamily')) {
      cjkWarnings.push(line.trim());
    }
  }

  console.log(`========================================`);
  console.log(`Preset: [${p.toUpperCase()}] (${pages} pages)`);
  console.log(`Registered font families:`);
  for (const f of fontFamilies) {
    console.log(`  - ${f}`);
  }
  if (cjkWarnings.length > 0) {
    console.log(`CJK family mappings:`);
    for (const w of cjkWarnings) {
      console.log(`  * ${w}`);
    }
  }
}
