import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { collections } from '../src/config/collections.config.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT, 'dist');
const DIST_COLLECTIONS = path.join(DIST_DIR, 'collections');
const OUT_DIR_DIST = path.join(DIST_DIR, 'offline-packs');

function findHtmlFiles(dir, baseDir, map = {}) {
  if (!fs.existsSync(dir)) return map;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findHtmlFiles(fullPath, baseDir, map);
    } else if (entry.isFile() && entry.name === 'index.html') {
      const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
      const routePath = '/' + relPath.replace(/\/index\.html$/, '/');
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        map[routePath] = content;
      } catch (err) {
        console.warn(`[offline-pack] 读取文件失败: ${fullPath}`, err.message);
      }
    }
  }
  return map;
}

async function main() {
  console.log('\n===================================================================');
  console.log('  📦 AstroLib 离线数据包打包器 (Per-Book & Global Packs)');
  console.log('===================================================================\n');

  if (!fs.existsSync(DIST_COLLECTIONS)) {
    console.error('❌ 未找到 dist/collections 构建产物，请先运行 npm run build！');
    process.exit(1);
  }

  if (!fs.existsSync(OUT_DIR_DIST)) {
    fs.mkdirSync(OUT_DIR_DIST, { recursive: true });
  }

  const manifest = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    books: []
  };

  const allArticles = {};
  let totalArticles = 0;

  for (const col of collections) {
    for (const book of col.books || []) {
      const bookDistDir = path.join(DIST_COLLECTIONS, col.slug, book.slug);
      if (!fs.existsSync(bookDistDir)) continue;

      const bookArticles = findHtmlFiles(bookDistDir, DIST_DIR);
      const count = Object.keys(bookArticles).length;
      totalArticles += count;

      Object.assign(allArticles, bookArticles);

      const bookPackFileName = `${col.slug}-${book.slug}.json`;
      const bookPackData = {
        bookId: book.id,
        title: book.title,
        colSlug: col.slug,
        bookSlug: book.slug,
        total: count,
        articles: bookArticles
      };

      const bookJson = JSON.stringify(bookPackData);
      const bookSizeMb = (Buffer.byteLength(bookJson, 'utf8') / (1024 * 1024)).toFixed(2);
      fs.writeFileSync(path.join(OUT_DIR_DIST, bookPackFileName), bookJson, 'utf8');

      manifest.books.push({
        id: book.id,
        title: book.title,
        colSlug: col.slug,
        bookSlug: book.slug,
        count,
        packFileName: bookPackFileName,
        sizeMb: bookSizeMb
      });

      console.log(`  ✔ 《${book.title}》 (${col.slug}/${book.slug}) → ${bookPackFileName} (${count} 篇, ${bookSizeMb} MB)`);
    }
  }

  // 写入全站总包
  console.log(`\n📦 正在合成全站汇总离线包 (astrolib-all.json)...`);
  const allPackData = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    total: totalArticles,
    articles: allArticles
  };
  const allJson = JSON.stringify(allPackData);
  const allSizeMb = (Buffer.byteLength(allJson, 'utf8') / (1024 * 1024)).toFixed(2);
  fs.writeFileSync(path.join(OUT_DIR_DIST, 'astrolib-all.json'), allJson, 'utf8');
  console.log(`  ✔ 全站总包已生成: astrolib-all.json (共 ${totalArticles} 篇, ${allSizeMb} MB)`);

  // 写入清单文件
  manifest.totalArticles = totalArticles;
  manifest.allPackFileName = 'astrolib-all.json';
  manifest.allSizeMb = allSizeMb;
  fs.writeFileSync(path.join(OUT_DIR_DIST, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
  console.log(`  ✔ 离线数据清单已写入: dist/offline-packs/manifest.json`);

  console.log('\n🎉 所有离线包构建完成！可作为 Release 附件直接发布至 GitHub Releases。');
}

main().catch(console.error);
