export type TranslationProviderId = 'google' | 'gemini' | 'bupt' | 'zhipu' | 'deepseek' | 'custom';

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
  id: string;
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
  sourceLang?: string;
  targetLang?: string;
  mode?: 'mdx' | 'text' | 'html';
  preserveStructure?: boolean;
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

export interface ParagraphUnit {
  id: string;
  type: 'heading' | 'paragraph' | 'math' | 'code' | 'quote' | 'card' | 'card-title' | 'table-cell' | 'list-item';
  index: number;
  sourceText: string;
  translatedText?: string;
  status: 'idle' | 'translating' | 'done' | 'error';
  error?: string;
  isSatisfied?: boolean;
  isCustomEdited?: boolean;
  provider?: TranslationProviderId;
  updatedAt?: number;
}

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

export type TranslationExportFormat = 'bilingual-markdown' | 'chinese-markdown' | 'bilingual-text' | 'json';

export interface TranslationExportOptions {
  format: TranslationExportFormat;
  onlySatisfied?: boolean;
  chapterTitle?: string;
}

export type TranslationDisplayMode = 'sidebar' | 'inline';
