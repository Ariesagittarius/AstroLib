#!/usr/bin/env python3

"""
scripts/import_digital_circuit.py
把 C:\\Users\\白羊欣存\\MinerU 中《数字电路与逻辑设计》（第2版，刘培植 主编，北京邮电大学出版社）
全书 3 个 MinerU 转换目录无损拼接并批量转换为站点 MDX 与题库 JSON。
"""

import os
import re
import sys
import json
import shutil

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import BookConverter, CardParser, MdxSanitizer

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
MINERU_BASE = r"C:\Users\白羊欣存\MinerU"

TASK_DIRS = [
    os.path.join(MINERU_BASE, '数字电路与逻辑设计.pdf-d1f73d46-4266-4c49-bfe9-6754232adc8c'),
    os.path.join(MINERU_BASE, '数字电路与逻辑设计.pdf-dedb0746-b887-4333-8ad1-f3986052398b'),
    os.path.join(MINERU_BASE, '数字电路与逻辑设计.pdf-5327ef94-eeb4-44ee-86b2-df0adb1c373c'),
]

OUT_DOCS_DIR = os.path.join(PROJECT_ROOT, 'src', 'content', 'docs', 'collections', 'telecom', 'digital_circuit')
OUT_IMAGES_DIR = os.path.join(OUT_DOCS_DIR, 'images')
OUT_COVER_PATH = os.path.join(PROJECT_ROOT, 'public', 'covers', 'digital_circuit.jpg')
OUT_EXERCISE_JSON = os.path.join(PROJECT_ROOT, 'src', 'data', 'exercises', 'digital_circuit_textbook_exercises.json')
OUT_PUB_EX_IMG_DIR = os.path.join(PROJECT_ROOT, 'public', 'data', 'exercises', 'digital_circuit', 'images')

COVER_SRC_IMAGE = os.path.join(TASK_DIRS[0], 'images', '46ed6211abb58b102a7dbac46ce2c25033352f061b99fb70f45f2907f41fa609.jpg')

CHAPTER_TITLES = {
    1: '数字技术基础',
    2: '逻辑门电路',
    3: '组合电路的分析与设计',
    4: '集成触发器',
    5: '时序逻辑电路',
    6: '中规模时序集成电路及应用',
    7: '可编程逻辑器件',
    8: '硬件描述语言VHDL',
    9: '数模和模数转换',
    10: '脉冲波形的产生与变换',
}

