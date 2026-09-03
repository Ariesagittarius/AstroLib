import type { SlimQuestionItem } from '../../components/exercises/exercise-controller';

export interface LatexExportConfig {
  template: 'handout' | 'exam';
  paperSize: 'a4' | 'b5';
  fontSize: 10 | 10.5 | 11 | 12;
  fontFamily: 'serif' | 'sans';
  mathFont: 'typst' | 'modern' | 'times' | 'pagella';
  removeQed: boolean;
  pageNumbering: 'total' | 'simple' | 'none';
  writingSpace: 'comfortable' | 'compact' | 'none';
  answerPlacement: 'appendix' | 'inline' | 'none';
  coloredSolution: boolean;

  headerMode: 'standard' | 'compact' | 'none';
  title: string;
  subtitle?: string;
  showSubtitle: boolean;
  showLicense: boolean;
  licenseText: string;
  showDate: boolean;
  date?: string;
  courseName?: string;
  author?: string;
}

export const DEFAULT_LATEX_CONFIG: LatexExportConfig = {
  template: 'handout',
  paperSize: 'a4',
  fontSize: 11,
  fontFamily: 'serif',
  mathFont: 'typst',
  removeQed: true,
  pageNumbering: 'simple',
  writingSpace: 'comfortable',
  answerPlacement: 'appendix',
  coloredSolution: false,
  headerMode: 'standard',
  title: '工科数学分析',
  subtitle: '章节真题精选与自测练习',
  showSubtitle: true,
  showLicense: true,
  licenseText: 'CC BY-NC-SA 4.0',
  showDate: true,
  date: '\\today',
  courseName: '工科数学分析',
  author: '',
};

function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&le;/g, '\\leqslant ')
    .replace(/&ge;/g, '\\geqslant ')
    .replace(/&times;/g, '\\times ')
    .replace(/&divide;/g, '\\div ')
    .replace(/&plusmn;/g, '\\pm ')
    .replace(/&infin;/g, '\\infty ');
}

