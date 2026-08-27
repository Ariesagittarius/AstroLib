// scripts/build-inspector-data.mjs
// 构建期：为所有图书生成“全书卡片模块索引与速查数据”，输出到 public/inspector-data/<col>-<book>.json
// （astro build 会把 public/ 原样拷到 dist/，供客户端在生产环境下零运行时开销懒加载）。
//
// 开关：src/config/features.config.mjs 里 features.inspector.enabled —— 关闭则跳过生成。
// 用法：
//   node scripts/build-inspector-data.mjs                  # 生成全部图书
//   node scripts/build-inspector-data.mjs --only engineering_analysis   # 只生成指定 slug

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { features } from '../src/config/features.config.mjs';
import { collections } from '../src/config/collections.config.mjs';
import { scanBookModules, listAllBooks } from '../src/utils/module-inspector/scanner.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'public', 'inspector-data');

const args = process.argv.slice(2);
const onlySlug = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;

function main() {
  if (!features.inspector.enabled) {
    console.log('[inspector-data] 已跳过：模块索引与巡检功能关闭（features.config.mjs 中 inspector.enabled=false）。');
    return;
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  let totalModules = 0;
  let bookCount = 0;

  // 1. 生成全站图书列表
  const books = listAllBooks();
  fs.writeFileSync(path.join(OUT_DIR, 'books.json'), JSON.stringify({ ok: true, books }));

  // 2. 为每本书生成模块索引数据
  for (const col of collections) {
    for (const book of col.books || []) {
      if (onlySlug && book.slug !== onlySlug) continue;

      const data = scanBookModules(col.slug, book.slug);
      if (!data || !data.ok) {
        console.warn(`  ⚠ [${col.slug}/${book.slug}] 扫描失败: ${data?.message || '未知错误'}`);
        continue;
      }

      const outFile = path.join(OUT_DIR, `${col.slug}-${book.slug}.json`);
      fs.writeFileSync(outFile, JSON.stringify(data));

      totalModules += data.totalModules;
      bookCount++;

      console.log(`  ✔ [${col.slug}/${book.slug}] ${book.title} → ${path.relative(ROOT, outFile)} (${data.totalModules} 模块 / ${data.totalChapters} 章节)`);
    }
  }

  console.log(`\n✅ 模块索引速查数据构建完成：${bookCount} 本书、共 ${totalModules} 个卡片模块 → ${path.relative(ROOT, OUT_DIR)}/`);
}

main();
