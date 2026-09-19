import { describe, it, expect } from 'vitest';
import { convertEnglishToMath } from '../../src/features/mdx-editor/client/english-to-math';

describe('convertEnglishToMath', () => {
  it('应当将孤立英文单词转换为行内数学公式 $...$', () => {
    const input = '已知 x 为正数，且 f(x) 满足条件';
    const { text, count } = convertEnglishToMath(input);
    expect(text).toBe('已知 $x$ 为正数，且 $f$($x$) 满足条件');
    expect(count).toBe(3);
  });

  it('应当保护已有的行内公式和行间公式不被二次包裹', () => {
    const input = '已知 $x > 0$ 以及 $$\\int_0^1 f(t)dt = 1$$ 成立';
    const { text } = convertEnglishToMath(input);
    expect(text).toBe(input);
  });

  it('应当保护代码块与行内代码', () => {
    const input = '运行 `npm run build` 命令，查看 ```const a = 1;```';
    const { text } = convertEnglishToMath(input);
    expect(text).toBe(input);
  });

  it('应当保护 HTML 标签与 JSX 组件', () => {
    const input = '请参见 <Example title="demo">内容</Example> 中的说明';
    const { text } = convertEnglishToMath(input);
    expect(text).toContain('<Example title="demo">');
    expect(text).toContain('</Example>');
  });

  it('应当保护 Markdown 链接与图片', () => {
    const input = '详情请看 [link text](https://example.com/path) 和 ![fig](image.png)';
    const { text } = convertEnglishToMath(input);
    expect(text).toBe(input);
  });
});
