/**
 * 将普通文本中的非公式独立英文词块包装为行内公式 $...$（严格保护 imports, exports, JSX, LaTeX 与代码）
 */
export function convertEnglishToMath(text: string): { text: string; count: number } {
  // 匹配所有需严格保护的结构：
  // 1. Frontmatter: ^---\n...\n---
  // 2. ESM import/export 语句: import ... from '...'; 或 export ...
  // 3. 行间公式: $$...$$
  // 4. 行内公式: $...$
  // 5. 代码块: ```...```
  // 6. 行内代码: `...`
  // 7. JSX / HTML 标签与组件 (含跨行与属性): <Tag ...> 或 </Tag> 或 <Tag />
  // 8. Markdown 图片: ![alt](url)
  // 9. Markdown 链接: [text](url)
  // 10. HTML 注释: <!-- ... -->
  // 11. HTML 实体: &...;
  const pattern = /(^---\r?\n[\s\S]*?\r?\n---|(?:^|\n)\s*(?:import|export)\s+[\s\S]*?(?:;(?=\r?\n|$)|(?=\r?\n\r?\n|$))|\$\$[\s\S]*?\$\$|\$(?:\\\$|[^\$\n])+?\$|```[\s\S]*?```|`[^`\n]+?`|<(?:\/?[a-zA-Z][a-zA-Z0-9_\-\.:]*)(?:\s+[\s\S]*?)?>|!\[[^\]]*\]\([^)]+\)|\[[^\]]+\]\([^)]+\)|<!--[\s\S]*?-->|&[a-zA-Z0-9#]+;)/g;
  let lastIdx = 0;
  const segments: Array<{ type: 'protected' | 'text'; val: string }> = [];
  let m: RegExpExecArray | null;
  let count = 0;
  while ((m = pattern.exec(text)) !== null) {
    if (m.index > lastIdx) {
      segments.push({ type: 'text', val: text.slice(lastIdx, m.index) });
    }
    segments.push({ type: 'protected', val: m[0] });
    lastIdx = m.index + m[0].length;
  }
  if (lastIdx < text.length) {
    segments.push({ type: 'text', val: text.slice(lastIdx) });
  }

  const enRegex = /([a-zA-Z]+(?:'[a-zA-Z]+)?)/g;
  const result = segments
    .map((seg) => {
      if (seg.type === 'protected') return seg.val;
      return seg.val.replace(enRegex, (match) => {
        count++;
        return `$${match}$`;
      });
    })
    .join('');

  return { text: result, count };
}
