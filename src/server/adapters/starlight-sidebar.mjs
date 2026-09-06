// src/server/adapters/starlight-sidebar.mjs
import { buildBookCatalog } from '../../core/catalog/book-catalog.mjs';

/**
 * @typedef {Object} StarlightSidebarLeaf
 * @property {string} label
 * @property {string} link
 *
 * @typedef {Object} StarlightSidebarGroup
 * @property {string} label
 * @property {boolean} collapsed
 * @property {Array<StarlightSidebarLeaf | StarlightSidebarGroup>} items
 */

/**
 * 将教材领域目录树 (BookCatalog) 转换为 Starlight 侧边栏配置规范
 * 负责注入 UI 展示语义（label, link, collapsed, items）
 *
 * @param {import('../../core/catalog/book-catalog.mjs').BookCatalog} catalog
 * @param {{ defaultCollapsed?: boolean }} [options]
 * @returns {Array<StarlightSidebarLeaf | StarlightSidebarGroup>}
 */
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

/**
 * 直接从教材目录扫描并生成符合 Starlight 规范的树状侧边栏结构
 *
 * @param {string} directoryPath - 教材物理文件夹路径
 * @param {{ defaultCollapsed?: boolean }} [options]
 * @returns {Array<StarlightSidebarLeaf | StarlightSidebarGroup>}
 */
export function generateStarlightBookSidebar(directoryPath, options = {}) {
  const catalog = buildBookCatalog(directoryPath);
  return toStarlightSidebar(catalog, options);
}
