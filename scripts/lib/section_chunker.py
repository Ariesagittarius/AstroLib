import re
from dataclasses import dataclass, field

@dataclass
class SectionData:
    num: int
    title: str = ''
    lines: list[str] = field(default_factory=list)
    blocks: list[tuple[str | None, list[str]]] = field(default_factory=list)

@dataclass
class ChapterData:
    num: int
    title: str = ''
    intro: list[str] = field(default_factory=list)
    intro_title: str = ''
    sections: dict[int, SectionData] = field(default_factory=dict)
    tail: list[str] = field(default_factory=list)
    tail_types: dict[str, list[str]] = field(default_factory=dict)

class SectionChunker:
    """通用章节、习题与结构切分器。"""

    CN_NUM = {
        '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
        '十一': 11, '十二': 12, '十三': 13, '十四': 14, '十五': 15, '十六': 16, '十七': 17,
        '十八': 18, '十九': 19, '二十': 20,
    }
    CNNUM_PATTERN = r'[\d一二三四五六七八九十]+'

    DEFAULT_CH_RE = re.compile(r'^#{1,6}\s*第\s*([%s\d]+)\s*章\s*(.*)$' % r'一二三四五六七八九十')
    DEFAULT_SEC_RE = re.compile(r'^#{1,6}\s*第\s*([%s\d]+)\s*节\s*(.*)$' % r'一二三四五六七八九十')
    DEFAULT_DOT_SEC_RE = re.compile(r'^#{0,6}\s*\\?\*?§?\s*(\d+)\.(\d+)(?!\.)(?:\s+(.*))?\s*$')
    DEFAULT_SUBSEC_RE = re.compile(r'^#{1,6}\s*\\?\*?(\d+)\.(\d+)\.(\d+)\s')
    DEFAULT_BLOCK_HEAD_RE = re.compile(r'^(?:#{1,6}\s*)?(练习题答案|练习题|习题\s*\d+\.\d+|第[\d一二三四五六七八九十]+章习题|综合练习题|补充习题)\s*(.*)$')
    DEFAULT_TAIL_TYPE_RE = re.compile(r'^##\s*(\d+)\.(\d+)\s*(选择题|填空题|解答题)\s*$')
    DEFAULT_ANS_HEAD_RE = re.compile(r'^#{0,6}\s*习题\s*(\d+)\.(\d+)\s*$')

    @classmethod
    def to_arabic(cls, s: str | int) -> int:
        if isinstance(s, int):
            return s
        s = s.strip()
        if s.isdigit():
            return int(s)
        return cls.CN_NUM.get(s, 0)

    @classmethod
    def find_heading_index(cls, lines: list[str], pattern: re.Pattern | str, start: int = 0) -> int | None:
        if isinstance(pattern, str):
            pattern = re.compile(pattern)
        for i in range(start, len(lines)):
            if pattern.match(lines[i].strip()):
                return i
        return None

    @classmethod
    def extract_between(cls, lines: list[str],
                        start_pattern: re.Pattern | str | None,
                        end_pattern: re.Pattern | str | None,
                        start_offset: int = 0) -> list[str]:
        """提取两个标题之间的行。"""
        if start_pattern is None:
            s_idx = start_offset
        else:
            s_idx = cls.find_heading_index(lines, start_pattern, start_offset)
            if s_idx is None:
                return []
            s_idx += 1

        if end_pattern is None:
            e_idx = len(lines)
        else:
            e_idx = cls.find_heading_index(lines, end_pattern, s_idx)
            if e_idx is None:
                e_idx = len(lines)
        return lines[s_idx:e_idx]

    @classmethod
    def strip_toc(cls, lines: list[str],
                  toc_pattern: re.Pattern | str = r'^##\s*目录\s*$',
                  first_body_pattern: re.Pattern | str = r'^#\s*\S') -> list[str]:
        """移除从目录标题到第一篇正文标题之间的目录内容。"""
        toc = cls.find_heading_index(lines, toc_pattern)
        if toc is None:
            return lines
        nxt = cls.find_heading_index(lines, first_body_pattern, toc + 1)
        if nxt is None:
            return lines
        return lines[:toc] + lines[nxt:]

    @classmethod
    def strip_front_matter(cls, lines: list[str], start_pattern: re.Pattern | str) -> list[str]:
        """丢弃指定起始标记之前的所有前置内容（如从 '绪论' 或 '第一章' 开始）。"""
        idx = cls.find_heading_index(lines, start_pattern)
        return lines[idx:] if idx is not None else lines

    @classmethod
    def cut_answer_key(cls, lines: list[str],
                       start_pattern: re.Pattern | str = r'^##\s*(?:部分习题答案与提示|奇数习题答案|习题参考答案)\s*$',
                       end_patterns: list[re.Pattern | str] | None = None) -> tuple[list[str], list[str]]:
        """从文末切出答案区域，返回 (正文行列表, 答案行列表)。"""
        start = cls.find_heading_index(lines, start_pattern)
        if start is None:

            app_idx = -1
            for i, line in enumerate(lines):
                if re.match(r'^##\s*附录', line.strip()):
                    app_idx = i
            bare_ch = re.compile(r'^##\s*第[一二三四五六七八九十\d]+章\s*$')
            start = cls.find_heading_index(lines, bare_ch, max(app_idx + 1, 0))
        if start is None:
            return lines, []

        end = len(lines)
        default_ends = [r'^##\s*参考文献', r'^##\s*二维码清单', r'^\[General Information\]']
        check_ends = end_patterns or default_ends
        for pat in check_ends:
            e = cls.find_heading_index(lines, pat, start + 1)
            if e is not None and e < end:
                end = e
        return lines[:start], lines[start:end]

    @classmethod
    def split_chapters_chinese(cls, lines: list[str], ch_re: re.Pattern | None = None) -> list[tuple[int, str, list[str]]]:
        """按 '第X章 标题' 切分篇章，返回 [(章号, 标题, 行列表)]。"""
        pat = ch_re or cls.DEFAULT_CH_RE
        chapters = []
        cur = None
        for line in lines:
            m = pat.match(line.strip())
            if m:
                if cur:
                    chapters.append(cur)
                ch_num = cls.to_arabic(m.group(1))
                cur = [ch_num, m.group(2).strip(), []]
            elif cur is not None:
                cur[2].append(line)
        if cur:
            chapters.append(cur)
        return [(c[0], c[1], c[2]) for c in chapters]

    @classmethod
    def split_sections_chinese(cls, chapter_lines: list[str], sec_re: re.Pattern | None = None) -> list[tuple[int, str, list[str]]]:
        """在一章内按 '第X节 标题' 切分，返回 [(节号, 标题, 行列表)]。"""
        pat = sec_re or cls.DEFAULT_SEC_RE
        sections = []
        cur = None
        for line in chapter_lines:
            m = pat.match(line.strip())
            if m:
                if cur:
                    sections.append(cur)
                sec_num = cls.to_arabic(m.group(1))
                cur = [sec_num, m.group(2).strip(), []]
            elif cur is not None:
                cur[2].append(line)
        if cur:
            sections.append(cur)
        return [(s[0], s[1], s[2]) for s in sections]

    @classmethod
    def split_chapter_parts(cls, ch_lines: list[str],
                            intro_re: re.Pattern | None = None,
                            sec_re: re.Pattern | None = None,
                            block_head_re: re.Pattern | None = None) -> tuple[list[str] | None, str, dict[int, dict], list[str]]:
        """章内切分：介绍性实例 / 各节 / 补充习题。

        返回 (intro_lines_or_None, intro_title, {节号: {'title': str, 'lines': []}}, 补充习题行列表)。
        """
        int_pat = intro_re or re.compile(r'^#{0,6}\s*介绍性实例\s*(.*)$')
        s_pat = sec_re or re.compile(r'^#{0,6}\s*(\d+)\.(\d+)\s+(.*)$')
        b_pat = block_head_re or cls.DEFAULT_BLOCK_HEAD_RE

        intro = None
        intro_title = ''
        sections = {}
        tail = []
        cur = None

        for line in ch_lines:
            s = line.strip()
            if not s:
                if cur is not None:
                    cur[1].append(line)
                continue
            m = int_pat.match(s)
            if m:
                intro = []
                intro_title = m.group(1).strip()
                cur = ('intro', intro)
                continue
            if b_pat.match(s) and (cur is None or cur[0] != 'tail'):
                if re.match(r'^(?:#{1,6}\s*)?补充习题\s*$', s):
                    tail = []
                    cur = ('tail', tail)
                    continue
            m = s_pat.match(s)
            if m and not m.group(3).strip().startswith('节'):
                sec_num = int(m.group(2))
                sections.setdefault(sec_num, {'title': m.group(3).strip() if m.group(3) else '', 'lines': []})
                cur = ('sec', sections[sec_num]['lines'])
                continue
            if cur is None:
                intro = []
                cur = ('intro', intro)
            cur[1].append(line)
        return intro, intro_title, sections, tail

    @classmethod
    def split_section_blocks(cls, sec_lines: list[str],
                             block_head_re: re.Pattern | None = None) -> list[tuple[str | None, list[str]]]:
        """节内按 练习题/习题X.Y/练习题答案 标题切分，返回 [(None|块名, 行列表)]。"""
        pat = block_head_re or cls.DEFAULT_BLOCK_HEAD_RE
        parts = []
        cur_name = None
        cur_lines = []
        for line in sec_lines:
            s = line.strip()
            m = pat.match(s)
            if m and not re.match(r'^(?:#{1,6}\s*)?补充习题\s*$', s):
                parts.append((cur_name, cur_lines))
                name = m.group(1)
                if name.startswith('习题'):
                    name = '习题' + re.sub(r'\s+', '', name[2:])
                cur_name = name
                cur_lines = []
                continue
            cur_lines.append(line)
        parts.append((cur_name, cur_lines))
        return [(n, ls) for n, ls in parts if n is not None or any(l.strip() for l in ls)]

    @classmethod
    def split_chapter_tail(cls, section_lines: list[str],
                           ch_ex_re: re.Pattern | None = None) -> tuple[list[str], list[str]]:
        """把一节末尾的 '第X章习题/综合练习题' 区域切出，返回 (节内容, 章尾内容)。"""
        pat = ch_ex_re or re.compile(r'^#{1,6}\s*(第%s章习题)\s*(.*)$' % cls.CNNUM_PATTERN)
        for i, line in enumerate(section_lines):
            if pat.match(line.strip()):
                return section_lines[:i], section_lines[i:]
        return section_lines, []

    @classmethod
    def split_tail_by_type(cls, tail: list[str],
                           type_re: re.Pattern | None = None) -> dict[str, list[str]]:
        """把习题尾按题型（选择题/填空题/解答题）切分，返回 {题型: 行列表}。"""
        pat = type_re or cls.DEFAULT_TAIL_TYPE_RE
        types = {}
        cur = None
        cur_lines = []
        for line in tail:
            m = pat.match(line.strip())
            if m:
                if cur:
                    types.setdefault(cur, []).extend(cur_lines)
                cur = m.group(3)
                cur_lines = []
                continue
            if cur:
                cur_lines.append(line)
        if cur:
            types.setdefault(cur, []).extend(cur_lines)
        return types

    @classmethod
    def extract_answer_chunk(cls, tail: list[str],
                             ans_pat: re.Pattern | str = r'^习题参考答案\s*$') -> list[str] | None:
        """从习题尾切出 '习题参考答案' 图片区，返回行列表或 None。"""
        if isinstance(ans_pat, str):
            ans_pat = re.compile(ans_pat)
        idx = None
        for i, line in enumerate(tail):
            if ans_pat.match(line.strip()):
                idx = i
                break
        if idx is None:
            return None
        start = idx
        j = idx - 1
        while j >= 0 and idx - j <= 4:
            if re.match(r'^\s*!\[[^\]]*\]\(images/[^)]+\)\s*$', tail[j]):
                start = j
                j -= 1
            else:
                break
        end = idx + 1
        while end < len(tail) and not tail[end].strip().startswith('#'):
            end += 1
        chunk = tail[start:end]
        return [l for l in chunk if not ans_pat.match(l.strip())]

    @classmethod
    def split_answer_chapters(cls, ans_lines: list[str]) -> dict[int, list[str]]:
        """按裸章标题或 习题X.Y/第X章习题 的编号给答案分组，返回 {章号: 行列表}。"""
        groups = {}
        cur = None
        bare_ch = re.compile(r'^#{1,6}\s*第([一二三四五六七八九十\d]+)章\s*$')
        ex_ch = re.compile(r'^#{1,6}\s*习题\s*(\d+)\.\d+')
        ch_ex = re.compile(r'^#{1,6}\s*第(\d+)章习题')
        for line in ans_lines:
            s = line.strip()
            m = bare_ch.match(s)
            if m:
                cur = cls.to_arabic(m.group(1))
                groups.setdefault(cur, [])
                continue
            m = ex_ch.match(s)
            if m:
                cur = int(m.group(1))
                groups.setdefault(cur, [])
                groups[cur].append(line)
                continue
            m = ch_ex.match(s)
            if m:
                cur = int(m.group(1))
                groups.setdefault(cur, [])
                groups[cur].append(line)
                continue
            if cur is not None:
                groups[cur].append(line)
        return groups

    @classmethod
    def split_answer_sections(cls, ans_lines: list[str]) -> dict[int, list[tuple[str, list[str]]]]:
        """答案区按章分组：{章号: [('第X章 习题答案'|'第X章补充习题 答案', 行列表)]}。"""
        groups = {}
        cur = None
        cur_part = None
        cur_lines = []
        ans_ch_re = re.compile(r'^#{1,6}\s*第\s*([%s\d]+)\s*章\s*$' % r'一二三四五六七八九十')
        ans_sup_re = re.compile(r'^#{1,6}\s*第\s*([%s\d]+)\s*章\s*补充习题\s*$' % r'一二三四五六七八九十')

        for line in ans_lines:
            s = line.strip()
            if not s:
                if cur is not None:
                    cur_lines.append(line)
                continue
            m = ans_ch_re.match(s)
            if m:
                if cur is not None and cur_part is not None:
                    groups.setdefault(cur, []).append((cur_part, cur_lines))
                cur = cls.to_arabic(m.group(1))
                cur_part = f"第{cur}章 习题答案"
                cur_lines = []
                continue
            m = ans_sup_re.match(s)
            if m:
                if cur is not None and cur_part is not None:
                    groups.setdefault(cur, []).append((cur_part, cur_lines))
                cur = cls.to_arabic(m.group(1))
                cur_part = f"第{cur}章补充习题 答案"
                cur_lines = []
                continue
            if cur is not None:
                cur_lines.append(line)
        if cur is not None and cur_part is not None:
            groups.setdefault(cur, []).append((cur_part, cur_lines))
        return groups

    @classmethod
    def group_answers_by_sec(cls, lines: list[str],
                             head_re: re.Pattern | None = None) -> dict[int, list[tuple[int, list[str]]]]:
        """答案区行 -> {章号: [(节号, 行列表)]}（按 '## 习题 X.Y' 标题分组）。"""
        pat = head_re or cls.DEFAULT_ANS_HEAD_RE
        groups = {}
        cur_ch = None
        cur_sec = None
        buf = []

        def flush():
            nonlocal cur_ch, cur_sec, buf
            if cur_ch is not None and cur_sec is not None and buf:
                groups.setdefault(cur_ch, []).append((cur_sec, buf))
            buf = []

        for raw in lines:
            m = pat.match(raw.strip())
            if m:
                flush()
                cur_ch = int(m.group(1))
                cur_sec = int(m.group(2))
                buf = [raw]
            elif cur_ch is not None:
                buf.append(raw)
        flush()
        return groups
