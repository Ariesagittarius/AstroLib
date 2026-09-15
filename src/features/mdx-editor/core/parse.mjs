import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMath from 'remark-math';
import * as remarkMdx from 'remark-mdx';

const mdxPlugin = remarkMdx.remarkMdx ?? remarkMdx.default ?? remarkMdx;

export const FM_RE = /^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/;

export function stripFrontmatter(content) {
  const m = content.match(FM_RE);
  if (!m) return { body: content, offset: 0 };
  const offset = (m[0].match(/\n/g) || []).length;
  return { body: content.slice(m[0].length), offset };
}

export function parseMdx(body) {
  return unified().use(remarkParse).use(mdxPlugin).use(remarkMath).parse(body);
}

export function parseFile(content) {
  const { body, offset } = stripFrontmatter(content);
  const mdast = parseMdx(body);
  return { mdast, body, offset };
}

export function lineOffsets(content) {
  const offs = [0];
  for (let i = 0; i < content.length; i++) {
    if (content.charCodeAt(i) === 10) offs.push(i + 1);
  }
  return offs;
}

export function detectEol(content) {
  const i = content.indexOf('\n');
  if (i > 0 && content[i - 1] === '\r') return '\r\n';
  return '\n';
}

export function lineText(content, offs, L) {
  const start = offs[L - 1];
  const end = offs[L] ?? content.length;
  return content.slice(start, end).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

export function linesText(content, offs, s, e) {
  const start = offs[s - 1];
  const end = offs[e] ?? content.length;
  return content.slice(start, end).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}
