import re
from .mdx_sanitizer import MdxSanitizer, TextCleaner

class CardParser:
    """例题、知识点、提示、解题与板块 AST 识别与渲染器。"""

    EX_RE = re.compile(r'^(?:#{0,6}\s*)?(?:例|例题)\s*(\d+(?:\.\d+)*)\s*(.*)$')
    KN_RE = re.compile(r'^(?:#{0,6}\s*)?(定理|定义|性质|推论|引理|命题|公理)\s*(\d+(?:\.\d+)*)\s*(.*)$')
    NOTE_RE = re.compile(r'^(?:#{0,6}\s*)?(注意(?![到])|警告|注|想一想)\s*[:：，,]?\s*(.*)$')
    SOL_RE = re.compile(
        r'^(?:#{0,6}\s*)?(?:\*|\\?\*)?(证明|证|解|证法[一二三四五六七八九十\d]+|解法[一二三四五六七八九十\d]+)'
        r'(?:[:：\s]+(.*)|(?=[（(]\s*[\d一二三四五六七八九十]+\s*[）)])(.*)|$)'
    )
    BLOCK_RE = re.compile(
        r'^(?:#{0,6}\s*)?(练习题答案|练习题|习题\s*\d+\.\d+|补充习题|第[\d一二三四五六七八九十]+章习题|综合练习题)\s*(.*)$'
    )
    HEAD_RE = re.compile(r'^#{1,6}\s+\S')
    AB_RE = re.compile(r'^(?:#{0,6}\s*)?\(([AB])\)\s*$')
    SUBHEAD_RE = re.compile(r'^(?:\\?\*?\d+[\.、](?!\d)|\(\d+\)|\\?\*?\d+\))')
    SUBTITLE_RE = re.compile(r'^[（(]([^）)]+)[）)]\s*(.*)$')

    TRANSITION_RE = re.compile(
        r'^(?:由(?:定义|定理|性质|引理|推论|例)\s*[\d\.]+\s*(?:易知|可知|可见|可以发现|知|得)|'
        r'根据(?:定义|定理|性质|引理|推论|例)\s*[\d\.]+|'
        r'(?:定理|性质|定义)\s*[\d\.]+\s*(?:表明|说明|给出了|具有|的几何意义)|'
        r'由此可见|综上所述|应当指出|在下一[节章]|本节主要|从几何上看|这一事实表明|'
        r'定理的证明从略|证明从略|下面(?:我们|讨论|介绍|利用|来|给出|推导|以)|设想将|注[:：]|'
        r'\S+(?:原理|定理|准则|公式)\s*给出了)'
    )

    REF_START = (
        '的', '中', '和', '与', '及', '说', '是', '里', '后', '也', '都', '还', '则', '并', '但',
        '所', '或', '且', '上述', '上面', '下面', '以下', '下述', '前面', '后面',
        '结论', '公式', '意义', '应用', '重要', '思想', '过程', '表明', '说明了',
        '随后', '来自', '第', '见', '知', '可得', '可知', '就属于',
        '证明了', '证明并', '证明的', '证明过程', '证明方法',
    )

    def __init__(self, sanitizer: MdxSanitizer | None = None):
        self.sanitizer = sanitizer or MdxSanitizer()

    def is_ref_quote(self, rest: str) -> bool:
        r = rest.strip()
        if not r:
            return False
        return any(r.startswith(k) for k in self.REF_START)

    def tokenize(self, lines: list[str], is_answer: bool = False) -> list[tuple]:
        """将正文行解析为语义 Token 序列，精准拆分标题与正文首句，自适应包裹证明与过渡段落。"""
        tokens = []
        cur = None
        cur_sol = None
        in_display_math = False
        prev_line_empty = False

        def strip_trailing_empty(lines_list: list[str]):
            while lines_list and not lines_list[-1].strip():
                lines_list.pop()

        def flush_sol():
            nonlocal cur_sol
            if cur_sol:
                strip_trailing_empty(cur_sol[1])
                if cur is not None and cur[0] == 'card':
                    cur[4].append(cur_sol)
                cur_sol = None

        def flush():
            nonlocal cur
            flush_sol()
            if cur:
                if cur[0] == 'card':
                    strip_trailing_empty(cur[3])
                elif cur[0] in ('note', 'para'):
                    strip_trailing_empty(cur[1])
                elif cur[0] in ('solution', 'block'):
                    strip_trailing_empty(cur[2])
                tokens.append(cur)
                cur = None

        def add_line(buf: list[str], line: str):
            buf.append(line)

        for raw in lines:
            s = raw.strip()

            if not s:
                prev_line_empty = True
                if cur is not None:
                    if cur[0] == 'card':
                        if cur_sol is not None:
                            cur_sol[1].append('')
                        else:
                            cur[3].append('')
                    elif cur[0] in ('note', 'para'):
                        cur[1].append('')
                    elif cur[0] in ('solution', 'block'):
                        cur[2].append('')
                continue

            if '$$' in s:
                cnt = s.count('$$')
                if cnt % 2 == 1:
                    in_display_math = not in_display_math

            if in_display_math and '$$' not in s:
                if cur is None:
                    cur = ('para', [raw])
                elif cur[0] == 'card':
                    target = cur_sol[1] if cur_sol else cur[3]
                    add_line(target, raw)
                elif cur[0] in ('note', 'para'):
                    add_line(cur[1], raw)
                elif cur[0] in ('solution', 'block'):
                    add_line(cur[2], raw)
                prev_line_empty = False
                continue

            if cur is not None and cur[0] == 'block':
                m = self.AB_RE.match(s)
                if m:
                    add_line(cur[2], f"**（{m.group(1)}）**")
                else:
                    add_line(cur[2], raw)
                prev_line_empty = False
                continue

            m = self.BLOCK_RE.match(s)
            if m:
                flush()
                title = re.sub(r'\s+', '', m.group(1))
                if is_answer:
                    title += ' 答案'
                cur = ('block', title, [])
                if m.group(2):
                    add_line(cur[2], m.group(2))
                prev_line_empty = False
                continue

            m = self.EX_RE.match(s)
            if m and not self.is_ref_quote(m.group(2)):
                flush()
                num = m.group(1).strip()
                rest = m.group(2).strip()
                m_sub = self.SUBTITLE_RE.match(rest)
                if m_sub:
                    sub = m_sub.group(1).strip()
                    first_line = m_sub.group(2).strip()
                    card_title = f"例 {num} {sub}"
                else:
                    card_title = f"例 {num}"
                    first_line = rest
                cur = ('card', 'example', card_title, [first_line] if first_line else [], [])
                prev_line_empty = False
                continue

            m = self.KN_RE.match(s)
            if m and not self.is_ref_quote(m.group(3)):
                flush()
                kind = m.group(1).strip()
                num = m.group(2).strip()
                rest = m.group(3).strip()
                m_sub = self.SUBTITLE_RE.match(rest)
                if m_sub:
                    sub = m_sub.group(1).strip()
                    first_line = m_sub.group(2).strip()
                    card_title = f"{kind} {num} {sub}"
                else:
                    card_title = f"{kind} {num}"
                    first_line = rest
                cur = ('card', 'knowledge', card_title, [first_line] if first_line else [], [])
                prev_line_empty = False
                continue

            m = self.NOTE_RE.match(s)
            if m:
                flush()
                first_line = m.group(2).strip() if m.group(2) else ''
                cur = ('note', [first_line] if first_line else [])
                prev_line_empty = False
                continue

            m = self.SOL_RE.match(s)
            if m:
                kind = m.group(1) or ''
                rest = (m.group(2) or m.group(3) or '').strip()
                if kind.startswith(('证法', '解法')):
                    sol_title = kind
                elif kind in ('证明', '证'):
                    sol_title = '证明'
                else:
                    sol_title = '解'

                if cur is not None and cur[0] == 'card':
                    flush_sol()
                    cur_sol = (sol_title, [rest] if rest else [])
                else:
                    flush()
                    cur = ('solution', sol_title, [rest] if rest else [])
                prev_line_empty = False
                continue

            if self.HEAD_RE.match(s):
                txt = re.sub(r'^#{1,6}\s*', '', s)
                if TextCleaner.is_numeric_heading(s):
                    if cur is None:
                        cur = ('para', [raw])
                    elif cur[0] == 'card':
                        target = cur_sol[1] if cur_sol else cur[3]
                        add_line(target, raw)
                    elif cur[0] in ('note', 'para'):
                        add_line(cur[1], raw)
                    elif cur[0] in ('solution', 'block'):
                        add_line(cur[2], raw)
                    prev_line_empty = False
                    continue
                flush()
                tokens.append(('heading', None, txt))
                prev_line_empty = False
                continue

            if prev_line_empty and cur is not None and (cur_sol is not None or cur[0] == 'solution'):
                has_content = len(cur_sol[1]) > 0 if cur_sol else len(cur[2]) > 0
                if has_content and self.TRANSITION_RE.match(s):
                    flush()
                    cur = ('para', [raw])
                    prev_line_empty = False
                    continue

            if cur is None:
                cur = ('para', [raw])
            elif cur[0] == 'card':
                if cur_sol is not None:
                    add_line(cur_sol[1], raw)
                else:
                    add_line(cur[3], raw)
            elif cur[0] in ('note', 'para'):
                add_line(cur[1], raw)
            elif cur[0] in ('solution', 'block'):
                add_line(cur[2], raw)

            prev_line_empty = False

        flush()
        return tokens

    def render_tokens(self, tokens: list[tuple]) -> str:
        out = []
        for tok in tokens:
            kind = tok[0]
            if kind == 'para':
                body = self.sanitizer.sanitize_body(tok[1]).strip()
                if body:
                    out.append(body)
            elif kind == 'heading':
                txt = tok[2]
                prefix = '###' if self.SUBHEAD_RE.match(txt) else '##'
                esc_title = MdxSanitizer.fn_mark_to_sup(self.sanitizer.sanitize_line(txt))
                out.append(f"{prefix} {esc_title}")
            elif kind == 'note':
                body = self.sanitizer.sanitize_body(tok[1]).strip()
                if body:
                    out.append(f"<Note>\n{body}\n</Note>")
            elif kind == 'solution':
                body = self.sanitizer.sanitize_body(tok[2]).strip()
                if body:
                    out.append(f'<Solution title="{tok[1]}">\n{body}\n</Solution>')
            elif kind == 'block':
                body = self.sanitizer.sanitize_body(tok[2]).strip()
                if body:
                    out.append(f'<Block title="{tok[1]}">\n{body}\n</Block>')
            elif kind == 'card':
                comp = 'Example' if tok[1] == 'example' else 'Knowledge'
                inner = self.sanitizer.sanitize_body(tok[3]).strip()
                sols = []
                for title, sol_lines in tok[4]:
                    sol_body = self.sanitizer.sanitize_body(sol_lines).strip()
                    if sol_body:
                        sols.append(f'<Solution title="{title}">\n{sol_body}\n</Solution>')
                all_parts = [p for p in [inner] + sols if p]
                if all_parts:
                    body = '\n\n'.join(all_parts)
                    out.append(f'<{comp} title="{tok[2]}">\n{body}\n</{comp}>')
        return '\n\n'.join(out)

    def render_body(self, lines: list[str], is_answer: bool = False) -> str:
        """从原始行列表直接清洗并渲染为 MDX 内容正文字符串。"""
        tokens = self.tokenize(lines, is_answer=is_answer)
        return self.render_tokens(tokens)

    def render_parts(self, parts: list[tuple[str | None, list[str]]], with_footnotes: bool = True) -> str:
        """渲染 [(None|块名, 行列表)] 结构，并自动收集脚注渲染为末尾的 <Block title="脚注">。"""
        out = []
        fns = []
        if with_footnotes:
            parts, fns = TextCleaner.extract_footnotes_from_parts(parts)
        for name, lines in parts:
            if name is None:
                body = self.render_body(lines)
                if body.strip():
                    out.append(body)
            else:
                body = self.sanitizer.sanitize_body(lines).strip()
                if body:
                    out.append(f'<Block title="{name}">\n{body}\n</Block>')
        if fns:
            fn_items = [f"{num} {text}" for num, text in fns]
            out.append(f'<Block title="脚注">\n{"\n\n".join(fn_items)}\n</Block>')
        return '\n\n'.join(out)
