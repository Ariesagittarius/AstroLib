/**
 * src/publishing/latex/core/clean-math.ts
 * 纯数学公式语法清洗、Unicode 符号映射与 LaTeX 转义算法库
 */

/**
 * HTML 实体解码与清理
 */
export function decodeHtmlEntities(str: string): string {
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
export function cleanMathFormula(inner: string): string {
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

  // 修复 amsmath 限制：\tag 严禁放在 aligned 内部，必须移至 \end{aligned} 外部
  res = res.replace(/(\\begin\{aligned\}[\s\S]*?)\s*\\tag(\*?\{[^}]+\})([\s\S]*?\\end\{aligned\})/g, '$1$3 \\tag$2');

  return res;
}

export const UNICODE_MATH_MAP: Record<string, string> = {
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
  '⩽': '\\leqslant ',
  '⩾': '\\geqslant ',
  '≠': '\\ne ',
  '≈': '\\approx ',
  '⋯': '\\cdots ',
  '…': '\\ldots ',
  '⋮': '\\vdots ',
  '⋱': '\\ddots ',
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

export const MATH_COMMAND_REGEX =
  /\\(sqrt|frac|dfrac|tfrac|pi|alpha|beta|gamma|delta|epsilon|varepsilon|zeta|eta|theta|vartheta|iota|kappa|lambda|mu|nu|xi|rho|varrho|sigma|varsigma|tau|upsilon|phi|varphi|chi|psi|omega|Gamma|Delta|Theta|Lambda|Xi|Pi|Sigma|Upsilon|Phi|Psi|Omega|sin|cos|tan|cot|sec|csc|arcsin|arccos|arctan|ln|log|exp|lim|sum|prod|int|iint|iiint|oint|partial|nabla|infty|pm|mp|times|div|cdot|cdots|ldots|vdots|ddots|circ|le|ge|ne|leq|geq|neq|approx|sim|simeq|equiv|subset|supset|subseteq|supseteq|cup|cap|emptyset|varnothing|in|notin|ni|forall|exists|vec|hat|bar|tilde|dot|ddot|mathbf|mathbb|mathrm|mathcal|mathscr|mathfrak)(?![a-zA-Z])/;

/**
 * 规范化 Unicode 数学字符与控制字符
 */
export function normalizeUnicodeMath(text: string): string {
  if (!text) return '';
  let res = text.replace(/\r\n/g, '\n').replace(/\r/g, '');
  res = res.replace(/\\n(?![a-zA-Z])/g, '\n');
  res = res.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '');
  // 移除不可见的零宽空格与格式控制字符（杜绝 XeLaTeX 报方框与问号缺失字符）
  res = res.replace(/[\u200B-\u200D\uFEFF]/g, '');

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

  // 1. 保护已有占位符 (格式为 §§MBX...§§ 或 §§IMG...§§)
  const mbxPlaceholders: string[] = [];
  let s = text.replace(/§§[A-Z0-9_#]+§§/g, (m) => {
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

  // 彻底剔除任何残留的 SVG 矢量图与 MathML (防止 KaTeX 预渲染残留污染 LaTeX 输出)
  raw = raw.replace(/<svg[\s\S]*?<\/svg>/gi, '');
  raw = raw.replace(/<math[\s\S]*?<\/math>/gi, '');

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
    let captionLatex = '';
    if (cleanAlt && (/^图\s*[\d\.\-－]/i.test(cleanAlt) || cleanAlt.length > 3)) {
      captionLatex = `  \\par\\vspace{0.4em}{\\small\\kaishu ${cleanAlt}}\n`;
    }
    imgBlocks.push(
      `\n\\begin{center}\n  \\IfFileExists{../public${cleanUrl}}{\\includegraphics[width=0.48\\linewidth,keepaspectratio]{../public${cleanUrl}}}{\\IfFileExists{public${cleanUrl}}{\\includegraphics[width=0.48\\linewidth,keepaspectratio]{public${cleanUrl}}}{\\fbox{\\small\\itshape [图示] ${escapedAlt}}}}\n${captionLatex}\\end{center}\n`
    );
    return `§§IMG${imgBlocks.length - 1}XGMI§§`;
  });

  // 4. 处理填空题下划线与括号留白 (在提取公式前执行，防止下划线引发数学模式误判)
  raw = raw.replace(/\\underline\{\s*(\\quad)*\s*\}/g, '\\rule[-0.2ex]{3.5em}{0.4pt}');
  raw = raw.replace(/\\underline\{\s*\}/g, '\\rule[-0.2ex]{3.5em}{0.4pt}');
  raw = raw.replace(/_{3,}/g, '\\rule[-0.2ex]{3.5em}{0.4pt}');
  raw = raw.replace(/（\s*）/g, '（\\quad）');
  raw = raw.replace(/\(\s*\)/g, '(\\quad)');

  // 5. 占位保护公式块 ($$ 与 $) - 使用不含下划线、不含井号、不含反斜杠的独立标记
  const mathBlocks: string[] = [];

  // 保护 display math: $$...$$ 与 \[...\]
  raw = raw.replace(/\$\$([\s\S]*?)\$\$/g, (_m, inner) => {
    mathBlocks.push(`\\[\n${cleanMathFormula(inner.trim())}\n\\]`);
    return `§§MBX${mathBlocks.length - 1}XMBX§§`;
  });
  raw = raw.replace(/\\\[([\s\S]*?)\\\]/g, (_m, inner) => {
    mathBlocks.push(`\\[\n${cleanMathFormula(inner.trim())}\n\\]`);
    return `§§MBX${mathBlocks.length - 1}XMBX§§`;
  });

  // 保护 inline math: \(...\)
  raw = raw.replace(/\\\(([\s\S]*?)\\\)/g, (_m, inner) => {
    mathBlocks.push(`$${cleanMathFormula(inner.trim())}$`);
    return `§§MBX${mathBlocks.length - 1}XMBX§§`;
  });

  // 保护 inline math: $...$ (支持同段内多行公式，不跨段落)
  raw = raw.replace(/\$((?:[^\$\n]|\n(?!\s*\n))+?)\$/g, (_m, inner) => {
    mathBlocks.push(`$${cleanMathFormula(inner)}$`);
    return `§§MBX${mathBlocks.length - 1}XMBX§§`;
  });

  // 6. 识别并包裹裸露公式与数学命令
  raw = sanitizeBareMath(raw);

  // 7. 处理文本段 Markdown 加粗与斜体
  raw = raw.replace(/\*\*([^*]+)\*\*/g, '\\textbf{$1}');
  raw = raw.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1\\textit{$2}');

  // 带圈数字转换
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
  raw = raw.replace(/(?<!\\)#/g, '\\#');

  // 7.2 处理正文文本模式下的 \tag 语法（转换为标准右对齐编号，避免 amsmath "\tag not allowed here" 报错）
  raw = raw.replace(/\\tag\*?\{([^}]+)\}/g, '\\hfill ($1)');
  raw = raw.replace(/\\tag\*?\s*([0-9a-zA-Z\.\-]+)/g, '\\hfill ($1)');

  // 8. 还原所有公式块与图片块
  raw = raw.replace(/§§MBX(\d+)XMBX§§/g, (_m, idx) => mathBlocks[Number(idx)] || '');
  raw = raw.replace(/§§IMG(\d+)XGMI§§/g, (_m, idx) => imgBlocks[Number(idx)] || '');

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
 * 剥离章节与节标题前手工书写的冗余数字前缀（如 '1.1 集合及其运算' -> '集合及其运算'）
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
 * LaTeX 特殊字符转义（用于标题、课程名等纯文本元数据）
 */
export function escapeLatexMeta(str: string): string {
  if (!str) return '';
  return str
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/([&%$#_{}])/g, '\\$1')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}');
}
