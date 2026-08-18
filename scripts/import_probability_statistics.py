#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
把 task/ 中《概率论与数理统计教程（第三版，茆诗松/程依明/濮晓龙，高等教育出版社）》
的 3 个 MinerU 产物批量转换为站点 MDX。

拆分设计（与书本层级一致）：
  - 一本书 = 前 PDF（第1-3章，止于 §3.5.1 公式 3.5.13）
            + 中 PDF（§3.5.1 续 3.5.14 ~ §8.1.4，止于例 8.1.2 开头）
            + 后 PDF（例 8.1.2 续 ~ 习题8.5、附表、习题参考答案、参考文献）
    ，跨 PDF 章节直接拼接（不折叠相邻 $$ 行）。目录 slug: probability_statistics
  - 每"节"一篇 MDX（如 1.1_随机事件及其运算.mdx），节尾的 习题x.y 作为该篇末尾 <Block>
  - 书末"习题参考答案"按章拆成独立页面 {章}.{末节+1}_第X章习题参考答案.mdx
    （答案区同名标题加" 答案"后缀，避免与题干锚点冲突）
  - 附表（表1-表14）拆成 a1（分布函数表 表1-5.4）与 a2（检验临界值表 表6-14）
  - 参考文献为 a3_参考文献
  - 00_内容简介 / 01_第三版前言 作为入口

重复内容 -> 板块映射：
  例/例题                -> <Example title="例 X.Y.Z">
  定理/定义/性质/推论/引理/命题/公理 -> <Knowledge title="...">
  证明/证/解             -> <Solution>（嵌在卡片内）
  注意/注                -> <Note>
  习题 X.Y               -> <Block title="习题 X.Y">
  参考答案区 习题 X.Y     -> <Block title="习题 X.Y 答案">

