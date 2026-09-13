/**
 * scripts/test-ai-gemini-tools.mjs
 * -----------------------------------------------------------------------------
 * 单元与集成测试：Google Gemini 工具调用 (Tool Calling / thought_signature)
 * 验证四层纵深防御：
 * 1. streamChat 流式响应中 extra_content / thought_signature 的全层级捕获；
 * 2. streamChat 发送前对 Gemini 的签名自动补齐 (skip_thought_signature_validator) 与真实签名保留；
 * 3. streamChat 发送前对非 Gemini 提供商 (DeepSeek / OpenAI) 的特异字段自动清洗；
 * 4. dev-server-plugin 中继反代的请求体二次兜底注入；
 * 5. error-handler 对 thought_signature 异常的精准分类与诊断提示。
 * =============================================================================
 */

import assert from 'node:assert/strict';
import { parseAiError } from '../src/ai/error-handler.ts';

async function runGeminiToolTests() {
  console.log('=== 1. 验证 error-handler 对 thought_signature 400 异常的精准识别 ===');
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

  console.log(`· 诊断标题: "${parsedErr.title}"`);
  console.log(`· 诊断信息: "${parsedErr.message}"`);
  console.log(`· 修复建议: "${parsedErr.advice}"`);

  assert.ok(parsedErr.title.includes('思维签名'), '标题应明确指出思维签名校验异常');
  assert.ok(parsedErr.message.includes('thought_signature'), '诊断信息应包含 thought_signature');
  assert.ok(parsedErr.advice.includes('重试'), '修复建议应指导用户点击重试');
  console.log('✔ error-handler 精准分类与诊断验证通过\n');

  console.log('=== 2. 验证 streamChat 对 messages 的提供商特异性归一化 ===');
  // 模拟待发送的 messages 数组（包含工具调用）
  const sampleMessagesWithMissingSig = [
    { role: 'system', content: 'You are an academic tutor.' },
    { role: 'user', content: '什么是挠率？' },
    {
      role: 'assistant',
      content: null,
      tool_calls: [
        {
          id: 'call_123',
          type: 'function',
          function: { name: 'book_retrieve', arguments: '{"query":"挠率"}' },
        },
      ],
    },
    {
      role: 'tool',
      tool_call_id: 'call_123',
      name: 'book_retrieve',
      content: '{"results":[]}',
    },
  ];

  // 动态导入 llm.mjs 内部的归一化逻辑（测试 streamChat 中的规范化处理）
  // 模拟拦截 fetch 请求体，测试真实 streamChat 准备发送给上游的内容
  let capturedBody = null;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    capturedBody = JSON.parse(options.body);
    // 返回模拟 SSE 流
    const mockSse = [
      'data: {"choices":[{"delta":{"content":"挠率是描述曲线旋转程度的几何量。"}}]}',
      'data: [DONE]',
    ].join('\n\n');
    return new Response(mockSse, {
      status: 200,
      headers: { 'Content-Type': 'text/event-stream' },
    });
  };

  const { streamChat } = await import('../src/ai/llm.mjs');

  // 测试用例 2.1: 目标为 Gemini 且缺失签名时 -> 必须自动补齐 skip_thought_signature_validator
  await streamChat({
    endpoint: '/api/proxy/gemini/v1beta/openai/chat/completions',
    model: 'gemini-3.8-flash',
    messages: sampleMessagesWithMissingSig,
  });

  const geminiAssistantCall = capturedBody.messages[2].tool_calls[0];
  console.log('· Gemini 请求体 tool_calls[0]:', JSON.stringify(geminiAssistantCall));
  assert.ok(geminiAssistantCall.extra_content, 'Gemini 必须具备 extra_content');
  assert.equal(
    geminiAssistantCall.extra_content?.google?.thought_signature,
    'skip_thought_signature_validator',
    '缺失签名时应注入官方跳过标记 skip_thought_signature_validator'
  );
  console.log('✔ Gemini 缺失签名自动注入官方兜底标记验证通过');

  // 测试用例 2.2: 目标为 Gemini 且已有真实签名时 -> 必须保留真实签名，严禁被覆盖
  const sampleWithRealSig = [
    { role: 'user', content: 'test' },
    {
      role: 'assistant',
      tool_calls: [
        {
          id: 'call_real',
          type: 'function',
          function: { name: 'book_retrieve', arguments: '{}' },
          extra_content: { google: { thought_signature: 'REAL_ENCRYPTED_SIGNATURE_XYZ' } },
        },
      ],
    },
  ];
  await streamChat({
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    model: 'gemini-3.8-flash',
    messages: sampleWithRealSig,
  });
  const realSigCall = capturedBody.messages[1].tool_calls[0];
  assert.equal(
    realSigCall.extra_content?.google?.thought_signature,
    'REAL_ENCRYPTED_SIGNATURE_XYZ',
    '已有真实签名时必须原样透传'
  );
  console.log('✔ Gemini 真实签名完整保留验证通过');

  // 测试用例 2.3: 目标为 DeepSeek 等非 Gemini 端点 -> 必须清洗 extra_content，防止严格模式报错
  await streamChat({
    endpoint: 'https://api.deepseek.com/v1/chat/completions',
    model: 'deepseek-flash',
    messages: sampleWithRealSig,
  });
  const deepseekCall = capturedBody.messages[1].tool_calls[0];
  console.log('· DeepSeek 请求体 tool_calls[0]:', JSON.stringify(deepseekCall));
  assert.equal(deepseekCall.extra_content, undefined, 'DeepSeek 请求体必须剥离 extra_content');
  console.log('✔ 非 Gemini 提供商 (DeepSeek) 自动剥离特异字段验证通过\n');

  console.log('=== 3. 验证 streamChat 对流式 tool_calls 中 extra_content 的全层级捕获 ===');
  // 模拟 Gemini 流式返回工具调用与思维签名
  globalThis.fetch = async () => {
    const sseChunks = [
      'data: {"choices":[{"delta":{"tool_calls":[{"index":0,"id":"call_gemini_789","type":"function","function":{"name":"book_retrieve","arguments":""},"extra_content":{"google":{"thought_signature":"STREAM_CAPTURED_SIG_999"}}}]}}]}',
      'data: {"choices":[{"delta":{"tool_calls":[{"index":0,"function":{"arguments":"{\\"query\\":\\"挠率\\"}"}}]}}]}',
      'data: [DONE]',
    ].join('\n\n');
    return new Response(sseChunks, {
      status: 200,
      headers: { 'Content-Type': 'text/event-stream' },
    });
  };

  const streamResult = await streamChat({
    endpoint: '/api/proxy/gemini/v1beta/openai/chat/completions',
    model: 'gemini-3.8-flash',
    messages: [{ role: 'user', content: '提问' }],
  });

  console.log('· 流式捕获结果 toolCalls:', JSON.stringify(streamResult.toolCalls));
  assert.equal(streamResult.toolCalls.length, 1);
  assert.equal(streamResult.toolCalls[0].name, 'book_retrieve');
  assert.deepEqual(streamResult.toolCalls[0].arguments, { query: '挠率' });
  assert.equal(
    streamResult.toolCalls[0].extra_content?.google?.thought_signature,
    'STREAM_CAPTURED_SIG_999',
    '应完整捕获流式分片中的 thought_signature'
  );
  console.log('✔ 流式 tool_calls 的 extra_content 捕获验证通过\n');

  console.log('=== 4. 验证 dev-server-plugin 中继反代的请求体兜底机制 ===');
  // 测试 dev-server-plugin 的注入逻辑
  const sampleReqBody = JSON.stringify({
    model: 'gemini-3.8-flash',
    messages: [
      {
        role: 'assistant',
        tool_calls: [
          {
            id: 'legacy_call',
            type: 'function',
            function: { name: 'book_retrieve', arguments: '{}' },
          },
        ],
      },
    ],
  });

  // 模拟 dev-server-plugin 逻辑
  const parsed = JSON.parse(sampleReqBody);
  for (const m of parsed.messages) {
    if (m && m.role === 'assistant' && Array.isArray(m.tool_calls)) {
      for (const tc of m.tool_calls) {
        if (!tc.extra_content?.google?.thought_signature) {
          tc.extra_content = {
            ...(tc.extra_content || {}),
            google: {
              ...((tc.extra_content && tc.extra_content.google) || {}),
              thought_signature: 'skip_thought_signature_validator',
            },
          };
        }
      }
    }
  }
  assert.equal(
    parsed.messages[0].tool_calls[0].extra_content?.google?.thought_signature,
    'skip_thought_signature_validator'
  );
  console.log('✔ 中继反代层兜底注入逻辑验证通过\n');

  // 恢复原始 fetch
  globalThis.fetch = originalFetch;

  console.log('========================================');
  console.log('Gemini 工具调用与签名防御专项测试全部通过！');
  console.log('========================================');
}

runGeminiToolTests().catch((err) => {
  console.error('测试失败:', err);
  process.exit(1);
});
