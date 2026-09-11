import { slug as githubSlug } from 'github-slugger';

export function cleanSlug(slug) {
  return slug
    .split('/')
    .map(segment => {

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
