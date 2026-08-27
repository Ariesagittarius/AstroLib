/**
 * 站点 UI 风格主题偏好（读者可选）—— 管理 VitePress / Starlight 等风格切换
 * ==========================================================================
 * 存储：localStorage 'starlight-site-theme' 存储字符串主题 id（如 'vitepress' | 'starlight'）。
 * 应用：给 <html data-site-theme="vitepress"> 设置属性。
 * 广播：数据变更时触发 window 自定义事件 'site-theme-change'，确保页面多组件实例同步。
 * ==========================================================================
 */

import { siteThemes, DEFAULT_SITE_THEME, isValidSiteTheme } from '../config/themes.config.mjs';

export const SITE_THEME_KEY = 'starlight-site-theme';

export type SiteThemeId = string;

/**
 * 解析并校验 themeId
 */
export function parseSiteTheme(v: unknown): SiteThemeId {
  if (typeof v === 'string' && isValidSiteTheme(v)) {
    return v;
  }
  return DEFAULT_SITE_THEME;
}

/**
 * 读取本地存储的主题偏好
 */
export function loadSiteTheme(): SiteThemeId {
  try {
    const raw = typeof localStorage !== 'undefined' && localStorage.getItem(SITE_THEME_KEY);
    return parseSiteTheme(raw);
  } catch {
    return DEFAULT_SITE_THEME;
  }
}

/**
 * 保存主题偏好到 localStorage
 */
export function saveSiteTheme(theme: SiteThemeId): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(SITE_THEME_KEY, parseSiteTheme(theme));
    }
  } catch {
    /* 忽略隐私模式等错误 */
  }
}

/**
 * 将主题应用到 document.documentElement.dataset.siteTheme
 */
export function applySiteTheme(theme: SiteThemeId): void {
  const validTheme = parseSiteTheme(theme);
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.siteTheme = validTheme;
  }
}

/**
 * 切换并同步更新所有组件状态
 */
export function setSiteTheme(theme: SiteThemeId): void {
  const next = parseSiteTheme(theme);
  saveSiteTheme(next);
  applySiteTheme(next);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('site-theme-change', { detail: { theme: next } }));
  }
}
