import { describe, it, expect, vi } from 'vitest';
import { translationService } from '@/services/translation/service.ts';
import { ZhipuTranslateProvider } from '@/services/translation/providers/zhipu-provider.ts';

describe('Zhipu AI GLM-4 Translation Provider Suite', () => {
  it('应成功在 TranslationService 中注册并可通过 zhipu 获取', () => {
    const provider = translationService.getProvider('zhipu');
    expect(provider).toBeDefined();
    expect(provider.id).toBe('zhipu');
    expect(provider.label).toContain('智谱 GLM-4');
    expect(provider.desc).toContain('GLM-4-Flash');
  });

  it('listProviders 应包含智谱 GLM-4 免费服务商', () => {
    const list = translationService.listProviders();
    const entry = list.find((p) => p.id === 'zhipu');
    expect(entry).toBeDefined();
    expect(entry?.label).toContain('智谱 GLM-4');
    expect(entry?.desc).toContain('GLM-4-Flash');
  });

  it('清洗逻辑应彻底剥离 <think> 思考链与多余的外层代码块包裹', () => {
    const provider = new ZhipuTranslateProvider();
    const cleanFn = provider.cleanTranslatedOutput.bind(provider);

    const inputWithThink = `<think>
这里是 GLM-4 内部思维链推理过程：
需要将 primality test 翻译为素性测试。
</think>这是一个素性测试算法。`;

    expect(cleanFn(inputWithThink)).toBe('这是一个素性测试算法。');

    const inputWithCodeBlock = `\`\`\`markdown
这是被 markdown 代码块包裹的译文。
\`\`\``;
    expect(cleanFn(inputWithCodeBlock)).toBe('这是被 markdown 代码块包裹的译文。');
  });

  it('针对短标题输入发生模型扩写添油加醋时，能自动截断并保留首行核心译文', () => {
    const provider = new ZhipuTranslateProvider();
    const sourceText = '2.3 Mergesort';
    const hallucinatedOutput = `2.3 归并排序
归并排序是一种高效的排序算法，它基于分治策略。该算法的基本思想是将输入数组分成两半...`;

    const cleaned = provider.cleanTranslatedOutput(hallucinatedOutput, sourceText);
    expect(cleaned).toBe('2.3 归并排序');
  });

  it('当未配置 API Key 时应抛出明确友好的配置指引异常', async () => {
    const provider = new ZhipuTranslateProvider();
    const origEnv = process.env.ZHIPU_API_KEY;
    delete process.env.ZHIPU_API_KEY;

    try {
      await expect(provider.translate('Hello world', { apiKey: '' })).rejects.toThrow(
        /未检测到有效的智谱 API Key/
      );
    } finally {
      if (origEnv) process.env.ZHIPU_API_KEY = origEnv;
    }
  });

  it('单段调用时能正确配合 StructurePreservingMasker 保护公式与组件占位符', async () => {
    const provider = new ZhipuTranslateProvider();

    const origFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [
          {
            message: {
              content: '快速检查：总和至多为 ⟦ASTRO_TOK_0⟧，长度为两位数。',
            },
          },
        ],
      }),
    } as any);

    try {
      translationService.registerProvider(provider);

      const sample = 'Quick check: the sum is at most $9 + 9 + 9 = 27$, two digits long.';
      const result = await translationService.translate(sample, {
        provider: 'zhipu',
        apiKey: 'test-key.mocked',
        preserveStructure: true,
      });

      expect(result.success).toBe(true);
      expect(result.tokensPreserved).toBe(1);
      expect(result.tokensRestored).toBe(1);
      expect(result.translatedText).toContain('$9 + 9 + 9 = 27$');
      expect(result.translatedText).toContain('快速检查');
    } finally {
      globalThis.fetch = origFetch;
    }
  });

  it('批量段落翻译 translateBatch 正常切片执行且能容错降级', async () => {
    const provider = new ZhipuTranslateProvider();
    vi.spyOn(provider, 'translate').mockImplementation(async (text) => {
      if (text === 'fail') throw new Error('Mock error');
      return `译:${text}`;
    });

    const results = await provider.translateBatch(['First', 'fail', 'Third'], { apiKey: 'mock-key' });
    expect(results[0]).toBe('译:First');
    expect(results[1]).toBe('fail');
    expect(results[2]).toBe('译:Third');
  });

  it('真实网络探活：连接官方真实端点验证握手与错误鉴权拦截', async () => {
    const provider = new ZhipuTranslateProvider();

    const realKey = (process.env.ZHIPU_API_KEY || '').trim();
    if (realKey && realKey.includes('.')) {
      const res = await provider.translate('Linear algebra is the study of linear sets of equations.', {
        apiKey: realKey,
      });
      expect(res).toBeTruthy();
      expect(res.length).toBeGreaterThan(0);
      expect(res).toContain('线性代数');
    } else {

      await expect(
        provider.translate('Test connection', { apiKey: 'invalid.api_key_for_testing' })
      ).rejects.toThrow(/智谱 API 身份验证失败/);
    }
  });
});
