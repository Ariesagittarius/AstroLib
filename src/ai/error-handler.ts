/**
 * src/ai/error-handler.ts
 * =============================================================================
 * AstroLib AI 问答统一错误诊断与日志提取中心
 * -----------------------------------------------------------------------------
 * 职责：
 * 1. 深度解析各大模型提供商（Google Gemini、DeepSeek、OpenAI、自定义等）的各种报错形态：
 *    - Google Gemini REST 数组形态: [{ error: { code: 429, message: "...", status: "RESOURCE_EXHAUSTED" } }]
 *    - Google Gemini / OpenAI 标准对象: { error: { message: "...", code: "...", status: "..." } }
 *    - 纯文本或 HTTP 响应体
 * 2. 结构化分类错误（配额超限/频控、密钥无效、模型不存在、网络受阻、服务端维护等）；
 * 3. 产出学术精美、轻量宁静的 Material 3 错误卡片 HTML 与完整诊断日志，供用户一键排查与复制。
 * =============================================================================
 */

export type AiErrorCategory =
  | 'quota'       // 配额耗尽或并发速率超限 (429 / RESOURCE_EXHAUSTED)
  | 'auth'        // API Key 无效、缺失或未授权 (400 / 401 / 403)
  | 'not_found'   // 模型不存在或未开放 (404)
  | 'network'     // 浏览器网络连接失败 / CORS 阻断
  | 'server'      // 服务商服务器异常 (500 / 502 / 503)
  | 'abort'       // 用户主动取消生成
  | 'unknown';    // 其他未知异常