export function formatLatexContent(text: string): string {
  if (!text) return '';

  let raw = decodeHtmlEntities(text);

  raw = raw.replace(/<br\s*\/?>/gi, '\n');
  raw = raw.replace(/<\/p>/gi, '\n\n');
  raw = raw.replace(/<p[^>]*>/gi, '');
  raw = raw.replace(/<span[^>]*>/gi, '');
  raw = raw.replace(/<\/span>/gi, '');
  raw = raw.replace(/<div[^>]*>/gi, '');
  raw = raw.replace(/<\/div>/gi, '\n');
  raw = raw.replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '\\textbf{$1}');
  raw = raw.replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '\\textbf{$1}');
  raw = raw.replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '\\textit{$1}');
  raw = raw.replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, '\\textit{$1}');

  const mathBlocks: string[] = [];

  raw = raw.replace(/\$\$([\s\S]*?)\$\$/g, (_m, inner) => {
    mathBlocks.push(`\\[\n${inner.trim()}\n\\]`);
    return `§§MATH_BLOCK_${mathBlocks.length - 1}§§`;
  });
  raw = raw.replace(/\\\[([\s\S]*?)\\\]/g, (_m, inner) => {
    mathBlocks.push(`\\[\n${inner.trim()}\n\\]`);
    return `§§MATH_BLOCK_${mathBlocks.length - 1}§§`;
  });

  raw = raw.replace(/\\?\(([\s\S]*?)\\?\)/g, (m, inner) => {
    if (m.startsWith('\\(')) {
      mathBlocks.push(`$${inner.trim()}$`);
      return `§§MATH_BLOCK_${mathBlocks.length - 1}§§`;
    }
    return m;
  });

  raw = raw.replace(/\$([^\$\n]+?)\$/g, (_m, inner) => {

    let mathContent = inner;
    mathContent = mathContent.replace(/\\underline\{\s*(\\quad)*\s*\}/g, '\\underline{\\hspace{3.5em}}');
    mathContent = mathContent.replace(/_{3,}/g, '\\underline{\\hspace{3.5em}}');
    mathBlocks.push(`$${mathContent}$`);
    return `§§MATH_BLOCK_${mathBlocks.length - 1}§§`;
  });

  raw = raw.replace(/\\underline\{\s*(\\quad)*\s*\}/g, '\\underline{\\hspace{3.5em}}');
  raw = raw.replace(/\\underline\{\s*\}/g, '\\underline{\\hspace{3.5em}}');
  raw = raw.replace(/_{3,}/g, '\\underline{\\hspace{3.5em}}');
  raw = raw.replace(/（\s*）/g, '（\\quad）');
  raw = raw.replace(/\(\s*\)/g, '(\\quad)');

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

  raw = raw.replace(/§§MATH_BLOCK_(\d+)§§/g, (_m, idx) => mathBlocks[Number(idx)] || '');

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

  let mathFontCode = '';
  if (config.mathFont === 'typst') {
    mathFontCode = '% 公式字体：现代学术 Typst 同款字体 (New Computer Modern Math)\n\\setmathfont{NewCMMath-Book.otf}\n';
  } else if (config.mathFont === 'modern') {
    mathFontCode = '% 公式字体：经典 LaTeX 默认字体 (Latin Modern Math)\n\\setmathfont{latinmodern-math.otf}\n';
  } else if (config.mathFont === 'times') {
    mathFontCode = '% 公式字体：科技期刊 Times 风格字体 (TeX Gyre Termes Math)\n\\setmathfont{texgyretermes-math.otf}\n';
  } else if (config.mathFont === 'pagella') {
    mathFontCode = '% 公式字体：优雅数学教材 Pagella 风格字体 (TeX Gyre Pagella Math)\n\\setmathfont{texgyrepagella-math.otf}\n';
  }

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
\\usepackage{amsmath,amssymb,mathtools,bm}
\\usepackage{tasks}      % 专业选择题多列对齐宏包
\\usepackage{booktabs}   % 经典学术三线表宏包
\\usepackage{array}

${mathFontCode}${pageNumberCode}
% 选择题 tasks 标签格式设置为 A. B. C. D.
\\settasks{
  label = \\Alph*.,
  label-width = 1.6em,
  label-format = {\\bfseries},
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
  {\\large\\bfseries ${escapeLatexMeta(config.title)}}${titleSub}${licenseLine}
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
    code += `\\begin{center}\n`;
    code += `\\begin{tabular}{c p{5.5cm} c p{5.5cm}}\n`;
    code += `  \\toprule\n`;
    code += `  \\textbf{题号} & \\textbf{参考答案} & \\textbf{题号} & \\textbf{参考答案} \\\\\n`;
    code += `  \\midrule\n`;

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

    code += `  \\bottomrule\n`;
    code += `\\end{tabular}\n`;
    code += `\\end{center}\n\n`;

    code += `\\subsection*{二、详细推导与证明过程}\n\n`;

    let qIdx = 1;
    orderedQuestions.forEach((q) => {
      const num = qIdx++;
      if (q.type === 'choice' && !q.steps_html && !q.hints_html) return;

      const ansLatex = formatLatexContent(q.answer || '').trim();
      const stepsLatex = formatLatexContent(q.steps_html || q.hints_html || '').trim();
      const isProof = q.type === 'proof';

      code += `\\begin{solution}[第 ${num} 题解答]\n`;
      if (ansLatex && !isProof) {
        code += `  \\textbf{【答案】} ${ansLatex}\n\n`;
      }
      if (stepsLatex) {
        code += `  \\textbf{${isProof ? '【证明】' : '【解析】'}} ${stepsLatex}\n`;
      } else if (!ansLatex) {
        code += `  略。\n`;
      }
      code += `\\end{solution}\n\n`;
    });
  }

  code += `\\end{document}\n`;

  return code;
}
