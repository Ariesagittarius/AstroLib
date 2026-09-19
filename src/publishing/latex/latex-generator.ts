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
