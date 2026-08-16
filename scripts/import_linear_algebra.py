#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
把 task/ 中《线性代数及其应用》(原书第5版, David C. Lay 等, 机械工业出版社) 的 MinerU 产物
批量转换为站点 MDX。

源：三个 PDF 的 MinerU 产物拼接（跨 PDF 章节自动续接）：
  V1 = 书前 + 第1-3章
  V2 = 第3章补充习题续 + 第4-6章
  V3 = 6.8 续 + 第7-8章 + 附录A/B + 术语表 + 奇数习题答案

拆分设计（与书本层级一致）：
  - 每"节"一篇 MDX（如 1.1_线性方程组），节尾"练习题/习题X.Y/练习题答案"各为一个 <Block>
  - 每章开头"介绍性实例"独立一篇 {章}.0_...
  - 每章末尾"补充习题"独立一篇 {章}.{末节+1}_第X章补充习题
  - 书前 00_内容简介 / 01_译者序与前言 / 02_给学生的注释
  - 附录 a1/a2、术语表 a3
  - 书末"奇数习题答案"按章拆为 b{章}_第X章奇数习题答案（含补充习题答案）

重复内容 -> 板块映射：
  例/例题            -> <Example title="例 N">（编号后接引用特征词视为正文引用，不建卡片）
  定理               -> <Knowledge title="定理 N">（同上）
  注意/警告/注       -> <Note>（"注意到"除外）
  证明/证/解         -> <Solution>（嵌在卡片内）
  练习题/习题X.Y/练习题答案/补充习题 -> <Block title="...">

脚注探索（本书首次处理）：
  - 正文 `$^{①}$` 脚注标记 -> `<sup>①</sup>`（原生上标，不占用 KaTeX）
  - 行首 `① 文本`（MinerU 提取的页脚注释文本）收集到节末 <Block title="脚注">
  - 内容缺失的脚注仅保留上标标记（MinerU 局限，如实保留）

