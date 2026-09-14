export const StaticFontOnlyForPublishing = true as const;

export type FontResolutionMode = 'deterministic' | 'adaptive';

export type SemanticTypographyRole =
  | 'body'
  | 'heading'
  | 'subheading'
  | 'math'
  | 'code'
  | 'caption'
  | 'footnote'
  | 'quote'
  | 'theoremLabel'
  | 'solutionLabel'
  | 'annotation'
  | 'digitalResource';

export interface TypographyFontSpec {

  designFamily: string;

  primaryFamily?: string;

  deterministicFamilies: string[];

  adaptiveFamilies: string[];

  boldFamily?: string;

  italicFamily?: string;

  boldItalicFamily?: string;

  scale?: number | 'MatchLowercase' | 'MatchUppercase';

  autoFakeBold?: boolean;

  features?: string[];

  path?: string;
}

export interface MathFontSpec {

  family: string;

  fallbackFamilies?: string[];

  scale?: number | 'MatchLowercase';

  boldFamily?: string;

  ranges?: Array<{ range: string; font: string }>;
}

export interface TypographyMetrics {

  rhythmProfile?: 'textbook' | 'classic-textbook' | 'lecture';

  baselineStretch: number;

  parIndent: string;

  parSkip: string;

  headingBeforeSpacing?: string;

  headingAfterSpacing?: string;

  equationSpacing?: {
    before: string;
    after: string;
  };

  theoremSpacing?: {
    before: string;
    after: string;
  };

  proofSpacing?: {
    before: string;
    after: string;
  };

  captionSpacing?: string;

  footnoteSpacing?: string;

  codeSpacing?: {
    before: string;
    after: string;
  };
}

export type TypographyPresetCategory = 'core' | 'specialized';

export type TypographyPresetId =
  | 'scholarly'
  | 'classic'
  | 'mathematical'
  | 'lecture';

export interface TypographyPreset {

  id: TypographyPresetId;

  category: TypographyPresetCategory;

  name: string;

  description: string;

  targetAudience: string;

  chineseBody: TypographyFontSpec;

  chineseHeading: TypographyFontSpec;

  latinText: TypographyFontSpec;

  math: MathFontSpec;

  monospace: TypographyFontSpec;

  kaiFont: TypographyFontSpec;

  metrics: TypographyMetrics;

  guaranteedFallback: {
    cjk: string;
    cjkSans: string;
    latin: string;
    math: string;
  };
}

export interface FontMetadata {

  family: string;

  files: string[];

  license: 'OFL-1.1' | 'GPLv3-with-font-exception' | 'GFL' | 'Apache-2.0';

  licenseUrl: string;

  sourceUrl: string;

  version: string;

  languageSupport: Array<'zh-CN' | 'en' | 'math' | 'symbol'>;

  mathSupport: boolean;

  redistributionAllowed: boolean;

  bundledInTexLive: boolean;

  recommendedFallback?: string;
}

export interface LegacyTypographyOptions {

  mathFont?: 'typst' | 'modern' | 'times' | 'pagella';

  cjkFont?: 'default' | 'sourcehan' | 'song' | 'kai' | string;

  fontFamily?: 'serif' | 'sans';
}

export interface NormalizedTypographyIntent {
  basePresetId: TypographyPresetId;
  overrides?: {
    mathFamily?: string;
    cjkBodyPrimary?: string;
    cjkHeadingPrimary?: string;
    isSansTitle?: boolean;
  };
}

export interface ResolvedTypographyConfig {
  preset: TypographyPreset;
  resolutionMode: FontResolutionMode;
  source: 'preset' | 'legacy' | 'custom';
  warnings: string[];
}

export interface FontEmbeddingAuditRecord {
  presetId: string;
  resolutionMode: FontResolutionMode;
  requestedFont: {
    cjk: string;
    latin: string;
    math: string;
  };
  resolvedFont: {
    cjk: string;
    latin: string;
    math: string;
  };
  embeddedPdfFonts: string[];
  isDesignSpecimen: boolean;
  compileDurationMs: number;
  pdfSizeBytes: number;
  warnings: string[];
}
