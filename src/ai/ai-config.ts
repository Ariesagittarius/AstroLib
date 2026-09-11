/**
 * src/ai/ai-config.ts
 * =============================================================================
 * AstroLib 统一 AI 提供商与模型配置中心（Single Source of Truth）
 * -----------------------------------------------------------------------------
 * 职责：
 * 1. 统一管理全站 AI 模型提供商（Google Gemini / DeepSeek / 自定义等）；
 * 2. 贯彻【选择提供商 -> 填写 API Key -> 选择模型】的统一交互规范；
 * 3. 集中处理按提供商维度的 API Key、端点 URL、激活模型的本地持久化；
 * 4. 派发与监听全站响应式事件（astrolib:ai-config-change），无缝联动问答与偏好设置。
 * =============================================================================
 */

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

/**
 * 获取 Google Gemini 的有效默认端点：
 * 在 Vite 本地开发态 (import.meta.env.DEV) 下默认使用本地 Node.js 进程全双工反代端点，
 * 彻底消除浏览器 CORS 预检与 TLS 指纹阻断；生产静态构建下使用官方直连端点。
 */
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

/** 默认激活提供商 */
export const DEFAULT_ACTIVE_PROVIDER_ID = 'gemini';
/** 默认激活模型 */
export const DEFAULT_ACTIVE_MODEL_ID = 'gemini-3.8-flash';

/** 统一存储键 */
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

/**
 * 派发全站 AI 配置变更广播
 */
export function dispatchAiConfigChange(): void {
  if (typeof window === 'undefined') return;
  try {
    const config = getEffectiveAiClientConfig();
    window.dispatchEvent(new CustomEvent(AI_CONFIG_CHANGE_EVENT, { detail: config }));
  } catch {}
}

/**
 * 监听全站 AI 配置变更
 */
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

/**
 * 获取自定义模型列表
 */
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

/**
 * 添加自定义模型
 */
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

/**
 * 删除自定义模型
 */
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

/**
 * 获取所有提供商定义列表（合并自定义模型）
 */
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

/**
 * 获取指定提供商定义
 */
export function getAiProvider(providerId?: string): AiProviderDef {
  const providers = getAllAiProviders();
  const targetId = providerId || getActiveAiProviderId();
  return providers.find((p) => p.id === targetId) || providers[0];
}

/**
 * 获取当前选中的提供商 ID
 */
export function getActiveAiProviderId(): 'gemini' | 'deepseek' | 'custom' {
  const saved = safeGetItem(STORAGE_KEYS.ACTIVE_PROVIDER) as any;
  if (saved === 'gemini' || saved === 'deepseek' || saved === 'custom') {
    return saved;
  }
  // 检查当前模型属于哪个提供商
  const activeModelId = safeGetItem(STORAGE_KEYS.ACTIVE_MODEL);
  if (activeModelId) {
    if (activeModelId.startsWith('gemini')) return 'gemini';
    if (activeModelId.startsWith('deepseek')) return 'deepseek';
    const customs = getCustomAiModels();
    if (customs.some((c) => c.id === activeModelId)) return 'custom';
  }
  return DEFAULT_ACTIVE_PROVIDER_ID;
}

/**
 * 保存当前选中的提供商
 */
export function saveAiActiveProvider(providerId: 'gemini' | 'deepseek' | 'custom'): void {
  safeSetItem(STORAGE_KEYS.ACTIVE_PROVIDER, providerId);
  const provider = getAiProvider(providerId);

  // 恢复该提供商上次选中的模型，若无则使用该提供商的默认模型
  const rememberedModel = safeGetItem(STORAGE_KEYS.PROVIDER_MODEL_PREFIX + providerId);
  const validModel = provider.models.find((m) => m.id === rememberedModel);
  const nextModelId = validModel ? validModel.id : provider.defaultModelId || provider.models[0]?.id || DEFAULT_ACTIVE_MODEL_ID;

  if (nextModelId) {
    safeSetItem(STORAGE_KEYS.ACTIVE_MODEL, nextModelId);
  }

  dispatchAiConfigChange();
}

/**
 * 获取指定提供商下的所有可用模型
 */
export function getModelsByProvider(providerId: string): AiModelDef[] {
  const provider = getAiProvider(providerId);
  return provider.models || [];
}

/**
 * 获取全站所有模型扁平列表
 */
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

/**
 * 获取当前选中的模型 ID
 */
export function getActiveAiModelId(): string {
  const saved = safeGetItem(STORAGE_KEYS.ACTIVE_MODEL);
  if (saved) return saved;

  const provider = getAiProvider();
  return provider.defaultModelId || DEFAULT_ACTIVE_MODEL_ID;
}

/**
 * 获取当前选中的模型完整定义对象
 */
export function getActiveAiModel(): AiModelDef {
  const all = getAllAiModels();
  const currentId = getActiveAiModelId();
  const found = all.find((m) => m.id === currentId);
  if (found) return found;

  const provider = getAiProvider();
  return provider.models[0] || all[0];
}

/**
 * 保存当前选中的模型 ID
 */
export function saveAiActiveModel(modelId: string): void {
  safeSetItem(STORAGE_KEYS.ACTIVE_MODEL, modelId);

  // 自动识别所属提供商并记住
  const all = getAllAiModels();
  const found = all.find((m) => m.id === modelId);
  if (found) {
    safeSetItem(STORAGE_KEYS.ACTIVE_PROVIDER, found.provider);
    safeSetItem(STORAGE_KEYS.PROVIDER_MODEL_PREFIX + found.provider, modelId);
  }

  dispatchAiConfigChange();
}

