/**
 * src/publishing/typography/types.ts
 * AstroLib 学术导出字体体系 (Academic Typography System) 核心契约与数据模型
 *
 * 架构边界：
 * - 归属于 Publishing Domain / Typography Layer (Layer 3)
 * - 纯 TypeScript 契约声明，零 UI 依赖、零 AST 依赖、零 Shell 运行时依赖
 * - 遵循 Rule 1 (UI is not a domain model) & Rule 2 (Publishing is independent)
 * - 满足原则：Typography is a publishing concern; semantic role != visual component
 */

/**
 * 出版字体排版安全准则：当前 AstroLib 所支持的 XeLaTeX/xdvipdfmx publishing pipeline
 * 禁止依赖未经验证的 Variable Font (可变字体)。
 */
export const StaticFontOnlyForPublishing = true as const;

/**
 * 字体解析模式 (Font Resolution Mode)
 * - deterministic: 用于 CI、Release PDF、Golden PDF、自动化回归测试。
 *   严格禁止依赖操作系统未知字体，只允许使用项目资产与经过验证的 TeX Live 官方资产。
 * - adaptive: 用于本地开发与读者预览环境。
 *   优先使用宿主机已安装的高质量系统字体（如思源宋体、霞鹜文楷）。
 */
export type FontResolutionMode = 'deterministic' | 'adaptive';

/**
 * 学术排版语义角色 (Semantic Typography Roles)
 * 字体系统面向语义角色定义字体，而不是面向具体的页面盒子
 */
export type SemanticTypographyRole =
  | 'body'            // 中文/西文主体正文
  | 'heading'         // 篇、章、节结构化标题
  | 'subheading'      // 小节/条目级次标题
  | 'math'            // 行内与行间数学公式
  | 'code'            // 行内代码与算法程序块
  | 'caption'         // 插图与表格题注
  | 'footnote'        // 页面注释与解释性补充
  | 'quote'           // 学术引文
  | 'theoremLabel'    // 定理/定义/引理/命题等前缀标签
  | 'solutionLabel'   // 例题解答/解析前缀标签 (如【解】)
  | 'annotation'      // 注记/思路分析前缀标签 (如【注记】、【思路分析】)
  | 'digitalResource';// 配套数字资源学术流式标注标签

/**
 * 字体规格描述契约 (TypographyFontSpec)
 * 区分确定性发布链与自适应本地链的解析候选
 */
export interface TypographyFontSpec {
  /** 设计预期字体名 (如 'Source Han Serif SC' 或 'FandolSong-Regular.otf') */
  designFamily: string;
  /** 主选设计字体名 (向下兼容别名) */
  primaryFamily?: string;
  /**
   * 确定性解析链 (Deterministic Candidates)
   * 仅包含: 项目受控字体资产 -> TeX Live 官方内建且经验证的静态字体 -> 显式失败
   * 严禁包含系统字体！
   */
  deterministicFamilies: string[];
  /**
   * 自适应本地解析链 (Adaptive Candidates)
   * 顺序: 项目受控资产 -> 宿主机高质量系统字体 -> TeX Live 官方内建静态字体 -> 显式失败
   */
  adaptiveFamilies: string[];
  /** 粗体专门家族名或文件 (可选) */
  boldFamily?: string;
  /** 斜体专门家族名或文件 (可选) */
  italicFamily?: string;
  /** 粗斜体专门家族名或文件 (可选) */
  boldItalicFamily?: string;
  /** 字体相对标准字阶的缩放比（用于中西文光学字高对齐，如 0.98 或 1.0） */
  scale?: number | 'MatchLowercase' | 'MatchUppercase';
  /** 是否启用自动伪粗体 (AutoFakeBold，仅当单字重开源字体在 XeLaTeX 下的安全加粗) */
  autoFakeBold?: boolean;
  /** OpenType 特性参数 (如 ['RawFeature={+liga}', 'Numbers=OldStyle']) */
  features?: string[];
  /** 字体文件物理路径 (若使用项目私有打包字体) */
  path?: string;
}

