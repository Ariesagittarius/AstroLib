// src/utils/sidebar.mjs
// 作用：递归扫描多合集图书目录，读取标题并执行高精度自然排序（Natural Sorting）与 Slug 净化
import fs from 'node:fs';
import path from 'node:path';
import { slug as githubSlug } from 'github-slugger';

/**
 * 原生自然排序辅助函数（确保 1.10 在 1.2 之后，1.1 在 10.1 之前）
 */
export function naturalSort(a, b) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

/**
 * 路由净化器：与 Astro 内容集合的默认 slug 生成规则保持完全一致。
 * Astro 的 glob loader 会对每个路径段调用 github-slugger（去掉标点/点、小写化、
 * 空格转连字符、保留下划线），因此侧边栏链接必须复刻同一套转换，
 * 否则链接与页面真实路由（如 2.5_... -> 25_自然对数的底-e-和-euler-常数-γ）不匹配而 404。
 */
export function cleanSlug(slug) {
  return slug
    .split('/')
    .map(segment => {
      // 剥离 LaTeX 宏与特殊字符（如 \mathbf{R}^n、\boldsymbol{x}、数学特殊定界符），避免反斜杠和裸代码泄露入 URL
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
