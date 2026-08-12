#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
把 task/ 中《大学物理学》(第7版, 赵近芳/王登龙, 北京邮电大学出版社) 的 MinerU 产物
批量转换为站点 MDX。

拆分设计（与书本层级一致）：
  - 一本书 = 上册(第1-8章) + 下册(第9-17章)，目录 slug: university_physics
  - 每"节"一篇 MDX（如 8.1_内能-功和热量-准静态过程），章首"本章提要"并入该章第一节
  - 课后题不再整章混排：每章按题型拆成独立页面
      {章}.{末节+1}_第X章习题-选择题.mdx
      {章}.{末节+2}_第X章习题-填空题.mdx
      {章}.{末节+3}_第X章习题-解答题.mdx
      {章}.{末节+4}_第X章习题参考答案.mdx   （有参考答案图片时才生成）
  - 每题一个 <Exercise title="习题 X.Y.Z"> 板块（选择题/填空题/解答题各自连续编号）
  - 上册附录I(矢量)、附录II(常用基本物理常量表) 分别为 a1/a2
  - 00_内容简介 / 01_绪论 作为入口

重复内容 -> 板块映射：
  例/例题                -> <Example title="例 X.Y">
  定理/定义/性质/推论/引理/命题/公理 -> <Knowledge title="...">
  证明/证/解             -> <Solution>（嵌在卡片内）
  想一想/注意/注         -> <Note>
  课后题 X.Y.Z           -> <Exercise title="习题 X.Y.Z">
  习题参考答案           -> 独立页面（图片为主）

