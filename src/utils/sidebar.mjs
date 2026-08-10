// src/utils/sidebar.mjs
// 作用：递归扫描多合集图书目录，读取标题并执行高精度自然排序（Natural Sorting）与 Slug 净化
import fs from 'node:fs';
import path from 'node:path';

/**
 * 原生自然排序辅助函数（确保 1.10 在 1.2 之后，1.1 在 10.1 之前）
 */
export function naturalSort(a, b) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

/**
 * 路由净化器：
 * 1. 自动剥离各个路径段开头的排序前缀数字（如 18_1.3_ -> 1.3_），与 Starlight 底层生成规则同步
 * 2. 核心改进：根据 Starlight 路由特性，精准删除路径中所有的点 "."，但绝不改动下划线 "_"
 */
export function cleanSlug(slug) {
  return slug
    .split('/')
    .map(segment => {
      // 1. 先剥离物理排序数字前缀
      let cleaned = segment.replace(/^\d+[_-]/, '');
      // 2. 核心：删除所有点 "."，保留下划线 "_"
      cleaned = cleaned.replace(/\./g, '');
      return cleaned;
    })
    .join('/');
}

export function generateBookSidebar(directoryPath) {
  const absolutePath = path.resolve(directoryPath);
  if (!fs.existsSync(absolutePath)) return [];

  const items = [];
  const files = fs.readdirSync(absolutePath);

  // 核心：使用自然排序算法对文件名执行高精度排序
  files.sort(naturalSort);

  files.forEach(file => {
    const fullPath = path.join(absolutePath, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // 如果是嵌套子文件夹，递归生成子侧边栏目录
      if (file !== 'images') { // 忽略图片文件夹
        const subItems = generateBookSidebar(fullPath);
        if (subItems.length > 0) {
          items.push({
            label: file.replace(/^\d+[_-]/, '').replace(/_/g, ' '), // 格式化子文件夹名称
            collapsed: true,
            items: subItems
          });
        }
      }
    } else if (file.endsWith('.mdx') || file.endsWith('.md')) {
      // 如果是 mdx 文件，读取其 Frontmatter 里的真实 title
      const content = fs.readFileSync(fullPath, 'utf-8');
      const titleMatch = content.match(/title:\s*['"](.*?)['"]/);
      const title = titleMatch ? titleMatch[1] : path.basename(file, path.extname(file));

      const relativePath = path.relative('src/content/docs', fullPath);
      const rawSlug = relativePath.replace(/\.mdx?$/, '').replace(/\\/g, '/');
      
      // 净化路由 Slug，将包含点的路径完美归一
      const slug = cleanSlug(rawSlug);

      items.push({
        label: title,
        link: slug
      });
    }
  });

  return items;
}