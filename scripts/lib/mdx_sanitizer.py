import re

class MdxSanitizer:
    r"""数学感知字符与格式转义器。

    精确识别行内公式 $...$ 与行间公式 $$...$$，只对正文普通文本转义：
    - '<' (非 HTML/JSX 标签) -> '&lt;'
    - '{' (非公式花括号) -> '\{'
    - '}' (非公式花括号) -> '\}'
    - 表格中的 '~' -> '～'
    - 脚注标记 $^{①}$ / $^{\text{①}}$ -> <sup>①</sup>
    """

    FN_MARK_RE = re.compile(r'\$\^\{([①-⑳])\}\$|\$\^\{\\text\{([①-⑳])\}\}\$')
    HTML_TAG_RE = re.compile(r'^</?([a-zA-Z][a-zA-Z0-9_\-\.:]*)(?:\s+[^>]*)?/?>')

    ROMAN_MAP = {
        'Ⅰ': 'I', 'Ⅱ': 'II', 'Ⅲ': 'III', 'Ⅳ': 'IV', 'Ⅴ': 'V',
        'Ⅵ': 'VI', 'Ⅶ': 'VII', 'Ⅷ': 'VIII', 'Ⅸ': 'IX', 'Ⅹ': 'X',
        'Ⅺ': 'XI', 'Ⅻ': 'XII',
        'ⅰ': 'i', 'ⅱ': 'ii', 'ⅲ': 'iii', 'ⅳ': 'iv', 'ⅴ': 'v',
        'ⅵ': 'vi', 'ⅶ': 'vii', 'ⅷ': 'viii', 'ⅸ': 'ix', 'ⅹ': 'x'
    }
    CIRCLED_MAP = {
        '①': 1, '②': 2, '③': 3, '④': 4, '⑤': 5,
        '⑥': 6, '⑦': 7, '⑧': 8, '⑨': 9, '⑩': 10,
        '⑪': 11, '⑫': 12, '⑬': 13, '⑭': 14, '⑮': 15,
        '⑯': 16, '⑰': 17, '⑱': 18, '⑲': 19, '⑳': 20
    }

    VALID_TAGS = {
        'table', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th',
        'sup', 'sub', 'br', 'p', 'a', 'span', 'img', 'div',
        'b', 'i', 'u', 'strong', 'em', 'code', 'pre', 'ul', 'ol', 'li',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'Example', 'Knowledge', 'Solution', 'Note', 'Block',
        'Guide', 'Analysis', 'Variant', 'Method', 'Exercise',
    }

    def __init__(self):
        self.display = False
        self.inline = False

    MATH_HTML_ENTITIES = {
        '&gt;': '>',
        '&lt;': '<',
        '&amp;': '&',
        '&ge;': '\\ge ',
        '&le;': '\\le ',
        '&plusmn;': '\\pm ',
        '&times;': '\\times ',
        '&div;': '\\div ',
        '&ne;': '\\neq ',
        '&approx;': '\\approx ',
        '&infin;': '\\infty ',
        '&#39;': "'",
        '&quot;': '"',
    }

    GREEK_SYMBOLS = (
        'alpha', 'beta', 'gamma', 'delta', 'epsilon', 'varepsilon', 'zeta', 'eta',
        'theta', 'vartheta', 'iota', 'kappa', 'lambda', 'mu', 'nu', 'xi', 'pi',
        'varpi', 'rho', 'varrho', 'sigma', 'varsigma', 'tau', 'upsilon', 'phi',
        'varphi', 'chi', 'psi', 'omega', 'Gamma', 'Delta', 'Theta', 'Lambda',
        'Xi', 'Pi', 'Sigma', 'Upsilon', 'Phi', 'Psi', 'Omega'
    )

    @classmethod
    def sanitize_math(cls, math_str: str) -> str:
        s = math_str

        for ent, repl in cls.MATH_HTML_ENTITIES.items():
            if ent in s:
                s = s.replace(ent, repl)

        for r, repl in cls.ROMAN_MAP.items():
            if r in s:
                s = s.replace(r, repl)

        s = re.sub(r'\\tag\s*\{([①-⑳])\}', lambda m: f"\\tag{{\\textcircled{{{cls.CIRCLED_MAP[m.group(1)]}}}}}", s)
        s = re.sub(r'\\textcircled\s*\{([①-⑳])\}', lambda m: f"\\textcircled{{{cls.CIRCLED_MAP[m.group(1)]}}}", s)
        s = re.sub(r'(\\underbrace\{[^}]*\}_\s*\{?)([①-⑳])(\}?)', lambda m: f"{m.group(1)}\\textcircled{{{cls.CIRCLED_MAP[m.group(2)]}}}{m.group(3)}", s)
        s = re.sub(r'([①-⑳])', lambda m: f"\\textcircled{{{cls.CIRCLED_MAP[m.group(1)]}}}", s)

        s = re.sub(r'\\right\s*:', r'\\right.', s)

        for g in cls.GREEK_SYMBOLS:
            s = re.sub(rf'\\textbf\s*\{{\s*\\{g}\s*\}}', rf'\\boldsymbol{{\\{g}}}', s)

        s = re.sub(r'\\tag\s*\{[^}]*\}\s*(\\tag\s*\{[^}]*\})', r'\1', s)

        return s

    @classmethod
    def fn_mark_to_sup(cls, text: str) -> str:
        text = cls.FN_MARK_RE.sub(lambda m: f"<sup>{m.group(1) or m.group(2)}</sup>", text)
        text = re.sub(r'\$([^\$\n]+?)\^\{\\textcircled\{([①-⑳])\}\}\$', r'$\1$<sup>\2</sup>', text)
        text = re.sub(r'\$([^\$\n]+?)\^\{\\text\{([①-⑳])\}\}\$', r'$\1$<sup>\2</sup>', text)
        text = re.sub(r'\$([^\$\n]+?)\^\{([①-⑳])\}\$', r'$\1$<sup>\2</sup>', text)
        text = re.sub(r'\$([^\$\n]+?)\^([①-⑳])\$', r'$\1$<sup>\2</sup>', text)
        text = re.sub(r'(?<!\\)\$(.+?)(?<!\\)\$', lambda m: f"${cls.sanitize_math(m.group(1))}$", text)
        return text

    def is_valid_html_tag(self, tag_str: str, tag_name: str) -> bool:
        clean_name = tag_name.lstrip('/')
        if clean_name not in self.VALID_TAGS:
            return False

        if not clean_name[0].isupper():
            if any(ord(c) >= 128 for c in tag_str):
                return False
        return True

    def sanitize_line(self, line: str) -> str:
        s = line.strip()
        if s == '$$':
            self.display = not self.display
            return line
        if self.display:
            return line

        if '<table' in line or '</table>' in line or '<tr>' in line or '<td>' in line or '<th>' in line:
            line = line.replace('~', '～')

        out = []
        i = 0
        n = len(line)
        while i < n:
            ch = line[i]
            if ch == '$':
                self.inline = not self.inline
                out.append(ch)
                i += 1
                continue
            if self.inline:
                out.append(ch)
                i += 1
                continue

            if ch == '<':
                m = self.HTML_TAG_RE.match(line[i:])
                if m and self.is_valid_html_tag(m.group(0), m.group(1)):
                    tag_str = m.group(0)
                    out.append(tag_str)
                    i += len(tag_str)
                    continue
                out.append('&lt;')
                i += 1
            elif ch == '{':
                out.append('\\{')
                i += 1
            elif ch == '}':
                out.append('\\}')
                i += 1
            else:
                out.append(ch)
                i += 1
        return ''.join(out)

    def sanitize_body(self, lines: list[str] | str) -> str:
        """多行文本清洗转义，保持段落内的原始单换行与段落间的双换行。"""
        if isinstance(lines, str):
            lines = lines.splitlines()
        out = [self.sanitize_line(line) for line in lines]
        text = '\n'.join(out)
        return self.fn_mark_to_sup(text)

    @staticmethod
    def safe_title(s: str) -> str:
        """为文件名与路由生成安全干净的短标题（去除公式、标点、空白等非法字符）。"""
        s = re.sub(r'\$\\mathbb\{R\}\^n\$', 'R^n', s)
        s = re.sub(r'\$([^$]*)\$', lambda m: re.sub(r'\s+', '', m.group(1)), s)
        s = re.sub(r'[\\/:*?"<>|#{}\$]', '', s)
        s = re.sub(r'[、，。．,.;;：:（）()\[\]【】]', '', s)
        s = re.sub(r'\s+', '', s)
        return s.strip()

    @staticmethod
    def clean_yaml_title(title: str) -> str:
        """为 frontmatter 中的 title 进行排版简化和单引号转义。"""
        title = re.sub(r'\$\\mathbb\{R\}\^n\$', 'R^n', title)
        title = re.sub(r'\$([^$]*)\$', lambda m: re.sub(r'\s+', '', m.group(1)), title)
        title = title.replace("'", "\\'")
        return title.strip()