/**
 * 获取指定提供商的 API Key
 */
export function getProviderApiKey(providerId?: string): string {
  const targetProvider = providerId || getActiveAiProviderId();
  const key = safeGetItem(STORAGE_KEYS.PROVIDER_KEY_PREFIX + targetProvider);
  return (key || '').trim();
}

/**
 * 保存指定提供商的 API Key
 */
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

/**
 * 获取指定提供商的有效端点 URL
 */
export function getProviderEndpoint(providerId?: string): string {
  const targetProvider = providerId || getActiveAiProviderId();
  const override = safeGetItem(STORAGE_KEYS.PROVIDER_ENDPOINT_PREFIX + targetProvider);
  if (override && override.trim()) {
    const cleanOverride = override.trim();
    // 特化 Gemini：若处于本地开发态，且本地存储残留的是 Google 官方端点，
    // 智能映射为本地 Dev Server 反代端点，避免因历史缓存导致浏览器/代理握手失败
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

/**
 * 保存指定提供商的自定义端点 URL
 */
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

/**
 * 获取当前模型的有效 API Key（按所属提供商获取）
 */
export function getAiApiKey(modelId?: string): string {
  const targetModelId = modelId || getActiveAiModelId();
  const all = getAllAiModels();
  const found = all.find((m) => m.id === targetModelId);
  const providerId = found ? found.provider : getActiveAiProviderId();
  return getProviderApiKey(providerId);
}

/**
 * 保存 API Key（自动归属到当前或指定模型的提供商）
 */
export function saveAiApiKey(modelId: string, apiKey: string): void {
  const all = getAllAiModels();
  const found = all.find((m) => m.id === modelId);
  const providerId = found ? found.provider : getActiveAiProviderId();
  saveProviderApiKey(providerId, apiKey);
}

/**
 * 获取当前模型的有效端点 URL
 */
export function getAiEndpoint(modelId?: string): string {
  const targetModelId = modelId || getActiveAiModelId();
  const all = getAllAiModels();
  const found = all.find((m) => m.id === targetModelId);

  // 1. 如果模型自身有特定 endpoint 且不属于默认提供商端点
  if (found && found.endpoint) {
    if (found.provider === 'gemini' && typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
      if (found.endpoint === GEMINI_OFFICIAL_ENDPOINT) {
        return getProviderEndpoint('gemini');
      }
    }
    return found.endpoint;
  }

  // 2. 所属提供商端点
  const providerId = found ? found.provider : getActiveAiProviderId();
  return getProviderEndpoint(providerId);
}

/**
 * 保存指定端点
 */
export function saveAiEndpoint(modelId: string, endpoint: string): void {
  const all = getAllAiModels();
  const found = all.find((m) => m.id === modelId);
  const providerId = found ? found.provider : getActiveAiProviderId();
  saveProviderEndpoint(providerId, endpoint);
}

/**
 * 获取当前的数值参数设置
 */
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

/**
 * 保存数值参数
 */
export function saveAiParams(params: Partial<{ maxTokens: number; maxContextChars: number; topK: number }>): void {
  if (params.maxTokens !== undefined) safeSetItem(STORAGE_KEYS.MAX_TOKENS, String(params.maxTokens));
  if (params.maxContextChars !== undefined) safeSetItem(STORAGE_KEYS.MAX_CONTEXT_CHARS, String(params.maxContextChars));
  if (params.topK !== undefined) safeSetItem(STORAGE_KEYS.TOP_K, String(params.topK));
  dispatchAiConfigChange();
}

/**
 * 获取回答模式 ('retrieve' | 'discussion')
 */
export function getAiAnswerMode(): 'retrieve' | 'discussion' {
  const val = safeGetItem(STORAGE_KEYS.ANSWER_MODE);
  return val === 'discussion' ? 'discussion' : 'retrieve';
}

/**
 * 保存回答模式
 */
export function saveAiAnswerMode(mode: 'retrieve' | 'discussion'): void {
  safeSetItem(STORAGE_KEYS.ANSWER_MODE, mode);
  dispatchAiConfigChange();
}

/**
 * 获取来源链接打开偏好 ('new' | 'same')
 */
export function getAiSourceOpen(): 'new' | 'same' {
  const val = safeGetItem(STORAGE_KEYS.SRC_OPEN);
  return val === 'same' ? 'same' : 'new';
}

/**
 * 保存来源链接打开偏好
 */
export function saveAiSourceOpen(mode: 'new' | 'same'): void {
  safeSetItem(STORAGE_KEYS.SRC_OPEN, mode);
  dispatchAiConfigChange();
}

/**
 * 获取问答窗口尺寸设置与预设
 */
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

/**
 * 保存问答窗口尺寸设置与预设
 */
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

/**
 * 获取是否自动折叠前序思考与工具调用（默认 true）
 */
export function getAiAutoCollapsePreceding(): boolean {
  const val = safeGetItem(STORAGE_KEYS.AUTO_COLLAPSE_TOOLS);
  if (val === null) return true;
  return val === 'true';
}

/**
 * 保存是否自动折叠前序思考与工具调用
 */
export function saveAiAutoCollapsePreceding(enabled: boolean): void {
  safeSetItem(STORAGE_KEYS.AUTO_COLLAPSE_TOOLS, enabled ? 'true' : 'false');
  dispatchAiConfigChange();
}

/**
 * 获取当前直接可用于流式请求的完整有效配置对象
 */
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

/**
 * 测试 AI 端点与密钥连通性（带深度错误提取）
 */
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
