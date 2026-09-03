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

export const DEFAULT_SITE_THEME = 'vitepress';

export function isValidSiteTheme(id) {
  return siteThemes.some((t) => t.id === id);
}
