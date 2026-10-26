export const EXERCISE_KATEX_OPTIONS = {
  delimiters: [
    { left: '$$', right: '$$', display: true },
    { left: '$', right: '$', display: false },
    { left: '\\[', right: '\\]', display: true },
    { left: '\\(', right: '\\)', display: false },
  ],
  throwOnError: false,
  errorColor: '#cc0000',
  strict: false,
  trust: true,
  macros: {
    '\\dif': '\\mathrm{d}',
    '\\e': '\\mathrm{e}',
    '\\i': '\\mathrm{i}',
    '\\R': '\\mathbb{R}',
    '\\N': '\\mathbb{N}',
    '\\Z': '\\mathbb{Z}',
    '\\C': '\\mathbb{C}',
    '\\iint': '\\int\\!\\!\\int',
    '\\iiint': '\\int\\!\\!\\int\\!\\!\\int',
    '\\iiiint': '\\int\\!\\!\\int\\!\\!\\int\\!\\!\\int',
    '\\overparen': '\\stackrel{\\frown}{#1}',
    '\\wideparen': '\\stackrel{\\frown}{#1}',
  },
};

const REPAIRABLE_LATEX_ENVS = [
  'aligned',
  'align',
  'cases',
  'matrix',
  'pmatrix',
  'bmatrix',
  'vmatrix',
  'Vmatrix',
  'gather',
  'gathered',
  'split',
  'array',
];

function healUnclosedMath(text: string): string {
  let healed = text;

  for (const env of REPAIRABLE_LATEX_ENVS) {
    const beginRegex = new RegExp(`\\\\begin\\{${env}\\}`, 'g');
    const endRegex = new RegExp(`\\\\end\\{${env}\\}`, 'g');
    const beginCount = (healed.match(beginRegex) || []).length;
    const endCount = (healed.match(endRegex) || []).length;
    if (beginCount > endCount) {
      const diff = beginCount - endCount;
      for (let k = 0; k < diff; k++) {
        healed += `\n\\end{${env}}`;
      }
    }
  }

  const openBracketCount = (healed.match(/\\\[/g) || []).length;
  const closeBracketCount = (healed.match(/\\\]/g) || []).length;
  if (openBracketCount > closeBracketCount) {
    healed += '\n\\]';
  }

  const openParenCount = (healed.match(/\\\(/g) || []).length;
  const closeParenCount = (healed.match(/\\\)/g) || []).length;
  if (openParenCount > closeParenCount) {
    healed += '\\)';
  }

  const doubleDollarCount = (healed.match(/\$\$/g) || []).length;
  if (doubleDollarCount % 2 !== 0) {
    healed += '\n$$';
  }

  return healed;
}

export function renderInlineStyle(text: string): string {
  if (!text) return '';
  return text

    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+)__/g, '<strong>$1</strong>')

    .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>')

    .replace(/`([^`]+)`/g, '<code class="ex-ai-inline-code">$1</code>')

    .replace(/~~([^~]+)~~/g, '<del>$1</del>');
}

export function renderAcademicSolutionMarkdown(md: string, isStreaming = false): string {
  if (!md) return '<div class="ex-ai-placeholder">正在调用学术模型进行规范推导演算...</div>';

  let safe = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  safe = healUnclosedMath(safe);

  safe = safe.replace(/\\\[([\s\S]*?)\\\]/g, (_m, inner) => `\n$$\n${inner.trim()}\n$$\n`);
  safe = safe.replace(/\\\(([\s\S]*?)\\\)/g, (_m, inner) => `$${inner.trim()}$`);

  const mathBlocks: string[] = [];

  safe = safe.replace(/\$\$([\s\S]*?)\$\$/g, (_m, inner) => {
    mathBlocks.push(`$$${inner}$$`);
    return `___MATH_BLOCK_${mathBlocks.length - 1}___`;
  });

  safe = safe.replace(/\$([^\$\n]+?)\$/g, (_m, inner) => {
    mathBlocks.push(`$${inner}$`);
    return `___MATH_BLOCK_${mathBlocks.length - 1}___`;
  });

  const lines = safe.split(/\r?\n/);
  const out: string[] = [];
  let inCode = false;
  let codeBuf: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (/^```/.test(line)) {
      if (inCode) {
        out.push(`<pre class="ex-ai-code-block"><code>${codeBuf.join('\n')}</code></pre>`);
        codeBuf = [];
        inCode = false;
      } else {
        inCode = true;
      }
      continue;
    }
    if (inCode) {
      codeBuf.push(line);
      continue;
    }

    if (/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      out.push('<hr class="ex-ai-divider" />');
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const title = headingMatch[2];

      const tagLevel = Math.min(Math.max(level + 1, 4), 6);
      out.push(`<h${tagLevel} class="ex-ai-heading ex-ai-h${tagLevel}">${renderInlineStyle(title)}</h${tagLevel}>`);
      continue;
    }

    if (/^\s*&gt;\s?(.*)$/.test(line) || /^\s*>\s?(.*)$/.test(line)) {
      const quoteText = line.replace(/^\s*(?:&gt;|>)\s?/, '');
      out.push(`<blockquote class="ex-ai-quote">${renderInlineStyle(quoteText)}</blockquote>`);
      continue;
    }

    const ulMatch = line.match(/^\s*[-*+]\s+(.*)$/);
    if (ulMatch) {
      out.push(`<ul><li>${renderInlineStyle(ulMatch[1])}</li></ul>`);
      continue;
    }

    const olMatch = line.match(/^\s*(\d+)[.)]\s+(.*)$/);
    if (olMatch) {
      out.push(`<ol><li>${renderInlineStyle(olMatch[2])}</li></ol>`);
      continue;
    }

    if (line.trim() === '') {
      continue;
    }

    out.push(`<p>${renderInlineStyle(line)}</p>`);
  }

  if (inCode && codeBuf.length) {
    out.push(`<pre class="ex-ai-code-block"><code>${codeBuf.join('\n')}</code></pre>`);
  }

  let html = out.join('\n');

  html = html.replace(/<\/ul>\s*<ul>/g, '');
  html = html.replace(/<\/ol>\s*<ol>/g, '');

  html = html.replace(/<\/blockquote>\s*<blockquote class="ex-ai-quote">/g, '<br/>');

  html = html.replace(/___MATH_BLOCK_(\d+)___/g, (_m, idx) => {
    return mathBlocks[parseInt(idx, 10)] || '';
  });

  return html;
}
