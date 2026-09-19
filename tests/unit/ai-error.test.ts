import { describe, it, expect } from 'vitest';
import {
  getAllAiProviders,
  getAiProvider,
} from '@/ai/ai-config.ts';

describe('AI Providers & Registry Suite (Unit Tests)', () => {
  it('should have all configured providers with valid endpoints', () => {
    const providers = getAllAiProviders();
    expect(providers.length).toBeGreaterThan(0);

    for (const p of providers) {
      expect(p.id).toBeDefined();
      if (p.defaultEndpoint) {
        expect(p.defaultEndpoint).toMatch(/^(\/|https?:\/\/)/);
      }
      if (p.id !== 'custom') {
        expect(p.models.length).toBeGreaterThan(0);
      }
    }
  });

  it('should verify Gemini provider has all 7 official free-tier models', () => {
    const gemini = getAiProvider('gemini');
    expect(gemini).toBeDefined();

    const geminiModelIds = gemini!.models.map((m) => m.id);
    const requiredGemini = [
      'gemini-3.8-flash',
      'gemini-3.7-flash',
      'gemini-3.6-flash',
      'gemini-3.5-flash',
      'gemini-3.5-flash-lite',
      'gemini-3-flash',
      'gemini-3.1-flash-lite',
    ];

    for (const req of requiredGemini) {
      expect(geminiModelIds).toContain(req);
    }
  });
});
