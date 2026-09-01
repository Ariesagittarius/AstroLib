/**
 * src/ai/ai-config.ts
 * =============================================================================
 * AstroLib 统一 AI 模型与服务配置中心（Single Source of Truth）
 * -----------------------------------------------------------------------------
 * 职责：
 * 1. 统一管理全站 AI 学术模型预设（DeepSeek / OpenAI / Claude / Qwen / 自定义等）；
 * 2. 集中处理模型 API Key、端点 URL、生成参数的本地安全持久化（BYOK 模式）；
 * 3. 自动向后兼容迁移旧版本分散存储（dsh-aiask-* 与 astrolib_ai_*）；
 * 4. 提供响应式事件总线（astrolib:ai-config-change），实现全站偏好设置、
 *    书内 AI 智能问答与习题规范 AI 题解之间的无缝状态双向实时同步。
 * =============================================================================
 */

export interface AiModelDef {
  id: string;
  label: string;
  endpoint: string;
  desc?: string;
  isCustom?: boolean;
}

export interface EffectiveAiConfig {
  model: string;
  label: string;
  endpoint: string;
  apiKey: string;
  maxTokens: number;
  maxContextChars: number;
  topK: number;
}

export const DEFAULT_AI_MODELS: AiModelDef[] = [
  {
    id: 'deepseek-v4-flash',
    label: 'DeepSeek V4 Flash',
    endpoint: 'https://api.deepseek.com/v1/chat/completions',
    desc: '高性价比理科推理与数学推导，官方流式兼容端点',
  }
];

/** 默认激活模型 */
export const DEFAULT_ACTIVE_MODEL_ID = 'deepseek-v4-flash';

/** 统一存储键前缀与标准键 */
const STORAGE_KEYS = {
  ACTIVE_MODEL: 'astrolib_ai_active_model',
  GLOBAL_KEY: 'astrolib_ai_global_key',
  KEY_PREFIX: 'astrolib_ai_key_',
  ENDPOINT_PREFIX: 'astrolib_ai_endpoint_',
  CUSTOM_MODELS: 'astrolib_ai_custom_models',
  MAX_TOKENS: 'astrolib_ai_maxtok',
  MAX_CONTEXT_CHARS: 'astrolib_ai_maxctx',
  TOP_K: 'astrolib_ai_topk',
} as const;

