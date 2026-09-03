import type { SlimQuestionItem } from '../../components/exercises/exercise-controller';

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

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

const TYPST_MATH_KEYWORDS = new Set([

  'sin', 'cos', 'tan', 'cot', 'sec', 'csc',
  'arcsin', 'arccos', 'arctan', 'arccot',
  'sinh', 'cosh', 'tanh', 'coth', 'sech', 'csch',

  'exp', 'log', 'ln', 'lg', 'sqrt', 'root',

  'lim', 'sum', 'product', 'integral', 'dif', 'partial', 'nabla',
  'rot', 'grad', 'div', 'curl', 'det', 'dim', 'ker', 'hom', 'gcd', 'lcm',
  'min', 'max', 'sup', 'inf', 'mod', 'deg', 'arg', 'Re', 'Im',

  'alpha', 'beta', 'gamma', 'Gamma', 'delta', 'Delta',
  'epsilon', 'zeta', 'eta', 'theta', 'Theta', 'iota', 'kappa',
  'lambda', 'Lambda', 'mu', 'nu', 'xi', 'Xi', 'omicron',
  'pi', 'Pi', 'rho', 'sigma', 'Sigma', 'tau', 'upsilon', 'Upsilon',
  'phi', 'Phi', 'chi', 'psi', 'Psi', 'omega', 'Omega',

  'cases', 'mat', 'vec', 'binom', 'bold', 'italic', 'serif', 'sans', 'cal', 'frak', 'mono', 'bb',
  'overline', 'underline', 'hat', 'tilde', 'dot', 'dot.double', 'breve', 'paren', 'bracket', 'brace',
  'abs', 'norm', 'floor', 'ceil', 'round', 'attach', 'scripts', 'limits', 'display', 'inline', 'stretch',
  'dfrac', 'frac',

  'RR', 'NN', 'ZZ', 'QQ', 'CC', 'PP', 'HH', 'OO', 'e', 'i', 'infinity',

  'eq.not', 'lt.eq', 'gt.eq', 'lt.eq.slant', 'gt.eq.slant', 'subset.eq', 'supset.eq', 'in.not',
  'emptyset', 'inter', 'union', 'without', 'perp', 'parallel', 'triangle', 'angle',
  'times', 'div', 'cdot', 'equiv', 'approx', 'tilde', 'subset', 'supset', 'in', 'forall', 'exists',
  'quad', 'wide', 'thin', 'med', 'thick', 'degree', 'prime',
  'and', 'or', 'not', 'models', 'diamond', 'square', 'circle.small',
  'delim', 'columns', 'row-gutter', 'column-gutter', 'align', 'stroke', 'fill', 'box', 'line', 'text', 'h', 'v'
]);

function extractBracedGroup(str: string, startIndex: number): { content: string; endIndex: number } | null {
  if (str[startIndex] !== '{') return null;
  let depth = 0;
  let i = startIndex;
  while (i < str.length) {
    const ch = str[i];
    if (ch === '\\' && i + 1 < str.length) {
      i += 2;
      continue;
    }
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        return { content: str.slice(startIndex + 1, i), endIndex: i };
      }
    }
    i++;
  }
  return null;
}

function extractBracketGroup(str: string, startIndex: number): { content: string; endIndex: number } | null {
  if (str[startIndex] !== '[') return null;
  let depth = 0;
  let i = startIndex;
  while (i < str.length) {
    const ch = str[i];
    if (ch === '\\' && i + 1 < str.length) {
      i += 2;
      continue;
    }
    if (ch === '[') depth++;
    else if (ch === ']') {
      depth--;
      if (depth === 0) {
        return { content: str.slice(startIndex + 1, i), endIndex: i };
      }
    }
    i++;
  }
  return null;
}

