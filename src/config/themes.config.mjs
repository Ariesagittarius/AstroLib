/**
 * ============================================================================
 * 站点 UI 风格主题（Site Style Themes）注册表 —— 风格主题的唯一声明源
 * ============================================================================
 *
 * 区别于「亮/暗模式（Color Theme）」，本注册表管理的是整体 UI 风格预设（如 VitePress 风格、
 * Starlight 经典风格等）。
 *
 * 后续新增风格主题只需：
 *   1. 在本文件的 siteThemes 数组中追加定义 (id, label, desc, icon)；
 *   2. 编写对应的 CSS 覆盖样式（如 src/styles/<id>-theme.css），并按 html[data-site-theme='<id>'] 作用域限定；
 *   3. 控件与系统会自动呈现新增的风格选项。
 * ============================================================================
 */

export const siteThemes = [
  {
    id: 'vitepress',
    label: 'VitePress 风格',
    desc: 'VuePress / VitePress 现代极简文档风格',
    icon: 'vitepress',
  },
  {
    id: 'starlight',
    label: 'Starlight 经典',
    desc: 'Astro Starlight 原生经典文档风格',
    icon: 'starlight',
  },
];

/** 默认风格主题 */
export const DEFAULT_SITE_THEME = 'vitepress';

/**
 * 校验给定的 themeId 是否合法
 */
export function isValidSiteTheme(id) {
  return siteThemes.some((t) => t.id === id);
}
