import { describe, it, expect } from 'vitest';
import { ParagraphAligner } from '@/services/translation/paragraph-aligner.ts';

describe('Paragraph Aligner Suite', () => {
  it('应准确从 Markdown 中切分出离散段落并赋予连续自增索引', () => {
    const markdown = `---
title: 'Test Chapter'
---

import Card from '@/components/Card.astro';

## 1.1 First Section

This is the first paragraph.

$$
x^2 + y^2 = z^2
$$

\`\`\`python
def test():
    pass
\`\`\`

> A wise quote here.
`;

    const units = ParagraphAligner.extractFromMarkdown(markdown);

    expect(units.length).toBe(5);
    expect(units[0]).toMatchObject({ id: 'p-0', type: 'heading', index: 0 });
    expect(units[0].sourceText).toBe('## 1.1 First Section');

    expect(units[1]).toMatchObject({ id: 'p-1', type: 'paragraph', index: 1 });
    expect(units[1].sourceText).toBe('This is the first paragraph.');

    expect(units[2]).toMatchObject({ id: 'p-2', type: 'math', index: 2 });
    expect(units[2].sourceText).toContain('x^2 + y^2 = z^2');

    expect(units[3]).toMatchObject({ id: 'p-3', type: 'code', index: 3 });
    expect(units[3].sourceText).toContain('def test():');

    expect(units[4]).toMatchObject({ id: 'p-4', type: 'quote', index: 4 });
    expect(units[4].sourceText).toContain('> A wise quote here.');
  });
});
