import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
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
  console.log('  📦 AstroLib 离线数据包打包器 (Gzip Compressed & Per-Book Packs)');
  console.log('===================================================================\n');

  if (!fs.existsSync(DIST_COLLECTIONS)) {
    console.error('❌ 未找到 dist/collections 构建产物，请先运行 npm run build！');
    process.exit(1);
  }

  if (!fs.existsSync(OUT_DIR_DIST)) {
    fs.mkdirSync(OUT_DIR_DIST, { recursive: true });
  }

  const legacyAllJson = path.join(OUT_DIR_DIST, 'astrolib-all.json');
  if (fs.existsSync(legacyAllJson)) {
    try {
      fs.unlinkSync(legacyAllJson);
      console.log('  🧹 已清理历史遗留的超大未压缩包 astrolib-all.json (>100MB)');
    } catch {}
  }

  const manifest = {
    version: '1.1.0',
    generatedAt: new Date().toISOString(),
    books: [],
    allRoutes: []
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
      manifest.allRoutes.push(...Object.keys(bookArticles));

      const bookPackData = {
        bookId: book.id,
        title: book.title,
        colSlug: col.slug,
        bookSlug: book.slug,
        total: count,
        articles: bookArticles
      };

      const bookJson = JSON.stringify(bookPackData);
      const bookRawBytes = Buffer.byteLength(bookJson, 'utf8');
      const bookRawMb = (bookRawBytes / (1024 * 1024)).toFixed(2);

      const bookGzBuffer = zlib.gzipSync(Buffer.from(bookJson, 'utf8'), { level: 9 });
      const bookGzMb = (bookGzBuffer.length / (1024 * 1024)).toFixed(2);
      const bookGzFileName = `${col.slug}-${book.slug}.json.gz`;
      fs.writeFileSync(path.join(OUT_DIR_DIST, bookGzFileName), bookGzBuffer);

      const bookRawFileName = `${col.slug}-${book.slug}.json`;
      if (Number(bookRawMb) < 85) {
        fs.writeFileSync(path.join(OUT_DIR_DIST, bookRawFileName), bookJson, 'utf8');
      } else {
        const staleRaw = path.join(OUT_DIR_DIST, bookRawFileName);
        if (fs.existsSync(staleRaw)) {
          try { fs.unlinkSync(staleRaw); } catch {}
        }
      }

      manifest.books.push({
        id: book.id,
        title: book.title,
        colSlug: col.slug,
        bookSlug: book.slug,
        count,
        packFileName: bookGzFileName,
        rawPackFileName: Number(bookRawMb) < 85 ? bookRawFileName : undefined,
        sizeMb: bookGzMb,
        rawSizeMb: bookRawMb
      });

      console.log(`  ✔ 《${book.title}》 (${col.slug}/${book.slug}) → ${bookGzFileName} (${count} 篇, Gzip: ${bookGzMb} MB / 原始: ${bookRawMb} MB)`);
    }
  }

  console.log(`\n📦 正在合成全站 Gzip 压缩汇总包 (astrolib-all.json.gz)...`);
  const allPackData = {
    version: '1.1.0',
    generatedAt: new Date().toISOString(),
    total: totalArticles,
    articles: allArticles
  };
  const allJson = JSON.stringify(allPackData);
  const allRawMb = (Buffer.byteLength(allJson, 'utf8') / (1024 * 1024)).toFixed(2);

  const allGzBuffer = zlib.gzipSync(Buffer.from(allJson, 'utf8'), { level: 9 });
  const allGzMb = (allGzBuffer.length / (1024 * 1024)).toFixed(2);
  const allGzFileName = 'astrolib-all.json.gz';
  fs.writeFileSync(path.join(OUT_DIR_DIST, allGzFileName), allGzBuffer);
  console.log(`  ✔ 全站总包已生成: ${allGzFileName} (共 ${totalArticles} 篇, Gzip: ${allGzMb} MB / 原始: ${allRawMb} MB)`);

  manifest.totalArticles = totalArticles;
  manifest.allPackFileName = allGzFileName;
  manifest.allSizeMb = allGzMb;
  manifest.allRawSizeMb = allRawMb;
  fs.writeFileSync(path.join(OUT_DIR_DIST, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
  console.log(`  ✔ 离线数据清单已写入: dist/offline-packs/manifest.json`);

  console.log('\n🎉 所有离线包构建与 Gzip 优化完成！同源直接分发，无 CORS 限制，合规 Vercel 静态部署。');
}

main().catch(console.error);
