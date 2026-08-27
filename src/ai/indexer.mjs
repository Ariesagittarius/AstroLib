/**
 * src/ai/indexer.mjs
 * -----------------------------------------------------------------------------
 * 能力层原语：构建期把“一本书”的全部 MDX 切成语义片段，输出为该书索引对象，
 * 供 scripts/build-ai-index.mjs 写入 public/ai-index/<col>-<book>.json。
 *
 * 复用现有轮子：
 *   · cleanSlug（src/utils/sidebar.mjs）：与 Astro 内容集合一致的 slug 归一化，
 *     保证片段 url 与全站真实路由一致（杜绝手写 slug 404）；
 *   · chunkMdx（./chunker.mjs）：卡片/标题语义切分 + 卡片识别。
 *
 * 片段 url = /collections/<col>/<book>/<cleanSlug>/#<anchor>，anchor 用
 * encodeURIComponent 编码（与现有跨页索引一致），客户端解码后 getElementById
 * 即可精确跳转到源卡片。
 * =============================================================================
 */
import fs from 'node:fs';
import path from 'node:path';
import { cleanSlug } from '../utils/sidebar.mjs';
import { chunkMdx } from './chunker.mjs';

/** 递归收集目录下的 .mdx/.md 文件（复用首页/侧边栏同一套遍历） */
export function walkDir(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (entry === 'images') continue; // 忽略图片资源目录
      walkDir(full, fileList);
    } else if (/\.mdx?$/.test(entry)) {
      fileList.push(full);
    }
  }
  return fileList;
}

/**
 * 构建一本书的索引。
 * @param {{ colSlug:string, bookSlug:string, bookDir:string, modules?:object, title?:string }} params
 * @returns {{ meta:object, chunks:Array }}
 */
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

    // 相对 book 目录计算页面 slug（含可能的子文件夹），避免重复拼外层 collections/... 前缀
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