function fixMathIdentifiers(math: string): string {

  const strPhs: string[] = [];
  let s = math.replace(/"([^"\\]|\\.)*"/g, (m) => {
    const ph = `§§STR${strPhs.length}§§`;
    strPhs.push(m);
    return ph;
  });

  const dotPhs: string[] = [];
  s = s.replace(/[a-zA-Z]+(?:\.[a-zA-Z]+)+/g, (m) => {
    const ph = `§§DOT${dotPhs.length}§§`;
    dotPhs.push(m);
    return ph;
  });

  s = s.replace(/\bxOy\b/g, '"xOy"');
  s = s.replace(/\bxOz\b/g, '"xOz"');
  s = s.replace(/\byOz\b/g, '"yOz"');

  s = s.replace(/\b(d)([xyztsruvS])(?:_([0-9a-zA-Z]+|\([^)]+\)))?\b/g, (_m, _d, v, sub) => {
    return sub ? `"d"${v}_${sub}` : `"d"${v}`;
  });
  s = s.replace(/\b(d)(theta|phi|alpha|beta|gamma|xi|eta|rho)\b/g, '"d" $2');

  s = s.replace(/([a-zA-Z]{2,})_([0-9a-zA-Z]+|\([^)]+\))/g, (_m, vars, sub) => {
    if (TYPST_MATH_KEYWORDS.has(vars)) return `${vars}_${sub}`;
    return `${vars.split('').join(' ')}_${sub}`;
  });

  s = s.replace(/_([0-9a-zA-Z]+)([a-zA-Z]+)/g, (_m, sub, nextLetters) => {
    return `_(${sub}) ${nextLetters.split('').join(' ')}`;
  });

  s = s.replace(/\b[a-zA-Z0-9]+\b/g, (token) => {
    if (token.startsWith('§§STR') || token.startsWith('§§DOT') || token.startsWith('§§TXT')) return token;
    if (TYPST_MATH_KEYWORDS.has(token)) return token;
    if (/^\d+$/.test(token)) return token;
    if (/^[a-zA-Z]$/.test(token)) return token;
    if (/^\d+[a-zA-Z]$/.test(token)) return token;
    if (/^[a-zA-Z]\d+$/.test(token)) {
      return `${token[0]} ${token.slice(1)}`;
    }
    if (/^\d+[a-zA-Z]+$/.test(token)) {
      const m = token.match(/^(\d+)([a-zA-Z]+)$/);
      if (m) {
        return `${m[1]} ${m[2].split('').join(' ')}`;
      }
    }
    if (/^[a-zA-Z]+$/.test(token)) {
      return token.split('').join(' ');
    }
    return token;
  });

  s = s.replace(/§§DOT(\d+)§§/g, (_m, idx) => dotPhs[Number(idx)]);
  s = s.replace(/§§STR(\d+)§§/g, (_m, idx) => strPhs[Number(idx)]);

  return s;
}

