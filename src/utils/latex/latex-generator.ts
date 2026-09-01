/**
 * src/utils/latex/latex-generator.ts
 * 生产级大学数学教材/学术练习册 LaTeX 源码生成引擎
 * 基于 CTAN / TeX Live 官方收录的 Jinwen-XU/homework 宏包标准架构开发
 * 遵循极简学术排版哲学：The content is the design. The mathematics is the interface.
 * 原生直出 LaTeX/KaTeX 数学公式，零转译损耗，100% 还原公式韵律。
 */

import type { SlimQuestionItem } from '../../components/exercises/exercise-controller';

export interface LatexExportConfig {
  template: 'handout' | 'exam'; // 学术讲义练习册 vs 课程自测试卷
  paperSize: 'a4' | 'b5';
  fontSize: 10 | 10.5 | 11 | 12;
  fontFamily: 'serif' | 'sans';
  mathFont: 'typst' | 'modern' | 'times' | 'pagella'; // 现代 Typst 风格 (New Computer Modern) vs 经典 LaTeX (Latin Modern) vs Times vs Pagella
  removeQed: boolean; // 是否去除题干右侧方框 QED 符号（还原纯正教材/试卷质感）
  pageNumbering: 'total' | 'simple' | 'none'; // 完整页码 vs 简洁纯数字页码 vs 无页码
  writingSpace: 'comfortable' | 'compact' | 'none'; // 留白：充裕(手写演算) / 紧凑(节约纸张) / 纯题干(无留白)
  answerPlacement: 'appendix' | 'inline' | 'none'; // 答案位置：文末附录 / 题下紧随 / 纯题卷无答案
  coloredSolution: boolean; // 是否彩色题解 (Jinwen-XU/homework 原生 colored solution 特性)
  // 卷头与元数据控制 (Header & Metadata)
  headerMode: 'standard' | 'compact' | 'none'; // 标准学术卷头 / 紧凑单行 / 无卷头省纸
  title: string;
  subtitle?: string;
  showSubtitle: boolean;
  showLicense: boolean; // CC BY-NC-SA 4.0 协议
  licenseText: string;  // 默认为 'CC BY-NC-SA 4.0'
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
 * 清理 HTML 标签与规范化 Markdown 语法为 LaTeX 语法
 * 保护数学公式 ($...$ 与 $$...$$) 内部不被错误处理
 */
export function formatLatexContent(text: string): string {
  if (!text) return '';

  let raw = decodeHtmlEntities(text);

  // 1. 规范化 HTML 换行与段落
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

  // 2. 占位保护公式块 ($$ 与 $)
  const mathBlocks: string[] = [];

  // 保护 display math: $$...$$ 与 \[...\]
  raw = raw.replace(/\$\$([\s\S]*?)\$\$/g, (_m, inner) => {
    mathBlocks.push(`\\[\n${inner.trim()}\n\\]`);
    return `§§MATH_BLOCK_${mathBlocks.length - 1}§§`;
  });
  raw = raw.replace(/\\\[([\s\S]*?)\\\]/g, (_m, inner) => {
    mathBlocks.push(`\\[\n${inner.trim()}\n\\]`);
    return `§§MATH_BLOCK_${mathBlocks.length - 1}§§`;
  });

  // 保护 inline math: $...$ 与 \(...\)
  raw = raw.replace(/\\?\(([\s\S]*?)\\?\)/g, (m, inner) => {
    if (m.startsWith('\\(')) {
      mathBlocks.push(`$${inner.trim()}$`);
      return `§§MATH_BLOCK_${mathBlocks.length - 1}§§`;
    }
    return m;
  });

  raw = raw.replace(/\$([^\$\n]+?)\$/g, (_m, inner) => {
    // 填空题下划线保护
    let mathContent = inner;
    mathContent = mathContent.replace(/\\underline\{\s*(\\quad)*\s*\}/g, '\\underline{\\hspace{3.5em}}');
    mathContent = mathContent.replace(/_{3,}/g, '\\underline{\\hspace{3.5em}}');
    mathBlocks.push(`$${mathContent}$`);
    return `§§MATH_BLOCK_${mathBlocks.length - 1}§§`;
  });

  // 3. 处理文本段 Markdown 标记与填空题下划线
  // 填空下划线
  raw = raw.replace(/\\underline\{\s*(\\quad)*\s*\}/g, '\\underline{\\hspace{3.5em}}');
  raw = raw.replace(/\\underline\{\s*\}/g, '\\underline{\\hspace{3.5em}}');
  raw = raw.replace(/_{3,}/g, '\\underline{\\hspace{3.5em}}');
  raw = raw.replace(/（\s*）/g, '（\\quad）');
  raw = raw.replace(/\(\s*\)/g, '(\\quad)');

  // Markdown 加粗与斜体
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

  // 4. 还原公式块
  raw = raw.replace(/§§MATH_BLOCK_(\d+)§§/g, (_m, idx) => mathBlocks[Number(idx)] || '');

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

  // 数学公式字体配置
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
  {\\large\\bfseries ${escapeLatexMeta(config.title)}}${titleSub}${licenseLine}
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

    // 1. 答案速查三线表 (booktabs)
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
