import { extractErrorMessageAndStatus, parseAiError } from './error-handler.ts';

export interface AiModelDef {
  id: string;
  label: string;
  provider: 'gemini' | 'deepseek' | 'custom';
  endpoint?: string;
  desc?: string;
  isCustom?: boolean;
}

export interface AiProviderDef {
  id: 'gemini' | 'deepseek' | 'custom';
  label: string;
  defaultEndpoint: string;
  keyPlaceholder: string;
  defaultModelId: string;
  models: AiModelDef[];
  desc?: string;
}

export interface EffectiveAiConfig {
  provider: 'gemini' | 'deepseek' | 'custom';
  providerLabel: string;
  model: string;
  label: string;
  endpoint: string;
  apiKey: string;
  maxTokens: number;
  maxContextChars: number;
  topK: number;
  answerMode?: 'retrieve' | 'discussion';
  sourceOpen?: 'new' | 'same';
  panelDimensions?: { width: number; height: number; preset: string; customWidth?: number; customHeight?: number };
  autoCollapsePreceding?: boolean;
}

export const GEMINI_OFFICIAL_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
export const GEMINI_DEV_PROXY_ENDPOINT = '/api/proxy/gemini/v1beta/openai/chat/completions';

export function getGeminiDefaultEndpoint(): string {
  if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
    return GEMINI_DEV_PROXY_ENDPOINT;
  }
  return GEMINI_OFFICIAL_ENDPOINT;
}

export const DEFAULT_AI_PROVIDERS: AiProviderDef[] = [
  {
    id: 'gemini',
    label: 'Google Gemini',
    defaultEndpoint: getGeminiDefaultEndpoint(),
    keyPlaceholder: 'AIzaSy...',
    defaultModelId: 'gemini-3.8-flash',
    desc: 'Google 官方前沿学术与长上下文模型，提供免费调用额度',
    models: [
      {
        id: 'gemini-3.8-flash',
        label: 'Gemini 3.8 Flash',
        provider: 'gemini',
        desc: '推荐 · 最强理科与长文推理 Flash 模型，拥有免费额度',
      },
      {
        id: 'gemini-3.7-flash',
        label: 'Gemini 3.7 Flash',
        provider: 'gemini',
        desc: '前沿混合推理 Flash 模型，拥有免费额度',
      },
      {
        id: 'gemini-3.6-flash',
        label: 'Gemini 3.6 Flash',
        provider: 'gemini',
        desc: '高速通识推导模型，拥有免费额度',
      },
      {
        id: 'gemini-3.5-flash',
        label: 'Gemini 3.5 Flash',
        provider: 'gemini',
        desc: '经典极速 Flash 模型，响应与质量均衡，拥有免费额度',
      },
      {
        id: 'gemini-3.5-flash-lite',
        label: 'Gemini 3.5 Flash Lite',
        provider: 'gemini',
        desc: '超轻量高并发低延迟模型，免费调用额度充裕',
      },
      {
        id: 'gemini-3-flash',
        label: 'Gemini 3 Flash',
        provider: 'gemini',
        desc: 'Gemini 3 基础 Flash 模型，拥有免费额度',
      },
      {
        id: 'gemini-3.1-flash-lite',
        label: 'Gemini 3.1 Flash Lite',
        provider: 'gemini',
        desc: 'Gemini 3.1 轻量基础模型，拥有免费额度',
      },
    ],
  },
  {
    id: 'deepseek',
    label: 'DeepSeek',
    defaultEndpoint: 'https://api.deepseek.com/v1/chat/completions',
    keyPlaceholder: 'sk-...',
    defaultModelId: 'deepseek-flash',
    desc: '深度求索新一代高效理科推理与多模态模型',
    models: [
      {
        id: 'deepseek-flash',
        label: 'DeepSeek V4.1 Flash',
        provider: 'deepseek',
        desc: '推荐 · 最新主力理科推理架构，超高性价比与原生多模态',
      },
      {
        id: 'deepseek-v4-flash',
        label: 'DeepSeek V4 Flash',
        provider: 'deepseek',
        desc: '经典高性价比理科推理模型，官方兼容端点',
      },
      {
        id: 'deepseek-v4-pro',
        label: 'DeepSeek V4 Pro',
        provider: 'deepseek',
        desc: '高精度专业理科推理模型',
      },
    ],
  },
  {
    id: 'custom',
    label: '自定义',
    defaultEndpoint: '',
    keyPlaceholder: 'sk-... 或模型专属 API 密钥',
    defaultModelId: '',
    desc: '自定义任何第三方 OpenAI 兼容端点（Ollama、Moonshot、SiliconFlow 等）',
    models: [],
  },
];

