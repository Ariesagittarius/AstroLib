/**
 * 图片资产与打包管线契约测试 (Image Asset Packaging & Integrity Contract)
 *
 * 守护目标：
 * 1. 《通信原理》及全站 MDX 章节中引用的所有本地图片资源，在磁盘上必须真实物理存在，杜绝 404 破图；
 * 2. 严格禁止在正文 MDX 中使用原生 HTML `<img src="./images/...">` 标签，
 *    确保 100% 采用 Astro 可识别的 Markdown 图片语法 `![alt](path)`，让 Vite 资产打包管线正常收集。
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

function walk(dir: string, list: string[] = []): string[] {
  if (!fs.existsSync(dir)) return list;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, list);
    else if (entry.name.endsWith('.mdx')) list.push(full);
  }
  return list;
}

describe('Image Asset Packaging & Integrity Contract (图片资产完整性与打包契约)', () => {
  const commDir = path.resolve('src/content/docs/collections/telecom/communication_principles');
  const allCommFiles = walk(commDir);
  const allDocsFiles = walk(path.resolve('src/content/docs'));

  it('《通信原理》全书 91 篇章节引用的所有本地高清配图在磁盘上必须 100% 存在 (零丢失资源)', () => {
    const missingImages: { file: string; line: number; ref: string; resolved: string }[] = [];
    let totalImages = 0;

    for (const file of allCommFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split(/\r?\n/);

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const matches = [...line.matchAll(/!\[.*?\]\((.*?)\)/g)];

        for (const m of matches) {
          const rawPath = (m[1] || '').trim();
          if (!rawPath || rawPath.startsWith('http://') || rawPath.startsWith('https://') || rawPath.startsWith('data:')) {
            continue;
          }

          totalImages++;
          const cleanPath = rawPath.split('?')[0].split('#')[0];
          const resolvedPath = path.resolve(path.dirname(file), cleanPath);

          if (!fs.existsSync(resolvedPath)) {
            missingImages.push({
              file: path.relative(process.cwd(), file).replace(/\\/g, '/'),
              line: i + 1,
              ref: rawPath,
              resolved: path.relative(process.cwd(), resolvedPath).replace(/\\/g, '/'),
            });
          }
        }
      }
    }

    expect(totalImages, '《通信原理》应包含全书物化的 200+ 高清图表').toBeGreaterThan(200);
    expect(missingImages, `《通信原理》中发现 ${missingImages.length} 处图片缺失:\n${JSON.stringify(missingImages, null, 2)}`).toEqual([]);
  });

  it('《通信原理》全书 MDX 必须 100% 采用 Markdown 图片语法，零原生 HTML <img src="./images/..."> 破损残留', () => {
    const disallowedHtmlImages: { file: string; line: number; tag: string }[] = [];

    for (const file of allCommFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split(/\r?\n/);

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const matches = [...line.matchAll(/<img\b[^>]*src=["'](.*?)["']/gi)];

        for (const m of matches) {
          const rawSrc = (m[1] || '').trim();
          if (rawSrc.startsWith('./') || rawSrc.startsWith('../') || rawSrc.includes('images/')) {
            disallowedHtmlImages.push({
              file: path.relative(process.cwd(), file).replace(/\\/g, '/'),
              line: i + 1,
              tag: m[0],
            });
          }
        }
      }
    }

    expect(disallowedHtmlImages, `《通信原理》发现 ${disallowedHtmlImages.length} 处未迁移的原生 HTML <img> 标签`).toEqual([]);
  });

  it('全站所有通过标准 Markdown 语法引用的本地配图在磁盘上必须物理存在', () => {
    const brokenRefs: { file: string; ref: string }[] = [];

    for (const file of allDocsFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const matches = [...content.matchAll(/!\[.*?\]\((\.?\/images\/[^)]+)\)/g)];

      for (const m of matches) {
        const rawPath = m[1].trim();
        const resolvedPath = path.resolve(path.dirname(file), rawPath);
        if (!fs.existsSync(resolvedPath)) {
          brokenRefs.push({
            file: path.relative(process.cwd(), file).replace(/\\/g, '/'),
            ref: rawPath,
          });
        }
      }
    }

    expect(brokenRefs, `全站发现 ${brokenRefs.length} 处 Markdown 语法引用的图片不存在:\n${JSON.stringify(brokenRefs, null, 2)}`).toEqual([]);
  });
});
