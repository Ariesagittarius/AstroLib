import { describe, it, expect } from 'vitest';
import { translationService } from '@/services/translation/service.ts';

describe('Translation Service Integration Suite', () => {
  it('应正确通过服务单例完成带复杂公式与 JSX 组件的模拟翻译', async () => {
    const sample = `Quick check: the sum is at most $9 + 9 + 9 = 27$, two digits long. In fact, this rule holds not just in decimal but in any base $b \\geq 2$ (Exercise 1.1).

$$
\\begin{array}{c c c c c c c} \\text {Carry:} & 1 & & & 1 & 1 & 1 \\\\ & & 1 & 1 & 0 & 1 & 0 & 1 \\\\ & & 1 & 0 & 0 & 0 & 1 & 1 \\\\ \\hline & 1 & 0 & 1 & 1 & 0 & 0 & 0 \\end{array}\\tag{53}
$$

<Knowledge title="Box: Bases and logs">
Naturally, there is nothing special about the number 10.
</Knowledge>`;

    const result = await translationService.translate(sample, {
      provider: 'google',
      preserveStructure: true,
    });

    expect(result.success).toBe(true);
    expect(result.tokensPreserved).toBe(5);
    expect(result.tokensRestored).toBe(5);

    // 验证核心 LaTeX 公式与组件未受破坏
    expect(result.translatedText).toContain('$9 + 9 + 9 = 27$');
    expect(result.translatedText).toContain('$b \\geq 2$');
    expect(result.translatedText).toContain('\\begin{array}');
    expect(result.translatedText).toContain('<Knowledge title="Box: Bases and logs">');
    expect(result.translatedText).toContain('</Knowledge>');
  });

  it('重复请求应命中 LRU 内存缓存', async () => {
    const text = 'Algorithms with numbers';
    const first = await translationService.translate(text, { provider: 'google' });
    expect(first.success).toBe(true);

    const second = await translationService.translate(text, { provider: 'google' });
    expect(second.success).toBe(true);
    expect(second.translatedText).toBe(first.translatedText);
  });
});