export const DEFAULT_ACTIVE_PROVIDER_ID = 'gemini';

export const DEFAULT_ACTIVE_MODEL_ID = 'gemini-3.8-flash';

const STORAGE_KEYS = {
  ACTIVE_PROVIDER: 'astrolib_ai_active_provider',
  ACTIVE_MODEL: 'astrolib_ai_active_model',
  PROVIDER_KEY_PREFIX: 'astrolib_ai_provider_key_',
  PROVIDER_ENDPOINT_PREFIX: 'astrolib_ai_provider_endpoint_',
  PROVIDER_MODEL_PREFIX: 'astrolib_ai_provider_model_',
  CUSTOM_MODELS: 'astrolib_ai_custom_models',
  MAX_TOKENS: 'astrolib_ai_maxtok',
  MAX_CONTEXT_CHARS: 'astrolib_ai_maxctx',
  TOP_K: 'astrolib_ai_topk',
  ANSWER_MODE: 'astrolib_ai_answer_mode',
  SRC_OPEN: 'astrolib_ai_src_open',
  PANEL_WIDTH: 'astrolib_ai_panel_width',
  PANEL_HEIGHT: 'astrolib_ai_panel_height',
  SIZE_PRESET: 'astrolib_ai_size_preset',
  CUSTOM_WIDTH: 'astrolib_ai_custom_width',
  CUSTOM_HEIGHT: 'astrolib_ai_custom_height',
  AUTO_COLLAPSE_TOOLS: 'astrolib_ai_auto_collapse_tools',
} as const;

export const AI_CONFIG_CHANGE_EVENT = 'astrolib:ai-config-change';

function safeGetItem(key: string): string | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(key, value);
  } catch {}
}

function safeRemoveItem(key: string): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(key);
  } catch {}
}

export function dispatchAiConfigChange(): void {
  if (typeof window === 'undefined') return;
  try {
    const config = getEffectiveAiClientConfig();
    window.dispatchEvent(new CustomEvent(AI_CONFIG_CHANGE_EVENT, { detail: config }));
  } catch {}
}

export function onAiConfigChange(callback: (config: EffectiveAiConfig) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = (e: Event) => {
    const customEvent = e as CustomEvent<EffectiveAiConfig>;
    if (customEvent.detail) {
      callback(customEvent.detail);
    } else {
      callback(getEffectiveAiClientConfig());
    }
  };
  window.addEventListener(AI_CONFIG_CHANGE_EVENT, handler);
  return () => {
    window.removeEventListener(AI_CONFIG_CHANGE_EVENT, handler);
  };
}

export function getCustomAiModels(): AiModelDef[] {
  try {
    const raw = safeGetItem(STORAGE_KEYS.CUSTOM_MODELS);
    if (!raw) return [];
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    return list.map((m) => ({ ...m, provider: 'custom', isCustom: true }));
  } catch {
    return [];
  }
}

export function addCustomAiModel(model: { id: string; label: string; endpoint: string; desc?: string }): boolean {
  if (!model || !model.id || !model.endpoint) return false;
  const customs = getCustomAiModels();
  const id = model.id.trim();
  const label = (model.label || id).trim();
  const endpoint = model.endpoint.trim();

  const idx = customs.findIndex((c) => c.id === id);
  if (idx >= 0) {
    customs[idx] = { id, label, provider: 'custom', endpoint, desc: model.desc?.trim(), isCustom: true };
  } else {
    customs.push({ id, label, provider: 'custom', endpoint, desc: model.desc?.trim(), isCustom: true });
  }

  safeSetItem(STORAGE_KEYS.CUSTOM_MODELS, JSON.stringify(customs));
  saveAiActiveProvider('custom');
  saveAiActiveModel(id);
  return true;
}

