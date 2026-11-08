import re
from .mdx_sanitizer import MdxSanitizer, TextCleaner

class ExerciseParser:
    """细粒度习题、题干分界与题号启发式恢复解析器。"""

    QNUM_RE = re.compile(r'^(\d+)\.(\d+)\.(\d+)\s')
    QNUM_ONLY_RE = re.compile(r'^(\d+)\.(\d+)\.(\d+)\s*$')
    FIGREF_RE = re.compile(r'题\s*(\d+)\.(\d+)\.(\d+)\s*图')
    BARE_CAP_RE = re.compile(r'^(?:题|图)\s*\d+\.\d+(?:\.\d+)?\s*图?\s*$')
    OPT_RE = re.compile(r'^[A-DＡ-Ｄ][\.．]')
    PARE_RE = re.compile(r'^[\(（]\s*\d+\s*[\)）]')
    PAREN_EMPTY_RE = re.compile(r'^[\(（]\s*[\)）]')
    CONT_RE = re.compile(r'^(式中|其中|这里|于是|因此|所以|因而|则|由上式|代入|解得|得|联立|再|又|可见|由式|将式|把|令|此时|这时|从而|但|然而|换言之|即|亦即|若将|由|那么|请问|试问)')
    NEWQ_RE = re.compile(r'(试求|试问|试计算|试证明|试比较|试述|试说明|试判断|求[:：。．]|求\s|求(?=[\u4e00-\u9fffA-Za-z$\\])|计算|证明[:：]|能否|为什么|是否|是多少|多大|多少|问[:：]|[?？]|^已知|评论|判断|试求)')
    KNOWN_BACKREF_RE = re.compile(r'^已知.*(?:上述|上式|该反应|此反应|上题|由上|此式|该式)')

    def __init__(self, sanitizer: MdxSanitizer | None = None):
        self.sanitizer = sanitizer or MdxSanitizer()

    def parse_exercises(self, lines: list[str], ch: int, sec: int) -> list[tuple[str, list[str]]]:
        """将题型区行解析为 Exercise 卡片列表 [(title, [lines])]。

        自动处理：
          - 标准编号行 `X.Y.Z `
          - 纯编号行 `8.3.6`
          - 图号回填 `题X.Y.Z图`
          - 选项 `A.` / `(1)` / 数据续文合并
          - 设问词探测新题与编号顺延回填
        """
        cards = []
        cur = None
        expected = 1
        idx = 0

        def start_card(num: int | None):
            nonlocal cur, expected
            if num is None:
                num = expected
            title = f"习题 {ch}.{sec}.{num}"
            cards.append((title, []))
            cur = cards[-1]
            expected = num + 1

        while idx < len(lines):
            raw = lines[idx]
            s = raw.strip()
            if not s:
                idx += 1
                continue
            if TextCleaner.is_artifact(s):
                idx += 1
                continue

            m = self.QNUM_ONLY_RE.match(s)
            if m:
                start_card(int(m.group(3)))
                idx += 1
                continue

            m = self.QNUM_RE.match(s)
            if m:
                start_card(int(m.group(3)))
                rest = s[m.end():]
                if rest:
                    cur[1].append(rest)
                idx += 1
                continue

            if self.BARE_CAP_RE.match(s):
                if cur is None:
                    start_card(None)
                cur[1].append(raw)
                idx += 1
                continue

            if self.KNOWN_BACKREF_RE.match(s):
                if cur is None:
                    start_card(None)
                cur[1].append(raw)
                idx += 1
                continue

            if self.PAREN_EMPTY_RE.match(s) or self.PARE_RE.match(s) or self.OPT_RE.match(s) or self.CONT_RE.match(s):
                if cur is None:
                    start_card(None)
                cur[1].append(raw)
                idx += 1
                continue

            num = None
            mf = self.FIGREF_RE.search(s)
            if mf:
                num = f"{int(mf.group(1))}.{int(mf.group(2))}.{int(mf.group(3))}"
            if num is not None and cur is not None:
                cur_num = int(cur[0].split('.')[2])
                if cur_num == int(num.split('.')[2]):
                    cur[1].append(raw)
                    idx += 1
                    continue

            cjk_len = len(re.sub(r'\s+', '', re.sub(r'\$[^$]*\$', '', s)))
            is_short_fragment = (cur is not None and num is None and cjk_len < 30
                                 and re.search(r'[?？]|求|试|多少', s))
            if (num is not None or self.NEWQ_RE.search(s)) and not is_short_fragment:
                start_card(int(num.split('.')[2]) if num else None)
                cur[1].append(raw)
                idx += 1
                continue

            if cur is None:
                start_card(None)
            cur[1].append(raw)
            idx += 1

        return cards

    def render_exercises(self, cards: list[tuple[str, list[str]]]) -> str:
        """渲染 Exercise 卡片列表为 MDX 字符串。"""
        out = []
        for title, lines in cards:
            body = self.sanitizer.sanitize_body(lines)
            out.append(f'<Exercise title="{title}">\n{body}\n</Exercise>')
        return '\n\n'.join(out)

    def parse_and_render(self, lines: list[str], ch: int, sec: int) -> str:
        cards = self.parse_exercises(lines, ch, sec)
        return self.render_exercises(cards)