export interface AiErrorInfo {
  category: AiErrorCategory;
  statusCode: number;
  title: string;
  message: string;
  advice: string;
  rawText: string;
  providerId?: string;
  providerLabel?: string;
  modelId?: string;
  modelLabel?: string;
  endpoint?: string;
  timestamp: string;
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * 递归从各种异常格式中提取最深层错误描述
 */
export function extractErrorMessageAndStatus(raw: any): { status?: number; message: string; rawText: string } {
  let rawText = '';
  let status: number | undefined;
  let message = '';

  if (typeof raw === 'string') {
    rawText = raw.trim();
    // 尝试解析内嵌 JSON
    try {
      const parsed = JSON.parse(rawText);
      return extractErrorMessageAndStatus(parsed);
    } catch {
      // 检查是否包含 HTTP 状态码前缀，如 "LLM 请求失败 429: ..."
      const match = rawText.match(/(?:请求失败|status|HTTP)\s*[:=]?\s*(\d{3})/i);
      if (match) status = parseInt(match[1], 10);
      message = rawText;
    }
  } else if (raw && typeof raw === 'object') {
    // 检查是否为数组形态 (Google Gemini OpenAI 端点常返回 [{ error: { ... } }])
    let target = raw;
    if (Array.isArray(raw)) {
      target = raw[0] || {};
    }

    try {
      rawText = JSON.stringify(raw, null, 2);
    } catch {
      rawText = String(raw);
    }

    const errObj = target.error || target;
    if (typeof errObj === 'object' && errObj !== null) {
      if (typeof errObj.code === 'number') status = errObj.code;
      if (typeof errObj.status === 'number') status = errObj.status;

      message = errObj.message || errObj.status || target.message || '';
    } else if (typeof target.message === 'string') {
      message = target.message;
    }
  }

  if (!message && rawText) {
    message = rawText.slice(0, 300);
  }

  return { status, message, rawText };
}

/**
 * 将各类运行时异常解析为标准化 AiErrorInfo
 */
export function parseAiError(
  err: unknown,
  context?: {
    statusCode?: number;
    providerId?: string;
    providerLabel?: string;
    modelId?: string;
    modelLabel?: string;
    endpoint?: string;
  }
): AiErrorInfo {
  const timestamp = new Date().toLocaleTimeString('zh-CN', { hour12: false });
  const errorObj = err as any;

  // 1. 检查是否为用户主动取消
  if (errorObj?.name === 'AbortError' || errorObj?.message === 'AbortError') {
    return {
      category: 'abort',
      statusCode: 0,
      title: '生成已停止',
      message: '您已主动停止了本次 AI 问答生成。',
      advice: '如需继续探讨，可点击下方输入框重新发送提问。',
      rawText: 'User aborted request.',
      ...context,
      timestamp,
    };
  }

  // 2. 提取状态码与错误正文
  const { status: parsedStatus, message: extractedMsg, rawText } = extractErrorMessageAndStatus(
    errorObj?.responseBody || errorObj?.rawText || errorObj?.message || errorObj
  );

  const statusCode = context?.statusCode || errorObj?.status || errorObj?.statusCode || parsedStatus || 0;
  const lowerMsg = (extractedMsg || '').toLowerCase();
  const lowerRaw = (rawText || '').toLowerCase();

  // 3. 智能判定错误分类 (Category)
  let category: AiErrorCategory = 'unknown';
  let title = '请求异常';
  let message = extractedMsg || '模型接口请求未能顺利完成。';
  let advice = '建议检查网络连接或稍后重试。';

  // 429 配额耗尽或频率限制
  if (
    statusCode === 429 ||
    lowerMsg.includes('resource_exhausted') ||
    lowerMsg.includes('quota') ||
    lowerMsg.includes('rate_limit') ||
    lowerMsg.includes('insufficient_quota') ||
    lowerMsg.includes('insufficient_balance') ||
    lowerRaw.includes('resource_exhausted')
  ) {
    category = 'quota';
    title = `配额超限或并发过频 (${statusCode || 429})`;
    message = `当前模型在提供商（${context?.providerLabel || '当前提供商'}）处的可用免费/用量额度已耗尽，或请求频次超过了每分钟限制。`;
    advice = '建议：\n1. 稍等 10-30 秒后点击下方“重试”按钮；\n2. 点击右上角快速设置 -> AI，切换至同提供商的其他轻量模型（如 Flash Lite 系列）；\n3. 前往提供商控制台检查当前 API Key 的配额与账单余额。';
  }
  // 400 / 401 / 403 认证错误
  else if (
    statusCode === 401 ||
    statusCode === 403 ||
    (statusCode === 400 && (lowerMsg.includes('api key') || lowerMsg.includes('invalid_argument') || lowerMsg.includes('authentication'))) ||
    lowerMsg.includes('invalid_api_key') ||
    lowerMsg.includes('unauthorized') ||
    lowerMsg.includes('authentication fails') ||
    lowerMsg.includes('pass a valid api key')
  ) {
    category = 'auth';
    title = `API Key 认证失败 (${statusCode || 401})`;
    message = `提供商拒绝了当前 API Key：密钥可能未填写、已失效、权限不足或存在格式与首尾空格错误。`;
    advice = `建议：点击右上角“快速设置” -> “AI”，重新粘贴当前【${context?.providerLabel || '所选提供商'}】的有效 API Key，并点击“测试连接”验证。`;
  }
  // 404 模型未开放或下线
  else if (statusCode === 404 || lowerMsg.includes('not_found') || lowerMsg.includes('model_not_found') || lowerRaw.includes('model not found')) {
    category = 'not_found';
    title = `模型未找到 (${statusCode || 404})`;
    message = `请求的模型（${context?.modelLabel || context?.modelId || '所选模型'}）在当前端点未部署或已被服务商停用。`;
    advice = '建议：在快速设置中切换至提供商官方目前活跃的推荐模型。';
  }
  // 5xx 服务端故障
  else if (statusCode >= 500) {
    category = 'server';
    title = `提供商服务器异常 (${statusCode})`;
    message = `模型服务商服务端临时繁忙、过载或正在进行维护更新。`;
    advice = '建议：稍后重试，或临时在快速设置中切换到备用提供商。';
  }
  // 网络连接阻断
  else if (
    errorObj instanceof TypeError ||
    lowerMsg.includes('failed to fetch') ||
    lowerMsg.includes('network') ||
    lowerMsg.includes('timeout') ||
    lowerMsg.includes('cors')
  ) {
    category = 'network';
    title = '网络连接受阻';
    message = '浏览器无法直连当前模型服务商的 API 端点。可能因网络连通波动，或该境外端点在当前网络环境下需要配置网络代理。';
    advice = '建议：检查当前网络连通性；若使用 Gemini 等境外端点，请确保本地代理环境正常，或在快速设置中配置反代端点。';
  } else if (statusCode > 0) {
    title = `HTTP ${statusCode} 错误`;
    advice = '建议展开下方“详细错误日志”排查服务商返回的具体原因。';
  }

  return {
    category,
    statusCode,
    title,
    message,
    advice,
    rawText: rawText || extractedMsg || String(err),
    ...context,
    timestamp,
  };
}

/**
 * 组装可一键复制的完整技术诊断信息
 */
export function generateDiagnosticText(info: AiErrorInfo): string {
  return [
    `=== AstroLib AI 问答诊断日志 ===`,
    `时间: ${info.timestamp}`,
    `提供商: ${info.providerLabel || info.providerId || '未指定'} (${info.providerId || 'unknown'})`,
    `调用模型: ${info.modelLabel || info.modelId || '未指定'} (${info.modelId || 'unknown'})`,
    `请求端点: ${info.endpoint || '默认端点'}`,
    `HTTP 状态码: ${info.statusCode || 'N/A'}`,
    `错误分类: ${info.category}`,
    `诊断摘要: ${info.title}`,
    `详细信息: ${info.message}`,
    `----------------------------------------`,
    `原始返回报文:`,
    info.rawText || '(无原始正文)',
    `========================================`,
  ].join('\n');
}

/**
 * 渲染宁静学术的 Material 3 错误卡片 HTML
 */
export function renderErrorCardHtml(info: AiErrorInfo): string {
  if (info.category === 'abort') {
    return `
      <div class="ask-abort-banner">
        <span class="ask-abort-icon">⏹</span>
        <span class="ask-abort-text">已停止生成</span>
      </div>
    `;
  }

  const diagText = escapeHtml(generateDiagnosticText(info));
  const categoryClass = `ask-err-${info.category}`;

  return `
    <div class="ask-error-card ${categoryClass}" role="alert">
      <div class="ask-error-header">
        <div class="ask-error-badge-group">
          <svg class="ask-error-icon" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.8 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
          <span class="ask-error-title">${escapeHtml(info.title)}</span>
        </div>
        <div class="ask-error-meta">${escapeHtml(info.modelLabel || info.modelId || '')} · ${escapeHtml(info.providerLabel || '')}</div>
      </div>

      <div class="ask-error-body">
        <p class="ask-error-desc">${escapeHtml(info.message)}</p>
        <div class="ask-error-advice">${escapeHtml(info.advice).replace(/\n/g, '<br/>')}</div>
      </div>

      <div class="ask-error-actions">
        <button type="button" class="ask-error-retry-btn" data-action="ask-retry" title="使用当前设置重新提问">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
            <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
          </svg>
          <span>重试</span>
        </button>

        <button type="button" class="ask-error-settings-btn" data-action="open-ai-settings" title="打开 AI 设置调整模型或密钥">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
            <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
          </svg>
          <span>切换模型 / 设置</span>
        </button>
      </div>

      <details class="ask-error-details">
        <summary class="ask-error-details-summary">
          <span>查看详细错误日志</span>
          <button type="button" class="ask-error-copy-btn" data-action="copy-error-log" title="复制完整诊断日志到剪贴板">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
              <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
            </svg>
            <span class="ask-copy-label">复制日志</span>
          </button>
        </summary>
        <pre class="ask-error-raw-pre"><code>${diagText}</code></pre>
      </details>
    </div>
  `;
}