export function removeCustomAiModel(modelId: string): boolean {
  const customs = getCustomAiModels().filter((c) => c.id !== modelId);
  safeSetItem(STORAGE_KEYS.CUSTOM_MODELS, JSON.stringify(customs));

  if (getActiveAiModelId() === modelId) {
    saveAiActiveProvider(DEFAULT_ACTIVE_PROVIDER_ID);
    saveAiActiveModel(DEFAULT_ACTIVE_MODEL_ID);
  } else {
    dispatchAiConfigChange();
  }
  return true;
}

export function getAllAiProviders(): AiProviderDef[] {
  const customs = getCustomAiModels();
  return DEFAULT_AI_PROVIDERS.map((p) => {
    if (p.id === 'custom') {
      return {
        ...p,
        models: customs,
        defaultModelId: customs[0]?.id || '',
      };
    }
    if (p.id === 'gemini') {
      return {
        ...p,
        defaultEndpoint: getGeminiDefaultEndpoint(),
      };
    }
    return p;
  });
}

export function getAiProvider(providerId?: string): AiProviderDef {
  const providers = getAllAiProviders();
  const targetId = providerId || getActiveAiProviderId();
  return providers.find((p) => p.id === targetId) || providers[0];
}

export function getActiveAiProviderId(): 'gemini' | 'deepseek' | 'custom' {
  const saved = safeGetItem(STORAGE_KEYS.ACTIVE_PROVIDER) as any;
  if (saved === 'gemini' || saved === 'deepseek' || saved === 'custom') {
    return saved;
  }

  const activeModelId = safeGetItem(STORAGE_KEYS.ACTIVE_MODEL);
  if (activeModelId) {
    if (activeModelId.startsWith('gemini')) return 'gemini';
    if (activeModelId.startsWith('deepseek')) return 'deepseek';
    const customs = getCustomAiModels();
    if (customs.some((c) => c.id === activeModelId)) return 'custom';
  }
  return DEFAULT_ACTIVE_PROVIDER_ID;
}

export function saveAiActiveProvider(providerId: 'gemini' | 'deepseek' | 'custom'): void {
  safeSetItem(STORAGE_KEYS.ACTIVE_PROVIDER, providerId);
  const provider = getAiProvider(providerId);

  const rememberedModel = safeGetItem(STORAGE_KEYS.PROVIDER_MODEL_PREFIX + providerId);
  const validModel = provider.models.find((m) => m.id === rememberedModel);
  const nextModelId = validModel ? validModel.id : provider.defaultModelId || provider.models[0]?.id || DEFAULT_ACTIVE_MODEL_ID;

  if (nextModelId) {
    safeSetItem(STORAGE_KEYS.ACTIVE_MODEL, nextModelId);
  }

  dispatchAiConfigChange();
}

export function getModelsByProvider(providerId: string): AiModelDef[] {
  const provider = getAiProvider(providerId);
  return provider.models || [];
}

export function getAllAiModels(): AiModelDef[] {
  const providers = getAllAiProviders();
  const results: AiModelDef[] = [];
  const seen = new Set<string>();

  for (const p of providers) {
    for (const m of p.models) {
      if (m && m.id && !seen.has(m.id)) {
        seen.add(m.id);
        results.push(m);
      }
    }
  }
  return results;
}

export function getActiveAiModelId(): string {
  const saved = safeGetItem(STORAGE_KEYS.ACTIVE_MODEL);
  if (saved) return saved;

  const provider = getAiProvider();
  return provider.defaultModelId || DEFAULT_ACTIVE_MODEL_ID;
}

export function getActiveAiModel(): AiModelDef {
  const all = getAllAiModels();
  const currentId = getActiveAiModelId();
  const found = all.find((m) => m.id === currentId);
  if (found) return found;

  const provider = getAiProvider();
  return provider.models[0] || all[0];
}

export function saveAiActiveModel(modelId: string): void {
  safeSetItem(STORAGE_KEYS.ACTIVE_MODEL, modelId);

  const all = getAllAiModels();
  const found = all.find((m) => m.id === modelId);
  if (found) {
    safeSetItem(STORAGE_KEYS.ACTIVE_PROVIDER, found.provider);
    safeSetItem(STORAGE_KEYS.PROVIDER_MODEL_PREFIX + found.provider, modelId);
  }

  dispatchAiConfigChange();
}

