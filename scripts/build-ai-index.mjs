import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { features } from '../src/config/features.config.mjs';
import { collections } from '../src/config/collections.config.mjs';
import { buildBookIndex } from '../src/ai/indexer.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const COLLECTION_ROOT = path.join(ROOT, 'src', 'content', 'docs', 'collections');
const OUT_DIR = path.join(ROOT, 'public', 'ai-index');

const args = process.argv.slice(2);
const onlySlug = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;

function main() {
  if (!features.aiAsk.enabled) {
    console.log('[ai-index] 已跳过：AI 智能问答功能关闭（features.config.mjs 中 aiAsk.enabled=false）。');
    return;
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  let total = 0;
  let books = 0;

  for (const col of collections) {
    for (const book of col.books || []) {
      if (onlySlug && book.slug !== onlySlug) continue;
      const bookDir = path.join(COLLECTION_ROOT, col.slug, book.slug);
      if (!fs.existsSync(bookDir)) continue;

      const idx = buildBookIndex({
        colSlug: col.slug,
        bookSlug: book.slug,
        bookDir,
        modules: book.modules || {},
        title: book.title,
      });

      const outFile = path.join(OUT_DIR, `${col.slug}-${book.slug}.json`);
      fs.writeFileSync(outFile, JSON.stringify(idx));
      total += idx.chunks.length;
      books++;
      console.log(`  ✔ ${col.slug}/${book.slug} → ${path.relative(ROOT, outFile)}（${idx.chunks.length} 片段）`);
    }
  }

  console.log(`\n✅ AI 索引完成：${books} 本、共 ${total} 片段 → ${path.relative(ROOT, OUT_DIR)}/`);
}

main();
