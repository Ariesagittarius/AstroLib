import { describe, it, expect, vi } from 'vitest';
import {
  getAllAiProviders,
  getAiProvider,
  getBuptDefaultEndpoint,
  BUPT_OFFICIAL_ENDPOINT,
  BUPT_DEV_PROXY_ENDPOINT,
  checkBuptCampusNetwork,
} from '@/ai/ai-config.ts';
import { parseAiError } from '@/ai/error-handler.ts';

describe('BUPT AI Gateway Provider Suite (Unit Tests)', () => {
  it('should register bupt provider with correct configuration and endpoints', () => {
    const providers = getAllAiProviders();
    const bupt = providers.find((p) => p.id === 'bupt');
    expect(bupt).toBeDefined();
    expect(bupt!.label).toContain('北京邮电大学');
    expect(bupt!.defaultModelId).toBe('deepseek-v4-flash');
    expect(bupt!.models.some((m) => m.id === 'deepseek-v4-flash')).toBe(true);

    const endpoint = getBuptDefaultEndpoint();
    // 在 Vitest (DEV 态) 下返回本地 Dev Proxy 端点
    expect(endpoint).toBe(BUPT_DEV_PROXY_ENDPOINT);
  });

  it('should return bupt provider definition via getAiProvider', () => {
    const bupt = getAiProvider('bupt');
    expect(bupt).toBeDefined();
    expect(bupt.id).toBe('bupt');
    expect(bupt.keyPlaceholder).toContain('sk-');
  });

  it('should provide campus network specific advice in error-handler when connection fails', () => {
    const err = new TypeError('Failed to fetch');
    const parsed = parseAiError(err, {
      providerId: 'bupt',
      modelId: 'deepseek-v4-flash',
    });

    expect(parsed.category).toBe('network');
    expect(parsed.title).toContain('校园网');
    expect(parsed.advice).toContain('VPN');
    expect(parsed.advice).toContain('bupt.edu.cn');
  });

  it('should probe campus network reachability gracefully', async () => {
    // 模拟 fetch 成功 (包含 DEV 模式下的 json 数据)
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true, isCampus: true }),
    } as any);

    const isAvailable = await checkBuptCampusNetwork();
    expect(isAvailable).toBe(true);

    // 模拟 fetch 失败（校外环境或超时）
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network unreachable'));
    const isUnavailable = await checkBuptCampusNetwork();
    expect(isUnavailable).toBe(false);

    globalThis.fetch = originalFetch;
  });
});
