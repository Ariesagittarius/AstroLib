/**
 * src/services/translation/types.ts
 * ============================================================================
 * AstroLib 统一翻译系统类型定义 (Unified Translation System Types)
 * ============================================================================
 * 遵循 Rule 1 (UI is not a domain model) & Rule 7 (Utils Purity)
 */

export type TranslationProviderId = 'google' | 'gemini' | 'bupt' | 'deepseek' | 'custom';

export type MaskTokenType =
  | 'frontmatter'
  | 'import'
  | 'math-block'
  | 'math-inline'
  | 'code-block'
  | 'code-inline'
  | 'jsx-tag'
  | 'html-tag'
  | 'markdown-link-target'
  | 'markdown-image';

export interface MaskedToken {
  id: string; // 如 "⟦ASTRO_TOK_0⟧"
  index: number;
  type: MaskTokenType;
  original: string;
}

export interface MaskResult {
  maskedText: string;
  tokens: Map<string, MaskedToken>;
}

export interface TranslateOptions {
  provider?: TranslationProviderId;
  sourceLang?: string; // 默认 'en'
  targetLang?: string; // 默认 'zh-CN'
  mode?: 'mdx' | 'text' | 'html';
  preserveStructure?: boolean; // 默认 true
  apiKey?: string;
  endpoint?: string;
  model?: string;
}

export interface TranslateResult {
  success: boolean;
  translatedText: string;
  originalText: string;
  provider: TranslationProviderId;
  tokensPreserved: number;
  tokensRestored: number;
  error?: string;
}

export interface ITranslationProvider {
  id: TranslationProviderId;
  label: string;
  desc: string;
  translate(text: string, options?: TranslateOptions): Promise<string>;
  translateBatch(texts: string[], options?: TranslateOptions): Promise<string[]>;
  checkHealth(): Promise<boolean>;
}

/**
 * 段落级对照单元，用于正文与侧边栏 1:1 双向对应联动
 */
export interface ParagraphUnit {
  id: string; // 唯一锚点标识，如 "p-0", "p-1", "box-0"
  type: 'heading' | 'paragraph' | 'math' | 'code' | 'quote' | 'card' | 'list-item';
  index: number;
  sourceText: string; // 原始英文文本（含公式/代码标记）
  translatedText?: string; // 翻译后的中文文本（含公式/代码标记）
  status: 'idle' | 'translating' | 'done' | 'error';
  error?: string;
  isSatisfied?: boolean; // 读者标记为满意 / 已采纳
  isCustomEdited?: boolean; // 读者手动微调/精修过
  provider?: TranslationProviderId; // 生成该译文的服务商
  updatedAt?: number;
}

/**
 * 章节翻译本地持久化模型
 */
export interface StoredUnitTranslation {
  translatedText: string;
  isSatisfied?: boolean;
  isCustomEdited?: boolean;
  provider?: TranslationProviderId;
  updatedAt: number;
}

export interface StoredChapterTranslation {
  chapterKey: string;
  chapterTitle?: string;
  updatedAt: number;
  units: Record<string, StoredUnitTranslation>;
}

/**
 * 翻译导出格式
 */
export type TranslationExportFormat = 'bilingual-markdown' | 'chinese-markdown' | 'bilingual-text' | 'json';

export interface TranslationExportOptions {
  format: TranslationExportFormat;
  onlySatisfied?: boolean;
  chapterTitle?: string;
}

/**
 * 译文呈现方式/显示类别：
 * - 'sidebar': 在侧边栏以 1:1 卡片对照流呈现 (默认)
 * - 'inline': 在正文所有段落下方直接显示译文，不影响右侧边栏
 */
export type TranslationDisplayMode = 'sidebar' | 'inline';

