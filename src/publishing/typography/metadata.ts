/**
 * src/publishing/typography/metadata.ts
 * AstroLib 学术开源字体元数据清单与权威许可证配置
 *
 * 架构规范：
 * - 纯领域元数据定义，严格标定许可证、上游来源、TeX Live 自包含状态与回退指引
 * - 确保所有内置和推荐字体均为 100% 自由开源、允许商业出版、允许 CI 自动化排版
 */

import type { FontMetadata } from './types.ts';

/**
 * 官方登记的学术字体元数据清单
 */
export const ACADEMIC_FONT_INVENTORY: Record<string, FontMetadata> = {
  // 1. STIX Two (科技出版与学术数学界黄金标准)
  stixTwoText: {
    family: 'STIX Two Text',
    files: [
      'STIXTwoText-Regular.otf',
      'STIXTwoText-Bold.otf',
      'STIXTwoText-Italic.otf',
      'STIXTwoText-BoldItalic.otf',
    ],
    license: 'OFL-1.1',
    licenseUrl: 'https://scripts.sil.org/OFL',
    sourceUrl: 'https://github.com/stipub/stixfonts',
    version: '2.13',
    languageSupport: ['en', 'symbol'],
    mathSupport: false,
    redistributionAllowed: true,
    bundledInTexLive: true,
    recommendedFallback: 'Latin Modern Roman',
  },
  stixTwoMath: {
    family: 'STIX Two Math',
    files: ['STIXTwoMath-Regular.otf'],
    license: 'OFL-1.1',
    licenseUrl: 'https://scripts.sil.org/OFL',
    sourceUrl: 'https://github.com/stipub/stixfonts',
    version: '2.13',
    languageSupport: ['math', 'symbol'],
    mathSupport: true,
    redistributionAllowed: true,
    bundledInTexLive: true,
    recommendedFallback: 'latinmodern-math.otf',
  },

  // 2. 思源宋体 / Noto Serif CJK (现代中文学术印刷基准)
  sourceHanSerif: {
    family: 'Source Han Serif SC',
    files: [
      'SourceHanSerifSC-Regular.otf',
      'SourceHanSerifSC-Bold.otf',
      'NotoSerifSC-Regular.otf',
      'NotoSerifCJKsc-Regular.otf',
      'NotoSerifSC-VF.ttf',
    ],
    license: 'OFL-1.1',
    licenseUrl: 'https://scripts.sil.org/OFL',
    sourceUrl: 'https://github.com/adobe-fonts/source-han-serif',
    version: '2.002',
    languageSupport: ['zh-CN', 'en', 'symbol'],
    mathSupport: false,
    redistributionAllowed: true,
    bundledInTexLive: false,
    recommendedFallback: 'FandolSong-Regular.otf',
  },

  // 3. 思源黑体 / Noto Sans CJK (现代标题与定理前缀标签基准)
  sourceHanSans: {
    family: 'Source Han Sans SC',
    files: [
      'SourceHanSansSC-Regular.otf',
      'SourceHanSansSC-Bold.otf',
      'NotoSansSC-Regular.otf',
      'NotoSansCJKsc-Regular.otf',
      'NotoSansSC-VF.ttf',
    ],
    license: 'OFL-1.1',
    licenseUrl: 'https://scripts.sil.org/OFL',
    sourceUrl: 'https://github.com/adobe-fonts/source-han-sans',
    version: '2.004',
    languageSupport: ['zh-CN', 'en', 'symbol'],
    mathSupport: false,
    redistributionAllowed: true,
    bundledInTexLive: false,
    recommendedFallback: 'FandolHei-Regular.otf',
  },

  // 4. Fandol 家族 (TeX Live 官方内建中文宏包标配，CI 确定性基石)
  fandolSong: {
    family: 'FandolSong',
    files: ['FandolSong-Regular.otf', 'FandolSong-Bold.otf'],
    license: 'GPLv3-with-font-exception',
    licenseUrl: 'https://www.gnu.org/licenses/gpl-3.0.html',
    sourceUrl: 'https://ctan.org/pkg/fandol',
    version: '0.32',
    languageSupport: ['zh-CN', 'symbol'],
    mathSupport: false,
    redistributionAllowed: true,
    bundledInTexLive: true,
  },
  fandolHei: {
    family: 'FandolHei',
    files: ['FandolHei-Regular.otf', 'FandolHei-Bold.otf'],
    license: 'GPLv3-with-font-exception',
    licenseUrl: 'https://www.gnu.org/licenses/gpl-3.0.html',
    sourceUrl: 'https://ctan.org/pkg/fandol',
    version: '0.32',
    languageSupport: ['zh-CN', 'symbol'],
    mathSupport: false,
    redistributionAllowed: true,
    bundledInTexLive: true,
  },
  fandolKai: {
    family: 'FandolKai',
    files: ['FandolKai-Regular.otf'],
    license: 'GPLv3-with-font-exception',
    licenseUrl: 'https://www.gnu.org/licenses/gpl-3.0.html',
    sourceUrl: 'https://ctan.org/pkg/fandol',
    version: '0.32',
    languageSupport: ['zh-CN', 'symbol'],
    mathSupport: false,
    redistributionAllowed: true,
    bundledInTexLive: true,
  },

  // 5. Latin Modern (经典 TeX 罗马体与数学符号)
  latinModernRoman: {
    family: 'Latin Modern Roman',
    files: [
      'lmroman10-regular.otf',
      'lmroman10-bold.otf',
      'lmroman10-italic.otf',
      'lmroman10-bolditalic.otf',
    ],
    license: 'GFL',
    licenseUrl: 'http://www.gust.org.pl/projects/e-foundry/licenses',
    sourceUrl: 'https://ctan.org/pkg/lm',
    version: '2.004',
    languageSupport: ['en', 'symbol'],
    mathSupport: false,
    redistributionAllowed: true,
    bundledInTexLive: true,
  },
  latinModernMath: {
    family: 'Latin Modern Math',
    files: ['latinmodern-math.otf'],
    license: 'GFL',
    licenseUrl: 'http://www.gust.org.pl/projects/e-foundry/licenses',
    sourceUrl: 'https://ctan.org/pkg/lm-math',
    version: '1.959',
    languageSupport: ['math', 'symbol'],
    mathSupport: true,
    redistributionAllowed: true,
    bundledInTexLive: true,
  },

  // 6. Libertinus (数理物理学优雅衬线与完备数学符号)
  libertinusSerif: {
    family: 'Libertinus Serif',
    files: [
      'LibertinusSerif-Regular.otf',
      'LibertinusSerif-Bold.otf',
      'LibertinusSerif-Italic.otf',
      'LibertinusSerif-BoldItalic.otf',
    ],
    license: 'OFL-1.1',
    licenseUrl: 'https://scripts.sil.org/OFL',
    sourceUrl: 'https://github.com/alerque/libertinus',
    version: '7.040',
    languageSupport: ['en', 'symbol'],
    mathSupport: false,
    redistributionAllowed: true,
    bundledInTexLive: true,
    recommendedFallback: 'STIX Two Text',
  },
  libertinusMath: {
    family: 'Libertinus Math',
    files: ['LibertinusMath-Regular.otf'],
    license: 'OFL-1.1',
    licenseUrl: 'https://scripts.sil.org/OFL',
    sourceUrl: 'https://github.com/alerque/libertinus',
    version: '7.040',
    languageSupport: ['math', 'symbol'],
    mathSupport: true,
    redistributionAllowed: true,
    bundledInTexLive: true,
    recommendedFallback: 'STIXTwoMath-Regular.otf',
  },

  // 7. 霞鹜文楷 (高质量开源中文手写/楷体，专用于课程讲义与题注)
  lxgwWenKai: {
    family: 'LXGW WenKai GB',
    files: [
      'LXGWWenKaiGBLite-Regular.ttf',
      'LXGWWenKaiGBLite-Bold.ttf',
      'LXGWWenKai-Regular.ttf',
    ],
    license: 'OFL-1.1',
    licenseUrl: 'https://scripts.sil.org/OFL',
    sourceUrl: 'https://github.com/lxgw/LxgwWenKai',
    version: '1.330',
    languageSupport: ['zh-CN', 'en', 'symbol'],
    mathSupport: false,
    redistributionAllowed: true,
    bundledInTexLive: true, // TeX Live 自带 lxgw-wenkai 宏包及字体
    recommendedFallback: 'FandolKai-Regular.otf',
  },

  // 8. New Computer Modern (Typst 默认学术字体同款，高对比衬线)
  newComputerModernMath: {
    family: 'NewCMMath-Book',
    files: ['NewCMMath-Book.otf', 'NewCMMath-Regular.otf'],
    license: 'GFL',
    licenseUrl: 'http://www.gust.org.pl/projects/e-foundry/licenses',
    sourceUrl: 'https://ctan.org/pkg/newcomputermodern',
    version: '4.7',
    languageSupport: ['math', 'symbol'],
    mathSupport: true,
    redistributionAllowed: true,
    bundledInTexLive: true,
    recommendedFallback: 'latinmodern-math.otf',
  },
};
