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

export const DEFAULT_ACTIVE_MODEL_ID = 'deepseek-v4-flash';

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

let isMigrated = false;
function migrateLegacyStorage(): void {
  if (isMigrated || typeof localStorage === 'undefined') return;
  isMigrated = true;

  try {

    if (!safeGetItem(STORAGE_KEYS.ACTIVE_MODEL)) {
      const legacyModel = safeGetItem(LEGACY_KEYS.DSH_ACTIVE_MODEL) || safeGetItem(LEGACY_KEYS.EXERCISE_MODEL);
      if (legacyModel) safeSetItem(STORAGE_KEYS.ACTIVE_MODEL, legacyModel);
    }

    if (!safeGetItem(STORAGE_KEYS.GLOBAL_KEY)) {
      const legacyKey = safeGetItem(LEGACY_KEYS.DSH_GLOBAL_KEY) || safeGetItem(LEGACY_KEYS.EXERCISE_GLOBAL_KEY);
      if (legacyKey) safeSetItem(STORAGE_KEYS.GLOBAL_KEY, legacyKey);
    }

    if (!safeGetItem(STORAGE_KEYS.CUSTOM_MODELS)) {
      const legacyCustom = safeGetItem(LEGACY_KEYS.DSH_CUSTOM_MODELS);
      if (legacyCustom) safeSetItem(STORAGE_KEYS.CUSTOM_MODELS, legacyCustom);
    }

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

export function addCustomAiModel(model: { id: string; label: string; endpoint: string; desc?: string }): boolean {
  if (!model || !model.id || !model.endpoint) return false;
  const customs = getCustomAiModels();
  const id = model.id.trim();
  const label = (model.label || id).trim();
  const endpoint = model.endpoint.trim();

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

export function getActiveAiModelId(): string {
  migrateLegacyStorage();
  const saved = safeGetItem(STORAGE_KEYS.ACTIVE_MODEL);
  if (saved) return saved;
  return DEFAULT_ACTIVE_MODEL_ID;
}

export function getActiveAiModel(): AiModelDef {
  const all = getAllAiModels();
  const currentId = getActiveAiModelId();
  const found = all.find((m) => m.id === currentId);
  if (found) return found;
  return all[0] || DEFAULT_AI_MODELS[0];
}

export function saveAiActiveModel(modelId: string): void {
  safeSetItem(STORAGE_KEYS.ACTIVE_MODEL, modelId);

  safeSetItem(LEGACY_KEYS.DSH_ACTIVE_MODEL, modelId);
  safeSetItem(LEGACY_KEYS.EXERCISE_MODEL, modelId);
  dispatchAiConfigChange();
}

export function getAiApiKey(modelId?: string): string {
  migrateLegacyStorage();
  const targetId = modelId || getActiveAiModelId();

  const specificKey = safeGetItem(STORAGE_KEYS.KEY_PREFIX + targetId);
  if (specificKey && specificKey.trim()) return specificKey.trim();

  const legacySpecificKey = safeGetItem(LEGACY_KEYS.DSH_KEY_PREFIX + targetId);
  if (legacySpecificKey && legacySpecificKey.trim()) return legacySpecificKey.trim();

  const globalKey = safeGetItem(STORAGE_KEYS.GLOBAL_KEY);
  if (globalKey && globalKey.trim()) return globalKey.trim();

  const legacyGlobalKey = safeGetItem(LEGACY_KEYS.DSH_GLOBAL_KEY) || safeGetItem(LEGACY_KEYS.EXERCISE_GLOBAL_KEY);
  if (legacyGlobalKey && legacyGlobalKey.trim()) return legacyGlobalKey.trim();

  return '';
}

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

export function getAiEndpoint(modelId?: string): string {
  migrateLegacyStorage();
  const targetId = modelId || getActiveAiModelId();

  const override = safeGetItem(STORAGE_KEYS.ENDPOINT_PREFIX + targetId);
  if (override && override.trim()) return override.trim();

  const legacyOverride = safeGetItem(LEGACY_KEYS.DSH_ENDPOINT_PREFIX + targetId);
  if (legacyOverride && legacyOverride.trim()) return legacyOverride.trim();

  const all = getAllAiModels();
  const found = all.find((m) => m.id === targetId);
  if (found && found.endpoint) return found.endpoint;

  return DEFAULT_AI_MODELS[0].endpoint;
}

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

export interface TestAiResult {
  ok: boolean;
  latencyMs: number;
  message: string;
  statusCode?: number;
}

export async function testAiConnection(
  modelId?: string,
  explicitKey?: string,
  explicitEndpoint?: string
): Promise<TestAiResult> {
  const targetId = modelId || getActiveAiModelId();
  const apiKey = (explicitKey !== undefined ? explicitKey : getAiApiKey(targetId)).trim();
  const endpoint = (explicitEndpoint !== undefined ? explicitEndpoint : getAiEndpoint(targetId)).trim();

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
      let errDetail = '';
      try {
        const errJson = await res.json();
        errDetail = errJson?.error?.message || errJson?.message || '';
      } catch {
        errDetail = res.statusText;
      }
      return {
        ok: false,
        latencyMs,
        statusCode: res.status,
        message: `HTTP ${res.status}${errDetail ? `: ${errDetail.slice(0, 36)}` : ''}`,
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
