import { describe, it, expect } from 'vitest';
import {
  parseFrontmatter,
  serializeFrontmatter,
  combineDocument,
  renderMarkdown,
  renderDocument,
} from '../../src/features/scratchpad/core/markdown-parser.ts';

describe('Scratchpad Markdown & KaTeX Engine', () => {
  describe('Frontmatter Parsing & Serialization', () => {
    it('应正确解析包含完整元数据的 YAML Frontmatter', () => {
      const source = `---
title: "量子相位估计与误差缓解"
description: "容错量子态制备的理论边界"
author: "A. Nielsen"
subject: "前沿学术文献"
tags:
  - "Quantum"
  - "Linear Algebra"
---

# 1. 引言
正文内容在此。`;

      const result = parseFrontmatter(source);
      expect(result.metadata.title).toBe('量子相位估计与误差缓解');
      expect(result.metadata.description).toBe('容错量子态制备的理论边界');
      expect(result.metadata.author).toBe('A. Nielsen');
      expect(result.metadata.subject).toBe('前沿学术文献');
      expect(result.metadata.tags).toEqual(['Quantum', 'Linear Algebra']);
      expect(result.body.trim()).toBe('# 1. 引言\n正文内容在此。');
    });

    it('应正确解析内联数组标签与引号清洗', () => {
      const source = `---
title: '矩阵论'
tags: [Math, Matrix, Linear Algebra]
---
Body text`;

      const result = parseFrontmatter(source);
      expect(result.metadata.title).toBe('矩阵论');
      expect(result.metadata.tags).toEqual(['Math', 'Matrix', 'Linear Algebra']);
      expect(result.body.trim()).toBe('Body text');
    });

    it('无 Frontmatter 时应平滑降级并保留完整正文', () => {
      const source = '## 纯净文本\n无任何 YAML 头部的正文。';
      const result = parseFrontmatter(source);
      expect(result.metadata.title).toBe('未命名草稿');
      expect(result.body).toBe(source);
    });

    it('serializeFrontmatter 与 parseFrontmatter 往返序列化应保持数据一致', () => {
      const originalMeta = {
        title: '双向往返测试',
        description: '测试 Frontmatter 序列化保真度',
        author: '测试员',
        subject: '系统工程',
        tags: ['Vitest', 'Parser'],
      };

      const serialized = serializeFrontmatter(originalMeta);
      const combined = combineDocument(originalMeta, '正文测试');
      const parsed = parseFrontmatter(combined);

      expect(parsed.metadata.title).toBe(originalMeta.title);
      expect(parsed.metadata.description).toBe(originalMeta.description);
      expect(parsed.metadata.author).toBe(originalMeta.author);
      expect(parsed.metadata.subject).toBe(originalMeta.subject);
      expect(parsed.metadata.tags).toEqual(originalMeta.tags);
      expect(parsed.body.trim()).toBe('正文测试');
    });
  });

  describe('KaTeX Math Rendering & Source Protection', () => {
    it('行内公式应正确由 KaTeX 渲染且附带 data-latex 源码', () => {
      const markdown = '爱因斯坦质能方程为 $E = mc^2$，具有里程碑意义。';
      const { html } = renderMarkdown(markdown);

      expect(html).toContain('class="katex"');
      expect(html).toContain('data-latex=');

      expect(decodeURIComponent(html.match(/data-latex="([^"]*)"/)?.[1] || '')).toBe('E = mc^2');
    });

    it('块级公式 $$...$$ 应包裹 .katex-display 并支持横向滚动', () => {
      const markdown = `高斯积分公式为：
$$
\\int_{-\\infty}^{+\\infty} e^{-x^2} \\, dx = \\sqrt{\\pi}
$$
证明完毕。`;

      const { html } = renderMarkdown(markdown);
      expect(html).toContain('class="katex-display"');
      expect(html).toContain('data-latex=');
      const extractedLatex = decodeURIComponent(html.match(/class="katex-display"[^>]*data-latex="([^"]*)"/)?.[1] || '');
      expect(extractedLatex).toContain('\\int_{-\\infty}^{+\\infty}');
    });

    it('环境公式 \\begin{aligned} ... \\end{aligned} 应被自动识别并渲染为块级公式', () => {
      const markdown = `
\\begin{aligned}
a &= b + c \\\\
d &= e + f
\\end{aligned}
`;
      const { html } = renderMarkdown(markdown);
      expect(html).toContain('class="katex-display"');
      expect(html).toContain('class="katex"');
    });

    it('数学公式内部的下划线与星号绝不可被 Markdown 错误转译为斜体或粗体', () => {
      const markdown = '测试公式下标：$a_i + b_j = c_{i, j}$ 与 $x * y * z$。';
      const { html } = renderMarkdown(markdown);

      expect(html).not.toContain('<em>');
      expect(html).not.toContain('<strong>');
      expect(html).toContain('class="katex"');
    });
  });

  describe('Mermaid Diagrams Integration', () => {
    it('Mermaid 代码块应被编译为 .mermaid-container 并携带 data-mermaid-code', () => {
      const markdown = `
\`\`\`mermaid
flowchart LR
    A[输入] --> B[输出]
\`\`\`
`;
      const { html } = renderMarkdown(markdown);
      expect(html).toContain('class="mermaid-container"');
      expect(html).toContain('data-feature="mermaid"');
      expect(html).toContain('data-mermaid-code=');
      expect(html).toContain('<pre class="mermaid">');
    });
  });

  describe('AstroLib Academic Cards Transformation', () => {
    it('应将 <Theorem> 标签转译为带 M3 图标的标准 .knowledge-card.toc-chunk', () => {
      const markdown = `
<Theorem title="定理 1.1 (主定理)">
设递归关系为 $T(n) = aT(n/b) + f(n)$，则有渐近界。
</Theorem>
`;
      const { html } = renderMarkdown(markdown);
      expect(html).toContain('class="knowledge-card toc-chunk"');
      expect(html).toContain('data-title="定理 1.1 (主定理)"');
      expect(html).toContain('data-icon-kind="theorem"');
      expect(html).toContain('class="card-header"');
      expect(html).toContain('class="card-mdicon"');
      expect(html).toContain('class="card-title-text"');
      expect(html).toContain('class="card-content"');
      expect(html).toContain('class="katex"');
    });

    it('应将 <Example> 转译为 .example-card.toc-chunk', () => {
      const markdown = `
<Example title="例题 1.2">
计算定积分 $\\int_0^1 x^2 dx$。
</Example>
`;
      const { html } = renderMarkdown(markdown);
      expect(html).toContain('class="example-card toc-chunk"');
      expect(html).toContain('data-title="例题 1.2"');
      expect(html).toContain('class="card-header"');
      expect(html).toContain('class="card-body"');
    });

    it('应将 <Note> 转译为 .note-block 并带有图标', () => {
      const markdown = `
<Note title="易错提示">
注意矩阵乘法不满足交换律。
</Note>
`;
      const { html } = renderMarkdown(markdown);
      expect(html).toContain('class="note-block"');
      expect(html).toContain('class="note-header"');
      expect(html).toContain('class="note-mdicon"');
      expect(html).toContain('class="note-content"');
    });

    it('应将 <Solution> 转译为带折叠交互的 <details class="solution-details">', () => {
      const markdown = `
<Solution title="查看步骤解答">
由牛顿-莱布尼茨公式可得结果为 $1/3$。
</Solution>
`;
      const { html } = renderMarkdown(markdown);
      expect(html).toContain('<details class="solution-details"');
      expect(html).toContain('<summary class="solution-summary">');
      expect(html).toContain('class="solution-content"');
    });
  });

  describe('Headings & TOC List Generation', () => {
    it('应为正文多级标题自动注入 slugified id 并返回大纲列表', () => {
      const markdown = `
## 1. 量子傅里叶变换
正文

### 1.1 基本门操作
正文

## 2. 相位估计推导
正文
`;
      const { html, headings } = renderMarkdown(markdown);
      expect(headings).toHaveLength(3);
      expect(headings[0].text).toBe('1. 量子傅里叶变换');
      expect(headings[0].level).toBe(2);
      expect(headings[1].text).toBe('1.1 基本门操作');
      expect(headings[1].level).toBe(3);
      expect(headings[2].text).toBe('2. 相位估计推导');

      expect(html).toContain(`id="${headings[0].id}"`);
      expect(html).toContain(`id="${headings[1].id}"`);
      expect(html).toContain(`id="${headings[2].id}"`);
    });

    it('renderDocument 应一站式返回元数据、大纲与 HTML 完整结果', () => {
      const docSource = `---
title: "综合测试文档"
author: "测试组"
---

## 章节一
公式：$a + b = c$。
`;
      const result = renderDocument(docSource);
      expect(result.metadata.title).toBe('综合测试文档');
      expect(result.metadata.author).toBe('测试组');
      expect(result.headings).toHaveLength(1);
      expect(result.headings[0].text).toBe('章节一');
      expect(result.html).toContain('class="katex"');
    });
  });
});