/**
 * 数学公式字体规格契约 (MathFontSpec)
 * 专为 unicode-math 宏包定制，必须支持 OpenType Math 表
 */
export interface MathFontSpec {
  /** 数学字体文件名或家族名 (如 'STIXTwoMath-Regular.otf') */
  family: string;
  /** 确定性回退字体 (必须由 TeX Live 官方发行版稳定提供) */
  fallbackFamilies?: string[];
  /** 字体缩放比 (如 1.0 或 'MatchLowercase') */
  scale?: number | 'MatchLowercase';
  /** 粗体数学字体 (可选) */
  boldFamily?: string;
  /** 特殊数学范围定制 (如 range={up/{num,latin,Latin}} ) */
  ranges?: Array<{ range: string; font: string }>;
}

/**
 * 版面度量与文本韵律契约 (TypographyMetrics)
 *
 * 核心范畴划分（Phase 7 严格规范）：
 * - Category A: Font Optical Adjustment (字体光学字阶缩放，由 TypographyFontSpec.scale 管理，如 Mathematical 的 1.015)
 * - Category B: Text Rhythm / Layout Metrics (版面度量与文本韵律，由 TypographyMetrics 管理，如 baselineStretch、parIndent)
 * 严禁将 baselineStretch 等文本韵律基线混称为 "Zero Override"。
 */
export interface TypographyMetrics {
  /** 文本韵律基线场景规范 (textbook: 现代教材, classic-textbook: 经典教本, lecture: 大学讲义) */
  rhythmProfile?: 'textbook' | 'classic-textbook' | 'lecture';
  /** 行距伸缩倍率 (例如 1.25 对齐中文 1.74 倍学术阅读行高) */
  baselineStretch: number;
  /** 首行缩进长度 (默认 '2em') */
  parIndent: string;
  /** 段落间距 (默认 '0pt plus 1pt') */
  parSkip: string;
  /** 一级标题前垂直间距 (如 '1.8em plus 0.4em minus 0.2em') */
  headingBeforeSpacing?: string;
  /** 一级标题后垂直间距 (如 '0.8em plus 0.2em') */
  headingAfterSpacing?: string;
  /** 行间公式与正文间距 */
  equationSpacing?: {
    before: string;
    after: string;
  };
  /** 定理/定义/引理环境前后垂直间距 */
  theoremSpacing?: {
    before: string;
    after: string;
  };
  /** 证明环境前后垂直间距 */
  proofSpacing?: {
    before: string;
    after: string;
  };
  /** 图表题注与主体的间距 */
  captionSpacing?: string;
  /** 脚注区域前垂直间距 */
  footnoteSpacing?: string;
  /** 代码块前后垂直间距 */
  codeSpacing?: {
    before: string;
    after: string;
  };
}

/**
 * 预设架构类别
 * - core: 核心通用学术预设 (面向正式教材、学术专著、理论论文)
 * - specialized: 专门场景学术预设 (面向课堂讲义、备课笔记、习题解答)
 */
export type TypographyPresetCategory = 'core' | 'specialized';

/**
 * 官方学术预设标识 (TypographyPresetId)
 * 严格收敛为 4 套经过真实物理编译验证的学术预设，彻底移除 international
 */
export type TypographyPresetId =
  | 'scholarly'      // 现代中文大学教材 (默认, Core)
  | 'classic'        // 传统 LaTeX / 数学教材 (Core)
  | 'mathematical'   // 数学 / 理论物理专版 (Core)
  | 'lecture';       // 大学讲义 / 教师教案 (Specialized)

/**
 * 完整学术字体预设契约 (TypographyPreset)
 */
