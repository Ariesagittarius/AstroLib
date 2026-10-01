import { loadThemeTransition, THEME_TRANSITION_KEY } from './theme-prefs';
import { syncAllPwaCard } from './pwa-service';

export const LITE_MODE_KEY = 'astrolib_lite_mode';

export const LITE_BACKUP_KEY = 'astrolib_lite_backup';

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

export function loadLiteMode(): boolean {
  try {
    return typeof localStorage !== 'undefined' && localStorage.getItem(LITE_MODE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function saveLiteMode(enabled: boolean): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LITE_MODE_KEY, enabled ? 'true' : 'false');
    }
  } catch {}
  applyLiteMode(enabled);
}

export const PREWARM_PAGES_KEY = 'astrolib_prewarm_pages';
export const DEFAULT_PREWARM_PAGES = 1;

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

export function savePrewarmPref(val: number): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(PREWARM_PAGES_KEY, String(val));
    }
    window.dispatchEvent(new CustomEvent('prewarm:config-change', { detail: { pages: val } }));
  } catch {}
}

export const MAX_PAGE_CACHE_KEY = 'astrolib_max_page_cache';
export const DEFAULT_MAX_PAGE_CACHE = 5;

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

export function saveMaxPageCachePref(val: number): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(MAX_PAGE_CACHE_KEY, String(val));
    }
    window.dispatchEvent(new CustomEvent('cache:config-change', { detail: { max: val } }));
  } catch {}
}

export const SIDEBAR_HOVER_PREFETCH_KEY = 'astrolib_sidebar_hover_prefetch';
export const DEFAULT_SIDEBAR_HOVER_PREFETCH = true;

export function loadSidebarHoverPref(): boolean {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(SIDEBAR_HOVER_PREFETCH_KEY) : null;
    if (raw === 'false') return false;
    return true;
  } catch {
    return true;
  }
}

export function saveSidebarHoverPref(enabled: boolean): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(SIDEBAR_HOVER_PREFETCH_KEY, String(enabled));
    }
    window.dispatchEvent(new CustomEvent('sidebar-prefetch:config-change', { detail: { enabled } }));
  } catch {}
}

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

  document.querySelectorAll<HTMLElement>('.ft-prewarm-track, .ft-prewarm-wrapper').forEach((el) => {
    el.classList.toggle('is-lite-locked', isLite);
  });
  document.querySelectorAll<HTMLButtonElement>('.ft-prewarm-btn, .ft-prewarm-chip').forEach((btn) => {
    btn.disabled = isLite;
  });
}

let onApplyLiteModeHook: ((enabled: boolean) => void) | null = null;

export function registerApplyLiteModeHook(fn: (enabled: boolean) => void): void {
  onApplyLiteModeHook = fn;
}

export function applyLiteMode(enabled: boolean = loadLiteMode()): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.dataset.liteMode = enabled ? 'true' : 'false';
  root.classList.toggle('astrolib-lite-mode', enabled);

  if (onApplyLiteModeHook) {
    onApplyLiteModeHook(enabled);
  }

  window.dispatchEvent(new CustomEvent('astrolib:lite-mode-change', { detail: { enabled } }));

  syncAllPrewarmButtons();
  syncAllCacheButtons();
  syncAllLiteMode();
  syncAllPwaCard();
}
