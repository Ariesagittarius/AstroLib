#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Algorithms (Sanjoy Dasgupta, Christos Papadimitriou, Umesh Vazirani)
高清学术导入流水线脚本 (PyMuPDF 矢量文本层 + 高保真插图实体化 + MDX 语法校验)

输入: task/Algorithms (Sanjoy Dasgupta, Christos H. Papadimitriou etc.) (z-library.sk, 1lib.sk, z-lib.sk).pdf
输出:
  - src/content/docs/collections/cs/algorithms/*.mdx
  - src/content/docs/collections/cs/algorithms/images/fig_*.png
"""

import os
import re
import sys
import shutil
import fitz

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
PDF_PATH = os.path.join(
    PROJECT_ROOT, 'task', 'Algorithms (Sanjoy Dasgupta, Christos H. Papadimitriou etc.) (z-library.sk, 1lib.sk, z-lib.sk).pdf'
)
OUT_DIR = os.path.join(PROJECT_ROOT, 'src', 'content', 'docs', 'collections', 'cs', 'algorithms')
IMAGES_DIR = os.path.join(OUT_DIR, 'images')

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

SECTIONS_DEF = [
    ('00_preface', 'Preface', 9, 10),
    ('00.1_books-and-algorithms', '0.1 Books and algorithms', 11, 11),
    ('00.2_enter-fibonacci', '0.2 Enter Fibonacci', 12, 14),
    ('00.3_big-o-notation', '0.3 Big-O notation', 15, 17),
    ('00.4_exercises', 'Chapter 0 Exercises', 18, 20),
    ('01.1_basic-arithmetic', '1.1 Basic arithmetic', 21, 24),
    ('01.2_modular-arithmetic', '1.2 Modular arithmetic', 25, 32),
    ('01.3_primality-testing', '1.3 Primality testing', 33, 37),
    ('01.4_cryptography', '1.4 Cryptography', 38, 41),
    ('01.5_universal-hashing', '1.5 Universal hashing', 42, 45),
    ('01.6_exercises', 'Chapter 1 Exercises', 46, 50),
    ('02.1_multiplication', '2.1 Multiplication', 51, 52),
    ('02.2_recurrence-relations', '2.2 Recurrence relations', 53, 55),
    ('02.3_mergesort', '2.3 Mergesort', 56, 59),
    ('02.4_medians', '2.4 Medians', 60, 61),
    ('02.5_matrix-multiplication', '2.5 Matrix multiplication', 62, 63),
    ('02.6_the-fast-fourier-transform', '2.6 The fast Fourier transform', 64, 78),
    ('02.7_exercises', 'Chapter 2 Exercises', 79, 86),
    ('03.1_why-graphs', '3.1 Why graphs?', 87, 88),
    ('03.2_depth-first-search-in-undirected-graphs', '3.2 Depth-first search in undirected graphs', 89, 93),
    ('03.3_depth-first-search-in-directed-graphs', '3.3 Depth-first search in directed graphs', 94, 96),
    ('03.4_strongly-connected-components', '3.4 Strongly connected components', 97, 100),
    ('03.5_exercises', 'Chapter 3 Exercises', 101, 108),
    ('04.1_distances', '4.1 Distances', 109, 109),
    ('04.2_breadth-first-search', '4.2 Breadth-first search', 110, 111),
    ('04.3_lengths-on-edges', '4.3 Lengths on edges', 112, 112),
    ('04.4_dijkstras-algorithm', '4.4 Dijkstra’s algorithm', 112, 119),
    ('04.5_priority-queue-implementations', '4.5 Priority queue implementations', 120, 121),
    ('04.6_shortest-paths-in-the-presence-of-negative-edges', '4.6 Shortest paths in the presence of negative edges', 122, 123),
    ('04.7_shortest-paths-in-dags', '4.7 Shortest paths in dags', 124, 125),
    ('04.8_exercises', 'Chapter 4 Exercises', 126, 132),
    ('05.1_minimum-spanning-trees', '5.1 Minimum spanning trees', 133, 145),
    ('05.2_huffman-encoding', '5.2 Huffman encoding', 146, 150),
    ('05.3_horn-formulas', '5.3 Horn formulas', 151, 151),
    ('05.4_set-cover', '5.4 Set cover', 152, 154),
    ('05.5_exercises', 'Chapter 5 Exercises', 155, 160),
    ('06.1_shortest-paths-in-dags-revisited', '6.1 Shortest paths in dags, revisited', 161, 161),
    ('06.2_longest-increasing-subsequences', '6.2 Longest increasing subsequences', 162, 164),
    ('06.3_edit-distance', '6.3 Edit distance', 165, 170),
    ('06.4_knapsack', '6.4 Knapsack', 171, 173),
    ('06.5_chain-matrix-multiplication', '6.5 Chain matrix multiplication', 174, 174),
    ('06.6_shortest-paths', '6.6 Shortest paths', 175, 178),
    ('06.7_independent-sets-in-trees', '6.7 Independent sets in trees', 179, 180),
    ('06.8_exercises', 'Chapter 6 Exercises', 181, 188),
    ('07.1_an-introduction-to-linear-programming', '7.1 An introduction to linear programming', 189, 198),
    ('07.2_flows-in-networks', '7.2 Flows in networks', 199, 205),
    ('07.3_bipartite-matching', '7.3 Bipartite matching', 206, 206),
    ('07.4_duality', '7.4 Duality', 207, 209),
    ('07.5_zero-sum-games', '7.5 Zero-sum games', 210, 212),
    ('07.6_the-simplex-algorithm', '7.6 The simplex algorithm', 213, 221),
    ('07.7_postscript-circuit-evaluation', '7.7 Postscript: circuit evaluation', 222, 224),
    ('07.8_exercises', 'Chapter 7 Exercises', 225, 232),
    ('08.1_search-problems', '8.1 Search problems', 233, 242),
    ('08.2_np-complete-problems', '8.2 NP-complete problems', 243, 246),
    ('08.3_the-reductions', '8.3 The reductions', 247, 262),
    ('08.4_exercises', 'Chapter 8 Exercises', 263, 268),
    ('09.1_intelligent-exhaustive-search', '9.1 Intelligent exhaustive search', 269, 274),
    ('09.2_approximation-algorithms', '9.2 Approximation algorithms', 275, 281),
    ('09.3_local-search-heuristics', '9.3 Local search heuristics', 282, 290),
    ('09.4_exercises', 'Chapter 9 Exercises', 291, 294),
    ('10.1_qubits-superposition-and-measurement', '10.1 Qubits, superposition, and measurement', 295, 298),
    ('10.2_the-plan', '10.2 The plan', 299, 299),
    ('10.3_the-quantum-fourier-transform', '10.3 The quantum Fourier transform', 300, 301),
    ('10.4_periodicity', '10.4 Periodicity', 302, 303),
    ('10.5_quantum-circuits', '10.5 Quantum circuits', 304, 306),
    ('10.6_factoring-as-periodicity', '10.6 Factoring as periodicity', 307, 307),
    ('10.7_the-quantum-algorithm-for-factoring', '10.7 The quantum algorithm for factoring', 308, 310),
    ('10.8_exercises', 'Chapter 10 Exercises', 311, 312),
    ('11.1_historical-notes-and-further-reading', 'Historical notes and further reading', 313, 314),
]

LIGATURE_MAP = {
    '\ufb00': 'ff',
    '\ufb01': 'fi',
    '\ufb02': 'fl',
    '\ufb03': 'ffi',
    '\ufb04': 'ffl',
}

def sanitize_mdx(text: str) -> str:
    """保证文本不会破坏 MDX / JSX 编译。"""
    protected = []
    def protect(m):
        idx = len(protected)
        protected.append(m.group(0))
        return f"___PROTECTED_{idx}___"

    # 1. 保护代码块
    t = re.sub(r'```[\s\S]*?```', protect, text)
    # 2. 保护行间公式
    t = re.sub(r'\$\$[\s\S]*?\$\$', protect, t)
    # 3. 保护行内公式
    t = re.sub(r'\$[^\$\n]+?\$', protect, t)
    # 4. 保护合法的 AstroLib 标签与标准 HTML 标签
    t = re.sub(
        r'</?(?:Exercise|Knowledge|Example|Analysis|Solution|Variant|Note|Block|Method|Guide|img|sup|sub|table|thead|tbody|tfoot|tr|td|th|p|b|i|strong|em|code|pre)(?:\s+[^>\n]*)?/?>',
        protect,
        t
    )

    # 5. 转义裸 < 为 &lt;
    t = t.replace('<', '&lt;')
    # 6. 转义花括号
    t = t.replace('{', '&#123;').replace('}', '&#125;')
    # 7. 转义波浪号
    t = t.replace('~', '～')

    # 8. 还原受保护内容
    for idx, orig in enumerate(protected):
        t = t.replace(f"___PROTECTED_{idx}___", orig)

    return t

def spans_to_line(spans):
    """将一行中的 spans 合并，同时规范化连字并识别 TeX 上下标。"""
    if not spans:
        return ''
    res = []
    for i, s in enumerate(spans):
        text = s['text']
        for k, v in LIGATURE_MAP.items():
            text = text.replace(k, v)
        size = s['size']
        prev_s = spans[i-1] if i > 0 else None
        
        # 识别上标与下标 (TeX 7pt vs 10pt/12pt)
        if prev_s and size < prev_s['size'] * 0.85:
            if s['bbox'][1] < prev_s['bbox'][1] + 1.5:
                res.append(f'^{{{text}}}')
            elif s['bbox'][3] > prev_s['bbox'][3] - 1.5:
                res.append(f'_{{{text}}}')
            else:
                res.append(text)
        else:
            res.append(text)
    return ''.join(res)

def extract_page_figures(page, pno, rendered_figs):
    """检测页面上的 Figures 并裁切保存为高清 PNG。返回该页的 figure 范围列表与图表插入点。"""
    d = page.get_text('dict')
    page_figs = []
    
    # 寻找 Figure Caption (Bold 字体，Figure X.Y 开头，左侧靠边)
    for b_idx, b in enumerate(d['blocks']):
        if 'lines' not in b: continue
        for l in b['lines']:
            line_str = ''.join(s['text'] for s in l['spans']).strip()
            if l['spans'] and 'Bold' in l['spans'][0]['font']:
                m = re.match(r'^(Figure\s+(\d+\.\d+))(?:\s+(.*))?$', line_str)
                if m and l['spans'][0]['bbox'][0] <= 76:
                    fig_num = m.group(2)
                    caption = line_str
                    y_top = l['bbox'][1]
                    
                    # 确定 figure 的底部
                    # 寻找下一个横跨版面 (x0 <= 75 and x1 >= 500) 的正文 block
                    y_bottom = None
                    for next_b in d['blocks'][b_idx+1:]:
                        if next_b['bbox'][0] <= 75 and next_b['bbox'][2] >= 500 and next_b['bbox'][1] > y_top + 30:
                            y_bottom = next_b['bbox'][1] - 8
                            break
                    if not y_bottom:
                        # 如果没有找到下一个正文 block，通常是半页图或全页图
                        # 查找该 block 之后的最高元素或直到页脚
                        last_y = y_top + 150
                        for next_b in d['blocks'][b_idx+1:]:
                            if next_b['bbox'][3] < 700:
                                last_y = max(last_y, next_b['bbox'][3])
                        y_bottom = min(695, last_y + 15)
                    
                    clip_rect = fitz.Rect(68, max(55, y_top - 6), 544, y_bottom)
                    img_name = f"fig_{fig_num.replace('.', '_')}.png"
                    img_path = os.path.join(IMAGES_DIR, img_name)
                    
                    if img_name not in rendered_figs:
                        pix = page.get_pixmap(dpi=200, clip=clip_rect)
                        pix.save(img_path)
                        rendered_figs.add(img_name)
                    
                    page_figs.append({
                        'num': fig_num,
                        'caption': caption,
                        'img_name': img_name,
                        'y_top': y_top - 8,
                        'y_bottom': y_bottom + 4
                    })
    return page_figs

def parse_section_content(doc, start_page, end_page, sec_title, sec_slug, rendered_figs):
    """解析并组装指定章节范围的内容。"""
    md_chunks = []
    
    # 获取该节开头的编号（如果是 X.Y）
    m_head = re.match(r'^(\d+\.\d+)\s*(.*)$', sec_title)
    if m_head:
        h_num, h_name = m_head.groups()
        md_chunks.append(f"## {h_num} {h_name}\n")
    elif sec_title != 'Preface':
        md_chunks.append(f"## {sec_title}\n")

    for p in range(start_page - 1, end_page):
        page = doc[p]
        page_figs = extract_page_figures(page, p + 1, rendered_figs)
        
        # 页面中的 blocks
        d = page.get_text('dict')
        
        # 将已裁切的 figures 插入到页面顶端或合适位置
        for fig in page_figs:
            md_chunks.append(f"\n\n![{fig['caption']}](images/{fig['img_name']})\n\n")
            
        page_blocks = []
        for b in d['blocks']:
            if 'lines' not in b: continue
            
            b_y0 = b['bbox'][1]
            b_y1 = b['bbox'][3]
            
            # 1. 过滤页眉（y < 55）与页脚页码（y > 700 且文本仅包含页码）
            if b_y1 < 58:
                continue
            if b_y0 > 700:
                b_text = ''.join(''.join(s['text'] for s in l['spans']) for l in b['lines']).strip()
                if b_text.isdigit():
                    continue
                    
            # 2. 过滤掉属于已裁切 Figure 内部的文本，避免散乱标签污染正文
            in_figure = False
            for fig in page_figs:
                if fig['y_top'] <= b_y0 and b_y1 <= fig['y_bottom'] + 10:
                    in_figure = True
                    break
            if in_figure:
                continue
                
            # 3. 过滤当前节标题本身（如果是页面前几个 block 且与节标题相同）
            first_line = ''.join(s['text'] for s in b['lines'][0]['spans']).strip()
            if m_head and (first_line == m_head.group(1) or first_line == m_head.group(2) or first_line == sec_title):
                continue
            if first_line == 'Preface' or first_line == 'Exercises' or first_line.startswith('Chapter '):
                continue

            # 4. 组装 block 内部的行
            block_lines = []
            for l in b['lines']:
                line_str = spans_to_line(l['spans'])
                if line_str.strip():
                    block_lines.append(line_str)
            if block_lines:
                block_text = '\n'.join(block_lines)
                page_blocks.append((b['bbox'], block_text, b['lines']))
                
        # 将 page_blocks 转换为 Markdown 段落
        for bbox, text, lines in page_blocks:
            # 检查是否为小标题 (Subsection / H3)
            first_span = lines[0]['spans'][0] if (lines and lines[0]['spans']) else None
            is_bold = first_span and 'Bold' in first_span['font']
            first_line_clean = lines[0]['spans'][0]['text'].strip() if first_span else ''
            
            # 还原连字符
            dehyphen = re.sub(r'(\b[a-zA-Z]+)-\n([a-zA-Z]+\b)', r'\1\2', text)
            clean_p = ' '.join(line.strip() for line in dehyphen.split('\n') if line.strip())
            
            # 检查是否为习题开始 (e.g. "0.1. In each of the following...")
            m_ex = re.match(r'^(\d+\.\d+)\.\s+(.*)$', clean_p)
            if m_ex and 'exercises' in sec_slug:
                ex_num = m_ex.group(1)
                ex_body = m_ex.group(2)
                md_chunks.append(f"\n<Exercise title=\"Exercise {ex_num}\">\n\n{ex_body}\n\n</Exercise>\n")
                continue
                
            # 检查是否为加粗子小标题
            if is_bold and first_span['size'] >= 11 and len(clean_p) < 60 and not clean_p.endswith('.'):
                md_chunks.append(f"\n### {clean_p}\n")
            elif clean_p:
                md_chunks.append(f"\n{clean_p}\n")
                
    full_body = '\n'.join(md_chunks)
    
    # 清理多余空行
    full_body = re.sub(r'\n{3,}', '\n\n', full_body)
    # MDX 安全转义
    sanitized_body = sanitize_mdx(full_body)
    
    return IMPORTS_HEADER.format(title=sec_title) + sanitized_body

def main():
    print("🚀 启动《Algorithms》(DPV) 高清学术导入流水线...")
    os.makedirs(OUT_DIR, exist_ok=True)
    os.makedirs(IMAGES_DIR, exist_ok=True)
    
    doc = fitz.open(PDF_PATH)
    print(f"📖 成功打开 PDF: {PDF_PATH} (共 {len(doc)} 页)")
    
    rendered_figs = set()
    total_sections = len(SECTIONS_DEF)
    
    for idx, (slug, title, start_p, end_p) in enumerate(SECTIONS_DEF):
        out_filename = f"{slug}.mdx"
        out_path = os.path.join(OUT_DIR, out_filename)
        
        content = parse_section_content(doc, start_p, end_p, title, slug, rendered_figs)
        
        with open(out_path, 'w', encoding='utf-8') as f:
            f.write(content)
            
        print(f"  [{idx+1:02d}/{total_sections:02d}] 生成 {out_filename} (P.{start_p} - P.{end_p})")
        
    print(f"\n✅ 69 个章节 MDX 文件全部生成就绪！")
    print(f"🖼️ 实体化矢量插图资产: 共生成 {len(rendered_figs)} 幅高清插图于 images/\n")

if __name__ == '__main__':
    main()
