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

  '\\mathbb{R}': 'ℝ',
  '\\mathbb{N}': 'ℕ',
  '\\mathbb{Z}': 'ℤ',
  '\\mathbb{Q}': 'ℚ',
  '\\mathbb{C}': 'ℂ',

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

  '\\infty': '∞',
  '\\partial': '∂',
  '\\nabla': '∇',
  '\\int': '∫',
  '\\sum': '∑',
  '\\prod': '∏',
  '\\lim': 'lim',

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

export function latexToReadableText(latex) {
  if (!latex || typeof latex !== 'string') return '';

  let s = latex.trim();

  s = s.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ');

  s = s.replace(/\\\{/g, '\uE000').replace(/\\\}/g, '\uE001');

  let tag = '';
  s = s.replace(/\\tag\{([^}]+)\}/g, (_, t) => {
    tag = ` (${t.trim()})`;
    return '';
  });

  s = s.replace(/\\begin\{[a-zA-Z*]+\}/g, '');
  s = s.replace(/\\end\{[a-zA-Z*]+\}/g, '');

  s = s.replace(/\\(left|right|big|Big|bigg|Bigg)[lr]?/g, '');
  s = s.replace(/\\(text|mathrm|mathbf|boldsymbol|mathit|textbf|sf|tt)\{([^}]+)\}/g, '$2');
  s = s.replace(/\\([,;!]|quad|qquad|enspace|space)/g, ' ');

  for (let i = 0; i < 2; i++) {
    s = s.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '($1)/($2)');
    s = s.replace(/\\sqrt\[([^{}]+)\]\{([^{}]+)\}/g, '$1√($2)');
    s = s.replace(/\\sqrt\{([^{}]+)\}/g, '√($1)');
  }

  s = s.replace(/\(([a-zA-Z0-9α-ωΑ-Ω])\)\/\(([a-zA-Z0-9α-ωΑ-Ω])\)/g, '$1/$2');

  for (const [cmd, sym] of SORTED_SYMBOLS) {
    s = s.replaceAll(cmd, sym);
  }

  s = s.replace(/\^\{?([0-9a-z+-])\}?/g, (match, char) => {
    return SUPERSCRIPT_MAP[char] || match;
  });
  s = s.replace(/_\{?([0-9a-z])\}?/g, (match, char) => {
    return SUBSCRIPT_MAP[char] || match;
  });

  s = s.replace(/_\{([^}]+)\}/g, '_($1)');
  s = s.replace(/\^\{([^}]+)\}/g, '^($1)');

  s = s.replace(/\\([a-zA-Z]+)/g, '$1');
  s = s.replace(/\\/g, '');
  s = s.replace(/[{}]/g, '');
  s = s.replace(/\uE000/g, '{').replace(/\uE001/g, '}');

  s = s.replace(/\s+/g, ' ').trim();

  return (s + tag).trim();
}
