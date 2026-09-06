// src/utils/sidebar.mjs
// 兼容性门面 (Compatibility Facade)
// 真正的教材目录领域模型已迁移至 src/core/catalog/book-catalog.mjs
// Starlight UI 适配器已迁移至 src/server/adapters/starlight-sidebar.mjs

import { naturalSort } from './natural-sort.mjs';
import { cleanSlug } from './slug.mjs';
import { generateStarlightBookSidebar } from '../server/adapters/starlight-sidebar.mjs';

// 保持向后兼容导出纯工具函数与原生成器
export { naturalSort, cleanSlug };
export const generateBookSidebar = generateStarlightBookSidebar;

