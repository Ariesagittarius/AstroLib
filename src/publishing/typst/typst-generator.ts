import type { SlimQuestionItem } from '../../types/exercises';

export interface TypstExportConfig {
  template: 'handout' | 'exam';
  paperSize: 'a4' | 'b5';
  fontFamily: 'serif' | 'sans';
  fontSize: number;
  writingSpace: 'comfortable' | 'compact' | 'none';
  answerPlacement: 'appendix' | 'none';
  title: string;
  subtitle?: string;
  courseName?: string;
}

export const DEFAULT_TYPST_CONFIG: TypstExportConfig = {
  template: 'handout',
  paperSize: 'a4',
  fontFamily: 'serif',
  fontSize: 10.5,
  writingSpace: 'comfortable',
  answerPlacement: 'appendix',
  title: '数学分析',
  subtitle: '',
  courseName: '数学分析',
};

function getTypstPaperSize(paper: string): string {
  switch (paper) {
    case 'b5':
      return 'iso-b5';
    case 'a4':
    default:
      return 'a4';
  }
}

import {
  convertLatexToTypst,
  convertLatexMathToTypst,
  tokenizeLatexText,
  escapeTypstString,
} from './syntax-converter.ts';

export {
  convertLatexToTypst,
  convertLatexMathToTypst,
  tokenizeLatexText,
  escapeTypstString,
};

function formatChoiceItem(textRaw: string): string {
  const typst = convertLatexToTypst(textRaw).trim();
  if (!typst) return '[]';

  if (typst.startsWith('$') && typst.endsWith('$') && (typst.match(/\$/g) || []).length === 2) {
    return typst;
  }

  return `[${typst}]`;
}

function getSpaceHeight(type: string, writingSpace: 'comfortable' | 'compact' | 'none'): number {
  if (writingSpace === 'none' || type === 'choice') return 0;

  if (writingSpace === 'compact') {
    if (type === 'blank') return 0.6;
    if (type === 'calc') return 2.8;
    if (type === 'proof') return 4.5;
    return 2.5;
  }

  if (type === 'blank') return 1.0;
  if (type === 'calc') return 5.0;
  if (type === 'proof') return 7.5;
  return 4.0;
}

