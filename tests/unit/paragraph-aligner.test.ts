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

  it('extractFromArticleDom 应严格跳过行间公式与代码块，并精准将卡片切分为标题与正文段落', () => {
    class MockEl {
      public tagName: string;
      public className: string;
      public attributes: Record<string, string>;
      public children: MockEl[] = [];
      public parentElement: MockEl | null = null;
      public textContent: string;

      constructor(tagName: string, text = '', cls = '', attrs: Record<string, string> = {}) {
        this.tagName = tagName.toUpperCase();
        this.textContent = text;
        this.className = cls;
        this.attributes = { ...attrs };
      }

      setAttribute(k: string, v: string) {
        this.attributes[k] = v;
      }

      getAttribute(k: string) {
        return this.attributes[k] ?? null;
      }

      hasAttribute(k: string) {
        return k in this.attributes;
      }

      get classList() {
        return {
          contains: (c: string) => this.className.split(' ').includes(c),
          add: (c: string) => {
            if (!this.className.split(' ').includes(c)) {
              this.className = (this.className + ' ' + c).trim();
            }
          },
        };
      }

      matches(sel: string) {
        const parts = sel.split(',').map((s) => s.trim());
        for (const p of parts) {
          if (p.startsWith('.') && this.classList.contains(p.slice(1))) return true;
          if (this.tagName.toLowerCase() === p.toLowerCase()) return true;
        }
        return false;
      }

      closest(sel: string): MockEl | null {
        let curr: MockEl | null = this;
        while (curr) {
          if (curr.matches(sel)) return curr;
          curr = curr.parentElement;
        }
        return null;
      }

      querySelector(sel: string): MockEl | null {
        const list = this.querySelectorAll(sel);
        return list[0] || null;
      }

      querySelectorAll(sel: string): MockEl[] {
        const res: MockEl[] = [];
        const check = (el: MockEl) => {
          const parts = sel.split(',').map((s) => s.trim());
          for (const p of parts) {
            if (p.startsWith('.')) {
              if (el.classList.contains(p.slice(1))) {
                res.push(el);
                break;
              }
            } else if (el.tagName.toLowerCase() === p.toLowerCase()) {
              res.push(el);
              break;
            }
          }
          for (const ch of el.children) check(ch);
        };
        for (const ch of this.children) check(ch);
        return res;
      }

      appendChild(child: MockEl) {
        child.parentElement = this;
        this.children.push(child);
      }
    }

    const container = new MockEl('article');

    // 1. 标题
    const h2 = new MockEl('h2', '2.3 Mergesort');
    container.appendChild(h2);

    // 2. 代码块（应被严格跳过）
    const pre = new MockEl('pre', 'function mergesort(a)');
    container.appendChild(pre);

    // 3. 行间公式（应被严格跳过）
    const math = new MockEl('div', '$$T(n) = 2T(n/2) + O(n)$$', 'katex-display');
    container.appendChild(math);

    // 4. 知识卡片（应被拆分为标题与正文两个独立单元）
    const card = new MockEl('div', '', 'knowledge-card', { 'data-title': 'Box: Binary search' });
    const header = new MockEl('div', 'Box: Binary search', 'card-header');
    const body = new MockEl('div', '', 'card-body');
    const cardP = new MockEl('p', 'The ultimate divide-and-conquer algorithm is binary search.');
    body.appendChild(cardP);
    card.appendChild(header);
    card.appendChild(body);
    container.appendChild(card);

    // 5. 结尾普通段落
    const pEnd = new MockEl('p', 'Final concluding remarks.');
    container.appendChild(pEnd);

    const units = ParagraphAligner.extractFromArticleDom(container as any);

    // 验证总共提取了 4 个单元（跳过了 pre 和 katex-display）
    expect(units.length).toBe(4);

    // 单元 1: 标题 2.3 Mergesort
    expect(units[0]).toMatchObject({ id: 'p-0', type: 'heading', sourceText: '2.3 Mergesort' });

    // 单元 2: 卡片标题 Box: Binary search（类型为 card-title）
    expect(units[1]).toMatchObject({ id: 'p-1', type: 'card-title', sourceText: 'Box: Binary search' });
    expect(header.getAttribute('data-trans-card-title')).toBe('true');

    // 单元 3: 卡片内部正文段落
    expect(units[2]).toMatchObject({
      id: 'p-2',
      type: 'paragraph',
      sourceText: 'The ultimate divide-and-conquer algorithm is binary search.',
    });
    expect(cardP.getAttribute('data-trans-id')).toBe('p-2');

    // 单元 4: 结尾段落
    expect(units[3]).toMatchObject({ id: 'p-3', type: 'paragraph', sourceText: 'Final concluding remarks.' });

    // 验证 pre 和 math 没有被赋予 data-trans-id
    expect(pre.hasAttribute('data-trans-id')).toBe(false);
    expect(math.hasAttribute('data-trans-id')).toBe(false);
  });

  it('能够正确提取表格中的文本单元格 (th, td) 并跳过纯数字、公式或图片单元格', () => {
    class MockTableEl {
      tagName: string;
      className: string = '';
      textContent: string = '';
      parentElement: MockTableEl | null = null;
      children: MockTableEl[] = [];
      attributes: Record<string, string> = {};

      classList = {
        contains: (c: string) => this.className.split(' ').filter(Boolean).includes(c),
        add: (c: string) => {
          if (!this.classList.contains(c)) {
            this.className = (this.className + ' ' + c).trim();
          }
        },
      };

      constructor(tagName: string, text: string = '', cls: string = '') {
        this.tagName = tagName.toUpperCase();
        this.textContent = text;
        this.className = cls;
      }

      setAttribute(k: string, v: string) {
        this.attributes[k] = v;
      }
      getAttribute(k: string): string | null {
        return this.attributes[k] || null;
      }
      hasAttribute(k: string): boolean {
        return k in this.attributes;
      }
      cloneNode(_deep?: boolean): MockTableEl {
        const c = new MockTableEl(this.tagName, this.textContent, this.className);
        c.attributes = { ...this.attributes };
        return c;
      }
      matches(sel: string) {
        const parts = sel.split(',').map((s) => s.trim());
        for (const p of parts) {
          if (p.startsWith('.') && this.className.includes(p.slice(1))) return true;
          if (this.tagName.toLowerCase() === p.toLowerCase()) return true;
        }
        return false;
      }
      closest(sel: string): MockTableEl | null {
        let curr: MockTableEl | null = this;
        while (curr) {
          if (curr.matches(sel)) return curr;
          curr = curr.parentElement;
        }
        return null;
      }
      querySelector(sel: string): MockTableEl | null {
        return this.querySelectorAll(sel)[0] || null;
      }
      querySelectorAll(sel: string): MockTableEl[] {
        const res: MockTableEl[] = [];
        const check = (el: MockTableEl) => {
          const parts = sel.split(',').map((s) => s.trim());
          for (const p of parts) {
            if (p.startsWith('.') && el.className.includes(p.slice(1))) {
              res.push(el);
              break;
            } else if (el.tagName.toLowerCase() === p.toLowerCase()) {
              res.push(el);
              break;
            }
          }
          for (const ch of el.children) check(ch);
        };
        for (const ch of this.children) check(ch);
        return res;
      }
      appendChild(child: MockTableEl) {
        child.parentElement = this;
        this.children.push(child);
      }
    }

    const container = new MockTableEl('article');
    const table = new MockTableEl('table');
    const tr1 = new MockTableEl('tr');
    const th1 = new MockTableEl('th', 'Operation');
    const th2 = new MockTableEl('th', 'Problem size');
    tr1.appendChild(th1);
    tr1.appendChild(th2);
    table.appendChild(tr1);

    const tr2 = new MockTableEl('tr');
    const td1 = new MockTableEl('td', 'Copying array');
    const td2 = new MockTableEl('td', '2'); // 纯数字单元格，应当跳过
    const td3 = new MockTableEl('td', ''); // 空/纯图片单元格，应当跳过
    tr2.appendChild(td1);
    tr2.appendChild(td2);
    tr2.appendChild(td3);
    table.appendChild(tr2);

    container.appendChild(table);

    const units = ParagraphAligner.extractFromArticleDom(container as any);

    // 应该只提取 Operation, Problem size, Copying array (3个单元格)
    expect(units.length).toBe(3);
    expect(units[0]).toMatchObject({ id: 'p-0', type: 'table-cell', sourceText: 'Operation' });
    expect(units[1]).toMatchObject({ id: 'p-1', type: 'table-cell', sourceText: 'Problem size' });
    expect(units[2]).toMatchObject({ id: 'p-2', type: 'table-cell', sourceText: 'Copying array' });

    expect(th1.getAttribute('data-trans-id')).toBe('p-0');
    expect(th1.getAttribute('data-trans-kind')).toBe('table-cell');
    expect(td2.hasAttribute('data-trans-id')).toBe(false);
    expect(td3.hasAttribute('data-trans-id')).toBe(false);
  });
});