用法：D:\\python\\python.exe scripts/import_university_physics.py
"""

import os
import re
import shutil
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TASK = os.path.join(ROOT, 'task')
OUT = os.path.join(ROOT, 'src', 'content', 'docs', 'collections', 'science', 'university_physics')
IMAGES_OUT = os.path.join(OUT, 'images')
PUBLIC = os.path.join(ROOT, 'public')
COVERS = os.path.join(PUBLIC, 'covers')

V1A = '大学物理学 第7版 上=Physics (赵近芳) 前半(z-library.sk, 1lib.sk, z-lib.sk) (1).pdf-1ac9aa80-0f8f-418f-b584-f473a3ef6b6b'
V1B = '大学物理学 第7版 上=Physics (赵近芳) 后半(z-library.sk, 1lib.sk, z-lib.sk) (1).pdf-aa736eac-5d4a-48cd-9461-ea261d97c960'
V2A = '大学物理学北京邮电大学出版社(第七版)(下) 前半(赵近芳) (z-library.sk, 1lib.sk, z-lib.sk) (1).pdf-3889e752-79f4-4e48-9692-5df64e333a09'
V2B = '大学物理学北京邮电大学出版社(第七版)(下) 后半(赵近芳) (z-library.sk, 1lib.sk, z-lib.sk) (1).pdf-9f1b9437-ca69-4f28-9e3a-ac3c6aacbfc9'

CN_NUM = {'一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9, '十': 10}

CHAPTER_TITLES = {
    1: '质点运动学', 2: '质点动力学', 3: '刚体力学基础', 4: '狭义相对论',
    5: '机械振动', 6: '机械波', 7: '气体动理论基础', 8: '热力学基础',
    9: '静电场', 10: '稳恒磁场', 11: '变化的电磁场', 12: '光的干涉',
    13: '光的衍射', 14: '光的偏振', 15: '量子物理基础',
    16: '原子核物理和粒子物理简介', 17: '新技术的物理基础',
}

PART_NAMES = ('力学基础', '气体动理论和热力学', '电磁学', '波动光学', '量子论')


def read_lines(dirname):
    with open(os.path.join(TASK, dirname, 'full.md'), encoding='utf-8') as f:
        return f.read().splitlines()


def find_heading_index(lines, pattern, start=0):
    for i in range(start, len(lines)):
        if pattern.match(lines[i].strip()):
            return i
    return None


def strip_toc(lines):
    """V1A/V2A：去掉从 '## 目录' 到第一篇正文标题之间的目录区。"""
    toc = find_heading_index(lines, re.compile(r'^##\s*目录\s*$'))
    if toc is None:
        return lines
    nxt = None
    for i in range(toc + 1, len(lines)):
        s = lines[i].strip()
        if re.match(r'^#\s*(' + '|'.join(PART_NAMES) + r')\s*$', s):
            nxt = i
            break
    if nxt is None:
        return lines
    return lines[:toc] + lines[nxt:]


PART_RE = re.compile(r'^#\s*(' + '|'.join(PART_NAMES) + r')\s*$')
CH_RE = re.compile(r'^#{0,6}\s*第([\d一二三四五六七八九十]+)章\s*$')
SEC_RE = re.compile(r'^#{0,6}\s*\\?\*?(\d+)\.(\d+)(?:\s+(.*))?\s*$')
SUBSEC_HEAD_RE = re.compile(r'^#{1,6}\s*\\?\*?(\d+)\.(\d+)\.(\d+)\s')
TAIL_EX_RE = re.compile(r'^#{0,6}\s*习题\s*\d*\s*$')
TAIL_ANS_RE = re.compile(r'^习题参考答案\s*$')
TAIL_TYPE_RE = re.compile(r'^##\s*(\d+)\.(\d+)\s*(选择题|填空题|解答题)\s*$')
APPENDIX_RE = re.compile(r'^##\s*附录')
CLOUD_RE = re.compile(r'^##\s*配套云资源的使用说明')
ART_RE = re.compile(r'^(?:\d+\s*)?大学物理学\s*（第7版）\s*（上|下）\s*$')
SUMMARY_RE = re.compile(r'^本章提要\s*$')
TITLELIKE_RE = re.compile(r'^#{1,6}\s+\S')
SUBSEC_RE = re.compile(r'^#{1,6}\s*\\?\*?\d+\.\d+\.\d+')
EX_HEAD_RE = re.compile(r'^#{1,6}\s*(例|例题)\s*\d')
ART2_RE = re.compile(r'^大学物理学\s*[（(]\s*第\s*7\s*版\s*[)）]\s*[（(]\s*(上|下)\s*[)）]\s*$')


def is_artifact(s):
    """页眉/封底残留：整行丢弃。"""
    if ART_RE.match(s) or ART2_RE.match(s):
        return True
    if re.match(r'^#\s*Physics\b', s):
        return True
    return False


def split_chapters(lines):
    """把一卷正文切分为 {章号: {'intro': [...], 'sections': {节号: [...]}, 'tail': [...]}}。

    章边界判定：
      - `## 第X章` 标记（上册 2/3/5 章有，其余靠节号推断）；
      - 节号 X.Y 的 X 发生变化；
      - 篇标题 `# 篇名` 之后的第一节归属新章（ch1/7/9/12/15）。
    章尾（习题区）起点：`## 习题X` / `习题参考答案` / `## X.1 选择题` 中最先出现的；
    习题区终点：下一章/篇/附录，或以正文行 `本章提要` 结束（下一章导读开始）。
    """
    chapters = {}
    ch = None
    sec = None
    intro = []
    sections = {}
    tail = []
    in_tail = False
    part_intro = []
    pending_intro = []
    order = []

    def close():
        nonlocal ch, sec, intro, sections, tail, in_tail
        if ch is not None:
            chapters[ch] = {'intro': intro, 'sections': sections, 'tail': tail}
            order.append(ch)
        ch, sec = None, None
        intro, sections, tail = [], {}, []
        in_tail = False

    for raw in lines:
        s = raw.strip()
        if not s:
            continue
        if PART_RE.match(s):
            close()
            pending_intro = []
            part_intro = []
            continue
        if ART_RE.match(s):
            continue
        m = CH_RE.match(s)
        if m:
            close()
            ch = int(m.group(1)) if m.group(1).isdigit() else CN_NUM[m.group(1)]
            intro = list(pending_intro) if pending_intro else []
            pending_intro = []
            continue
        # 习题区题型标题（先于节号判定，避免被当成 "X.Y 选择题" 小节）
        if TAIL_TYPE_RE.match(s):
            if not in_tail:
                in_tail = True
            tail.append(raw)
            continue
        # 习题区起点
        if not in_tail and (TAIL_EX_RE.match(s) or TAIL_ANS_RE.match(s)):
            in_tail = True
            tail.append(raw)
            continue
        m = SEC_RE.match(s)
        if m:
            ch_num = int(m.group(1))
            sec_num = int(m.group(2))
            if ch is None or ch_num != ch:
                pending = list(pending_intro) if pending_intro else list(part_intro)
                pending_intro = []
                close()
                ch = ch_num
                intro = pending
                part_intro = []
                sections = {}
                tail = []
                in_tail = False
            prev_sec = sec
            sec = sec_num
            sections.setdefault(sec, [])
            # MinerU 偶发把节标题行放到节号前面（如 6.4）：从上一节末尾取回
            if prev_sec is not None and prev_sec in sections and sections[prev_sec]:
                prev_lines = sections[prev_sec]
                for k in range(len(prev_lines) - 1, -1, -1):
                    t = prev_lines[k].strip()
                    if not t:
                        continue
                    if (TITLELIKE_RE.match(t) and not SUBSEC_RE.match(t)
                            and not EX_HEAD_RE.match(t) and not TAIL_TYPE_RE.match(t)):
                        title_line = prev_lines.pop(k)
                        sections[sec].insert(0, title_line)
                    break
            if m.group(3):
                sections[sec].append(m.group(3).strip())
            continue
        m_sub = SUBSEC_HEAD_RE.match(s)
        if (m_sub and not in_tail and ch is not None
                and int(m_sub.group(1)) == ch and int(m_sub.group(2)) != sec):
            # 节号标记缺失（如 6.7 / 14.6）：按小节号推断新节，并回迁上一节末尾的标题
            new_sec = int(m_sub.group(2))
            prev_lines = sections.get(sec, [])
            moved = []
            k = len(prev_lines) - 1
            while k >= 0 and len(moved) < 12:
                t = prev_lines[k].strip()
                if not t:
                    k -= 1
                    continue
                moved.insert(0, (k, prev_lines[k]))
                if (TITLELIKE_RE.match(t) and not SUBSEC_RE.match(t)
                        and not EX_HEAD_RE.match(t)):
                    break
                k -= 1
            if moved and TITLELIKE_RE.match(moved[0][1].strip()):
                start = moved[0][0]
                sections.setdefault(new_sec, prev_lines[start:])
                del prev_lines[start:]
            else:
                sections.setdefault(new_sec, [])
            sec = new_sec
            sections[sec].append(raw)
            continue
        if in_tail:
            if SUMMARY_RE.match(s):
                # 习题区结束，下一章导读开始
                in_tail = False
                pending_intro = [raw]
                sec = None
                continue
            if APPENDIX_RE.match(s) or CLOUD_RE.match(s):
                # 附录/云资源区域由调用方另行处理
                close()
                pending_intro = [raw]
                continue
            tail.append(raw)
            continue
        if pending_intro:
            pending_intro.append(raw)
        elif ch is None:
            part_intro.append(raw)
        elif sec is None:
            intro.append(raw)
        else:
            sections[sec].append(raw)
    close()
    return chapters, order


EX_RE = re.compile(r'^(?:#{1,6}\s*)?(?:例|例题)\s*(\d+(?:\.\d+)*)\s*(.*)$')
KN_RE = re.compile(r'^(?:#{1,6}\s*)?(定理|定义|性质|推论|引理|命题|公理)\s*(\d+(?:\.\d+)*)\s*(.*)$')
NOTE_RE = re.compile(r'^(?:#{1,6}\s*)?(想一想|注意|注)\s*[:：]?\s*(.*)$')
SOL_RE = re.compile(r'^(?:#{1,6}\s*)?(证明|证|解)(?:[\s:：]+(.*))?$')
HEAD_RE = re.compile(r'^#{1,6}\s+\S')
QNUM_RE = re.compile(r'^(\d+)\.(\d+)\.(\d+)\s')
SUBHEAD_RE = re.compile(r'^(?:\\?\*?\d+[\.、](?!\d)|\(\d+\)|\\?\*?\d+\))')
FIGREF_RE = re.compile(r'题\s*(\d+)\.(\d+)\.(\d+)\s*图')
BARE_CAP_RE = re.compile(r'^(?:题|图)\s*\d+\.\d+(?:\.\d+)?\s*图?\s*$')
OPT_RE = re.compile(r'^[A-DＡ-Ｄ][\.．]')
PARE_RE = re.compile(r'^[\(（]\s*\d+\s*[\)）]')
PAREN_EMPTY_RE = re.compile(r'^[\(（]\s*[\)）]')
CONT_RE = re.compile(r'^(式中|其中|这里|于是|因此|所以|因而|则|由上式|代入|解得|得|联立|再|又|可见|由式|将式|把|令|此时|这时|从而|但|然而|换言之|即|亦即|若将|由|那么|请问|试问)')
NEWQ_RE = re.compile(r'(试求|试问|试计算|试证明|试比较|试述|试说明|试判断|求[:：。．]|求\s|求(?=[\u4e00-\u9fffA-Za-z$\\])|计算|证明[:：]|能否|为什么|是否|是多少|多大|多少|问[:：]|[?？]|^已知|评论|判断|试求)')
KNOWN_BACKREF_RE = re.compile(r'^已知.*(?:上述|上式|该反应|此反应|上题|由上|此式|该式)')
QNUM_ONLY_RE = re.compile(r'^(\d+)\.(\d+)\.(\d+)\s*$')


def tokenize_body(lines):
    """正文行 -> 结构 token：(kind, ...)。
    kind: para | heading | card(example/knowledge) | note | solution
    """
    tokens = []
    cur = None
    cur_sol = None

    def flush():
        nonlocal cur, cur_sol
        if cur_sol:
            cur[4].append(cur_sol)
            cur_sol = None
        if cur:
            tokens.append(cur)
            cur = None

    def as_content(raw):
        nonlocal cur, cur_sol
        line = re.sub(r'^#{1,6}\s*', '', raw)
        if cur is not None and cur[0] == 'card' and cur_sol is not None:
            cur_sol[1].append(line)
        elif cur is None:
            cur = ('para', None, [line])
        elif cur[0] == 'card':
            cur[3].append(line)
        else:
            cur[2].append(line)

    for raw in lines:
        s = raw.strip()
        if not s:
            continue
        if is_artifact(s):
            continue
        m = EX_RE.match(s)
        if m:
            flush()
            cur = ('card', 'example', '例 ' + m.group(1), [], [])
            if m.group(2):
                cur[3].append(m.group(2))
            continue
        m = KN_RE.match(s)
        if m:
            flush()
            cur = ('card', 'knowledge', m.group(1) + ' ' + m.group(2), [], [])
            if m.group(3):
                cur[3].append(m.group(3))
            continue
        m = NOTE_RE.match(s)
        if m:
            flush()
            cur = ('note', None, [])
            if m.group(2):
                cur[2].append(m.group(2))
            continue
        m = SOL_RE.match(s)
        if m:
            title = '证明' if m.group(1) in ('证明', '证') else '解'
            if cur is not None and cur[0] == 'card':
                if cur_sol is None:
                    cur_sol = (title, [])
                if m.group(2):
                    cur_sol[1].append(m.group(2))
            else:
                if cur is not None:
                    flush()
                cur = ('solution', title, [])
                if m.group(2):
                    cur[2].append(m.group(2))
            continue
        if HEAD_RE.match(s):
            txt = re.sub(r'^#{1,6}\s*', '', s)
            # MinerU 偶发把例子的题干行识别成标题（如 "## 设有 N 个粒子, ..."）
            if txt.startswith('设有') or (
                    re.match(r'^\(\d+\)', txt) and txt.rstrip().endswith(('.', '．', '。'))):
                as_content(raw)
                continue
            flush()
            tokens.append(('heading', None, txt))
            continue
        if cur is not None and cur[0] == 'card' and cur_sol is not None:
            cur_sol[1].append(raw)
            continue
        if cur is None:
            cur = ('para', None, [])
        if cur[0] == 'card':
            cur[3].append(raw)
        else:
            cur[2].append(raw)
    flush()
    return tokens


def render_body(lines):
    esc = MDXEscaper()

    def esc_lines(buf):
        return '\n\n'.join(esc(l) for l in buf)

    out = []
    for tok in tokenize_body(lines):
        kind = tok[0]
        if kind == 'para':
            out.append(esc_lines(tok[2]))
        elif kind == 'heading':
            txt = tok[2]
            # 编号子标题降一级（1. / 2. / (1) / 1) 等），小节标题保持 ##
            prefix = '###' if SUBHEAD_RE.match(txt) else '##'
            out.append('%s %s' % (prefix, esc(txt)))
        elif kind == 'note':
            out.append('<Note>\n%s\n</Note>' % esc_lines(tok[2]))
        elif kind == 'solution':
            out.append('<Solution title="%s">\n%s\n</Solution>' % (tok[1], esc_lines(tok[2])))
        elif kind == 'card':
            inner = esc_lines(tok[3])
            sols = []
            for title, lines in tok[4]:
                sols.append('<Solution title="%s">\n%s\n</Solution>' % (title, esc_lines(lines)))
            body = '\n\n'.join([inner] + sols)
            comp = 'Example' if tok[1] == 'example' else 'Knowledge'
            out.append('<%s title="%s">\n%s\n</%s>' % (comp, tok[2], body, comp))
    return '\n\n'.join(out)


def tokenize_exercise(lines, ch, sec):
    """题型区（选择题/填空题/解答题）行 -> Exercise 卡片列表 [(title, content_lines)]。

    规则：
      - 以 `X.Y.Z` 开头的行是新的题目，标题 `习题 X.Y.Z`；
      - 未编号的段落按以下顺序判定是否为新题：
          1) 以 (n) 开头 / 选项行 / 常见续写词开头 -> 并入当前题；
          2) 段落内或紧随其后的图注含 `题X.Y.Z图` -> 新题，标题取该编号；
          3) 段落含求解/疑问标记 -> 新题，编号按顺序回填；
          4) 其余并入当前题。
      - 裸图注（题X.Y.Z图）只作为当前题配图，不另起新题。
    """
    cards = []
    cur = None
    expected = 1
    idx = 0

    def start_card(num):
        nonlocal cur, expected
        if num is None:
            num = expected
        cards.append(('习题 %d.%d.%d' % (ch, sec, num), []))
        cur = cards[-1]
        expected = num + 1

    while idx < len(lines):
        raw = lines[idx]
        s = raw.strip()
        if not s:
            idx += 1
            continue
        m = QNUM_ONLY_RE.match(s)
        if m:
            # 纯编号行（如 "8.3.6"）：开启新题，题干由后续段落补上
            start_card(int(m.group(3)))
            idx += 1
            continue
        if is_artifact(s):
            idx += 1
            continue
        m = QNUM_RE.match(s)
        if m:
            start_card(int(m.group(3)))
            rest = s[m.end():]
            if rest:
                cur[1].append(rest)
            idx += 1
            continue
        if BARE_CAP_RE.match(s):
            # 裸图注：配图（若当前无题则开新题）
            if cur is None:
                start_card(None)
            cur[1].append(raw)
            idx += 1
            continue
        if KNOWN_BACKREF_RE.match(s):
            # "已知...上述/该反应" 这类数据续文：并入当前题
            if cur is None:
                start_card(None)
            cur[1].append(raw)
            idx += 1
            continue
        if PAREN_EMPTY_RE.match(s) or PARE_RE.match(s) or OPT_RE.match(s) or CONT_RE.match(s):
            if cur is None:
                start_card(None)
            cur[1].append(raw)
            idx += 1
            continue
        # 图号恢复：仅段落内（裸图注只作配图，不另起新题）
        num = None
        mf = FIGREF_RE.search(s)
        if mf:
            num = '%d.%d.%d' % (int(mf.group(1)), int(mf.group(2)), int(mf.group(3)))
        if num is not None and cur is not None:
            cur_num = int(cur[0].split('.')[2])
            if cur_num == int(num.split('.')[2]):
                # 纯编号行后的题干（图号与当前题相同）：并入当前题
                cur[1].append(raw)
                idx += 1
                continue
        cjk_len = len(re.sub(r'\s+', '', re.sub(r'\$[^$]*\$', '', s)))
        is_short_fragment = (cur is not None and num is None and cjk_len < 30
                             and re.search(r'[?？]|求|试|多少', s))
        if (num is not None or NEWQ_RE.search(s)) and not is_short_fragment:
            start_card(int(num.split('.')[2]) if num else None)
            cur[1].append(raw)
            idx += 1
            continue
        # 默认：并入当前题
        if cur is None:
            start_card(None)
        cur[1].append(raw)
        idx += 1
    return cards


def render_exercise(cards):
    esc = MDXEscaper()
    out = []
    for title, lines in cards:
        out.append('<Exercise title="%s">\n%s\n</Exercise>' % (title, '\n\n'.join(esc(l) for l in lines)))
    return '\n\n'.join(out)


def extract_answer_chunk(tail):
    """从习题尾切出'习题参考答案'图片区，返回行列表或 None。"""
    idx = None
    for i, line in enumerate(tail):
        if TAIL_ANS_RE.match(line.strip()):
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
    # 去掉标题行本身，避免与页面标题重复
    return [l for l in chunk if not TAIL_ANS_RE.match(l.strip())]


def split_tail_by_type(tail, ch):
    """把习题尾按题型切分，返回 {题型: 行列表}。"""
    types = {}
    cur = None
    cur_lines = []
    for line in tail:
        m = TAIL_TYPE_RE.match(line.strip())
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


class MDXEscaper:
    """把正文里裸露的 < { } 转义，避免 MDX 把它们当作 JSX；数学环境与 HTML 表格保持原样。"""

    def __init__(self):
        self.display = False
        self.inline = False

    def __call__(self, line):
        s = line.strip()
        if s == '$$':
            self.display = not self.display
            return line
        if self.display:
            return line
        if '<table' in line or '</table>' in line or '<tr>' in line or '<td>' in line or '<th>' in line:
            # HTML 表格在 MDX 里会被当作内联 HTML 解析，裸 ~ 会被当成删除线分隔符
            return line.replace('~', '～')
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
                out.append('&lt;')
            elif ch == '{':
                out.append('\\{')
            elif ch == '}':
                out.append('\\}')
            else:
                out.append(ch)
            i += 1
        return ''.join(out)


def safe_title(s):
    s = re.sub(r'\$[^$]*\$', '', s)
    s = re.sub(r'[\\/:*?"<>|#{}\$]', '', s)
    s = re.sub(r'[、，。．,.;;：:（）()\[\]【】]', '', s)
    s = re.sub(r'\s+', '', s)
    return s.strip()


IMPORTS = (
    "import Guide from '@/components/Guide.astro';\n"
    "import Knowledge from '@/components/Knowledge.astro';\n"
    "import Example from '@/components/Example.astro';\n"
    "import Analysis from '@/components/Analysis.astro';\n"
    "import Solution from '@/components/Solution.astro';\n"
    "import Variant from '@/components/Variant.astro';\n"
    "import Note from '@/components/Note.astro';\n"
    "import Block from '@/components/Block.astro';\n"
    "import Method from '@/components/Method.astro';\n"
    "import Exercise from '@/components/Exercise.astro';\n"
)


def write_mdx(filename, title, body):
    title = title.replace("'", "\\'")
    header = "---\ntitle: '%s'\n---\n\n" % title
    with open(os.path.join(OUT, filename), 'w', encoding='utf-8') as f:
        f.write(header + IMPORTS + '\n' + body.strip() + '\n')


def collect_images(lines_list, src_dir, refs):
    for lines in lines_list:
        for m in re.finditer(r'!\[[^\]]*\]\((images/[^)]+)\)', '\n'.join(lines)):
            refs.setdefault(m.group(1), src_dir)


def copy_images(refs, src_dirs):
    os.makedirs(IMAGES_OUT, exist_ok=True)
    copied = 0
    for rel, src_dir in refs.items():
        name = os.path.basename(rel)
        dst = os.path.join(IMAGES_OUT, name)
        if os.path.exists(dst):
            continue
        found = None
        for d in src_dirs:
            cand = os.path.join(TASK, d, 'images', name)
            if os.path.exists(cand):
                found = cand
                break
        if found:
            shutil.copy2(found, dst)
            copied += 1
        else:
            print('  [warn] 图片缺失:', rel)
    return copied


def make_cover():
    """生成图书卡片封面（源文件中没有可用的书封面扫描图，做一张简洁的文字封面）。"""
    try:
        from PIL import Image, ImageDraw, ImageFont
    except Exception:
        print('  [warn] PIL 不可用，跳过封面生成')
        return
    os.makedirs(COVERS, exist_ok=True)
    dst = os.path.join(COVERS, 'university_physics.jpg')
    if os.path.exists(dst):
        return
    W, H = 600, 840
    img = Image.new('RGB', (W, H))
    draw = ImageDraw.Draw(img)
    top = (11, 45, 66)
    bottom = (3, 17, 32)
    for y in range(H):
        t = y / H
        r = int(top[0] + (bottom[0] - top[0]) * t)
        g = int(top[1] + (bottom[1] - top[1]) * t)
        b = int(top[2] + (bottom[2] - top[2]) * t)
        draw.line([(0, y), (W, y)], fill=(r, g, b))
    fonts = [
        r'C:\Windows\Fonts\msyhbd.ttc',
        r'C:\Windows\Fonts\msyh.ttc',
        r'C:\Windows\Fonts\simhei.ttf',
        r'C:\Windows\Fonts\simsun.ttc',
    ]
    font_path = next((p for p in fonts if os.path.exists(p)), None)
    if not font_path:
        print('  [warn] 未找到中文字体，封面文字可能无法显示')
        font_path = None
    def font(size):
        return ImageFont.truetype(font_path, size) if font_path else ImageFont.load_default()
    draw.rectangle([0, 0, W, H], outline=(255, 255, 255), width=4)
    draw.rectangle([14, 14, W - 14, H - 14], outline=(255, 255, 255), width=2)
    draw.text((W // 2, 220), '大学物理学', font=font(72), fill=(255, 255, 255), anchor='mm')
    draw.text((W // 2, 310), '（第七版）', font=font(44), fill=(190, 210, 230), anchor='mm')
    draw.line([(W // 2 - 90, 390), (W // 2 + 90, 390)], fill=(255, 255, 255), width=2)
    draw.text((W // 2, 450), '赵近芳  王登龙  主编', font=font(34), fill=(255, 255, 255), anchor='mm')
    draw.text((W // 2, 650), '北京邮电大学出版社', font=font(34), fill=(190, 210, 230), anchor='mm')
    img.save(dst, quality=90)
    print('封面已生成 public/covers/university_physics.jpg')


def main():
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass
    print('== 读取原始 markdown ==')
    v1a = read_lines(V1A)
    v1b = read_lines(V1B)
    v2a = read_lines(V2A)
    v2b = read_lines(V2B)

    # ---- 上册 ----
    intro_start = find_heading_index(v1a, re.compile(r'^##\s*内容简介\s*$'))
    intro_end = find_heading_index(v1a, re.compile(r'^##\s*图书在版编目'), intro_start + 1)
    intro_lines = v1a[intro_start + 1:intro_end]
    intro_lines = [l for l in intro_lines if l.strip()]

    intro_sec = find_heading_index(v1a, re.compile(r'^##\s*绪论\s*$'))
    jl_start = intro_sec
    jl_end = find_heading_index(v1a, re.compile(r'^##\s*目录\s*$'), jl_start + 1)
    jl_lines = v1a[jl_start + 1:jl_end]

    v1a_body = strip_toc(v1a[intro_sec:])
    app_start = find_heading_index(v1b, APPENDIX_RE)
    v1b_body = v1b[:app_start]
    appendix_lines = v1b[app_start:]
    cloud_idx = find_heading_index(appendix_lines, CLOUD_RE)
    if cloud_idx is not None:
        appendix_lines = appendix_lines[:cloud_idx]

    # ---- 下册 ----
    v2a_start = find_heading_index(v2a, re.compile(r'^#\s*电磁学\s*$'))
    v2a_body = v2a[v2a_start:]
    v2b_end = find_heading_index(v2b, CLOUD_RE)
    v2b_body = v2b[:v2b_end] if v2b_end is not None else v2b

    vol1, order1 = split_chapters(v1a_body + v1b_body)
    vol2, order2 = split_chapters(v2a_body + v2b_body)
    print('上册章节:', order1)
    print('下册章节:', order2)

    refs = {}
    src_dirs = [V1A, V1B, V2A, V2B]

    # 清理旧输出，避免残留旧文件
    if os.path.isdir(OUT):
        shutil.rmtree(OUT)
    os.makedirs(OUT, exist_ok=True)

    # ---------- 00 内容简介 ----------
    intro_body = ('\n\n'.join(intro_lines).strip()
                  + '\n\n本书第 7 版分上、下两册出版：上册（第 1—8 章）包括力学基础（质点运动学、'
                    '质点动力学、刚体力学基础、狭义相对论、机械振动、机械波）与气体动理论和热力学；'
                    '下册（第 9—17 章）包括电磁学、波动光学与量子论。每章课后习题按选择题、填空题、'
                    '解答题分页整理，每题一个板块，部分章节附参考答案。')
    write_mdx('00_内容简介.mdx', '内容简介', intro_body)
    print('生成 00_内容简介.mdx')
    collect_images([intro_lines], V1A, refs)

    # ---------- 01 绪论 ----------
    jl_body = render_body(jl_lines)
    write_mdx('01_绪论.mdx', '绪论', jl_body)
    print('生成 01_绪论.mdx')
    collect_images([jl_lines], V1A, refs)

    # ---------- 章节 ----------
    all_chapters = [(ch, vol1.get(ch)) for ch in order1] + [(ch, vol2.get(ch)) for ch in order2]
    for ch, info in all_chapters:
        sections = info['sections']
        intro = info['intro']
        tail = info['tail']
        if not sections:
            continue
        last_sec = max(sections.keys())
        first = True
        for sec in sorted(sections):
            sec_lines = sections[sec]
            # 节标题：行内标题，或紧跟节号后的下一非空行（若非小节编号）
            sec_title = ''
            body_lines = list(sec_lines)
            if body_lines and not re.match(r'^#{0,6}\s*\\?\*?\d+\.\d+\.\d+', body_lines[0].strip()):
                cand = body_lines[0].strip()
                if re.match(r'^#{0,6}\s*\\?\*?\d+\.\d+(\s|$)', cand):
                    body_lines = body_lines[1:]
                    cand = ''
                if not cand and body_lines:
                    cand = body_lines[0].strip()
                if cand and not re.match(r'^#{0,6}\s*\\?\*?\d+\.\d+\.\d+', cand):
                    sec_title = re.sub(r'^#{0,6}\s*\\?\*?\s*', '', cand)
                    body_lines = body_lines[1:]
            body = render_body(body_lines)
            if not body.strip():
                continue
            intro_for_imgs = []
            if first:
                # 章首：并入章标题与本章提要
                intro_for_imgs = list(intro)
                intro_body = render_body(intro)
                # 去掉正文里重复出现的章标题行（如 "## 机械振动" / "## 量子物理基础"）
                intro_body = re.sub(
                    r'(?m)^##\s*' + re.escape(CHAPTER_TITLES.get(ch, '')) + r'\s*$\n\n?', '',
                    intro_body)
                prefix = '## 第%d章 %s\n\n%s' % (ch, CHAPTER_TITLES.get(ch, ''), intro_body)
                body = prefix + '\n\n' + body
                first = False
            title = '%d.%d %s' % (ch, sec, sec_title) if sec_title else '%d.%d' % (ch, sec)
            fname = '%d.%d_%s.mdx' % (ch, sec, safe_title(sec_title)) if sec_title else '%d.%d.mdx' % (ch, sec)
            write_mdx(fname, title, body)
            print('生成 %d.%d_%s' % (ch, sec, safe_title(sec_title) or ''))
            collect_images([body_lines, intro_for_imgs], None, refs)

        # ---------- 章末习题（按题型分页） ----------
        if tail:
            ans_chunk = extract_answer_chunk(tail)
            types = split_tail_by_type(tail, ch)
            type_names = {'选择题': '选择题', '填空题': '填空题', '解答题': '解答题'}
            idx = last_sec + 1
            for tname, tlines in types.items():
                if not tlines:
                    continue
                cards = tokenize_exercise(tlines, ch, {'选择题': 1, '填空题': 2, '解答题': 3}[tname])
                body = '## %s\n\n%s' % (tname, render_exercise(cards))
                write_mdx('%d.%d_第%d章习题-%s.mdx' % (ch, idx, ch, tname),
                          '第%d章 习题（%s）' % (ch, tname), body)
                print('生成 第%d章 习题-%s（%d 题）' % (ch, tname, len(cards)))
                collect_images([tlines], None, refs)
                idx += 1
            if ans_chunk:
                body = '## 习题参考答案\n\n%s' % render_body(ans_chunk)
                write_mdx('%d.%d_第%d章习题参考答案.mdx' % (ch, idx, ch),
                          '第%d章 习题参考答案' % ch, body)
                print('生成 第%d章 习题参考答案' % ch)
                collect_images([ans_chunk], None, refs)
                idx += 1

    # ---------- 上册附录 ----------
    table_idx = None
    for i, line in enumerate(appendix_lines):
        if '<table' in line:
            table_idx = i
            break
    if appendix_lines and table_idx is not None:
        a1 = appendix_lines[:table_idx]
        a2 = appendix_lines[table_idx:]
        write_mdx('a1_附录1_矢量.mdx', '附录I 矢量', render_body(a1))
        print('生成 附录I 矢量')
        write_mdx('a2_附录2_常用基本物理常量表.mdx', '附录II 常用基本物理常量表', render_body(a2))
        print('生成 附录II 常用基本物理常量表')
        collect_images([a1, a2], V1B, refs)

    # ---------- 图片 ----------
    print('== 拷贝图片 ==')
    copied = copy_images(refs, src_dirs)
    print('引用图片 %d 个，新拷贝 %d 个' % (len(refs), copied))

    # ---------- 封面 ----------
    make_cover()

    print('== 完成 ==')


if __name__ == '__main__':
    sys.exit(main())
