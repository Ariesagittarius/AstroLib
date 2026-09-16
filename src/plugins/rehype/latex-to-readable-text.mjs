/**
 * latex-to-readable-text.mjs
 * ============================================================================
 * 轻量纯净的 LaTeX 数学公式文本自愈转换器（面向 Chrome 侧边栏阅读模式）
 *
 * 核心设计目标：
 * 1. 在 Chrome 阅读模式等无宿主外部 CSS 的沙箱视图中，为公式提供优雅规整的可读文本呈现；
 * 2. 避免 KaTeX 原版无 CSS 时分子分母重叠、分数线丢失、字符坍塌；
 * 3. 避免 MathML 导致的 HTML 页面体积翻倍膨胀，严格遵守 output: 'html' 性能约束；
 * 4. 零外部运行时依赖，构建期统一在 .katex 根节点注入 .sr-only 文本；
 * 5. 规范使用标准 Unicode 数学符号与上下标，天然兼容 Google TTS 语音发音。
 * ============================================================================
 */

const SYMBOL_MAP = {
  '\\in': '∈',
  '\\notin': '∉',
  '\\subset': '⊂',
  '\\subseteq': '⊆',
  '\\supset': '⊃',
  '\\supseteq': '⊇',
  '\\subsetneq': '⊊',
  '\\cup': '∪',
  '\\cap': '∩',
  '\\setminus': '∖',
  '\\varnothing': '∅',
  '\\emptyset': '∅',
  '\\forall': '∀',
  '\\exists': '∃',
  '\\mid': '|',

  // 常用数集
  '\\mathbb{R}': 'ℝ',
  '\\mathbb{N}': 'ℕ',
  '\\mathbb{Z}': 'ℤ',
  '\\mathbb{Q}': 'ℚ',
  '\\mathbb{C}': 'ℂ',

  // 关系与运算
  '\\le': '≤',
  '\\leq': '≤',
  '\\ge': '≥',
  '\\geq': '≥',
  '\\neq': '≠',
  '\\ne': '≠',
  '\\approx': '≈',
  '\\equiv': '≡',
  '\\sim': '∼',
  '\\times': '×',
  '\\cdot': '·',
  '\\div': '÷',
  '\\pm': '±',
  '\\mp': '∓',
  '\\to': '→',
  '\\rightarrow': '→',
  '\\leftarrow': '←',
  '\\Rightarrow': '⇒',
  '\\Leftarrow': '⇐',
  '\\Leftrightarrow': '⇔',
  '\\cdots': '…',
  '\\ldots': '…',
  '\\dots': '…',

  // 高等数学符号
  '\\infty': '∞',
  '\\partial': '∂',
  '\\nabla': '∇',
  '\\int': '∫',
  '\\sum': '∑',
  '\\prod': '∏',
  '\\lim': 'lim',

  // 希腊字母
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
  '\\sigma': 'σ',
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
  '\\Phi': 'Φ',
  '\\Psi': 'Ψ',
  '\\Omega': 'Ω',
};

const SUPERSCRIPT_MAP = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
  '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾',
  'n': 'ⁿ', 'i': 'ⁱ', 'x': 'ˣ', 'y': 'ʸ'
};

const SUBSCRIPT_MAP = {
  '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
  '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
  '+': '₊', '-': '₋', '=': '₌', '(': '₍', ')': '₎',
  'a': 'ₐ', 'e': 'ₑ', 'h': 'ₕ', 'i': 'ᵢ', 'j': 'ⱼ',
  'k': 'ₖ', 'l': 'ₗ', 'm': 'ₘ', 'n': 'ₙ', 'o': 'ₒ',
  'p': 'ₚ', 'r': 'ᵣ', 's': 'ₛ', 't': 'ₜ', 'u': 'ᵤ',
  'v': 'ᵥ', 'x': 'ₓ'
};

const SORTED_SYMBOLS = Object.entries(SYMBOL_MAP).sort((a, b) => b[0].length - a[0].length);

/**
 * 将 LaTeX 字符串转换为自然紧凑、无样式依赖的纯文本数学表示
 * @param {string} latex - 原始 LaTeX 代码
 * @returns {string} 净化后的纯文本表示
 */
export function latexToReadableText(latex) {
  if (!latex || typeof latex !== 'string') return '';

  let s = latex.trim();

  // 1. 规范化空格与换行
  s = s.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ');

  // 2. 保护字面集合花括号 \{ 和 \}
  s = s.replace(/\\\{/g, '\uE000').replace(/\\\}/g, '\uE001');

  // 3. 提取 \tag{...} 编号并后置
  let tag = '';
  s = s.replace(/\\tag\{([^}]+)\}/g, (_, t) => {
    tag = ` (${t.trim()})`;
    return '';
  });

  // 4. 去除排版环境包裹 \begin{...} \end{...}
  s = s.replace(/\\begin\{[a-zA-Z*]+\}/g, '');
  s = s.replace(/\\end\{[a-zA-Z*]+\}/g, '');

  // 5. 去除格式指令与排版空隙标记
  s = s.replace(/\\(left|right|big|Big|bigg|Bigg)[lr]?/g, '');
  s = s.replace(/\\(text|mathrm|mathbf|boldsymbol|mathit|textbf|sf|tt)\{([^}]+)\}/g, '$2');
  s = s.replace(/\\([,;!]|quad|qquad|enspace|space)/g, ' ');

  // 6. 常见分式与根式简化 (支持两层以内递归替换)
  for (let i = 0; i < 2; i++) {
    s = s.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '($1)/($2)');
    s = s.replace(/\\sqrt\[([^{}]+)\]\{([^{}]+)\}/g, '$1√($2)');
    s = s.replace(/\\sqrt\{([^{}]+)\}/g, '√($1)');
  }
  // 如果括号内是单个标识符，消除冗余外层括号: (a)/(b) -> a/b
  s = s.replace(/\(([a-zA-Z0-9α-ωΑ-Ω])\)\/\(([a-zA-Z0-9α-ωΑ-Ω])\)/g, '$1/$2');

  // 7. 集合论、逻辑、算符及希腊字母置换（按命令长度倒序，避免前缀误截断）
  for (const [cmd, sym] of SORTED_SYMBOLS) {
    s = s.replaceAll(cmd, sym);
  }

  // 8. 常用单字符上下标转为 Unicode 原生字符
  s = s.replace(/\^\{?([0-9a-z+-])\}?/g, (match, char) => {
    return SUPERSCRIPT_MAP[char] || match;
  });
  s = s.replace(/_\{?([0-9a-z])\}?/g, (match, char) => {
    return SUBSCRIPT_MAP[char] || match;
  });

  // 复杂上下标降级保留清晰写法：如 x_{n+1} -> x_(n+1)
  s = s.replace(/_\{([^}]+)\}/g, '_($1)');
  s = s.replace(/\^\{([^}]+)\}/g, '^($1)');

  // 9. 清理遗留反斜杠与普通花括号（恢复字面花括号）
  s = s.replace(/\\([a-zA-Z]+)/g, '$1');
  s = s.replace(/\\/g, '');
  s = s.replace(/[{}]/g, '');
  s = s.replace(/\uE000/g, '{').replace(/\uE001/g, '}');

  // 10. 归一化连续空格与标点间隙
  s = s.replace(/\s+/g, ' ').trim();

  return (s + tag).trim();
}
