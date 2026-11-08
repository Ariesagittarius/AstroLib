"""
Unicode 数学字符规范化模块
将从 Typst / PDF 中提取的 Unicode 数学斜体、黑板粗体、希腊字母与数学符号规范化为标准 LaTeX / ASCII 表达式。
"""

import re

MATH_ITALIC_MAP = {

    **{chr(0x1D434 + i): chr(ord('A') + i) for i in range(26)},

    **{chr(0x1D44E + i): chr(ord('a') + i) for i in range(26)},

    '\u210e': 'h',

    **{chr(0x1D400 + i): chr(ord('A') + i) for i in range(26)},

    **{chr(0x1D41A + i): chr(ord('a') + i) for i in range(26)},

    **{chr(0x1D468 + i): chr(ord('A') + i) for i in range(26)},

    **{chr(0x1D482 + i): chr(ord('a') + i) for i in range(26)},

    **{chr(0x1D5A0 + i): chr(ord('A') + i) for i in range(26)},

    **{chr(0x1D5BA + i): chr(ord('a') + i) for i in range(26)},
}

BLACKBOARD_BOLD_MAP = {
    '\u211d': r'\mathbf{R}',
    '\u2115': r'\mathbf{N}',
    '\u2124': r'\mathbf{Z}',
    '\u211a': r'\mathbf{Q}',
    '\u2102': r'\mathbf{C}',
}

GREEK_MAP = {
    '\U0001d6fc': r'\alpha',
    '\U0001d6fd': r'\beta',
    '\U0001d6fe': r'\gamma',
    '\U0001d6ff': r'\delta',
    '\U0001d700': r'\varepsilon',
    '\U0001d701': r'\zeta',
    '\U0001d702': r'\eta',
    '\U0001d703': r'\theta',
    '\U0001d704': r'\iota',
    '\U0001d705': r'\kappa',
    '\U0001d706': r'\lambda',
    '\U0001d707': r'\mu',
    '\U0001d708': r'\nu',
    '\U0001d709': r'\xi',
    '\U0001d70a': 'o',
    '\U0001d70b': r'\pi',
    '\U0001d70c': r'\rho',
    '\U0001d70d': r'\varsigma',
    '\U0001d70e': r'\sigma',
    '\U0001d70f': r'\tau',
    '\U0001d710': r'\upsilon',
    '\U0001d711': r'\varphi',
    '\U0001d712': r'\chi',
    '\U0001d713': r'\psi',
    '\U0001d714': r'\omega',
    '\U0001d715': r'\partial',

    '\u03b1': r'\alpha',
    '\u03b2': r'\beta',
    '\u03b3': r'\gamma',
    '\u03b4': r'\delta',
    '\u03b5': r'\varepsilon',
    '\u03b6': r'\zeta',
    '\u03b7': r'\eta',
    '\u03b8': r'\theta',
    '\u03bb': r'\lambda',
    '\u03bc': r'\mu',
    '\u03c0': r'\pi',
    '\u03c1': r'\rho',
    '\u03c3': r'\sigma',
    '\u03c4': r'\tau',
    '\u03c6': r'\varphi',
    '\u03c8': r'\psi',
    '\u03c9': r'\omega',
    '\u0393': r'\Gamma',
    '\u0394': r'\Delta',
    '\u0398': r'\Theta',
    '\u039b': r'\Lambda',
    '\u039e': r'\Xi',
    '\u03a0': r'\Pi',
    '\u03a3': r'\Sigma',
    '\u03a6': r'\Phi',
    '\u03a9': r'\Omega',
}

SYMBOL_MAP = {
    '−': '-',
    '–': '-',
    '—': '-',
    '⋅': r'\cdot ',
    '×': r'\times ',
    '÷': r'\div ',
    '≤': r'\le ',
    '⩽': r'\le ',
    '≥': r'\ge ',
    '⩾': r'\ge ',
    '≠': r'\ne ',
    '≈': r'\approx ',
    '≡': r'\equiv ',
    '∞': r'\infty ',
    '∈': r'\in ',
    '∉': r'\notin ',
    '⊂': r'\subset ',
    '⊆': r'\subseteq ',
    '∪': r'\cup ',
    '∩': r'\cap ',
    '∅': r'\varnothing ',
    '∀': r'\forall ',
    '∃': r'\exists ',
    '→': r'\to ',
    '⇒': r'\implies ',
    '⇔': r'\iff ',
    '∂': r'\partial ',
    '𝜕': r'\partial ',
    '∇': r'\nabla ',
    '⋯': r'\cdots ',
    '…': r'\dots ',
    '∫': r'\int ',
    '∬': r'\iint ',
    '∭': r'\iiint ',
    '∮': r'\oint ',
    '∑': r'\sum ',
    '∏': r'\prod ',
    '①': '(1)',
    '②': '(2)',
    '③': '(3)',
    '④': '(4)',
    '⑤': '(5)',
}

def normalize_math_unicode(text: str) -> str:
    """将文本中的数学斜体与特殊符号转换为标准 ASCII 及 LaTeX 记号。"""
    if not text:
        return ''

    chars = []
    for ch in text:
        if ch in MATH_ITALIC_MAP:
            chars.append(MATH_ITALIC_MAP[ch])
        elif ch in BLACKBOARD_BOLD_MAP:
            chars.append(BLACKBOARD_BOLD_MAP[ch])
        elif ch in GREEK_MAP:
            chars.append(GREEK_MAP[ch] + ' ')
        elif ch in SYMBOL_MAP:
            chars.append(SYMBOL_MAP[ch])
        else:
            chars.append(ch)

    res = ''.join(chars)
    res = re.sub(r' +', ' ', res)
    return res

def clean_ocr_artifacts(text: str) -> str:
    """清理页眉页脚、水印、版权信息等噪音。"""
    lines = text.split('\n')
    cleaned = []
    for line in lines:
        s = line.strip()
        if not s:
            continue
        if '©︎大邮数学集' in s or 'ArtveFlinaInBupt' in s or 'bump-archive' in s:
            continue
        if re.match(r'^\d+\s*/\s*\d+$', s):
            continue
        if re.match(r'^[IVXLCDM]+\s*$', s):
            continue
        if s == '\uf1b3' or s == '':
            continue
        cleaned.append(line)
    return '\n'.join(cleaned)
