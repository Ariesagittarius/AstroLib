/**
 * src/scripts/settings/performance-prefs.ts
 * 低性能模式 (Lite Mode) 与预热、缓存上限配置
 */

import { loadThemeTransition, THEME_TRANSITION_KEY } from './theme-prefs';
import { syncAllPwaCard } from './pwa-service';

/** 低性能模式存储键：'true' (开启) | 'false' / null (关闭，默认) */
export const LITE_MODE_KEY = 'astrolib_lite_mode';

/** 低性能模式启用前的用户偏好快照备份键（用于关闭时无损还原） */
export const LITE_BACKUP_KEY = 'astrolib_lite_backup';

/** 低性能模式下强制禁用的高开销模块列表 */
export const LITE_DISABLED_FEATURES = [
  'formulaActions',
  'relationGraph',
  'aiAsk',
  'exercises',
  'inspector',
  'feedback',
  'mermaid',
];

export interface LiteModeBackup {
  prewarmPages: number;
  maxPageCache: number;
  sidebarHover: boolean;
  toggles: Record<string, boolean>;
  themeTransition: string;
}

/** 读取当前是否处于低性能模式 */
export function loadLiteMode(): boolean {
  try {
    return typeof localStorage !== 'undefined' && localStorage.getItem(LITE_MODE_KEY) === 'true';
  } catch {
    return false;
  }
}

/** 保存低性能模式偏好并应用 */
export function saveLiteMode(enabled: boolean): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LITE_MODE_KEY, enabled ? 'true' : 'false');
    }
  } catch {}
  applyLiteMode(enabled);
}

/** 章节后台空闲预加载页面数存储键：1 (前后各 1 页滑动窗口，默认) | 2 | 3 | -1 (全书拉取) | 0 (关闭) */
export const PREWARM_PAGES_KEY = 'astrolib_prewarm_pages';
export const DEFAULT_PREWARM_PAGES = 1;

/** 读取章节后台空闲预加载范围配置（默认 1 为前后各 1 页滑动窗口） */
export function loadPrewarmPref(): number {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(PREWARM_PAGES_KEY) : null;
    if (raw !== null && raw !== undefined && raw !== '') {
      const val = parseInt(raw, 10);
      if (!isNaN(val)) return val;
    }
    return DEFAULT_PREWARM_PAGES;
  } catch {
    return DEFAULT_PREWARM_PAGES;
  }
}

/** 保存章节后台空闲预加载范围配置 */
export function savePrewarmPref(val: number): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(PREWARM_PAGES_KEY, String(val));
    }
    window.dispatchEvent(new CustomEvent('prewarm:config-change', { detail: { pages: val } }));
  } catch {}
}

/** 页面内存缓存上限存储键：5 (默认 5 页，标准平衡) | 3 (极简节能) | 10 (性能优先) | 20 (超大缓存) | -1 (不限) */
export const MAX_PAGE_CACHE_KEY = 'astrolib_max_page_cache';
export const DEFAULT_MAX_PAGE_CACHE = 5;

/** 读取页面内存缓存上限配置（默认 5 页） */
export function loadMaxPageCachePref(): number {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(MAX_PAGE_CACHE_KEY);
      if (raw !== null && raw !== undefined && raw !== '') {
        const val = parseInt(raw, 10);
        if (!isNaN(val)) return val;
      }
    }
    return DEFAULT_MAX_PAGE_CACHE;
  } catch {
    return DEFAULT_MAX_PAGE_CACHE;
  }
}

/** 保存页面内存缓存上限配置并广播缓存裁剪事件 */
export function saveMaxPageCachePref(val: number): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(MAX_PAGE_CACHE_KEY, String(val));
    }
    window.dispatchEvent(new CustomEvent('cache:config-change', { detail: { max: val } }));
  } catch {}
}

/** 左侧栏悬停预加载存储键：'true' (开启，默认) | 'false' (关闭) */
export const SIDEBAR_HOVER_PREFETCH_KEY = 'astrolib_sidebar_hover_prefetch';
export const DEFAULT_SIDEBAR_HOVER_PREFETCH = true;

