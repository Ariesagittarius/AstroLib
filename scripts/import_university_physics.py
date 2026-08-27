#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
把 task/ 中《大学物理学》(第7版, 赵近芳/王登龙, 北京邮电大学出版社) 的 MinerU 产物
批量转换为站点 MDX。
"""

import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import BookConverter

V1A = '大学物理学 第7版 上=Physics (赵近芳) 前半(z-library.sk, 1lib.sk, z-lib.sk) (1).pdf-1ac9aa80-0f8f-418f-b584-f473a3ef6b6b'
V1B = '大学物理学 第7版 上=Physics (赵近芳) 后半(z-library.sk, 1lib.sk, z-lib.sk) (1).pdf-aa736eac-5d4a-48cd-9461-ea261d97c960'
V2A = '大学物理学北京邮电大学出版社(第七版)(下) 前半(赵近芳) (z-library.sk, 1lib.sk, z-lib.sk) (1).pdf-3889e752-79f4-4e48-9692-5df64e333a09'
V2B = '大学物理学北京邮电大学出版社(第七版)(下) 后半(赵近芳) (z-library.sk, 1lib.sk, z-lib.sk) (1).pdf-9f1b9437-ca69-4f28-9e3a-ac3c6aacbfc9'
SRC_DIRS = [V1A, V1B, V2A, V2B]

CHAPTER_TITLES = {
    1: '质点运动学', 2: '质点动力学', 3: '刚体力学基础', 4: '狭义相对论',
    5: '机械振动', 6: '机械波', 7: '气体动理论基础', 8: '热力学基础',
    9: '静电场', 10: '稳恒磁场', 11: '变化的电磁场', 12: '光的干涉',
    13: '光的衍射', 14: '光的偏振', 15: '量子物理基础',
    16: '原子核物理和粒子物理简介', 17: '新技术的物理基础',
}
PART_NAMES = ('力学基础', '气体动理论和热力学', '电磁学', '波动光学', '量子论')

PART_RE = re.compile(r'^#\s*(' + '|'.join(PART_NAMES) + r')\s*$')
CH_RE = re.compile(r'^#{0,6}\s*第([\d一二三四五六七八九十]+)章\s*$')
SEC_RE = re.compile(r'^#{0,6}\s*\\?\*?(\d+)\.(\d+)(?:\s+(.*))?\s*$')
SUBSEC_HEAD_RE = re.compile(r'^#{1,6}\s*\\?\*?(\d+)\.(\d+)\.(\d+)\s')
TAIL_EX_RE = re.compile(r'^#{0,6}\s*习题\s*\d*\s*$')
TAIL_ANS_RE = re.compile(r'^习题参考答案\s*$')
TAIL_TYPE_RE = re.compile(r'^##\s*(\d+)\.(\d+)\s*(选择题|填空题|解答题)\s*$')
APPENDIX_RE = re.compile(r'^##\s*附录')
CLOUD_RE = re.compile(r'^##\s*配套云资源的使用说明')
SUMMARY_RE = re.compile(r'^本章提要\s*$')
TITLELIKE_RE = re.compile(r'^#{1,6}\s+\S')
SUBSEC_RE = re.compile(r'^#{1,6}\s*\\?\*?\d+\.\d+\.\d+')
EX_HEAD_RE = re.compile(r'^#{1,6}\s*(例|例题)\s*\d')


def split_physics_chapters(lines, converter):
    """把一卷正文切分为 {章号: {'intro': [...], 'sections': {节号: [...]}, 'tail': [...]}}。"""
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
        if converter.cleaner.is_artifact(s):
            continue
        m = CH_RE.match(s)
        if m:
            close()
            ch = converter.chunker.to_arabic(m.group(1))
            intro = list(pending_intro) if pending_intro else []
            pending_intro = []
            continue
        if TAIL_TYPE_RE.match(s):
            if not in_tail:
                in_tail = True
            tail.append(raw)
            continue
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
                in_tail = False
                pending_intro = [raw]
                sec = None
                continue
            if APPENDIX_RE.match(s) or CLOUD_RE.match(s):
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


def main():
    converter = BookConverter(
        book_slug='university_physics',
        collection='science',
        task_dirs=SRC_DIRS,
        clean_out_dir=True,
    )
    print('== 读取原始 markdown ==')
    v1a = converter.read_task_lines(V1A)
    v1b = converter.read_task_lines(V1B)
    v2a = converter.read_task_lines(V2A)
    v2b = converter.read_task_lines(V2B)

    # ---- 上册 ----
    intro_lines = converter.chunker.extract_between(v1a, r'^##\s*内容简介\s*$', r'^##\s*图书在版编目')
    intro_sec = converter.chunker.find_heading_index(v1a, r'^##\s*绪论\s*$')
    jl_lines = converter.chunker.extract_between(v1a, r'^##\s*绪论\s*$', r'^##\s*目录\s*$')
    v1a_body = converter.chunker.strip_toc(v1a[intro_sec:], r'^##\s*目录\s*$', r'^#\s*(' + '|'.join(PART_NAMES) + r')\s*$')

    app_start = converter.chunker.find_heading_index(v1b, APPENDIX_RE)
    v1b_body = v1b[:app_start]
    appendix_lines = v1b[app_start:]
    cloud_idx = converter.chunker.find_heading_index(appendix_lines, CLOUD_RE)
    if cloud_idx is not None:
        appendix_lines = appendix_lines[:cloud_idx]

    # ---- 下册 ----
    v2a_start = converter.chunker.find_heading_index(v2a, r'^#\s*电磁学\s*$')
    v2a_body = v2a[v2a_start:]
    v2b_end = converter.chunker.find_heading_index(v2b, CLOUD_RE)
    v2b_body = v2b[:v2b_end] if v2b_end is not None else v2b

    vol1, order1 = split_physics_chapters(v1a_body + v1b_body, converter)
    vol2, order2 = split_physics_chapters(v2a_body + v2b_body, converter)
    print(f"上册章节: {order1} | 下册章节: {order2}")

    # ---------- 00 内容简介 ----------
    intro_body = (
        '\n\n'.join(intro_lines).strip()
        + '\n\n本书第 7 版分上、下两册出版：上册（第 1—8 章）包括力学基础（质点运动学、'
          '质点动力学、刚体力学基础、狭义相对论、机械振动、机械波）与气体动理论和热力学；'
          '下册（第 9—17 章）包括电磁学、波动光学与量子论。每章课后习题按选择题、填空题、'
          '解答题分页整理，每题一个板块，部分章节附参考答案。'
    )
    converter.write_intro('内容简介', intro_body)

    # ---------- 01 绪论 ----------
    converter.write_preface('绪论', converter.card_parser.render_body(jl_lines))

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

        # ---------- 章末习题（按题型分页） ----------
        if tail:
            ans_chunk = converter.chunker.extract_answer_chunk(tail)
            types = converter.chunker.split_tail_by_type(tail)
            converter.write_tail_exercises_by_type(ch, last_sec + 1, types, ans_chunk=ans_chunk)

    # ---------- 上册附录 ----------
    table_idx = converter.chunker.find_heading_index(appendix_lines, r'<table')
    if appendix_lines and table_idx is not None:
        a1 = appendix_lines[:table_idx]
        a2 = appendix_lines[table_idx:]
        converter.write_appendix('a1', '附录1_矢量', converter.card_parser.render_body(a1))
        converter.write_appendix('a2', '附录2_常用基本物理常量表', converter.card_parser.render_body(a2))

    # ---------- 资产拷贝 ----------
    print('== 拷贝图片与生成封面 ==')
    converter.copy_images()
    converter.generate_cover(
        title='大学物理学',
        subtitle='（第七版）',
        author='赵近芳  王登龙  主编',
        publisher='北京邮电大学出版社',
    )
    print('== 完成 ==')


if __name__ == '__main__':
    sys.exit(main())
