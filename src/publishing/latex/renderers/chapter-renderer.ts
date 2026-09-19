import type {
  ChapterDocument,
  SemanticBlock,
  SemanticTableData,
  SemanticFigureData,
  SemanticListData,
} from '../../../types/chapter-semantic';
import {
  type ChapterExportSettings,
  type ImageSizingPolicy,
  DEFAULT_CHAPTER_EXPORT_SETTINGS,
  DEFAULT_IMAGE_POLICY,
} from '../../common/export-settings.ts';
import {
  formatLatexContent,
  stripLeadingNumber,
  stripTheoremPrefix,
  formatHeadingLatex,
  escapeLatexMeta,
  cleanMathFormula,
} from '../core/clean-math';

export type ChapterLatexConfig = ChapterExportSettings;
export const DEFAULT_CHAPTER_LATEX_CONFIG: ChapterLatexConfig & { embedStyle?: boolean; styleSource?: string } = {
  ...DEFAULT_CHAPTER_EXPORT_SETTINGS,
  embedStyle: false,
};

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

export function renderLatexList(listData: SemanticListData, config: ChapterLatexConfig, inBox = false): string {
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

export const generateChapterLatexDocument = renderChapterLatexDocument;
