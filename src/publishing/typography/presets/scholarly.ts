import type { TypographyPreset } from '../types.ts';

export const PRESET_SCHOLARLY: TypographyPreset = {
  id: 'scholarly',
  category: 'core',
  name: '现代学术教材 (Scholarly)',
  description: '现代中文大学数理教材标准。思源宋体（正文）+ 思源黑体（标题）+ STIX Two（西文与公式）',
  targetAudience: '大学数学分析、高等代数、物理学教材与严肃学术讲义',
  chineseBody: {
    designFamily: 'Source Han Serif SC',
    primaryFamily: 'Source Han Serif SC',
    deterministicFamilies: [
      'SourceHanSerifSC-Regular.otf',
      'FandolSong-Regular.otf',
    ],
    adaptiveFamilies: [
      'Source Han Serif SC',
      'Noto Serif CJK SC',
      'FandolSong-Regular.otf',
      'SimSun',
      'STSong',
    ],
    autoFakeBold: true,
  },
  chineseHeading: {
    designFamily: 'Source Han Sans SC',
    primaryFamily: 'Source Han Sans SC',
    deterministicFamilies: [
      'SourceHanSansSC-Regular.otf',
      'FandolHei-Regular.otf',
    ],
    adaptiveFamilies: [
      'Source Han Sans SC',
      'Noto Sans CJK SC',
      'FandolHei-Regular.otf',
      'SimHei',
      'Microsoft YaHei',
    ],
    autoFakeBold: true,
  },
  latinText: {
    designFamily: 'STIX Two Text',
    primaryFamily: 'STIX Two Text',
    deterministicFamilies: [
      'STIXTwoText-Regular.otf',
      'lmroman10-regular.otf',
    ],
    adaptiveFamilies: [
      'STIX Two Text',
      'STIXTwoText-Regular.otf',
      'Times New Roman',
      'lmroman10-regular.otf',
    ],
    boldFamily: 'STIXTwoText-Bold.otf',
    italicFamily: 'STIXTwoText-Italic.otf',
    boldItalicFamily: 'STIXTwoText-BoldItalic.otf',
    scale: 1.0,
  },
  math: {
    family: 'STIXTwoMath-Regular.otf',
    fallbackFamilies: ['latinmodern-math.otf'],
    scale: 1.0,
  },
  monospace: {
    designFamily: 'Latin Modern Mono',
    primaryFamily: 'lmmono10-regular.otf',
    deterministicFamilies: ['lmmono10-regular.otf'],
    adaptiveFamilies: ['lmmono10-regular.otf', 'Courier New'],
  },
  kaiFont: {
    designFamily: 'LXGW WenKai GB Lite',
    primaryFamily: 'LXGW WenKai GB Lite',
    deterministicFamilies: [
      'LXGWWenKaiGBLite-Regular.ttf',
      'FandolKai-Regular.otf',
    ],
    adaptiveFamilies: [
      'LXGW WenKai GB Lite',
      'LXGWWenKaiGBLite-Regular.ttf',
      'FandolKai-Regular.otf',
      'KaiTi',
      'STKaiti',
    ],
    autoFakeBold: true,
  },
  metrics: {
    rhythmProfile: 'textbook',
    baselineStretch: 1.25,
    parIndent: '2em',
    parSkip: '0pt plus 1pt',
    headingBeforeSpacing: '1.5em plus 0.3em minus 0.1em',
    headingAfterSpacing: '0.8em plus 0.2em',
  },
  guaranteedFallback: {
    cjk: 'FandolSong-Regular.otf',
    cjkSans: 'FandolHei-Regular.otf',
    latin: 'STIXTwoText-Regular.otf',
    math: 'STIXTwoMath-Regular.otf',
  },
};
