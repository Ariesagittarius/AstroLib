# -*- coding: utf-8 -*-
"""《电子电路基础》（刘宝玲 主编，第2版，高教出版社）自动化标准导入脚本。

执行流水线：
1. 三卷拼接与边界修复（文本跨页连贯性处理）；
2. 提取前言体系（内容简介、第二版前言、第一版前言）；
3. 精准定位 7 个章节共 63 个节点（常规小节、仿真例题、本章小结、课后习题）；
4. 提取附录、全书部分习题参考答案与参考文献；
5. 解析课后习题与书末答案关联，生成题库 JSON（electronic_circuits_textbook_exercises.json）；
6. MDX 封装（组件渲染、KaTeX 清洗、字符转义）；
7. 扫描引用的本地插图并拷贝至 images/ 与 public/images/exercises/；
8. 拷贝封面图片至 public/covers/electronic_circuits.jpg。
"""

import os
import re
import sys
import json
import shutil
from lib.card_parser import CardParser
from lib.mdx_sanitizer import MdxSanitizer

TASK_DIRS = [
    r"C:\Users\白羊欣存\MinerU\电子电路基础.pdf-cfe80637-1f9a-49ac-abb2-1bf5c0eb3984",
    r"C:\Users\白羊欣存\MinerU\电子电路基础.pdf-5e169213-e0fc-439d-97c5-5c6ab517a014",
    r"C:\Users\白羊欣存\MinerU\电子电路基础.pdf-d55f2dc5-7009-47db-b538-ed125083beae",
]

OUT_DOCS_DIR = r"D:\Antigravity\project\AstroLib\src\content\docs\collections\telecom\electronic_circuits"
OUT_IMAGES_DIR = os.path.join(OUT_DOCS_DIR, "images")
OUT_PUB_EX_IMG_DIR = r"D:\Antigravity\project\AstroLib\public\images\exercises"
OUT_EXERCISE_JSON = r"D:\Antigravity\project\AstroLib\src\data\exercises\electronic_circuits_textbook_exercises.json"
OUT_COVER_PATH = r"D:\Antigravity\project\AstroLib\public\covers\electronic_circuits.jpg"
COVER_SRC_IMAGE = os.path.join(TASK_DIRS[0], "images", "68b3b818e20345548c67865ab6aa4fdecfdeb7c3de107a01c159a0a2b24f49d6.jpg")

CHAPTER_TITLES = {
    1: '半导体二极管及其基本电路',
    2: '晶体三极管及其基本放大电路',
    3: '场效应管及其基本放大电路',
    4: '放大电路的频率特性',
    5: '负反馈放大电路',
    6: '集成运算放大器及其应用电路',
    7: '脉冲波形的产生和整形',
}

