export function decodeHtmlEntities(str: string): string {
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
    const parts = content.split(/\\\\/).map((p: string) => convertLatexMathToTypst(p.trim())).join(', ');
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

export function escapeTypstString(str: string): string {
  if (!str) return '';
  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, ' ');
}
