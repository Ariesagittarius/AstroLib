// scripts/generate-epub.mjs
// 为所有图书生成“全书下载”EPUB3 文件，输出到 public/epub/<book-slug>.epub
// （astro build 会原样拷贝 public/ 到 dist/，因此这些文件可直接静态下载）
//
// 用法：
//   node scripts/generate-epub.mjs            # 生成全部图书
//   node scripts/generate-epub.mjs --only math_analysis   # 只生成指定 slug
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createZip } from './epub/zip.mjs';
import { renderChapter, renderTitleMath, plainTitle } from './epub/mdx-pipeline.mjs';
import { features } from '../src/config/features.config.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CONTENT_ROOT = path.join(ROOT, 'src', 'content', 'docs', 'collections');
const OUT_DIR = path.join(ROOT, 'public', 'epub');
const KATEX_DIR = path.join(ROOT, 'node_modules', 'katex', 'dist');
const PUB_COVERS = path.join(ROOT, 'public', 'covers');
const SITE_CSS = path.join(__dirname, 'epub', 'site.css');

// ---------------------------------------------------------------- 参数
const args = process.argv.slice(2);
const onlySlug = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;

// ---------------------------------------------------------------- 图书元数据（中央配置）
async function loadBookMeta() {
  const meta = new Map(); // `${colSlug}/${bookSlug}` -> { title, description, cover }
  const merge = (colSlug, book) => {
    if (!book?.slug) return;
    const key = `${colSlug}/${book.slug}`;
    if (!meta.has(key)) meta.set(key, { title: '', description: '', cover: '' });
    const m = meta.get(key);
    if (book.title) m.title = book.title;
    if (book.description) m.description = book.description;
    if (book.cover) m.cover = book.cover;
  };
  try {
    const mod = await import(pathToFileURL(path.join(ROOT, 'src', 'config', 'collections.config.mjs')).href);
    for (const col of mod.collections || []) {
      for (const book of col.books || []) merge(col.slug, book);
    }
  } catch (e) {
    console.warn(`[epub] 读取 collections.config.mjs 失败：`, e.message);
  }
  return meta;
}

// ---------------------------------------------------------------- 扫描图书目录
function scanBooks() {
  const books = [];
  for (const colName of fs.readdirSync(CONTENT_ROOT)) {
    const colDir = path.join(CONTENT_ROOT, colName);
    if (!fs.statSync(colDir).isDirectory()) continue;
    for (const bookName of fs.readdirSync(colDir)) {
      const bookDir = path.join(colDir, bookName);
      if (!fs.statSync(bookDir).isDirectory()) continue;
      const mdxFiles = fs
        .readdirSync(bookDir)
        .filter((f) => f.endsWith('.mdx') || f.endsWith('.md'))
        .sort(naturalSort);
      if (mdxFiles.length === 0) continue;
      books.push({ colSlug: colName, slug: bookName, dir: bookDir, mdxFiles });
    }
  }
  return books;
}

function naturalSort(a, b) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

// ---------------------------------------------------------------- 小工具
function sha256Hex(s) {
  return crypto.createHash('sha256').update(s).digest('hex');
}