export interface TypographyPreset {
  /** 唯一预设 ID */
  id: TypographyPresetId;
  /** 预设架构类别 */
  category: TypographyPresetCategory;
  /** 学术呈现名称 (如 '现代学术教材 (Scholarly)') */
  name: string;
  /** 简明学术定位 */
  description: string;
  /** 适用学科与出版场景 */
  targetAudience: string;
  /** 中文正文字体 */
  chineseBody: TypographyFontSpec;
  /** 中文标题与环境标签字体 */
  chineseHeading: TypographyFontSpec;
  /** 西文正文字体 (通过 \setmainfont 注入) */
  latinText: TypographyFontSpec;
  /** 数学公式字体 (通过 \setmathfont 注入) */
  math: MathFontSpec;
  /** 等宽代码字体 (通过 \setmonofont 注入) */
  monospace: TypographyFontSpec;
  /** 楷体/注记字体 (用于楷书题注与数字资源前缀) */
  kaiFont: TypographyFontSpec;
  /** 版面度量规范 */
  metrics: TypographyMetrics;
  /** 极端缺字环境下的确定性兜底 (保证在 TeX Live CI 容器内 100% 存在且无损编译) */
  guaranteedFallback: {
    cjk: string;
    cjkSans: string;
    latin: string;
    math: string;
  };
}

/**
 * 字体许可证与开源资产元数据契约 (FontMetadata)
 */
export interface FontMetadata {
  /** 字体家族标识 */
  family: string;
  /** 官方标准文件名列表 */
  files: string[];
  /** 开源许可证名称 */
  license: 'OFL-1.1' | 'GPLv3-with-font-exception' | 'GFL' | 'Apache-2.0';
  /** 许可证权威链接 */
  licenseUrl: string;
  /** 上游权威项目仓库 / CTAN 地址 */
  sourceUrl: string;
  /** 维护版本或归档版本 */
  version: string;
  /** 语种覆盖度 */
  languageSupport: Array<'zh-CN' | 'en' | 'math' | 'symbol'>;
  /** 是否提供 OpenType 数学表 */
  mathSupport: boolean;
  /** 是否允许项目分发/再分发 */
  redistributionAllowed: boolean;
  /** 是否由 TeX Live 官方发行版内建提供 (零外部安装即可使用) */
  bundledInTexLive: boolean;
  /** 推荐的同生态回退字体 */
  recommendedFallback?: string;
}

/**
 * 历史废弃参数映射契约 (LegacyTypographyOptions)
 * 用于向下兼容原有 mathFont, cjkFont, fontFamily
 */
export interface LegacyTypographyOptions {
  /** @deprecated 请改用 typography 预设。'typst' | 'modern' | 'times' | 'pagella' */
  mathFont?: 'typst' | 'modern' | 'times' | 'pagella';
  /** @deprecated 请改用 typography 预设。'default' | 'sourcehan' | 'song' | 'kai' */
  cjkFont?: 'default' | 'sourcehan' | 'song' | 'kai' | string;
  /** @deprecated 请改用 typography 预设。'serif' | 'sans' */
  fontFamily?: 'serif' | 'sans';
}

/**
 * 规范化排版意图契约 (NormalizedTypographyIntent)
 * 用于将历史参数精确分解为 基线预设 + 具名正交覆盖 (Base Preset + Specific Overrides)
 */
export interface NormalizedTypographyIntent {
  basePresetId: TypographyPresetId;
  overrides?: {
    mathFamily?: string;
    cjkBodyPrimary?: string;
    cjkHeadingPrimary?: string;
    isSansTitle?: boolean;
  };
}

/**
 * 解析后的排版上下文 (ResolvedTypographyConfig)
 */
export interface ResolvedTypographyConfig {
  preset: TypographyPreset;
  resolutionMode: FontResolutionMode;
  source: 'preset' | 'legacy' | 'custom';
  warnings: string[];
}

/**
 * 字体嵌入审计记录 (FontEmbeddingAuditRecord)
 */
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
  isDesignSpecimen: boolean; // 是否成功渲染了设计初衷字体 (非回退)
  compileDurationMs: number;
  pdfSizeBytes: number;
  warnings: string[];
}