/** 旧版历史键（用于向后兼容迁移） */
const LEGACY_KEYS = {
  DSH_ACTIVE_MODEL: 'dsh-aiask-model',
  DSH_GLOBAL_KEY: 'dsh-aiask-key',
  DSH_KEY_PREFIX: 'dsh-aiask-key-',
  DSH_ENDPOINT_PREFIX: 'dsh-aiask-endpoint-',
  DSH_CUSTOM_MODELS: 'dsh-aiask-custom-models',
  DSH_MAX_TOKENS: 'dsh-aiask-maxtok',
  DSH_MAX_CONTEXT_CHARS: 'dsh-aiask-maxctx',
  DSH_TOP_K: 'dsh-aiask-topk',
  EXERCISE_GLOBAL_KEY: 'astrolib_ai_api_key',
  EXERCISE_MODEL: 'astrolib_ai_model',
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

/** 执行一次旧版存储键向统一标准的迁移（幂等） */
let isMigrated = false;
function migrateLegacyStorage(): void {
  if (isMigrated || typeof localStorage === 'undefined') return;
  isMigrated = true;

  try {
    // 1. 迁移 Active Model
    if (!safeGetItem(STORAGE_KEYS.ACTIVE_MODEL)) {
      const legacyModel = safeGetItem(LEGACY_KEYS.DSH_ACTIVE_MODEL) || safeGetItem(LEGACY_KEYS.EXERCISE_MODEL);
      if (legacyModel) safeSetItem(STORAGE_KEYS.ACTIVE_MODEL, legacyModel);
    }

    // 2. 迁移 Global API Key
    if (!safeGetItem(STORAGE_KEYS.GLOBAL_KEY)) {
      const legacyKey = safeGetItem(LEGACY_KEYS.DSH_GLOBAL_KEY) || safeGetItem(LEGACY_KEYS.EXERCISE_GLOBAL_KEY);
      if (legacyKey) safeSetItem(STORAGE_KEYS.GLOBAL_KEY, legacyKey);
    }

    // 3. 迁移 Custom Models
    if (!safeGetItem(STORAGE_KEYS.CUSTOM_MODELS)) {
      const legacyCustom = safeGetItem(LEGACY_KEYS.DSH_CUSTOM_MODELS);
      if (legacyCustom) safeSetItem(STORAGE_KEYS.CUSTOM_MODELS, legacyCustom);
    }

    // 4. 迁移参数
    if (!safeGetItem(STORAGE_KEYS.MAX_TOKENS)) {
      const legacyTok = safeGetItem(LEGACY_KEYS.DSH_MAX_TOKENS);
      if (legacyTok) safeSetItem(STORAGE_KEYS.MAX_TOKENS, legacyTok);
    }
    if (!safeGetItem(STORAGE_KEYS.MAX_CONTEXT_CHARS)) {
      const legacyCtx = safeGetItem(LEGACY_KEYS.DSH_MAX_CONTEXT_CHARS);
      if (legacyCtx) safeSetItem(STORAGE_KEYS.MAX_CONTEXT_CHARS, legacyCtx);
    }
    if (!safeGetItem(STORAGE_KEYS.TOP_K)) {
      const legacyTopk = safeGetItem(LEGACY_KEYS.DSH_TOP_K);
      if (legacyTopk) safeSetItem(STORAGE_KEYS.TOP_K, legacyTopk);
    }
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
  migrateLegacyStorage();
  try {
    const raw = safeGetItem(STORAGE_KEYS.CUSTOM_MODELS);
    if (!raw) return [];
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    return list.map((m) => ({ ...m, isCustom: true }));
  } catch {
    return [];
  }
}

/**
 * 获取全站所有可用模型（内置预设 + 用户自定义，排重）
 */
export function getAllAiModels(): AiModelDef[] {
  migrateLegacyStorage();
  const customs = getCustomAiModels();
  const seen = new Set<string>();
  const results: AiModelDef[] = [];

  for (const m of [...DEFAULT_AI_MODELS, ...customs]) {
    if (!m || !m.id || seen.has(m.id)) continue;
    seen.add(m.id);
    results.push(m);
  }
  return results;
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

  // 若已存在同名自定义模型则更新，否则追加
  const idx = customs.findIndex((c) => c.id === id);
  if (idx >= 0) {
    customs[idx] = { id, label, endpoint, desc: model.desc?.trim(), isCustom: true };
  } else {
    customs.push({ id, label, endpoint, desc: model.desc?.trim(), isCustom: true });
  }

  safeSetItem(STORAGE_KEYS.CUSTOM_MODELS, JSON.stringify(customs));
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
    saveAiActiveModel(DEFAULT_ACTIVE_MODEL_ID);
  } else {
    dispatchAiConfigChange();
  }
  return true;
}

/**
 * 获取当前选中的模型 ID
 */
export function getActiveAiModelId(): string {
  migrateLegacyStorage();
  const saved = safeGetItem(STORAGE_KEYS.ACTIVE_MODEL);
  if (saved) return saved;
  return DEFAULT_ACTIVE_MODEL_ID;
}

/**
 * 获取当前选中的模型定义完整对象
 */
export function getActiveAiModel(): AiModelDef {
  const all = getAllAiModels();
  const currentId = getActiveAiModelId();
  const found = all.find((m) => m.id === currentId);
  if (found) return found;
  return all[0] || DEFAULT_AI_MODELS[0];
}

/**
 * 保存当前选中的模型 ID
 */
export function saveAiActiveModel(modelId: string): void {
  safeSetItem(STORAGE_KEYS.ACTIVE_MODEL, modelId);
  // 同步更新旧版兼容键
  safeSetItem(LEGACY_KEYS.DSH_ACTIVE_MODEL, modelId);
  safeSetItem(LEGACY_KEYS.EXERCISE_MODEL, modelId);
  dispatchAiConfigChange();
}

/**
 * 获取指定模型的有效 API Key
 * 优先级：模型专属 Key -> 全局 Key -> 旧版兼容存储 Key -> 空
 */
export function getAiApiKey(modelId?: string): string {
  migrateLegacyStorage();
  const targetId = modelId || getActiveAiModelId();

  // 1. 模型专属 Key
  const specificKey = safeGetItem(STORAGE_KEYS.KEY_PREFIX + targetId);
  if (specificKey && specificKey.trim()) return specificKey.trim();

  // 2. 旧版模型专属 Key
  const legacySpecificKey = safeGetItem(LEGACY_KEYS.DSH_KEY_PREFIX + targetId);
  if (legacySpecificKey && legacySpecificKey.trim()) return legacySpecificKey.trim();

  // 3. 全局统一 Key
  const globalKey = safeGetItem(STORAGE_KEYS.GLOBAL_KEY);
  if (globalKey && globalKey.trim()) return globalKey.trim();

  // 4. 旧版全局 Key
  const legacyGlobalKey = safeGetItem(LEGACY_KEYS.DSH_GLOBAL_KEY) || safeGetItem(LEGACY_KEYS.EXERCISE_GLOBAL_KEY);
  if (legacyGlobalKey && legacyGlobalKey.trim()) return legacyGlobalKey.trim();

  return '';
}

/**
 * 保存 API Key
 * @param modelId 模型 ID
 * @param apiKey 密钥字符串
 * @param isGlobal 是否同时设为全局兜底 Key
 */
export function saveAiApiKey(modelId: string, apiKey: string, isGlobal = true): void {
  const cleanKey = (apiKey || '').trim();
  const targetId = modelId || getActiveAiModelId();

  if (cleanKey) {
    safeSetItem(STORAGE_KEYS.KEY_PREFIX + targetId, cleanKey);
    safeSetItem(LEGACY_KEYS.DSH_KEY_PREFIX + targetId, cleanKey);
    if (isGlobal) {
      safeSetItem(STORAGE_KEYS.GLOBAL_KEY, cleanKey);
      safeSetItem(LEGACY_KEYS.DSH_GLOBAL_KEY, cleanKey);
      safeSetItem(LEGACY_KEYS.EXERCISE_GLOBAL_KEY, cleanKey);
    }
  } else {
    safeRemoveItem(STORAGE_KEYS.KEY_PREFIX + targetId);
    safeRemoveItem(LEGACY_KEYS.DSH_KEY_PREFIX + targetId);
  }

  dispatchAiConfigChange();
}

/**
 * 获取指定模型的有效端点 URL
 * 优先级：用户覆盖端点 -> 模型默认端点
 */
export function getAiEndpoint(modelId?: string): string {
  migrateLegacyStorage();
  const targetId = modelId || getActiveAiModelId();

  // 1. 用户覆盖端点
  const override = safeGetItem(STORAGE_KEYS.ENDPOINT_PREFIX + targetId);
  if (override && override.trim()) return override.trim();

  // 2. 旧版覆盖端点
  const legacyOverride = safeGetItem(LEGACY_KEYS.DSH_ENDPOINT_PREFIX + targetId);
  if (legacyOverride && legacyOverride.trim()) return legacyOverride.trim();

  // 3. 模型预设端点
  const all = getAllAiModels();
  const found = all.find((m) => m.id === targetId);
  if (found && found.endpoint) return found.endpoint;

  return DEFAULT_AI_MODELS[0].endpoint;
}

/**
 * 保存指定模型的自定义端点
 */
export function saveAiEndpoint(modelId: string, endpoint: string): void {
  const cleanEp = (endpoint || '').trim();
  const targetId = modelId || getActiveAiModelId();

  if (cleanEp) {
    safeSetItem(STORAGE_KEYS.ENDPOINT_PREFIX + targetId, cleanEp);
    safeSetItem(LEGACY_KEYS.DSH_ENDPOINT_PREFIX + targetId, cleanEp);
  } else {
    safeRemoveItem(STORAGE_KEYS.ENDPOINT_PREFIX + targetId);
    safeRemoveItem(LEGACY_KEYS.DSH_ENDPOINT_PREFIX + targetId);
  }

  dispatchAiConfigChange();
}

/**
 * 获取当前的数值参数设置
 */
export function getAiParams(): { maxTokens: number; maxContextChars: number; topK: number } {
  migrateLegacyStorage();
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
  if (params.maxTokens !== undefined) {
    safeSetItem(STORAGE_KEYS.MAX_TOKENS, String(params.maxTokens));
    safeSetItem(LEGACY_KEYS.DSH_MAX_TOKENS, String(params.maxTokens));
  }
  if (params.maxContextChars !== undefined) {
    safeSetItem(STORAGE_KEYS.MAX_CONTEXT_CHARS, String(params.maxContextChars));
    safeSetItem(LEGACY_KEYS.DSH_MAX_CONTEXT_CHARS, String(params.maxContextChars));
  }
  if (params.topK !== undefined) {
    safeSetItem(STORAGE_KEYS.TOP_K, String(params.topK));
    safeSetItem(LEGACY_KEYS.DSH_TOP_K, String(params.topK));
  }
  dispatchAiConfigChange();
}

/**
 * 获取当前直接可用于流式请求的完整有效配置对象
 */
export function getEffectiveAiClientConfig(): EffectiveAiConfig {
  const modelDef = getActiveAiModel();
  const apiKey = getAiApiKey(modelDef.id);
  const endpoint = getAiEndpoint(modelDef.id);
  const params = getAiParams();

  return {
    model: modelDef.id,
    label: modelDef.label,
    endpoint,
    apiKey,
    maxTokens: params.maxTokens,
    maxContextChars: params.maxContextChars,
    topK: params.topK,
  };
}
