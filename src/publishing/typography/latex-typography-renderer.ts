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

export function normalizeLegacyIntent(legacy: LegacyTypographyOptions): NormalizedTypographyIntent {

  let basePresetId: TypographyPresetId = 'scholarly';

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

export function resolveTypographyConfig(
  target?: TypographyPresetId | TypographyPreset | LegacyTypographyOptions,
  mode: FontResolutionMode = 'deterministic'
): ResolvedTypographyConfig {
  const warnings: string[] = [];

  if (target && typeof target === 'object' && 'id' in target && 'chineseBody' in target) {
    return {
      preset: target as TypographyPreset,
      resolutionMode: mode,
      source: 'custom',
      warnings,
    };
  }

  if (typeof target === 'string' && PRESET_REGISTRY[target as TypographyPresetId]) {
    return {
      preset: PRESET_REGISTRY[target as TypographyPresetId],
      resolutionMode: mode,
      source: 'preset',
      warnings,
    };
  }

  if (target && typeof target === 'object') {
    const legacy = target as LegacyTypographyOptions;
    const intent = normalizeLegacyIntent(legacy);
    const basePreset = PRESET_REGISTRY[intent.basePresetId];

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

  return {
    preset: PRESET_SCHOLARLY,
    resolutionMode: mode,
    source: 'preset',
    warnings,
  };
}

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

  const selectFamilies = (spec: TypographyFontSpec): string[] => {
    const list = mode === 'deterministic' ? spec.deterministicFamilies : spec.adaptiveFamilies;
    return [...list];
  };

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
