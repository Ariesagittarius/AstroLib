# -*- coding: utf-8 -*-
"""
MDX 章节习题页面生成器模块 (MDX Generator)
基于提取的真题数据库，为《工科数学分析基础》等教材自动生成高质量的课后真题精选 MDX 页面。
严格遵守 Astro MDX 语法规范与 KaTeX 转义要求。
"""

import os
import json
from typing import List, Dict, Any
from .models import QuestionItem
from .formula_reconstructor import escape_for_mdx


CHAPTER_FILENAMES = {
    1: "1.6_第1章名校期中与期末真题精选.mdx",
    2: "2.7_第2章名校期中与期末真题精选.mdx",
    3: "3.6_第3章名校期中与期末真题精选.mdx",
    4: "4.4_第4章名校期中与期末真题精选.mdx",
    5: "5.8_第5章名校期中与期末真题精选.mdx",
    6: "6.9_第6章名校期中与期末真题精选.mdx",
    7: "7.5_第7章名校期中与期末真题精选.mdx"
}

CHAPTER_NAMES = {
    1: "第1章 极限与连续",
    2: "第2章 一元函数微分学",
    3: "第3章 一元函数积分学",
    4: "第4章 常微分方程",
    5: "第5章 多元函数微分学",
    6: "第6章 多元函数积分学",
    7: "第7章 无穷级数"
}


class ChapterMDXGenerator:
    """章节 MDX 生成器"""

    def __init__(self, output_dir: str):
        self.output_dir = output_dir

    def generate_chapter_pages(self, questions_by_chapter: Dict[int, List[QuestionItem]], max_per_chapter: int = 15):
        """为每个章节挑选代表性题目并生成 MDX 文件。"""
        os.makedirs(self.output_dir, exist_ok=True)

        for ch_id in range(1, 8):
            q_list = questions_by_chapter.get(ch_id, [])
            if not q_list:
                continue

            # 按题型分组精选：选择题 4 道、填空题 4 道、计算/证明题 4 道
            curated = self._curate_questions(q_list, max_per_chapter)
            mdx_content = self._build_mdx_content(ch_id, curated)

            fname = CHAPTER_FILENAMES[ch_id]
            fpath = os.path.join(self.output_dir, fname)

            with open(fpath, "w", encoding="utf-8") as f:
                f.write(mdx_content)
            
            print(f"Generated chapter MDX: {fpath} ({len(curated)} curated questions)")

    def _curate_questions(self, q_list: List[QuestionItem], max_total: int) -> List[QuestionItem]:
        """挑选题干完整、带有答案、覆盖不同题型的代表性题目。"""
        choices = [q for q in q_list if q.meta.type == "choice" and q.content.options and q.solution.answer]
        blanks = [q for q in q_list if q.meta.type == "blank" and q.solution.answer and len(q.content.stem) > 10]
        calcs = [q for q in q_list if q.meta.type in ["calc", "proof"] and q.solution.answer and len(q.content.stem) > 15]

        curated = []
        # 按比例抽取：4道单选、4道填空、4道大题
        curated.extend(choices[:4])
        curated.extend(blanks[:4])
        curated.extend(calcs[:4])

        # 如果不足，补充剩余优质题目
        if len(curated) < max_total:
            remaining = [q for q in q_list if q not in curated and q.solution.answer]
            curated.extend(remaining[:max_total - len(curated)])

        return curated

    def _build_mdx_content(self, ch_id: int, questions: List[QuestionItem]) -> str:
        """构建 MDX 文本内容。"""
        ch_title = CHAPTER_NAMES[ch_id]
        
        mdx_lines = [
            "---",
            f"title: '{ch_title}'",
            "---",
            "",
            "import ChapterQuiz from '@/components/ChapterQuiz.astro';",
            "import Exercise from '@/components/Exercise.astro';",
            "import Solution from '@/components/Solution.astro';",
            "import Note from '@/components/Note.astro';",
            "",
            "<Note title=\"真题自测与训练说明\">",
            f"本节题目精选自《大邮数学集》（北京邮电大学历年《工科数学分析》《数学分析》《高等数学》期中与期末考试真题），全面覆盖{ch_title}的核心考点与典型题型。上方真题自测组件支持单选与填空即时判定对错与核对答案；下方提供精选经典大题与详细推导解答。",
            "</Note>",
            "",
            f'<ChapterQuiz chapter={{{ch_id}}} title="{ch_title} 核心真题即时自测" />',
            ""
        ]

        # 按题型组织小节
        choice_qs = [q for q in questions if q.meta.type == "choice"]
        blank_qs = [q for q in questions if q.meta.type == "blank"]
        calc_qs = [q for q in questions if q.meta.type not in ["choice", "blank"]]

        if choice_qs:
            mdx_lines.append("## 一、单项选择题真题精解")
            mdx_lines.append("")
            for i, q in enumerate(choice_qs, 1):
                mdx_lines.append(self._render_question_block(i, q))

        if blank_qs:
            mdx_lines.append("## 二、填空题真题精解")
            mdx_lines.append("")
            for i, q in enumerate(blank_qs, 1):
                mdx_lines.append(self._render_question_block(i, q))

        if calc_qs:
            mdx_lines.append("## 三、计算与证明综合真题精解")
            mdx_lines.append("")
            for i, q in enumerate(calc_qs, 1):
                mdx_lines.append(self._render_question_block(i, q))

        return "\n".join(mdx_lines)

    def _render_question_block(self, display_idx: int, q: QuestionItem) -> str:
        """渲染单道题目的 <Exercise> 与 <Solution> 卡片。"""
        src = q.source
        year = src.get("academic_year", "")
        cat = src.get("category", "")
        ptype = src.get("paper_type", "")
        score_str = f" ({int(q.meta.score)}分)" if q.meta.score else ""

        title = f"真题 {display_idx} · [{cat}] {year} {ptype}{score_str}"
        clean_stem = escape_for_mdx(q.content.stem)

        lines = [
            f'<Exercise title="{title}">',
            clean_stem,
            ""
        ]

        # 渲染选项
        if q.content.options:
            for opt in q.content.options:
                opt_text = escape_for_mdx(opt.text)
                lines.append(f"- **{opt.key}.** {opt_text}")
            lines.append("")

        # 渲染大题子问
        if q.content.sub_questions:
            for sub in q.content.sub_questions:
                sub_stem = escape_for_mdx(sub.stem)
                lines.append(f"- **{sub.sub_id}** {sub_stem}")
            lines.append("")

        # 渲染解答与解析
        clean_ans = escape_for_mdx(q.solution.answer)
        clean_hints = escape_for_mdx(q.solution.hints) if q.solution.hints else ""

        lines.append('<Solution title="查看参考答案与提示">')
        if clean_ans:
            lines.append(f"**【参考答案】** {clean_ans}")
            lines.append("")
        if clean_hints:
            lines.append(f"**【思路提示】** {clean_hints}")
            lines.append("")
        
        # 知识点标注
        mapping = q.mapping.get("engineering_analysis")
        if mapping and mapping.knowledge_points:
            kws = "、".join(mapping.knowledge_points)
            lines.append(f"> **考察考点**：{kws}（对应小节：`{mapping.section_slug}`）")
        
        lines.append("</Solution>")
        lines.append("</Exercise>")
        lines.append("")

        return "\n".join(lines)