export function getProviderApiKey(providerId?: string): string {
  const targetProvider = providerId || getActiveAiProviderId();
  const key = safeGetItem(STORAGE_KEYS.PROVIDER_KEY_PREFIX + targetProvider);
  return (key || '').trim();
}

export function saveProviderApiKey(providerId: string, apiKey: string): void {
  const cleanKey = (apiKey || '').trim();
  const targetProvider = providerId || getActiveAiProviderId();

  if (cleanKey) {
    safeSetItem(STORAGE_KEYS.PROVIDER_KEY_PREFIX + targetProvider, cleanKey);
  } else {
    safeRemoveItem(STORAGE_KEYS.PROVIDER_KEY_PREFIX + targetProvider);
  }

  dispatchAiConfigChange();
}

export function getProviderEndpoint(providerId?: string): string {
  const targetProvider = providerId || getActiveAiProviderId();
  const override = safeGetItem(STORAGE_KEYS.PROVIDER_ENDPOINT_PREFIX + targetProvider);
  if (override && override.trim()) {
    const cleanOverride = override.trim();

    if (targetProvider === 'gemini' && typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
      if (cleanOverride === GEMINI_OFFICIAL_ENDPOINT) {
        return GEMINI_DEV_PROXY_ENDPOINT;
      }
    }
    return cleanOverride;
  }

  const provider = getAiProvider(targetProvider);
  return provider.defaultEndpoint || '';
}

export function saveProviderEndpoint(providerId: string, endpoint: string): void {
  const cleanEp = (endpoint || '').trim();
  const targetProvider = providerId || getActiveAiProviderId();

  if (cleanEp) {
    safeSetItem(STORAGE_KEYS.PROVIDER_ENDPOINT_PREFIX + targetProvider, cleanEp);
  } else {
    safeRemoveItem(STORAGE_KEYS.PROVIDER_ENDPOINT_PREFIX + targetProvider);
  }

  dispatchAiConfigChange();
}

export function getAiApiKey(modelId?: string): string {
  const targetModelId = modelId || getActiveAiModelId();
  const all = getAllAiModels();
  const found = all.find((m) => m.id === targetModelId);
  const providerId = found ? found.provider : getActiveAiProviderId();
  return getProviderApiKey(providerId);
}

export function saveAiApiKey(modelId: string, apiKey: string): void {
  const all = getAllAiModels();
  const found = all.find((m) => m.id === modelId);
  const providerId = found ? found.provider : getActiveAiProviderId();
  saveProviderApiKey(providerId, apiKey);
}

export function getAiEndpoint(modelId?: string): string {
  const targetModelId = modelId || getActiveAiModelId();
  const all = getAllAiModels();
  const found = all.find((m) => m.id === targetModelId);

  if (found && found.endpoint) {
    if (found.provider === 'gemini' && typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
      if (found.endpoint === GEMINI_OFFICIAL_ENDPOINT) {
        return getProviderEndpoint('gemini');
      }
    }
    return found.endpoint;
  }

  const providerId = found ? found.provider : getActiveAiProviderId();
  return getProviderEndpoint(providerId);
}

export function saveAiEndpoint(modelId: string, endpoint: string): void {
  const all = getAllAiModels();
  const found = all.find((m) => m.id === modelId);
  const providerId = found ? found.provider : getActiveAiProviderId();
  saveProviderEndpoint(providerId, endpoint);
}

export function getAiParams(): { maxTokens: number; maxContextChars: number; topK: number } {
  const rawTok = safeGetItem(STORAGE_KEYS.MAX_TOKENS);
  const rawCtx = safeGetItem(STORAGE_KEYS.MAX_CONTEXT_CHARS);
  const rawTopk = safeGetItem(STORAGE_KEYS.TOP_K);

  const maxTokens = rawTok !== null && rawTok !== '' ? parseInt(rawTok, 10) : 4096;
  const maxContextChars = rawCtx !== null && rawCtx !== '' ? parseInt(rawCtx, 10) : 6000;
  const topK = rawTopk !== null && rawTopk !== '' ? parseInt(rawTopk, 10) : 8;

  return {
    maxTokens: isNaN(maxTokens) ? 4096 : maxTokens,
    maxContextChars: isNaN(maxContextChars) ? 6000 : maxContextChars,
    topK: isNaN(topK) ? 8 : topK,
  };
}