export function convertLatexMathToTypst(mathLatex: string): string {
  if (!mathLatex) return '';
  let str = mathLatex.trim();

  str = str.replace(/^\$\$([\s\S]*)\$\$$/, '$1');
  str = str.replace(/^\$([\s\S]*)\$$/, '$1');
  str = str.replace(/^\\\(([\s\S]*)\\\)$/, '$1');
  str = str.replace(/^\\\[([\s\S]*)\\\]$/, '$1');

  str = str.replace(/\r\n/g, '\n');
  str = str.replace(/\/\//g, ' parallel ');

  str = str.replace(/^\s*(\^|_)/, '""$1');
  str = str.replace(/([+\-=<>(,;]|\bquad\b)\s*(\^|_)/g, '$1 ""$2');

  str = str.replace(/\\left\s*\./g, '');
  str = str.replace(/\\right\s*\./g, '');
  str = str.replace(/\\left\(/g, '(');
  str = str.replace(/\\right\)/g, ')');
  str = str.replace(/\\left\[/g, '[');
  str = str.replace(/\\right\]/g, ']');
  str = str.replace(/\\left\\\{/g, '\\{');
  str = str.replace(/\\right\\\}/g, '\\}');
  str = str.replace(/\\left\|/g, '|');
  str = str.replace(/\\right\|/g, '|');
  str = str.replace(/\\(bigg|Big|big)[lr]?\(/g, '(');
  str = str.replace(/\\(bigg|Big|big)[lr]?\)/g, ')');
  str = str.replace(/\\(bigg|Big|big)[lr]?\[/g, '[');
  str = str.replace(/\\(bigg|Big|big)[lr]?\]/g, ']');
  str = str.replace(/\\(bigg|Big|big)[lr]?\\\{/g, '\\{');
  str = str.replace(/\\(bigg|Big|big)[lr]?\\\}/g, '\\}');
  str = str.replace(/\\(bigg|Big|big)[lr]?\|/g, '|');

  const textPlaceholders: string[] = [];
  str = str.replace(/\\(text|mathrm|operatorname|mbox|textnormal|rm)\s*\{([^}]+)\}/g, (_m, _cmd, body) => {
    const ph = `§§TXT${textPlaceholders.length}§§`;
    textPlaceholders.push(`"${body.replace(/"/g, '\\"')}"`);
    return ` ${ph} `;
  });

  str = str.replace(/([\u4e00-\u9fa5\u3000-\u303f\uff01-\uff5e]+)/g, (_m, body) => {
    const ph = `§§TXT${textPlaceholders.length}§§`;
    textPlaceholders.push(`"${body.replace(/"/g, '\\"')}"`);
    return ` ${ph} `;
  });

  str = str.replace(/\\begin\{cases\}([\s\S]*?)\\end\{cases\}/g, (_m, body) => {
    const rows = body.trim().split(/\\\\/);
    const typstRows = rows
      .map((r: string) => {
        const cleanR = r.trim().replace(/&/g, ' quad ');
        return convertLatexMathToTypst(cleanR);
      })
      .filter(Boolean);
    return ` cases(${typstRows.join(', ')}) `;
  });

  const matrixEnvs = [
    { name: 'pmatrix', delim: '' },
    { name: 'bmatrix', delim: 'delim: "[", ' },
    { name: 'vmatrix', delim: 'delim: "|", ' },
    { name: 'matrix', delim: '' },
    { name: 'array', delim: '' },
    { name: 'aligned', delim: '' },
    { name: 'align', delim: '' },
  ];

  for (const env of matrixEnvs) {
    const re = new RegExp(`\\\\begin\\{${env.name}\\}(?:\\{[^}]*\\})?([\\s\\S]*?)\\\\end\\{${env.name}\\}`, 'g');
    str = str.replace(re, (_m, body) => {
      const rows = body.trim().split(/\\\\/).map((r: string) => {
        return r.split('&').map((c: string) => convertLatexMathToTypst(c.trim())).join(', ');
      }).filter((r: string) => r.trim().length > 0).join('; ');
      return ` mat(${env.delim}${rows}) `;
    });
  }

  let hasFrac = true;
  while (hasFrac) {
    const fracMatch = str.match(/\\(d|t)?frac\s*\{/);
    if (!fracMatch || fracMatch.index === undefined) {
      hasFrac = false;
      break;
    }
    const idx = fracMatch.index;
    const brace1Start = str.indexOf('{', idx);
    const g1 = extractBracedGroup(str, brace1Start);
    if (!g1) break;

    let brace2Start = g1.endIndex + 1;
    while (brace2Start < str.length && /\s/.test(str[brace2Start])) brace2Start++;
    if (str[brace2Start] !== '{') break;

    const g2 = extractBracedGroup(str, brace2Start);
    if (!g2) break;

    const num = convertLatexMathToTypst(g1.content);
    const den = convertLatexMathToTypst(g2.content);
    str = str.slice(0, idx) + ` dfrac(${num}, ${den}) ` + str.slice(g2.endIndex + 1);
  }

  str = str.replace(/\\binom\s*\{([^}]+)\}\s*\{([^}]+)\}/g, (_m, n, k) => {
    return ` binom(${convertLatexMathToTypst(n)}, ${convertLatexMathToTypst(k)}) `;
  });

  str = str.replace(/\\substack\s*\{([^}]+)\}/g, (_m, content) => {
    const parts = content.split(/\\\\/).map(p => convertLatexMathToTypst(p.trim())).join(', ');
    return ` (${parts}) `;
  });
  str = str.replace(/\\(stackrel|overset)\s*\{([^}]+)\}\s*\{([^}]+)\}/g, (_m, _cmd, top, bottom) => {
    return ` attach(${convertLatexMathToTypst(bottom)}, t: ${convertLatexMathToTypst(top)}) `;
  });
  str = str.replace(/\\underset\s*\{([^}]+)\}\s*\{([^}]+)\}/g, (_m, bottom, top) => {
    return ` attach(${convertLatexMathToTypst(top)}, b: ${convertLatexMathToTypst(bottom)}) `;
  });

  let hasSqrt = true;
  while (hasSqrt) {
    const sqrtMatch = str.match(/\\sqrt\s*(\[|\{)/);
    if (!sqrtMatch || sqrtMatch.index === undefined) {
      hasSqrt = false;
      break;
    }
    const idx = sqrtMatch.index;
    let curr = idx + 5;
    while (curr < str.length && /\s/.test(str[curr])) curr++;

    if (str[curr] === '[') {
      const opt = extractBracketGroup(str, curr);
      if (opt) {
        let bStart = opt.endIndex + 1;
        while (bStart < str.length && /\s/.test(str[bStart])) bStart++;
        if (str[bStart] === '{') {
          const body = extractBracedGroup(str, bStart);
          if (body) {
            const rootN = convertLatexMathToTypst(opt.content);
            const bodyTypst = convertLatexMathToTypst(body.content);
            str = str.slice(0, idx) + ` root(${rootN}, ${bodyTypst}) ` + str.slice(body.endIndex + 1);
            continue;
          }
        }
      }
    } else if (str[curr] === '{') {
      const body = extractBracedGroup(str, curr);
      if (body) {
        const bodyTypst = convertLatexMathToTypst(body.content);
        str = str.slice(0, idx) + ` sqrt(${bodyTypst}) ` + str.slice(body.endIndex + 1);
        continue;
      }
    }
    break;
  }

  str = str.replace(/\\(mathbf|boldsymbol|bm|vec)\s*\{([^}]+)\}/g, (_m, _cmd, body) => ` bold(${convertLatexMathToTypst(body)}) `);
  str = str.replace(/\\vec\s+([a-zA-Z])/g, ' bold($1) ');
  str = str.replace(/\\(mathbb)\s*\{([A-Z])\}/g, ' $2$2 ');
  str = str.replace(/\\(mathcal|mathscr|mathfrak)\s*\{([^}]+)\}/g, (_m, _cmd, body) => ` cal(${convertLatexMathToTypst(body)}) `);

  str = str.replace(/\\(overline|bar)\s*\{([^}]+)\}/g, (_m, _cmd, body) => ` overline(${convertLatexMathToTypst(body)}) `);
  str = str.replace(/\\(hat|widehat)\s*\{([^}]+)\}/g, (_m, _cmd, body) => ` hat(${convertLatexMathToTypst(body)}) `);
  str = str.replace(/\\(hat|widehat)\s+([a-zA-Z])/g, ' hat($2) ');
  str = str.replace(/\\(tilde|widetilde)\s*\{([^}]+)\}/g, (_m, _cmd, body) => ` tilde(${convertLatexMathToTypst(body)}) `);
  str = str.replace(/\\dot\s*\{([^}]+)\}/g, (_m, body) => ` dot(${convertLatexMathToTypst(body)}) `);
  str = str.replace(/\\ddot\s*\{([^}]+)\}/g, (_m, body) => ` dot.double(${convertLatexMathToTypst(body)}) `);
  str = str.replace(/\\breve\s*\{([^}]+)\}/g, (_m, body) => ` breve(${convertLatexMathToTypst(body)}) `);
  str = str.replace(/\\frown\s*\{([^}]+)\}/g, (_m, body) => ` hat(${convertLatexMathToTypst(body)}) `);

  str = str.replace(/\\R(?![a-zA-Z])/g, ' RR ');
  str = str.replace(/\\N(?![a-zA-Z])/g, ' NN ');
  str = str.replace(/\\Z(?![a-zA-Z])/g, ' ZZ ');
  str = str.replace(/\\C(?![a-zA-Z])/g, ' CC ');
  str = str.replace(/\\Q(?![a-zA-Z])/g, ' QQ ');

  str = str.replace(/\\(limits|nolimits)(?![a-zA-Z])/g, '');

  str = str.replace(/\\lim_\{([^}]+)\}/g, (_m, cond) => ` lim_(${convertLatexMathToTypst(cond)}) `);
  str = str.replace(/\\lim(?![a-zA-Z])/g, ' lim ');

  str = str.replace(/\\sum_\{([^}]+)\}\^\{([^}]+)\}/g, (_m, sub, sup) => ` sum_(${convertLatexMathToTypst(sub)})^(${convertLatexMathToTypst(sup)}) `);
  str = str.replace(/\\sum_\{([^}]+)\}/g, (_m, sub) => ` sum_(${convertLatexMathToTypst(sub)}) `);
  str = str.replace(/\\sum(?![a-zA-Z])/g, ' sum ');

  str = str.replace(/\\prod_\{([^}]+)\}\^\{([^}]+)\}/g, (_m, sub, sup) => ` product_(${convertLatexMathToTypst(sub)})^(${convertLatexMathToTypst(sup)}) `);
  str = str.replace(/\\prod(?![a-zA-Z])/g, ' product ');

  str = str.replace(/\\iiint_\{([^}]+)\}/g, (_m, s) => ` integral.triple_(${convertLatexMathToTypst(s)}) `);
  str = str.replace(/\\iint_\{([^}]+)\}/g, (_m, s) => ` integral.double_(${convertLatexMathToTypst(s)}) `);
  str = str.replace(/\\oiint_\{([^}]+)\}/g, (_m, s) => ` integral.cont_(${convertLatexMathToTypst(s)}) `);
  str = str.replace(/\\oint_\{([^}]+)\}/g, (_m, s) => ` integral.cont_(${convertLatexMathToTypst(s)}) `);
  str = str.replace(/\\iiint(?![a-zA-Z])/g, ' integral.triple ');
  str = str.replace(/\\iint(?![a-zA-Z])/g, ' integral.double ');
  str = str.replace(/\\oiint(?![a-zA-Z])|\\oint(?![a-zA-Z])/g, ' integral.cont ');

  str = str.replace(/\\int_\{([^}]+)\}\^\{([^}]+)\}/g, (_m, sub, sup) => ` integral_(${convertLatexMathToTypst(sub)})^(${convertLatexMathToTypst(sup)}) `);
  str = str.replace(/\\int_\{([^}]+)\}\^([0-9a-zA-Z])/g, (_m, sub, sup) => ` integral_(${convertLatexMathToTypst(sub)})^(${sup}) `);
  str = str.replace(/\\int_([0-9a-zA-Z])\^\{([^}]+)\}/g, (_m, sub, sup) => ` integral_(${sub})^(${convertLatexMathToTypst(sup)}) `);
  str = str.replace(/\\int_([0-9a-zA-Z])\^([0-9a-zA-Z])/g, (_m, sub, sup) => ` integral_(${sub})^(${sup}) `);
  str = str.replace(/\\int_\{([^}]+)\}/g, (_m, sub) => ` integral_(${convertLatexMathToTypst(sub)}) `);
  str = str.replace(/\\int_([0-9a-zA-Z])/g, (_m, sub) => ` integral_(${sub}) `);
  str = str.replace(/\\int(?![a-zA-Z])/g, ' integral ');

  const greekMap: Record<string, string> = {
    '\\alpha': 'alpha',
    '\\beta': 'beta',
    '\\gamma': 'gamma',
    '\\Gamma': 'Gamma',
    '\\delta': 'delta',
    '\\Delta': 'Delta',
    '\\varepsilon': 'epsilon.alt',
    '\\epsilon': 'epsilon',
    '\\zeta': 'zeta',
    '\\eta': 'eta',
    '\\vartheta': 'theta.alt',
    '\\theta': 'theta',
    '\\Theta': 'Theta',
    '\\iota': 'iota',
    '\\kappa': 'kappa',
    '\\lambda': 'lambda',
    '\\Lambda': 'Lambda',
    '\\mu': 'mu',
    '\\nu': 'nu',
    '\\xi': 'xi',
    '\\Xi': 'Xi',
    '\\varpi': 'pi.alt',
    '\\pi': 'pi',
    '\\Pi': 'Pi',
    '\\varrho': 'rho.alt',
    '\\rho': 'rho',
    '\\sigma': 'sigma',
    '\\Sigma': 'Sigma',
    '\\tau': 'tau',
    '\\upsilon': 'upsilon',
    '\\Upsilon': 'Upsilon',
    '\\varphi': 'phi.alt',
    '\\phi': 'phi',
    '\\Phi': 'Phi',
    '\\chi': 'chi',
    '\\psi': 'psi',
    '\\Psi': 'Psi',
    '\\omega': 'omega',
    '\\Omega': 'Omega',
  };

  for (const [tex, typ] of Object.entries(greekMap)) {
    const re = new RegExp(tex.replace('\\', '\\\\') + '(?![a-zA-Z])', 'g');
    str = str.replace(re, ` ${typ} `);
  }

  const symMap: Array<[RegExp, string]> = [
    [/\\to(?![a-zA-Z])|\\rightarrow(?![a-zA-Z])|\\longrightarrow(?![a-zA-Z])/g, ' -> '],
    [/\\leftarrow(?![a-zA-Z])|\\longleftarrow(?![a-zA-Z])/g, ' <- '],
    [/\\leftrightarrow(?![a-zA-Z])/g, ' <-> '],
    [/\\Rightarrow(?![a-zA-Z])|\\implies(?![a-zA-Z])/g, ' => '],
    [/\\Leftarrow(?![a-zA-Z])/g, ' <= '],
    [/\\Leftrightarrow(?![a-zA-Z])|\\iff(?![a-zA-Z])/g, ' <=> '],
    [/\\mapsto(?![a-zA-Z])/g, ' |-> '],
    [/\\leqslant(?![a-zA-Z])|\\le(?![a-zA-Z])|\\leq(?![a-zA-Z])/g, ' lt.eq.slant '],
    [/\\geqslant(?![a-zA-Z])|\\ge(?![a-zA-Z])|\\geq(?![a-zA-Z])/g, ' gt.eq.slant '],
    [/\\neq(?![a-zA-Z])|\\ne(?![a-zA-Z])/g, ' eq.not '],
    [/\\equiv(?![a-zA-Z])/g, ' equiv '],
    [/\\approx(?![a-zA-Z])/g, ' approx '],
    [/\\sim(?![a-zA-Z])/g, ' tilde '],
    [/\\pm(?![a-zA-Z])/g, ' plus.minus '],
    [/\\mp(?![a-zA-Z])/g, ' minus.plus '],
    [/\\times(?![a-zA-Z])/g, ' times '],
    [/\\div(?![a-zA-Z])/g, ' div '],
    [/\\cdot(?![a-zA-Z])/g, ' dot '],
    [/\\cap(?![a-zA-Z])|\\bigcap(?![a-zA-Z])/g, ' inter '],
    [/\\cup(?![a-zA-Z])|\\bigcup(?![a-zA-Z])/g, ' union '],
    [/\\setminus(?![a-zA-Z])|\\backslash(?![a-zA-Z])/g, ' without '],
    [/\\subset(?![a-zA-Z])/g, ' subset '],
    [/\\subseteq(?![a-zA-Z])/g, ' subset.eq '],
    [/\\supset(?![a-zA-Z])/g, ' supset '],
    [/\\supseteq(?![a-zA-Z])/g, ' supset.eq '],
    [/\\notin(?![a-zA-Z])|\\not\\in(?![a-zA-Z])/g, ' in.not '],
    [/\\in(?![a-zA-Z])/g, ' in '],
    [/\\emptyset(?![a-zA-Z])|\\varnothing(?![a-zA-Z])/g, ' emptyset '],
    [/\\infty(?![a-zA-Z])/g, ' infinity '],
    [/\\partial(?![a-zA-Z])/g, ' partial '],
    [/\\nabla(?![a-zA-Z])/g, ' nabla '],
    [/\\forall(?![a-zA-Z])/g, ' forall '],
    [/\\exists(?![a-zA-Z])/g, ' exists '],
    [/\\perp(?![a-zA-Z])/g, ' perp '],
    [/\\parallel(?![a-zA-Z])/g, ' parallel '],
    [/\\triangle(?![a-zA-Z])/g, ' triangle '],
    [/\\angle(?![a-zA-Z])/g, ' angle '],
    [/\\odot(?![a-zA-Z])/g, ' dot.o '],
    [/\\mid(?![a-zA-Z])/g, ' | '],
    [/\\cdots(?![a-zA-Z])|\\ldots(?![a-zA-Z])|\\dots(?![a-zA-Z])/g, ' ... '],
    [/\\vdots(?![a-zA-Z])/g, ' dots.v '],
    [/\\ddots(?![a-zA-Z])/g, ' dots.down '],
    [/\\degree(?![a-zA-Z])|\\^\\circ(?![a-zA-Z])|\\^\\{\\circ\\}/g, ' degree '],
    [/\\circ(?![a-zA-Z])/g, ' circle.small '],
    [/\\langle(?![a-zA-Z])/g, ' angle.l '],
    [/\\rangle(?![a-zA-Z])/g, ' angle.r '],
    [/\\wedge(?![a-zA-Z])|\\land(?![a-zA-Z])/g, ' and '],
    [/\\vee(?![a-zA-Z])|\\lor(?![a-zA-Z])/g, ' or '],
    [/\\neg(?![a-zA-Z])|\\lnot(?![a-zA-Z])/g, ' not '],
    [/\\top(?![a-zA-Z])/g, ' top '],
    [/\\vdash(?![a-zA-Z])|\\vDash(?![a-zA-Z])/g, ' models '],
    [/\\Diamond(?![a-zA-Z])/g, ' diamond '],
    [/\\Box(?![a-zA-Z])/g, ' square '],
    [/\\textcircled\{1\}/g, ' "①" '],
    [/\\textcircled\{2\}/g, ' "②" '],
    [/\\textcircled\{3\}/g, ' "③" '],
    [/\\textcircled\{4\}/g, ' "④" '],
  ];

  for (const [re, rep] of symMap) {
    str = str.replace(re, rep);
  }

  const funcs = [
    'sin', 'cos', 'tan', 'cot', 'sec', 'csc',
    'arcsin', 'arccos', 'arctan', 'arccot',
    'sinh', 'cosh', 'tanh', 'coth', 'sech', 'csch',
    'ln', 'log', 'lg', 'exp',
    'det', 'max', 'min', 'dim', 'ker', 'deg', 'gcd', 'lcm',
    'rot', 'grad', 'div', 'curl', 'arg', 'Re', 'Im',
  ];
  for (const f of funcs) {
    const re = new RegExp('\\\\' + f + '(?![a-zA-Z])', 'g');
    str = str.replace(re, ` ${f} `);
  }

  str = str.replace(/_\{([^}]+)\}/g, '(_$1_)').replace(/\(_/g, '_(').replace(/_\)/g, ')');
  str = str.replace(/\^\{([^}]+)\}/g, '(^$1^)').replace(/\(\^/g, '^(').replace(/\^\)/g, ')');

  str = str.replace(/\\qquad(?![a-zA-Z])/g, ' quad quad ');
  str = str.replace(/\\quad(?![a-zA-Z])/g, ' quad ');
  str = str.replace(/\\,|\\;|\\:|\\\s+/g, ' ');

  str = str.replace(/\\([a-zA-Z]+)/g, '$1');

  str = fixMathIdentifiers(str);

  str = str.replace(/§§TXT(\d+)§§/g, (_m, idx) => textPlaceholders[Number(idx)]);

  str = str.replace(/\s+/g, ' ').trim();

  return str;
}