class TextCleaner:
    """MinerU 产物通用噪声过滤与文本清洗器。"""

    DEFAULT_ARTIFACT_RES = [
        re.compile(r'The Ground Truth image|广力云|智慧零售|收银系统|Abook|数字课程'),
        re.compile(r'^\[General Information\]|^书名=|^SS号='),
        re.compile(r'^(?:\d+\s*)?大学物理学\s*（第7版）\s*（上|下）\s*$'),
        re.compile(r'^大学物理学\s*[（(]\s*第\s*7\s*版\s*[)）]\s*[（(]\s*(上|下)\s*[)）]\s*$'),
        re.compile(r'^#\s*Physics\b'),
    ]

    NUMERIC_HEAD_RE = re.compile(r'^[\d\s.．]+$')
    FN_LINE_RE = re.compile(r'^([①-⑳])\s+(.*)$')
    FN_ORDER = '①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳'

    @classmethod
    def is_artifact(cls, line: str, extra_patterns: list[re.Pattern | str] | None = None) -> bool:
        """检测是否为 MinerU 页眉页脚、扫描水印或图书元数据垃圾行。"""
        s = line.strip()
        if not s:
            return False
        for pat in cls.DEFAULT_ARTIFACT_RES:
            if pat.search(s):
                return True
        if extra_patterns:
            for pat in extra_patterns:
                if isinstance(pat, str):
                    if re.search(pat, s):
                        return True
                elif pat.search(s):
                    return True
        return False

    @classmethod
    def is_numeric_heading(cls, line: str) -> bool:
        """检测 MinerU 偶发把纯数字样本数据行（如 '## 4.5 5.0 4.7 4.0 4.2' 或 '5.0 4.7'）误判为标题的情况。"""
        s = line.strip()
        if not s:
            return False
        content = re.sub(r'^#{1,6}\s*', '', s).strip()
        return bool(cls.NUMERIC_HEAD_RE.match(content))

    @classmethod
    def filter_lines(cls, lines: list[str],
                     extra_artifact_patterns: list[re.Pattern | str] | None = None,
                     drop_numeric_headings: bool = True) -> list[str]:
        """批量过滤行，剔除水印、垃圾行及（可选）数字标题行。"""
        filtered = []
        for line in lines:
            if cls.is_artifact(line, extra_patterns=extra_artifact_patterns):
                continue
            if drop_numeric_headings and cls.is_numeric_heading(line) and line.strip().startswith('#'):
                filtered.append(re.sub(r'^#{1,6}\s*', '', line))
                continue
            filtered.append(line)
        return filtered

    @classmethod
    def extract_footnotes(cls, lines: list[str]) -> tuple[list[str], list[tuple[str, str]]]:
        """从行列表中抽取行首脚注文本（如 '① 某某定义'），返回 (清洗后行列表, [(序号, 注释文本)])。"""
        fns = []
        kept = []
        for line in lines:
            s = line.strip()
            m = cls.FN_LINE_RE.match(s)
            if m:
                fns.append((m.group(1), m.group(2).strip()))
            else:
                kept.append(line)
        fns.sort(key=lambda x: cls.FN_ORDER.index(x[0]) if x[0] in cls.FN_ORDER else 99)
        return kept, fns

    @classmethod
    def extract_footnotes_from_parts(
        cls, parts: list[tuple[str | None, list[str]]]
    ) -> tuple[list[tuple[str | None, list[str]]], list[tuple[str, str]]]:
        """从带有板块结构的 parts 列表中统一抽取所有脚注。"""
        all_fns = []
        new_parts = []
        for name, lines in parts:
            kept, fns = cls.extract_footnotes(lines)
            all_fns.extend(fns)
            new_parts.append((name, kept))
        all_fns.sort(key=lambda x: cls.FN_ORDER.index(x[0]) if x[0] in cls.FN_ORDER else 99)
        return new_parts, all_fns
