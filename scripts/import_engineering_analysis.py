#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
把 task/ 中《工科数学分析基础》(第三版) 的 MinerU 产物批量转换为站点 MDX。

拆分设计（与书本层级一致）：
  - 一本书 = 上册(第1-4章) + 下册(第5-7章)，目录 slug: engineering_analysis
  - 每"节"一篇 MDX（如 3.2_微积分基本公式与基本定理），节尾习题作为 <Block> 收尾
  - 每章末尾独立一篇"第X章习题与综合练习题"，一篇"第X章习题答案与提示"
  - 上册附录(1-6)按两两合并为 a1-a3，下册附录为 a4
  - 00_内容简介 / 01_绪论 作为入口

重复内容 -> 板块映射：
  例/例题                -> <Example title="例 n.m">
  定理/定义/性质/推论/引理/命题/公理 -> <Knowledge title="定理 n.m">
  证明/证/解             -> <Solution>（嵌在卡片内）
  想一想/注意/注         -> <Note>
  习题/第X章习题/综合练习题 -> <Block title="...">

用法：python scripts/import_engineering_analysis.py
"""

import os
import re
import shutil
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TASK = os.path.join(ROOT, 'task')
OUT = os.path.join(ROOT, 'src', 'content', 'docs', 'collections', 'math', 'engineering_analysis')
IMAGES_OUT = os.path.join(OUT, 'images')
PUBLIC = os.path.join(ROOT, 'public')
COVERS = os.path.join(PUBLIC, 'covers')

VOL1_A = '工科数学分析基础 上册前半部分.pdf-92095da8-01a2-4484-9b12-5cf2ea226279'
VOL1_B = '工科数学分析基础 上册后半部分.pdf-d94862a1-013b-4866-ae7d-e38ada67ca9a'
VOL2_A = '工科数学分析基础 下册前半部分.pdf-10d8a4b3-e439-4efe-93a2-b9ccdc193747'
VOL2_B = '工科数学分析基础 下册后半部分.pdf-7184681b-ba36-4aac-9d4e-80495153f4ca'

CN_NUM = {'一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9, '十': 10}


def read_lines(dirname):
    with open(os.path.join(TASK, dirname, 'full.md'), encoding='utf-8') as f:
        return f.read().splitlines()


def find_heading_index(lines, pattern, start=0):
    for i in range(start, len(lines)):
        if pattern.match(lines[i].strip()):
            return i
    return None


def cut_answer_key(lines):
    """把书末'部分习题答案与提示'区域从正文中切出，返回 (body, answers)。"""
    appendix_idx = -1
    for i, line in enumerate(lines):
        if re.match(r'^##\s*附录', line.strip()):
            appendix_idx = i
    bare_ch = re.compile(r'^##\s*第[一二三四五六七八九十]+章\s*$')
    start = find_heading_index(lines, bare_ch, max(appendix_idx + 1, 0))
    if start is None:
        return lines, []
    end = None
    for pat in (r'^##\s*参考文献', r'^##\s*二维码清单'):
        end = find_heading_index(lines, re.compile(pat), start)
        if end is not None:
            break
    if end is None:
        end = len(lines)
    return lines[:start], lines[start:end]


def strip_front_matter(lines):
    """上册前半部分：丢弃版权页/前言/目录，从 绪论 开始。"""
    idx = find_heading_index(lines, re.compile(r'^#{1,6}\s*绪论\s*$'))
    return lines[idx:] if idx is not None else lines


CH_RE = re.compile(r'^#{1,6}\s*第([一二三四五六七八九十]+)章\s*(.*)$')
SEC_RE = re.compile(r'^#{1,6}\s*第([一二三四五六七八九十]+)节\s*(.*)$')
CNNUM = r'[\d一二三四五六七八九十]+'
CH_EX_RE = re.compile(r'^#{1,6}\s*(第%s章习题)\s*(.*)$' % CNNUM)
BLOCK_RE = re.compile(r'^#{1,6}\s*(习题\s*\d+\.\d+|第%s章习题|综合练习题)\s*(.*)$' % CNNUM)
EX_RE = re.compile(r'^(?:#{1,6}\s*)?(?:例|例题)\s*(\d+(?:\.\d+)*)\s*(.*)$')
KN_RE = re.compile(r'^(?:#{1,6}\s*)?(定理|定义|性质|推论|引理|命题|公理)\s*(\d+(?:\.\d+)*)\s*(.*)$')
NOTE_RE = re.compile(r'^(?:#{1,6}\s*)?(想一想|注意|注)\s*[:：]?\s*(.*)$')
SOL_RE = re.compile(r'^(?:#{1,6}\s*)?(证明|证|解)\s*[:：]?\s*(.*)$')
HEAD_RE = re.compile(r'^#{1,6}\s+\S')
AB_RE = re.compile(r'^#{1,6}\s*\((A|B)\)\s*$')


def split_chapters(lines):
    """按'第X章'标题切分，返回 [(章号, 标题, 行列表)]。"""
    chapters = []
    cur = None
    for line in lines:
        m = CH_RE.match(line.strip())
        if m:
            if cur:
                chapters.append(cur)
            cur = [CN_NUM[m.group(1)], m.group(2).strip(), []]
        elif cur is not None:
            cur[2].append(line)
    if cur:
        chapters.append(cur)
    return chapters


def split_sections(chapter_lines):
    """在一章内按'第X节'切分，返回 [(节号, 标题, 行列表)]。"""
    sections = []
    cur = None
    for line in chapter_lines:
        m = SEC_RE.match(line.strip())
        if m:
            if cur:
                sections.append(cur)
            cur = [CN_NUM[m.group(1)], m.group(2).strip(), []]
        elif cur is not None:
            cur[2].append(line)
    if cur:
        sections.append(cur)
    return sections


def split_chapter_tail(section_lines):
    """把一节末尾的'第X章习题/综合练习题'区域切出，返回 (节内容, 章尾内容)。"""
    for i, line in enumerate(section_lines):
        if CH_EX_RE.match(line.strip()):
            return section_lines[:i], section_lines[i:]
    return section_lines, []


def tokenize(lines, is_answer=False):
    """把原始行转换为结构 token：(kind, ...)。
    kind: para | heading | card(example/knowledge) | note | block | solution
    """
    tokens = []
    cur = None  # (kind, title, content, solutions)
    cur_sol = None  # (title, content)

    def flush():
        nonlocal cur, cur_sol
        if cur_sol:
            cur[4].append(cur_sol)
            cur_sol = None
        if cur:
            tokens.append(cur)
            cur = None

    def add_line(buf, line):
        buf.append(line)

    for raw in lines:
        s = raw.strip()
        if not s:
            continue
        if cur is not None and cur[0] == 'block':
            # 习题块内不再做卡片识别，只整理 (A)/(B) 小标题
            m = AB_RE.match(s)
            if m:
                add_line(cur[2], '**（%s）**' % m.group(1))
            else:
                add_line(cur[2], raw)
            continue
        m = BLOCK_RE.match(s)
        if m:
            flush()
            title = re.sub(r'\s+', '', m.group(1))
            if is_answer:
                title += ' 答案'
            cur = ('block', title, [])
            if m.group(2):
                add_line(cur[2], m.group(2))
            continue
        m = EX_RE.match(s)
        if m:
            flush()
            cur = ('card', 'example', '例 ' + m.group(1), [], [])
            if m.group(2):
                add_line(cur[3], m.group(2))
            continue
        m = KN_RE.match(s)
        if m:
            flush()
            cur = ('card', 'knowledge', m.group(1) + ' ' + m.group(2), [], [])
            if m.group(3):
                add_line(cur[3], m.group(3))
            continue
        m = NOTE_RE.match(s)
        if m:
            flush()
            cur = ('note', None, [])
            if m.group(2):
                add_line(cur[2], m.group(2))
            continue
        m = SOL_RE.match(s)
        if m:
            if cur is not None and cur[0] == 'card':
                title = '证明' if m.group(1) in ('证明', '证') else '解'
                if cur_sol is None:
                    cur_sol = (title, [])
                if m.group(2):
                    add_line(cur_sol[1], m.group(2))
            else:
                # 卡片外的独立 证/解：先关闭可能存在的 Note/段落，再作为独立 Solution
                if cur is not None:
                    flush()
                cur = ('solution', '证明' if m.group(1) in ('证明', '证') else '解', [])
                if m.group(2):
                    add_line(cur[2], m.group(2))
            continue
        if HEAD_RE.match(s):
            flush()
            tokens.append(('heading', None, raw))
            continue
        if cur is not None and cur[0] == 'card' and cur_sol is not None:
            # 解析（解/证）尚未结束：后续行继续并入 Solution
            add_line(cur_sol[1], raw)
            continue
        if cur is None:
            cur = ('para', None, [])
        if cur[0] == 'card':
            add_line(cur[3], raw)
        else:
            add_line(cur[2], raw)
    flush()
    return tokens


def render_tokens(tokens):
    esc = MDXEscaper()

    def esc_lines(buf):
        return '\n\n'.join(esc(l) for l in buf)

    out = []
    for tok in tokens:
        kind = tok[0]
        if kind == 'para':
            out.append(esc_lines(tok[2]))
        elif kind == 'heading':
            out.append(esc(tok[2]))
        elif kind == 'note':
            out.append('<Note>\n' + esc_lines(tok[2]) + '\n</Note>')
        elif kind == 'solution':
            out.append('<Solution title="%s">\n%s\n</Solution>' % (tok[1], esc_lines(tok[2])))
        elif kind == 'block':
            out.append('<Block title="%s">\n%s\n</Block>' % (tok[1], esc_lines(tok[2])))
        elif kind == 'card':
            inner = esc_lines(tok[3])
            sols = []
            for title, lines in tok[4]:
                sols.append('<Solution title="%s">\n%s\n</Solution>' % (title, esc_lines(lines)))
            body = '\n\n'.join([inner] + sols)
            comp = 'Example' if tok[1] == 'example' else 'Knowledge'
            out.append('<%s title="%s">\n%s\n</%s>' % (comp, tok[2], body, comp))
    return '\n\n'.join(out)


class MDXEscaper:
    """把正文里裸露的 < { } 转义，避免 MDX 把它们当作 JSX；数学环境内保持原样。"""

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


def split_answer_chapters(ans_lines):
    """按裸章标题或 习题X.Y/第X章习题 的编号给答案分组，返回 {章号: 行列表}。"""
    groups = {}
    cur = None
    bare_ch = re.compile(r'^#{1,6}\s*第([一二三四五六七八九十]+)章\s*$')
    ex_ch = re.compile(r'^#{1,6}\s*习题\s*(\d+)\.\d+')
    ch_ex = re.compile(r'^#{1,6}\s*第(\d+)章习题')
    for line in ans_lines:
        s = line.strip()
        m = bare_ch.match(s)
        if m:
            cur = CN_NUM[m.group(1)]
            groups.setdefault(cur, [])
            continue  # 裸章标题不进入内容
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


def write_mdx(filename, title, body):
    if '\'' in title:
        title = title.replace('\'', '\\\'')
    header = '---\ntitle: \'%s\'\n---\n\n' % title
    imports = (
        "import Guide from '@/components/Guide.astro';\n"
        "import Knowledge from '@/components/Knowledge.astro';\n"
        "import Example from '@/components/Example.astro';\n"
        "import Analysis from '@/components/Analysis.astro';\n"
        "import Solution from '@/components/Solution.astro';\n"
        "import Variant from '@/components/Variant.astro';\n"
        "import Note from '@/components/Note.astro';\n"
        "import Block from '@/components/Block.astro';\n"
        "import Method from '@/components/Method.astro';\n"
    )
    with open(os.path.join(OUT, filename), 'w', encoding='utf-8') as f:
        f.write(header + imports + '\n' + body.strip() + '\n')


def collect_images(lines, src_dir, refs):
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
        for d in (src_dir, VOL1_A, VOL1_B, VOL2_A, VOL2_B):
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


def main():
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass
    print('== 读取与切分原始 markdown ==')
    v1a = read_lines(VOL1_A)
    v1b = read_lines(VOL1_B)
    v2a = read_lines(VOL2_A)
    v2b = read_lines(VOL2_B)

    # 切出答案区
    v1b_body, v1b_ans = cut_answer_key(v1b)
    v2b_body, v2b_ans = cut_answer_key(v2b)
    v1a_body = strip_front_matter(v1a)

    # 合并上下册正文（跨 PDF 的章节自动拼接）
    vol1 = v1a_body + v1b_body
    vol2 = v2a + v2b_body
    print('vol1 行数:', len(vol1), '| vol2 行数:', len(vol2))

    refs = {}
    collect_images(v1a_body, VOL1_A, refs)
    collect_images(v1b_body, VOL1_B, refs)
    collect_images(v1b_ans, VOL1_B, refs)
    collect_images(v2a, VOL2_A, refs)
    collect_images(v2b_body, VOL2_B, refs)
    collect_images(v2b_ans, VOL2_B, refs)

    os.makedirs(OUT, exist_ok=True)

    # ---------- 内容简介 ----------
    intro_lines = []
    in_intro = False
    for line in v1a:
        s = line.strip()
        if s == '## 内容提要':
            in_intro = True
            continue
        if in_intro and s.startswith('## '):
            break
        if in_intro and s:
            intro_lines.append(line)
    intro_body = ('\n\n'.join(intro_lines).strip()
                  + '\n\n本书第三版分上、下两册出版：上册（第 1—4 章）主要内容为一元函数微积分与常微分方程'
                    '，下册（第 5—7 章）主要内容为多元函数微积分与无穷级数。每章配有 A、B 两类习题与综合练习题，'
                    '书末附有部分习题答案与提示。')
    write_mdx('00_内容简介.mdx', '内容简介', intro_body)
    print('生成 00_内容简介.mdx')

    # ---------- 绪论 ----------
    intro_sec = None
    for i, line in enumerate(vol1):
        if re.match(r'^#{1,6}\s*绪论\s*$', line.strip()):
            intro_sec = i
            break
    ch1 = find_heading_index(vol1, re.compile(r'^#{1,6}\s*第一章\s'), intro_sec)
    jl = vol1[intro_sec + 1:ch1]
    jl = [l for l in jl if re.match(r'^#{1,6}\s*绪论\s*$', l.strip()) is None]
    write_mdx('01_绪论.mdx', '绪论', render_tokens(tokenize(jl)))
    print('生成 01_绪论.mdx')

    # ---------- 章节 ----------
    last_sec = {}
    for vol_name, vol_lines in (('上册', vol1), ('下册', vol2)):
        chapters = split_chapters(vol_lines)
        for ch_num, ch_title, ch_lines in chapters:
            sections = split_sections(ch_lines)
            if not sections:
                continue
            last_sec[ch_num] = sections[-1][0]
            for si, (sec_num, sec_title, sec_lines) in enumerate(sections):
                sec_body_lines, tail = split_chapter_tail(sec_lines)
                body = render_tokens(tokenize(sec_body_lines))
                if body:
                    write_mdx('%d.%d_%s.mdx' % (ch_num, sec_num, safe_title(sec_title)),
                              '%d.%d %s' % (ch_num, sec_num, sec_title), body)
                    print('生成 %d.%d_%s.mdx' % (ch_num, sec_num, safe_title(sec_title)))
                # 章尾习题：只在最后一节之后输出一次
                if tail and si == len(sections) - 1:
                    body = render_tokens(tokenize(tail))
                    write_mdx('%d.%d_第%d章习题与综合练习题.mdx' % (ch_num, sec_num + 1, ch_num),
                              '第%d章 习题与综合练习题' % ch_num, body)
                    print('生成 第%d章 习题与综合练习题' % ch_num)

    # ---------- 上册附录 ----------
    app_idx = find_heading_index(v1b_body, re.compile(r'^#{1,6}\s*附录\s*$'))
    if app_idx is not None:
        ans_start = find_heading_index(v1b_body, re.compile(r'^##\s*第[一二三四五六七八九十]+章\s*$'))
        app_lines = v1b_body[app_idx:] if ans_start is None else v1b_body[app_idx:ans_start]
        # 按 附录N 分组
        groups = {}
        cur = None
        for line in app_lines:
            m = re.match(r'^#{1,6}\s*附录\s*(\d+)\s*(.*)$', line.strip())
            if m:
                cur = int(m.group(1))
                groups.setdefault(cur, []).append(line)
            elif cur is not None:
                groups[cur].append(line)
        pairs = [(1, 2), (3, 4), (5, 6)]
        for lo, hi in pairs:
            chunk = []
            for k in range(lo, hi + 1):
                chunk.extend(groups.get(k, []))
            if not chunk:
                continue
            body = render_tokens(tokenize(chunk))
            names = {1: '参数表示、极坐标与常见曲线', 2: '三角函数公式与反三角函数', 3: '复数与积分表'}
            write_mdx('a%d_附录%d-%d_%s.mdx' % (lo // 2 + 1, lo, hi, names[lo // 2 + 1]),
                      '附录%d-%d %s' % (lo, hi, names[lo // 2 + 1]), body)
            print('生成 附录%d-%d' % (lo, hi))

    # ---------- 下册附录 ----------
    app_idx = find_heading_index(v2b_body, re.compile(r'^#{1,6}\s*附录'))
    if app_idx is not None:
        ans_start = find_heading_index(v2b_body, re.compile(r'^##\s*第[一二三四五六七八九十]+章\s*$'))
        app_lines = v2b_body[app_idx:] if ans_start is None else v2b_body[app_idx:ans_start]
        body = render_tokens(tokenize(app_lines))
        write_mdx('a4_下册附录_部分曲面和空间立体的图形.mdx', '下册附录 部分曲面和空间立体的图形', body)
        print('生成 下册附录')

    # ---------- 习题答案与提示 ----------
    for vol_name, ans_lines in (('上册', v1b_ans), ('下册', v2b_ans)):
        for ch_num, ch_lines in sorted(split_answer_chapters(ans_lines).items()):
            body = render_tokens(tokenize(ch_lines, is_answer=True))
            if not body.strip():
                continue
            n = last_sec.get(ch_num, 9) + 2
            write_mdx('%d.%d_第%d章习题答案与提示.mdx' % (ch_num, n, ch_num),
                      '第%d章 习题答案与提示' % ch_num, body)
            print('生成 第%d章 习题答案与提示 (%d 行)' % (ch_num, len(ch_lines)))

    # ---------- 图片 ----------
    print('== 拷贝图片 ==')
    copied = copy_images(refs)
    print('引用图片 %d 个，新拷贝 %d 个' % (len(refs), copied))

    # ---------- 封面 ----------
    os.makedirs(COVERS, exist_ok=True)
    cover_src = os.path.join(TASK, VOL1_A, 'images', '5e71662d15b2dc6ed36b9e59bc4f0ef9c8f4a091dbbada7b39e6661247fb32f9.jpg')
    if os.path.exists(cover_src):
        shutil.copy2(cover_src, os.path.join(COVERS, 'engineering_analysis.jpg'))
        print('封面已拷贝到 public/covers/engineering_analysis.jpg')

    print('== 完成 ==')


if __name__ == '__main__':
    sys.exit(main())
