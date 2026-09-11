import { buildBookCatalog } from '../../core/catalog/book-catalog.mjs';

export function toStarlightSidebar(catalog, options = {}) {
  if (!Array.isArray(catalog)) return [];
  const defaultCollapsed = options.defaultCollapsed ?? true;

  return catalog.map(node => {
    const childNodes = node.children || node.items;
    if (node.type === 'group' || Array.isArray(childNodes)) {
      return {
        label: node.title,
        collapsed: defaultCollapsed,
        items: toStarlightSidebar(childNodes || [], options),
      };
    }
    return {
      label: node.title,
      link: node.slug,
    };
  });
}

export function generateStarlightBookSidebar(directoryPath, options = {}) {
  const catalog = buildBookCatalog(directoryPath);
  return toStarlightSidebar(catalog, options);
}
