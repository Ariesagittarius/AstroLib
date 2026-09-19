/**
 * src/publishing/latex/latex-generator.ts
 * 生产级大学数学教材/学术练习册 LaTeX 源码生成引擎（外观模式 Facade）
 *
 * 模块架构分层说明：
 * - core/clean-math.ts: 纯公式语法清洗、Unicode 符号映射与 LaTeX 转义纯函数库
 * - renderers/exercise-renderer.ts: 习题自测试卷 / 练习册 LaTeX 生成器 (Jinwen-XU/homework 标准)
 * - renderers/chapter-renderer.ts: 章节教材 / 讲义语义树 LaTeX 渲染器 (book.tex 标准)
 *
 * 本入口保留全部历史导出签名与默认配置，确保现有系统与测试用例 100% 平滑兼容。
 */

export {
  decodeHtmlEntities,
  cleanMathFormula,
  UNICODE_MATH_MAP,
  MATH_COMMAND_REGEX,
  normalizeUnicodeMath,
  balanceDollars,
  sanitizeBareMath,
  formatLatexContent,
  getVisualWidth,
  stripLeadingNumber,
  stripTheoremPrefix,
  mathToBookmarkText,
  formatHeadingLatex,
  escapeLatexMeta,
} from './core/clean-math';

export {
  type LatexExportConfig,
  DEFAULT_LATEX_CONFIG,
  formatChoiceTasks,
  getSpaceLatex,
  generateLatexDocument,
} from './renderers/exercise-renderer';

export {
  type ChapterLatexConfig,
  DEFAULT_CHAPTER_LATEX_CONFIG,
  renderLatexTable,
  renderLatexList,
  renderLatexFigure,
  renderSemanticBlocks,
  renderChapterLatexDocument,
  generateChapterLatexDocument,
} from './renderers/chapter-renderer';
