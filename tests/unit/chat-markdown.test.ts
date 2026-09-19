import { describe, it, expect } from 'vitest';
import {
  mdToHtml,
  splitTableRow,
  isTableDelimiterRow,
  isTableAt,
} from '@/ai/client/chat-markdown.ts';

describe('AI Chat Markdown Parser Suite (Unit Tests)', () => {
  describe('Blockquote (注释 / 引用语法 >) 解析', () => {
    it('应正确渲染单行引用语法为 <blockquote> 元素', () => {
      const input = '> 这是一条重要结论';
      const html = mdToHtml(input);
      expect(html).toContain('<blockquote><p>这是一条重要结论</p></blockquote>');
    });

    it('应完整保留引用块内的数学公式与符号（对应截图案例 1）', () => {
      const input = '> $f$ 在子区间上为常数 $\\iff f\'$ 在该子区间上恒为 0。';
      const html = mdToHtml(input);
      expect(html).toContain('<blockquote>');
      expect(html).toContain('$f$ 在子区间上为常数 $\\iff f\'$ 在该子区间上恒为 0。');
      expect(html).toContain('</blockquote>');
      // 绝不能泄漏未经解析的原生 > 或 &gt;
      expect(html).not.toMatch(/<p>&gt;\s*/);
    });

    it('紧随正文段落之后、无空行分隔的引用语法也能被准确识别并截断段落', () => {
      const input = `而布尔代数式的另一条桥梁是：
> $f$ 在子区间上为常数 $\\iff f'$ 在该子区间上恒为 0。
右推左由 Lagrange 中值定理即可。`;
      const html = mdToHtml(input);
      expect(html).toContain('<p>而布尔代数式的另一条桥梁是：</p>');
      expect(html).toContain('<blockquote>');
      expect(html).toContain('<p>右推左由 Lagrange 中值定理即可。</p>');
    });

    it('应支持多行引用语法的连续聚合', () => {
      const input = `> 第一行引用
> 第二行引用`;
      const html = mdToHtml(input);
      expect(html).toContain('<blockquote>');
      expect(html).toContain('第一行引用<br/>第二行引用');
      expect(html).toContain('</blockquote>');
    });

    it('应兼容实体 &gt; 形式的引用语法输入', () => {
      const input = '&gt; 兼容测试';
      const html = mdToHtml(input);
      expect(html).toContain('<blockquote><p>兼容测试</p></blockquote>');
    });
  });

  describe('GFM 表格语法 (| ... |) 解析', () => {
    it('应正确检测表格分割线行 (isTableDelimiterRow)', () => {
      expect(isTableDelimiterRow('|---|---|---|')).toBe(true);
      expect(isTableDelimiterRow('| :--- | :---: | ---: |')).toBe(true);
      expect(isTableDelimiterRow('---|---|---')).toBe(true);
      expect(isTableDelimiterRow('| - | - |')).toBe(true);

      expect(isTableDelimiterRow('---')).toBe(false); // 普通分割线不应被误判为表格
      expect(isTableDelimiterRow('| 姓名 | 年龄 |')).toBe(false);
      expect(isTableDelimiterRow('')).toBe(false);
    });

    it('应正确拆分包含数学公式与绝对值符号的表格行 (splitTableRow)', () => {
      const row = '| $f\' \\ge 0$ 且 $|x| \\le 1$ | 导数零点集 | 严格单调 ✅ |';
      const cells = splitTableRow(row);
      expect(cells).toHaveLength(3);
      expect(cells[0]).toBe('$f\' \\ge 0$ 且 $|x| \\le 1$');
      expect(cells[1]).toBe('导数零点集');
      expect(cells[2]).toBe('严格单调 ✅');
    });

    it('应正确拆分包含行内代码管道符或转义竖线的表格行', () => {
      const row = '| `ls | grep` | 选项 A \\| B | 说明 |';
      const cells = splitTableRow(row);
      expect(cells).toHaveLength(3);
      expect(cells[0]).toBe('`ls | grep`');
      expect(cells[1]).toBe('选项 A \\| B');
      expect(cells[2]).toBe('说明');
    });

    it('应正确渲染完整 Markdown 表格并输出 ask-table-wrap 容器（对应截图案例 2）', () => {
      const input = `| 情形 | 导数零点集 | 结论 |
|---|---|---|
| $f' \\ge 0$ 且 $f' = 0$ 仅有限点 | 不含区间 | 严格单调 ✅ |
| $f' \\ge 0$ 且在孤立点集（可数无穷）上为零 | 不含区间 | 仍严格单调 ✅ |
| $f' \\ge 0$ 且在某子区间上恒为 0 | 含区间 | 只非减，不严格 ❌ |`;

      const html = mdToHtml(input);
      expect(html).toContain('<div class="ask-table-wrap">');
      expect(html).toContain('<table class="ask-table">');
      expect(html).toContain('<thead><tr><th>情形</th><th>导数零点集</th><th>结论</th></tr></thead>');
      expect(html).toContain('<tbody>');
      expect(html).toContain('<td>$f\' \\ge 0$ 且 $f\' = 0$ 仅有限点</td><td>不含区间</td><td>严格单调 ✅</td>');
      expect(html).toContain('<td>$f\' \\ge 0$ 且在某子区间上恒为 0</td><td>含区间</td><td>只非减，不严格 ❌</td>');
      expect(html).toContain('</tbody></table></div>');
    });

    it('紧随段落后、无空行分隔的表格语法能够准确截断段落并正确渲染', () => {
      const input = `想便极为清晰：
| 情形 | 结论 |
|---|---|
| $f' > 0$ | 严格单调 |

五、融会总结`;

      const html = mdToHtml(input);
      expect(html).toContain('<p>想便极为清晰：</p>');
      expect(html).toContain('<div class="ask-table-wrap">');
      expect(html).toContain('<th>情形</th><th>结论</th>');
      expect(html).toContain('<td>$f\' &gt; 0$</td><td>严格单调</td>');
      expect(html).toContain('<p>五、融会总结</p>');
    });

    it('应正确支持居左、居中、居右对齐标记', () => {
      const input = `| 项目 | 状态 | 数值 |
| :--- | :---: | ---: |
| Alpha | OK | 100 |`;

      const html = mdToHtml(input);
      expect(html).toContain('<th style="text-align: left;">项目</th>');
      expect(html).toContain('<th style="text-align: center;">状态</th>');
      expect(html).toContain('<th style="text-align: right;">数值</th>');
      expect(html).toContain('<td style="text-align: left;">Alpha</td>');
      expect(html).toContain('<td style="text-align: center;">OK</td>');
      expect(html).toContain('<td style="text-align: right;">100</td>');
    });
  });

  describe('安全防护与综合解析', () => {
    it('应杜绝恶意 HTML 标签注入', () => {
      const input = '<script>alert(1)</script>';
      const html = mdToHtml(input);
      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
    });

    it('在引用块中包含加粗与行内代码时应正常渲染', () => {
      const input = '> **重要说明**：使用 `test` 函数';
      const html = mdToHtml(input);
      expect(html).toContain('<blockquote><p><strong>重要说明</strong>：使用 <code>test</code> 函数</p></blockquote>');
    });

    it('普通段落中的大于号表达式（如 x > 0）不应被误判为引用语法', () => {
      const input = '当满足条件 x > 0 时，导函数恒正。';
      const html = mdToHtml(input);
      expect(html).not.toContain('<blockquote>');
      expect(html).toContain('<p>当满足条件 x &gt; 0 时，导函数恒正。</p>');
    });

    it('代码块内部的竖线与大于号不应被误判为表格或引用', () => {
      const input = '```bash\ncat file.txt | grep > output.txt\n```';
      const html = mdToHtml(input);
      expect(html).toContain('<pre><code>cat file.txt | grep &gt; output.txt</code></pre>');
      expect(html).not.toContain('<table');
      expect(html).not.toContain('<blockquote');
    });

    it('表格行单元格数量少于表头时应安全补齐单元格', () => {
      const input = `| A | B | C |
|---|---|---|
| 1 | 2 |`;
      const html = mdToHtml(input);
      expect(html).toContain('<tr><td>1</td><td>2</td><td></td></tr>');
    });
  });
});

