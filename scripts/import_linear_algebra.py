#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
把 task/ 中《线性代数及其应用》(原书第5版, David C. Lay 等, 机械工业出版社) 的 MinerU 产物
批量转换为站点 MDX。
"""

import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import BookConverter

V1 = '线性代数及其应用 ( etc.) (z-library.sk, 1lib.sk, z-lib.sk (1).pdf-3e621475-54f7-465f-b0d0-6ad7253e5cc5'
V2 = '线性代数及其应用 ( etc.) (z-library.sk, 1lib.sk, z-lib.sk (1).pdf-c18de42d-3a0c-4b90-8661-ef624c1e575e'
V3 = '线性代数及其应用 ( etc.) (z-library.sk, 1lib.sk, z-lib.sk (1).pdf-b9cbb8c4-0fa4-47ea-b770-de5032f57a34'
SRC_DIRS = [V1, V2, V3]


def main():
    converter = BookConverter(
        book_slug='linear_algebra',
        collection='math',
        task_dirs=SRC_DIRS,
        clean_out_dir=True,
    )
    print('== 读取原始 markdown ==')
    v1 = converter.read_task_lines(V1)
    v2 = converter.read_task_lines(V2)
    v3 = converter.read_task_lines(V3)

    # 切出答案区与垃圾行
    v3_body, v3_ans = converter.chunker.cut_answer_key(v3, r'^#\s*奇数习题答案\s*$')
    ch1_idx = converter.chunker.find_heading_index(v1, r'^#{1,6}\s*第\s*1\s*章\s')
    front = v1[:ch1_idx]
    body = v1[ch1_idx:] + v2 + v3_body
    print(f"书前行数: {len(front)} | 正文总行数: {len(body)} | 答案行数: {len(v3_ans)}")

    # ---------- 00 内容简介 ----------
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
    converter.write_intro('内容简介', intro_body)

    # ---------- 01 译者序与前言 ----------
    pre_lines = converter.chunker.extract_between(front, r'^#{1,6}\s*译者序\s*$', r'^#{1,6}\s*给学生的注释\s*$')
    pre_lines = converter.cleaner.filter_lines(pre_lines)
    if pre_lines:
        b1 = converter.card_parser.render_parts([(None, pre_lines)], with_footnotes=False)
        converter.write_mdx('01_译者序与前言.mdx', '译者序与前言', b1)
        print('  [page] 生成 01_译者序与前言.mdx')

    # ---------- 02 给学生的注释 ----------
    note_lines = converter.chunker.extract_between(front, r'^#{1,6}\s*给学生的注释\s*$', r'^#{1,6}\s*目录\s*$')
    note_lines = converter.cleaner.filter_lines(note_lines)
    if note_lines:
        b2 = converter.card_parser.render_parts([(None, note_lines)], with_footnotes=False)
        converter.write_mdx('02_给学生的注释.mdx', '给学生的注释', b2)
        print('  [page] 生成 02_给学生的注释.mdx')

    # ---------- 章节 ----------
    ch_pattern = re.compile(r'^#{1,6}\s*第\s*([\d一二三四五六七八九十]+)\s*章\s*(.*)$')
    chapters = converter.chunker.split_chapters_chinese(body, ch_re=ch_pattern)
    print(f"识别章数: {len(chapters)}")
    last_sec_map = {}

    for ch_num, ch_title, ch_lines in chapters:
        intro, intro_title, sections, tail = converter.chunker.split_chapter_parts(ch_lines)
        # 介绍性实例
        if intro and any(l.strip() for l in intro):
            b = converter.card_parser.render_parts([(None, intro)])
            if b.strip():
                fname = f"{ch_num}.0_第{ch_num}章介绍性实例.mdx"
                converter.write_mdx(fname, f"介绍性实例 {intro_title}", b)
                print(f"  [page] 生成 第{ch_num}章 介绍性实例 {intro_title}")

        # 各节
        sec_nums = sorted(sections.keys())
        last_sec_map[ch_num] = sec_nums[-1] if sec_nums else 0
        for sec_num in sec_nums:
            sec = sections[sec_num]
            parts = converter.chunker.split_section_blocks(sec['lines'])
            b = converter.card_parser.render_parts(parts, with_footnotes=True)
            if b.strip():
                converter.write_section(ch_num, sec_num, sec['title'], b)

        # 补充习题
        if tail and any(l.strip() for l in tail):
            parts = converter.chunker.split_section_blocks(tail)
            b = converter.card_parser.render_parts(parts, with_footnotes=True)
            if b.strip():
                n = last_sec_map[ch_num] + 1
                fname = f"{ch_num}.{n}_第{ch_num}章补充习题.mdx"
                converter.write_mdx(fname, f"第{ch_num}章 补充习题", b)
                print(f"  [page] 生成 第{ch_num}章 补充习题")

    # ---------- 附录与术语表 ----------
    app_a = converter.chunker.extract_between(v3_body, r'^#{1,6}\s*附录\s*A\b', r'^#{1,6}\s*附录\s*B\b')
    app_b = converter.chunker.extract_between(v3_body, r'^#{1,6}\s*附录\s*B\b', r'^#{1,6}\s*术语表\s*$')
    glos = converter.chunker.extract_between(v3_body, r'^#{1,6}\s*术语表\s*$', None)

    if app_a:
        b = converter.card_parser.render_parts([(None, app_a)])
        converter.write_appendix('a1', '附录A_简化阶梯形矩阵的唯一性', b)
    if app_b:
        b = converter.card_parser.render_parts([(None, app_b)])
        converter.write_appendix('a2', '附录B_复数', b)
    if glos:
        b = converter.card_parser.render_parts([(None, glos)])
        converter.write_appendix('a3', '术语表', b)

    # ---------- 奇数习题答案 ----------
    ans_groups = converter.chunker.split_answer_sections(v3_ans)
    for ch_num in sorted(ans_groups.keys()):
        parts = [(name, ls) for name, ls in ans_groups[ch_num] if any(l.strip() for l in ls)]
        if parts:
            b = converter.card_parser.render_parts(parts)
            converter.write_answers_page(ch_num, ch_num, f"第{ch_num}章 奇数习题答案", b, prefix='b')

    # ---------- 资产拷贝 ----------
    print('== 拷贝图片与封面 ==')
    converter.copy_images()
    converter.copy_cover('d56198918e5257e02dde16ddda72348d9356211d6979b71a663c61b3886e55e9.jpg')
    print('== 完成 ==')


if __name__ == '__main__':
    sys.exit(main())
