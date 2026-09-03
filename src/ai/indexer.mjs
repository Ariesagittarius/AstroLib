import fs from 'node:fs';
import path from 'node:path';
import { cleanSlug } from '../utils/sidebar.mjs';
import { chunkMdx } from './chunker.mjs';

export function walkDir(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (entry === 'images') continue;
      walkDir(full, fileList);
    } else if (/\.mdx?$/.test(entry)) {
      fileList.push(full);
    }
  }
  return fileList;
}

export function buildBookIndex({ colSlug, bookSlug, bookDir, modules = {}, title = '' }) {
  const files = walkDir(bookDir);
  const chunks = [];
  const bookRootPath = `/collections/${colSlug}/${bookSlug}/`;

  for (const file of files) {
    let source;
    try {
      source = fs.readFileSync(file, 'utf-8');
    } catch (e) {
      console.warn(`[indexer] 读取失败 ${file}:`, e.message);
      continue;
    }

    const rel = path.relative(bookDir, file).replace(/\.mdx?$/, '').replace(/\\/g, '/');
    const pagePath = cleanSlug(rel);
    const pageUrl = `${bookRootPath}${pagePath}/`.replace(/\/+/g, '/');

    const fileChunks = chunkMdx({ source, modules });
    chunks.push(...fileChunks.map((c, i) => ({
      id: `${rel}-${i}`,
      kind: c.kind,
      type: c.type,
      title: c.title,
      number: c.number,
      text: c.text,
      url: c.anchor ? `${pageUrl}#${encodeURIComponent(c.anchor)}` : pageUrl,
      line: c.line,
    })));
  }

  return {
    meta: { col: colSlug, book: bookSlug, title, count: chunks.length, updatedAt: new Date().toISOString() },
    chunks,
  };
}