用法：D:\\python\\python.exe scripts/import_linear_algebra.py
"""

import os
import re
import shutil
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TASK = os.path.join(ROOT, 'task')
OUT = os.path.join(ROOT, 'src', 'content', 'docs', 'collections', 'math', 'linear_algebra')
IMAGES_OUT = os.path.join(OUT, 'images')
PUBLIC = os.path.join(ROOT, 'public')
COVERS = os.path.join(PUBLIC, 'covers')

V1 = '线性代数及其应用 ( etc.) (z-library.sk, 1lib.sk, z-lib.sk (1).pdf-3e621475-54f7-465f-b0d0-6ad7253e5cc5'
V2 = '线性代数及其应用 ( etc.) (z-library.sk, 1lib.sk, z-lib.sk (1).pdf-c18de42d-3a0c-4b90-8661-ef624c1e575e'
V3 = '线性代数及其应用 ( etc.) (z-library.sk, 1lib.sk, z-lib.sk (1).pdf-b9cbb8c4-0fa4-47ea-b770-de5032f57a34'
SRC_DIRS = (V1, V2, V3)

CN_NUM = {'一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9, '十': 10}
CNNUM = r'[\d一二三四五六七八九十]+'

CH_RE = re.compile(r'^#{1,6}\s*第\s*(%s)\s*章\s*(.*)$' % CNNUM)
SEC_RE = re.compile(r'^#{0,6}\s*(\d+)\.(\d+)\s+(.*)$')
INTRO_RE = re.compile(r'^#{0,6}\s*介绍性实例\s*(.*)$')
BLOCK_HEAD_RE = re.compile(r'^(?:#{1,6}\s*)?(练习题答案|练习题|习题\s*\d+\.\d+|补充习题)\s*$')


def is_section_heading(s):
    """判定 'X.Y 标题' 是否为真正的节标题行。

    正文中 '1.5 节的齐次线性方程组…'、'5.9 节的定理18…' 这类"X.Y 节"引用
    会被 SEC_RE 误匹配，需排除：标题文字以'节'开头的视为引用。
    """
    m = SEC_RE.match(s)
    if not m:
        return None
    rest = m.group(3).strip()
    if rest.startswith('节'):
        return None
    return m

# 卡片识别
EX_RE = re.compile(r'^(?:#{0,6}\s*)?(?:例|例题)\s*(\d+(?:\.\d+)*)\s*(.*)$')
KN_RE = re.compile(r'^(?:#{0,6}\s*)?(定理)\s*(\d+(?:\.\d+)*)\s*(.*)$')
NOTE_RE = re.compile(r'^(?:#{0,6}\s*)?(注意(?![到])|警告|注)\s*[:：，,]?\s*(.*)$')
SOL_RE = re.compile(r'^(?:#{0,6}\s*)?(证明|证|解(?!\s*\d))\s*[:：]?\s*(.*)$')
HEAD_RE = re.compile(r'^#{1,6}\s+\S')

# 编号后接这些特征词 -> 正文引用（例/定理的"标题行"其实是指向别处，不能开卡片）
REF_START = (
    '的', '中', '和', '与', '及', '说', '是', '里', '后', '也', '都', '还', '则', '并', '但',
    '所', '或', '且', '给出', '证明的', '证明了', '证明并', '证明也', '证明和', '证明与',
    '证明的主要', '证明并没有', '上述', '上面', '下面', '以下', '下述', '前面', '后面',
    '结论', '公式', '意义', '应用', '重要', '思想', '过程', '表明', '说明', '叙述', '随后',
    '来自', '第', '见',
)

# 脚注
FN_MARK_RE = re.compile(r'\$\^\{([①-⑳])\}\$|\$\^\{\\text\{([①-⑳])\}\}\$')
FN_LINE_RE = re.compile(r'^([①-⑳])\s+(.*)$')

# 答案区
ANS_HEAD_RE = re.compile(r'^#\s*奇数习题答案\s*$')
ANS_CH_RE = re.compile(r'^#{1,6}\s*第\s*(%s)\s*章\s*$' % CNNUM)
ANS_SUP_RE = re.compile(r'^#{1,6}\s*第\s*(%s)\s*章\s*补充习题\s*$' % CNNUM)
APPENDIX_RE = re.compile(r'^#{1,6}\s*附录\s*([AB])\s*(.*)$')
GLOSSARY_RE = re.compile(r'^#{1,6}\s*术语表\s*$')
GARBAGE_RE = re.compile(r'^\[General Information\]|^书名=|^SS号=')


def read_lines(dirname):
    with open(os.path.join(TASK, dirname, 'full.md'), encoding='utf-8') as f:
        return f.read().splitlines()


def find_heading_index(lines, pattern, start=0):
    for i in range(start, len(lines)):
        if pattern.match(lines[i].strip()):
            return i
    return None


def split_chapters(lines):
    """按 '# 第X章' 切分，返回 [(章号, 标题, 行列表)]。"""
    chapters = []
    cur = None
    for line in lines:
        m = CH_RE.match(line.strip())
        if m:
            if cur:
                chapters.append(cur)
            num = int(m.group(1)) if m.group(1).isdigit() else CN_NUM[m.group(1)]
            cur = [num, m.group(2).strip(), []]
        elif cur is not None:
            cur[2].append(line)
    if cur:
        chapters.append(cur)
    return chapters


def split_chapter_parts(ch_lines):
    """章内切分：介绍性实例 / 各节 / 补充习题。

    返回 (intro_lines_or_None, intro_title, {节号: {'title': str, 'lines': []}}, 补充习题行列表)。
    """
    intro = None
    intro_title = ''
    sections = {}
    tail = []
    cur = None  # ('intro'|('sec', num)|('tail', None), 行列表)
    for line in ch_lines:
        s = line.strip()
        if not s:
            if cur is not None:
                cur[1].append(line)
            continue
        m = INTRO_RE.match(s)
        if m:
            intro = []
            intro_title = m.group(1).strip()
            cur = ('intro', intro)
            continue
        if BLOCK_HEAD_RE.match(s) and (cur is None or cur[0] != 'tail'):
            # 章尾补充习题（节末的 练习题/习题X.Y/练习题答案 由节处理，这里只切补充习题）
            if re.match(r'^(?:#{1,6}\s*)?补充习题\s*$', s):
                tail = []
                cur = ('tail', tail)
                continue
        m = is_section_heading(s)
        if m:
            sec_num = int(m.group(2))
            sections.setdefault(sec_num, {'title': m.group(3).strip() if m.group(3) else '', 'lines': []})
            cur = ('sec', sections[sec_num]['lines'])
            continue
        if cur is None:
            # 章标题后、第一节前的内容（通常是空的）
            intro = []
            cur = ('intro', intro)
        cur[1].append(line)
    return intro, intro_title, sections, tail


def split_section_blocks(sec_lines):
    """节内按 练习题/习题X.Y/练习题答案 标题切分，返回 [(None|块名, 行列表)]。

    第一个元素为正文（块名 None），其后为各 Block。
    """
    parts = []
    cur_name = None
    cur_lines = []
    for line in sec_lines:
        s = line.strip()
        m = BLOCK_HEAD_RE.match(s)
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
    # 去掉空正文
    return [(n, ls) for n, ls in parts if n is not None or any(l.strip() for l in ls)]


def collect_footnotes(parts):
    """从节各部分收集行首脚注文本（① xxx），从内容中移除；返回 (parts, footnotes列表)。"""
    fns = []
    new_parts = []
    for name, lines in parts:
        kept = []
        for line in lines:
            s = line.strip()
            m = FN_LINE_RE.match(s)
            if m:
                fns.append((m.group(1), m.group(2)))
                continue
            kept.append(line)
        new_parts.append((name, kept))
    return new_parts, fns


def is_ref_quote(rest):
    """判定例/定理编号后的剩余文本是否引用句（指向别处，非卡片标题）。"""
    r = rest.strip()
    if not r:
        return False
    return r.startswith(REF_START)


def tokenize(lines):
    """正文行 -> 结构 token：(kind, ...)。"""
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

    for raw in lines:
        s = raw.strip()
        if not s:
            continue
        m = EX_RE.match(s)
        if m and not is_ref_quote(m.group(2)):
            flush()
            cur = ('card', 'example', '例 ' + m.group(1), [], [])
            if m.group(2):
                cur[3].append(m.group(2))
            continue
        m = KN_RE.match(s)
        if m and not is_ref_quote(m.group(3)):
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
            flush()
            tokens.append(('heading', None, re.sub(r'^#{1,6}\s*', '', s)))
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


def esc_body(lines):
    esc = MDXEscaper()
    out = []
    for line in lines:
        out.append(esc(line))
    text = '\n\n'.join(out)
    return fn_mark_to_sup(text)


def fn_mark_to_sup(text):
    """正文脚注标记 $^{①}$ / $^{\text{②}}$ -> <sup>①</sup>。"""
    def repl(m):
        return '<sup>%s</sup>' % (m.group(1) or m.group(2))
    return FN_MARK_RE.sub(repl, text)


def render_tokens(tokens):
    out = []
    for tok in tokens:
        kind = tok[0]
        if kind == 'para':
            out.append(esc_body(tok[2]))
        elif kind == 'heading':
            # 注意：heading 的 tok[2] 是单行字符串（非行列表），不能走 esc_body（会把字符拆行）
            esc = MDXEscaper()
            out.append('## ' + fn_mark_to_sup(esc(tok[2])))
        elif kind == 'note':
            out.append('<Note>\n%s\n</Note>' % esc_body(tok[2]))
        elif kind == 'solution':
            out.append('<Solution title="%s">\n%s\n</Solution>' % (tok[1], esc_body(tok[2])))
        elif kind == 'card':
            inner = esc_body(tok[3])
            sols = []
            for title, lines in tok[4]:
                sols.append('<Solution title="%s">\n%s\n</Solution>' % (title, esc_body(lines)))
            body = '\n\n'.join([inner] + sols)
            comp = 'Example' if tok[1] == 'example' else 'Knowledge'
            out.append('<%s title="%s">\n%s\n</%s>' % (comp, tok[2], body, comp))
    return '\n\n'.join(out)


def render_parts(parts, with_footnotes=True):
    """渲染节/章的 正文+块 序列。parts: [(None|块名, 行列表)]。"""
    out = []
    fns = []
    if with_footnotes:
        parts, fns = collect_footnotes(parts)
    for name, lines in parts:
        if name is None:
            body = render_tokens(tokenize(lines))
            if body:
                out.append(body)
        else:
            body = esc_body(lines)
            if body.strip():
                out.append('<Block title="%s">\n%s\n</Block>' % (name, body))
    if fns:
        fn_items = []
        for num, text in sorted(fns, key=lambda x: '①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳'.index(x[0])):
            fn_items.append('%s %s' % (num, text))
        out.append('<Block title="脚注">\n%s\n</Block>' % '\n\n'.join(fn_items))
    return '\n\n'.join(out)


def safe_title(s):
    s = re.sub(r'\$\\mathbb\{R\}\^n\$', 'R^n', s)
    s = re.sub(r'\$([^$]*)\$', lambda m: re.sub(r'\s+', '', m.group(1)), s)
    s = re.sub(r'[\\/:*?"<>|#{}\$]', '', s)
    s = re.sub(r'[、，。．,.;;：:（）()\[\]【】]', '', s)
    s = re.sub(r'\s+', '', s)
    return s.strip()


IMPORTS = (
    "import Knowledge from '@/components/Knowledge.astro';\n"
    "import Example from '@/components/Example.astro';\n"
    "import Note from '@/components/Note.astro';\n"
    "import Solution from '@/components/Solution.astro';\n"
    "import Block from '@/components/Block.astro';\n"
)


def write_mdx(filename, title, body):
    # frontmatter title 里的公式转为可读文本（$Ax = b$ -> Ax=b，$\mathbb{R}^n$ -> R^n）
    title = re.sub(r'\$\\mathbb\{R\}\^n\$', 'R^n', title)
    title = re.sub(r'\$([^$]*)\$', lambda m: re.sub(r'\s+', '', m.group(1)), title)
    title = title.replace("'", "\\'")
    header = "---\ntitle: '%s'\n---\n\n" % title
    with open(os.path.join(OUT, filename), 'w', encoding='utf-8') as f:
        f.write(header + IMPORTS + '\n' + body.strip() + '\n')


def collect_images(lines_list, src_dir, refs):
    for lines in lines_list:
        for m in re.finditer(r'!\[[^\]]*\]\((images/[^)]+)\)', '\n'.join(lines)):
            refs.setdefault(m.group(1), src_dir)


def copy_images(refs):
    os.makedirs(IMAGES_OUT, exist_ok=True)
    copied = 0
    for rel, src_dir in refs.items():
        name = os.path.basename(rel)
        dst = os.path.join(IMAGES_OUT, name)
        if os.path.exists(dst):
            continue
        found = None
        for d in SRC_DIRS:
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


def split_answer_sections(ans_lines):
    """答案区按章分组：{章号: [('第X章 习题答案'|'第X章补充习题 答案', 行列表)]}。"""
    groups = {}
    cur = None
    cur_part = None
    cur_lines = []
    for line in ans_lines:
        s = line.strip()
        if not s:
            if cur is not None:
                cur_lines.append(line)
            continue
        m = ANS_CH_RE.match(s)
        if m:
            if cur is not None and cur_part is not None:
                groups.setdefault(cur, []).append((cur_part, cur_lines))
            cur = int(m.group(1)) if m.group(1).isdigit() else CN_NUM[m.group(1)]
            cur_part = '第%d章 习题答案' % cur
            cur_lines = []
            continue
        m = ANS_SUP_RE.match(s)
        if m:
            if cur is not None and cur_part is not None:
                groups.setdefault(cur, []).append((cur_part, cur_lines))
            cur = int(m.group(1)) if m.group(1).isdigit() else CN_NUM[m.group(1)]
            cur_part = '第%d章补充习题 答案' % cur
            cur_lines = []
            continue
        if cur is not None:
            cur_lines.append(line)
    if cur is not None and cur_part is not None:
        groups.setdefault(cur, []).append((cur_part, cur_lines))
    return groups


def main():
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass
    print('== 读取原始 markdown ==')
    v1 = read_lines(V1)
    v2 = read_lines(V2)
    v3 = read_lines(V3)

    # V3：切出正文（含附录/术语表）与答案区
    ans_idx = find_heading_index(v3, ANS_HEAD_RE)
    if ans_idx is None:
        print('!! 未找到 奇数习题答案 标题')
        sys.exit(1)
    garbage_idx = len(v3)
    for i, line in enumerate(v3):
        if GARBAGE_RE.match(line.strip()):
            garbage_idx = i
            break
    v3_body = v3[:ans_idx]
    v3_ans = v3[ans_idx:garbage_idx]
    print('V3 正文行数:', len(v3_body), '| 答案区行数:', len(v3_ans))

    # 书前与正文
    ch1_idx = find_heading_index(v1, re.compile(r'^#{1,6}\s*第\s*1\s*章\s'))
    front = v1[:ch1_idx]
    body = v1[ch1_idx:] + v2 + v3_body
    print('书前行数:', len(front), '| 正文总行数:', len(body))

    os.makedirs(OUT, exist_ok=True)

    refs = {}
    collect_images([front], V1, refs)
    collect_images([body], V1, refs)
    collect_images([v3_ans], V3, refs)

    # ---------- 书前 ----------
    intro_body = (
        '本书为美国 David C. Lay、Steven R. Lay 与 Judi J. McDonald 合著的《Linear Algebra and Its '
        'Applications》(Fifth Edition) 之中译本《线性代数及其应用（原书第5版）》，由刘深泉、张万芹、陈玉珍、'
        '包乐娥、陆博翻译，机械工业出版社（华章数学译丛）2018 年出版。\n\n'
        '全书以矩阵运算与线性空间为主线，内容包括：\n\n'
        '- **第 1—3 章**：线性方程组、矩阵代数、行列式；\n'
        '- **第 4—6 章**：向量空间、特征值与特征向量、正交性和最小二乘法；\n'
        '- **第 7—8 章**：对称矩阵和二次型、向量空间的几何学；\n'
        '- **附录**：简化阶梯形矩阵的唯一性、复数；以及术语表。\n\n'
        '每节末尾给出“练习题”（附解答）与“习题 X.Y”（奇数编号习题的答案集中收录于书末“奇数习题答案”），'
        '每章末尾还有“补充习题”。正文大量使用“例”“定理”“警告”“数值计算的注解”等板块，'
        '并配有丰富的几何插图，帮助读者理解线性代数概念的几何意义及其在工程、经济、计算机科学等领域的应用。'
    )
    write_mdx('00_内容简介.mdx', '内容简介', intro_body)
    print('生成 00_内容简介.mdx')

    # 01 译者序与前言
    pre_idx = find_heading_index(front, re.compile(r'^#{1,6}\s*译者序\s*$'))
    note_idx = find_heading_index(front, re.compile(r'^#{1,6}\s*给学生的注释\s*$'))
    if pre_idx is not None and note_idx is not None and note_idx > pre_idx:
        pre_lines = [l for l in front[pre_idx:note_idx] if not GARBAGE_RE.match(l.strip())]
        body1 = render_parts([(None, pre_lines)], with_footnotes=False)
        write_mdx('01_译者序与前言.mdx', '译者序与前言', body1)
        print('生成 01_译者序与前言.mdx')

    # 02 给学生的注释
    toc_idx = find_heading_index(front, re.compile(r'^#{1,6}\s*目录\s*$'))
    if note_idx is not None:
        end = toc_idx if toc_idx is not None and toc_idx > note_idx else len(front)
        note_lines = [l for l in front[note_idx:end] if not GARBAGE_RE.match(l.strip())]
        body2 = render_parts([(None, note_lines)], with_footnotes=False)
        write_mdx('02_给学生的注释.mdx', '给学生的注释', body2)
        print('生成 02_给学生的注释.mdx')

    # ---------- 章节 ----------
    chapters = split_chapters(body)
    print('识别章数:', len(chapters))
    last_sec_map = {}
    for ch_num, ch_title, ch_lines in chapters:
        intro, intro_title, sections, tail = split_chapter_parts(ch_lines)
        # 介绍性实例
        if intro and any(l.strip() for l in intro):
            b = render_parts([(None, intro)])
            if b.strip():
                write_mdx('%d.0_第%d章介绍性实例.mdx' % (ch_num, ch_num),
                          '介绍性实例 %s' % intro_title, b)
                print('生成 第%d章 介绍性实例 %s' % (ch_num, intro_title))
        # 各节
        sec_nums = sorted(sections.keys())
        last_sec_map[ch_num] = sec_nums[-1] if sec_nums else 0
        for sec_num in sec_nums:
            sec = sections[sec_num]
            parts = split_section_blocks(sec['lines'])
            b = render_parts(parts)
            if not b.strip():
                continue
            sec_title = sec['title']
            write_mdx('%d.%d_%s.mdx' % (ch_num, sec_num, safe_title(sec_title)),
                      '%d.%d %s' % (ch_num, sec_num, sec_title), b)
            print('生成 %d.%d_%s.mdx' % (ch_num, sec_num, safe_title(sec_title)))
        # 补充习题
        if tail and any(l.strip() for l in tail):
            parts = split_section_blocks(tail)
            b = render_parts(parts)
            if b.strip():
                n = last_sec_map[ch_num] + 1
                write_mdx('%d.%d_第%d章补充习题.mdx' % (ch_num, n, ch_num),
                          '第%d章 补充习题' % ch_num, b)
                print('生成 第%d章 补充习题' % ch_num)

    # ---------- 附录与术语表 ----------
    app_a = find_heading_index(v3_body, re.compile(r'^#{1,6}\s*附录\s*A\b'))
    app_b = find_heading_index(v3_body, re.compile(r'^#{1,6}\s*附录\s*B\b'))
    glos = find_heading_index(v3_body, GLOSSARY_RE)
    if app_a is not None:
        end = app_b if app_b is not None else glos
        if end is None:
            end = len(v3_body)
        b = render_parts([(None, v3_body[app_a:end])])
        write_mdx('a1_附录A_简化阶梯形矩阵的唯一性.mdx', '附录A 简化阶梯形矩阵的唯一性', b)
        print('生成 附录A')
    if app_b is not None:
        end = glos if glos is not None else len(v3_body)
        b = render_parts([(None, v3_body[app_b:end])])
        write_mdx('a2_附录B_复数.mdx', '附录B 复数', b)
        print('生成 附录B')
    if glos is not None:
        b = render_parts([(None, v3_body[glos:])])
        write_mdx('a3_术语表.mdx', '术语表', b)
        print('生成 术语表')

    # ---------- 奇数习题答案 ----------
    ans_groups = split_answer_sections(v3_ans)
    for ch_num in sorted(ans_groups.keys()):
        parts = [(name, ls) for name, ls in ans_groups[ch_num] if any(l.strip() for l in ls)]
        if not parts:
            continue
        b = render_parts(parts)
        write_mdx('b%d_第%d章奇数习题答案.mdx' % (ch_num, ch_num),
                  '第%d章 奇数习题答案' % ch_num, b)
        print('生成 第%d章 奇数习题答案 (%d 段)' % (ch_num, len(parts)))

    # ---------- 图片 ----------
    print('== 拷贝图片 ==')
    copied = copy_images(refs)
    print('引用图片 %d 个，新拷贝 %d 个' % (len(refs), copied))

    # ---------- 封面 ----------
    os.makedirs(COVERS, exist_ok=True)
    cover_src = os.path.join(TASK, V1, 'images',
                             'd56198918e5257e02dde16ddda72348d9356211d6979b71a663c61b3886e55e9.jpg')
    if os.path.exists(cover_src):
        shutil.copy2(cover_src, os.path.join(COVERS, 'linear_algebra.jpg'))
        print('封面已拷贝到 public/covers/linear_algebra.jpg')
    else:
        print('  [warn] 封面源图缺失')

    print('== 完成 ==')


if __name__ == '__main__':
    sys.exit(main())
