export const siteThemes = [
  {
    id: 'material-you',
    label: 'Material You',
    desc: 'Google Material 3 现代学术设计语言',
    icon: 'material-you',
  },
  {
    id: 'vitepress',
    label: 'VitePress 风格',
    desc: 'VuePress / VitePress 现代极简文档风格（已封存）',
    icon: 'vitepress',
    disabled: true,
  },
  {
    id: 'starlight',
    label: 'Starlight 经典',
    desc: 'Astro Starlight 原生经典文档风格（已封存）',
    icon: 'starlight',
    disabled: true,
  },
];

export const DEFAULT_SITE_THEME = 'material-you';

export function isValidSiteTheme(id) {
  return siteThemes.some((t) => t.id === id && !t.disabled);
}
