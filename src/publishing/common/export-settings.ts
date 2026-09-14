import type {
  TypographyPresetId,
  FontResolutionMode,
  LegacyTypographyOptions,
} from '../typography/types.ts';
import {
  renderTypographyPreamble,
  normalizeLegacyIntent,
} from '../typography/latex-typography-renderer.ts';
import {
  DEFAULT_TYPOGRAPHY_PRESET_ID,
  isTypographyPresetId,
} from '../typography/presets/index.ts';

export interface ImageSizingPolicy {
  maxWidthRatio: number;
  maxHeightRatio: number;
  keepAspectRatio: boolean;
  alignment: 'center' | 'left' | 'inline';
  captionStyle: 'kaishu' | 'normal';
}

export const DEFAULT_IMAGE_POLICY: ImageSizingPolicy = {
  maxWidthRatio: 0.65,
  maxHeightRatio: 0.30,
  keepAspectRatio: true,
  alignment: 'center',
  captionStyle: 'kaishu',
};

export interface BaseExportSettings {
  paperSize: 'a4' | 'b5';
  fontSize: 10 | 10.5 | 11 | 12;
  fontFamily: 'serif' | 'sans';

  typography?: TypographyPresetId;

  resolutionMode?: FontResolutionMode;

  mathFont?: 'typst' | 'modern' | 'times' | 'pagella';

  cjkFont?: 'default' | 'sourcehan';
  headerMode: 'standard' | 'compact' | 'none';
  imagePolicy: ImageSizingPolicy;
  title?: string;
  subtitle?: string;
  author?: string;
  courseName?: string;
  date?: string;
}

export interface ChapterExportSettings extends BaseExportSettings {
  documentclass: 'ctexart' | 'ctexbook';
  numberingDepth: number;
  showToc: boolean;
}

export interface ExerciseExportSettings extends BaseExportSettings {
  template: 'handout' | 'exam';
  removeQed: boolean;
  pageNumbering: 'total' | 'simple' | 'none';
  writingSpace: 'comfortable' | 'compact' | 'none';
  answerPlacement: 'appendix' | 'inline' | 'none';
  coloredSolution: boolean;
  showSubtitle: boolean;
  showLicense: boolean;
  licenseText: string;
  showDate: boolean;
}

export const DEFAULT_CHAPTER_EXPORT_SETTINGS: ChapterExportSettings = {
  documentclass: 'ctexart',
  paperSize: 'a4',
  fontSize: 11,
  fontFamily: 'serif',
  typography: DEFAULT_TYPOGRAPHY_PRESET_ID,
  resolutionMode: 'deterministic',
  mathFont: 'typst',
  cjkFont: 'default',
  headerMode: 'standard',
  numberingDepth: 3,
  showToc: false,
  imagePolicy: DEFAULT_IMAGE_POLICY,
};

export const DEFAULT_EXERCISE_EXPORT_SETTINGS: ExerciseExportSettings = {
  template: 'handout',
  paperSize: 'a4',
  fontSize: 11,
  fontFamily: 'serif',
  typography: DEFAULT_TYPOGRAPHY_PRESET_ID,
  resolutionMode: 'deterministic',
  mathFont: 'typst',
  cjkFont: 'default',
  removeQed: true,
  pageNumbering: 'simple',
  writingSpace: 'comfortable',
  answerPlacement: 'appendix',
  coloredSolution: false,
  headerMode: 'standard',
  title: '工科数学分析',
  subtitle: '章节真题精选与自测练习',
  showSubtitle: true,
  showLicense: true,
  licenseText: 'CC BY-NC-SA 4.0',
  showDate: true,
  date: '\\today',
  courseName: '工科数学分析',
  author: '',
  imagePolicy: DEFAULT_IMAGE_POLICY,
};

export const SHARED_EXPORT_STORAGE_KEYS = {
  TYPOGRAPHY: 'astrolib_latex_typography_preset',
  MATH_FONT: 'astrolib_latex_math_font',
  CJK_FONT: 'astrolib_latex_cjk_font',
  FONT_SIZE: 'astrolib_latex_font_size',
  PAPER_SIZE: 'astrolib_latex_paper_size',
  FONT_FAMILY: 'astrolib_latex_font_family',
  GH_TOKEN: 'astrolib_compiler_gh_token',
  GH_OWNER: 'astrolib_compiler_owner',
  GH_REPO: 'astrolib_compiler_repo',
  GH_BRANCH: 'astrolib_compiler_branch',
} as const;

