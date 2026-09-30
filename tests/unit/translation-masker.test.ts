import { describe, it, expect } from 'vitest';
import { StructurePreservingMasker } from '@/services/translation/masker.ts';

describe('Structure-Preserving Translation Masker Suite', () => {
  it('应准确提取并保护 Frontmatter 与 import 声明', () => {
    const source = `---
title: '1.1 Basic arithmetic'
---

import Knowledge from '@/components/Knowledge.astro';
import Example from '@/components/Example.astro';

Some introductory text here.`;

    const { maskedText, tokens } = StructurePreservingMasker.mask(source);

    expect(tokens.size).toBe(3); // frontmatter + 2 imports
    expect(maskedText).toContain('⟦ASTRO_TOK_0⟧');
    expect(maskedText).toContain('Some introductory text here.');

    const { restoredText, restoredCount } = StructurePreservingMasker.unmask(maskedText, tokens);
    expect(restoredCount).toBe(3);
    expect(restoredText).toBe(source);
  });

  it('应准确保护多行复杂块级 LaTeX 数学公式 ($$...$$)', () => {
    const source = `Here is an addition in binary:

$$
\\begin{array}{c c c c c c c} \\text {Carry:} & 1 & & & 1 & 1 & 1 \\\\ & & 1 & 1 & 0 & 1 & 0 & 1 \\\\ & & 1 & 0 & 0 & 0 & 1 & 1 \\\\ \\hline & 1 & 0 & 1 & 1 & 0 & 0 & 0 \\end{array}\\tag{53}
$$

End of example.`;

    const { maskedText, tokens } = StructurePreservingMasker.mask(source);
    expect(maskedText).not.toContain('\\begin{array}');
    expect(maskedText).toContain('⟦ASTRO_TOK_0⟧');

    // 模拟翻译服务将其他文本翻译为中文
    const simulatedTranslation = maskedText.replace(
      'Here is an addition in binary:',
      '这是二进制加法的一个示例：'
    ).replace('End of example.', '示例结束。');

    const { restoredText, restoredCount } = StructurePreservingMasker.unmask(simulatedTranslation, tokens);
    expect(restoredCount).toBe(1);
    expect(restoredText).toContain('\\begin{array}{c c c c c c c}');
    expect(restoredText).toContain('这是二进制加法的一个示例：');
    expect(restoredText).toContain('示例结束。');
  });

  it('应准确保护行内数学公式并正确自愈中西文呼吸间距', () => {
    const source = `The running time is $O(n)$, and for any base $b \\geq 2$, the ceiling is $\\lceil \\log_b(N+1) \\rceil$.`;

    const { maskedText, tokens } = StructurePreservingMasker.mask(source);
    expect(tokens.size).toBe(3);

    // 模拟翻译，中间故意不留空格
    const simulated = `运行时间为⟦ASTRO_TOK_0⟧，对于任意底数⟦ASTRO_TOK_1⟧，上界为⟦ASTRO_TOK_2⟧。`;

    const { restoredText, restoredCount } = StructurePreservingMasker.unmask(simulated, tokens);
    expect(restoredCount).toBe(3);
    // 验证盘古排版自愈：中文与行内公式之间补齐空格
    expect(restoredText).toBe(
      `运行时间为 $O(n)$，对于任意底数 $b \\geq 2$，上界为 $\\lceil \\log_b(N+1) \\rceil$。`
    );
  });

  it('应准确保护算法伪代码块与行内代码', () => {
    const source = `Consider the function \`fib1(n)\`:

\`\`\`python
def fib1(n):
    if n == 0: return 0
    if n == 1: return 1
    return fib1(n - 1) + fib1(n - 2)
\`\`\`

Notice that \`fib1\` takes exponential time.`;

    const { maskedText, tokens } = StructurePreservingMasker.mask(source);
    expect(tokens.size).toBe(3); // 2 inline code + 1 code block

    const simulated = `考虑函数⟦ASTRO_TOK_0⟧：\n\n⟦ASTRO_TOK_1⟧\n\n注意⟦ASTRO_TOK_2⟧需要指数级时间。`;

    const { restoredText } = StructurePreservingMasker.unmask(simulated, tokens);
    expect(restoredText).toContain('def fib1(n):');
    expect(restoredText).toContain('`fib1(n)`');
    expect(restoredText).toContain('`fib1`');
  });

  it('应准确保护 Astro/JSX 复合卡片组件标签不被语法破坏', () => {
    const source = `<Knowledge title="Box: Bases and logs">

Naturally, there is nothing special about the number 10.

</Knowledge>`;

    const { maskedText, tokens } = StructurePreservingMasker.mask(source);
    expect(tokens.size).toBe(2); // opening tag and closing tag

    expect(maskedText).toContain('⟦ASTRO_TOK_0⟧');
    expect(maskedText).toContain('Naturally, there is nothing special about the number 10.');
    expect(maskedText).toContain('⟦ASTRO_TOK_1⟧');

    const simulated = `⟦ASTRO_TOK_0⟧\n\n自然地，数字 10 并没有什么特别之处。\n\n⟦ASTRO_TOK_1⟧`;
    const { restoredText } = StructurePreservingMasker.unmask(simulated, tokens);

    expect(restoredText).toContain('<Knowledge title="Box: Bases and logs">');
    expect(restoredText).toContain('自然地，数字 10 并没有什么特别之处。');
    expect(restoredText).toContain('</Knowledge>');
  });

  it('容错测试：当翻译引擎注入空格或变异中括号时仍能 100% 成功还原', () => {
    const source = `Check $X = Y + Z$ now.`;
    const { tokens } = StructurePreservingMasker.mask(source);

    // 变异 1: 带有内联空格 ⟦ ASTRO_TOK_0 ⟧
    const mutated1 = `请检查 ⟦ ASTRO_TOK_0 ⟧ 结果。`;
    expect(StructurePreservingMasker.unmask(mutated1, tokens).restoredText).toBe(`请检查 $X = Y + Z$ 结果。`);

    // 变异 2: 降级为方括号 [ASTRO_TOK_0]
    const mutated2 = `请检查 [ASTRO_TOK_0] 结果。`;
    expect(StructurePreservingMasker.unmask(mutated2, tokens).restoredText).toBe(`请检查 $X = Y + Z$ 结果。`);

    // 变异 3: 带空格的方括号 [ ASTRO_TOK_0 ]
    const mutated3 = `请检查 [ ASTRO_TOK_0 ] 结果。`;
    expect(StructurePreservingMasker.unmask(mutated3, tokens).restoredText).toBe(`请检查 $X = Y + Z$ 结果。`);
  });
});