SECTIONS_DEF = [
    # Ch 1
    (1, 1, r'^##\s*1\.1\s*半导体的基本特性', '半导体的基本特性', 'sec'),
    (1, 2, r'^##\s*1\.2\s*半导体二极管的工作原理及特性', '半导体二极管的工作原理及特性', 'sec'),
    (1, 3, r'^##\s*1\.3\s*半导体二极管电路', '半导体二极管电路', 'sec'),
    (1, 4, r'^##\s*1\.4\s*计算机仿真例题', '计算机仿真例题', 'sec'),
    (1, 5, r'^##\s*本章小结', '本章小结', 'summary'),
    (1, 6, r'^##\s*习题', '第1章习题', 'exercise'),
    # Ch 2
    (2, 1, r'^##\s*2\.1\s*双极型晶体管', '双极型晶体管', 'sec'),
    (2, 2, r'^##\s*2\.2\s*放大电路的基本知识', '放大电路的基本知识', 'sec'),
    (2, 3, r'^##\s*2\.3\s*基本共射放大电路的工作原理及分析方法', '基本共射放大电路的工作原理及分析方法', 'sec'),
    (2, 4, r'^##\s*2\.4\s*放大电路的静态工作点稳定问题', '放大电路的静态工作点稳定问题', 'sec'),
    (2, 5, r'^##\s*2\.5\s*晶体管单管放大电路的三种基本组态', '晶体管单管放大电路的三种基本组态', 'sec'),
    (2, 6, r'^##\s*2\.6\s*电流源电路及其应用', '电流源电路及其应用', 'sec'),
    (2, 7, r'^##\s*2\.7\s*差分放大电路', '差分放大电路', 'sec'),
    (2, 8, r'^##\s*2\.8\s*功率放大电路', '功率放大电路', 'sec'),
    (2, 9, r'^##\s*2\.9\s*多级放大电路', '多级放大电路', 'sec'),
    (2, 10, r'^##\s*2\.10\s*计算机仿真例题', '计算机仿真例题', 'sec'),
    (2, 11, r'^##\s*本章小结', '本章小结', 'summary'),
    (2, 12, r'^##\s*习题', '第2章习题', 'exercise'),
    # Ch 3
    (3, 1, r'^##\s*3\.1\s*MOS\s*场效应管', 'MOS场效应管', 'sec'),
    (3, 2, r'^##\s*3\.2\s*结型场效应管', '结型场效应管', 'sec'),
    (3, 3, r'^##\s*\\?\*?3\.3\s*VDMOS.*管和.*IGBT.*管', 'VDMOS管和IGBT管', 'sec'),
    (3, 4, r'^##\s*3\.4\s*场效应管放大电路', '场效应管放大电路', 'sec'),
    (3, 5, r'^##\s*3\.5\s*场效应管模拟开关', '场效应管模拟开关', 'sec'),
    (3, 6, r'^##\s*3\.6\s*计算机仿真例题', '计算机仿真例题', 'sec'),
    (3, 7, r'^##\s*本章小结', '本章小结', 'summary'),
    (3, 8, r'^##\s*习题', '第3章习题', 'exercise'),
    # Ch 4
    (4, 1, r'^##\s*4\.1\s*频率特性概述', '频率特性概述', 'sec'),
    (4, 2, r'^##\s*4\.2\s*晶体管结电容对放大电路高频特性的影响', '晶体管结电容对放大电路高频特性的影响', 'sec'),
    (4, 3, r'^##\s*4\.3\s*双极型晶体管放大电路的频率特性', '双极型晶体管放大电路的频率特性', 'sec'),
    (4, 4, r'^##\s*4\.4\s*场效应管共源放大电路的频率特性', '场效应管共源放大电路的频率特性', 'sec'),
    (4, 5, r'^##\s*4\.5\s*计算机仿真例题', '计算机仿真例题', 'sec'),
    (4, 6, r'^##\s*本章小结', '本章小结', 'summary'),
    (4, 7, r'^##\s*习题', '第4章习题', 'exercise'),
    # Ch 5
    (5, 1, r'^##\s*5\.1\s*反馈的基本概念及判断方法', '反馈的基本概念及判断方法', 'sec'),
    (5, 2, r'^##\s*5\.2\s*负反馈对放大电路性能的影响', '负反馈对放大电路性能的影响', 'sec'),
    (5, 3, r'^##\s*5\.3\s*负反馈放大电路的分析方法', '负反馈放大电路的分析方法', 'sec'),
    (5, 4, r'^##\s*5\.4\s*负反馈放大电路的稳定性分析', '负反馈放大电路的稳定性分析', 'sec'),
    (5, 5, r'^##\s*5\.5\s*计算机仿真例题', '计算机仿真例题', 'sec'),
    (5, 6, r'^##\s*本章小结', '本章小结', 'summary'),
    (5, 7, r'^##\s*习题', '第5章习题', 'exercise'),
    # Ch 6
    (6, 1, r'^##\s*6\.1\s*集成运算放大器的组成及基本特性', '集成运算放大器的组成及基本特性', 'sec'),
    (6, 2, r'^##\s*6\.2\s*集成运算放大器的主要参数', '集成运算放大器的主要参数', 'sec'),
    (6, 3, r'^##\s*\\?\*?6\.3\s*其他集成运算放大器简介', '其他集成运算放大器简介', 'sec'),
    (6, 4, r'^##\s*6\.4\s*集成运算放大器的同相和反相放大电路', '集成运算放大器的同相和反相放大电路', 'sec'),
    (6, 5, r'^##\s*6\.5\s*由集成运算放大器构成的模拟运算电路', '由集成运算放大器构成的模拟运算电路', 'sec'),
    (6, 6, r'^##\s*6\.6\s*集成运算放大器参数对运算误差的影响', '集成运算放大器参数对运算误差的影响', 'sec'),
    (6, 7, r'^##\s*\\?\*?6\.7\s*模拟乘法器及其应用', '模拟乘法器及其应用', 'sec'),
    (6, 8, r'^##\s*\\?\*?6\.8\s*有源滤波器', '有源滤波器', 'sec'),
    (6, 9, r'^##\s*6\.9\s*电压比较器', '电压比较器', 'sec'),
    (6, 10, r'^##\s*6\.10\s*计算机仿真例题', '计算机仿真例题', 'sec'),
    (6, 11, r'^##\s*本章小结', '本章小结', 'summary'),
    (6, 12, r'^##\s*习题', '第6章习题', 'exercise'),
    # Ch 7
    (7, 1, r'^##\s*7\.1\s*波形的基础知识', '波形的基础知识', 'sec'),
    (7, 2, r'^##\s*7\.2\s*半导体器件的开关特性', '半导体器件的开关特性', 'sec'),
    (7, 3, r'^##\s*7\.3\s*门电路', '门电路', 'sec'),
    (7, 4, r'^##\s*7\.4\s*单稳态触发器', '单稳态触发器', 'sec'),
    (7, 5, r'^##\s*7\.5\s*施密特触发器', '施密特触发器', 'sec'),
    (7, 6, r'^##\s*7\.6\s*多谐振荡器', '多谐振荡器', 'sec'),
    (7, 7, r'^##\s*7\.7\s*三角波发生器与锯齿波发生器', '三角波发生器与锯齿波发生器', 'sec'),
    (7, 8, r'^##\s*7\.8\s*555\s*定时器及其主要应用', '555定时器及其主要应用', 'sec'),
    (7, 9, r'^##\s*7\.9\s*计算机仿真例题', '计算机仿真例题', 'sec'),
    (7, 10, r'^##\s*本章小结', '本章小结', 'summary'),
    (7, 11, r'^##\s*习题', '第7章习题', 'exercise'),
    # Appendix & Answers
    (8, 1, r'^#\s*附录\s*电子电路的计算机辅助分析与设计', '附录_电子电路计算机辅助分析与设计', 'appendix'),
    (8, 2, r'^#\s*部分习题参考答案', '部分习题参考答案', 'answers'),
    (8, 3, r'^##\s*参考文献', '参考文献', 'references'),
]

