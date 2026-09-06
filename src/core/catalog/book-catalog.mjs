// src/core/catalog/book-catalog.mjs
import fs from 'node:fs';
import path from 'node:path';
import { naturalSort } from '../../utils/natural-sort.mjs';
import { cleanSlug } from '../../utils/slug.mjs';

/**
 * @typedef {Object} CatalogChapterNode
 * @property {'chapter'} type
 * @property {string} title
 * @property {string} slug
 * @property {string} filePath
 *
 * @typedef {Object} CatalogGroupNode
 * @property {'group'} type
 * @property {string} title
 * @property {Array<CatalogChapterNode | CatalogGroupNode>} children
 *
 * @typedef {Array<CatalogChapterNode | CatalogGroupNode>} BookCatalog
 */

/**
 * 递归扫描教材目录，构建纯粹的教材目录领域模型树（Domain Catalog Tree）
 * 遵循 Rule 1（UI is not a domain model）：
 * 绝对不包含任何 Starlight UI 展示属性（如 collapsed, label, link 等）。
 *
 * @param {string} directoryPath - 教材物理文件夹路径
 * @returns {BookCatalog}
 */
export function buildBookCatalog(directoryPath) {
  const absolutePath = path.resolve(directoryPath);
  if (!fs.existsSync(absolutePath)) return [];

  const items = [];
  const files = fs.readdirSync(absolutePath);

  // 核心：使用自然排序算法对文件名执行高精度排序
  files.sort(naturalSort);

  for (const file of files) {
    const fullPath = path.join(absolutePath, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // 如果是嵌套子文件夹，递归生成子领域目录
      if (file !== 'images' && file !== '.git') {
        const subItems = buildBookCatalog(fullPath);
        if (subItems.length > 0) {
          items.push({
            type: 'group',
            title: file.replace(/^\d+[_-]/, '').replace(/_/g, ' '),
            children: subItems,
          });
        }
      }
    } else if (file.endsWith('.mdx') || file.endsWith('.md')) {
      // 如果是 mdx/md 文件，读取其 Frontmatter 里的真实 title
      const content = fs.readFileSync(fullPath, 'utf-8');
      const titleMatch = content.match(/title:\s*['"](.*?)['"]/);
      const title = titleMatch ? titleMatch[1] : path.basename(file, path.extname(file));

      const relativePath = path.relative('src/content/docs', fullPath);
      const rawSlug = relativePath.replace(/\.mdx?$/, '').replace(/\\/g, '/');
      const slug = cleanSlug(rawSlug);

      items.push({
        type: 'chapter',
        title,
        slug,
        filePath: relativePath.replace(/\\/g, '/'),
      });
    }
  }

  return items;
}