SECTIONS_DEF = [

    (1, 1, r'^##\s*1\.1\s*数制与编码', '数制与编码', False),
    (1, 2, r'^##\s*1\.2\s*逻辑代数基础', '逻辑代数基础', False),
    (1, 3, r'^##\s*1\.3\s*逻辑函数及其表示方法', '逻辑函数及其表示方法', False),
    (1, 4, r'^##\s*1\.4\s*逻辑函数的简化', '逻辑函数的简化', False),
    (1, 5, r'^##\s*习题', '第1章习题', True),

    (2, 1, r'^##\s*2\.1\s*晶体管的开关特性', '晶体管的开关特性', False),
    (2, 2, r'^##\s*2\.2\s*晶体三极管反相器', '晶体三极管反相器', False),
    (2, 3, r'^##\s*2\.3\s*TTL\s*集成逻辑门', 'TTL集成逻辑门', False),
    (2, 4, r'^##\s*2\.4\s*ECL\s*逻辑门', 'ECL逻辑门', False),
    (2, 5, r'^##\s*2\.5.*I.*2.*L.*逻辑门', 'I2L逻辑门电路', False),
    (2, 6, r'^##\s*2\.6\s*CMOS\s*逻辑门', 'CMOS逻辑门', False),
    (2, 7, r'^##\s*2\.7\s*逻辑电平及逻辑电平转换', '逻辑电平及逻辑电平转换', False),
    (2, 8, r'^##\s*习题', '第2章习题', True),

    (3, 1, r'^##\s*3\.1\s*组合逻辑电路的特点', '组合逻辑电路的特点', False),
    (3, 2, r'^##\s*3\.2\s*组合逻辑电路的分析', '组合逻辑电路的分析', False),
    (3, 3, r'^##\s*3\.3\s*小规模组合逻辑电路的设计', '小规模组合逻辑电路的设计', False),
    (3, 4, r'^##\s*3\.4\s*组合逻辑电路的冒险', '组合逻辑电路的冒险', False),
    (3, 5, r'^##\s*3\.5\s*常用的中规模组合逻辑电路与应用', '常用的中规模组合逻辑电路与应用', False),
    (3, 6, r'^##\s*习题', '第3章习题', True),

    (4, 1, r'^##\s*4\.1\s*时序电路的特点', '时序电路的特点', False),
    (4, 2, r'^##\s*4\.2\s*触发器的基本特性及其记忆作用', '触发器的基本特性及其记忆作用', False),
    (4, 3, r'^##\s*4\.3\s*基本\s*RS\s*触发器', '基本RS触发器', False),
    (4, 4, r'^##\s*4\.4\s*各种钟控触发器的逻辑功能', '各种钟控触发器的逻辑功能', False),
    (4, 5, r'^##\s*4\.5\s*TTL\s*集成主从触发器', 'TTL集成主从触发器', False),
    (4, 6, r'^##\s*4\.6\s*集成边沿触发器', '集成边沿触发器', False),
    (4, 7, r'^##\s*4\.7\s*CMOS\s*触发器', 'CMOS触发器', False),
    (4, 8, r'^##\s*4\.8\s*集成触发器的选用和参数', '集成触发器的选用和参数', False),
    (4, 9, r'^##\s*习题', '第4章习题', True),

    (5, 1, r'^##\s*5\.1\s*概述', '概述', False),
    (5, 2, r'^##\s*5\.2\s*同步时序逻辑电路分析', '同步时序逻辑电路分析', False),
    (5, 3, r'^##\s*5\.3\s*常用时序电路的设计', '常用时序电路的设计', False),
    (5, 4, r'^##\s*5\.4\s*一般时序逻辑电路的设计方法', '一般时序逻辑电路的设计方法', False),
    (5, 5, r'^##\s*习题', '第5章习题', True),

    (6, 1, r'^##\s*6\.1\s*中规模异步计数器', '中规模异步计数器', False),
    (6, 2, r'^##\s*6\.2\s*中规模同步计数器', '中规模同步计数器', False),
    (6, 3, r'^##\s*6\.3\s*中规模计数器的应用', '中规模计数器的应用', False),
    (6, 4, r'^##\s*6\.4\s*中规模移位寄存器', '中规模移位寄存器', False),
    (6, 5, r'^##\s*6\.5\s*中规模移存器的应用', '中规模移存器的应用', False),
    (6, 6, r'^##\s*习题', '第6章习题', True),

    (7, 1, r'^##\s*7\.1\s*存储器及其在可编程逻辑实现方面的应用', '存储器及其在可编程逻辑实现方面的应用', False),
    (7, 2, r'^##\s*7\.2\s*PLA.*PAL.*GAL', 'PLA_PAL_GAL', False),
    (7, 3, r'^##\s*7\.3\s*EPLD', 'EPLD', False),
    (7, 4, r'^##\s*7\.4\s*CPLD', 'CPLD', False),
    (7, 5, r'^##\s*7\.5\s*FPGA', 'FPGA', False),
    (7, 6, r'^##\s*习题', '第7章习题', True),

    (8, 1, r'^##\s*8\.1\s*电子设计自动化与硬件描述语言', '电子设计自动化与硬件描述语言', False),
    (8, 2, r'^##\s*8\.2\s*VHDL\s*程序的基本结构', 'VHDL程序的基本结构', False),
    (8, 3, r'^##\s*8\.3\s*VHDL\s*中的数据对象和数据类型', 'VHDL中的数据对象和数据类型', False),
    (8, 4, r'^##\s*8\.4\s*VHDL\s*中的属性和运算符', 'VHDL中的属性和运算符', False),
    (8, 5, r'^##\s*8\.5\s*VHDL\s*程序的语句组织结构', 'VHDL程序的语句组织结构', False),
    (8, 6, r'^##\s*8\.6\s*VHDL\s*的主要描述语句', 'VHDL的主要描述语句', False),
    (8, 7, r'^##\s*8\.7\s*用\s*VHDL\s*解决组合逻辑和时序逻辑问题', '用VHDL解决组合逻辑和时序逻辑问题', False),
    (8, 8, r'^##\s*习题', '第8章习题', True),

    (9, 1, r'^##\s*9\.1\s*数模转换器\s*DAC', '数模转换器DAC', False),
    (9, 2, r'^##\s*9\.2\s*模数转换器', '模数转换器', False),
    (9, 3, r'^##\s*习题', '第9章习题', True),

    (10, 1, r'^##\s*10\.1\s*波形的基础知识', '波形的基础知识', False),
    (10, 2, r'^##\s*10\.2\s*施密特触发器', '施密特触发器', False),
    (10, 3, r'^##\s*10\.3\s*单稳态触发器', '单稳态触发器', False),
    (10, 4, r'^##\s*10\.4\s*多谐振荡器', '多谐振荡器', False),
    (10, 5, r'^##\s*10\.5\s*555\s*定时器及其应用', '555定时器及其应用', False),
    (10, 6, r'^##\s*习题', '第10章习题', True),
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
    if '填空' in s or '\\underline{' in s or '______' in s:
        return 'blank'
    if '求证' in s or '证明' in s:
        return 'proof'
    if '设计' in s or '画出' in s or '画波形' in s or '连接图' in s or '波形图' in s:
        return 'design'
    if '什么是' in s or '为什么' in s or '试分析' in s or '简述' in s or '各有什么特点' in s:
        return 'short'
    return 'calc'

def read_and_stitch():
    with open(os.path.join(TASK_DIRS[0], 'full.md'), 'r', encoding='utf-8') as f:
        l1 = f.readlines()
    with open(os.path.join(TASK_DIRS[1], 'full.md'), 'r', encoding='utf-8') as f:
        l2 = f.readlines()
    with open(os.path.join(TASK_DIRS[2], 'full.md'), 'r', encoding='utf-8') as f:
        l3 = f.readlines()

    if l1[-1].endswith('变') or l1[-1].endswith('变\n'):
        first_clean = l1[-1].rstrip('\r\n') + l2[0]
        l1[-1] = first_clean
        l2 = l2[1:]

    raw_text = ''.join(l1 + l2 + l3)

    table_pattern = re.compile(
        r'<table><tr><td>CP的顺序</td><td>.*?</td><td>输入.*?</td></tr><tr><td></td><td rowspan="5"><img\s+src="images/([^"]+)"/?></td><td></td></tr><tr><td>1</td><td>1</td></tr><tr><td>2</td><td>0</td></tr><tr><td>3</td><td>1</td></tr><tr><td>4</td><td>1</td></tr></table>',
        re.DOTALL
    )
    table_repl = r'''| CP 的顺序 | $Q_3^n\ Q_2^n\ Q_1^n\ Q_0^n$ | 输入 $D_1$ |
| :---: | :---: | :---: |
| 0 (初始) | 0 0 0 0 | - |
| 1 | 1 0 0 0 | 1 |
| 2 | 0 1 0 0 | 0 |
| 3 | 1 0 1 0 | 1 |
| 4 | 1 1 0 1 | 1 |

![](images/\1)'''
    raw_text = table_pattern.sub(table_repl, raw_text)

    raw_text = re.sub(r'<img\b[^>]*src=["\'](images/[^"\']+)["\'][^>]*>', r'![](\1)', raw_text)

    return [line + '\n' for line in raw_text.splitlines()]

def main():
    print("==============================================================")
    print("🚀 开始导入《数字电路与逻辑设计》（第2版）")
    print("==============================================================")

    os.makedirs(OUT_DOCS_DIR, exist_ok=True)
    os.makedirs(OUT_IMAGES_DIR, exist_ok=True)
    os.makedirs(OUT_PUB_EX_IMG_DIR, exist_ok=True)
    os.makedirs(os.path.dirname(OUT_COVER_PATH), exist_ok=True)

    sanitizer = MdxSanitizer()
    card_parser = CardParser(sanitizer)

    all_lines = read_and_stitch()
    print(f"📖 拼接后蓝本行数: {len(all_lines)}")

    idx_intro = None
    idx_cip = None
    idx_re_preface = None
    idx_preface = None
    idx_toc = None
    for i, line in enumerate(all_lines[:400]):
        s = line.strip()
        if s == '## 内容简介' and idx_intro is None:
            idx_intro = i
        elif s.startswith('## 图书在版编目') and idx_cip is None:
            idx_cip = i
        elif s == '## 再版前言' and idx_re_preface is None:
            idx_re_preface = i
        elif s == '## 前言' and idx_preface is None:
            idx_preface = i
        elif s == '## 目录' and idx_toc is None:
            idx_toc = i

    intro_lines = all_lines[idx_intro + 1:idx_cip]
    intro_body = card_parser.render_body(intro_lines)
    with open(os.path.join(OUT_DOCS_DIR, '00_内容简介.mdx'), 'w', encoding='utf-8') as f:
        f.write(IMPORTS_HEADER.format(title='内容简介') + intro_body + '\n')
    print("  [page] 生成 00_内容简介.mdx")

    re_pref_lines = all_lines[idx_re_preface + 1:idx_preface]
    re_pref_body = card_parser.render_body(re_pref_lines)
    with open(os.path.join(OUT_DOCS_DIR, '00_再版前言.mdx'), 'w', encoding='utf-8') as f:
        f.write(IMPORTS_HEADER.format(title='再版前言') + re_pref_body + '\n')
    print("  [page] 生成 00_再版前言.mdx")

    pref_lines = all_lines[idx_preface + 1:idx_toc]
    pref_body = card_parser.render_body(pref_lines)
    with open(os.path.join(OUT_DOCS_DIR, '01_前言.mdx'), 'w', encoding='utf-8') as f:
        f.write(IMPORTS_HEADER.format(title='前言') + pref_body + '\n')
    print("  [page] 生成 01_前言.mdx")

    curr_idx = 0
    section_ranges = []
    for ch, sec, pat, title, is_ex in SECTIONS_DEF:
        p = re.compile(pat)
        match_idx = None
        for i in range(curr_idx, len(all_lines)):
            if p.search(all_lines[i].strip()):
                match_idx = i
                break
        if match_idx is None:
            print(f"FATAL: 未匹配到小节: {ch}.{sec} {title} (pattern: {pat})")
            sys.exit(1)
        section_ranges.append((ch, sec, title, is_ex, match_idx))
        curr_idx = match_idx + 1

    ch_head_indices = {}
    ch_pat = re.compile(r'^##\s*第\s*(\d+)\s*章')
    for i, line in enumerate(all_lines):
        m = ch_pat.match(line.strip())
        if m:
            ch_num = int(m.group(1))
            ch_head_indices[ch_num] = i

    all_questions_by_ch = {}
    total_q_count = 0

    q_re = re.compile(r'^(?:#{0,6}\s*)?(\d+)\s*[-－]\s*(\d+)\.?\s+(.*)$')

    for i in range(len(section_ranges)):
        ch, sec, title, is_ex, start_idx = section_ranges[i]
        end_idx = section_ranges[i + 1][4] if i + 1 < len(section_ranges) else len(all_lines)
        raw_lines = all_lines[start_idx:end_idx]

        if is_ex:

            ex_lines = raw_lines[1:] if raw_lines and raw_lines[0].strip().startswith('##') else raw_lines

            q_matches = []
            for line_no, line in enumerate(ex_lines):
                m = q_re.match(line.strip())
                if m:
                    q_matches.append((int(m.group(1)), int(m.group(2)), line_no, m.group(3)))

            mdx_cards = []
            ch_questions = []

            for q_idx, (q_ch, q_num, l_idx, first_line_stem) in enumerate(q_matches):
                next_l_idx = q_matches[q_idx + 1][2] if q_idx + 1 < len(q_matches) else len(ex_lines)
                q_block_lines = ex_lines[l_idx:next_l_idx]

                q_block_lines[0] = first_line_stem
                stem_raw = '\n'.join([l.rstrip() for l in q_block_lines]).strip()
                stem_clean = sanitizer.sanitize_body(q_block_lines).strip()

                card_title = f"习题 {ch}-{q_num}"
                card_mdx = f'<Exercise title="{card_title}">\n{stem_clean}\n</Exercise>'
                mdx_cards.append(card_mdx)

                q_item = {
                    "id": f"DLD-TB-CH{ch:02d}-Q{q_num:02d}",
                    "source_type": "textbook",
                    "source": {
                        "paper_id": 3000 + ch,
                        "raw_title": f"《数字电路与逻辑设计》第{ch}章 {CHAPTER_TITLES[ch]} 课后习题",
                        "clean_title": f"《数字电路与逻辑设计》第{ch}章 {CHAPTER_TITLES[ch]} 课后习题",
                        "category": "教材课后习题",
                        "course_name": "数字电路与逻辑设计",
                        "academic_year": "教材配套",
                        "term": 1,
                        "exam_type": "textbook",
                        "paper_type": "教材原题",
                        "source_desc": f"《数字电路与逻辑设计》第 {ch} 章 · 习题 {ch}-{q_num}"
                    },
                    "meta": {
                        "section_type": "课后习题",
                        "order_in_paper": q_num,
                        "paper_q_num": q_num,
                        "type": infer_question_type(stem_clean),
                        "difficulty": 1
                    },
                    "mapping": {
                        "digital_circuit": {
                            "chapter": ch,
                            "chapter_title": f"第{ch}章 {CHAPTER_TITLES[ch]}"
                        }
                    },
                    "content": {
                        "stem": stem_clean
                    }
                }
                ch_questions.append(q_item)
                total_q_count += 1

            all_questions_by_ch[str(ch)] = ch_questions

            fname = f"{ch}.{sec}_第{ch}章习题.mdx"
            body = f"## 习题\n\n" + '\n\n'.join(mdx_cards)
            out_file = os.path.join(OUT_DOCS_DIR, fname)
            with open(out_file, 'w', encoding='utf-8') as f:
                f.write(IMPORTS_HEADER.format(title=f"第{ch}章 习题") + body + '\n')
            print(f"  [page] 生成 {fname} (共 {len(q_matches)} 道习题)")

        else:

            body_lines = list(raw_lines)
            prefix = ""
            if sec == 1 and ch in ch_head_indices:
                ch_start = ch_head_indices[ch]
                ch_intro_lines = all_lines[ch_start:start_idx]
                if ch_intro_lines:
                    intro_content = card_parser.render_body(ch_intro_lines[1:])
                    prefix = f"## 第{ch}章 {CHAPTER_TITLES[ch]}\n\n" + (intro_content + "\n\n" if intro_content else "")

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

    exercise_db = {
        "book": "digital_circuit",
        "title": "数字电路与逻辑设计（第2版）",
        "authors": "刘培植 主编，胡春静、郭琳、孙文生、刘丽华 编著",
        "publisher": "北京邮电大学出版社",
        "total_questions": total_q_count,
        "total_chapters": 10,
        "expected_matrix": {str(ch): len(qs) for ch, qs in all_questions_by_ch.items()},
        "chapters": all_questions_by_ch
    }

    with open(OUT_EXERCISE_JSON, 'w', encoding='utf-8') as f:
        json.dump(exercise_db, f, ensure_ascii=False, indent=2)
    print(f"\n📦 题库数据成功导出: {OUT_EXERCISE_JSON} (共 {total_q_count} 题)")

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

    if os.path.exists(COVER_SRC_IMAGE):
        shutil.copy2(COVER_SRC_IMAGE, OUT_COVER_PATH)
        print(f"📸 封面已就绪: {OUT_COVER_PATH}")
    else:
        print(f"  [warn] 未找到封面原图: {COVER_SRC_IMAGE}")

    print("\n✅ 《数字电路与逻辑设计》导入全部完成！")

if __name__ == '__main__':
    main()
