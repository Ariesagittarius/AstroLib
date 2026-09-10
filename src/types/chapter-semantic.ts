/**
 * src/types/chapter-semantic.ts
 * AstroLib 核心领域数据模型：教材章节语义表示（Chapter Semantic Model）契约定义
 *
 * 架构规范：
 * - 属于 Layer 2 (Data Contract / Domain Model)
 * - 纯 TypeScript 接口声明，无运行时代码，无 DOM 依赖，无外部服务依赖
 * - 供 Processing (MDX AST 解析器)、Publishing (LaTeX/Typst 生成器) 与 Services 共同引用
 * - 遵循 Rule 1 (UI is not a domain model) & Rule 2 (Publishing is independent)
 */

export type SemanticBlockKind =
  | 'definition'       // 定义 Definition
  | 'theorem'          // 定理 Theorem
  | 'lemma'            // 引理 Lemma
  | 'corollary'        // 推论 Corollary
  | 'proposition'      // 命题 Proposition
  | 'axiom'            // 公理 Axiom
  | 'property'         // 性质 Property
  | 'criterion'        // 准则 Criterion
  | 'example'          // 例题 Example
  | 'variant'          // 变式 Variant
  | 'proof'            // 数学严谨证明 Proof (带 QED 方框)
  | 'solution'         // 例题解答 Solution
  | 'remark'           // 注记 Remark
  | 'note'             // 思考/注意 Note
  | 'analysis'         // 思路分析 Analysis
  | 'method'           // 方法总结 Method
  | 'academicblock'    // 法则/公式块 Academic Block
  | 'exercise'         // 习题 Exercise
  | 'guide'            // 导读 Guide
  | 'summary'          // 总结 Summary
  | 'heading'          // 标题 Heading
  | 'paragraph'        // 普通段落 Paragraph
  | 'math'             // 行间公式 Display Math
  | 'list'             // 列表 List (ordered/unordered)
  | 'table'            // 表格 Table
  | 'figure'           // 插图与图题 Figure
  | 'quote'            // 引用 Blockquote
  | 'code'             // 代码块 Code
  | 'digital_resource' // 规范学术数字资源 (Digital Resource)
  | 'qrcode';          // 兼容历史命名 (微课视频/二维码)

export type SemanticResourceCategory =
  | 'digital_resource' // 外部学习资源 / 延伸材料 (配套数字资源)
  | 'reference'        // 正式学术参考文献 / 来源出处
  | 'footnote';        // 正文解释性补充批注

export interface DigitalResourceItem {
  id?: string;
  title: string;
  url: string;
  category: SemanticResourceCategory;
  categoryLabel?: string; // 类别呈现标签，如 "配套数字资源"、"微课视频"、"动态演示"、"教学课件"
  relation: 'flow' | 'embedded' | 'section_end'; // 确定性归属：flow (正文流) 或 embedded (嵌入父级容器如 Example/Knowledge)
  hostKind?: SemanticBlockKind; // 仅当 100% 确定父级容器时赋值，严禁推测
  hostId?: string;             // 仅当 100% 确定父级容器时赋值，严禁推测
}

export interface SemanticTableData {
  headers: string[];
  aligns?: Array<'left' | 'center' | 'right' | null>;
  rows: string[][];
}

export interface SemanticFigureData {
  url: string;
  alt?: string;
  caption?: string;
  localPath?: string;
}

export interface SemanticListData {
  ordered: boolean;
  start?: number;
  items: SemanticBlock[][];
}

export interface SemanticBlock {
  kind: SemanticBlockKind;
  title?: string;
  label?: string;
  number?: string;
  coreNumber?: string;
  level?: number; // 针对 heading: 1, 2, 3, 4
  content?: string; // 纯文本或包含公式的文本内容
  children?: SemanticBlock[];
  tableData?: SemanticTableData;
  figureData?: SemanticFigureData;
  listData?: SemanticListData;
  resourceData?: DigitalResourceItem;
  meta?: Record<string, any>;
}

export interface ChapterImageItem {
  alt: string;
  url: string;
  originalPath: string;
  localPath?: string;
}

/**
 * 权威章节层级元数据（Canonical Chapter Metadata）
 * 由 Core / Catalog 领域层决定，供 Publishing 消费，严禁由排版渲染层倒推
 */
export interface ChapterCanonicalMetadata {
  colSlug: string;
  bookSlug: string;
  bookTitle: string;
  bookAuthor?: string;
  chapterNumber?: number;     // 真实章号 (如 2)
  chapterTitle?: string;      // 真实大章名称 (如 "第2章 一元函数微分学" 或 "一元函数微分学")
  sectionNumber?: string;     // 真实节号 (如 "2.2")
  sectionTitle: string;       // 节名称 (如 "求导的基本法则")
  fullTitle: string;          // 完整标题 (如 "2.2 求导的基本法则")
  numberingPrefix: string;    // 计数器前缀 (如 "2."，供节内环境动态递增)
}

export interface ChapterDocument {
  title: string;
  cleanTitle: string;
  slug: string;
  bookTitle?: string;
  bookSlug?: string;
  colSlug?: string;
  author?: string;
  courseName?: string;
  metadata?: ChapterCanonicalMetadata;
  blocks: SemanticBlock[];
  images: ChapterImageItem[];
  rawMdx?: string;
}

export interface ChapterLatexConfig {
  documentclass: 'ctexbook' | 'ctexart';
  paperSize: 'a4' | 'b5';
  fontSize: 10 | 10.5 | 11 | 12;
  typography?: 'scholarly' | 'classic' | 'mathematical' | 'lecture' | string;
  resolutionMode?: 'deterministic' | 'adaptive';
  fontFamily?: 'serif' | 'sans';
  /** @deprecated 请改用 typography 预设 */
  mathFont?: 'typst' | 'modern' | 'times' | 'pagella';
  /** @deprecated 请改用 typography 预设 */
  cjkFont?: 'default' | 'sourcehan' | 'song' | 'kai' | string;
  numberingDepth: number; // 编号深入层级
  showToc: boolean; // 是否在章首输出微型本章目录
  author?: string;
  courseName?: string;
  bookTitle?: string;
  title?: string;
  date?: string;
  headerMode: 'standard' | 'compact' | 'none';
}