export function generateTypstDocument(
  questions: SlimQuestionItem[],
  userConfig: Partial<TypstExportConfig> = {}
): string {
  const config: TypstExportConfig = { ...DEFAULT_TYPST_CONFIG, ...userConfig };
  const typstPaper = getTypstPaperSize(config.paperSize);

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

  const fontBody =
    config.fontFamily === 'serif'
      ? '("New Computer Modern", "Times New Roman", "Source Han Serif SC", "SimSun", "STSong", "Songti SC")'
      : '("Source Han Sans SC", "Microsoft YaHei", "PingFang SC", "SimHei", "Noto Sans CJK SC")';

  const fontHeading =
    config.fontFamily === 'serif'
      ? '("Source Han Serif SC", "SimSun", "STSong", "Songti SC", "Times New Roman")'
      : '("Source Han Sans SC", "Microsoft YaHei", "PingFang SC", "SimHei")';

  const isExam = config.template === 'exam';

  let code = `// =========================================================================
// Academic Mathematical Problem Sheet
// Template: ${config.template} | Paper: ${typstPaper} | Font: ${config.fontSize}pt
// Clean, minimal, publication-grade academic layout (Zero UI clutter)
// =========================================================================

#set document(
  title: "${escapeTypstString(config.title)}",
  author: "AstroLib",
)

#set page(
  paper: "${typstPaper}",
  margin: ${
    typstPaper === 'iso-b5'
      ? '(x: 1.8cm, top: 2.2cm, bottom: 2.0cm)'
      : '(x: 2.2cm, top: 2.4cm, bottom: 2.2cm)'
  },
  header: context {
    if counter(page).get().first() > 1 [
      #set text(font: ${fontBody}, size: 8.5pt, fill: rgb("#555555"))
      #grid(
        columns: (1fr, 1fr),
        align: (left, right),
        [${escapeTypstString(config.courseName || '数学')}],
        [${escapeTypstString(config.title)}],
      )
      #v(-0.4em)
      #line(length: 100%, stroke: 0.35pt + rgb("#b0b0b0"))
    ]
  },
  footer: context {
    set text(font: ${fontBody}, size: 8.5pt, fill: rgb("#333333"))
    align(center)[#counter(page).display("1")]
  }
)

#set text(
  font: ${fontBody},
  size: ${config.fontSize}pt,
  lang: "zh",
)

#set par(
  leading: 0.85em,
  justify: true,
)

// 行内数学公式微距微调
#show math.equation.where(block: false): it => h(0.2em, weak: true) + it + h(0.2em, weak: true)

// 基础排版宏
#let blank(width) = box(width: width)[#line(length: 100%, stroke: 0.5pt)]
#let dfrac(num, den) = math.display(math.frac(num, den))

// 一级大题标题规范（教材体例）
#show heading.where(level: 1): it => block(spacing: 1.2em)[
  #text(font: ${fontHeading}, size: 11pt, weight: "bold")[#it.body]
  #v(0.3em)
]

// 智能选择题多列网格宏
#let choice(
  ..items,
  columns: 1,
  row-gutter: 0.9em,
  column-gutter: 1.5em,
  label-format: "A.",
  label-gap: 0.35em,
) = {
  let cells = items
    .pos()
    .enumerate()
    .map(((i, item)) => [
      #text(weight: "medium")[#numbering(label-format, i + 1)]#h(label-gap)#item
    ])

  v(0.2em)
  grid(
    columns: (1fr,) * columns,
    row-gutter: row-gutter,
    column-gutter: column-gutter,
    ..cells,
  )
  v(0.2em)
}
`;

  if (isExam) {
    code += `
// -------------------------------------------------------------------------
// 课程测试卷头
// -------------------------------------------------------------------------
#align(center)[
  #v(0.4em)
  #text(font: ${fontHeading}, size: 12pt, weight: "bold")[${escapeTypstString(config.courseName || '高等数学')} 课程自测试卷]
  #v(0.2em)
  #text(font: ${fontHeading}, size: 16pt, weight: "bold")[${escapeTypstString(config.title)}]
  #v(0.6em)
  #line(length: 100%, stroke: 0.4pt + rgb("#333333"))
  #v(0.5em)
]
`;
  } else {

    code += `
// -------------------------------------------------------------------------
// 章节讲义卷头
// -------------------------------------------------------------------------
#align(center)[
  #v(0.4em)
`;
    if (config.courseName && config.courseName.trim()) {
      code += `  #text(font: ${fontHeading}, size: 10pt, fill: rgb("#555555"), tracking: 1.2pt)[${escapeTypstString(config.courseName)}]\n  #v(0.2em)\n`;
    }
    code += `  #text(font: ${fontHeading}, size: 17pt, weight: "bold")[${escapeTypstString(config.title)}]\n`;
    if (config.subtitle && config.subtitle.trim()) {
      code += `  #v(0.2em)\n  #text(size: 9.5pt, fill: rgb("#666666"))[${escapeTypstString(config.subtitle)}]\n`;
    }
    code += `  #v(0.6em)
  #line(length: 100%, stroke: 0.4pt + rgb("#333333"))
  #v(0.5em)
]
`;
  }

  let questionIndex = 1;
  const sectionRoman = ['一', '二', '三', '四', '五', '六', '七', '八'];
  let currentSectionIdx = 0;

  const typeOrder: Array<{ type: 'choice' | 'blank' | 'calc' | 'proof'; label: string; desc: string }> = [
    { type: 'choice', label: '选择题', desc: '下列各题给出的四个选项中，只有一个选项符合题目要求。' },
    { type: 'blank', label: '填空题', desc: '把答案填在题中横线上。' },
    { type: 'calc', label: '计算题', desc: '解答应写出文字说明、演算步骤或证明过程。' },
    { type: 'proof', label: '证明题', desc: '解答应写出严谨完整的定理依据与推导证明过程。' },
  ];

  typeOrder.forEach(({ type, label, desc }) => {
    const list = typeGroups[type] || [];
    if (list.length === 0) return;

    const roman = sectionRoman[currentSectionIdx] || `${currentSectionIdx + 1}`;
    currentSectionIdx++;

    code += `\n= ${roman}、${label}（${desc}）\n\n`;

    list.forEach((q) => {
      const qNum = questionIndex++;
      const stemTypst = convertLatexToTypst(q.stem_raw || q.stem_html || '').trim();
      const spaceHeight = getSpaceHeight(q.type, config.writingSpace);
      const isBreakable = q.type === 'calc' || q.type === 'proof' ? 'false' : 'true';

      code += `#block(width: 100%, breakable: ${isBreakable})[\n`;
      code += `  *${qNum}.* #h(0.35em) ${stemTypst}\n`;

      if (q.type === 'choice' && q.options && q.options.length > 0) {
        const maxOptLen = Math.max(
          ...q.options.map((o) => (o.text_raw || o.text_html || '').length)
        );
        const optCols = maxOptLen > 24 ? 1 : maxOptLen > 11 ? 2 : 4;

        const choiceItems = q.options.map((opt) => formatChoiceItem(opt.text_raw || opt.text_html || ''));
        code += `\n  #choice(\n`;
        choiceItems.forEach((item) => {
          code += `    ${item},\n`;
        });
        code += `    columns: ${optCols},\n`;
        code += `  )\n`;
      }

      if (spaceHeight > 0) {
        code += `  #v(${spaceHeight}cm)\n`;
      } else {
        code += `  #v(0.6em)\n`;
      }

      code += `]\n\n`;
    });
  });

  if (config.answerPlacement === 'appendix') {
    code += `
// -------------------------------------------------------------------------
// 参考答案与提示 (Solutions & Hints)
// -------------------------------------------------------------------------
#pagebreak()

#align(center)[
  #v(0.4em)
  #text(font: ${fontHeading}, size: 14pt, weight: "bold")[参考答案与提示]
  #v(0.5em)
  #line(length: 100%, stroke: 0.4pt + rgb("#333333"))
  #v(0.5em)
]

#text(font: ${fontHeading}, size: 10pt, weight: "bold")[一、参考答案速查]
#v(0.3em)

#align(center)[
  #table(
    columns: (32pt, 1fr, 32pt, 1fr),
    align: (center + horizon, left + horizon, center + horizon, left + horizon),
    stroke: none,
    table.hline(stroke: 0.8pt),
    table.header([*题号*], [*答案*], [*题号*], [*答案*]),
    table.hline(stroke: 0.4pt),
`;

    const half = Math.ceil(questions.length / 2);
    for (let i = 0; i < half; i++) {
      const q1 = questions[i];
      const q1Ans = convertLatexToTypst(q1.answer || '略').replace(/\n+/g, ' ');
      const q2 = questions[i + half];
      const q2Ans = q2 ? convertLatexToTypst(q2.answer || '略').replace(/\n+/g, ' ') : '';
      const q2Num = q2 ? `${i + half + 1}` : '';

      code += `    [${i + 1}], [${q1Ans}], [${q2Num}], [${q2Ans}],\n`;
    }

    code += `    table.hline(stroke: 0.8pt),
  )
]
#v(1.0em)

#text(font: ${fontHeading}, size: 10pt, weight: "bold")[二、详细推导与证明]
#v(0.4em)
`;

    let qIdx = 1;
    questions.forEach((q) => {
      const num = qIdx++;
      const hasSteps = Boolean(q.steps_raw || q.hints_raw || q.steps_html || q.hints_html);
      if (q.type === 'choice' && !hasSteps) return;

      const ansTypst = convertLatexToTypst(q.answer || '').trim();
      const rawSteps = q.steps_raw || q.hints_raw || '';
      const fallbackSteps = q.steps_html || q.hints_html || '';
      const stepsTypst = convertLatexToTypst(rawSteps || fallbackSteps).trim();
      const isProof = q.type === 'proof';

      code += `#block(width: 100%, breakable: true)[\n`;
      code += `  *${num}.* #h(0.3em) ${isProof ? '*【证】*' : '*【解】*'} `;
      if (ansTypst && !isProof) {
        code += `${ansTypst} \\ `;
      }
      if (stepsTypst) {
        code += `\n  ${stepsTypst}\n`;
      }
      code += `]\n#v(0.8em)\n\n`;
    });
  }

  return code;
}
