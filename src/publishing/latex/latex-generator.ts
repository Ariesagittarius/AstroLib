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

function cleanMathFormula(inner: string): string {
  let res = inner;

  res = res.replace(/\\left\\\{\s*\\begin\{aligned\}([\s\S]*?)\\end\{aligned\}\s*(?:\\right\.?)?/g, (_m, body) => {
    const cleanedRows = body
      .split('\\\\')
      .map((row: string) => row.trim().replace(/^&\s*/, ''))
      .join(' \\\\\n  ');
    return `\\begin{cases}\n  ${cleanedRows}\n\\end{cases}`;
  });

  res = res.replace(/([^\\])\\\s+([0-9a-zA-Z\$\\]+,\s*&)/g, '$1 \\\\ $2');

  res = res.replace(/\\\\\s*\[/g, '\\\\ \\relax [');

  res = res.replace(/\\(cup|cap|pm|mp|div|wedge|vee|sim|times)([a-zA-Z])/g, '\\$1 $2');

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

  res = res.replace(/\\underline\{\s*(\\quad)*\s*\}/g, '\\rule[-0.2ex]{3.5em}{0.4pt}');
  res = res.replace(/_{3,}/g, '\\rule[-0.2ex]{3.5em}{0.4pt}');

  res = res.replace(/(\\begin\{aligned\}[\s\S]*?)\s*\\tag(\*?\{[^}]+\})([\s\S]*?\\end\{aligned\})/g, '$1$3 \\tag$2');

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

export function normalizeUnicodeMath(text: string): string {
  if (!text) return '';
  let res = text.replace(/\r\n/g, '\n').replace(/\r/g, '');
  res = res.replace(/\\n(?![a-zA-Z])/g, '\n');
  res = res.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '');

  res = res.replace(/[\uD835][\uDC4E-\uDC67]/g, (match) => {
    const code = match.codePointAt(0) || 0;
    return String.fromCharCode(code - 0x1d44e + 0x61);
  });

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

export function sanitizeBareMath(text: string): string {
  if (!text) return text;

  const mbxPlaceholders: string[] = [];
  let s = text.replace(/§§[A-Z0-9_#]+§§/g, (m) => {
    mbxPlaceholders.push(m);
    return `§§P${mbxPlaceholders.length - 1}P§§`;
  });

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

  s = s.replace(/§§P(\d+)P§§/g, (_m, idx) => mbxPlaceholders[Number(idx)] || '');
  return s;
}

export function formatLatexContent(text: string): string {
  if (!text) return '';

  let raw = decodeHtmlEntities(text);
  raw = normalizeUnicodeMath(raw);
  raw = balanceDollars(raw);

  raw = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  raw = raw.replace(/\\n(?![a-zA-Z])/g, '\n');

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

  const imgBlocks: string[] = [];
  raw = raw.replace(/!\[(.*?)\]\((.*?)\)/g, (_m, alt, url) => {
    const cleanUrl = url.trim();
    const cleanAlt = alt ? alt.trim() : '';
    const escapedAlt = (cleanAlt || cleanUrl).replace(/([_&%$#])/g, '\\$1');
    let captionLatex = '';
    if (cleanAlt && (/^图\s*[\d\.\-－]/i.test(cleanAlt) || cleanAlt.length > 3)) {
      captionLatex = `  \\par\\vspace{0.4em}{\\small\\kaishu ${cleanAlt}}\n`;
    }
    imgBlocks.push(
      `\n\\begin{center}\n  \\IfFileExists{../public${cleanUrl}}{\\includegraphics[width=0.48\\linewidth,keepaspectratio]{../public${cleanUrl}}}{\\IfFileExists{public${cleanUrl}}{\\includegraphics[width=0.48\\linewidth,keepaspectratio]{public${cleanUrl}}}{\\fbox{\\small\\itshape [图示] ${escapedAlt}}}}\n${captionLatex}\\end{center}\n`
    );
    return `§§IMG${imgBlocks.length - 1}XGMI§§`;
  });

  raw = raw.replace(/\\underline\{\s*(\\quad)*\s*\}/g, '\\rule[-0.2ex]{3.5em}{0.4pt}');
  raw = raw.replace(/\\underline\{\s*\}/g, '\\rule[-0.2ex]{3.5em}{0.4pt}');
  raw = raw.replace(/_{3,}/g, '\\rule[-0.2ex]{3.5em}{0.4pt}');
  raw = raw.replace(/（\s*）/g, '（\\quad）');
  raw = raw.replace(/\(\s*\)/g, '(\\quad)');

  const mathBlocks: string[] = [];

  raw = raw.replace(/\$\$([\s\S]*?)\$\$/g, (_m, inner) => {
    mathBlocks.push(`\\[\n${cleanMathFormula(inner.trim())}\n\\]`);
    return `§§MBX${mathBlocks.length - 1}XMBX§§`;
  });
  raw = raw.replace(/\\\[([\s\S]*?)\\\]/g, (_m, inner) => {
    mathBlocks.push(`\\[\n${cleanMathFormula(inner.trim())}\n\\]`);
    return `§§MBX${mathBlocks.length - 1}XMBX§§`;
  });

  raw = raw.replace(/\\\(([\s\S]*?)\\\)/g, (_m, inner) => {
    mathBlocks.push(`$${cleanMathFormula(inner.trim())}$`);
    return `§§MBX${mathBlocks.length - 1}XMBX§§`;
  });

  raw = raw.replace(/\$((?:[^\$\n]|\n(?!\s*\n))+?)\$/g, (_m, inner) => {
    mathBlocks.push(`$${cleanMathFormula(inner)}$`);
    return `§§MBX${mathBlocks.length - 1}XMBX§§`;
  });

  raw = sanitizeBareMath(raw);

  raw = raw.replace(/\*\*([^*]+)\*\*/g, '\\textbf{$1}');
  raw = raw.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1\\textit{$2}');

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

  raw = raw.replace(/(?<!\\)&/g, '\\&');
  raw = raw.replace(/(?<!\\)%/g, '\\%');
  raw = raw.replace(/(?<!\\)#/g, '\\#');

  raw = raw.replace(/\\tag\*?\{([^}]+)\}/g, '\\hfill ($1)');
  raw = raw.replace(/\\tag\*?\s*([0-9a-zA-Z\.\-]+)/g, '\\hfill ($1)');

  raw = raw.replace(/§§MBX(\d+)XMBX§§/g, (_m, idx) => mathBlocks[Number(idx)] || '');
  raw = raw.replace(/§§IMG(\d+)XGMI§§/g, (_m, idx) => imgBlocks[Number(idx)] || '');

  return raw.trim();
}

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

function formatChoiceTasks(options: Array<{ key: string; text_raw?: string; text_html?: string }>): string {
  if (!options || options.length === 0) return '';

  const cleanedOptions = options.map((opt) => {
    let t = (opt.text_raw || opt.text_html || '').trim();

    t = t.replace(/^[A-Da-d][\.\、\s]\s*/, '');
    return formatLatexContent(t);
  });

  const maxVisualWidth = Math.max(...cleanedOptions.map((o) => getVisualWidth(o)));

  const cols = maxVisualWidth >= 30 ? 1 : maxVisualWidth >= 10 ? 2 : 4;

  let code = `\\begin{tasks}(${cols})\n`;
  cleanedOptions.forEach((optText) => {
    code += `  \\task ${optText}\n`;
  });
  code += `\\end{tasks}`;
  return code;
}

function getSpaceLatex(type: string, writingSpace: 'comfortable' | 'compact' | 'none'): string {
  if (writingSpace === 'none' || type === 'choice') return '';

  if (writingSpace === 'compact') {
    if (type === 'blank') return '\\vspace{0.8cm}\n';
    if (type === 'calc') return '\\vspace{3.5cm}\n';
    if (type === 'proof') return '\\vspace{5.0cm}\n';
    return '\\vspace{3.0cm}\n';
  }

  if (type === 'blank') return '\\vspace{1.2cm}\n';
  if (type === 'calc') return '\\vspace{6.0cm}\n';
  if (type === 'proof') return '\\vspace{8.5cm}\n';
  return '\\vspace{4.5cm}\n';
}

function escapeLatexMeta(str: string): string {
  if (!str) return '';
  return str
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/([&%$#_{}])/g, '\\$1')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}');
}

export function generateLatexDocument(
  questions: SlimQuestionItem[],
  userConfig: Partial<LatexExportConfig> = {}
): string {
  const config: LatexExportConfig = { ...DEFAULT_LATEX_CONFIG, ...userConfig };

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

  const typographyCode = renderFontPreamble(config, {
    includePackage: false,
    resolutionMode: config.resolutionMode || 'deterministic',
    userExplicit: userConfig,
  });

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

    code += `
\\begin{document}
`;
  }

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

      if (q.type === 'choice' && q.options && q.options.length > 0) {
        code += `\n  ${formatChoiceTasks(q.options)}\n`;
      }

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

        if (spaceCmd) {
          code += `\n  ${spaceCmd}`;
        }
        code += `\\end{problem}\n\n`;
      }
    });
  });

  if (config.answerPlacement === 'appendix') {

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

export function stripLeadingNumber(text: string): string {
  if (!text) return '';
  return text
    .replace(/^(?:第[0-9一二三四五六七八九十]+[章节讲部](?:分)?|[0-9]+(?:\.[0-9]+)*[章节讲]?)[、\.\s\-－:]+/, '')
    .replace(/^(\d+(?:\.\d+)*)\s+/, '')
    .trim() || text;
}

export function stripTheoremPrefix(text: string): string {
  if (!text) return '';
  return text
    .replace(/^(?:定理|定义|引理|推论|命题|公理|性质|准则|法则|例|例题|变式|方法|习题)\s*[0-9a-zA-Z\.\-－ⅠⅡⅢⅣⅤⅥ]*\s*/i, '')
    .trim();
}

export function mathToBookmarkText(math: string): string {
  if (!math) return '';
  let res = math.trim();

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

  const supMap: Record<string, string> = {
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
    '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
    'n': 'ⁿ', 'k': 'ᵏ', 'i': 'ⁱ', '+': '⁺', '-': '⁻'
  };
  res = res.replace(/\^\{?([0-9nkipm\+\-])\}?/g, (_m, char) => supMap[char] || char);
  res = res.replace(/\^\{\\circ\}|\^\\circ/g, '°');

  const subMap: Record<string, string> = {
    '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
    '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
    'i': 'ᵢ', 'j': 'ⱼ', 'k': 'ₖ', 'n': 'ₙ', 'm': 'ₘ', 'p': 'ₚ'
  };
  res = res.replace(/_\{?([0-9ijknmp])\}?/g, (_m, char) => subMap[char] || char);

  res = res.replace(/\\(mathbf|mathrm|mathit|mathcal|mathbb|bm|boldsymbol)\s*\{([^}]*)\}/g, '$2');
  res = res.replace(/\\(left|right|big|Big|bigg|Bigg)[()\[\]|.\\]/g, '');
  res = res.replace(/[{}\\]/g, '');

  return res.trim();
}

export function formatHeadingLatex(title: string): string {
  if (!title) return '';
  let raw = decodeHtmlEntities(title);
  raw = normalizeUnicodeMath(raw);
  raw = balanceDollars(raw);

  const texorPlaceholders: string[] = [];

  raw = raw.replace(/\$((?:[^\$\n]|\n(?!\s*\n))+?)\$/g, (_m, math) => {
    const cleanMath = cleanMathFormula(math.trim());
    const bookmark = mathToBookmarkText(math);
    texorPlaceholders.push(`\\texorpdfstring{$${cleanMath}$}{${bookmark}}`);
    return `§§TOPDF_${texorPlaceholders.length - 1}§§`;
  });

  raw = raw.replace(/\\\(([\s\S]*?)\\\)/g, (_m, math) => {
    const cleanMath = cleanMathFormula(math.trim());
    const bookmark = mathToBookmarkText(math);
    texorPlaceholders.push(`\\texorpdfstring{$${cleanMath}$}{${bookmark}}`);
    return `§§TOPDF_${texorPlaceholders.length - 1}§§`;
  });

  raw = raw.replace(/(?<!\\)&/g, '\\&');
  raw = raw.replace(/(?<!\\)%/g, '\\%');
  raw = raw.replace(/(?<!\\)#/g, '\\#');

  raw = raw.replace(/§§TOPDF_(\d+)§§/g, (_m, idx) => texorPlaceholders[Number(idx)] || '');
  return raw.trim();
}

export function renderLatexTable(tableData: SemanticTableData, inBox = false): string {
  if (!tableData) return '';
  const headers = tableData.headers || [];
  const rows = tableData.rows || [];
  if (headers.length === 0 && rows.length === 0) return '';

  const hasHeaderRow = headers.length > 0 && headers.some((h) => h.trim().length > 0);
  const colCount = Math.max(
    headers.length,
    ...rows.map((r) => r.length),
    1
  );

  const colAligns = (tableData.aligns || []).map((a) => {
    if (a === 'left') return 'l';
    if (a === 'right') return 'r';
    return 'c';
  });
  while (colAligns.length < colCount) {
    colAligns.push('c');
  }

  const lines: string[] = ['    \\toprule'];
  if (hasHeaderRow) {
    const paddedHeaders = [...headers];
    while (paddedHeaders.length < colCount) paddedHeaders.push('');
    lines.push(`    ${paddedHeaders.map((h) => formatLatexContent(h)).join(' & ')} \\\\`);
    lines.push('    \\midrule');
  }
  for (const row of rows) {
    const paddedRow = [...row];
    while (paddedRow.length < colCount) paddedRow.push('');
    lines.push(`    ${paddedRow.map((c) => formatLatexContent(c)).join(' & ')} \\\\`);
  }
  lines.push('    \\bottomrule');

  const tabularCode = `\\begin{tabular}{${colAligns.join(' ')}}\n${lines.join('\n')}\n  \\end{tabular}`;

  const wrappedTabular = `\\begin{adjustbox}{max width=\\linewidth}\n  ${tabularCode}\n  \\end{adjustbox}`;

  let captionCode = '';
  if (tableData.caption && tableData.caption.trim()) {
    captionCode = formatLatexContent(tableData.caption.trim());
  }

  if (inBox) {

    let code = `\\begin{center}\n  \\small\n`;
    if (captionCode) {
      code += `  {\\small\\kaishu ${captionCode}}\\par\\vspace{0.4em}\n`;
    }
    code += `  ${wrappedTabular}\n\\end{center}\n\n`;
    return code;
  }

  let code = `\\begin{table}[htbp]\n  \\centering\n  \\small\n`;
  if (captionCode) {
    code += `  \\caption{${captionCode}}\n`;
  }
  code += `  ${wrappedTabular}\n\\end{table}\n\n`;
  return code;
}

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

  const captionText = figureData.caption || (figureData.alt && (/^图\s*[\d\.\-－]/i.test(figureData.alt.trim()) || figureData.alt.trim().length > 3) ? figureData.alt : '');
  if (captionText && captionText.trim()) {
    const captionFont = policy.captionStyle === 'kaishu' ? '\\kaishu' : '\\normalfont';
    code += `  \\par\\vspace{0.4em}{\\small${captionFont} ${formatLatexContent(captionText.trim())}}\n`;
  }

  code += `\\end{center}\n\n`;
  return code;
}

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
        const rawTitle = block.title || block.content || '';
        const cleanTitle = formatHeadingLatex(stripLeadingNumber(rawTitle));
        if (level === 1 || level === 2) {
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
          const trimmed = cleanMathFormula(block.content.trim());

          if (trimmed.includes('\\tag{') || trimmed.includes('\\tag*{')) {
            code += `\\begin{equation}\n${trimmed}\n\\end{equation}\n\n`;
          } else {
            code += `\\[\n${trimmed}\n\\]\n\n`;
          }
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
      case 'method':
      case 'exercise': {
        let rawTitle = block.title ? formatLatexContent(stripTheoremPrefix(block.title)).trim() : '';

        rawTitle = rawTitle.replace(/^[\(（](.*)[\)）]$/, '$1').trim();
        const titleArg = rawTitle ? `[${rawTitle}]` : '';
        const labelArg = block.label || (block.number ? `${block.kind}:${block.number.replace(/\./g, '-')}` : '');
        code += `\\begin{${block.kind}}${titleArg}\n`;
        if (labelArg) {
          code += `\\label{${labelArg}}\n`;
        }
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
        const rawTitle = block.title ? formatLatexContent(block.title).trim() : '解';
        const cleanTitle = rawTitle.replace(/[\.．。\s]+$/, '').trim();
        const optTitle = cleanTitle && cleanTitle !== '解' ? `[${cleanTitle}]` : '';
        code += `\\begin{solution}${optTitle}\n`;
        const inner = renderSemanticBlocks(block.children || [], config, true).trim();
        if (inner) {
          code += `${inner}\n`;
        }
        code += `\\end{solution}\n\n`;
        break;
      }

      case 'sidenote': {
        if (config.sidenoteMode === 'margin') {
          const title = block.title ? formatLatexContent(block.title).trim() : '注';
          const inner = renderSemanticBlocks(block.children || [], config, true).trim();
          if (inBox) {
            code += `\\par\\vspace{0.4em}\\noindent{\\small\\kaishu{\\biaosong\\bfseries 【${title}】}\\; ${inner}}\\par\\vspace{0.4em}\n\n`;
          } else {
            code += `\\astrolibsidenote[${title}]{${inner}}%\n`;
          }
          break;
        }

        const rawTitle = block.title ? formatLatexContent(block.title).trim() : '注';
        const cleanTitle = rawTitle.replace(/^[【\[（\(]/, '').replace(/[】\]）\)]$/, '').trim() || '注';
        const inner = renderSemanticBlocks(block.children || [], config, true).trim();
        if (inBox) {
          code += `\\par\\vspace{0.4em}\\noindent{\\small\\kaishu{\\biaosong\\bfseries 【${cleanTitle}】}\\; ${inner}}\\par\\vspace{0.4em}\n\n`;
        } else if (cleanTitle.includes('思路') || cleanTitle.includes('分析')) {
          const optTitle = cleanTitle === '思路分析' ? '' : `[${cleanTitle}]`;
          code += `\\begin{analysis}${optTitle}\n${inner}\n\\end{analysis}\n\n`;
        } else {
          const optTitle = (cleanTitle === '注' || cleanTitle === '注记') ? '' : `[${cleanTitle}]`;
          code += `\\begin{remark}${optTitle}\n${inner}\n\\end{remark}\n\n`;
        }
        break;
      }

      case 'remark': {
        const title = block.title ? formatLatexContent(block.title).trim() : '注';
        const optTitle = title && title !== '注' && title !== '注记' ? `[${title}]` : '';
        code += `\\begin{remark}${optTitle}\n`;
        const inner = renderSemanticBlocks(block.children || [], config, true).trim();
        if (inner) {
          code += `${inner}\n`;
        }
        code += `\\end{remark}\n\n`;
        break;
      }

      case 'analysis': {
        const rawTitle = block.title ? formatLatexContent(block.title).trim() : '思路分析';
        const cleanTitle = rawTitle.replace(/[\.．。\s]+$/, '').trim();
        const optTitle = cleanTitle && cleanTitle !== '思路分析' ? `[${cleanTitle}]` : '';
        code += `\\begin{analysis}${optTitle}\n`;
        const inner = renderSemanticBlocks(block.children || [], config, true).trim();
        if (inner) {
          code += `${inner}\n`;
        }
        code += `\\end{analysis}\n\n`;
        break;
      }

      case 'guide': {
        const title = block.title ? formatLatexContent(block.title).trim() : '本节导读';
        code += `\\begin{guide}[${title}]\n`;
        const inner = renderSemanticBlocks(block.children || [], config, true).trim();
        if (inner) {
          code += `${inner}\n`;
        }
        code += `\\end{guide}\n\n`;
        break;
      }

      case 'summary': {
        const title = block.title ? formatLatexContent(block.title).trim() : '本节总结';
        code += `\\begin{summary}[${title}]\n`;
        const inner = renderSemanticBlocks(block.children || [], config, true).trim();
        if (inner) {
          code += `${inner}\n`;
        }
        code += `\\end{summary}\n\n`;
        break;
      }

      case 'digital_resource':
      case 'qrcode': {
        const res = block.resourceData;
        const categoryLabel = res?.categoryLabel || (block.title?.includes('微课') ? '微课视频' : '配套数字资源');
        const title = res?.title || block.title || '数字资源';
        let rawUrl = (res?.url || block.content || '').trim();
        if (rawUrl === '#' || rawUrl === '###' || rawUrl.startsWith('javascript:')) {
          rawUrl = '';
        }
        const safeUrl = rawUrl.replace(/#/g, '\\#').replace(/%/g, '\\%');
        code += `\\astrolibdigitalresource[${escapeLatexMeta(categoryLabel)}]{${escapeLatexMeta(title)}}{${safeUrl}}\n\n`;
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

export function renderChapterLatexDocument(
  chapter: ChapterDocument,
  userConfig: Partial<ChapterLatexConfig & { embedStyle?: boolean }> = {}
): string {
  const config = { ...DEFAULT_CHAPTER_EXPORT_SETTINGS, ...userConfig };
  const paperOption = config.paperSize === 'b5' ? 'b5paper' : 'a4paper';
  const fontPt = (config.fontSize === 10.5 || !config.fontSize) ? '11pt' : `${config.fontSize}pt`;

  const meta = chapter.metadata;
  const bookTitle = meta?.bookTitle || chapter.bookTitle || '';
  const cleanTitle = stripLeadingNumber(chapter.title) || chapter.title || '章节内容';
  const fullTitle = meta?.fullTitle || chapter.title || config.title || cleanTitle;
  const authorName = meta?.bookAuthor || chapter.author || config.author || bookTitle || 'AstroLib';

  let chapNum: number | null = meta?.chapterNumber != null ? meta.chapterNumber : null;
  if (chapNum == null) {
    const m = (chapter.title || '').match(/^(\d+)/);
    if (m) chapNum = parseInt(m[1], 10);
  }

  let counterCode = '';
  if (chapNum != null && chapNum > 0) {
    counterCode = `\\setcounter{chapter}{${chapNum - 1}}\n`;
  }
  if (bookTitle) {
    counterCode += `\\renewcommand{\\astrolibbooktitle}{${escapeLatexMeta(bookTitle)}}\n`;
  }

  const safeLabel = `ch:${(chapter.slug || 'chapter').replace(/[^a-zA-Z0-9]/g, '-')}`;

  const mathFontMap: Record<string, string> = {
    typst: 'NewCMMath-Book.otf',
    modern: 'latinmodern-math.otf',
    times: 'texgyretermes-math.otf',
    pagella: 'texgyrepagella-math.otf',
  };
  const mathFontOtf = (config.mathFont && mathFontMap[config.mathFont]) || 'TeX Gyre Pagella Math';

  let cjkFontCode = '';
  if (config.cjkFont === 'default') {
    cjkFontCode = `\\providecommand{\\biaosong}{\\songti\\bfseries}\n`;
  } else {
    cjkFontCode = `%=============================================================================
% CJK FONTS (思源宋体正文 + 思源宋体粗体高字重标宋)
%=============================================================================
% 1. 中文主字体与 BoldFont 精准绑定 (标宋/高字重思源宋体)
\\IfFontExistsTF{SourceHanSerifSC-Regular.otf}{%
  \\setCJKmainfont{SourceHanSerifSC-Regular.otf}[
    BoldFont={SourceHanSerifSC-Bold.otf},
    AutoFakeBold=true
  ]%
}{%
  \\IfFontExistsTF{Source Han Serif SC}{%
    \\setCJKmainfont{Source Han Serif SC}[
      BoldFont={Source Han Serif SC Bold},
      AutoFakeBold=true
    ]%
  }{%
    \\IfFontExistsTF{Noto Serif CJK SC}{%
      \\setCJKmainfont{Noto Serif CJK SC}[
        BoldFont={Noto Serif CJK SC Bold},
        AutoFakeBold=true
      ]%
    }{%
      \\IfFontExistsTF{FandolSong-Regular.otf}{%
        \\setCJKmainfont{FandolSong-Regular.otf}[
          BoldFont=FandolSong-Bold.otf,
          AutoFakeBold=true
        ]%
      }{%
        \\IfFontExistsTF{STSong}{%
          \\setCJKmainfont{STSong}[
            BoldFont={STZhongsong},
            AutoFakeBold=true
          ]%
        }{%
          \\setCJKmainfont{SimSun}[
            BoldFont={STZhongsong},
            AutoFakeBold=true
          ]%
        }%
      }%
    }%
  }%
}

% 2. 标宋/高字重思源宋体专用字族 (\\biaosong)
\\IfFontExistsTF{SourceHanSerifSC-Bold.otf}{%
  \\setCJKfamilyfont{zhbiaosong}{SourceHanSerifSC-Bold.otf}%
}{%
  \\IfFontExistsTF{Source Han Serif SC Bold}{%
    \\setCJKfamilyfont{zhbiaosong}{Source Han Serif SC Bold}%
  }{%
    \\IfFontExistsTF{Noto Serif CJK SC Bold}{%
      \\setCJKfamilyfont{zhbiaosong}{Noto Serif CJK SC Bold}%
    }{%
      \\IfFontExistsTF{FandolSong-Bold.otf}{%
        \\setCJKfamilyfont{zhbiaosong}{FandolSong-Bold.otf}%
      }{%
        \\IfFontExistsTF{STZhongsong}{%
          \\setCJKfamilyfont{zhbiaosong}{STZhongsong}%
        }{%
          \\setCJKfamilyfont{zhbiaosong}{SimSun}[AutoFakeBold=true]%
        }%
      }%
    }%
  }%
}
\\providecommand{\\biaosong}{\\CJKfamily{zhbiaosong}}

% 3. 中文无衬线字族 (\\setCJKsansfont)
\\IfFontExistsTF{SourceHanSansSC-Regular.otf}{%
  \\setCJKsansfont{SourceHanSansSC-Regular.otf}[AutoFakeBold=true]%
}{%
  \\IfFontExistsTF{Source Han Sans SC}{%
    \\setCJKsansfont{Source Han Sans SC}[AutoFakeBold=true]%
  }{%
    \\IfFontExistsTF{Noto Sans CJK SC}{%
      \\setCJKsansfont{Noto Sans CJK SC}[AutoFakeBold=true]%
    }{%
      \\IfFontExistsTF{FandolHei-Regular.otf}{%
        \\setCJKsansfont{FandolHei-Regular.otf}[AutoFakeBold=true]%
      }{%
        \\setCJKsansfont{SimHei}[AutoFakeBold=true]%
      }%
    }%
  }%
}
`;
  }

  const sidenoteMode = config.sidenoteMode === 'margin' ? 'margin' : 'inline';
  const geometryMargins = sidenoteMode === 'margin'
    ? `inner=0.9in,
    outer=1.85in,
    top=1in,
    bottom=1.4in,
    bindingoffset=0.25in,`
    : `inner=1.0in,
    outer=1.25in,
    top=1in,
    bottom=1.4in,
    bindingoffset=0.25in,`;

  const sidenotePreamble = sidenoteMode === 'margin'
    ? `%=============================================================================
% MARGIN NOTES (book.tex Academic Sidenote Standard - Margin Mode)
%=============================================================================
\\usepackage{marginnote}
\\setlength{\\marginparwidth}{1.35in}
\\setlength{\\marginparsep}{0.18in}
\\NewDocumentCommand\\astrolibsidenote{ O{注} +m }{%
  \\marginnote{\\footnotesize\\kaishu\\raggedright{\\biaosong\\bfseries 【#1】}\\par #2}%
}`
    : `%=============================================================================
% SIDENOTE FALLBACK (Inline Flow Remark Mode)
%=============================================================================
\\NewDocumentCommand\\astrolibsidenote{ O{注} +m }{%
  \\begin{remark}[#1]
    #2
  \\end{remark}%
}`;

  let code = `% =========================================================================
% AstroLib Academic Textbook Chapter
% Typeset with official book.tex standard (latex-document-skill)
% Clean, minimal, publication-grade academic layout (Palatino + amsthm)
% Generated by AstroLib Headless Publishing System
% =========================================================================

\\documentclass[${paperOption},${fontPt},twoside,openright]{book}

%=============================================================================
% ENCODING AND FONTS (Palatino text & math + Inconsolata monospace + CJK)
%=============================================================================
\\usepackage{ctex}
\\usepackage{mathtools}
\\usepackage{amssymb}
\\usepackage{fontspec}
\\setmainfont{TeX Gyre Pagella}
\\usepackage{unicode-math}
\\setmathfont{${mathFontOtf}}
\\usepackage[scaled=0.95]{inconsolata}
${cjkFontCode}
\\newcommand{\\astrolibbooktitle}{${escapeLatexMeta(bookTitle || 'AstroLib')}}

%=============================================================================
% PAGE LAYOUT AND TYPOGRAPHY (book.tex Classical Asymmetric Margins)
%=============================================================================
\\usepackage[${paperOption},
    ${geometryMargins}
    headheight=14pt]{geometry}
\\usepackage[final,protrusion=true]{microtype}
\\usepackage{setspace}
\\linespread{1.35}                % ~135% leading for comfortable book reading
\\usepackage{emptypage}           % Blank verso pages have no headers/footers

%=============================================================================
% GRAPHICS AND FIGURES
%=============================================================================
\\usepackage{graphicx}
\\usepackage[export]{adjustbox}
\\usepackage[font=small,labelfont=bf,format=hang]{caption}
\\usepackage{subcaption}
\\graphicspath{{assets/}{images/}{./}}

%=============================================================================
% TABLES
%=============================================================================
\\usepackage{booktabs}
\\usepackage{array}
\\usepackage{multirow}

%=============================================================================
% LISTS (latex-document-skill Anti-Pattern 4 Compaction Standard)
%=============================================================================
\\usepackage{enumitem}
\\setlist[itemize]{nosep, leftmargin=*, topsep=2pt, partopsep=0pt}
\\setlist[enumerate]{nosep, leftmargin=*, topsep=2pt, partopsep=0pt}
\\setlist[enumerate,1]{label=\\arabic*., nosep, leftmargin=*}
\\setlist[enumerate,2]{label=(\\arabic*), nosep, leftmargin=*}
\\setlist[enumerate,3]{label=(\\alph*), nosep, leftmargin=*}

%=============================================================================
% TCOLORBOX (lecture-notes.tex Academic Breakable Boxes)
%=============================================================================
\\usepackage[most]{tcolorbox}
\\tcbuselibrary{skins,breakable}

\\newtcolorbox{remark}[1][注]{
  blanker,
  breakable,
  left=1.2em,
  borderline west={1.2pt}{0pt}{black!35},
  fonttitle=\\biaosong\\bfseries,
  coltitle=black!85,
  title={【#1】},
  attach title to upper={\\;\\ },
  fontupper=\\small\\kaishu,
  before skip=0.9em plus 0.2em minus 0.1em,
  after skip=0.9em plus 0.2em minus 0.1em
}

\\newtcolorbox{analysis}[1][思路分析]{
  blanker,
  breakable,
  left=1.2em,
  borderline west={0.9pt}{0pt}{black!28},
  fonttitle=\\sffamily\\itshape,
  coltitle=black!75,
  title={【#1】},
  attach title to upper={\\;\\ },
  fontupper=\\small\\kaishu,
  before skip=0.8em plus 0.2em minus 0.1em,
  after skip=0.8em plus 0.2em minus 0.1em
}

${sidenotePreamble}

%=============================================================================
% COLORS (book.tex Academic Palette)
%=============================================================================
\\usepackage{xcolor}
\\definecolor{chapterblue}{HTML}{1E3A5F}
\\definecolor{sectiongray}{HTML}{333333}
\\definecolor{linkblue}{RGB}{0,51,153}

%=============================================================================
% HEADER/FOOTER (book.tex Running Headers)
%=============================================================================
\\usepackage{fancyhdr}
\\pagestyle{fancy}
\\fancyhf{}
\\fancyhead[LE]{\\small\\slshape\\nouppercase{\\astrolibbooktitle}}
\\fancyhead[RO]{\\small\\slshape\\nouppercase{\\rightmark}}
\\fancyfoot[C]{\\small\\thepage}
\\renewcommand{\\headrulewidth}{0.4pt}
\\renewcommand{\\footrulewidth}{0pt}

% Plain style for chapter opening pages
\\fancypagestyle{plain}{
    \\fancyhf{}
    \\fancyfoot[C]{\\small\\thepage}
    \\renewcommand{\\headrulewidth}{0pt}
}

%=============================================================================
% CHAPTER AND SECTION TITLE STYLING (book.tex Display Titles)
%=============================================================================
\\usepackage{titlesec}
\\titleformat{\\chapter}[display]
  {\\normalfont\\biaosong\\huge\\bfseries\\color{chapterblue}}
  {\\chaptertitlename\\ \\thechapter}{20pt}{\\Huge}
\\titlespacing*{\\chapter}{0pt}{-20pt}{40pt}

\\titleformat{\\section}
  {\\normalfont\\biaosong\\Large\\bfseries\\color{sectiongray}}
  {\\thesection}{1em}{}

\\titleformat{\\subsection}
  {\\normalfont\\biaosong\\large\\bfseries\\color{sectiongray}}
  {\\thesubsection}{1em}{}

%=============================================================================
% EPIGRAPHS & DROP CAPS
%=============================================================================
\\usepackage{epigraph}
\\setlength{\\epigraphwidth}{0.6\\textwidth}
\\setlength{\\epigraphrule}{0pt}

\\usepackage{lettrine}
\\setcounter{DefaultLines}{3}
\\renewcommand{\\DefaultLoversize}{0.1}

%=============================================================================
% THEOREMS (Clean amsthm, zero cards, authentic book.tex style)
%=============================================================================
\\usepackage{amsthm}
\\newtheoremstyle{astrolibplain}%
  {0.6em plus 0.2em minus 0.1em}%
  {0.6em plus 0.2em minus 0.1em}%
  {\\normalfont}%
  {}%
  {\\biaosong\\bfseries}%
  {.}%
  {0.5em}%
  {}
\\newtheoremstyle{astrolibdefinition}%
  {0.6em plus 0.2em minus 0.1em}%
  {0.6em plus 0.2em minus 0.1em}%
  {\\normalfont}%
  {}%
  {\\biaosong\\bfseries}%
  {.}%
  {0.5em}%
  {}

\\theoremstyle{astrolibplain}
\\newtheorem{theorem}{定理}[chapter]
\\newtheorem{lemma}[theorem]{引理}
\\newtheorem{proposition}[theorem]{命题}
\\newtheorem{corollary}[theorem]{推论}
\\newtheorem{axiom}[theorem]{公理}
\\newtheorem{property}[theorem]{性质}
\\newtheorem{criterion}[theorem]{准则}
\\newtheorem{academicblock}[theorem]{法则}

\\theoremstyle{astrolibdefinition}
\\newtheorem{definition}[theorem]{定义}
\\newtheorem{example}[theorem]{例}
\\newtheorem{variant}[theorem]{变式}
\\newtheorem{method}[theorem]{方法}
\\newtheorem{exercise}[theorem]{习题}

\\renewcommand{\\proofname}{\\biaosong\\bfseries 证明}
\\newenvironment{solution}[1][解]{\\par\\noindent{\\biaosong\\textbf{#1.}} }{\\par\\vspace{0.8em}}
\\newenvironment{guide}[1][本节导读]{\\par\\vspace{0.5em}\\noindent{\\biaosong\\textbf{#1}}\\par\\itshape}{\\par\\vspace{0.8em}}
\\newenvironment{summary}[1][本节总结]{\\par\\vspace{0.5em}\\noindent{\\biaosong\\textbf{#1}}\\par\\itshape}{\\par\\vspace{0.8em}}
\\newcommand{\\astrolibdigitalresource}[3][配套数字资源]{%
  \\par\\vspace{0.4em}%
  \\noindent{\\small\\kaishu #1\\,\\cdot\\,}\\href{#3}{\\small #2}%
  \\par\\vspace{0.4em}%
}

%=============================================================================
% ALGORITHMS & SI UNITS
%=============================================================================
\\usepackage{algorithm}
\\usepackage{algpseudocode}
\\usepackage{siunitx}
\\sisetup{detect-all}

%=============================================================================
% HYPERLINKS & CLEVEREF (load near end)
%=============================================================================
\\usepackage{bookmark}
\\usepackage{hyperref}
\\hypersetup{
    colorlinks=true,
    linkcolor=chapterblue,
    citecolor=linkblue,
    urlcolor=linkblue,
    pdfauthor={${escapeLatexMeta(authorName)}},
    pdftitle={${escapeLatexMeta(fullTitle)}},
    pdfsubject={${escapeLatexMeta(bookTitle)}},
    bookmarks=true,
    bookmarksnumbered=true,
    bookmarksopen=true,
}
\\usepackage{cleveref}

%=============================================================================
% CUSTOM MATH COMMANDS (book.tex standard commands)
%=============================================================================
\\newcommand{\\R}{\\mathbb{R}}
\\newcommand{\\N}{\\mathbb{N}}
\\newcommand{\\Z}{\\mathbb{Z}}
\\newcommand{\\C}{\\mathbb{C}}
\\DeclareMathOperator*{\\argmax}{arg\\,max}
\\DeclareMathOperator*{\\argmin}{arg\\,min}
\\DeclarePairedDelimiter{\\abs}{\\lvert}{\\rvert}
\\DeclarePairedDelimiter{\\norm}{\\lVert}{\\rVert}
\\DeclarePairedDelimiter{\\inner}{\\langle}{\\rangle}

\\title{${escapeLatexMeta(fullTitle)}}
\\author{${escapeLatexMeta(authorName)}}
\\date{\\today}

\\begin{document}
${counterCode}
\\chapter{${formatHeadingLatex(cleanTitle)}}
\\label{${safeLabel}}

`;

  const chapterCleanNorm = cleanTitle.replace(/^[第\d\.\s一二三四五六七八九十]+[章节篇讲]\s*/, '').trim();
  const blocksToRender = (chapter.blocks || []).filter((b, idx) => {
    if (idx <= 1 && b.kind === 'heading' && b.level === 1) {
      const hClean = stripLeadingNumber(b.title || b.content || '').replace(/^[第\d\.\s一二三四五六七八九十]+[章节篇讲]\s*/, '').trim();
      if (hClean && (chapterCleanNorm.includes(hClean) || hClean.includes(chapterCleanNorm))) {
        return false;
      }
    }
    return true;
  });

  code += renderSemanticBlocks(blocksToRender, config);

  code += `\\end{document}\n`;
  return code;
}