export function saveAiParams(params: Partial<{ maxTokens: number; maxContextChars: number; topK: number }>): void {
  if (params.maxTokens !== undefined) safeSetItem(STORAGE_KEYS.MAX_TOKENS, String(params.maxTokens));
  if (params.maxContextChars !== undefined) safeSetItem(STORAGE_KEYS.MAX_CONTEXT_CHARS, String(params.maxContextChars));
  if (params.topK !== undefined) safeSetItem(STORAGE_KEYS.TOP_K, String(params.topK));
  dispatchAiConfigChange();
}

export function getAiAnswerMode(): 'retrieve' | 'discussion' {
  const val = safeGetItem(STORAGE_KEYS.ANSWER_MODE);
  return val === 'discussion' ? 'discussion' : 'retrieve';
}

export function saveAiAnswerMode(mode: 'retrieve' | 'discussion'): void {
  safeSetItem(STORAGE_KEYS.ANSWER_MODE, mode);
  dispatchAiConfigChange();
}

export function getAiSourceOpen(): 'new' | 'same' {
  const val = safeGetItem(STORAGE_KEYS.SRC_OPEN);
  return val === 'same' ? 'same' : 'new';
}

export function saveAiSourceOpen(mode: 'new' | 'same'): void {
  safeSetItem(STORAGE_KEYS.SRC_OPEN, mode);
  dispatchAiConfigChange();
}

export function getAiPanelDimensions(): {
  width: number;
  height: number;
  preset: string;
  customWidth: number;
  customHeight: number;
} {
  const rawW = safeGetItem(STORAGE_KEYS.PANEL_WIDTH);
  const rawH = safeGetItem(STORAGE_KEYS.PANEL_HEIGHT);
  const preset = safeGetItem(STORAGE_KEYS.SIZE_PRESET) || 'standard';
  const rawCustW = safeGetItem(STORAGE_KEYS.CUSTOM_WIDTH);
  const rawCustH = safeGetItem(STORAGE_KEYS.CUSTOM_HEIGHT);

  let width = rawW ? parseInt(rawW, 10) : 560;
  let height = rawH ? parseInt(rawH, 10) : 680;
  let customWidth = rawCustW ? parseInt(rawCustW, 10) : (rawW ? parseInt(rawW, 10) : 560);
  let customHeight = rawCustH ? parseInt(rawCustH, 10) : (rawH ? parseInt(rawH, 10) : 680);

  if (isNaN(width) || width <= 0) width = 560;
  if (isNaN(height) || height <= 0) height = 680;
  if (isNaN(customWidth) || customWidth <= 0) customWidth = 560;
  if (isNaN(customHeight) || customHeight <= 0) customHeight = 680;

  return { width, height, preset, customWidth, customHeight };
}

export function saveAiPanelDimensions(dim: {
  width?: number;
  height?: number;
  preset?: string;
  customWidth?: number;
  customHeight?: number;
}): void {
  if (dim.width !== undefined) safeSetItem(STORAGE_KEYS.PANEL_WIDTH, String(dim.width));
  if (dim.height !== undefined) safeSetItem(STORAGE_KEYS.PANEL_HEIGHT, String(dim.height));
  if (dim.preset !== undefined) safeSetItem(STORAGE_KEYS.SIZE_PRESET, dim.preset);
  if (dim.preset === 'custom' || dim.customWidth !== undefined) {
    const cw = dim.customWidth !== undefined ? dim.customWidth : dim.width;
    if (cw !== undefined) safeSetItem(STORAGE_KEYS.CUSTOM_WIDTH, String(cw));
  }
  if (dim.preset === 'custom' || dim.customHeight !== undefined) {
    const ch = dim.customHeight !== undefined ? dim.customHeight : dim.height;
    if (ch !== undefined) safeSetItem(STORAGE_KEYS.CUSTOM_HEIGHT, String(ch));
  }
  dispatchAiConfigChange();
}