function uuidFromSlug(slug) {
  const h = sha256Hex(slug);
  return `urn:uuid:${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
}

function escXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ---------------------------------------------------------------- 章节渲染（并发池）
async function renderAllChapters(book) {
  const jobs = book.mdxFiles.map((f, i) => ({ file: f, index: i }));
  const results = new Array(jobs.length);
  const concurrency = 12;
  let cursor = 0;

  async function worker() {
    while (cursor < jobs.length) {
      const job = jobs[cursor++];
      const source = fs.readFileSync(path.join(book.dir, job.file), 'utf8');
      try {
        const r = await renderChapter(source);
        if (!r.title) r.title = job.file.replace(/\.mdx?$/, '').replace(/^[\d._\- ]+/, '');
        results[job.index] = r;
      } catch (e) {
        console.error(`  [epub] 渲染失败 ${job.file}:`, e.message);
        results[job.index] = { title: job.file, body: `<p>（渲染失败：${escXml(e.message)}）</p>`, images: new Set() };
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, jobs.length) }, worker));
  return results;
}

// ---------------------------------------------------------------- 组装（异步主流程）
async function generateOneBook(book, meta) {
  const title = meta?.title || book.slug;
  const description = meta?.description || '';
  const uuid = uuidFromSlug(book.slug);
  const modified = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');

  console.log(`\n📚 生成 EPUB：${title}（${book.mdxFiles.length} 章）`);

  const chapters = await renderAllChapters(book);

  // 收集全部图片
  const imageFiles = new Map(); // name -> absolute path
  for (const ch of chapters) {
    for (const name of ch.images) {
      const abs = path.join(book.dir, 'images', name);
      if (fs.existsSync(abs) && !imageFiles.has(name)) imageFiles.set(name, abs);
    }
  }
  console.log(`   引用图片 ${imageFiles.size} 张`);

  // 封面（仅本地文件；远程 URL 不联网抓取）
  let coverName = null;
  if (meta?.cover && meta.cover.startsWith('/')) {
    const coverPath = path.join(ROOT, 'public', meta.cover.replace(/^\//, ''));
    if (fs.existsSync(coverPath)) coverName = path.basename(meta.cover);
  }

  // ---------- 组装 zip 条目 ----------
  const entries = [];
  entries.push({ name: 'mimetype', data: 'application/epub+zip', store: true });
  entries.push({
    name: 'META-INF/container.xml',
    data: `<?xml version="1.0" encoding="utf-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`,
  });

  // ---------- 章节 XHTML ----------
  const chapterFiles = []; // { id, href, title }
  chapters.forEach((ch, i) => {
    const num = String(i + 1).padStart(2, '0');
    const href = `text/ch${num}.xhtml`;
    const id = `ch${num}`;
    const titleHtml = renderTitleMath(ch.title);
    const body = `<h1 class="chapter-title">${titleHtml}</h1>\n${ch.body}`;
    const doc = xhtmlDoc(plainTitle(ch.title), body);
    chapterFiles.push({ href, id, title: ch.title });
    entries.push({ name: `OEBPS/${href}`, data: doc });
  });

  // ---------- 书名页 ----------
  const titleHref = 'text/title.xhtml';
  const titleBody = `
  <div class="title-page">
    <h1 class="book-title">${escXml(title)}</h1>
    ${description ? `<p class="book-desc">${escXml(description)}</p>` : ''}
    <p class="book-meta">数字化 EPUB 版 · 由「AstroLib」生成</p>
    <p class="book-meta">共 ${chapters.length} 章 · 公式以 KaTeX 排版</p>
  </div>`;
  entries.push({ name: `OEBPS/${titleHref}`, data: xhtmlDoc(title, titleBody) });

  // ---------- CSS ----------
  const katexCss = fs.readFileSync(path.join(KATEX_DIR, 'katex.min.css'), 'utf8');
  entries.push({ name: 'OEBPS/katex.min.css', data: katexCss });
  const siteCss = fs.readFileSync(SITE_CSS, 'utf8');
  entries.push({ name: 'OEBPS/css/site.css', data: siteCss });

  // ---------- KaTeX 字体（woff2 + woff，与 katex.min.css 的相对路径 fonts/ 对齐） ----------
  const fontDir = path.join(KATEX_DIR, 'fonts');
  let fontItems = [];
  if (fs.existsSync(fontDir)) {
    const fontFiles = fs.readdirSync(fontDir).filter((f) => /\.(woff2|woff)$/i.test(f)).sort();
    for (const f of fontFiles) {
      const data = fs.readFileSync(path.join(fontDir, f));
      entries.push({ name: `OEBPS/fonts/${f}`, data });
      fontItems.push({ id: `font-${f.replace(/[^a-zA-Z0-9]/g, '-')}`, href: `fonts/${f}`, media: /\.woff2$/i.test(f) ? 'font/woff2' : 'font/woff' });
    }
  }

  // ---------- 图片 ----------
  const imgItems = [];
  for (const [name, absPath] of imageFiles) {
    const data = fs.readFileSync(absPath);
    entries.push({ name: `OEBPS/images/${name}`, data });
    imgItems.push({
      id: `img-${name.replace(/[^a-zA-Z0-9]/g, '-')}`,
      href: `images/${name}`,
      media: /\.png$/i.test(name) ? 'image/png' : /\.gif$/i.test(name) ? 'image/gif' : 'image/jpeg',
    });
  }

  // ---------- 封面 ----------
  let coverItem = null;
  if (coverName) {
    const coverPath = path.join(PUB_COVERS, coverName);
    if (fs.existsSync(coverPath)) {
      const data = fs.readFileSync(coverPath);
      entries.push({ name: `OEBPS/covers/${coverName}`, data });
      coverItem = {
        id: 'cover-image',
        href: `covers/${coverName}`,
        media: /\.png$/i.test(coverName) ? 'image/png' : 'image/jpeg',
      };
    }
  }

  // ---------- nav.xhtml ----------
  const navItems = [
    `<li><a href="${titleHref}">书名页</a></li>`,
    ...chapterFiles.map((c) => `<li><a href="${c.href}">${escXml(plainTitle(c.title))}</a></li>`),
  ].join('\n      ');
  const nav = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="zh-CN" lang="zh-CN">
