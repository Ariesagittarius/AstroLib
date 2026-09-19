import type { SlimQuestionItem } from '../../../types/exercises';
import {
  type ExerciseExportSettings,
  DEFAULT_EXERCISE_EXPORT_SETTINGS,
  renderFontPreamble,
} from '../../common/export-settings.ts';
import {
  formatLatexContent,
  getVisualWidth,
  escapeLatexMeta,
} from '../core/clean-math';

export type LatexExportConfig = ExerciseExportSettings;
export const DEFAULT_LATEX_CONFIG: LatexExportConfig = DEFAULT_EXERCISE_EXPORT_SETTINGS;

export function formatChoiceTasks(options: Array<{ key: string; text_raw?: string; text_html?: string }>): string {
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

export function getSpaceLatex(type: string, writingSpace: 'comfortable' | 'compact' | 'none'): string {
  if (writingSpace === 'none' || type === 'choice') return '';

  if (writingSpace === 'compact') {
    if (type === 'blank') return '\\vspace{0.8cm}\n';
    if (type === 'calc') return '\\vspace{3.5cm}\n';
    if (type === 'proof') return '\\vspace{5.0cm}\n';
    return '\\vspace{3.0cm}\n';
  }

  if (type === 'blank') return '\\vspace{1.2cm}\n';
  if (type === 'calc') return '\\vspace{5.5cm}\n';
  if (type === 'proof') return '\\vspace{7.5cm}\n';
  return '\\vspace{4.5cm}\n';
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
% 极简纯净页码设置（单次编译即显示正确页码，覆盖 homework 默认页脚）
\\usepackage{fancyhdr}
\\fancypagestyle{fancy}{
  \\fancyhf{}
  \\fancyfoot[C]{\\small\\normalfont 第 \\thepage\\ 页}
  \\renewcommand{\\headrulewidth}{0pt}
  \\renewcommand{\\footrulewidth}{0pt}
}
\\pagestyle{fancy}
`;
  } else if (config.pageNumbering === 'total') {
    pageNumberCode = `
% 完整总页数页码（覆盖 homework 默认页脚）
\\usepackage{fancyhdr}
\\usepackage{lastpage}
\\fancypagestyle{fancy}{
  \\fancyhf{}
  \\fancyfoot[C]{\\small\\normalfont 第 \\thepage\\ 页 / 共 \\pageref{LastPage} 页}
  \\renewcommand{\\headrulewidth}{0pt}
  \\renewcommand{\\footrulewidth}{0pt}
}
\\pagestyle{fancy}
`;
  } else if (config.pageNumbering === 'none') {
    pageNumberCode = `
% 纯净无页码（覆盖 homework 默认页脚）
\\usepackage{fancyhdr}
\\fancypagestyle{fancy}{
  \\fancyhf{}
  \\renewcommand{\\headrulewidth}{0pt}
  \\renewcommand{\\footrulewidth}{0pt}
}
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
  label = \\Alph*.,
  label-width = 1.6em,
  label-format = {\\sffamily\\bfseries},
  item-indent = 2.2em,
  before-skip = 0.3em,
  after-skip = 0.5em
}

% 随题附解 (Solution) 学术视觉重构：去除粗糙生硬的打字机下划线，支持典雅学术排版
\\ExplSyntaxOn
\\RenewDocumentCommand \\soluline { m }
  {
    \\tl_if_blank:nF { #1 }
      {
        {\\sffamily\\bfseries #1}\\nobreakspace
      }
  }
\\ExplSyntaxOff
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
\\title{${escapeLatexMeta(config.title || '')}${titleSub}}
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
  {\\large\\sffamily\\bfseries ${escapeLatexMeta(config.title || '')}}${titleSub}${licenseLine}
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
        const ans = formatLatexContent(q.answer || '').trim();
        const rawSteps = q.steps_raw || q.hints_raw || '';
        const fallbackSteps = q.steps_html || q.hints_html || '';
        const steps = formatLatexContent(rawSteps || fallbackSteps).trim();
        code += `\\end{problem}\n`;
        code += `\\begin{solution}[]\n`;
        if (q.type === 'proof') {
          if (steps) {
            code += `  \\textbf{【证明】} ${steps}\n`;
          } else if (ans) {
            code += `  \\textbf{【证明】} ${ans}\n`;
          } else {
            code += `  \\textbf{【证明】} 略。\n`;
          }
        } else {
          if (ans && steps) {
            code += `  \\textbf{【答案】} ${ans}\n\n  \\textbf{【解析】} ${steps}\n`;
          } else if (ans) {
            code += `  \\textbf{【答案】} ${ans}\n`;
          } else if (steps) {
            code += `  \\textbf{【解】} ${steps}\n`;
          } else {
            code += `  \\textbf{【解】} 略。\n`;
          }
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
      const hasSteps = Boolean(q.steps_raw || q.hints_raw || q.steps_html || q.hints_html);
      if (q.type === 'choice' && !hasSteps) return;

      const ansLatex = formatLatexContent(q.answer || '').trim();
      const rawSteps = q.steps_raw || q.hints_raw || '';
      const fallbackSteps = q.steps_html || q.hints_html || '';
      const stepsLatex = formatLatexContent(rawSteps || fallbackSteps).trim();
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
