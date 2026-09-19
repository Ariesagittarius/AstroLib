import { slug as githubSlug } from 'github-slugger';

/**
 * 路由净化器：与 Astro 内容集合的默认 slug 生成规则保持完全一致。
 * Astro 的 glob loader 会对每个路径段调用 github-slugger（去掉标点/点、小写化、
 * 空格转连字符、保留下划线），因此侧边栏链接必须复刻同一套转换。
 *
 * @param slug 原始路由路径
 * @returns 规范化净化后的路由 slug
 */
export function cleanSlug(slug: string): string {
  return slug
    .split('/')
    .map((segment) => {
      // 剥离 LaTeX 宏与特殊字符，避免反斜杠和裸代码泄露入 URL
      const sanitized = segment
        .replace(/\\(?:mathbf|boldsymbol|pmb|text|mathbb|mathrm)\{([^}]+)\}/g, '$1')
        .replace(/mathbf([A-Za-z])/g, '$1')
        .replace(/\\[a-zA-Z]+/g, '')
        .replace(/[\$\{\}\^\\]/g, '')
        .trim();
      return githubSlug(sanitized);
    })
    .join('/')
    .normalize();
}
