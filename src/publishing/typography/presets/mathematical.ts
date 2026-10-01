import type { TypographyPreset } from '../types.ts';

export const PRESET_MATHEMATICAL: TypographyPreset = {
  id: 'mathematical',
  category: 'core',
  name: '数理专版 (Mathematical)',
  description: '数学公式表现优先。思源宋体 + 思源黑体 + Libertinus 优雅数理衬线与公式',
  targetAudience: '拓扑学、微分几何、泛函分析、理论物理专著',
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
    ],
    autoFakeBold: true,
  },
  latinText: {
    designFamily: 'Libertinus Serif',
    primaryFamily: 'Libertinus Serif',
    deterministicFamilies: [
      'LibertinusSerif-Regular.otf',
      'STIXTwoText-Regular.otf',
    ],
    adaptiveFamilies: [
      'Libertinus Serif',
      'LibertinusSerif-Regular.otf',
      'STIXTwoText-Regular.otf',
    ],
    scale: 1.015,
  },
  math: {
    family: 'LibertinusMath-Regular.otf',
    fallbackFamilies: ['STIXTwoMath-Regular.otf', 'latinmodern-math.otf'],
    scale: 1.015,
  },
  monospace: {
    designFamily: 'Latin Modern Mono',
    primaryFamily: 'lmmono10-regular.otf',
    deterministicFamilies: ['lmmono10-regular.otf'],
    adaptiveFamilies: ['lmmono10-regular.otf', 'Courier New'],
  },
  kaiFont: {
    designFamily: 'FandolKai',
    primaryFamily: 'FandolKai',
    deterministicFamilies: [
      'FandolKai-Regular.otf',
    ],
    adaptiveFamilies: [
      'FandolKai',
      'FandolKai-Regular.otf',
      'KaiTi',
    ],
    autoFakeBold: true,
  },
  metrics: {
    rhythmProfile: 'textbook',
    baselineStretch: 1.25,
    parIndent: '2em',
    parSkip: '0pt plus 1pt',
  },
  guaranteedFallback: {
    cjk: 'FandolSong-Regular.otf',
    cjkSans: 'FandolHei-Regular.otf',
    latin: 'LibertinusSerif-Regular.otf',
    math: 'LibertinusMath-Regular.otf',
  },
};