export function getTypographyTarget(
  settings: Partial<BaseExportSettings>,
  userExplicit?: Partial<BaseExportSettings>
): TypographyPresetId | LegacyTypographyOptions {
  if (userExplicit?.typography && isTypographyPresetId(userExplicit.typography)) {
    return userExplicit.typography;
  }
  if (userExplicit?.mathFont || userExplicit?.cjkFont) {
    return {
      mathFont: userExplicit.mathFont,
      cjkFont: userExplicit.cjkFont,
      fontFamily: userExplicit.fontFamily || settings.fontFamily,
    };
  }
  if (settings.typography && isTypographyPresetId(settings.typography)) {
    return settings.typography;
  }
  if (settings.mathFont || settings.cjkFont) {
    return {
      mathFont: settings.mathFont,
      cjkFont: settings.cjkFont,
      fontFamily: settings.fontFamily,
    };
  }
  return DEFAULT_TYPOGRAPHY_PRESET_ID;
}

export function getStoredExportSettings(): Partial<BaseExportSettings> {
  if (typeof window === 'undefined') return {};
  try {
    let typography = localStorage.getItem(SHARED_EXPORT_STORAGE_KEYS.TYPOGRAPHY) as TypographyPresetId | null;
    const mathFont = (localStorage.getItem(SHARED_EXPORT_STORAGE_KEYS.MATH_FONT) || 'typst') as any;
    const cjkFont = (localStorage.getItem(SHARED_EXPORT_STORAGE_KEYS.CJK_FONT) || 'default') as any;
    const fontSize = parseFloat(localStorage.getItem(SHARED_EXPORT_STORAGE_KEYS.FONT_SIZE) || '11') as any;
    const paperSize = (localStorage.getItem(SHARED_EXPORT_STORAGE_KEYS.PAPER_SIZE) || 'a4') as any;
    const fontFamily = (localStorage.getItem(SHARED_EXPORT_STORAGE_KEYS.FONT_FAMILY) || 'serif') as any;

    if (!typography || !isTypographyPresetId(typography)) {
      if (cjkFont || mathFont) {
        const intent = normalizeLegacyIntent({ cjkFont, mathFont, fontFamily });
        typography = intent.basePresetId;
        try {
          localStorage.setItem(SHARED_EXPORT_STORAGE_KEYS.TYPOGRAPHY, typography);
        } catch {}
      } else {
        typography = DEFAULT_TYPOGRAPHY_PRESET_ID;
      }
    }

    return {
      typography,
      mathFont,
      cjkFont,
      fontSize,
      paperSize,
      fontFamily,
    };
  } catch {
    return {};
  }
}

export function saveStoredExportSettings(settings: Partial<BaseExportSettings>): void {
  if (typeof window === 'undefined') return;
  try {
    if (settings.typography) {
      localStorage.setItem(SHARED_EXPORT_STORAGE_KEYS.TYPOGRAPHY, settings.typography);
    }
    if (settings.mathFont) {
      localStorage.setItem(SHARED_EXPORT_STORAGE_KEYS.MATH_FONT, settings.mathFont);
    }
    if (settings.cjkFont) {
      localStorage.setItem(SHARED_EXPORT_STORAGE_KEYS.CJK_FONT, settings.cjkFont);
    }
    if (settings.fontSize) {
      localStorage.setItem(SHARED_EXPORT_STORAGE_KEYS.FONT_SIZE, String(settings.fontSize));
    }
    if (settings.paperSize) {
      localStorage.setItem(SHARED_EXPORT_STORAGE_KEYS.PAPER_SIZE, settings.paperSize);
    }
    if (settings.fontFamily) {
      localStorage.setItem(SHARED_EXPORT_STORAGE_KEYS.FONT_FAMILY, settings.fontFamily);
    }
  } catch {}
}

export function renderFontPreamble(
  settings: BaseExportSettings,
  options: {
    includePackage?: boolean;
    resolutionMode?: FontResolutionMode;
    userExplicit?: Partial<BaseExportSettings>;
  } = {}
): string {
  const mode = options.resolutionMode || settings.resolutionMode || 'deterministic';
  const target = getTypographyTarget(settings, options.userExplicit);
  return renderTypographyPreamble(target, {
    resolutionMode: mode,
    includeUnicodeMathPkg: options.includePackage ?? true,
  });
}

export function renderCjkFontPreamble(_settings: BaseExportSettings): string {
  return '';
}
