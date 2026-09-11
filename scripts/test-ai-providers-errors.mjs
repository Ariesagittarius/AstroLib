import {
  getAllAiProviders,
  getAiProvider,
  getModelsByProvider,
  testAiConnection,
} from '../src/ai/ai-config.ts';

import {
  parseAiError,
  renderErrorCardHtml,
  generateDiagnosticText,
  extractErrorMessageAndStatus,
} from '../src/ai/error-handler.ts';

async function runTests() {
  console.log('=== 1. 验证 AI 提供商与模型列表 ===');
  const providers = getAllAiProviders();
  console.log(`已配置提供商数: ${providers.length}`);
  for (const p of providers) {
    console.log(`· 提供商: ${p.label} (id: ${p.id}, 默认模型: ${p.defaultModelId || '无'})`);
    console.log(`  端点: ${p.defaultEndpoint}`);
    console.log(`  模型清单: ${p.models.map((m) => m.id).join(', ')}`);
  }

  const gemini = getAiProvider('gemini');
  if (!gemini) throw new Error('未找到 gemini 提供商');
  const geminiModelIds = gemini.models.map((m) => m.id);
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
    if (!geminiModelIds.includes(req)) {
      throw new Error(`Gemini 提供商缺少必要模型: ${req}`);
    }
  }
  console.log('✔ Gemini 7 个免费额度模型校验全部通过');

  const deepseek = getAiProvider('deepseek');
  if (!deepseek) throw new Error('未找到 deepseek 提供商');
  const deepseekModelIds = deepseek.models.map((m) => m.id);
  if (deepseekModelIds.includes('deepseek-reasoner') || deepseekModelIds.includes('deepseek-chat')) {
    throw new Error('DeepSeek 提供商不应包含淘汰的 R1 或 V3 模型');
  }
  const requiredDeepSeek = ['deepseek-flash', 'deepseek-v4-flash', 'deepseek-v4-pro'];
  for (const req of requiredDeepSeek) {
    if (!deepseekModelIds.includes(req)) {
      throw new Error(`DeepSeek 提供商缺少必要模型: ${req}`);
    }
  }
  console.log('✔ DeepSeek V4.1 Flash, V4 Flash, V4 Pro 模型校验全部通过');

  console.log('\n=== 2. 验证错误解析器对特殊形态报错的处理 ===');

  const gemini429Payload = JSON.stringify([
    {
      error: {
        code: 429,
        message: 'Resource has been exhausted (e.g. check quota).',
        status: 'RESOURCE_EXHAUSTED',
      },
    },
  ]);
  const errA = parseAiError(gemini429Payload, {
    statusCode: 429,
    providerId: 'gemini',
    providerLabel: 'Google Gemini',
    modelId: 'gemini-3.8-flash',
  });
  console.log(`用例 A (Gemini 429 数组): 分类=${errA.category}, 标题="${errA.title}"`);
  if (errA.category !== 'quota') throw new Error('用例 A 分类预期为 quota');

  const gemini400Payload = JSON.stringify([
    {
      error: {
        code: 400,
        message: 'Please pass a valid API key',
        status: 'INVALID_ARGUMENT',
      },
    },
  ]);
  const errB = parseAiError(gemini400Payload, {
    statusCode: 400,
    providerId: 'gemini',
    providerLabel: 'Google Gemini',
  });
  console.log(`用例 B (Gemini 400 Key 无效): 分类=${errB.category}, 标题="${errB.title}"`);
  if (errB.category !== 'auth') throw new Error('用例 B 分类预期为 auth');

  const deepseek401Payload = JSON.stringify({
    error: {
      message: 'Authentication Fails (no such user)',
      type: 'authentication_error',
      code: 'invalid_request_error',
    },
  });
  const errC = parseAiError(deepseek401Payload, {
    statusCode: 401,
    providerId: 'deepseek',
    providerLabel: 'DeepSeek',
  });
  console.log(`用例 C (DeepSeek 401): 分类=${errC.category}, 标题="${errC.title}"`);
  if (errC.category !== 'auth') throw new Error('用例 C 分类预期为 auth');

  console.log('✔ 各提供商错误解析与分类测试全部通过');

  console.log('\n=== 3. 验证卡片 HTML 渲染与诊断文本 ===');
  const cardHtml = renderErrorCardHtml(errA);
  if (!cardHtml.includes('ask-error-card') || !cardHtml.includes('重试') || !cardHtml.includes('复制日志')) {
    throw new Error('卡片 HTML 结构缺失必要控件');
  }
  const diagText = generateDiagnosticText(errA);
  if (!diagText.includes('AstroLib AI 问答诊断日志') || !diagText.includes('gemini-3.8-flash')) {
    throw new Error('诊断文本格式异常');
  }
  console.log('✔ 错误卡片 HTML 与可复制诊断日志格式校验通过');

  console.log('\n=== 4. 真实网络连通与错误拦截测试 (Google Gemini REST 端点) ===');
  const realTest = await testAiConnection(
    'gemini-3.8-flash',
    'invalid_test_key_for_verification',
    'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    'gemini'
  );
  console.log(`真实网络测试反馈: ok=${realTest.ok}, statusCode=${realTest.statusCode}, message="${realTest.message}"`);
  if (realTest.ok) throw new Error('使用无效密钥应当返回失败');
  if (realTest.statusCode !== 400) throw new Error(`预期返回 HTTP 400，实际返回 ${realTest.statusCode}`);
  if (!realTest.message.includes('API Key 无效') && !realTest.message.includes('400')) {
    throw new Error(`错误提示语未能正确识别: ${realTest.message}`);
  }
  console.log('✔ 真实网络端点拦截与友好报错提示验证完全成功！');

  console.log('\n========================================');
  console.log('全部单元与集成测试顺利通过！');
  console.log('========================================');
}

runTests().catch((e) => {
  console.error('测试失败:', e);
  process.exit(1);
});
