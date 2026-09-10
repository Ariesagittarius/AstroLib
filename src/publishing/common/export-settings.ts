/**
 * src/publishing/common/export-settings.ts
 * AstroLib 统一发布与导出配置体系 (Unified Export Settings & Typography Contracts)
 *
 * 架构规范：
 * - 归属于 Publishing Domain Common 层 (Layer 3)
 * - 为教材章节导出 (Chapter Export) 与习题导出 (Exercise Export) 提供单一配置权威
 * - 核心首选: typography (TypographyPresetId: 'scholarly' | 'classic' | 'mathematical' | 'lecture')
 * - 统一由 Academic Typography System (renderTypographyPreamble) 注入 Preamble
 * - 废除分散硬编码的字体生成逻辑，对历史参数 (mathFont, cjkFont) 执行规范化意图映射
 * - 遵循 Rule 1 (UI is not a domain model) & Rule 7 (Utils purity)
 */

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
  maxWidthRatio: number;   // 相对行宽的最大比例 (默认 0.65\linewidth)
  maxHeightRatio: number;  // 相对版心高度的最大比例 (默认 0.30\textheight)
  keepAspectRatio: boolean;// 严格保持宽高比 (默认 true)
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
  /**
   * 核心首选：学术排版预设 (Phase 7 唯一权威)
   * 'scholarly' (默认) | 'classic' | 'mathematical' | 'lecture'
   */
  typography?: TypographyPresetId;
  /**
   * 字体解析模式 (deterministic: CI与发布必须使用; adaptive: 本地开发预览)
   */
  resolutionMode?: FontResolutionMode;
  /** @deprecated 请改用 typography 预设。保留向下兼容 */
  mathFont?: 'typst' | 'modern' | 'times' | 'pagella';
  /** @deprecated 请改用 typography 预设。保留向下兼容 */
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

/**
 * 统一 LocalStorage 存储键名规范
 */
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

/**
 * 从配置对象中解析排版目标 (Target)：
 * 优先 userExplicit.typography 预设，次选 userExplicit legacy 参数，
 * 再次选 settings.typography，最后回退至 'scholarly'
 */
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

/**
 * 从浏览器端安全获取全站共享的排版偏好设置 (含静默向新预设体系迁移)
 */
export function getStoredExportSettings(): Partial<BaseExportSettings> {
  if (typeof window === 'undefined') return {};
  try {
    let typography = localStorage.getItem(SHARED_EXPORT_STORAGE_KEYS.TYPOGRAPHY) as TypographyPresetId | null;
    const mathFont = (localStorage.getItem(SHARED_EXPORT_STORAGE_KEYS.MATH_FONT) || 'typst') as any;
    const cjkFont = (localStorage.getItem(SHARED_EXPORT_STORAGE_KEYS.CJK_FONT) || 'default') as any;
    const fontSize = parseFloat(localStorage.getItem(SHARED_EXPORT_STORAGE_KEYS.FONT_SIZE) || '11') as any;
    const paperSize = (localStorage.getItem(SHARED_EXPORT_STORAGE_KEYS.PAPER_SIZE) || 'a4') as any;
    const fontFamily = (localStorage.getItem(SHARED_EXPORT_STORAGE_KEYS.FONT_FAMILY) || 'serif') as any;

    // 历史配置静默升级迁移 (Legacy LocalStorage -> TypographyPresetId)
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

/**
 * 保存全站共享的排版偏好设置至 LocalStorage
 */
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

/**
 * 统一生成 LaTeX 字体与学术排版 Preamble (生产环境唯一委托入口)
 * 供 renderChapterLatexDocument 与 generateLatexDocument 共同复用，彻底解耦底层字体技术细节
 * @param options.includePackage 是否显式包含 \usepackage{unicode-math}（homework.cls 自带时可设为 false）
 * @param options.resolutionMode 显式指定解析模式 ('deterministic' | 'adaptive')
 */
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

/**
 * 统一生成中文字体 (CJK) 配置 Preamble
 * @deprecated CJK 字体已由 Academic Typography System 在 renderFontPreamble() 中统一注入。
 * 本函数保留为空实现，以完全保持对外接口兼容性。
 */
export function renderCjkFontPreamble(_settings: BaseExportSettings): string {
  return '';
}