IMPORTS_HEADER = """---
title: '{title}'
---

import Guide from '@/components/Guide.astro';
import Knowledge from '@/components/Knowledge.astro';
import Example from '@/components/Example.astro';
import Analysis from '@/components/Analysis.astro';
import Solution from '@/components/Solution.astro';
import Variant from '@/components/Variant.astro';
import Note from '@/components/Note.astro';
import Block from '@/components/Block.astro';
import Method from '@/components/Method.astro';
import Exercise from '@/components/Exercise.astro';

"""

def infer_question_type(stem: str) -> str:
    s = stem.strip()
    if re.search(r'[A-D][\.、\s]', s) and ('选择' in s or re.search(r'\(.*?[A-D].*?\)', s)):
        return 'choice'
    if '判断' in s or '对错' in s or '画√' in s:
        return 'judge'
    if '填空' in s or '\\underline{' in s or '______' in s or '____' in s:
        return 'blank'
    if '求证' in s or '证明' in s:
        return 'proof'
    if '设计' in s or '画出' in s or '画波形' in s or '传输特性' in s or '波形图' in s:
        return 'design'
    if '什么是' in s or '为什么' in s or '试分析' in s or '简述' in s:
        return 'short'
    return 'calc'

def read_and_stitch():
    with open(os.path.join(TASK_DIRS[0], 'full.md'), 'r', encoding='utf-8') as f:
        lines1 = f.readlines()
    with open(os.path.join(TASK_DIRS[1], 'full.md'), 'r', encoding='utf-8') as f:
        lines2 = f.readlines()
    with open(os.path.join(TASK_DIRS[2], 'full.md'), 'r', encoding='utf-8') as f:
        lines3 = f.readlines()

    # Boundary 1 fix:
    if lines1[-1].endswith('要求'):
        lines1[-1] = lines1[-1] + lines2[0]
        lines2 = lines2[1:]
    elif lines1[-1].endswith('要求\n'):
        lines1[-1] = lines1[-1][:-1] + lines2[0]
        lines2 = lines2[1:]

    # Boundary 2 fix:
    clean_p3_head = []
    skip = True
    for l in lines3:
        if skip and l.strip() == '(b)':
            continue
        if skip and l.strip().startswith('发脉冲'):
            skip = False
            continue
        clean_p3_head.append(l)

    if lines2[-1].endswith('输入触'):
        lines2[-1] = lines2[-1] + '发脉冲才会影响电路的状态。\n'
    elif lines2[-1].endswith('输入触\n'):
        lines2[-1] = lines2[-1][:-1] + '发脉冲才会影响电路的状态。\n'

    raw_text = ''.join(lines1 + lines2 + clean_p3_head)

    # 兜底：若有残存的 <img src="images/xxx.jpg" ...> 转换为 Markdown 语法
    raw_text = re.sub(r'<img\b[^>]*src=["\'](images/[^"\']+)["\'][^>]*>', r'![](\1)', raw_text)

    return [l + '\n' for l in raw_text.splitlines()]