export function tokenizeLatexText(raw: string): Array<{ type: 'text' | 'inline-math' | 'display-math'; content: string }> {
  const tokens: Array<{ type: 'text' | 'inline-math' | 'display-math'; content: string }> = [];
  let i = 0;
  const len = raw.length;

  while (i < len) {

    if (raw.startsWith('$$', i)) {
      const end = raw.indexOf('$$', i + 2);
      if (end !== -1) {
        tokens.push({ type: 'display-math', content: raw.slice(i + 2, end) });
        i = end + 2;
        continue;
      }
    }

    if (raw.startsWith('\\[', i)) {
      const end = raw.indexOf('\\]', i + 2);
      if (end !== -1) {
        tokens.push({ type: 'display-math', content: raw.slice(i + 2, end) });
        i = end + 2;
        continue;
      }
    }

    if (raw.startsWith('\\(', i)) {
      const end = raw.indexOf('\\)', i + 2);
      if (end !== -1) {
        tokens.push({ type: 'inline-math', content: raw.slice(i + 2, end) });
        i = end + 2;
        continue;
      }
    }

    if (raw[i] === '$' && (i === 0 || raw[i - 1] !== '\\')) {
      let end = i + 1;
      let found = false;
      while (end < len) {
        if (raw[end] === '$' && raw[end - 1] !== '\\') {
          found = true;
          break;
        }
        if (raw[end] === '\n' && raw[end + 1] === '\n') {
          break;
        }
        end++;
      }

      if (found) {
        const mathContent = raw.slice(i + 1, end);
        tokens.push({ type: 'inline-math', content: mathContent });
        i = end + 1;
        continue;
      } else {

        let autoEnd = i + 1;
        while (autoEnd < len && raw[autoEnd] !== '\n') {
          if (raw[autoEnd] === '$') break;
          autoEnd++;
        }
        const mathContent = raw.slice(i + 1, autoEnd);
        tokens.push({ type: 'inline-math', content: mathContent });
        i = autoEnd;
        continue;
      }
    }

    let nextSpecial = len;
    const nextDollar = raw.indexOf('$', i);
    const nextDisplay = raw.indexOf('$$', i);
    const nextSlashBracket = raw.indexOf('\\[', i);
    const nextSlashParen = raw.indexOf('\\(', i);

    [nextDollar, nextDisplay, nextSlashBracket, nextSlashParen].forEach(idx => {
      if (idx !== -1 && idx < nextSpecial) {
        nextSpecial = idx;
      }
    });

    const textChunk = raw.slice(i, nextSpecial);
    if (textChunk) {
      tokens.push({ type: 'text', content: textChunk });
    }
    i = nextSpecial;
  }

  return tokens;
}

