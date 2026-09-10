/**
 * src/publishing/typography/latex-typography-renderer.ts
 * AstroLib 学术导出字体 LaTeX Preamble 渲染引擎 (Phase 4.5 Hardened Edition)
 *
 * 核心特性：
 * 1. 严格支持两种解析模式：
 *    - deterministic: 严禁依赖任何操作系统级未知字体，仅使用项目资产与 TeX Live 官方内建静态字体。
 *    - adaptive: 允许探测并优先匹配宿主机安装的高质量系统字体。
 * 2. 彻底杜绝 Variable Font (可变字体) 导致的 xdvipdfmx 崩溃 (StaticFontOnlyForPublishing = true)。
 * 3. 规范化 Legacy Mapping：实现 Base Preset + Specific Overrides 的正交组合语义，杜绝粗暴单向赋值。
 * 4. 显式日志与追踪：在 LaTeX 宏包中注入 \typeout 诊断标记，方便精确审计解析流。
 */

import type {
  TypographyPresetId,
  TypographyPreset,
  TypographyFontSpec,
  MathFontSpec,
  FontResolutionMode,
  LegacyTypographyOptions,
  NormalizedTypographyIntent,
  ResolvedTypographyConfig,
} from './types.ts';

// -----------------------------------------------------------------------------
// 官方学术预设注册表导入与重导出 (Decoupled from Presets Layer)
// -----------------------------------------------------------------------------

import {
  PRESET_REGISTRY,
  PRESET_SCHOLARLY,
  PRESET_CLASSIC,
  PRESET_MATHEMATICAL,
  PRESET_LECTURE,
  DEFAULT_TYPOGRAPHY_PRESET,
  DEFAULT_TYPOGRAPHY_PRESET_ID,
  getTypographyPreset,
  isTypographyPresetId,
  listTypographyPresets,
} from './presets/index.ts';

export {
  PRESET_REGISTRY,
  PRESET_SCHOLARLY,
  PRESET_CLASSIC,
  PRESET_MATHEMATICAL,
  PRESET_LECTURE,
  DEFAULT_TYPOGRAPHY_PRESET,
  DEFAULT_TYPOGRAPHY_PRESET_ID,
  getTypographyPreset,
  isTypographyPresetId,
  listTypographyPresets,
};

// -----------------------------------------------------------------------------
// 规范化 Legacy Mapping 解析器 (Normalized Intent -> Base Preset + Overrides)
// -----------------------------------------------------------------------------

/**
 * 将历史废弃参数精准规范化为排版意图 (NormalizedTypographyIntent)
 * 严格遵循正交组合语义，杜绝简单粗暴地将某个参数直接降格替换整个 Preset
 */
export function normalizeLegacyIntent(legacy: LegacyTypographyOptions): NormalizedTypographyIntent {
  // 1. 判定基线预设 (Base Preset)
  let basePresetId: TypographyPresetId = 'scholarly';

  // 若中文选 default，则基线偏向 classic 传统学术
  if (legacy.cjkFont === 'default') {
    basePresetId = 'classic';
  } else if (legacy.cjkFont === 'sourcehan' || legacy.cjkFont === 'song') {
    basePresetId = 'scholarly';
  } else if (legacy.cjkFont === 'kai') {
    basePresetId = 'lecture';
  } else if (!legacy.cjkFont) {
    if (legacy.mathFont === 'modern') {
      basePresetId = 'classic';
    } else if (legacy.mathFont === 'pagella') {
      basePresetId = 'mathematical';
    }
  }

  // 2. 独立提取公式字体覆盖 (Math Override)
  let mathFamily: string | undefined;
  if (legacy.mathFont === 'typst') {
    mathFamily = 'NewCMMath-Book.otf';
  } else if (legacy.mathFont === 'modern') {
    mathFamily = 'latinmodern-math.otf';
  } else if (legacy.mathFont === 'times') {
    mathFamily = 'texgyretermes-math.otf';
  } else if (legacy.mathFont === 'pagella') {
    mathFamily = 'texgyrepagella-math.otf';
  }

  return {
    basePresetId,
    overrides: {
      mathFamily,
      isSansTitle: legacy.fontFamily === 'sans',
    },
  };
}

/**
 * 统一解析排版配置
 * @param target 目标预设 ID、自定义预设对象或历史参数
 * @param mode 显式指定解析模式 ('deterministic' | 'adaptive'，默认为 'deterministic')
 */
