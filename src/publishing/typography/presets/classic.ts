import type { TypographyPreset } from '../types.ts';

export const PRESET_CLASSIC: TypographyPreset = {
  id: 'classic',
  category: 'core',
  name: '经典 TeX (LaTeX Classic)',
  description: '传统 TeX 气质与数学专著。Fandol 中文 + Latin Modern 罗马西文与经典公式',
  targetAudience: '传统纯数学专著、抽象代数、CTAN 纯正 TeX 出版物',
  chineseBody: {
    designFamily: 'FandolSong',
    primaryFamily: 'FandolSong',
    deterministicFamilies: [
      'FandolSong-Regular.otf',
    ],
    adaptiveFamilies: [
      'FandolSong',
      'FandolSong-Regular.otf',
      'SimSun',
      'STSong',
    ],
    autoFakeBold: true,
  },
  chineseHeading: {
    designFamily: 'FandolHei',
    primaryFamily: 'FandolHei',
    deterministicFamilies: [
      'FandolHei-Regular.otf',
    ],
    adaptiveFamilies: [
      'FandolHei',
      'FandolHei-Regular.otf',
      'SimHei',
    ],
    autoFakeBold: true,
  },
  latinText: {
    designFamily: 'Latin Modern Roman',
    primaryFamily: 'Latin Modern Roman',
    deterministicFamilies: [
      'lmroman10-regular.otf',
    ],
    adaptiveFamilies: [
      'Latin Modern Roman',
      'lmroman10-regular.otf',
    ],
    scale: 1.0,
  },
  math: {
    family: 'latinmodern-math.otf',
    fallbackFamilies: ['STIXTwoMath-Regular.otf'],
    scale: 1.0,
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
    rhythmProfile: 'classic-textbook',
    baselineStretch: 1.22,
    parIndent: '2em',
    parSkip: '0pt plus 1pt',
  },
  guaranteedFallback: {
    cjk: 'FandolSong-Regular.otf',
    cjkSans: 'FandolHei-Regular.otf',
    latin: 'lmroman10-regular.otf',
    math: 'latinmodern-math.otf',
  },
};
