export function convertEnglishToMath(text: string): { text: string; count: number } {

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