用法：D:\\python\\python.exe scripts/import_probability_statistics.py
"""

import os
import re
import shutil
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TASK = os.path.join(ROOT, 'task')
OUT = os.path.join(ROOT, 'src', 'content', 'docs', 'collections', 'math', 'probability_statistics')
IMAGES_OUT = os.path.join(OUT, 'images')
PUBLIC = os.path.join(ROOT, 'public')
COVERS = os.path.join(PUBLIC, 'covers')

FRONT = '概率论与数理统计教程 第三版 (茆诗松) (z-library.sk, 1lib.sk, z-li.pdf-d2d0a238-dbb4-4fe7-a614-1185f853b251'
MIDDLE = '概率论与数理统计教程 第三版 (茆诗松) (z-library.sk, 1lib.sk, z-li.pdf-14610cd2-b220-4ca5-9fae-4bf0011edbd7'
BACK = '概率论与数理统计教程 第三版 (茆诗松) (z-library.sk, 1lib.sk, z-li.pdf-47a6bae2-f94f-4f3d-95a1-5041779808af'

CN_NUM = {'一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9, '十': 10}

CHAPTER_TITLES = {
    1: '随机事件与概率', 2: '随机变量及其分布', 3: '多维随机变量及其分布',
    4: '大数定律与中心极限定理', 5: '统计量及其分布', 6: '参数估计',
    7: '假设检验', 8: '方差分析与回归分析',
}
# 每章最后一节的编号（用于参考答案页文件名 {章}.{末节+1}）
LAST_SEC = {1: 5, 2: 7, 3: 5, 4: 4, 5: 5, 6: 6, 7: 6, 8: 5}


def read_lines(dirname):
    with open(os.path.join(TASK, dirname, 'full.md'), encoding='utf-8') as f:
        return f.read().splitlines()


def find_heading_index(lines, pattern, start=0):
    for i in range(start, len(lines)):
        if pattern.match(lines[i].strip()):
            return i
    return None


CH_RE = re.compile(r'^#{1,6}\s*第([一二三四五六七八九十]+)章\s*(.*)$')
SEC_RE = re.compile(r'^#{1,6}\s*\\?\*?§?\s*(\d+)\.(\d+)(?!\.)(?:\s+(.*))?\s*$')
SUBSEC_HEAD_RE = re.compile(r'^#{1,6}\s*\\?\*?(\d+)\.(\d+)\.(\d+)\s')
BLOCK_RE = re.compile(r'^#{1,6}\s*(习题\s*\d+\.\d+|第[\d一二三四五六七八九十]+章习题|综合练习题)\s*(.*)$')
EX_RE = re.compile(r'^(?:#{1,6}\s*)?(?:例|例题)\s*(\d+(?:\.\d+)*)\s*(.*)$')
KN_RE = re.compile(r'^(?:#{1,6}\s*)?(定理|定义|性质|推论|引理|命题|公理)\s*(\d+(?:\.\d+)*)\s*(.*)$')
NOTE_RE = re.compile(r'^(?:#{1,6}\s*)?(注意|注|想一想)\s*[:：]?\s*(.*)$')
SOL_RE = re.compile(r'^(?:#{1,6}\s*)?(证明|证|解)\s*[:：]?\s*(.*)$')
HEAD_RE = re.compile(r'^#{1,6}\s+\S')
AB_RE = re.compile(r'^#{0,6}\s*\((A|B)\)\s*$')
SUMMARY_RE = re.compile(r'^#{0,6}\s*本章小结\s*$')
ART_RE = re.compile(r'The Ground Truth image|广力云|智慧零售|收银系统|Abook|数字课程')
NUMERIC_HEAD_RE = re.compile(r'^[\d\s.．]+$')
TABLE_CAP_RE = re.compile(r'^表\s*(\d+(?:\.\d+)?)\s')
ANSWER_HEAD_RE = re.compile(r'^#{0,6}\s*习题\s*(\d+)\.(\d+)\s*$')


def is_artifact(s):
    if ART_RE.search(s):
        return True
    return False


def split_chapters(lines):
    """按节号（§X.Y）切分章节；章号由节号推断，章标题用 CHAPTER_TITLES。

    返回 {章号: {'intro': [...], 'sections': {节号: [行列表]}}} 与 order 列表。
    """
    chapters = {}
    order = []
    ch = None
    sec = None
    intro = []
    sections = {}
    pending_intro = []

    def close():
        nonlocal ch, sec, intro, sections
        if ch is not None:
            chapters[ch] = {'intro': intro, 'sections': sections}
            order.append(ch)
        ch, sec = None, None
        intro, sections = [], {}

    for raw in lines:
        s = raw.strip()
        if not s:
            continue
        if is_artifact(s):
            continue
        if SUMMARY_RE.match(s):
            continue
        m = CH_RE.match(s)
        if m:
            close()
            ch = CN_NUM[m.group(1)]
            intro = list(pending_intro) if pending_intro else []
            pending_intro = []
            sections = {}
            continue
        m = SEC_RE.match(s)
        if m:
            # MinerU 偶发把纯数字样本数据行识别成标题（如 "## 4.5 5.0 4.7 4.0 4.2"），
            # 其"标题"部分全为数字时按正文内容处理，绝不当作节边界。
            if m.group(3) and NUMERIC_HEAD_RE.match(m.group(3).strip()):
                if ch is None:
                    pending_intro.append(raw)
                elif sec is None:
                    intro.append(raw)
                else:
                    sections[sec].append(raw)
                continue
            ch_num = int(m.group(1))
            sec_num = int(m.group(2))
            if ch is None or ch_num != ch:
                pending = list(pending_intro)
                pending_intro = []
                close()
                ch = ch_num
                intro = pending
                sections = {}
            sec = sec_num
            sections.setdefault(sec, [])
            if m.group(3):
                sections[sec].append(m.group(3).strip())
            continue
        if ch is None:
            pending_intro.append(raw)
        elif sec is None:
            intro.append(raw)
        else:
            sections[sec].append(raw)
    close()
    return chapters, order


def tokenize(lines, is_answer=False):
    """原始行 -> 结构 token：(kind, ...)。kind: para | heading | card | note | solution | block"""
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

    def add_line(buf, line):
        buf.append(line)

    for raw in lines:
        s = raw.strip()
        if not s:
            continue
        if cur is not None and cur[0] == 'block':
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
            title = '证明' if m.group(1) in ('证明', '证') else '解'
            if cur is not None and cur[0] == 'card':
                if cur_sol is None:
                    cur_sol = (title, [])
                if m.group(2):
                    add_line(cur_sol[1], m.group(2))
            else:
                if cur is not None:
                    flush()
                cur = ('solution', title, [])
                if m.group(2):
                    add_line(cur[2], m.group(2))
            continue
        if HEAD_RE.match(s):
            txt = re.sub(r'^#{1,6}\s*', '', s)
            # MinerU 偶发把纯数字行（样本数据）识别成标题，如 "## 4.5 5.0 4.7 4.0 4.2"
            if NUMERIC_HEAD_RE.match(txt):
                if cur is None:
                    cur = ('para', None, [])
                if cur[0] == 'card':
                    add_line(cur[3], raw)
                elif cur[0] == 'note':
                    add_line(cur[2], raw)
                elif cur[0] == 'block':
                    add_line(cur[2], raw)
                else:
                    add_line(cur[2], raw)
                continue
            flush()
            tokens.append(('heading', None, txt))
            continue
        if cur is not None and cur[0] == 'card' and cur_sol is not None:
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


def render_body(lines, is_answer=False):
    esc = MDXEscaper()

    def esc_lines(buf):
        return '\n\n'.join(esc(l) for l in buf)

    out = []
    for tok in tokenize(lines, is_answer=is_answer):
        kind = tok[0]
        if kind == 'para':
            out.append(esc_lines(tok[2]))
        elif kind == 'heading':
            out.append('## %s' % esc(tok[2]))
        elif kind == 'note':
            out.append('<Note>\n%s\n</Note>' % esc_lines(tok[2]))
        elif kind == 'solution':
            out.append('<Solution title="%s">\n%s\n</Solution>' % (tok[1], esc_lines(tok[2])))
        elif kind == 'block':
            out.append('<Block title="%s">\n%s\n</Block>' % (tok[1], esc_lines(tok[2])))
        elif kind == 'card':
            inner = esc_lines(tok[3])
            sols = []
            for title, lines2 in tok[4]:
                sols.append('<Solution title="%s">\n%s\n</Solution>' % (title, esc_lines(lines2)))
            body = '\n\n'.join([inner] + sols)
            comp = 'Example' if tok[1] == 'example' else 'Knowledge'
            out.append('<%s title="%s">\n%s\n</%s>' % (comp, tok[2], body, comp))
    return '\n\n'.join(out)


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
            s = line.replace('~', '～')
            # HTML 表格在 MDX 里会被当作 JSX 解析，裸 { } 会被当成表达式；
            # 仅转义数学环境（$...$ / $$...$$）之外的 { }，保留公式内花括号。
            out = []
            i = 0
            n = len(s)
            in_math = False
            while i < n:
                ch = s[i]
                if ch == '$':
                    in_math = not in_math
                    out.append(ch)
                elif ch == '{' and not in_math:
                    out.append('&#123;')
                elif ch == '}' and not in_math:
                    out.append('&#125;')
                else:
                    out.append(ch)
                i += 1
            return ''.join(out)
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
    "import Example from '@/components/Example.astro';\n"
    "import Knowledge from '@/components/Knowledge.astro';\n"
    "import Solution from '@/components/Solution.astro';\n"
    "import Note from '@/components/Note.astro';\n"
    "import Block from '@/components/Block.astro';\n"
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


def group_answers(lines):
    """答案区行 -> {章号: [(节号, 行列表)]}（按 '## 习题 X.Y' 标题分组）。"""
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
        m = ANSWER_HEAD_RE.match(raw.strip())
        if m:
            flush()
            cur_ch = int(m.group(1))
            cur_sec = int(m.group(2))
            buf = [raw]
        elif cur_ch is not None:
            buf.append(raw)
    flush()
    return groups


def main():
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass
    print('== 读取原始 markdown ==')
    front = read_lines(FRONT)
    middle = read_lines(MIDDLE)
    back = read_lines(BACK)

    # ---- 前部：内容提要 / 第三版前言 ----
    intro_lines = [l for l in front[34:40] if l.strip()]
    pref_lines = [l for l in front[154:205] if l.strip() and not is_artifact(l)]

    # ---- 切分后 PDF：正文 / 附表 / 参考答案 / 参考文献 ----
    # 正文 = 例 8.1.2 续 ~ 习题8.5（止于"## 本章小结"之前）
    back_main = back[:1880]
    # 附表：从"附表"（第1883行）到答案区（第1990行）之前
    tables_lines = back[1882:1989]
    # 答案区：习题1.1 ~ 习题8.5
    answers_lines = back[1989:2717]
    # 参考文献
    refs_lines = back[2717:2763]

    # ---- 拼接正文：front 第1-3章 + middle §3.5.1续~§8.1.4 + back 例8.1.2续~习题8.5 ----
    front_body = front[493:]  # 从 "## 第一章随机事件与概率" 起
    combined = front_body + middle + back_main
    print('front:', len(front_body), '| middle:', len(middle), '| back_main:', len(back_main))

    chapters, order = split_chapters(combined)
    print('章节顺序:', order)

    # ---- 清理旧输出 ----
    if os.path.isdir(OUT):
        shutil.rmtree(OUT)
    os.makedirs(OUT, exist_ok=True)

    refs = {}
    src_dirs = [FRONT, MIDDLE, BACK]

    # ---------- 00 内容简介 ----------
    intro_body = ('\n\n'.join(intro_lines).strip()
                  + '\n\n本书为茆诗松、程依明、濮晓龙编著，高等教育出版社出版。全书共八章：'
                    '前四章为概率论部分（随机事件与概率、随机变量及其分布、多维随机变量及其分布、'
                    '大数定律与中心极限定理），后四章为数理统计部分（统计量及其分布、参数估计、'
                    '假设检验、方差分析与回归分析）。每节末配有分节习题，书末附有统计用表'
                    '（附表 1—14）与习题参考答案。')
    write_mdx('00_内容简介.mdx', '内容简介', intro_body)
    print('生成 00_内容简介.mdx')
    collect_images([intro_lines], FRONT, refs)

    # ---------- 01 第三版前言 ----------
    pref_body = render_body(pref_lines)
    write_mdx('01_第三版前言.mdx', '第三版前言', pref_body)
    print('生成 01_第三版前言.mdx')
    collect_images([pref_lines], FRONT, refs)

    # ---------- 章节 ----------
    for ch in order:
        info = chapters[ch]
        sections = info['sections']
        intro = info['intro']
        if not sections:
            continue
        first = True
        for sec in sorted(sections):
            sec_lines = sections[sec]
            # 节标题：节号行后紧跟的非空行（若非小节编号），否则取节号行内标题
            sec_title = ''
            body_lines = list(sec_lines)
            if body_lines and not SUBSEC_HEAD_RE.match(body_lines[0].strip()):
                cand = body_lines[0].strip()
                if cand and not re.match(r'^#{0,6}\s*\\?\*?\d+\.\d+(?!\.)', cand):
                    sec_title = re.sub(r'^#{0,6}\s*\\?\*?\s*', '', cand)
                    body_lines = body_lines[1:]
            body = render_body(body_lines)
            if not body.strip():
                continue
            if first:
                intro_for_imgs = list(intro)
                intro_body = render_body(intro)
                # 去掉正文里重复出现的章标题行
                intro_body = re.sub(
                    r'(?m)^##\s*' + re.escape(CHAPTER_TITLES.get(ch, '')) + r'\s*$\n\n?', '',
                    intro_body)
                prefix = '## 第%d章 %s\n\n%s' % (ch, CHAPTER_TITLES.get(ch, ''), intro_body)
                body = prefix + '\n\n' + body
                first = False
                collect_images([intro_for_imgs], None, refs)
            title = '%d.%d %s' % (ch, sec, sec_title) if sec_title else '%d.%d' % (ch, sec)
            fname = '%d.%d_%s.mdx' % (ch, sec, safe_title(sec_title)) if sec_title else '%d.%d.mdx' % (ch, sec)
            write_mdx(fname, title, body)
            print('生成 %s' % fname)
            collect_images([body_lines], None, refs)

    # ---------- 习题参考答案（按章） ----------
    ans_groups = group_answers(answers_lines)
    for ch in sorted(ans_groups):
        items = ans_groups[ch]
        body = '## 习题参考答案\n\n' + render_body(
            [l for _, lines in items for l in lines], is_answer=True)
        n = LAST_SEC.get(ch, 9) + 1
        fname = '%d.%d_第%d章习题参考答案.mdx' % (ch, n, ch)
        write_mdx(fname, '第%d章 习题参考答案' % ch, body)
        print('生成 %s（%d 节答案）' % (fname, len(items)))
        collect_images([[l for _, lines in items for l in lines]], None, refs)

    # ---------- 附表 ----------
    table_idx = None
    for i, line in enumerate(tables_lines):
        if TABLE_CAP_RE.match(line.strip()) and line.strip().startswith('表 6'):
            table_idx = i
            break
    if table_idx is None:
        table_idx = len(tables_lines)
    a1 = [l for l in tables_lines[:table_idx] if l.strip() != '附表']
    a2 = tables_lines[table_idx:]
    if a1:
        write_mdx('a1_附表（分布函数表）.mdx', '附表（分布函数表 表1-表5.4）', render_body(a1))
        print('生成 附表（分布函数表）')
        collect_images([a1], None, refs)
    if a2:
        write_mdx('a2_附表（检验临界值表）.mdx', '附表（检验临界值表 表6-表14）', render_body(a2))
        print('生成 附表（检验临界值表）')
        collect_images([a2], None, refs)

    # ---------- 参考文献 ----------
    refs_body = render_body(refs_lines)
    if refs_body.strip():
        write_mdx('a3_参考文献.mdx', '参考文献', refs_body)
        print('生成 参考文献')
        collect_images([refs_lines], None, refs)

    # ---------- 图片 ----------
    print('== 拷贝图片 ==')
    copied = copy_images(refs, src_dirs)
    print('引用图片 %d 个，新拷贝 %d 个' % (len(refs), copied))

    # ---------- 封面 ----------
    os.makedirs(COVERS, exist_ok=True)
    cover_src = os.path.join(TASK, FRONT, 'images',
                             'c6d0295bdf6b3cf099ddf7474e335c979c5f5d469b6d0b11e63f89e1cbc5f58f.jpg')
    if os.path.exists(cover_src):
        shutil.copy2(cover_src, os.path.join(COVERS, 'probability_statistics.jpg'))
        print('封面已拷贝到 public/covers/probability_statistics.jpg')
    else:
        print('  [warn] 封面图片缺失，未拷贝')

    print('== 完成 ==')


if __name__ == '__main__':
    sys.exit(main())
