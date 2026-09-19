/**
 * src/types/collections.ts
 * AstroLib 中央书库与合集领域数据模型定义
 *
 * 遵循架构规范：
 * - Layer 2 (Domain Model)
 * - 纯 TypeScript 接口声明，供配置、路由、侧边栏、导出生成器共同复用
 * - 遵循 Rule 1 (UI is not a domain model) & Rule 3 (Source of Truth)
 */

import type { NoticeConfig } from './notices.ts';

export type BookStage = 'high-school' | 'university' | 'graduate' | 'research' | string;
export type BookCategory = 'textbook' | 'supplement' | 'notes' | 'monograph' | string;

export interface ModuleItemConfig {
  emoji?: string;
  short?: string;
  aliases?: string[];
  theme?: string;
  isImage?: boolean;
  targetQuery?: string;
  targetPattern?: string;
}

export interface Book {
  id: string;
  slug: string;
  title: string;
  author?: string;
  publisher?: string;
  isbn?: string;
  edition?: string;
  stage?: BookStage;
  stageLabel?: string;
  category?: BookCategory;
  categoryLabel?: string;
  subject?: string;
  subjectLabel?: string;
  description?: string;
  tags?: string[];
  cover?: string;
  entryPoint?: string;
  notices?: NoticeConfig[];
  trackClasses?: string[];
  modules?: Record<string, ModuleItemConfig>;
}

export interface Collection {
  id: string;
  slug: string;
  title: string;
  description?: string;
  notices?: NoticeConfig[];
  books: Book[];
}

export function defineCollections(cols: Collection[]): Collection[] {
  return cols;
}
