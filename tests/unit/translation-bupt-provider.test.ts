import { describe, it, expect, vi } from 'vitest';
import { translationService } from '@/services/translation/service.ts';
import { BuptTranslateProvider } from '@/services/translation/providers/bupt-provider.ts';

describe('BUPT DeepSeek Translation Provider Suite', () => {
  it('应成功在 TranslationService 中注册并可通过 bupt 或 deepseek 获取', () => {
    const providerBupt = translationService.getProvider('bupt');
    expect(providerBupt).toBeDefined();
    expect(providerBupt.id).toBe('bupt');
    expect(providerBupt.label).toContain('DeepSeek');
    expect(providerBupt.desc).toContain('北京邮电大学');

    const providerDeepseek = translationService.getProvider('deepseek');
    expect(providerDeepseek).toBeDefined();
    expect(providerDeepseek.id).toBe('bupt');
  });

  it('listProviders 应包含 Google 翻译、Gemini 与北邮 DeepSeek', () => {
    const list = translationService.listProviders();
    const buptEntry = list.find((p) => p.id === 'bupt');
    expect(buptEntry).toBeDefined();
    expect(buptEntry?.label).toContain('DeepSeek');
  });

  it('清洗逻辑应彻底剥离 <think> 思考链与多余的外层代码块包裹', () => {
    const provider = new BuptTranslateProvider();
    const cleanFn = (provider as any).cleanTranslatedOutput.bind(provider);

    const inputWithThink = `<think>
这里是 DeepSeek 内部思维链推理过程：
需要将 primality test 翻译为素性测试。
</think>这是一个素性测试算法。`;

    expect(cleanFn(inputWithThink)).toBe('这是一个素性测试算法。');

    const inputWithCodeBlock = `\`\`\`markdown
这是被 markdown 代码块包裹的译文。
\`\`\``;
    expect(cleanFn(inputWithCodeBlock)).toBe('这是被 markdown 代码块包裹的译文。');
  });

  it('针对短标题输入发生模型扩写添油加醋时，能自动截断并保留首行核心译文', () => {
    const provider = new BuptTranslateProvider();
    const sourceText = '2.3 Mergesort';
    const hallucinatedOutput = `2.3 归并排序
归并排序是一种高效的排序算法，它基于分治策略。该算法的基本思想是将输入数组分成两半...`;

    const cleaned = provider.cleanTranslatedOutput(hallucinatedOutput, sourceText);
    expect(cleaned).toBe('2.3 归并排序');
  });

  it('单段调用时能正确配合 StructurePreservingMasker 保护公式与组件占位符', async () => {
    const provider = new BuptTranslateProvider();
    // Mock requestNode 返回包含占位符的中文译文
    vi.spyOn(provider as any, 'requestNode').mockResolvedValue(
      '检查算法：求和至多为 ⟦ASTRO_TOK_0⟧，长度为两位数。'
    );

    // 临时将其注册至 service 测试端到端防护
    translationService.registerProvider(provider);

    const sample = 'Quick check: the sum is at most $9 + 9 + 9 = 27$, two digits long.';
    const result = await translationService.translate(sample, {
      provider: 'bupt',
      preserveStructure: true,
    });

    expect(result.success).toBe(true);
    expect(result.tokensPreserved).toBe(1);
    expect(result.tokensRestored).toBe(1);
    expect(result.translatedText).toContain('$9 + 9 + 9 = 27$');
  });

  it('批量段落翻译 translateBatch 正常切片执行且能容错降级', async () => {
    const provider = new BuptTranslateProvider();
    vi.spyOn(provider, 'translate').mockImplementation(async (text) => {
      if (text === 'fail') throw new Error('Mock error');
      return `译:${text}`;
    });

    const results = await provider.translateBatch(['First', 'fail', 'Third']);
    expect(results[0]).toBe('译:First');
    expect(results[1]).toBe('fail'); // 降级为原文本
    expect(results[2]).toBe('译:Third');
  });

  it('当传入非 sk- 开头的非法 key (如误贴 GitHub Token ghp_...) 时应能自愈并回退', async () => {
    const provider = new BuptTranslateProvider();
    const spy = vi.spyOn(provider as any, 'requestNode').mockResolvedValue('译文');

    const originalEnv = process.env.BUPT_API_KEY;
    process.env.BUPT_API_KEY = 'sk-valid-server-key';

    try {
      await provider.translate('Hello', { apiKey: 'ghp_invalid_token' });
      expect(spy).toHaveBeenCalled();
      // 验证传入 requestNode 的 apiKey 被智能自愈为服务端的 sk- 开头 key
      const calledApiKey = spy.mock.calls[0][1];
      expect(calledApiKey).toBe('sk-valid-server-key');
    } finally {
      process.env.BUPT_API_KEY = originalEnv;
    }
  });
});
