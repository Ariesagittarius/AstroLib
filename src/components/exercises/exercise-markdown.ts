/**
 * src/components/exercises/exercise-markdown.ts
 * 课后习题专属高保真学术 Markdown & KaTeX 容错排版引擎
 *
 * 核心特性：
 * 1. 严格数学公式占位保护（防止公式内部下划线、星号被错误解析为 Markdown）；
 * 2. 截断自愈机制（未闭合的 aligned/cases 等 LaTeX 环境以及未闭合的 $$ / $ 自动闭合）；
 * 3. 完整 Markdown 语义支持（h1~h6 标题、分割线 ---、块引用 >、有序/无序列表、加粗、斜体、代码）；
 * 4. 统一定义 KaTeX 配置与数学宏（\\dif, \\e, \\i, \\R, \\N, 积分号等）。
 */

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

/**
 * 常见需要配对闭合的 LaTeX 数学环境列表（按嵌套栈后进先出修复）
 */
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

/**
 * 智能自愈未闭合的 LaTeX 环境与数学界定符（流式截断或意外提前终止时启动）
 */
function healUnclosedMath(text: string): string {
  let healed = text;

  // 1. 补齐未闭合的 LaTeX 原生环境（如 \begin{aligned}）
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

  // 2. 补齐未闭合的 \\[ 与 \\]
  const openBracketCount = (healed.match(/\\\[/g) || []).length;
  const closeBracketCount = (healed.match(/\\\]/g) || []).length;
  if (openBracketCount > closeBracketCount) {
    healed += '\n\\]';
  }

  // 3. 补齐未闭合的 \\( 与 \\)
  const openParenCount = (healed.match(/\\\(/g) || []).length;
  const closeParenCount = (healed.match(/\\\)/g) || []).length;
  if (openParenCount > closeParenCount) {
    healed += '\\)';
  }

  // 4. 补齐未闭合的 $$ (奇数个双美元符)
  const doubleDollarCount = (healed.match(/\$\$/g) || []).length;
  if (doubleDollarCount % 2 !== 0) {
    healed += '\n$$';
  }

  return healed;
}

/**
 * 行内 Markdown 样式渲染器（加粗、斜体、代码、删除线）
 */
export function renderInlineStyle(text: string): string {
  if (!text) return '';
  return text
    // 加粗：**bold** 或 __bold__
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+)__/g, '<strong>$1</strong>')
    // 斜体：*italic*（避免吞入加粗标记）
    .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>')
    // 行内等宽代码：`code`
    .replace(/`([^`]+)`/g, '<code class="ex-ai-inline-code">$1</code>')
    // 删除线：~~strike~~
    .replace(/~~([^~]+)~~/g, '<del>$1</del>');
}

/**
 * 课后习题专属高保真学术 Markdown 核心解析函数
 * @param md 原始 Markdown 字符串
 * @param isStreaming 是否处于流式生成中（流式中会主动开启动态截断保护）
 */
export function renderAcademicSolutionMarkdown(md: string, isStreaming = false): string {
  if (!md) return '<div class="ex-ai-placeholder">正在调用学术模型进行规范推导演算...</div>';

  // 基础 HTML 实体转义
  let safe = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // 前置公式修复：无论是否 streaming，均做一次截断自愈检查
  safe = healUnclosedMath(safe);

  // 原生 LaTeX 界定符归一化
  safe = safe.replace(/\\\[([\s\S]*?)\\\]/g, (_m, inner) => `\n$$\n${inner.trim()}\n$$\n`);
  safe = safe.replace(/\\\(([\s\S]*?)\\\)/g, (_m, inner) => `$${inner.trim()}$`);

  // 提取数学公式至占位符，防止公式中的下划线/乘号被 Markdown 解析器污染
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

    // 代码块解析
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

    // 分割线支持：---, ***, ___ (至少 3 个)
    if (/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      out.push('<hr class="ex-ai-divider" />');
      continue;
    }

    // 标题支持：# 至 ###### (h1 ~ h6)
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const title = headingMatch[2];
      // 映射到 h4 ~ h6 以适配卡片与浮窗容器层级
      const tagLevel = Math.min(Math.max(level + 1, 4), 6);
      out.push(`<h${tagLevel} class="ex-ai-heading ex-ai-h${tagLevel}">${renderInlineStyle(title)}</h${tagLevel}>`);
      continue;
    }

    // 块引用支持：> text
    if (/^\s*&gt;\s?(.*)$/.test(line) || /^\s*>\s?(.*)$/.test(line)) {
      const quoteText = line.replace(/^\s*(?:&gt;|>)\s?/, '');
      out.push(`<blockquote class="ex-ai-quote">${renderInlineStyle(quoteText)}</blockquote>`);
      continue;
    }

    // 无序列表：- item, * item, + item
    const ulMatch = line.match(/^\s*[-*+]\s+(.*)$/);
    if (ulMatch) {
      out.push(`<ul><li>${renderInlineStyle(ulMatch[1])}</li></ul>`);
      continue;
    }

    // 有序列表：1. item, 1) item
    const olMatch = line.match(/^\s*(\d+)[.)]\s+(.*)$/);
    if (olMatch) {
      out.push(`<ol><li>${renderInlineStyle(olMatch[2])}</li></ol>`);
      continue;
    }

    // 空行过滤
    if (line.trim() === '') {
      continue;
    }

    // 普通段落
    out.push(`<p>${renderInlineStyle(line)}</p>`);
  }

  if (inCode && codeBuf.length) {
    out.push(`<pre class="ex-ai-code-block"><code>${codeBuf.join('\n')}</code></pre>`);
  }

  let html = out.join('\n');

  // 缝合相邻的 <ul> 和 <ol>
  html = html.replace(/<\/ul>\s*<ul>/g, '');
  html = html.replace(/<\/ol>\s*<ol>/g, '');

  // 缝合相邻的 <blockquote>
  html = html.replace(/<\/blockquote>\s*<blockquote class="ex-ai-quote">/g, '<br/>');

  // 安全还原所有数学公式占位符
  html = html.replace(/___MATH_BLOCK_(\d+)___/g, (_m, idx) => {
    return mathBlocks[parseInt(idx, 10)] || '';
  });

  return html;
}