<head><title>目录</title></head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>目录</h1>
    <ol>
      ${navItems}
    </ol>
  </nav>
  <nav epub:type="landmarks" id="landmarks" hidden="hidden">
    <h2>导航</h2>
    <ol>
      <li><a epub:type="bodymatter" href="${chapterFiles[0]?.href || titleHref}">正文</a></li>
      <li><a epub:type="toc" href="nav.xhtml">目录</a></li>
    </ol>
  </nav>
</body>
</html>`;
  entries.push({ name: 'OEBPS/nav.xhtml', data: nav });

  // ---------- content.opf ----------
  const manifest = [
    `<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>`,
    `<item id="title" href="${titleHref}" media-type="application/xhtml+xml"/>`,
    ...chapterFiles.map((c) => `<item id="${c.id}" href="${c.href}" media-type="application/xhtml+xml"/>`),
    `<item id="katex-css" href="katex.min.css" media-type="text/css"/>`,
    `<item id="site-css" href="css/site.css" media-type="text/css"/>`,
    ...fontItems.map((f) => `<item id="${f.id}" href="${f.href}" media-type="${f.media}"/>`),
    ...imgItems.map((im) => `<item id="${im.id}" href="${im.href}" media-type="${im.media}"/>`),
    coverItem ? `<item id="${coverItem.id}" href="${coverItem.href}" media-type="${coverItem.media}" properties="cover-image"/>` : '',
  ].filter(Boolean).join('\n    ');

  const spine = [
    `<itemref idref="title"/>`,
    ...chapterFiles.map((c) => `<itemref idref="${c.id}"/>`),
  ].join('\n    ');

  const coverMeta = coverItem ? `<meta name="cover" content="cover-image"/>` : '';

  const opf = `<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="book-id" xml:lang="zh-CN">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="book-id">${uuid}</dc:identifier>
    <dc:title>${escXml(title)}</dc:title>
    <dc:language>zh-CN</dc:language>
    <dc:creator>AstroLib</dc:creator>
    <dc:publisher>AstroLib</dc:publisher>
    ${description ? `<dc:description>${escXml(description)}</dc:description>` : ''}
    <meta property="dcterms:modified">${modified}</meta>
    ${coverMeta}
  </metadata>
  <manifest>
    ${manifest}
  </manifest>
  <spine>
    ${spine}
  </spine>
</package>`;
  entries.push({ name: 'OEBPS/content.opf', data: opf });

  // ---------- 打包 ----------
  const zip = createZip(entries);
  const outFile = path.join(OUT_DIR, `${book.slug}.epub`);
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, zip);
  const mb = (zip.length / 1024 / 1024).toFixed(2);
  console.log(`   ✔ ${path.relative(ROOT, outFile)}  (${mb} MB)`);
  return { slug: book.slug, size: zip.length };
}

// ---------------------------------------------------------------- XHTML 文档外壳
function xhtmlDoc(title, body) {
  return `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="zh-CN" lang="zh-CN">
<head>
  <title>${escXml(title)}</title>
  <link rel="stylesheet" type="text/css" href="../katex.min.css"/>
  <link rel="stylesheet" type="text/css" href="../css/site.css"/>
</head>
<body>
${body}
</body>
</html>`;
}

// ---------------------------------------------------------------- 主流程
async function main() {
  if (!features.epub.enabled) {
    // 功能开关统一在 src/config/features.config.mjs：关闭 EPUB 则不生成（节省构建时间/体积）。
    console.log('[epub] 已跳过：EPUB 功能关闭（features.config.mjs 中 epub.enabled=false）。');
    return;
  }
  const meta = await loadBookMeta();
  const books = scanBooks();
  console.log(`发现 ${books.length} 本图书`);

  let count = 0;
  for (const book of books) {
    if (onlySlug && book.slug !== onlySlug) continue;
    const m = meta.get(`${book.colSlug}/${book.slug}`);
    await generateOneBook(book, m);
    count++;
  }
  console.log(`\n✅ 完成：${count} 本 EPUB 已输出到 ${path.relative(ROOT, OUT_DIR)}/`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
