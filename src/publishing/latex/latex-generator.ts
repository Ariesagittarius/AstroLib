/**
 * src/publishing/latex/latex-generator.ts
 * 生产级大学数学教材/学术练习册 LaTeX 源码生成引擎
 * 基于 CTAN / TeX Live 官方收录的 Jinwen-XU/homework 宏包标准架构开发
 * 遵循极简学术排版哲学：The content is the design. The mathematics is the interface.
 * 原生直出 LaTeX/KaTeX 数学公式，零转译损耗，100% 还原公式韵律。
 */
import type { SlimQuestionItem } from '../../types/exercises';
import type {
  ChapterDocument,
  SemanticBlock,
  SemanticTableData,
  SemanticFigureData,
  SemanticListData,
} from '../../types/chapter-semantic';
import {
  type BaseExportSettings,
  type ChapterExportSettings,
  type ExerciseExportSettings,
  type ImageSizingPolicy,
  DEFAULT_CHAPTER_EXPORT_SETTINGS,
  DEFAULT_EXERCISE_EXPORT_SETTINGS,
  DEFAULT_IMAGE_POLICY,
  renderFontPreamble,
  renderCjkFontPreamble,
} from '../common/export-settings.ts';
export type LatexExportConfig = ExerciseExportSettings;
export const DEFAULT_LATEX_CONFIG: LatexExportConfig = DEFAULT_EXERCISE_EXPORT_SETTINGS;

export type ChapterLatexConfig = ChapterExportSettings;
export const DEFAULT_CHAPTER_LATEX_CONFIG: ChapterLatexConfig & { embedStyle?: boolean; styleSource?: string } = {
  ...DEFAULT_CHAPTER_EXPORT_SETTINGS,
  embedStyle: false,
};

/**
 * HTML 实体解码与清理
 */
function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&\$lt\$;?/gi, '<')
    .replace(/&\$gt\$;?/gi, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&le;/g, '\\leqslant ')
    .replace(/&ge;/g, '\\geqslant ')
    .replace(/&times;/g, '\\times ')
    .replace(/&divide;/g, '\\div ')
    .replace(/&plusmn;/g, '\\pm ')
    .replace(/&infin;/g, '\\infty ');
}

/**
 * 清理与标准化数学公式内部语法（如规范化分段函数、修复换行、保护填空下划线）
 */
function cleanMathFormula(inner: string): string {
  let res = inner;
  // 转换伪分段函数 \left\{\begin{aligned} ... \end{aligned}\right. 为标准 \begin{cases} ... \end{cases}
  res = res.replace(/\\left\\\{\s*\\begin\{aligned\}([\s\S]*?)\\end\{aligned\}\s*(?:\\right\.?)?/g, (_m, body) => {
    const cleanedRows = body
      .split('\\\\')
      .map((row: string) => row.trim().replace(/^&\s*/, ''))
      .join(' \\\\\n  ');
    return `\\begin{cases}\n  ${cleanedRows}\n\\end{cases}`;
  });

  // 修复 cases/matrix 中误写单反斜杠换行错误 (如 \ 0, & -> \\ 0, &)
  res = res.replace(/([^\\])\\\s+([0-9a-zA-Z\$\\]+,\s*&)/g, '$1 \\\\ $2');

  // 修复换行后紧跟中括号被 LaTeX 误解析为可选行距参数 \\[<dim>] 引发 "Missing number"
  res = res.replace(/\\\\\s*\[/g, '\\\\ \\relax [');

  // 修复 OCR 粘连：缺失空格导致命令与后续字母粘连（如 \cupB -> \cup B, \capA -> \cap A）
  res = res.replace(/\\(cup|cap|pm|mp|div|wedge|vee|sim|times)([a-zA-Z])/g, '\\$1 $2');

  // 修复 \begin{array}{...} 声明列数少于实际 & 分隔列数引发的 "Extra alignment tab has been changed to \cr"
  res = res.replace(/\\begin\{array\}\{([^}]+)\}([\s\S]*?)\\end\{array\}/g, (_m, colsDecl, body) => {
    const rawRows = body.split('\\\\');
    let maxCols = 1;
    for (const r of rawRows) {
      const ampersands = (r.match(/(?<!\\)&/g) || []).length;
      if (ampersands + 1 > maxCols) {
        maxCols = ampersands + 1;
      }
    }
    const cleanCols = colsDecl.replace(/[^a-zA-Z]/g, '');
    let newCols = colsDecl;
    if (cleanCols.length < maxCols) {
      const padChar = cleanCols[cleanCols.length - 1] || 'c';
      const missing = maxCols - cleanCols.length;
      newCols = colsDecl.trim() + ' ' + Array(missing).fill(padChar).join(' ');
    }
    return `\\begin{array}{${newCols}}${body}\\end{array}`;
  });

  // 填空题下划线保护：使用学术排版标准 \rule[-0.2ex]{3.5em}{0.4pt}
  res = res.replace(/\\underline\{\s*(\\quad)*\s*\}/g, '\\rule[-0.2ex]{3.5em}{0.4pt}');
  res = res.replace(/_{3,}/g, '\\rule[-0.2ex]{3.5em}{0.4pt}');

  return res;
}

const UNICODE_MATH_MAP: Record<string, string> = {
  '𝜋': '\\pi ',
  'π': '\\pi ',
  '𝛼': '\\alpha ',
  'α': '\\alpha ',
  '𝛽': '\\beta ',
  'β': '\\beta ',
  '𝛾': '\\gamma ',
  'γ': '\\gamma ',
  '𝜃': '\\theta ',
  'θ': '\\theta ',
  '𝜆': '\\lambda ',
  'λ': '\\lambda ',
  '𝜇': '\\mu ',
  'μ': '\\mu ',
  '𝜎': '\\sigma ',
  'σ': '\\sigma ',
  '𝜏': '\\tau ',
  'τ': '\\tau ',
  '𝜔': '\\omega ',
  'ω': '\\omega ',
  '𝜙': '\\phi ',
  'φ': '\\phi ',
  '𝜓': '\\psi ',
  'ψ': '\\psi ',
  '∞': '\\infty ',
  '≤': '\\le ',
  '≥': '\\ge ',
  '≠': '\\ne ',
  '≈': '\\approx ',
  '∈': '\\in ',
  '∉': '\\notin ',
  '⊂': '\\subset ',
  '⊆': '\\subseteq ',
  '∪': '\\cup ',
  '∩': '\\cap ',
  '∅': '\\varnothing ',
  '±': '\\pm ',
  '×': '\\times ',
  '÷': '\\div ',
  '∂': '\\partial ',
  '∇': '\\nabla ',
  '∑': '\\sum ',
  '∏': '\\prod ',
  '∫': '\\int ',
  '°': '^\\circ ',
  '²': '^2',
  '³': '^3',
  '⁴': '^4',
  'ⁿ': '^n',
  '₁': '_1',
  '₂': '_2',
  '₃': '_3',
  'ᵢ': '_i',
  'ₙ': '_n',
};

const MATH_COMMAND_REGEX =
  /\\(sqrt|frac|dfrac|tfrac|pi|alpha|beta|gamma|delta|epsilon|varepsilon|zeta|eta|theta|vartheta|iota|kappa|lambda|mu|nu|xi|rho|varrho|sigma|varsigma|tau|upsilon|phi|varphi|chi|psi|omega|Gamma|Delta|Theta|Lambda|Xi|Pi|Sigma|Upsilon|Phi|Psi|Omega|sin|cos|tan|cot|sec|csc|arcsin|arccos|arctan|ln|log|exp|lim|sum|prod|int|iint|iiint|oint|partial|nabla|infty|pm|mp|times|div|cdot|cdots|ldots|vdots|ddots|circ|le|ge|ne|leq|geq|neq|approx|sim|simeq|equiv|subset|supset|subseteq|supseteq|cup|cap|emptyset|varnothing|in|notin|ni|forall|exists|vec|hat|bar|tilde|dot|ddot|mathbf|mathbb|mathrm|mathcal|mathscr|mathfrak)(?![a-zA-Z])/;

/**
 * 规范化 Unicode 数学字符与控制字符
 */
export function normalizeUnicodeMath(text: string): string {
  if (!text) return '';
  let res = text.replace(/\r\n/g, '\n').replace(/\r/g, '');
  res = res.replace(/\\n(?![a-zA-Z])/g, '\n');
  res = res.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '');

  // 转换 Unicode 数学斜体英文字母 (U+1D44E .. U+1D467) 为常规 ASCII 字母
  res = res.replace(/[\uD835][\uDC4E-\uDC67]/g, (match) => {
    const code = match.codePointAt(0) || 0;
    return String.fromCharCode(code - 0x1d44e + 0x61);
  });

  // 转换全角/特殊 Unicode 罗马数字 (Ⅰ..Ⅹ) 为标准 ASCII
  const romanMap: Record<string, string> = {
    'Ⅰ': 'I',
    'Ⅱ': 'II',
    'Ⅲ': 'III',
    'Ⅳ': 'IV',
    'Ⅴ': 'V',
    'Ⅵ': 'VI',
    'Ⅶ': 'VII',
    'Ⅷ': 'VIII',
    'Ⅸ': 'IX',
    'Ⅹ': 'X',
  };
  res = res.replace(/[ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩ]/g, (m) => romanMap[m] || m);

  for (const [char, replacement] of Object.entries(UNICODE_MATH_MAP)) {
    if (res.includes(char)) {
      res = res.replaceAll(char, replacement);
    }
  }

  return res;
}

