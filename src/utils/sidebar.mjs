import fs from 'node:fs';
import path from 'node:path';
import { slug as githubSlug } from 'github-slugger';

export function naturalSort(a, b) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

export function cleanSlug(slug) {
  return slug
    .split('/')
    .map(segment => {

      const sanitized = segment
        .replace(/\\(?:mathbf|boldsymbol|pmb|text|mathbb|mathrm)\{([^}]+)\}/g, '$1')
        .replace(/mathbf([A-Za-z])/g, '$1')
        .replace(/\\[a-zA-Z]+/g, '')
        .replace(/[\$\{\}\^\\]/g, '')
        .trim();
      return githubSlug(sanitized);
    })
    .join('/')
    .normalize();
}

export function generateBookSidebar(directoryPath) {
  const absolutePath = path.resolve(directoryPath);
  if (!fs.existsSync(absolutePath)) return [];

  const items = [];
  const files = fs.readdirSync(absolutePath);

  files.sort(naturalSort);

  files.forEach(file => {
    const fullPath = path.join(absolutePath, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {

      if (file !== 'images') {
        const subItems = generateBookSidebar(fullPath);
        if (subItems.length > 0) {
          items.push({
            label: file.replace(/^\d+[_-]/, '').replace(/_/g, ' '),
            collapsed: true,
            items: subItems
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
        label: title,
        link: slug
      });
    }
  });

  return items;
}
