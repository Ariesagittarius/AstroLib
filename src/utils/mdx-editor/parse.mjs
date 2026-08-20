/**
 * mdx-editor/parse：MDX 源码解析与行号空间换算。
 *
 * 行号空间约定（全工具统一）：
 *   - 注入插件（rehype-editor-annotate）与写回端都在"剥离 frontmatter 后的
 *     body 行号空间"工作（Astro 编译 MDX 时已剥离 frontmatter）；
 *   - 仅在真正写盘时把 body 行号换算为全文行号（body 行号 + frontmatter 行数）。
 */

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMath from 'remark-math';
import * as remarkMdx from 'remark-mdx';

const mdxPlugin = remarkMdx.remarkMdx ?? remarkMdx.default ?? remarkMdx;

/** frontmatter：--- 开头、--- 结尾（可带尾部换行） */
export const FM_RE = /^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/;

/**
 * 剥离 frontmatter，返回 { body, offset }：
 * offset = frontmatter 占用的行数，全文第 L 行 = body 第 (L - offset) 行，
 * 即 body 行号 + offset = 全文行号。
 * 注意：offset 按换行符计数（`---\ntitle\n---\n` 是 3 行），尾部换行不算一行。
 */
export function stripFrontmatter(content) {
  const m = content.match(FM_RE);
  if (!m) return { body: content, offset: 0 };
  const offset = (m[0].match(/\n/g) || []).length;
  return { body: content.slice(m[0].length), offset };
}

/** 解析 body 为 mdast（remark-parse + remark-mdx + remark-math，与构建同款） */
export function parseMdx(body) {
  return unified().use(remarkParse).use(mdxPlugin).use(remarkMath).parse(body);
}

/** 解析全文（自动剥离 frontmatter），返回 { mdast, body, offset } */
export function parseFile(content) {
  const { body, offset } = stripFrontmatter(content);
  const mdast = parseMdx(body);
  return { mdast, body, offset };
}

/** 全文 → 每行起始 offset（1-based 行号） */
export function lineOffsets(content) {
  const offs = [0];
  for (let i = 0; i < content.length; i++) {
    if (content.charCodeAt(i) === 10) offs.push(i + 1);
  }
  return offs;
}

/** 检测文件主行尾符：'\r\n' 或 '\n'（按首个换行判断） */
export function detectEol(content) {
  const i = content.indexOf('\n');
  if (i > 0 && content[i - 1] === '\r') return '\r\n';
  return '\n';
}

/** 提取第 L 行文本（1-based，不含行尾符；\r\n 归一为 \n） */
export function lineText(content, offs, L) {
  const start = offs[L - 1];
  const end = offs[L] ?? content.length;
  return content.slice(start, end).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

/** 提取 [s, e] 行区间文本（1-based 含两端，\r\n 归一为 \n） */
export function linesText(content, offs, s, e) {
  const start = offs[s - 1];
  const end = offs[e] ?? content.length;
  return content.slice(start, end).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}
