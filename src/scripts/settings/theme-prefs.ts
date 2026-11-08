import { loadSiteTheme } from '../site-themes';
import { loadThemeColor } from '../../themes/material-you/color-engine';

export const THEME_MODE_STORAGE_KEY = 'starlight-theme';
export type ThemeMode = 'light' | 'dark' | 'auto';
export const THEME_TRANSITION_KEY = 'starlight-theme-transition';

export function loadThemeMode(): ThemeMode {
  try {
    if (typeof localStorage !== 'undefined') {
      const val = localStorage.getItem(THEME_MODE_STORAGE_KEY);
      if (val === 'light' || val === 'dark') return val;
      if (val === 'auto') return 'auto';
    }
  } catch {}
  return 'auto';
}

export function saveThemeMode(mode: ThemeMode): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(THEME_MODE_STORAGE_KEY, mode === 'light' || mode === 'dark' ? mode : '');
    }
  } catch {}
}

export function applyThemeMode(mode?: ThemeMode): void {
  if (typeof document === 'undefined') return;
  const currentMode = mode || loadThemeMode();
  const root = document.documentElement;
  const animate = localStorage.getItem(THEME_TRANSITION_KEY) === 'animate';
  if (!animate) root.classList.add('theme-switching');

  const resolved =
    currentMode === 'auto'
      ? window.matchMedia('(prefers-color-scheme: light)').matches
        ? 'light'
        : 'dark'
      : currentMode;
  root.dataset.theme = resolved;

  if (!animate) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => root.classList.remove('theme-switching'));
    });
  }

  document.querySelectorAll('starlight-theme-select').forEach((el: any) => {
    if (typeof el.syncIcon === 'function') el.syncIcon();
    else el.classList.toggle('is-dark', resolved === 'dark');
  });

  window.dispatchEvent(new CustomEvent('starlight-theme-change', { detail: { mode: currentMode, resolved } }));
}

export function syncAllThemeModes(): void {
  const currentMode = loadThemeMode();
  document.querySelectorAll('.ft-panel .ft-mode-btn, starlight-feature-toggles .ft-mode-btn').forEach((btn) => {
    const val = btn.getAttribute('data-mode-val');
    const active = val === currentMode;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-checked', String(active));
    const modeIcon = btn.querySelector('.ft-mode-icon');
    const checkIcon = btn.querySelector('.ft-mode-check-icon');
    if (modeIcon) modeIcon.classList.toggle('hidden', active);
    if (checkIcon) checkIcon.classList.toggle('hidden', !active);
  });
}

export function loadThemeTransition(): string {
  try {
    return localStorage.getItem(THEME_TRANSITION_KEY) || 'instant';
  } catch {
    return 'instant';
  }
}

export function saveThemeTransition(val: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(THEME_TRANSITION_KEY, val);
    }
  } catch {}
}

export function syncAllThemeChips(): void {
  const theme = loadSiteTheme();
  document.querySelectorAll('.ft-panel .ft-theme-chip, starlight-feature-toggles .ft-theme-chip').forEach((chip) => {
    const val = chip.getAttribute('data-site-theme-val');
    const active = val === theme;
    chip.classList.toggle('active', active);
    chip.setAttribute('aria-selected', String(active));
  });
}

export function syncAllThemeColors(): void {
  const currentColor = loadThemeColor();
  document.querySelectorAll('.ft-panel .ft-preset-swatch, starlight-feature-toggles .ft-preset-swatch').forEach((swatch) => {
    const val = swatch.getAttribute('data-m3-color');
    const active = val === currentColor;
    swatch.classList.toggle('active', active);
    swatch.setAttribute('aria-selected', String(active));
  });

  document.querySelectorAll<HTMLInputElement>('.ft-color-native-input').forEach((input) => {
    if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(currentColor)) {
      input.value = currentColor;
    }
  });

  const isCustomHex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(currentColor);
  document.querySelectorAll<HTMLElement>('.ft-custom-color-tile').forEach((tile) => {
    tile.classList.toggle('active', isCustomHex);
    const dropper = tile.querySelector<HTMLElement>('.ft-eyedropper-circle');
    if (dropper) {
      dropper.style.backgroundColor = isCustomHex ? currentColor : '';
    }
  });
}
