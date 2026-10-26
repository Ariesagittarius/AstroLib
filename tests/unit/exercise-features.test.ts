import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { exerciseDb } from '../../src/utils/exercise-db/exercise-db-client';
import {
  saveAiActiveProvider,
  saveProviderApiKey,
  getAiProvider,
  getProviderApiKey,
} from '../../src/ai/ai-config';

describe('Exercise Features and Fallbacks', () => {
  const root = path.resolve('.');
  const publicCommunityFile = path.join(root, 'public', 'data', 'exercises', 'community_ai_solutions.json');
  let store: Map<string, string>;

  beforeEach(() => {
    store = new Map<string, string>();
    (globalThis as any).localStorage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => store.set(k, String(v)),
      removeItem: (k: string) => store.delete(k),
      clear: () => store.clear(),
    };
  });

  afterEach(() => {
    delete (globalThis as any).localStorage;
  });

  it('验证 public/data/exercises/community_ai_solutions.json 存在且结构合法', () => {
    expect(fs.existsSync(publicCommunityFile)).toBe(true);
    const raw = fs.readFileSync(publicCommunityFile, 'utf8');
    const data = JSON.parse(raw);
    expect(data).toBeDefined();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(data[0].question_id).toBeDefined();
  });

  it('fetchCommunitySolutions 在生产静态环境下成功退避至静态 JSON 文件 (Array 格式)', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('/api/exercise/community-solutions')) {
        return {
          ok: false,
          status: 404,
          json: async () => ({ error: 'Not found' }),
        };
      }
      if (url.includes('/data/exercises/community_ai_solutions.json')) {
        return {
          ok: true,
          status: 200,
          json: async () => [
            {
              id: 'sol-01',
              question_id: 'TEST-Q01',
              model_name: 'DeepSeek V4.1 Flash',
              author_name: '学术助手',
              solution_md: '$$f(x) = x^2$$',
              upvotes: 5,
            },
          ],
        };
      }
      return { ok: false, status: 500 };
    }) as any;

    try {
      const results = await exerciseDb.fetchCommunitySolutions('TEST-Q01');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('sol-01');
      expect(results[0].model_name).toBe('DeepSeek V4.1 Flash');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('fetchCommunitySolutions 在生产静态环境下成功退避至静态 JSON 文件 (Object 字典格式)', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('/api/exercise/community-solutions')) {
        return {
          ok: false,
          status: 404,
          json: async () => ({ error: 'Not found' }),
        };
      }
      if (url.includes('/data/exercises/community_ai_solutions.json')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            'TEST-Q02': [
              {
                id: 'sol-02',
                question_id: 'TEST-Q02',
                model_name: 'Gemini 3.8 Flash',
                author_name: '社区贡献',
                solution_md: '$$\\lim_{x\\to 0} \\frac{\\sin x}{x} = 1$$',
                upvotes: 12,
              },
            ],
          }),
        };
      }
      return { ok: false, status: 500 };
    }) as any;

    try {
      const results = await exerciseDb.fetchCommunitySolutions('TEST-Q02');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('sol-02');
      expect(results[0].model_name).toBe('Gemini 3.8 Flash');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('支持在模态窗中快速切换提供商并持久化各自专属 API Key', () => {
    saveAiActiveProvider('deepseek');
    expect(getAiProvider().id).toBe('deepseek');
    saveProviderApiKey('deepseek', 'sk-test-deepseek-key');
    expect(getProviderApiKey('deepseek')).toBe('sk-test-deepseek-key');

    saveAiActiveProvider('gemini');
    expect(getAiProvider().id).toBe('gemini');
    saveProviderApiKey('gemini', 'AIzaSyTestGeminiKey');
    expect(getProviderApiKey('gemini')).toBe('AIzaSyTestGeminiKey');

    expect(getProviderApiKey('deepseek')).toBe('sk-test-deepseek-key');
  });
});