export function convertLatexToTypst(text: string): string {
  if (!text) return '';

  let raw = decodeHtmlEntities(text);

  raw = raw.replace(/<br\s*\/?>/gi, '\n');
  raw = raw.replace(/<\/p>/gi, '\n\n');
  raw = raw.replace(/<p[^>]*>/gi, '');
  raw = raw.replace(/<span[^>]*>/gi, '');
  raw = raw.replace(/<\/span>/gi, '');
  raw = raw.replace(/<div[^>]*>/gi, '');
  raw = raw.replace(/<\/div>/gi, '\n');

  const tokens = tokenizeLatexText(raw);

  const resultChunks: string[] = [];

  for (const token of tokens) {
    if (token.type === 'display-math' || token.type === 'inline-math') {
      const rawMath = token.content;

      if (/\\underline\{[^}]*\}|_{3,}/.test(rawMath)) {
        const subparts = rawMath.split(/(\\underline\{[^}]*\}|_{3,})/g);
        const subOut: string[] = [];
        for (const sp of subparts) {
          if (!sp) continue;
          if (/^\\underline\{[^}]*\}$/.test(sp) || /^_{3,}$/.test(sp)) {
            subOut.push('#blank(5em)');
          } else {
            const cleanSp = sp.trim();
            if (cleanSp) {
              const typstMath = convertLatexMathToTypst(cleanSp);
              if (typstMath) {
                subOut.push(token.type === 'display-math' ? `\n$ ${typstMath} $\n` : `$${typstMath}$`);
              }
            }
          }
        }
        resultChunks.push(subOut.join(' '));
      } else {
        const typstMath = convertLatexMathToTypst(rawMath);
        if (token.type === 'display-math') {
          resultChunks.push(`\n$ ${typstMath} $\n`);
        } else {
          resultChunks.push(`$${typstMath}$`);
        }
      }
    } else {

      let t = token.content;

      t = t.replace(/\\underline\{\s*(\\quad)*\s*\}/g, '#blank(5em)');
      t = t.replace(/\\underline\{([^}]*)\}/g, '#blank(5em)');
      t = t.replace(/_{3,}/g, '#blank(5em)');

      t = t.replace(/\\quad/g, ' ');
      t = t.replace(/\\qquad/g, '  ');

      t = t.replace(/</g, '\\<').replace(/>/g, '\\>').replace(/@/g, '\\@');

      t = t.replace(/\*\*([^*]+)\*\*/g, '*$1*');

      resultChunks.push(t);
    }
  }

  return resultChunks.join('');
}

function formatChoiceItem(textRaw: string): string {
  const typst = convertLatexToTypst(textRaw).trim();
  if (!typst) return '[]';

  if (typst.startsWith('$') && typst.endsWith('$') && (typst.match(/\$/g) || []).length === 2) {
    return typst;
  }

  return `[${typst}]`;
}

function escapeTypstString(str: string): string {
  if (!str) return '';
  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, ' ');
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
      if (q.type === 'choice' && !q.steps_html && !q.hints_html) return;

      const ansTypst = convertLatexToTypst(q.answer || '').trim();
      const stepsTypst = convertLatexToTypst(q.steps_html || q.hints_html || '').trim();
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
