import { describe, it, expect } from 'vitest';
import { parseAiError } from '@/ai/error-handler.ts';

describe('AI Gemini Tools & Signature Defensive Suite (Unit Tests)', () => {
  it('should accurately diagnose thought_signature 400 error and provide recovery advice', () => {
    const gemini400UserPayload = JSON.stringify([
      {
        error: {
          code: 400,
          message:
            'Function call is missing a thought_signature in functionCall parts. This is required for tools to work correctly, and missing thought_signature may lead to degraded model performance. Additional data, function call `default_api:book_retrieve` , position 2. Please refer to https://ai.google.dev/gemini-api/docs/thought-signatures for more details.',
          status: 'INVALID_ARGUMENT',
        },
      },
    ]);

    const parsedErr = parseAiError(gemini400UserPayload, {
      statusCode: 400,
      providerId: 'gemini',
      providerLabel: 'Google Gemini',
      modelId: 'gemini-3.8-flash',
      modelLabel: 'Gemini 3.8 Flash',
      endpoint: '/api/proxy/gemini/v1beta/openai/chat/completions',
    });

    expect(parsedErr.title).toContain('思维签名');
    expect(parsedErr.message).toContain('thought_signature');
    expect(parsedErr.advice).toContain('重试');
  });

  it('should categorize 429 quota limits appropriately', () => {
    const quotaError = JSON.stringify({
      error: {
        code: 429,
        message: 'Resource has been exhausted (e.g. check quota).',
      },
    });

    const parsedErr = parseAiError(quotaError, {
      statusCode: 429,
      providerId: 'gemini',
      modelId: 'gemini-3.8-flash',
    });

    expect(parsedErr.title).toContain('429');
    expect(parsedErr.title).toContain('配额');
  });
});
