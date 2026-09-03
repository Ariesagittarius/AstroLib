import fs from 'node:fs';
import path from 'node:path';
import { cleanSlug } from './sidebar.mjs';

function walkDir(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (file !== 'images' && file !== '.git') {
        walkDir(filePath, fileList);
      }
    } else if (file.endsWith('.mdx') || file.endsWith('.md')) {
      fileList.push({ filePath, mtimeMs: stat.mtimeMs });
    }
  });
  return fileList;
}

export function parseTitleDetails(rawTitle) {
  const emojiRegex = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\uFE0F]/gu;
  const cleanTitle = (rawTitle || '').replace(emojiRegex, '').trim();
  const match = cleanTitle.match(/^([^\d\s]+)\s*(\d+(?:\.\d+)*(?:[-－]\d+)?)(.*)$/);
  if (match) {
    const type = match[1].trim();
    const num = match[2].trim().replace(/－/g, '-');
    const extra = match[3].trim();
    return {
      type,
      num,
      extra,
      coreKey: `${type}${num}`.replace(/\s+/g, ''),
      fullKey: cleanTitle.replace(/\s+/g, ''),
      cleanTitle,
    };
  }
  return {
    type: '',
    num: '',
    extra: '',
    coreKey: cleanTitle.replace(/\s+/g, ''),
    fullKey: cleanTitle.replace(/\s+/g, ''),
    cleanTitle,
  };
}

const globalIndexMemoryCache = new Map();

export function buildGlobalBlockIndex(colSlug, bookSlug, force = false) {
  const globalBlockIndex = {};
  if (!colSlug || !bookSlug) return globalBlockIndex;

  const bookKey = `${colSlug}/${bookSlug}`;

  try {
    const docsRoot = path.resolve(`src/content/docs/collections/${colSlug}/${bookSlug}`);
    if (fs.existsSync(docsRoot)) {
      const allMdxFiles = walkDir(docsRoot);
      const signature = allMdxFiles.map((f) => `${f.filePath}:${f.mtimeMs}`).join('|');

      if (!force && globalIndexMemoryCache.has(bookKey)) {
        const cached = globalIndexMemoryCache.get(bookKey);
        if (cached && cached.signature === signature) {
          return cached.result;
        }
      }

      allMdxFiles.forEach(({ filePath: file }) => {
        const fileContent = fs.readFileSync(file, 'utf-8');
        const relativePath = path.relative('src/content/docs', file);
        const rawSlug = relativePath.replace(/\.mdx?$/, '').replace(/\\/g, '/');

        const cleanSlugPath = cleanSlug(rawSlug);
        let urlPath = `/${cleanSlugPath}/`;
        urlPath = urlPath.replace(/\/+/g, '/');

        const fmTitleMatch = fileContent.match(/^---\s*\n([\s\S]*?)\n---/);
        let chapterTitle = path.basename(file, path.extname(file));
        if (fmTitleMatch) {
          const fmTitle = fmTitleMatch[1].match(/title:\s*['"]?(.*?)['"]?$/m);
          if (fmTitle) chapterTitle = fmTitle[1].trim();
        }

        const tagRegex = /<(Example|Variant|Knowledge|Summary|Method|Conclusion|Block|Exercise|Solution)\s+title=["'](.*?)["']/g;
        let match;
        while ((match = tagRegex.exec(fileContent)) !== null) {
          const rawTitle = match[2].trim();
          const details = parseTitleDetails(rawTitle);

          const cleanId = encodeURIComponent(details.cleanTitle.replace(/\s+/g, '-'));
          const itemUrl = urlPath + '#' + cleanId;

          const candidate = {
            url: itemUrl,
            chapterTitle,
            rawTitle,
            cleanTitle: details.cleanTitle,
          };

          const keysToAdd = new Set([details.coreKey, details.fullKey]);
          keysToAdd.forEach((key) => {
            if (!key) return;
            if (!globalBlockIndex[key]) {
              globalBlockIndex[key] = [];
            }
            if (!globalBlockIndex[key].some((c) => c.url === candidate.url)) {
              globalBlockIndex[key].push(candidate);
            }
          });
        }
      });

      globalIndexMemoryCache.set(bookKey, { signature, result: globalBlockIndex });
    }
  } catch (e) {
    console.error('编译期全局索引构建失败', e);
  }

  return globalBlockIndex;
}
