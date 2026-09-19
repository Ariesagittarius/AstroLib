import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { collections } from '../src/config/collections.config.mjs';
import { buildGlobalBlockIndex } from '../src/core/indexing/cross-ref-indexer.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'public', 'data', 'cross-ref');

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  let totalKeys = 0;
  let bookCount = 0;

  for (const col of collections) {
    for (const book of col.books || []) {
      const indexData = buildGlobalBlockIndex(col.slug, book.slug);
      if (!indexData || Object.keys(indexData).length === 0) continue;

      const outFile = path.join(OUT_DIR, `${col.slug}-${book.slug}.json`);
      fs.writeFileSync(outFile, JSON.stringify(indexData));

      const keys = Object.keys(indexData).length;
      totalKeys += keys;
      bookCount++;

      const sizeKb = (fs.statSync(outFile).size / 1024).toFixed(1);
      console.log(`  ✔ [${col.slug}/${book.slug}] ${book.title} → ${path.relative(ROOT, outFile)} (${keys} 索引项 / ${sizeKb} KB)`);
    }
  }

  console.log(`\n✅ 全局跨页引用索引构建完成：${bookCount} 本书、共 ${totalKeys} 条引用条目 → ${path.relative(ROOT, OUT_DIR)}/`);
}

main();
