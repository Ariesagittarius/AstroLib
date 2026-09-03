#!/usr/bin/env python3

"""
把 task/ 中《工科数学分析基础》(第三版) 的 MinerU 产物批量转换为站点 MDX。
"""

import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import BookConverter

VOL1_A = '工科数学分析基础 上册前半部分.pdf-92095da8-01a2-4484-9b12-5cf2ea226279'
VOL1_B = '工科数学分析基础 上册后半部分.pdf-d94862a1-013b-4866-ae7d-e38ada67ca9a'
VOL2_A = '工科数学分析基础 下册前半部分.pdf-10d8a4b3-e439-4efe-93a2-b9ccdc193747'
VOL2_B = '工科数学分析基础 下册后半部分.pdf-7184681b-ba36-4aac-9d4e-80495153f4ca'
TASK_DIRS = [VOL1_A, VOL1_B, VOL2_A, VOL2_B]

def main():
    converter = BookConverter(
        book_slug='engineering_analysis',
        collection='math',
        task_dirs=TASK_DIRS,
        clean_out_dir=True,
    )
    print('== 读取与切分原始 markdown ==')
    v1a = converter.read_task_lines(VOL1_A)
    v1b = converter.read_task_lines(VOL1_B)
    v2a = converter.read_task_lines(VOL2_A)
    v2b = converter.read_task_lines(VOL2_B)

    v1b_body, v1b_ans = converter.chunker.cut_answer_key(v1b)
    v2b_body, v2b_ans = converter.chunker.cut_answer_key(v2b)
    v1a_body = converter.chunker.strip_front_matter(v1a, r'^#{1,6}\s*绪论\s*$')

    vol1 = v1a_body + v1b_body
    vol2 = v2a + v2b_body
    print(f"vol1 行数: {len(vol1)} | vol2 行数: {len(vol2)}")

    intro_lines = converter.chunker.extract_between(v1a, r'^##\s*内容提要\s*$', r'^##\s')
    intro_body = (
        '\n\n'.join(intro_lines).strip()
        + '\n\n本书第三版分上、下两册出版：上册（第 1—4 章）主要内容为一元函数微积分与常微分方程'
          '，下册（第 5—7 章）主要内容为多元函数微积分与无穷级数。每章配有 A、B 两类习题与综合练习题，'
          '书末附有部分习题答案与提示。'
    )
    converter.write_intro('内容简介', intro_body)

    jl = converter.chunker.extract_between(vol1, r'^#{1,6}\s*绪论\s*$', r'^#{1,6}\s*第一章\s')
    jl = [l for l in jl if not re.match(r'^#{1,6}\s*绪论\s*$', l.strip())]
    converter.write_preface('绪论', converter.card_parser.render_body(jl))

    last_sec = {}
    for vol_name, vol_lines in (('上册', vol1), ('下册', vol2)):
        chapters = converter.chunker.split_chapters_chinese(vol_lines)
        for ch_num, ch_title, ch_lines in chapters:
            sections = converter.chunker.split_sections_chinese(ch_lines)
            if not sections:
                continue
            last_sec[ch_num] = sections[-1][0]
            for si, (sec_num, sec_title, sec_lines) in enumerate(sections):
                sec_body_lines, tail = converter.chunker.split_chapter_tail(sec_lines)
                body = converter.card_parser.render_body(sec_body_lines)
                if body.strip():
                    converter.write_section(ch_num, sec_num, sec_title, body)

                if tail and si == len(sections) - 1:
                    tail_body = converter.card_parser.render_body(tail)
                    fname = f"{ch_num}.{sec_num + 1}_第{ch_num}章习题与综合练习题.mdx"
                    converter.write_mdx(fname, f"第{ch_num}章 习题与综合练习题", tail_body)
                    print(f"  [page] 生成 第{ch_num}章 习题与综合练习题")

    app_idx = converter.chunker.find_heading_index(v1b_body, r'^#{1,6}\s*附录\s*$')
    if app_idx is not None:
        ans_start = converter.chunker.find_heading_index(v1b_body, r'^##\s*第[一二三四五六七八九十]+章\s*$')
        app_lines = v1b_body[app_idx:] if ans_start is None else v1b_body[app_idx:ans_start]
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
        names = {1: '参数表示、极坐标与常见曲线', 2: '三角函数公式与反三角函数', 3: '复数与积分表'}
        for lo, hi in pairs:
            chunk = []
            for k in range(lo, hi + 1):
                chunk.extend(groups.get(k, []))
            if chunk:
                body = converter.card_parser.render_body(chunk)
                idx = lo // 2 + 1
                converter.write_appendix(f"a{idx}", f"附录{lo}-{hi}_{names[idx]}", body)

    app_idx = converter.chunker.find_heading_index(v2b_body, r'^#{1,6}\s*附录')
    if app_idx is not None:
        ans_start = converter.chunker.find_heading_index(v2b_body, r'^##\s*第[一二三四五六七八九十]+章\s*$')
        app_lines = v2b_body[app_idx:] if ans_start is None else v2b_body[app_idx:ans_start]
        body = converter.card_parser.render_body(app_lines)
        converter.write_appendix('a4', '下册附录_部分曲面和空间立体的图形', body)

    for vol_name, ans_lines in (('上册', v1b_ans), ('下册', v2b_ans)):
        for ch_num, ch_lines in sorted(converter.chunker.split_answer_chapters(ans_lines).items()):
            body = converter.card_parser.render_body(ch_lines, is_answer=True)
            if not body.strip():
                continue
            n = last_sec.get(ch_num, 9) + 2
            converter.write_answers_page(ch_num, n, f"第{ch_num}章 习题答案与提示", body)

    print('== 拷贝图片与封面 ==')
    converter.copy_images()
    converter.copy_cover('5e71662d15b2dc6ed36b9e59bc4f0ef9c8f4a091dbbada7b39e6661247fb32f9.jpg')
    print('== 完成 ==')

if __name__ == '__main__':
    sys.exit(main())
