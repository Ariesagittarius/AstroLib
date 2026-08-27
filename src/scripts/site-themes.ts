import { siteThemes, DEFAULT_SITE_THEME, isValidSiteTheme } from '../config/themes.config.mjs';

export const SITE_THEME_KEY = 'starlight-site-theme';

export type SiteThemeId = string;

export function parseSiteTheme(v: unknown): SiteThemeId {
  if (typeof v === 'string' && isValidSiteTheme(v)) {
    return v;
  }
  return DEFAULT_SITE_THEME;
}

export function loadSiteTheme(): SiteThemeId {
  try {
    const raw = typeof localStorage !== 'undefined' && localStorage.getItem(SITE_THEME_KEY);
    return parseSiteTheme(raw);
  } catch {
    return DEFAULT_SITE_THEME;
  }
}

export function saveSiteTheme(theme: SiteThemeId): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(SITE_THEME_KEY, parseSiteTheme(theme));
    }
  } catch {

  }
}

export function applySiteTheme(theme: SiteThemeId): void {
  const validTheme = parseSiteTheme(theme);
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.siteTheme = validTheme;
  }
}

export function setSiteTheme(theme: SiteThemeId): void {
  const next = parseSiteTheme(theme);
  saveSiteTheme(next);
  applySiteTheme(next);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('site-theme-change', { detail: { theme: next } }));
  }
}