export function resolveTypographyConfig(
  target?: TypographyPresetId | TypographyPreset | LegacyTypographyOptions,
  mode: FontResolutionMode = 'deterministic'
): ResolvedTypographyConfig {
  const warnings: string[] = [];

  // 1. 完整自定义 TypographyPreset 对象
  if (target && typeof target === 'object' && 'id' in target && 'chineseBody' in target) {
    return {
      preset: target as TypographyPreset,
      resolutionMode: mode,
      source: 'custom',
      warnings,
    };
  }

  // 2. 标准 TypographyPresetId
  if (typeof target === 'string' && PRESET_REGISTRY[target as TypographyPresetId]) {
    return {
      preset: PRESET_REGISTRY[target as TypographyPresetId],
      resolutionMode: mode,
      source: 'preset',
      warnings,
    };
  }

  // 3. 历史 Legacy 配置解析 (Base Preset + Specific Overrides)
  if (target && typeof target === 'object') {
    const legacy = target as LegacyTypographyOptions;
    const intent = normalizeLegacyIntent(legacy);
    const basePreset = PRESET_REGISTRY[intent.basePresetId];

    // 深拷贝以应用正交覆写，绝不污染全局预设注册表
    const clonedPreset: TypographyPreset = JSON.parse(JSON.stringify(basePreset));

    if (intent.overrides?.mathFamily) {
      clonedPreset.math = {
        ...clonedPreset.math,
        family: intent.overrides.mathFamily,
      };
    }

    warnings.push(
      `检测到已废弃的旧版字体参数 (mathFont="${legacy.mathFont}", cjkFont="${legacy.cjkFont}")，已按规范化意图映射至基线预设 [${intent.basePresetId}] 并注入正交覆盖。`
    );

    return {
      preset: clonedPreset,
      resolutionMode: mode,
      source: 'legacy',
      warnings,
    };
  }

  // 4. 默认采用 Scholarly 预设
  return {
    preset: PRESET_SCHOLARLY,
    resolutionMode: mode,
    source: 'preset',
    warnings,
  };
}

// -----------------------------------------------------------------------------
// LaTeX Preamble 级联回退生成器 (Cascading Font Resolution)
// -----------------------------------------------------------------------------

/**
 * 递归构建多重 \\IfFontExistsTF 回退树
 */
function buildFontspecFallback(
  fontTypeCmd: '\\setCJKmainfont' | '\\setCJKsansfont' | '\\setCJKfamilyfont' | '\\setmainfont',
  families: string[],
  options: {
    fontFamilyTag?: string;
    extraOptions?: string[];
    guaranteedEnd?: string;
  }
): string {
  const extraOptStr = options.extraOptions && options.extraOptions.length > 0
    ? `[${options.extraOptions.join(',')}]`
    : '';

  const tagPrefix = options.fontFamilyTag ? `{${options.fontFamilyTag}}` : '';

  function renderStep(index: number): string {
    if (index >= families.length) {
      if (options.guaranteedEnd) {
        return `${fontTypeCmd}${tagPrefix}{${options.guaranteedEnd}}${extraOptStr}\n`;
      }
      return '';
    }

    const current = families[index];
    const isLast = index === families.length - 1;

    if (isLast && options.guaranteedEnd && current === options.guaranteedEnd) {
      return `${fontTypeCmd}${tagPrefix}{${current}}${extraOptStr}\n`;
    }

    return `\\IfFontExistsTF{${current}}{
  ${fontTypeCmd}${tagPrefix}{${current}}${extraOptStr}
}{
${renderStep(index + 1).split('\n').map((l) => '  ' + l).join('\n')}
}`;
  }

  return renderStep(0);
}

/**
 * 统一生成完整的 Academic Typography LaTeX Preamble
 */
