import fs from 'node:fs';
import path from 'node:path';
import { naturalSort } from '../../utils/natural-sort.mjs';
import { cleanSlug } from '../../utils/slug.mjs';

export function buildBookCatalog(directoryPath) {
  const absolutePath = path.resolve(directoryPath);
  if (!fs.existsSync(absolutePath)) return [];

  const items = [];
  const files = fs.readdirSync(absolutePath);

  files.sort(naturalSort);

  for (const file of files) {
    const fullPath = path.join(absolutePath, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {

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
