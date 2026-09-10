/**
 * src/publishing/typography/presets/lecture.ts
 * 大学讲义预设 (Lecture) - Specialized 专门场景学术预设
 *
 * 设计理念：
 * - 专为随堂讲义、课程笔记、研讨班习题解答打造的清雅排版体验
 * - 中文正文：霞鹜文楷 GB Lite (LXGW WenKai GB Lite)
 * - 中文标题：思源黑体 (Source Han Sans SC)
 * - 西文与公式：STIX Two (Text & Math)
 * - 辅助楷体：霞鹜文楷 GB Lite (LXGW WenKai GB Lite)
 */

import type { TypographyPreset } from '../types.ts';

export const PRESET_LECTURE: TypographyPreset = {
  id: 'lecture',
  category: 'specialized',
  name: '大学讲义 (Lecture)',
  description: '大学课程讲义与随堂笔记。霞鹜文楷（清雅手写正文）+ 思源黑体（标题）+ STIX Two（公式）',
  targetAudience: '随堂讲义、课程期末复习指南、助教研讨习题解答 (非正式 Textbook 默认)',
  chineseBody: {
    designFamily: 'LXGW WenKai GB Lite',
    primaryFamily: 'LXGW WenKai GB Lite',
    deterministicFamilies: [
      'LXGWWenKaiGBLite-Regular.ttf',
      'FandolKai-Regular.otf',
      'FandolSong-Regular.otf',
    ],
    adaptiveFamilies: [
      'LXGW WenKai GB Lite',
      'LXGWWenKaiGBLite-Regular.ttf',
      'LXGW WenKai',
      'FandolKai-Regular.otf',
      'KaiTi',
      'STKaiti',
      'FandolSong-Regular.otf',
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
    designFamily: 'STIX Two Text',
    primaryFamily: 'STIX Two Text',
    deterministicFamilies: [
      'STIXTwoText-Regular.otf',
      'lmroman10-regular.otf',
    ],
    adaptiveFamilies: [
      'STIX Two Text',
      'STIXTwoText-Regular.otf',
      'lmroman10-regular.otf',
    ],
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
    ],
    autoFakeBold: true,
  },
  metrics: {
    rhythmProfile: 'lecture',
    baselineStretch: 1.30,
    parIndent: '2em',
    parSkip: '1pt plus 1.5pt',
  },
  guaranteedFallback: {
    cjk: 'FandolKai-Regular.otf',
    cjkSans: 'FandolHei-Regular.otf',
    latin: 'STIXTwoText-Regular.otf',
    math: 'STIXTwoMath-Regular.otf',
  },
};