/** 读取左侧栏悬停预加载配置（默认开启） */
export function loadSidebarHoverPref(): boolean {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(SIDEBAR_HOVER_PREFETCH_KEY) : null;
    if (raw === 'false') return false;
    return true;
  } catch {
    return true;
  }
}

/** 保存左侧栏悬停预加载配置并广播通知 */
export function saveSidebarHoverPref(enabled: boolean): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(SIDEBAR_HOVER_PREFETCH_KEY, String(enabled));
    }
    window.dispatchEvent(new CustomEvent('sidebar-prefetch:config-change', { detail: { enabled } }));
  } catch {}
}

/** 同步当前所有实例的后台预加载范围 Chips / 按钮状态 */
export function syncAllPrewarmButtons(): void {
  const current = loadPrewarmPref();
  document.querySelectorAll<any>('.ft-panel .ft-prewarm-chip, starlight-feature-toggles .ft-prewarm-chip, .ft-panel .ft-prewarm-btn, starlight-feature-toggles .ft-prewarm-btn').forEach((chip) => {
    const val = parseInt(chip.getAttribute('data-prewarm-val') || '-1', 10);
    const active = val === current;
    chip.classList.toggle('active', active);
    chip.setAttribute('aria-selected', String(active));
    if ('selected' in chip) {
      chip.selected = active;
    }
  });
}

/** 同步当前所有实例的页面内存缓存上限 Chips / 按钮状态 */
export function syncAllCacheButtons(): void {
  const current = loadMaxPageCachePref();
  document.querySelectorAll<any>('.ft-panel .ft-cache-chip, starlight-feature-toggles .ft-cache-chip, .ft-panel .ft-cache-btn, starlight-feature-toggles .ft-cache-btn').forEach((chip) => {
    const val = parseInt(chip.getAttribute('data-cache-val') || '5', 10);
    const active = val === current;
    chip.classList.toggle('active', active);
    chip.setAttribute('aria-selected', String(active));
    if ('selected' in chip) {
      chip.selected = active;
    }
  });
}

/** 同步当前所有实例的低性能模式开关与受控样式 */
export function syncAllLiteMode(): void {
  if (typeof document === 'undefined') return;
  const isLite = loadLiteMode();

  document.querySelectorAll<HTMLInputElement>('input[type="checkbox"][data-lite-mode]').forEach((cb) => {
    cb.checked = isLite;
  });
  document.querySelectorAll<any>('md-switch[data-lite-mode]').forEach((sw) => {
    sw.selected = isLite;
  });

  document.querySelectorAll<HTMLElement>('.ft-lite-mode-card').forEach((card) => {
    card.classList.toggle('is-active', isLite);
    const badge = card.querySelector<HTMLElement>('.ft-lite-mode-badge');
    if (badge) {
      badge.textContent = isLite ? '已开启 · 极速低耗' : '未开启';
      badge.classList.toggle('is-active', isLite);
    }
  });

  // 预加载与缓存按钮禁用态
  document.querySelectorAll<HTMLElement>('.ft-prewarm-track, .ft-prewarm-wrapper').forEach((el) => {
    el.classList.toggle('is-lite-locked', isLite);
  });
  document.querySelectorAll<HTMLButtonElement>('.ft-prewarm-btn, .ft-prewarm-chip').forEach((btn) => {
    btn.disabled = isLite;
  });
}

// 供外部注入的核心状态钩子，避免模块循环强耦合
let onApplyLiteModeHook: ((enabled: boolean) => void) | null = null;

export function registerApplyLiteModeHook(fn: (enabled: boolean) => void): void {
  onApplyLiteModeHook = fn;
}

/** 应用并切换低性能模式 */
export function applyLiteMode(enabled: boolean = loadLiteMode()): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.dataset.liteMode = enabled ? 'true' : 'false';
  root.classList.toggle('astrolib-lite-mode', enabled);

  if (onApplyLiteModeHook) {
    onApplyLiteModeHook(enabled);
  }

  // 广播模式变更事件，通知侧边栏释放缓存、侧载底座锁定大纲
  window.dispatchEvent(new CustomEvent('astrolib:lite-mode-change', { detail: { enabled } }));

  syncAllPrewarmButtons();
  syncAllCacheButtons();
  syncAllLiteMode();
  syncAllPwaCard();
}