export function getAiAutoCollapsePreceding(): boolean {
  const val = safeGetItem(STORAGE_KEYS.AUTO_COLLAPSE_TOOLS);
  if (val === null) return true;
  return val === 'true';
}

export function saveAiAutoCollapsePreceding(enabled: boolean): void {
  safeSetItem(STORAGE_KEYS.AUTO_COLLAPSE_TOOLS, enabled ? 'true' : 'false');
  dispatchAiConfigChange();
}

export function getEffectiveAiClientConfig(): EffectiveAiConfig {
  const provider = getAiProvider();
  const modelDef = getActiveAiModel();
  const apiKey = getProviderApiKey(provider.id);
  const endpoint = getAiEndpoint(modelDef.id);
  const params = getAiParams();

  return {
    provider: provider.id,
    providerLabel: provider.label,
    model: modelDef.id,
    label: modelDef.label,
    endpoint,
    apiKey,
    maxTokens: params.maxTokens,
    maxContextChars: params.maxContextChars,
    topK: params.topK,
    answerMode: getAiAnswerMode(),
    sourceOpen: getAiSourceOpen(),
    panelDimensions: getAiPanelDimensions(),
    autoCollapsePreceding: getAiAutoCollapsePreceding(),
  };
}

export interface TestAiResult {
  ok: boolean;
  latencyMs: number;
  message: string;
  statusCode?: number;
  rawError?: string;
}

export async function testAiConnection(
  modelId?: string,
  explicitKey?: string,
  explicitEndpoint?: string,
  providerId?: string
): Promise<TestAiResult> {
  const targetProviderId = providerId || getActiveAiProviderId();
  const targetId = modelId || getActiveAiModelId();
  const apiKey = (explicitKey !== undefined ? explicitKey : getProviderApiKey(targetProviderId)).trim();
  let endpoint = (explicitEndpoint !== undefined ? explicitEndpoint : getProviderEndpoint(targetProviderId)).trim();
  if (targetProviderId === 'gemini' && typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
    if (endpoint === GEMINI_OFFICIAL_ENDPOINT) {
      endpoint = GEMINI_DEV_PROXY_ENDPOINT;
    }
  }

  if (!apiKey) {
    return { ok: false, latencyMs: 0, message: '请先填写 API Key' };
  }
  if (!endpoint) {
    return { ok: false, latencyMs: 0, message: '请填写端点 URL' };
  }

  const t0 = performance.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: targetId,
        messages: [{ role: 'user', content: 'hi' }],
        max_tokens: 1,
        stream: false,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const latencyMs = Math.round(performance.now() - t0);

    if (res.ok) {
      return {
        ok: true,
        latencyMs,
        statusCode: res.status,
        message: `连接成功 · ${latencyMs}ms`,
      };
    } else {
      const rawText = await res.text().catch(() => '');
      const errInfo = parseAiError(rawText, {
        statusCode: res.status,
        providerId: targetProviderId,
        modelId: targetId,
        endpoint,
      });

      let shortMsg = `HTTP ${res.status}`;
      if (errInfo.category === 'quota') {
        shortMsg = `HTTP 429 · 配额耗尽或超限`;
      } else if (errInfo.category === 'auth') {
        shortMsg = `HTTP ${res.status} · API Key 无效`;
      } else if (errInfo.category === 'not_found') {
        shortMsg = `HTTP 404 · 模型不可用`;
      } else if (errInfo.message) {
        shortMsg = `HTTP ${res.status}: ${errInfo.message.slice(0, 32)}`;
      }

      return {
        ok: false,
        latencyMs,
        statusCode: res.status,
        message: shortMsg,
        rawError: rawText,
      };
    }
  } catch (err: unknown) {
    const latencyMs = Math.round(performance.now() - t0);
    const error = err as Error;
    if (error?.name === 'AbortError') {
      return { ok: false, latencyMs, message: '请求超时 (12s)' };
    }
    return { ok: false, latencyMs, message: error?.message || '网络连接失败' };
  }
}
