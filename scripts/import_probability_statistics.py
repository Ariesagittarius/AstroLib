#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
把 task/ 中《概率论与数理统计教程（第三版，茆诗松/程依明/濮晓龙，高等教育出版社）》
的 3 个 MinerU 产物批量转换为站点 MDX。
"""

import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import BookConverter

FRONT = '概率论与数理统计教程 第三版 (茆诗松) (z-library.sk, 1lib.sk, z-li.pdf-d2d0a238-dbb4-4fe7-a614-1185f853b251'
MIDDLE = '概率论与数理统计教程 第三版 (茆诗松) (z-library.sk, 1lib.sk, z-li.pdf-14610cd2-b220-4ca5-9fae-4bf0011edbd7'
BACK = '概率论与数理统计教程 第三版 (茆诗松) (z-library.sk, 1lib.sk, z-li.pdf-47a6bae2-f94f-4f3d-95a1-5041779808af'
SRC_DIRS = [FRONT, MIDDLE, BACK]

CHAPTER_TITLES = {
    1: '随机事件与概率', 2: '随机变量及其分布', 3: '多维随机变量及其分布',
    4: '大数定律与中心极限定理', 5: '统计量及其分布', 6: '参数估计',
    7: '假设检验', 8: '方差分析与回归分析',
}
LAST_SEC = {1: 5, 2: 7, 3: 5, 4: 4, 5: 5, 6: 6, 7: 6, 8: 5}

CH_RE = re.compile(r'^#{1,6}\s*第([一二三四五六七八九十]+)章\s*(.*)$')
SEC_RE = re.compile(r'^#{1,6}\s*\\?\*?§?\s*(\d+)\.(\d+)(?!\.)(?:\s+(.*))?\s*$')
SUBSEC_HEAD_RE = re.compile(r'^#{1,6}\s*\\?\*?(\d+)\.(\d+)\.(\d+)\s')
SUMMARY_RE = re.compile(r'^#{0,6}\s*本章小结\s*$')
TABLE_CAP_RE = re.compile(r'^表\s*(\d+(?:\.\d+)?)\s')


def split_book_chapters(lines, converter):
    """按节号（§X.Y）切分章节，章号由节号推断。"""
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
        if not s or converter.cleaner.is_artifact(s) or SUMMARY_RE.match(s):
            continue
        m = CH_RE.match(s)
        if m:
            close()
            ch = converter.chunker.to_arabic(m.group(1))
            intro = list(pending_intro) if pending_intro else []
            pending_intro = []
            sections = {}
            continue
        m = SEC_RE.match(s)
        if m:
            if m.group(3) and converter.cleaner.is_numeric_heading(m.group(3).strip()):
                target = pending_intro if ch is None else (intro if sec is None else sections[sec])
                target.append(raw)
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


def main():
    converter = BookConverter(
        book_slug='probability_statistics',
        collection='math',
        task_dirs=SRC_DIRS,
        clean_out_dir=True,
    )
    print('== 读取原始 markdown ==')
    front = converter.read_task_lines(FRONT)
    middle = converter.read_task_lines(MIDDLE)
    back = converter.read_task_lines(BACK)

    intro_lines = [l for l in front[34:40] if l.strip()]
    pref_lines = converter.cleaner.filter_lines([l for l in front[154:205] if l.strip()])

    back_main = back[:1880]
    tables_lines = back[1882:1989]
    answers_lines = back[1989:2717]
    refs_lines = back[2717:2763]

    front_body = front[493:]
    combined = front_body + middle + back_main
    print(f"front: {len(front_body)} | middle: {len(middle)} | back_main: {len(back_main)}")

    chapters, order = split_book_chapters(combined, converter)
    print(f"章节顺序: {order}")

    # ---------- 00 内容简介 ----------
    intro_body = (
        '\n\n'.join(intro_lines).strip()
        + '\n\n本书为茆诗松、程依明、濮晓龙编著，高等教育出版社出版。全书共八章：'
          '前四章为概率论部分（随机事件与概率、随机变量及其分布、多维随机变量及其分布、'
          '大数定律与中心极限定理），后四章为数理统计部分（统计量及其分布、参数估计、'
          '假设检验、方差分析与回归分析）。每节末配有分节习题，书末附有统计用表'
          '（附表 1—14）与习题参考答案。'
    )
    converter.write_intro('内容简介', intro_body)

    # ---------- 01 第三版前言 ----------
    pref_body = converter.card_parser.render_body(pref_lines)
    converter.write_mdx('01_第三版前言.mdx', '第三版前言', pref_body)
    print('  [page] 生成 01_第三版前言.mdx')

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
            sec_title = ''
            body_lines = list(sec_lines)
            if body_lines and not SUBSEC_HEAD_RE.match(body_lines[0].strip()):
                cand = body_lines[0].strip()
                if cand and not re.match(r'^#{0,6}\s*\\?\*?\d+\.\d+(?!\.)', cand):
                    sec_title = re.sub(r'^#{0,6}\s*\\?\*?\s*', '', cand)
                    body_lines = body_lines[1:]
            body = converter.card_parser.render_body(body_lines)
            if not body.strip():
                continue
            if first:
                intro_body = converter.card_parser.render_body(intro)
                intro_body = re.sub(
                    r'(?m)^##\s*' + re.escape(CHAPTER_TITLES.get(ch, '')) + r'\s*$\n\n?', '',
                    intro_body)
                prefix = f"## 第{ch}章 {CHAPTER_TITLES.get(ch, '')}\n\n{intro_body}"
                body = prefix + '\n\n' + body
                first = False
            converter.write_section(ch, sec, sec_title, body)

    # ---------- 习题参考答案 ----------
    ans_groups = converter.chunker.group_answers_by_sec(answers_lines)
    for ch in sorted(ans_groups):
        items = ans_groups[ch]
        ans_raw = [l for _, lines in items for l in lines]
        ans_body = "## 习题参考答案\n\n" + converter.card_parser.render_body(ans_raw, is_answer=True)
        n = LAST_SEC.get(ch, 9) + 1
        converter.write_answers_page(ch, n, f"第{ch}章 习题参考答案", ans_body)

    # ---------- 附表 ----------
    table_idx = len(tables_lines)
    for i, line in enumerate(tables_lines):
        if TABLE_CAP_RE.match(line.strip()) and line.strip().startswith('表 6'):
            table_idx = i
            break
    a1 = [l for l in tables_lines[:table_idx] if l.strip() != '附表']
    a2 = tables_lines[table_idx:]
    if a1:
        converter.write_mdx('a1_附表（分布函数表）.mdx', '附表（分布函数表 表1-表5.4）', converter.card_parser.render_body(a1))
        print('  [page] 生成 a1_附表（分布函数表）.mdx')
    if a2:
        converter.write_mdx('a2_附表（检验临界值表）.mdx', '附表（检验临界值表 表6-表14）', converter.card_parser.render_body(a2))
        print('  [page] 生成 a2_附表（检验临界值表）.mdx')

    # ---------- 参考文献 ----------
    refs_body = converter.card_parser.render_body(refs_lines)
    if refs_body.strip():
        converter.write_appendix('a3', '参考文献', refs_body)

    # ---------- 资产拷贝 ----------
    print('== 拷贝图片与封面 ==')
    converter.copy_images()
    converter.copy_cover('c6d0295bdf6b3cf099ddf7474e335c979c5f5d469b6d0b11e63f89e1cbc5f58f.jpg')
    print('== 完成 ==')


if __name__ == '__main__':
    sys.exit(main())