def parse_answers_map(ans_lines: list[str], sanitizer: MdxSanitizer) -> dict[str, str]:
    """从书末答案区精确解析各题答案。"""
    q_ans_pat = re.compile(r'^(?:#{1,6}\s*)?([1-7])\.(\d+)\.(\d+)\.?\s*(.*)$')
    answers = {}
    curr_key = None
    curr_buf = []

    for line in ans_lines:
        s = line.strip()
        m = q_ans_pat.match(s)
        if m:
            if curr_key:
                clean_ans = sanitizer.sanitize_body(curr_buf).strip()
                answers[curr_key] = clean_ans
            curr_key = f"{m.group(1)}.{m.group(2)}.{m.group(3)}"
            first_line = m.group(4).strip()
            curr_buf = [first_line] if first_line else []
        elif curr_key is not None:
            if s.startswith('## 第') or s.startswith('# 部分习题') or s.startswith('## 参考文献'):
                continue
            curr_buf.append(line.rstrip())

    if curr_key:
        clean_ans = sanitizer.sanitize_body(curr_buf).strip()
        answers[curr_key] = clean_ans

    return answers

def main():
    print("==============================================================")
    print("🚀 开始导入《电子电路基础》（第2版）")
    print("==============================================================")

    os.makedirs(OUT_DOCS_DIR, exist_ok=True)
    os.makedirs(OUT_IMAGES_DIR, exist_ok=True)
    os.makedirs(OUT_PUB_EX_IMG_DIR, exist_ok=True)
    os.makedirs(os.path.dirname(OUT_COVER_PATH), exist_ok=True)

    sanitizer = MdxSanitizer()
    card_parser = CardParser(sanitizer)

    all_lines = read_and_stitch()
    print(f"📖 拼接后蓝本行数: {len(all_lines)}")

    # 1. 提取前言体系
    idx_intro = None
    idx_cip = None
    idx_preface2 = None
    idx_preface1 = None
    idx_disclaimer = None
    idx_toc = None
    for i, line in enumerate(all_lines[:400]):
        s = line.strip()
        if s == '## 内容简介' and idx_intro is None:
            idx_intro = i
        elif s.startswith('## 图书在版编目') and idx_cip is None:
            idx_cip = i
        elif s == '## 第二版前言' and idx_preface2 is None:
            idx_preface2 = i
        elif s == '## 第一版前言' and idx_preface1 is None:
            idx_preface1 = i
        elif s == '## 郑重声明' and idx_disclaimer is None:
            idx_disclaimer = i
        elif s == '## 目录' and idx_toc is None:
            idx_toc = i

    intro_lines = all_lines[idx_intro + 1:idx_cip]
    intro_body = card_parser.render_body(intro_lines)
    with open(os.path.join(OUT_DOCS_DIR, '00_内容简介.mdx'), 'w', encoding='utf-8') as f:
        f.write(IMPORTS_HEADER.format(title='内容简介') + intro_body + '\n')
    print("  [page] 生成 00_内容简介.mdx")

    pref2_lines = all_lines[idx_preface2 + 1:idx_preface1]
    pref2_body = card_parser.render_body(pref2_lines)
    with open(os.path.join(OUT_DOCS_DIR, '00_第二版前言.mdx'), 'w', encoding='utf-8') as f:
        f.write(IMPORTS_HEADER.format(title='第二版前言') + pref2_body + '\n')
    print("  [page] 生成 00_第二版前言.mdx")

    pref1_lines = all_lines[idx_preface1 + 1:idx_disclaimer]
    pref1_body = card_parser.render_body(pref1_lines)
    with open(os.path.join(OUT_DOCS_DIR, '01_第一版前言.mdx'), 'w', encoding='utf-8') as f:
        f.write(IMPORTS_HEADER.format(title='第一版前言') + pref1_body + '\n')
    print("  [page] 生成 01_第一版前言.mdx")

    # 2. 定位各小节起止行号
    curr_idx = 0
    section_ranges = []
    for ch, sec, pat, title, kind in SECTIONS_DEF:
        p = re.compile(pat)
        match_idx = None
        for i in range(curr_idx, len(all_lines)):
            if p.search(all_lines[i].strip()):
                match_idx = i
                break
        if match_idx is None:
            print(f"FATAL: 未匹配到小节: {ch}.{sec} {title} (pattern: {pat})")
            sys.exit(1)
        section_ranges.append((ch, sec, title, kind, match_idx))
        curr_idx = match_idx + 1

    # 定位各章引言起始点
    ch_head_indices = {}
    ch_pat = re.compile(r'^##\s*第\s*(\d+)\s*章')
    for i, line in enumerate(all_lines):
        m = ch_pat.match(line.strip())
        if m:
            ch_num = int(m.group(1))
            ch_head_indices[ch_num] = i

    # 3. 预先解析书末部分习题参考答案
    ans_item = [item for item in section_ranges if item[3] == 'answers'][0]
    ref_item = [item for item in section_ranges if item[3] == 'references'][0]
    ans_raw_lines = all_lines[ans_item[4]:ref_item[4]]
    answers_map = parse_answers_map(ans_raw_lines, sanitizer)
    print(f"📖 书末解析出 {len(answers_map)} 道习题参考答案")

    # 4. 逐节点生成 MDX 与题库 Item
    q_re = re.compile(r'^(?:#{1,6}\s*)?([1-7])\.(\d+)\.(\d+)\.?\s*(.*)$')
    all_questions_by_ch = {}
    total_q_count = 0

    for i in range(len(section_ranges)):
        ch, sec, title, kind, start_idx = section_ranges[i]
        end_idx = section_ranges[i + 1][4] if i + 1 < len(section_ranges) else len(all_lines)
        raw_lines = all_lines[start_idx:end_idx]

        if kind == 'exercise':
            # 处理课后习题页面
            ex_lines = raw_lines[1:] if raw_lines and raw_lines[0].strip().startswith('##') else raw_lines
            q_matches = []
            for line_no, line in enumerate(ex_lines):
                m = q_re.match(line.strip())
                if m:
                    q_matches.append((int(m.group(1)), int(m.group(2)), int(m.group(3)), line_no, m.group(4)))

            mdx_cards = []
            ch_questions = []

            for q_idx, (q_c, q_s, q_n, l_idx, first_line_stem) in enumerate(q_matches):
                next_l_idx = q_matches[q_idx + 1][3] if q_idx + 1 < len(q_matches) else len(ex_lines)
                q_block_lines = ex_lines[l_idx:next_l_idx]

                q_code = f"{q_c}.{q_s}.{q_n}"
                card_title = f"习题 {q_code}"

                # 第一行剥离题号
                q_block_lines[0] = first_line_stem
                stem_clean = sanitizer.sanitize_body(q_block_lines).strip()

                # 关联参考答案
                sol_mdx = ""
                sol_text = answers_map.get(q_code, "")
                if sol_text:
                    sol_mdx = f"\n\n<Solution>\n{sol_text}\n</Solution>"

                card_mdx = f'<Exercise title="{card_title}">\n{stem_clean}{sol_mdx}\n</Exercise>'
                mdx_cards.append(card_mdx)

                # 题库 Item
                q_id = f"EC-TB-CH{q_c:02d}-S{q_s:02d}-Q{q_n:02d}"
                q_item = {
                    "id": q_id,
                    "source_type": "textbook",
                    "source": {
                        "paper_id": 4000 + q_c,
                        "raw_title": f"《电子电路基础》第{q_c}章 {CHAPTER_TITLES.get(q_c, '')} 课后习题",
                        "clean_title": f"《电子电路基础》第{q_c}章 {CHAPTER_TITLES.get(q_c, '')} 课后习题",
                        "category": "教材课后习题",
                        "course_name": "电子电路基础",
                        "academic_year": "教材配套",
                        "term": 1,
                        "exam_type": "textbook",
                        "paper_type": "教材原题",
                        "source_desc": f"《电子电路基础》第 {q_c} 章 · 习题 {q_code}"
                    },
                    "meta": {
                        "section_type": "课后习题",
                        "order_in_paper": len(ch_questions) + 1,
                        "paper_q_num": q_code,
                        "type": infer_question_type(stem_clean),
                        "difficulty": 1
                    },
                    "mapping": {
                        "electronic_circuits": {
                            "chapter": q_c,
                            "chapter_title": f"第{q_c}章 {CHAPTER_TITLES.get(q_c, '')}",
                            "section": f"{q_c}.{q_s}"
                        }
                    },
                    "content": {
                        "stem": stem_clean,
                    }
                }
                if sol_text:
                    q_item["content"]["solution"] = sol_text

                ch_questions.append(q_item)
                total_q_count += 1

            all_questions_by_ch[str(ch)] = ch_questions

            fname = f"{ch}.{sec}_第{ch}章习题.mdx"
            body = f"## 习题\n\n" + '\n\n'.join(mdx_cards)
            out_file = os.path.join(OUT_DOCS_DIR, fname)
            with open(out_file, 'w', encoding='utf-8') as f:
                f.write(IMPORTS_HEADER.format(title=f"第{ch}章 习题") + body + '\n')
            print(f"  [page] 生成 {fname} (共 {len(q_matches)} 道习题)")

        elif kind == 'summary':
            # 本章小结
            body_lines = list(raw_lines)
            if body_lines and body_lines[0].strip().startswith('##'):
                body_lines = body_lines[1:]
            sec_body = card_parser.render_body(body_lines)
            fname = f"{ch}.{sec}_本章小结.mdx"
            page_title = f"第{ch}章 本章小结"
            out_file = os.path.join(OUT_DOCS_DIR, fname)
            with open(out_file, 'w', encoding='utf-8') as f:
                f.write(IMPORTS_HEADER.format(title=page_title) + sec_body + '\n')
            print(f"  [page] 生成 {fname}")

        elif kind == 'appendix':
            # 附录
            body_lines = list(raw_lines)
            if body_lines and body_lines[0].strip().startswith('#'):
                body_lines = body_lines[1:]
            sec_body = card_parser.render_body(body_lines)
            fname = "a1_附录_电子电路计算机辅助分析与设计.mdx"
            page_title = "附录 电子电路计算机辅助分析与设计"
            out_file = os.path.join(OUT_DOCS_DIR, fname)
            with open(out_file, 'w', encoding='utf-8') as f:
                f.write(IMPORTS_HEADER.format(title=page_title) + sec_body + '\n')
            print(f"  [page] 生成 {fname}")

        elif kind == 'answers':
            # 部分习题参考答案独立页面
            body_lines = list(raw_lines)
            if body_lines and body_lines[0].strip().startswith('#'):
                body_lines = body_lines[1:]
            sec_body = card_parser.render_body(body_lines)
            fname = "a2_部分习题参考答案.mdx"
            page_title = "部分习题参考答案"
            out_file = os.path.join(OUT_DOCS_DIR, fname)
            with open(out_file, 'w', encoding='utf-8') as f:
                f.write(IMPORTS_HEADER.format(title=page_title) + sec_body + '\n')
            print(f"  [page] 生成 {fname}")

        elif kind == 'references':
            # 参考文献
            body_lines = list(raw_lines)
            if body_lines and body_lines[0].strip().startswith('#'):
                body_lines = body_lines[1:]
            sec_body = card_parser.render_body(body_lines)
            fname = "a3_参考文献.mdx"
            page_title = "参考文献"
            out_file = os.path.join(OUT_DOCS_DIR, fname)
            with open(out_file, 'w', encoding='utf-8') as f:
                f.write(IMPORTS_HEADER.format(title=page_title) + sec_body + '\n')
            print(f"  [page] 生成 {fname}")

        else:
            # 常规小节或计算机仿真例题
            body_lines = list(raw_lines)
            prefix = ""
            if sec == 1 and ch in ch_head_indices:
                ch_start = ch_head_indices[ch]
                ch_intro_lines = all_lines[ch_start:start_idx]
                if ch_intro_lines:
                    intro_content = card_parser.render_body(ch_intro_lines[1:])
                    prefix = f"## 第{ch}章 {CHAPTER_TITLES[ch]}\n\n" + (intro_content + "\n\n" if intro_content else "")

            # 剥离小节自身标题行
            if body_lines and body_lines[0].strip().startswith('##'):
                body_lines = body_lines[1:]

            sec_body = card_parser.render_body(body_lines)
            full_body = (prefix + sec_body).strip()

            fname = f"{ch}.{sec}_{sanitizer.safe_title(title)}.mdx"
            page_title = f"{ch}.{sec} {title}"
            out_file = os.path.join(OUT_DOCS_DIR, fname)
            with open(out_file, 'w', encoding='utf-8') as f:
                f.write(IMPORTS_HEADER.format(title=page_title) + full_body + '\n')
            print(f"  [page] 生成 {fname}")

    # 5. 导出题库全量 JSON
    exercise_db = {
        "book": "electronic_circuits",
        "title": "电子电路基础（第2版）",
        "authors": "刘宝玲 主编，张静、张艳、安维胜、徐惠民 编著",
        "publisher": "高等教育出版社",
        "total_questions": total_q_count,
        "total_chapters": 7,
        "expected_matrix": {str(ch): len(qs) for ch, qs in all_questions_by_ch.items()},
        "chapters": all_questions_by_ch
    }

    with open(OUT_EXERCISE_JSON, 'w', encoding='utf-8') as f:
        json.dump(exercise_db, f, ensure_ascii=False, indent=2)
    print(f"\n📦 题库数据成功导出: {OUT_EXERCISE_JSON} (共 {total_q_count} 题)")

    # 6. 复制全书引用的本地图片
    print("\n🖼️ 开始扫描并拷贝所有引用的图片...")
    all_mdx_files = [os.path.join(OUT_DOCS_DIR, f) for f in os.listdir(OUT_DOCS_DIR) if f.endswith('.mdx')]
    img_refs = set()
    img_pat = re.compile(r'!\[[^\]]*\]\((images/[^)]+)\)')

    for mdx_f in all_mdx_files:
        with open(mdx_f, 'r', encoding='utf-8') as f:
            for match in img_pat.finditer(f.read()):
                img_refs.add(os.path.basename(match.group(1)))

    print(f"  MDX 中共引用 {len(img_refs)} 张图片")
    copied = 0
    missing = []

    for img_name in sorted(img_refs):
        found = False
        for tdir in TASK_DIRS:
            cand = os.path.join(tdir, 'images', img_name)
            if os.path.exists(cand):
                shutil.copy2(cand, os.path.join(OUT_IMAGES_DIR, img_name))
                shutil.copy2(cand, os.path.join(OUT_PUB_EX_IMG_DIR, img_name))
                copied += 1
                found = True
                break
        if not found:
            missing.append(img_name)

    print(f"  成功拷贝 {copied} 张图片至 {OUT_IMAGES_DIR} (缺失: {len(missing)})")
    if missing:
        print(f"  [warn] 缺失图片列表: {missing}")

    # 7. 复制封面
    if os.path.exists(COVER_SRC_IMAGE):
        shutil.copy2(COVER_SRC_IMAGE, OUT_COVER_PATH)
        print(f"📸 封面已就绪: {OUT_COVER_PATH}")
    else:
        print(f"  [warn] 未找到封面原图: {COVER_SRC_IMAGE}")

    print("\n✅ 《电子电路基础》导入全部完成！")

if __name__ == '__main__':
    main()
