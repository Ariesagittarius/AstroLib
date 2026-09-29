#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Algorithms (Sanjoy Dasgupta, Christos Papadimitriou, Umesh Vazirani - DPV)
MinerU 高清学术蓝本全量导入流水线

输入:
  - task/Algorithms...pdf-71c8de5e-621e-4041-bc10-6311c06725da/ (Part 1: 前200页)
  - task/Algorithms...pdf-cc456af1-ce91-4589-ad5d-787f55cab146/ (Part 2: 后118页)

输出:
  - src/content/docs/collections/cs/algorithms/*.mdx (69篇标准学术篇章)
  - src/content/docs/collections/cs/algorithms/images/* (550张高清切片)
"""

import os
import re
import sys
import shutil

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
TASK_P1 = os.path.join(
    PROJECT_ROOT, 'task',
    'Algorithms (Sanjoy Dasgupta, Christos H. Papadimitriou etc.) (z-library.sk, 1lib.sk, z-lib.sk).pdf-71c8de5e-621e-4041-bc10-6311c06725da'
)
TASK_P2 = os.path.join(
    PROJECT_ROOT, 'task',
    'Algorithms (Sanjoy Dasgupta, Christos H. Papadimitriou etc.) (z-library.sk, 1lib.sk, z-lib.sk).pdf-cc456af1-ce91-4589-ad5d-787f55cab146'
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

LIGATURE_MAP = {
    '\ufb00': 'ff',
    '\ufb01': 'fi',
    '\ufb02': 'fl',
    '\ufb03': 'ffi',
    '\ufb04': 'ffl',
}

BOX_TITLES = [
    'Bases and logs', "Two's complement", 'Is your social security number a prime?',
    'Hey, that was group theory!', 'Carmichael numbers', 'Randomized algorithms: a virtual chapter',
    'An application of number theory?', 'Binary search', 'An n log n lower bound for sorting',
    'The Unix sort command', 'Why multiply polynomials?', 'The slow spread of a fast algorithm',
    'How big is your graph?', 'Crawling fast', 'Which heap is best?', 'Trees',
    'A randomized algorithm for minimum cut', 'Entropy', 'Recursion? No, thanks',
    'Programming?', 'Common subproblems', 'Of mice and men', 'Memoization',
    'On time and memory', 'A magic trick called duality', 'Reductions',
    'Matrix-vector notation', 'Visualizing duality', 'Gaussian elimination',
    'Linear programming in polynomial time', 'The story of Sissa and Moore',
    'Why P and NP?', 'The two ways to use reductions', 'Unsolvable problems',
    'Entanglement', 'The Fourier transform of a periodic vector',
    'Setting up a periodic superposition', 'Quantum physics meets computation'
]

SECTIONS_SPECS = [
    ('00_preface.mdx', 'Preface', r'^##\s+Preface\b'),
    ('00.1_books-and-algorithms.mdx', '0.1 Books and algorithms', r'^#\s+Chapter 0\b'),
    ('00.2_enter-fibonacci.mdx', '0.2 Enter Fibonacci', r'^##\s+0\.2\s+Enter Fibonacci\b'),
    ('00.3_big-o-notation.mdx', '0.3 Big-O notation', r'^##\s+0\.3\s+Big-O notation\b'),
    ('00.4_exercises.mdx', 'Chapter 0 Exercises', r'^##\s+Exercises\b'),

    ('01.1_basic-arithmetic.mdx', '1.1 Basic arithmetic', r'^##\s+Chapter 1\b'),
    ('01.2_modular-arithmetic.mdx', '1.2 Modular arithmetic', r'^##\s+1\.2\s+Modular arithmetic\b'),
    ('01.3_primality-testing.mdx', '1.3 Primality testing', r'^##\s+1\.3\s+Primality testing\b'),
    ('01.4_cryptography.mdx', '1.4 Cryptography', r'^##\s+1\.4\s+Cryptography\b'),
    ('01.5_universal-hashing.mdx', '1.5 Universal hashing', r'^##\s+1\.5\s+Universal hashing\b'),
    ('01.6_exercises.mdx', 'Chapter 1 Exercises', r'^##\s+Exercises\b'),

    ('02.1_multiplication.mdx', '2.1 Multiplication', r'^##\s+Chapter 2\b'),
    ('02.2_recurrence-relations.mdx', '2.2 Recurrence relations', r'^##\s+2\.2\s+Recurrence relations\b'),
    ('02.3_mergesort.mdx', '2.3 Mergesort', r'^##\s+2\.3\s+Mergesort\b'),
    ('02.4_medians.mdx', '2.4 Medians', r'^##\s+2\.4\s+Medians\b'),
    ('02.5_matrix-multiplication.mdx', '2.5 Matrix multiplication', r'^##\s+2\.5\s+Matrix multiplication\b'),
    ('02.6_the-fast-fourier-transform.mdx', '2.6 The fast Fourier transform', r'^##\s+2\.6\s+The fast Fourier transform\b'),
    ('02.7_exercises.mdx', 'Chapter 2 Exercises', r'^##\s+Exercises\b'),

    ('03.1_why-graphs.mdx', '3.1 Why graphs?', r'^##\s+Chapter 3\b'),
    ('03.2_depth-first-search-in-undirected-graphs.mdx', '3.2 Depth-first search in undirected graphs', r'^##\s+3\.2\s+Depth-first search in undirected graphs\b'),
    ('03.3_depth-first-search-in-directed-graphs.mdx', '3.3 Depth-first search in directed graphs', r'^##\s+3\.3\s+Depth-first search in directed graphs\b'),
    ('03.4_strongly-connected-components.mdx', '3.4 Strongly connected components', r'^##\s+3\.4\s+Strongly connected components\b'),
    ('03.5_exercises.mdx', 'Chapter 3 Exercises', r'^##\s+Exercises\b'),

    ('04.1_distances.mdx', '4.1 Distances', r'^##\s+Chapter 4\b'),
    ('04.2_breadth-first-search.mdx', '4.2 Breadth-first search', r'^##\s+4\.2\s+Breadth-first search\b'),
    ('04.3_lengths-on-edges.mdx', '4.3 Lengths on edges', r'^##\s+4\.3\s+Lengths on edges\b'),
    ('04.4_dijkstras-algorithm.mdx', '4.4 Dijkstra’s algorithm', r'^##\s+4\.4\s+Dijkstra'),
    ('04.5_priority-queue-implementations.mdx', '4.5 Priority queue implementations', r'^##\s+4\.5\s+Priority queue implementations\b'),
    ('04.6_shortest-paths-in-the-presence-of-negative-edges.mdx', '4.6 Shortest paths in the presence of negative edges', r'^##\s+4\.6\s+Shortest paths in the presence of negative edges\b'),
    ('04.7_shortest-paths-in-dags.mdx', '4.7 Shortest paths in dags', r'^##\s+4\.7\s+Shortest paths in dags\b'),
    ('04.8_exercises.mdx', 'Chapter 4 Exercises', r'^##\s+Exercises\b'),

    ('05.1_minimum-spanning-trees.mdx', '5.1 Minimum spanning trees', r'^##\s+Chapter 5\b'),
    ('05.2_huffman-encoding.mdx', '5.2 Huffman encoding', r'^##\s+5\.2\s+Huffman encoding\b'),
    ('05.3_horn-formulas.mdx', '5.3 Horn formulas', r'^##\s+5\.3\s+Horn formulas\b'),
    ('05.4_set-cover.mdx', '5.4 Set cover', r'^##\s+5\.4\s+Set cover\b'),
    ('05.5_exercises.mdx', 'Chapter 5 Exercises', r'^##\s+Exercises\b'),

    ('06.1_shortest-paths-in-dags-revisited.mdx', '6.1 Shortest paths in dags, revisited', r'^##\s+Chapter 6\b'),
    ('06.2_longest-increasing-subsequences.mdx', '6.2 Longest increasing subsequences', r'^##\s+6\.2\s+Longest increasing subsequences\b'),
    ('06.3_edit-distance.mdx', '6.3 Edit distance', r'^##\s+6\.3\s+Edit distance\b'),
    ('06.4_knapsack.mdx', '6.4 Knapsack', r'^##\s+6\.4\s+Knapsack\b'),
    ('06.5_chain-matrix-multiplication.mdx', '6.5 Chain matrix multiplication', r'^##\s+6\.5\s+Chain matrix multiplication\b'),
    ('06.6_shortest-paths.mdx', '6.6 Shortest paths', r'^##\s+6\.6\s+Shortest paths\b'),
    ('06.7_independent-sets-in-trees.mdx', '6.7 Independent sets in trees', r'^##\s+6\.7\s+Independent sets in trees\b'),
    ('06.8_exercises.mdx', 'Chapter 6 Exercises', r'^##\s+Exercises\b'),

    ('07.1_an-introduction-to-linear-programming.mdx', '7.1 An introduction to linear programming', r'^#\s+Linear programming and reductions\b'),
    ('07.2_flows-in-networks.mdx', '7.2 Flows in networks', r'^##\s+7\.2\s+Flows in networks\b'),
    ('07.3_bipartite-matching.mdx', '7.3 Bipartite matching', r'^##\s+7\.3\s+Bipartite matching\b'),
    ('07.4_duality.mdx', '7.4 Duality', r'^##\s+7\.4\s+Duality\b'),
    ('07.5_zero-sum-games.mdx', '7.5 Zero-sum games', r'^##\s+7\.5\s+Zero-sum games\b'),
    ('07.6_the-simplex-algorithm.mdx', '7.6 The simplex algorithm', r'^##\s+7\.6\s+The simplex algorithm\b'),
    ('07.7_postscript-circuit-evaluation.mdx', '7.7 Postscript: circuit evaluation', r'^##\s+7\.7\s+Postscript: circuit evaluation\b'),
    ('07.8_exercises.mdx', 'Chapter 7 Exercises', r'^##\s+Exercises\b'),

    ('08.1_search-problems.mdx', '8.1 Search problems', r'^#\s+NP-complete problems\b'),
    ('08.2_np-complete-problems.mdx', '8.2 NP-complete problems', r'^##\s+8\.2\s+NP-complete problems\b'),
    ('08.3_the-reductions.mdx', '8.3 The reductions', r'^##\s+8\.3\s+The reductions\b'),
    ('08.4_exercises.mdx', 'Chapter 8 Exercises', r'^##\s+Exercises\b'),

    ('09.1_intelligent-exhaustive-search.mdx', '9.1 Intelligent exhaustive search', r'^##\s+Chapter 9\b'),
    ('09.2_approximation-algorithms.mdx', '9.2 Approximation algorithms', r'^##\s+9\.2\s+Approximation algorithms\b'),
    ('09.3_local-search-heuristics.mdx', '9.3 Local search heuristics', r'^##\s+9\.3\s+Local search heuristics\b'),
    ('09.4_exercises.mdx', 'Chapter 9 Exercises', r'^##\s+Exercises\b'),

    ('10.1_qubits-superposition-and-measurement.mdx', '10.1 Qubits, superposition, and measurement', r'^##\s+Chapter 10\b'),
    ('10.2_the-plan.mdx', '10.2 The plan', r'^##\s+10\.2\s+The plan\b'),
    ('10.3_the-quantum-fourier-transform.mdx', '10.3 The quantum Fourier transform', r'^##\s+10\.3\s+The quantum Fourier transform\b'),
    ('10.4_periodicity.mdx', '10.4 Periodicity', r'^##\s+10\.4\s+Periodicity\b'),
    ('10.5_quantum-circuits.mdx', '10.5 Quantum circuits', r'^##\s+10\.5\s+Quantum circuits\b'),
    ('10.6_factoring-as-periodicity.mdx', '10.6 Factoring as periodicity', r'^##\s+10\.6\s+Factoring as periodicity\b'),
    ('10.7_the-quantum-algorithm-for-factoring.mdx', '10.7 The quantum algorithm for factoring', r'^##\s+10\.7\s+The quantum algorithm for factoring\b'),
    ('10.8_exercises.mdx', 'Chapter 10 Exercises', r'^##\s+Exercises\b'),

    ('11.1_historical-notes-and-further-reading.mdx', 'Historical notes and further reading', r'^#\s+Historical notes and further reading\b'),
]

def clean_math(math_str: str) -> str:
    """清理 KaTeX 不支持的 HTML 实体与异常宏。"""
    s = math_str
    # 逆转义 HTML 实体为数学符号
    s = s.replace('&lt;', '<').replace('&gt;', '>').replace('&amp;', '&')
    # 修复非标宏 \nequiv -> \not\equiv
    s = re.sub(r'\\nequiv\b', r'\\not\\equiv', s)
    # 修复 \text{... y_{i} ...} 在文本模式下的下标错误
    s = s.replace(
        r"\text {there is a setting of the y_{i} 's for which}",
        r"\text {there is a setting of the } y_i \text{ 's for which}"
    )
    return s

def sanitize_mdx(text: str) -> str:
    """保证文本不会破坏 MDX / JSX 编译。精确保护公式与代码块。"""
    protected = []
    def protect(m):
        idx = len(protected)
        protected.append(m.group(0))
        return f"___PROTECTED_{idx}___"

    # 1. 保护代码块
    t = re.sub(r'```[\s\S]*?```', protect, text)

    # 2. 保护行间公式
    def protect_display_math(m):
        math_s = clean_math(m.group(0))
        idx = len(protected)
        protected.append(math_s)
        return f"___PROTECTED_{idx}___"
    t = re.sub(r'\$\$[\s\S]*?\$\$', protect_display_math, t)

    # 3. 保护行内公式 (使用负向后顾保证不匹配 \$ 货币符号)
    def protect_inline_math(m):
        math_s = clean_math(m.group(0))
        idx = len(protected)
        protected.append(math_s)
        return f"___PROTECTED_{idx}___"
    t = re.sub(r'(?<!\\)\$([^\$\n]+?)(?<!\\)\$', protect_inline_math, t)

    # 4. 保护合法的 AstroLib 标签与标准 HTML 标签
    t = re.sub(
        r'</?(?:Exercise|Knowledge|Example|Analysis|Solution|Variant|Note|Block|Method|Guide|img|sup|sub|table|thead|tbody|tfoot|tr|td|th|p|b|i|strong|em|code|pre|div|a|span|h1|h2|h3|h4|h5|h6)(?:\s+[^>\n]*)?/?>',
        protect,
        t
    )

    # 5. 转义正文中裸 < 为 &lt;
    t = t.replace('<', '&lt;')
    # 6. 转义正文中花括号（防止被当作 JSX 表达式）
    t = t.replace('{', '&#123;').replace('}', '&#125;')
    # 7. 转义正文中波浪号（表格内防止被误判删除线）
    t = t.replace('~', '～')

    # 8. 还原受保护内容
    for idx, orig in enumerate(protected):
        t = t.replace(f"___PROTECTED_{idx}___", orig)

    return t

def clean_ocr_artifacts(text: str) -> str:
    """清理 MinerU 文本中的 OCR 误判标号与字符。"""
    # 规范化连字
    for k, v in LIGATURE_MAP.items():
        text = text.replace(k, v)

    # 清理字符 descender 被误判为 <sub>
    text = re.sub(r'<sub>([a-zA-Z\s,.\(\)]+)</sub>', r'\1', text)
    # 清理非数字的 <sup>
    text = re.sub(r'<sup>([a-zA-Z\s,.\(\)]{2,})</sup>', r'\1', text)

    # 规范化引号
    text = text.replace('\x92', "'").replace('\x91', "'")
    text = text.replace('’', "'").replace('‘', "'")

    # 转换原生 HTML <img> 标签为 Markdown 格式，符合 Astro 打包规范
    text = re.sub(r'<img\b[^>]*src=["\'](images/[^"\']+)["\'][^>]*>', r'![](\1)', text)
    text = re.sub(r'<img\b[^>]*src=["\']([^"\']+)["\'][^>]*>', r'![](\1)', text)

    # 移除 mineru-algorithm 上的 inline style（由全局 CSS .mineru-algorithm 控制，防止 JSX 报错）
    text = re.sub(
        r'<div class="mineru-algorithm"[^>]*>',
        r'<div class="mineru-algorithm">',
        text
    )

    # 修复 03.1 中边框引用处的 OCR 乱码公式
    text = re.sub(
        r'shares a border with \$y\s*\.\s*\\overset\s*\{[^\$]+\}\$',
        r'shares a border with $y$.”',
        text
    )

    # 转换被包裹为表格的 Trees Box
    def replace_trees_table(m):
        content = m.group(0)
        if '<td>Trees</td>' in content or '<td>Trees </td>' in content:
            tds = re.findall(r'<td[^>]*>([\s\S]*?)</td>', content)
            inner = '\n\n'.join(tds[1:]).strip()
            return f'<Knowledge title="Box: Trees">\n\n{inner}\n\n</Knowledge>'
        return content

    text = re.sub(r'<table[\s\S]*?</table>', replace_trees_table, text)

    return text

def process_exercise_section(sec_content: str, ch_title: str) -> str:
    """将课后习题切分并完整封装入 <Exercise title="Exercise X.Y"> 卡片。"""
    # 寻找 exercises 开头
    m_head = re.search(r'^##\s+Exercises\b', sec_content, re.MULTILINE)
    preamble = ""
    rest = sec_content
    if m_head:
        preamble = f"## {ch_title}\n\n"
        rest = sec_content[m_head.end():].strip()

    # 切分习题条目: 匹配行首数字编号如 0.1. 或 ## 7.12.
    # 使用正则匹配所有题目的起始位置
    ex_pattern = re.compile(r'^(?:#{0,6}\s*)?(\d+\.\d+)\.?\s+(.*)$', re.MULTILINE)
    matches = list(ex_pattern.finditer(rest))
    if not matches:
        return preamble + rest

    out_chunks = []
    # 题目前可能存在的说明性引言
    first_start = matches[0].start()
    if first_start > 0:
        intro_text = rest[:first_start].strip()
        if intro_text:
            out_chunks.append(intro_text + "\n\n")

    for i, m in enumerate(matches):
        ex_num = m.group(1)
        start_pos = m.start()
        end_pos = matches[i + 1].start() if i + 1 < len(matches) else len(rest)
        chunk = rest[start_pos:end_pos].strip()

        # 去除题号前缀，获取题干
        # 匹配第一行并提取内容
        first_line_end = chunk.find('\n')
        if first_line_end != -1:
            first_line = chunk[:first_line_end]
            remaining = chunk[first_line_end+1:].strip()
            m_first = ex_pattern.match(first_line)
            first_body = m_first.group(2) if m_first else first_line
            body = (first_body + "\n\n" + remaining).strip() if remaining else first_body.strip()
        else:
            m_first = ex_pattern.match(chunk)
            body = m_first.group(2).strip() if m_first else chunk

        # 封装为 Exercise 卡片
        card = f'<Exercise title="Exercise {ex_num}">\n\n{body}\n\n</Exercise>\n'
        out_chunks.append(card)

    return preamble + "\n".join(out_chunks)

def process_regular_section(sec_content: str, sec_num_title: str) -> str:
    """处理常规小节：章节引言格式化、Box 卡片化、定理与引理卡片化。"""
    c = sec_content

    # 1. 规范化主小节标题与章级引言
    c = re.sub(r'^#\s+Chapter 0\s*\n+#\s+Prologue', '## Prologue', c, flags=re.MULTILINE)
    c = re.sub(r'^##\s+Chapter 1\s*\n+#\s+Algorithms with numbers', '## Chapter 1: Algorithms with numbers', c, flags=re.MULTILINE)
    c = re.sub(r'^##\s+Chapter 2\s*\n+#\s+Divide-and-conquer algorithms', '## Chapter 2: Divide-and-conquer algorithms', c, flags=re.MULTILINE)
    c = re.sub(r'^##\s+Chapter 3\s*\n+#\s+Decompositions of graphs', '## Chapter 3: Decompositions of graphs', c, flags=re.MULTILINE)
    c = re.sub(r'^##\s+Chapter 4\s*\n+##\s+Paths in graphs', '## Chapter 4: Paths in graphs', c, flags=re.MULTILINE)
    c = re.sub(r'^##\s+Chapter 5\s*\n+##\s+Greedy algorithms', '## Chapter 5: Greedy algorithms', c, flags=re.MULTILINE)
    c = re.sub(r'^##\s+Chapter 6\s*\n+##\s+Dynamic programming', '## Chapter 6: Dynamic programming', c, flags=re.MULTILINE)
    c = re.sub(r'^#\s+Linear programming and reductions', '## Chapter 7: Linear programming and reductions', c, flags=re.MULTILINE)
    c = re.sub(r'^#\s+NP-complete problems', '## Chapter 8: NP-complete problems', c, flags=re.MULTILINE)
    c = re.sub(r'^##\s+Chapter 9\s*\n+#\s+Coping with NP-completeness', '## Chapter 9: Coping with NP-completeness', c, flags=re.MULTILINE)
    c = re.sub(r'^##\s+Chapter 10\s*\n+##\s+Quantum algorithms', '## Chapter 10: Quantum algorithms', c, flags=re.MULTILINE)

    # 2. 识别并包装 Box
    # 特殊处理 Bases and logs（其在 1.1.1 节中作为插页打断了正文加法句子）
    if '## Bases and logs' in c:
        m_box = re.search(r'##\s+Bases and logs\b([\s\S]*?)(5\.\s+It is even the sum[^\n]+)', c)
        if m_box:
            box_content = m_box.group(1).strip() + "\n\n" + m_box.group(2).strip()
            box_card = f'<Knowledge title="Box: Bases and logs">\n\n{box_content}\n\n</Knowledge>'
            # 移除原处插入的 Box 文本，使得前后正文自然衔接
            c = c[:m_box.start()].rstrip() + "\n\n" + c[m_box.end():].lstrip()
            # 插入到 1.1.2 节开始之前
            m_next_sec = re.search(r'(?=##\s+1\.1\.2\b)', c)
            if m_next_sec:
                c = c[:m_next_sec.start()] + box_card + "\n\n" + c[m_next_sec.start():]
            else:
                c = c + "\n\n" + box_card

    for box in BOX_TITLES:
        if box == 'Bases and logs':
            continue
        pat = rf'^(##\s+{re.escape(box)}\b[^\n]*)'
        m = re.search(pat, c, re.MULTILINE | re.IGNORECASE)
        if m:
            box_header = m.group(1)
            start_idx = m.start()
            # 寻找下一个 ## 标题
            next_h = re.search(r'\n(?=##\s+)', c[m.end():])
            if next_h:
                end_idx = m.end() + next_h.start()
            else:
                end_idx = len(c)
            box_body = c[m.end():end_idx].strip()
            clean_box = f'<Knowledge title="Box: {box}">\n\n{box_body}\n\n</Knowledge>'
            c = c[:start_idx] + clean_box + c[end_idx:]

    # 3. 识别并包装 Lemma / Property / Theorem
    def replace_lemma_property(m):
        kind = m.group(1)
        rest = m.group(2).strip()
        return f'<Knowledge title="{kind}">\n\n{rest}\n\n</Knowledge>'

    # 匹配独立的 Lemma / Property 段落（行首以 Lemma / Property 开头）
    c = re.sub(
        r'^(Lemma|Property|Theorem)\s+([^\n]+(?:\n(?!\n|[#<]|Proof\b)[^\n]+)*)',
        replace_lemma_property,
        c,
        flags=re.MULTILINE
    )

    # 4. 识别并包装 Proof
    def replace_proof(m):
        body = m.group(1).strip()
        return f'<Solution title="Proof">\n\n{body}\n\n</Solution>'

    c = re.sub(
        r'^Proof\.\s+([^\n]+(?:\n(?!\n|[#<]|Lemma\b|Property\b|Theorem\b)[^\n]+)*)',
        replace_proof,
        c,
        flags=re.MULTILINE
    )

    return c

def main():
    print("=== Step 1: Synchronizing images from Part 1 and Part 2 ===")
    os.makedirs(IMAGES_DIR, exist_ok=True)
    # 清理旧图片
    for f in os.listdir(IMAGES_DIR):
        fp = os.path.join(IMAGES_DIR, f)
        if os.path.isfile(fp):
            os.remove(fp)

    copied = 0
    p1_img_dir = os.path.join(TASK_P1, 'images')
    if os.path.isdir(p1_img_dir):
        for f in os.listdir(p1_img_dir):
            shutil.copy2(os.path.join(p1_img_dir, f), os.path.join(IMAGES_DIR, f))
            copied += 1

    p2_img_dir = os.path.join(TASK_P2, 'images')
    if os.path.isdir(p2_img_dir):
        for f in os.listdir(p2_img_dir):
            shutil.copy2(os.path.join(p2_img_dir, f), os.path.join(IMAGES_DIR, f))
            copied += 1

    print(f"Copied {copied} images to {IMAGES_DIR}")

    print("\n=== Step 2: Reading and concatenating full.md blueprints ===")
    with open(os.path.join(TASK_P1, 'full.md'), 'r', encoding='utf-8') as f:
        t1 = f.read()
    with open(os.path.join(TASK_P2, 'full.md'), 'r', encoding='utf-8') as f:
        t2 = f.read()

    combined = clean_ocr_artifacts(t1 + '\n\n' + t2)
    print(f"Combined blueprint text: {len(combined)} chars, {len(combined.splitlines())} lines")

    print("\n=== Step 3: Locating 69 standard sections ===")
    curr_pos = 0
    section_ranges = []
    for fname, title, pat in SECTIONS_SPECS:
        match = re.search(pat, combined[curr_pos:], re.MULTILINE)
        if not match:
            print(f"FATAL: Section pattern not matched: {fname} -> {pat}")
            sys.exit(1)
        abs_pos = curr_pos + match.start()
        section_ranges.append((fname, title, abs_pos))
        curr_pos = abs_pos + len(match.group(0))

    # 确定历史注记截止点（忽略纸质书静态页码 Index）
    hist_pos = section_ranges[-1][2]
    idx_m = re.search(r'^##\s+Index\b', combined[hist_pos:], re.MULTILINE)
    total_bound = hist_pos + idx_m.start() if idx_m else len(combined)

    print(f"All {len(section_ranges)} sections successfully mapped!")

    print("\n=== Step 4: Generating and sanitizing MDX files ===")
    os.makedirs(OUT_DIR, exist_ok=True)
    # 删除旧的 MDX 文件
    for f in os.listdir(OUT_DIR):
        if f.endswith('.mdx'):
            os.remove(os.path.join(OUT_DIR, f))

    for i in range(len(section_ranges)):
        fname, title, start_pos = section_ranges[i]
        end_pos = section_ranges[i + 1][2] if i + 1 < len(section_ranges) else total_bound
        raw_content = combined[start_pos:end_pos].strip()

        # 根据篇章类型执行结构增强
        if fname.endswith('_exercises.mdx'):
            processed_content = process_exercise_section(raw_content, title)
        elif fname == '00_preface.mdx':
            # 移除开头的 ## Preface
            processed_content = re.sub(r'^##\s+Preface\s*', '', raw_content).strip()
        elif fname.startswith('11.1_'):
            # 移除开头的 # Historical notes and further reading
            processed_content = re.sub(r'^#\s+Historical notes and further reading\s*', '## Historical notes and further reading\n\n', raw_content).strip()
        else:
            processed_content = process_regular_section(raw_content, title)

        # 执行严格的 MDX 数学感知字符转义
        final_body = sanitize_mdx(processed_content)

        # 写入目标文件
        file_content = IMPORTS_HEADER.format(title=title) + final_body + "\n"
        out_path = os.path.join(OUT_DIR, fname)
        with open(out_path, 'w', encoding='utf-8') as out_f:
            out_f.write(file_content)

    print(f"Successfully generated all {len(section_ranges)} MDX files in {OUT_DIR}!")

if __name__ == '__main__':
    main()