/**
 * 自动检测并修复文本中因 OCR 或输入遗漏的未闭合 $ 定界符
 */
export function balanceDollars(text: string): string {
  if (!text) return '';
  let res = '';
  let inMath = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const prev = i > 0 ? text[i - 1] : '';
    const next = i < text.length - 1 ? text[i + 1] : '';

    if (ch === '$' && prev === '\\') {
      res += ch;
      continue;
    }

    if (ch === '$' && next === '$') {
      res += '$$';
      i++;
      inMath = false;
      continue;
    }

    if (ch === '$') {
      inMath = !inMath;
      res += ch;
      continue;
    }

    if (inMath) {
      if (ch === '。' || ch === '；' || ch === '．' || (ch === '\n' && next === '\n')) {
        res += '$';
        inMath = false;
      }
    }

    res += ch;
  }

  if (inMath) {
    res += '$';
  }

  return res;
}

/**
 * 安全识别文本中裸露的数学命令与公式表达式，包裹 $...$
 * 必须在现有公式已受占位符保护的前提下运行
 */
export function sanitizeBareMath(text: string): string {
  if (!text) return text;

  // 1. 保护已有占位符 (格式为 §§MBX#123§§ 或 §§IMG#123§§)
  const mbxPlaceholders: string[] = [];
  let s = text.replace(/§§[A-Z0-9_]+#\d+§§/g, (m) => {
    mbxPlaceholders.push(m);
    return `§§P${mbxPlaceholders.length - 1}P§§`;
  });

  // 2. 若整段文本不含中文字符、不含换行、且非题号 (如 "(1)" 或 "A.")
  const trimmed = s.trim();
  const hasChinese = /[\u4e00-\u9fa5]/.test(trimmed);
  const isSubLabel = /^\(?[0-9a-zA-ZivxIVX]+\)?[\.\s]*$/.test(trimmed);
  const isPlainWord = /^[a-zA-Z\s]+$/.test(trimmed);

  if (!hasChinese && !isSubLabel && !isPlainWord) {
    const hasMathCmd = MATH_COMMAND_REGEX.test(trimmed);
    const hasSubSup = /(?:[a-zA-Z0-9\)\}][\^_]|[\^_][a-zA-Z0-9\{\(])/.test(trimmed);
    const hasEquation = /[0-9a-zA-Z'\(\)]+\s*[=<>]\s*[-+]?[0-9a-zA-Z]/.test(trimmed);

    if (mbxPlaceholders.length === 0 && (hasMathCmd || hasSubSup || hasEquation)) {
      return `$${trimmed}$`;
    }
  }

  // 3. 中西文混排情况：识别夹在中文、全角标点、换行之间的非中文公式片段
  s = s.replace(
    /(^|[\u4e00-\u9fa5，。！？；：（）“”《》【】、\n])([^\u4e00-\u9fa5，。！？；：（）“”《》【】\n§]+)(?=[\u4e00-\u9fa5，。！？；：（）“”《》【】、\n]|$)/g,
    (_match, prefix, content) => {
      const cTrim = content.trim();
      if (!cTrim) return `${prefix}${content}`;
      if (/^\(?[0-9a-zA-ZivxIVX]+\)?[\.\s]*$/.test(cTrim)) return `${prefix}${content}`;
      if (/^[a-zA-Z\s]+$/.test(cTrim)) return `${prefix}${content}`;

      const hasMathCmd = MATH_COMMAND_REGEX.test(cTrim);
      const hasSubSup = /(?:[a-zA-Z0-9\)\}][\^_]|[\^_][a-zA-Z0-9\{\(])/.test(cTrim);
      const hasEquation = /[0-9a-zA-Z'\(\)]+\s*[=<>]\s*[-+]?[0-9a-zA-Z]/.test(cTrim);

      if (hasMathCmd || hasSubSup || hasEquation) {
        const leadingSpace = content.match(/^\s*/)?.[0] || '';
        const trailingSpace = content.match(/\s*$/)?.[0] || '';
        return `${prefix}${leadingSpace}$${cTrim}$${trailingSpace}`;
      }
      return `${prefix}${content}`;
    }
  );

  // 4. 还原占位符
  s = s.replace(/§§P(\d+)P§§/g, (_m, idx) => mbxPlaceholders[Number(idx)] || '');
  return s;
}

/**
 * 清理 HTML 标签与规范化 Markdown 语法为 LaTeX 语法
 * 保护数学公式 ($...$ 与 $$...$$) 内部不被错误处理
 */
export function formatLatexContent(text: string): string {
  if (!text) return '';

  let raw = decodeHtmlEntities(text);
  raw = normalizeUnicodeMath(raw);
  raw = balanceDollars(raw);

  // 1. 规范化换行与字面量转义换行符 (消除 JSON 中 \\n 引起的 Undefined control sequence)
  raw = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  raw = raw.replace(/\\n(?![a-zA-Z])/g, '\n');


  // 2. 规范化 HTML 换行与段落 (严格校验标签边界，防止误伤 0<p<1 等数学不等式)
  raw = raw.replace(/<br\s*\/?>/gi, '\n');
  raw = raw.replace(/<\/p>/gi, '\n\n');
  raw = raw.replace(/<p(\s+[^>]*)?>/gi, '');
  raw = raw.replace(/<span(\s+[^>]*)?>/gi, '');
  raw = raw.replace(/<\/span>/gi, '');
  raw = raw.replace(/<div(\s+[^>]*)?>/gi, '');
  raw = raw.replace(/<\/div>/gi, '\n');
  raw = raw.replace(/<strong(\s+[^>]*)?>([\s\S]*?)<\/strong>/gi, '\\textbf{$2}');
  raw = raw.replace(/<b(\s+[^>]*)?>([\s\S]*?)<\/b>/gi, '\\textbf{$2}');
  raw = raw.replace(/<em(\s+[^>]*)?>([\s\S]*?)<\/em>/gi, '\\textit{$2}');
  raw = raw.replace(/<i(\s+[^>]*)?>([\s\S]*?)<\/i>/gi, '\\textit{$2}');

  // 3. 处理 Markdown 图片语法 (![alt](url))，使用占位符保护防止被后续裸公式识别器误处理
  const imgBlocks: string[] = [];
  raw = raw.replace(/!\[(.*?)\]\((.*?)\)/g, (_m, alt, url) => {
    const cleanUrl = url.trim();
    const cleanAlt = alt ? alt.trim() : '';
    const escapedAlt = (cleanAlt || cleanUrl).replace(/([_&%$#])/g, '\\$1');
    imgBlocks.push(
      `\n\\begin{center}\n  \\IfFileExists{../public${cleanUrl}}{\\includegraphics[width=0.48\\linewidth,keepaspectratio]{../public${cleanUrl}}}{\\IfFileExists{public${cleanUrl}}{\\includegraphics[width=0.48\\linewidth,keepaspectratio]{public${cleanUrl}}}{\\fbox{\\small\\itshape [图示] ${escapedAlt}}}}\n\\end{center}\n`
    );
    return `§§IMG#${imgBlocks.length - 1}§§`;
  });

  // 4. 处理填空题下划线与括号留白 (在提取公式前执行，防止下划线引发数学模式误判)
  raw = raw.replace(/\\underline\{\s*(\\quad)*\s*\}/g, '\\rule[-0.2ex]{3.5em}{0.4pt}');
  raw = raw.replace(/\\underline\{\s*\}/g, '\\rule[-0.2ex]{3.5em}{0.4pt}');
  raw = raw.replace(/_{3,}/g, '\\rule[-0.2ex]{3.5em}{0.4pt}');
  raw = raw.replace(/（\s*）/g, '（\\quad）');
  raw = raw.replace(/\(\s*\)/g, '(\\quad)');

  // 5. 占位保护公式块 ($$ 与 $) - 使用不含下划线、不含反斜杠的独立标记 §§MBX#0§§
  const mathBlocks: string[] = [];

  // 保护 display math: $$...$$ 与 \[...\]
  raw = raw.replace(/\$\$([\s\S]*?)\$\$/g, (_m, inner) => {
    mathBlocks.push(`\\[\n${cleanMathFormula(inner.trim())}\n\\]`);
    return `§§MBX#${mathBlocks.length - 1}§§`;
  });
  raw = raw.replace(/\\\[([\s\S]*?)\\\]/g, (_m, inner) => {
    mathBlocks.push(`\\[\n${cleanMathFormula(inner.trim())}\n\\]`);
    return `§§MBX#${mathBlocks.length - 1}§§`;
  });

  // 保护 inline math: \(...\)
  raw = raw.replace(/\\\(([\s\S]*?)\\\)/g, (_m, inner) => {
    mathBlocks.push(`$${cleanMathFormula(inner.trim())}$`);
    return `§§MBX#${mathBlocks.length - 1}§§`;
  });

  // 保护 inline math: $...$ (支持同段内多行公式，不跨段落)
  raw = raw.replace(/\$((?:[^\$\n]|\n(?!\s*\n))+?)\$/g, (_m, inner) => {
    mathBlocks.push(`$${cleanMathFormula(inner)}$`);
    return `§§MBX#${mathBlocks.length - 1}§§`;
  });

  // 6. 识别并包裹裸露公式与数学命令 (如 最大值为 2\sqrt{7} 或 a=2, b=-2，积分值为 \pi^2)
  raw = sanitizeBareMath(raw);

  // 7. 处理文本段 Markdown 加粗与斜体
  raw = raw.replace(/\*\*([^*]+)\*\*/g, '\\textbf{$1}');
  raw = raw.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1\\textit{$2}');

  // 带圈数字转换 (支持中西文排版标准)
  const circledMap: Record<string, string> = {
    '①': '\\textcircled{\\scriptsize 1}',
    '②': '\\textcircled{\\scriptsize 2}',
    '③': '\\textcircled{\\scriptsize 3}',
    '④': '\\textcircled{\\scriptsize 4}',
    '⑤': '\\textcircled{\\scriptsize 5}',
    '⑥': '\\textcircled{\\scriptsize 6}',
    '⑦': '\\textcircled{\\scriptsize 7}',
    '⑧': '\\textcircled{\\scriptsize 8}',
    '⑨': '\\textcircled{\\scriptsize 9}',
    '⑩': '\\textcircled{\\scriptsize 10}',
  };
  raw = raw.replace(/[①②③④⑤⑥⑦⑧⑨⑩]/g, (m) => circledMap[m] || m);

  // 7.1 转义文本中的保留字符 (此时公式与图片均已被保护在占位符内)
  raw = raw.replace(/(?<!\\)&/g, '\\&');
  raw = raw.replace(/(?<!\\)%/g, '\\%');

  // 8. 还原所有公式块与图片块
  raw = raw.replace(/§§MBX#(\d+)§§/g, (_m, idx) => mathBlocks[Number(idx)] || '');
  raw = raw.replace(/§§IMG#(\d+)§§/g, (_m, idx) => imgBlocks[Number(idx)] || '');

  return raw.trim();
}

/**
 * 精准测量中西文混排视觉渲染宽度 (中文字符/全角标点记为 2，半角字符记为 1)
 */
export function getVisualWidth(str: string): number {
  if (!str) return 0;
  const plain = str.replace(/\\[a-zA-Z]+/g, '').replace(/[{}\$]/g, '');
  let w = 0;
  for (let i = 0; i < plain.length; i++) {
    const code = plain.charCodeAt(i);
    if (
      (code >= 0x4e00 && code <= 0x9fa5) ||
      (code >= 0xff00 && code <= 0xffef) ||
      (code >= 0x3000 && code <= 0x303f)
    ) {
      w += 2;
    } else {
      w += 1;
    }
  }
  return w;
}

/**
 * 格式化选择题选项，生成 tasks 宏包标准语法
 */
function formatChoiceTasks(options: Array<{ key: string; text_raw?: string; text_html?: string }>): string {
  if (!options || options.length === 0) return '';

  const cleanedOptions = options.map((opt) => {
    let t = (opt.text_raw || opt.text_html || '').trim();
    // 去除选项前可能自带的 A. B. C. D. 避免重复编号
    t = t.replace(/^[A-Da-d][\.\、\s]\s*/, '');
    return formatLatexContent(t);
  });

  const maxVisualWidth = Math.max(...cleanedOptions.map((o) => getVisualWidth(o)));
  // 精准列数计算：长选项 (>=30) 排 1 列，中等 (>=10) 排 2 列，短选项 (<10) 排 4 列
  const cols = maxVisualWidth >= 30 ? 1 : maxVisualWidth >= 10 ? 2 : 4;

  let code = `\\begin{tasks}(${cols})\n`;
  cleanedOptions.forEach((optText) => {
    code += `  \\task ${optText}\n`;
  });
  code += `\\end{tasks}`;
  return code;
}

/**
 * 获取自然书写留白空间对应的 LaTeX 命令
 */
function getSpaceLatex(type: string, writingSpace: 'comfortable' | 'compact' | 'none'): string {
  if (writingSpace === 'none' || type === 'choice') return '';

  if (writingSpace === 'compact') {
    if (type === 'blank') return '\\vspace{0.8cm}\n';
    if (type === 'calc') return '\\vspace{3.5cm}\n';
    if (type === 'proof') return '\\vspace{5.0cm}\n';
    return '\\vspace{3.0cm}\n';
  }

  // comfortable
  if (type === 'blank') return '\\vspace{1.2cm}\n';
  if (type === 'calc') return '\\vspace{6.0cm}\n';
  if (type === 'proof') return '\\vspace{8.5cm}\n';
  return '\\vspace{4.5cm}\n';
}

/**
 * LaTeX 特殊字符转义（用于标题、课程名等纯文本元数据）
 */
function escapeLatexMeta(str: string): string {
  if (!str) return '';
  return str
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/([&%$#_{}])/g, '\\$1')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}');
}

/**
 * 主生成函数：根据题目列表与配置生成纯正 Jinwen-XU/homework 宏包标准的 LaTeX 源码
 */
export function generateLatexDocument(
  questions: SlimQuestionItem[],
  userConfig: Partial<LatexExportConfig> = {}
): string {
  const config: LatexExportConfig = { ...DEFAULT_LATEX_CONFIG, ...userConfig };

  // 题型分组统计
  const typeGroups: Record<string, SlimQuestionItem[]> = {
    choice: [],
    blank: [],
    calc: [],
    proof: [],
  };

  questions.forEach((q) => {
    const t = q.type || 'calc';
    if (!typeGroups[t]) typeGroups[t] = [];
    typeGroups[t].push(q);
  });

  const isExam = config.template === 'exam';
  const paperOption = config.paperSize === 'b5' ? 'b5paper' : 'a4paper';
  const fontPt = `${config.fontSize === 10.5 ? '10.5pt' : `${config.fontSize}pt`}`;

  // 构建 documentclass options (严格遵循 Jinwen-XU/homework 宏包规范)
  const classOptions: string[] = [
    paperOption,
    fontPt === '10.5pt' ? '11pt' : fontPt,
    'title in boldface',
    'theorem in new line',
  ];

  if (config.removeQed !== false) {
    classOptions.push('remove problem qed');
  }

  if (config.fontFamily === 'sans') {
    classOptions.push('title in sffamily');
  }

  if (config.answerPlacement === 'none') {
    classOptions.push('hide solution');
  }

  if (config.coloredSolution) {
    classOptions.push('colored solution');
  }

  // 学术排版与字体配置 (统一委托至 Academic Typography System 唯一入口)
  const typographyCode = renderFontPreamble(config, {
    includePackage: false,
    resolutionMode: config.resolutionMode || 'deterministic',
    userExplicit: userConfig,
  });

  // 页码设置
  let pageNumberCode = '';
  if (config.pageNumbering === 'simple') {
    pageNumberCode = `
% 极简纯净页码设置（单次编译即显示正确页码）
\\usepackage{fancyhdr}
\\pagestyle{fancy}
\\fancyhf{}
\\fancyfoot[C]{\\small\\normalfont 第 \\thepage\\ 页}
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\footrulewidth}{0pt}
`;
  } else if (config.pageNumbering === 'total') {
    pageNumberCode = `
% 完整总页数页码
\\usepackage{fancyhdr}
\\usepackage{lastpage}
\\pagestyle{fancy}
\\fancyhf{}
\\fancyfoot[C]{\\small\\normalfont 第 \\thepage\\ 页 / 共 \\pageref{LastPage} 页}
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\footrulewidth}{0pt}
`;
  } else if (config.pageNumbering === 'none') {
    pageNumberCode = `
% 纯净无页码
\\usepackage{fancyhdr}
\\pagestyle{empty}
`;
  }

  let code = `% =========================================================================
% Academic Mathematical Problem Sheet / Examination Paper
% Powered by Jinwen-XU/homework (CTAN / TeX Live / MiKTeX Standard Class)
% Clean, minimal, publication-grade academic layout (Zero SaaS UI clutter)
% =========================================================================

\\documentclass[
  ${classOptions.join(',\n  ')}
]{homework}

% 设置语言环境为中文 (支持中英文混排、经典定理与题型名称本地化)
\\UseLanguage{Chinese}

% 常用数学与排版增强宏包
\\usepackage{amsmath,amssymb,mathtools}
\\usepackage{tasks}      % 专业选择题多列对齐宏包
\\usepackage{booktabs}   % 经典学术三线表宏包
\\usepackage{array}
\\usepackage{longtable}  % 跨页表格宏包（避免题量较多时答案表截断或引发页面死循环）
\\usepackage{graphicx}   % 学术图示宏包
\\providecommand{\\boldsymbol}{\\symbf}

${typographyCode}${pageNumberCode}
% 选择题 tasks 标签格式设置为 A. B. C. D.
\\settasks{
  label = \Alph*.,
  label-width = 1.6em,
  label-format = {\sffamily\bfseries},
  item-indent = 2.2em,
  before-skip = 0.3em,
  after-skip = 0.5em
}
`;

  // -------------------------------------------------------------------------
  // 卷头与元数据 (Header & Metadata Control)
  // -------------------------------------------------------------------------
  if (config.headerMode === 'standard') {
    const titleSub = config.showSubtitle && config.subtitle && config.subtitle.trim()
      ? ` \\\\\n  \\large\\normalfont ${escapeLatexMeta(config.subtitle)}`
      : '';
    let authorCode = '\\author{}';
    if (config.showLicense && config.licenseText) {
      authorCode = `\\author{\\small\\normalfont 许可协议：${escapeLatexMeta(config.licenseText)}}`;
    } else if (config.author && config.author.trim()) {
      authorCode = `\\author{\\small\\normalfont ${escapeLatexMeta(config.author)}}`;
    }
    const dateCode = config.showDate ? `\\date{${config.date || '\\today'}}` : '\\date{}';

    code += `
% 文档元数据（标准学术卷头）
\\title{${escapeLatexMeta(config.title)}${titleSub}}
${authorCode}
${dateCode}

\\begin{document}

\\maketitle
`;
    if (isExam) {
      code += `
% 课程测试试卷说明
\\begin{center}
  \\small\\itshape 考试注意事项：请将解答与演算步骤书写在指定区域内，答案写在草稿纸上无效。
\\end{center}
\\vspace{0.5em}\\hrule\\vspace{1.2em}
`;
    }
  } else if (config.headerMode === 'compact') {
    const titleSub = config.showSubtitle && config.subtitle && config.subtitle.trim()
      ? ` \\\\\n  {\\small\\normalfont ${escapeLatexMeta(config.subtitle)}}`
      : '';
    const licenseLine = config.showLicense && config.licenseText
      ? ` \\\\\n  {\\footnotesize\\itshape 许可协议：${escapeLatexMeta(config.licenseText)}}`
      : '';

    code += `
\\begin{document}

% -------------------------------------------------------------------------
% 紧凑型单行卷头（节省打印空间）
% -------------------------------------------------------------------------
\\begin{center}
  {\\large\\sffamily\\bfseries ${escapeLatexMeta(config.title)}}${titleSub}${licenseLine}
\\end{center}
\\vspace{0.3em}\\hrule\\vspace{1.0em}
`;
  } else {
    // headerMode === 'none' (无卷头纯题面，最大化节约纸张)
    code += `
\\begin{document}
`;
  }

  // -------------------------------------------------------------------------
  // 题目正文列表渲染
  // -------------------------------------------------------------------------
  const sectionRoman = ['一', '二', '三', '四', '五', '六', '七', '八'];
  let currentSectionIdx = 0;

  const typeOrder: Array<{ type: 'choice' | 'blank' | 'calc' | 'proof'; label: string; desc: string }> = [
    { type: 'choice', label: '选择题', desc: '下列各题给出的四个选项中，只有一个选项符合题目要求。' },
    { type: 'blank', label: '填空题', desc: '把答案填在题中横线上。' },
    { type: 'calc', label: '计算解答题', desc: '解答应写出文字说明、演算步骤或推导过程。' },
    { type: 'proof', label: '证明题', desc: '解答应写出严谨完整的定理依据与推导证明过程。' },
  ];

  typeOrder.forEach(({ type, label, desc }) => {
    const list = typeGroups[type] || [];
    if (list.length === 0) return;

    const roman = sectionRoman[currentSectionIdx] || `${currentSectionIdx + 1}`;
    currentSectionIdx++;

    code += `% =========================================================================\n`;
    code += `% ${roman}、${label}\n`;
    code += `% =========================================================================\n`;
    code += `\\section*{${roman}、${label}（${desc}）}\n\n`;

    list.forEach((q) => {
      const stemLatex = formatLatexContent(q.stem_raw || q.stem_html || '');
      const spaceCmd = getSpaceLatex(q.type, config.writingSpace);

      code += `\\begin{problem}\n`;
      code += `  ${stemLatex}\n`;

      // 选择题选项排版 (tasks 宏包)
      if (q.type === 'choice' && q.options && q.options.length > 0) {
        code += `\n  ${formatChoiceTasks(q.options)}\n`;
      }

      // 如果是随题附答案模式 (inline solution)
      if (config.answerPlacement === 'inline') {
        const ans = formatLatexContent(q.answer || '');
        const steps = formatLatexContent(q.steps_html || q.hints_html || '');
        code += `\\end{problem}\n`;
        code += `\\begin{solution}\n`;
        if (ans && q.type !== 'proof') {
          code += `  \\textbf{【答案】} ${ans}\n\n`;
        }
        if (steps) {
          code += `  \\textbf{【解析】} ${steps}\n`;
        }
        code += `\\end{solution}\n\n`;
      } else {
        // 纯题干留白空间
        if (spaceCmd) {
          code += `\n  ${spaceCmd}`;
        }
        code += `\\end{problem}\n\n`;
      }
    });
  });

  // -------------------------------------------------------------------------
  // 参考答案与详细推导附录 (Appendix Mode)
  // -------------------------------------------------------------------------
  if (config.answerPlacement === 'appendix') {
    // 按照大题顺序组装题目列表，保证题号严格一一对应
    const orderedQuestions: SlimQuestionItem[] = [];
    typeOrder.forEach(({ type }) => {
      const list = typeGroups[type] || [];
      list.forEach((q) => orderedQuestions.push(q));
    });

    code += `% =========================================================================\n`;
    code += `% 参考答案与详细推导附录 (Solutions & Proofs Appendix)\n`;
    code += `% =========================================================================\n`;
    code += `\\clearpage\n`;
    code += `\\section*{参考答案与详细推导}\n\n`;

    // 1. 答案速查三线表 (longtable + booktabs，支持长题库自动分页)
    code += `\\subsection*{一、参考答案速查}\n\n`;
    code += `\\begin{longtable}{c p{5.5cm} c p{5.5cm}}\n`;
    code += `  \\toprule\n`;
    code += `  \\textbf{题号} & \\textbf{参考答案} & \\textbf{题号} & \\textbf{参考答案} \\\\\n`;
    code += `  \\midrule\n`;
    code += `  \\endhead\n`;
    code += `  \\bottomrule\n`;
    code += `  \\endfoot\n`;

    const getSummaryAnswerText = (ansRaw: string): string => {
      if (!ansRaw) return '略';
      const trimmed = ansRaw.trim();
      const visWidth = getVisualWidth(trimmed);
      if (
        trimmed.includes('\\begin{') ||
        trimmed.includes('\\end{') ||
        trimmed.includes('\n') ||
        visWidth > 16
      ) {
        if (!trimmed.includes('\\begin{') && !trimmed.includes('\n') && visWidth <= 16) {
          return formatLatexContent(trimmed);
        }
        return '见详细解析';
      }
      return formatLatexContent(trimmed);
    };

    const half = Math.ceil(orderedQuestions.length / 2);
    for (let i = 0; i < half; i++) {
      const q1 = orderedQuestions[i];
      const q1Ans = getSummaryAnswerText(q1.answer || '略');

      const q2 = orderedQuestions[i + half];
      const q2Ans = q2 ? getSummaryAnswerText(q2.answer || '略') : '';
      const q2Num = q2 ? `${i + half + 1}` : '';

      code += `  ${i + 1} & ${q1Ans || '见解析'} & ${q2Num} & ${q2Ans ? q2Ans : (q2 ? '见解析' : '')} \\\\\n`;
    }

    code += `\\end{longtable}\n\n`;

    // 2. 详细解答与证明过程 (按 Jinwen-XU/homework 的 solution 环境)
    code += `\\subsection*{二、详细推导与证明过程}\n\n`;

    let qIdx = 1;
    orderedQuestions.forEach((q) => {
      const num = qIdx++;
      if (q.type === 'choice' && !q.steps_html && !q.hints_html) return;

      const ansLatex = formatLatexContent(q.answer || '').trim();
      const stepsLatex = formatLatexContent(q.steps_html || q.hints_html || '').trim();
      const isProof = q.type === 'proof';

      code += `\\begin{solution}[第 ${num} 题解答]\n`;
      let bodyCode = '';
      if (ansLatex && !isProof) {
        bodyCode += `  \\textbf{【答案】} ${ansLatex}\n\n`;
      }
      if (stepsLatex) {
        bodyCode += `  \\textbf{${isProof ? '【证明】' : '【解析】'}} ${stepsLatex}\n`;
      } else if (isProof) {
        bodyCode += `  \\textbf{【证明】} ${ansLatex || '略。'}\n`;
      } else if (!ansLatex) {
        bodyCode += `  略。\n`;
      }
      if (!bodyCode.trim()) {
        bodyCode = `  略。\n`;
      }
      code += bodyCode;
      code += `\\end{solution}\n\n`;
    });
  }

  code += `\\end{document}\n`;

  return code;
}

// =========================================================================
// 章节级别学术教材 / 讲义 LaTeX 生成引擎 (Chapter LaTeX Renderer)
// 纯粹的 Publishing 表现层渲染器，接受 ChapterDocument 语义数据模型，输出纯正 ctexart / ctexbook
// =========================================================================

/**
 * 剥离章节与节标题前手工书写的冗余数字前缀（如 '1.1 集合及其运算' -> '集合及其运算'）
 * 遵循 Rule 13: 编号由 LaTeX 计数器负责，保持交叉引用与自动层级一致
 */
export function stripLeadingNumber(text: string): string {
  if (!text) return '';
  return text
    .replace(/^(?:第[0-9一二三四五六七八九十]+[章节讲部](?:分)?|[0-9]+(?:\.[0-9]+)*[章节讲]?)[、\.\s\-－:]+/, '')
    .replace(/^(\d+(?:\.\d+)*)\s+/, '')
    .trim() || text;
}

/**
 * 剥离定理/例题/定义等学术模块标题中的前缀与编号，仅保留名称
 * 例如 '定义 1.1 实数集的有界性' -> '实数集的有界性'，'例 1.1' -> ''
 * 由 tcolorbox 负责自动编号，避免 '定义 1.1 (定义 1.1 实数集的有界性)' 重复
 */
export function stripTheoremPrefix(text: string): string {
  if (!text) return '';
  return text
    .replace(/^(?:定理|定义|引理|推论|命题|公理|性质|准则|法则|例|例题|变式|方法|习题)\s*[0-9a-zA-Z\.\-－ⅠⅡⅢⅣⅤⅥ]*\s*/i, '')
    .trim();
}

/**
 * 将数学公式转换为纯文本/Unicode 文本（供 PDF 书签及超链接回退使用）
 */
export function mathToBookmarkText(math: string): string {
  if (!math) return '';
  let res = math.trim();

  // 1. 希腊字母映射
  const GREEK_MAP: Record<string, string> = {
    '\\alpha': 'α',
    '\\beta': 'β',
    '\\gamma': 'γ',
    '\\delta': 'δ',
    '\\epsilon': 'ε',
    '\\varepsilon': 'ε',
    '\\zeta': 'ζ',
    '\\eta': 'η',
    '\\theta': 'θ',
    '\\vartheta': 'θ',
    '\\iota': 'ι',
    '\\kappa': 'κ',
    '\\lambda': 'λ',
    '\\mu': 'μ',
    '\\nu': 'ν',
    '\\xi': 'ξ',
    '\\pi': 'π',
    '\\rho': 'ρ',
    '\\varrho': 'ρ',
    '\\sigma': 'σ',
    '\\varsigma': 'σ',
    '\\tau': 'τ',
    '\\upsilon': 'υ',
    '\\phi': 'φ',
    '\\varphi': 'φ',
    '\\chi': 'χ',
    '\\psi': 'ψ',
    '\\omega': 'ω',
    '\\Gamma': 'Γ',
    '\\Delta': 'Δ',
    '\\Theta': 'Θ',
    '\\Lambda': 'Λ',
    '\\Xi': 'Ξ',
    '\\Pi': 'Π',
    '\\Sigma': 'Σ',
    '\\Upsilon': 'Υ',
    '\\Phi': 'Φ',
    '\\Psi': 'Ψ',
    '\\Omega': 'Ω',
  };

  for (const [cmd, sym] of Object.entries(GREEK_MAP)) {
    res = res.replace(new RegExp(cmd.replace('\\', '\\\\') + '(?![a-zA-Z])', 'g'), sym);
  }

  // 2. 常见数学符号与算符
  res = res.replace(/\\(le|leqslant)(?![a-zA-Z])/g, '≤');
  res = res.replace(/\\(ge|geqslant)(?![a-zA-Z])/g, '≥');
  res = res.replace(/\\(ne|neq)(?![a-zA-Z])/g, '≠');
  res = res.replace(/\\approx(?![a-zA-Z])/g, '≈');
  res = res.replace(/\\sim(?![a-zA-Z])/g, '∼');
  res = res.replace(/\\times(?![a-zA-Z])/g, '×');
  res = res.replace(/\\div(?![a-zA-Z])/g, '÷');
  res = res.replace(/\\pm(?![a-zA-Z])/g, '±');
  res = res.replace(/\\mp(?![a-zA-Z])/g, '∓');
  res = res.replace(/\\infty(?![a-zA-Z])/g, '∞');
  res = res.replace(/\\in(?![a-zA-Z])/g, '∈');
  res = res.replace(/\\notin(?![a-zA-Z])/g, '∉');
  res = res.replace(/\\(cdots|ldots)(?![a-zA-Z])/g, '…');
  res = res.replace(/\\cdot(?![a-zA-Z])/g, '·');

  // 3. 上标
  const supMap: Record<string, string> = {
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
    '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
    'n': 'ⁿ', 'k': 'ᵏ', 'i': 'ⁱ', '+': '⁺', '-': '⁻'
  };
  res = res.replace(/\^\{?([0-9nkipm\+\-])\}?/g, (_m, char) => supMap[char] || char);
  res = res.replace(/\^\{\\circ\}|\^\\circ/g, '°');

  // 4. 下标
  const subMap: Record<string, string> = {
    '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
    '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
    'i': 'ᵢ', 'j': 'ⱼ', 'k': 'ₖ', 'n': 'ₙ', 'm': 'ₘ', 'p': 'ₚ'
  };
  res = res.replace(/_\{?([0-9ijknmp])\}?/g, (_m, char) => subMap[char] || char);

  // 5. 格式宏与括号剥离
  res = res.replace(/\\(mathbf|mathrm|mathit|mathcal|mathbb|bm|boldsymbol)\s*\{([^}]*)\}/g, '$2');
  res = res.replace(/\\(left|right|big|Big|bigg|Bigg)[()\[\]|.\\]/g, '');
  res = res.replace(/[{}\\]/g, '');

  return res.trim();
}

/**
 * 格式化章节标题：使用 \texorpdfstring 保护公式，杜绝 hyperref 书签展开崩溃
 */
export function formatHeadingLatex(title: string): string {
  if (!title) return '';
  let raw = decodeHtmlEntities(title);
  raw = normalizeUnicodeMath(raw);
  raw = balanceDollars(raw);

  const texorPlaceholders: string[] = [];

  // 匹配 $...$
  raw = raw.replace(/\$((?:[^\$\n]|\n(?!\s*\n))+?)\$/g, (_m, math) => {
    const cleanMath = cleanMathFormula(math.trim());
    const bookmark = mathToBookmarkText(math);
    texorPlaceholders.push(`\\texorpdfstring{$${cleanMath}$}{${bookmark}}`);
    return `§§TOPDF_${texorPlaceholders.length - 1}§§`;
  });

  // 匹配 \( ... \)
  raw = raw.replace(/\\\(([\s\S]*?)\\\)/g, (_m, math) => {
    const cleanMath = cleanMathFormula(math.trim());
    const bookmark = mathToBookmarkText(math);
    texorPlaceholders.push(`\\texorpdfstring{$${cleanMath}$}{${bookmark}}`);
    return `§§TOPDF_${texorPlaceholders.length - 1}§§`;
  });

  // 转义文本中的特殊字符
  raw = raw.replace(/(?<!\\)&/g, '\\&');
  raw = raw.replace(/(?<!\\)%/g, '\\%');
  raw = raw.replace(/(?<!\\)#/g, '\\#');

  // 还原占位符
  raw = raw.replace(/§§TOPDF_(\d+)§§/g, (_m, idx) => texorPlaceholders[Number(idx)] || '');
  return raw.trim();
}

/**
 * 渲染单个表格节点为 booktabs 标准学术三线表
 * @param tableData 表格数据模型
 * @param inBox 是否处于 tcolorbox (定理/定义/例题等) 容器内部。内部严禁使用浮动体 \\begin{table}
 */
export function renderLatexTable(tableData: SemanticTableData, inBox = false): string {
  if (!tableData || !tableData.headers || tableData.headers.length === 0) return '';
  const colCount = Math.max(
    tableData.headers.length,
    ...(tableData.rows || []).map((r) => r.length)
  );

  const colAligns = (tableData.aligns || []).map((a) => {
    if (a === 'left') return 'l';
    if (a === 'right') return 'r';
    return 'c';
  });
  while (colAligns.length < colCount) {
    colAligns.push('c');
  }

  const tableBody = [
    `    \\toprule`,
    `    ${tableData.headers.map((h) => formatLatexContent(h)).join(' & ')} \\\\`,
    `    \\midrule`,
    ...(tableData.rows || []).map((row) => {
      const paddedRow = [...row];
      while (paddedRow.length < colCount) paddedRow.push('');
      return `    ${paddedRow.map((c) => formatLatexContent(c)).join(' & ')} \\\\`;
    }),
    `    \\bottomrule`,
  ].join('\n');

  const tabularCode = `\\begin{tabular}{${colAligns.join(' ')}}\n${tableBody}\n  \\end{tabular}`;
  // 使用 adjustbox 约束宽度不超过版心，杜绝超宽表格撑破右边距
  const wrappedTabular = `\\begin{adjustbox}{max width=\\linewidth}\n  ${tabularCode}\n  \\end{adjustbox}`;

  let captionCode = '';
  if (tableData.caption && tableData.caption.trim()) {
    captionCode = formatLatexContent(tableData.caption.trim());
  }

  if (inBox) {
    // 处于 tcolorbox (定理/例题/定义等) 容器内部时，使用居中非浮动环境，杜绝 "Not in outer par mode"
    let code = `\\begin{center}\n  \\small\n`;
    if (captionCode) {
      code += `  {\\small\\kaishu ${captionCode}}\\par\\vspace{0.4em}\n`;
    }
    code += `  ${wrappedTabular}\n\\end{center}\n\n`;
    return code;
  }

  // 处于正文顶层时，使用标准的浮动体 table 环境与三线表
  let code = `\\begin{table}[htbp]\n  \\centering\n  \\small\n`;
  if (captionCode) {
    code += `  \\caption{${captionCode}}\n`;
  }
  code += `  ${wrappedTabular}\n\\end{table}\n\n`;
  return code;
}

/**
 * 渲染单个列表节点
 */
function renderLatexList(listData: SemanticListData, config: ChapterLatexConfig, inBox = false): string {
  if (!listData || !listData.items) return '';
  const env = listData.ordered ? 'enumerate' : 'itemize';
  let code = `\\begin{${env}}\n`;

  for (const itemBlocks of listData.items) {
    const itemContent = renderSemanticBlocks(itemBlocks, config, inBox).trim();
    code += `  \\item ${itemContent}\n`;
  }

  code += `\\end{${env}}\n\n`;
  return code;
}

/**
 * 渲染插图与图题节点 (遵循 ImageSizingPolicy 约束，基于 adjustbox 防止大图/竖图撑爆版面)
 */
export function renderLatexFigure(
  figureData: SemanticFigureData,
  policy: ImageSizingPolicy = DEFAULT_IMAGE_POLICY
): string {
  if (!figureData || !figureData.url) return '';
  const cleanUrl = figureData.url.replace(/^(\.\/)?images\//, 'assets/');
  const escapedAlt = escapeLatexMeta(figureData.caption || figureData.alt || cleanUrl);

  const mw = policy.maxWidthRatio ?? 0.65;
  const mh = policy.maxHeightRatio ?? 0.30;
  const keepAspect = policy.keepAspectRatio !== false ? ',keepaspectratio' : '';
  const imgOptions = `max width=${mw}\\linewidth,max height=${mh}\\textheight${keepAspect}`;

  let code = `\\begin{center}\n`;
  code += `  \\IfFileExists{${cleanUrl}}{\\includegraphics[${imgOptions}]{${cleanUrl}}}{\\IfFileExists{${figureData.url}}{\\includegraphics[${imgOptions}]{${figureData.url}}}{\\fbox{\\small\\itshape [图示] ${escapedAlt}}}}\n`;

  if (figureData.caption && figureData.caption.trim()) {
    const captionFont = policy.captionStyle === 'kaishu' ? '\\kaishu' : '\\normalfont';
    code += `  \\par\\vspace{0.4em}{\\small${captionFont} ${formatLatexContent(figureData.caption.trim())}}\n`;
  }

  code += `\\end{center}\n\n`;
  return code;
}

/**
 * 递归渲染语义块列表 (SemanticBlock[]) 为纯正 LaTeX 语法
 */
export function renderSemanticBlocks(
  blocks: SemanticBlock[],
  config: ChapterLatexConfig,
  inBox = false
): string {
  if (!blocks || blocks.length === 0) return '';
  let code = '';

  for (const block of blocks) {
    if (!block) continue;

    switch (block.kind) {
      case 'heading': {
        const level = block.level || 2;
        const cleanTitle = formatHeadingLatex(stripLeadingNumber(block.title || block.content || ''));
        if (level === 1) {
          if (config.documentclass === 'ctexbook') {
            code += `\\chapter{${cleanTitle}}\n\n`;
          } else {
            code += `\\section{${cleanTitle}}\n\n`;
          }
        } else if (level === 2) {
          code += `\\section{${cleanTitle}}\n\n`;
        } else if (level === 3) {
          code += `\\subsection{${cleanTitle}}\n\n`;
        } else {
          code += `\\subsubsection{${cleanTitle}}\n\n`;
        }
        break;
      }

      case 'paragraph': {
        const p = formatLatexContent(block.content || '').trim();
        if (p) {
          code += `${p}\n\n`;
        }
        break;
      }

      case 'math': {
        if (block.content) {
          code += `\\[\n${cleanMathFormula(block.content.trim())}\n\\]\n\n`;
        }
        break;
      }

      case 'figure': {
        if (block.figureData) {
          code += renderLatexFigure(block.figureData, config.imagePolicy);
        }
        break;
      }

      case 'table': {
        if (block.tableData) {
          code += renderLatexTable(block.tableData, inBox);
        }
        break;
      }

      case 'list': {
        if (block.listData) {
          code += renderLatexList(block.listData, config, inBox);
        }
        break;
      }

      case 'quote': {
        code += `\\begin{quote}\n${renderSemanticBlocks(block.children || [], config, inBox).trim()}\n\\end{quote}\n\n`;
        break;
      }

      case 'code': {
        code += `\\begin{verbatim}\n${block.content || ''}\n\\end{verbatim}\n\n`;
        break;
      }

      // 核心定理族 (tcolorbox 自动编号定理环境)
      case 'definition':
      case 'theorem':
      case 'lemma':
      case 'corollary':
      case 'proposition':
      case 'axiom':
      case 'property':
      case 'criterion':
      case 'academicblock':
      case 'example':
      case 'variant':
      case 'method': {
        const titleArg = block.title ? formatLatexContent(stripTheoremPrefix(block.title)) : '';
        const labelArg = block.label || (block.number ? `${block.kind}:${block.number.replace(/\./g, '-')}` : '');
        code += `\\begin{${block.kind}}{${titleArg}}{${labelArg}}\n`;
        const inner = renderSemanticBlocks(block.children || [], config, true).trim();
        if (inner) {
          code += `${inner}\n`;
        }
        code += `\\end{${block.kind}}\n\n`;
        break;
      }

      case 'proof': {
        code += `\\begin{proof}\n`;
        const inner = renderSemanticBlocks(block.children || [], config, true).trim();
        if (inner) {
          code += `${inner}\n`;
        }
        code += `\\end{proof}\n\n`;
        break;
      }

      case 'solution': {
        const title = block.title ? formatLatexContent(block.title) : '解';
        code += `\\begin{solution}[${title}]\n`;
        const inner = renderSemanticBlocks(block.children || [], config, true).trim();
        if (inner) {
          code += `${inner}\n`;
        }
        code += `\\end{solution}\n\n`;
        break;
      }

      case 'remark': {
        const title = block.title ? formatLatexContent(block.title) : '注记';
        code += `\\begin{remark}[${title}]\n`;
        const inner = renderSemanticBlocks(block.children || [], config, true).trim();
        if (inner) {
          code += `${inner}\n`;
        }
        code += `\\end{remark}\n\n`;
        break;
      }

      case 'analysis': {
        const title = block.title ? formatLatexContent(block.title) : '思路分析';
        code += `\\begin{analysis}[${title}]\n`;
        const inner = renderSemanticBlocks(block.children || [], config, true).trim();
        if (inner) {
          code += `${inner}\n`;
        }
        code += `\\end{analysis}\n\n`;
        break;
      }

      case 'guide': {
        const title = block.title ? formatLatexContent(block.title) : '本节导读';
        code += `\\begin{guide}[${title}]\n`;
        const inner = renderSemanticBlocks(block.children || [], config, true).trim();
        if (inner) {
          code += `${inner}\n`;
        }
        code += `\\end{guide}\n\n`;
        break;
      }

      case 'summary': {
        const title = block.title ? formatLatexContent(block.title) : '本节总结';
        code += `\\begin{summary}[${title}]\n`;
        const inner = renderSemanticBlocks(block.children || [], config, true).trim();
        if (inner) {
          code += `${inner}\n`;
        }
        code += `\\end{summary}\n\n`;
        break;
      }

      case 'exercise': {
        const title = block.title ? formatLatexContent(block.title) : '课后习题';
        code += `\\begin{exercise}[${title}]\n`;
        const inner = renderSemanticBlocks(block.children || [], config, true).trim();
        if (inner) {
          code += `${inner}\n`;
        }
        code += `\\end{exercise}\n\n`;
        break;
      }

      case 'digital_resource':
      case 'qrcode': {
        const res = block.resourceData;
        const categoryLabel = res?.categoryLabel || (block.title?.includes('微课') ? '微课视频' : '配套数字资源');
        const title = res?.title || block.title || '数字资源';
        const url = res?.url || block.content || '';
        code += `\\astrolibdigitalresource[${escapeLatexMeta(categoryLabel)}]{${escapeLatexMeta(title)}}{${url ? url.trim() : ''}}\n\n`;
        break;
      }

      case 'footnote': {
        const text = block.content ? formatLatexContent(block.content) : '';
        if (text) {
          code += `\\footnote{${text}}\n`;
        }
        break;
      }

      default:
        if (block.children) {
          code += renderSemanticBlocks(block.children, config, inBox);
        }
    }
  }

  return code;
}

/**
 * 核心导出函数：将 ChapterDocument 语义领域模型渲染为完整可编译的 LaTeX 源码
 * 遵循极简学术规范：单章输出默认基于 ctexart，取消封面大标题页，第 1 页直接以学术紧凑卷头展开正文
 */
export function renderChapterLatexDocument(
  chapter: ChapterDocument,
  userConfig: Partial<ChapterLatexConfig & { embedStyle?: boolean }> = {}
): string {
  const config = { ...DEFAULT_CHAPTER_EXPORT_SETTINGS, ...userConfig };
  const isBook = config.documentclass === 'ctexbook';
  const paperOption = config.paperSize === 'b5' ? 'b5paper' : 'a4paper';
  const fontPt = config.fontSize === 10.5 ? '10.5pt' : `${config.fontSize}pt`;

  // 学术排版与字体配置 (统一委托至 Academic Typography System 唯一入口)
  const typographyCode = renderFontPreamble(config, {
    includePackage: true,
    resolutionMode: config.resolutionMode || 'deterministic',
    userExplicit: userConfig,
  });

  // 样式引入模式：使用独立宏包 vs 内嵌宏包代码（独立单文件开箱即用）
  let styleCode = '\\usepackage{astrolib-chapter}\n';
  if (config.embedStyle && config.styleSource) {
    styleCode = `\n% ================= 内联 AstroLib 学术教材排版样式 =================\n${config.styleSource}\n% ==================================================================\n`;
  }

  // 章节层级元数据权威注入 (来自 Core / Catalog 层的 ChapterCanonicalMetadata)
  const meta = chapter.metadata;
  let chapterPrefix = meta?.numberingPrefix;
  if (!chapterPrefix && meta?.chapterNumber != null) {
    chapterPrefix = `${meta.chapterNumber}.`;
  }
  if (!chapterPrefix) {
    const m = (chapter.title || '').match(/^(\d+)\./);
    chapterPrefix = m ? `${m[1]}.` : '';
  }

  let classOptionsStr = `${paperOption}, ${fontPt === '10.5pt' ? '11pt' : fontPt}, UTF8, punct=kaiming`;
  if (isBook) {
    classOptionsStr += `, openany, oneside`;
  }

  let code = `% =========================================================================
% AstroLib Academic Textbook / Lecture Notes Chapter
% Clean, minimal, publication-grade academic layout (${config.documentclass || 'ctexart'} + tcolorbox + amsthm)
% Generated by AstroLib Headless Publishing System
% =========================================================================

\\documentclass[
  ${classOptionsStr}
]{${config.documentclass || 'ctexart'}}

${styleCode}
% 图形查找路径配置（优先 assets/，兼容 images/ 与当前目录）
\\graphicspath{{assets/}{images/}{./}}

${typographyCode}
`;

  // 卷头与元数据排版 (Page 1 Restrained Academic Header - No Standalone Cover Page)
  const bookTitle = meta?.bookTitle || chapter.bookTitle || '';
  const chapterTitle = meta?.chapterTitle || '';
  const fullTitle = meta?.fullTitle || chapter.title || config.title || '';
  const authorName = meta?.bookAuthor || chapter.author || config.author || '';

  // 动态对齐教材大章编号与计数器（节号与定理编号）及页眉书名
  let counterCode = '';
  if (!isBook && chapterPrefix) {
    counterCode = `% 动态对齐教材大章编号与节计数器\n\\renewcommand{\\astrolibchapternum}{${chapterPrefix}}\n\\renewcommand{\\thesection}{\\astrolibchapternum\\arabic{section}}\n`;
  }
  if (bookTitle) {
    counterCode += `% 页眉右上角书名绑定 (纯粹学术，无品牌杂讯)\n\\renewcommand{\\astrolibbooktitle}{${escapeLatexMeta(bookTitle)}}\n`;
  }

  if (config.headerMode === 'standard') {
    code += `\\begin{document}
${counterCode}
% =========================================================================
% 学术讲义/单章卷头 (Page 1 Restrained Academic Header - No Cover Page)
% =========================================================================
\\begin{center}
${bookTitle || chapterTitle ? `  {\\zihao{4}\\kaishu ${escapeLatexMeta([bookTitle, chapterTitle].filter(Boolean).join('　'))}}\\par\\vspace{0.5em}\n` : ''}  {\\zihao{2}\\sffamily\\bfseries ${escapeLatexMeta(fullTitle)}}\\par\\vspace{0.6em}
${authorName ? `  {\\small\\normalfont ${escapeLatexMeta(authorName)}}\\par\\vspace{0.6em}\n` : ''}\\end{center}
\\vspace{-0.2em}\\hrule height 0.6pt\\vspace{1.5em}
`;
  } else if (config.headerMode === 'compact') {
    code += `\\begin{document}
${counterCode}
\\begin{center}
  {\\zihao{3}\\sffamily\\bfseries ${escapeLatexMeta(fullTitle)}}\\par\\vspace{0.3em}
${bookTitle ? `  {\\small\\kaishu ${escapeLatexMeta(bookTitle)}}\\par\\vspace{0.3em}\n` : ''}\\end{center}
\\vspace{-0.3em}\\hrule height 0.4pt\\vspace{1.0em}
`;
  } else {
    code += `\\begin{document}\n${counterCode}`;
  }

  if (config.showToc) {
    code += `\\tableofcontents\\vspace{1.5em}\\hrule\\vspace{1.5em}\n`;
  }

  // 若为 ctexbook 且首个节点非 level:1 heading，则显式输出章标题
  const hasH1 = (chapter.blocks || []).some((b) => b.kind === 'heading' && b.level === 1);
  if (isBook && !hasH1) {
    code += `\\chapter{${formatHeadingLatex(stripLeadingNumber(chapter.title))}}\n\n`;
  }

  // 渲染正文块
  code += renderSemanticBlocks(chapter.blocks || [], config);

  code += `\\end{document}\n`;
  return code;
}