export function renderTypographyPreamble(
  targetConfig?: TypographyPresetId | TypographyPreset | LegacyTypographyOptions,
  options: {
    resolutionMode?: FontResolutionMode;
    includeUnicodeMathPkg?: boolean;
    headerComment?: boolean;
  } = {}
): string {
  const mode = options.resolutionMode || 'deterministic';
  const { preset, source } = resolveTypographyConfig(targetConfig, mode);
  const includePkg = options.includeUnicodeMathPkg ?? true;

  // 根据 resolutionMode 选择候选字体清单
  const selectFamilies = (spec: TypographyFontSpec): string[] => {
    const list = mode === 'deterministic' ? spec.deterministicFamilies : spec.adaptiveFamilies;
    return [...list];
  };

  // 1. 中文正文候选链
  const cjkBodyList = [
    ...selectFamilies(preset.chineseBody),
    preset.guaranteedFallback.cjk,
  ].filter((v, i, a) => a.indexOf(v) === i);

  const cjkBodyOpts: string[] = [];
  if (preset.chineseBody.autoFakeBold) cjkBodyOpts.push('AutoFakeBold=true');
  if (preset.chineseBody.scale && preset.chineseBody.scale !== 1.0) {
    cjkBodyOpts.push(`Scale=${preset.chineseBody.scale}`);
  }

  const cjkBodyCode = buildFontspecFallback(
    '\\setCJKmainfont',
    cjkBodyList,
    { extraOptions: cjkBodyOpts, guaranteedEnd: preset.guaranteedFallback.cjk }
  );

  // 2. 中文无衬线标题候选链
  const cjkHeadingList = [
    ...selectFamilies(preset.chineseHeading),
    preset.guaranteedFallback.cjkSans,
  ].filter((v, i, a) => a.indexOf(v) === i);

  const cjkHeadingOpts: string[] = [];
  if (preset.chineseHeading.autoFakeBold) cjkHeadingOpts.push('AutoFakeBold=true');

  const cjkHeadingCode = buildFontspecFallback(
    '\\setCJKsansfont',
    cjkHeadingList,
    { extraOptions: cjkHeadingOpts, guaranteedEnd: preset.guaranteedFallback.cjkSans }
  );

  // 3. 楷体/辅助标注候选链
  const kaiList = [
    ...selectFamilies(preset.kaiFont),
    'FandolKai-Regular.otf',
  ].filter((v, i, a) => a.indexOf(v) === i);

  const kaiCode = buildFontspecFallback(
    '\\setCJKfamilyfont',
    kaiList,
    {
      fontFamilyTag: 'zhkai',
      extraOptions: ['AutoFakeBold=true'],
      guaranteedEnd: 'FandolKai-Regular.otf',
    }
  );

  // 4. 西文正文字体 (\setmainfont)
  const latinList = [
    ...selectFamilies(preset.latinText),
    preset.guaranteedFallback.latin,
  ].filter((v, i, a) => a.indexOf(v) === i);

  const latinOpts: string[] = [];
  if (preset.latinText.scale && preset.latinText.scale !== 1.0) {
    latinOpts.push(`Scale=${preset.latinText.scale}`);
  }
  if (preset.latinText.boldFamily) latinOpts.push(`BoldFont=${preset.latinText.boldFamily}`);
  if (preset.latinText.italicFamily) latinOpts.push(`ItalicFont=${preset.latinText.italicFamily}`);
  if (preset.latinText.boldItalicFamily) latinOpts.push(`BoldItalicFont=${preset.latinText.boldItalicFamily}`);

  const latinCode = buildFontspecFallback(
    '\\setmainfont',
    latinList,
    { extraOptions: latinOpts, guaranteedEnd: preset.guaranteedFallback.latin }
  );

  // 5. 数学公式字体 (\setmathfont)
  const mathFamilies = [
    preset.math.family,
    ...(preset.math.fallbackFamilies || []),
    preset.guaranteedFallback.math,
  ].filter((v, i, a) => a.indexOf(v) === i);

  const mathPkgCode = includePkg ? '\\usepackage{unicode-math}\n' : '';
  const mathOpts: string[] = [];
  if (preset.math.scale && preset.math.scale !== 1.0) {
    mathOpts.push(`Scale=${preset.math.scale}`);
  }
  const mathOptStr = mathOpts.length > 0 ? `[${mathOpts.join(',')}]` : '';

  let mathCode = '';
  if (mathFamilies.length > 1) {
    mathCode = `\\IfFontExistsTF{${mathFamilies[0]}}{
  \\setmathfont{${mathFamilies[0]}}${mathOptStr}
}{
  \\setmathfont{${preset.guaranteedFallback.math}}${mathOptStr}
}\n`;
  } else {
    mathCode = `\\setmathfont{${mathFamilies[0]}}${mathOptStr}\n`;
  }

  // 6. 版面度量与学术语义命令配置
  const lineSpreadCode = `\\linespread{${preset.metrics.baselineStretch}}`;

  let preamble = `% =========================================================================
% Academic Typography Preamble
% Resolution Mode: [${mode.toUpperCase()}] | Preset: ${preset.name} (${preset.id})
% Source Intent: ${source} | StaticFontOnlyForPublishing: true
% CI Determinism Guarantee: ${preset.guaranteedFallback.cjk} + ${preset.guaranteedFallback.math}
% Design Families: CJK Body=[${preset.chineseBody.designFamily}], CJK Heading=[${preset.chineseHeading.designFamily}]
% =========================================================================
\\typeout{Academic Typography: Mode=[${mode}], Preset=[${preset.id}], Source=[${source}]}
${mathPkgCode}
% --- 1. 西文正文字体 (Latin Text Font) ---
${latinCode}
% --- 2. 中文正文字体与标题字族 (CJK Fonts) ---
${cjkBodyCode}
${cjkHeadingCode}
${kaiCode}
% 重新定义 \\kaishu 宏指向统一楷体字族
\\renewcommand{\\kaishu}{\\CJKfamily{zhkai}}

% --- 3. 数学公式字体 (OpenType Math Font) ---
${mathCode}
% --- 4. 学术版面度量与行高对齐 (Typography Metrics) ---
${lineSpreadCode}
\\setlength{\\parindent}{${preset.metrics.parIndent}}
\\setlength{\\parskip}{${preset.metrics.parSkip}}

% --- 5. 学术语义层级字体命令 (Semantic Typography Hooks) ---
% 保障解题前缀【解】采用纯正黑体方案，消除粗宋断裂
\\providecommand{\\astrolibsolutionhead}[1][解]{{\\normalfont\\sffamily\\bfseries 【#1】}}
\\providecommand{\\astrolibcaptionfont}{\\small\\normalfont}
\\providecommand{\\astrolibremarkfont}{\\small\\normalfont}
`;

  return preamble;
}
