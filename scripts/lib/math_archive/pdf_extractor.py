"""
PDF 试卷解析与题目/答案提取流水线模块
基于 PyMuPDF，结合版面分析、大题与小题切分、选项解析与答案智能对齐。
"""

import re
from typing import List, Dict, Tuple, Optional, Any
import pymupdf

from .models import (
    PaperItem,
    QuestionItem,
    QuestionMeta,
    QuestionContent,
    QuestionSolution,
    OptionItem,
    SubQuestionItem
)
from .unicode_normalizer import normalize_math_unicode, clean_ocr_artifacts
from .formula_reconstructor import wrap_math_formulas, format_latex_expression
from .curriculum_mapper import CurriculumClassifier

ROMAN_NUMS = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二']
ROMAN_TO_INT = {r: i + 1 for i, r in enumerate(ROMAN_NUMS)}

class BUPTMathExtractor:
    """大邮数学集 PDF 提取与解析引擎"""

    def __init__(self, pdf_path: str):
        self.pdf_path = pdf_path
        self.doc = pymupdf.open(pdf_path)
        self.classifier = CurriculumClassifier()

    def get_all_papers_meta(self) -> List[Dict[str, Any]]:
        """从目录 (TOC) 中解析出所有 173 套试卷的基本元数据与页码起止范围。"""
        toc = self.doc.get_toc()
        paper_items = []

        paper_pattern = re.compile(r'^(\d+)\s*\[(.*?)\]\s*(.*)$')

        for i, item in enumerate(toc):
            level, title, page = item
            m = paper_pattern.match(title)
            if not m:
                continue

            p_id = int(m.group(1))
            cat = m.group(2).split('] [')[0].strip()
            rest = m.group(3).strip()

            p_start = page - 1

            p_end = len(self.doc)
            for next_item in toc[i+1:]:
                if next_item[2] > page:
                    p_end = next_item[2] - 1
                    break

            year_match = re.search(r'(\d{4}[–\-]\d{4}|\d{2}[–\-]\d{2}|\d{4})', rest)
            academic_year = year_match.group(1) if year_match else "未知学年"

            term = 1
            if "第二学期" in rest or "春" in rest or "下" in cat:
                term = 2

            exam_type = "final"
            if "期中" in rest or "期中" in cat:
                exam_type = "midterm"
            elif "缓考" in rest or "补考" in rest:
                exam_type = "resit"

            paper_type = "综合"
            if "A 卷" in rest or "A卷" in rest or "（A）" in rest:
                paper_type = "A卷"
            elif "B 卷" in rest or "B卷" in rest or "（B）" in rest:
                paper_type = "B卷"

            course_name = "工科数学分析"
            if "工科数学分析" in rest or "工数分" in rest:
                course_name = "工科数学分析"
            elif "数学分析" in rest or "数分" in rest:
                course_name = "数学分析"
            elif "高等数学" in rest or "高数" in rest:
                course_name = "高等数学"
            elif "线性代数" in rest or "线代" in rest:
                course_name = "线性代数"
            elif "高等代数" in rest or "高代" in rest:
                course_name = "高等代数"
            elif "概率" in rest:
                course_name = "概率论与数理统计"

            paper_meta = {
                "paper_id": p_id,
                "raw_title": title,
                "category": cat,
                "course_name": course_name,
                "academic_year": academic_year,
                "term": term,
                "exam_type": exam_type,
                "paper_type": paper_type,
                "page_start": p_start + 1,
                "page_end": p_end
            }
            paper_items.append(paper_meta)

        return paper_items

    def extract_paper(self, paper_meta: Dict[str, Any]) -> PaperItem:
        """提取并解析单套试卷的内容与题目。"""
        p_start = paper_meta["page_start"] - 1
        p_end = paper_meta["page_end"]

        raw_text = ""
        for p in range(p_start, min(p_end, len(self.doc))):
            raw_text += self.doc[p].get_text() + "\n"

        cleaned = normalize_math_unicode(clean_ocr_artifacts(raw_text))

        ans_split = re.split(r'\n(?:答案|参考答案)\s*\n', cleaned, maxsplit=1)
        q_body = ans_split[0]
        a_body = ans_split[1] if len(ans_split) > 1 else ""

        questions = self._parse_questions(paper_meta, q_body, a_body)

        paper = PaperItem(
            paper_id=paper_meta["paper_id"],
            raw_title=paper_meta["raw_title"],
            category=paper_meta["category"],
            course_name=paper_meta["course_name"],
            academic_year=paper_meta["academic_year"],
            term=paper_meta["term"],
            exam_type=paper_meta["exam_type"],
            paper_type=paper_meta["paper_type"],
            page_start=paper_meta["page_start"],
            page_end=paper_meta["page_end"],
            questions=questions
        )
        return paper

    def _parse_questions(self, paper_meta: Dict[str, Any], q_body: str, a_body: str) -> List[QuestionItem]:
        """解析题干文本并对齐答案。"""
        q_sections = self._split_by_roman_sections(q_body)
        a_sections = self._split_by_roman_sections(a_body)

        ans_dict = self._build_answer_index(a_sections)

        questions: List[QuestionItem] = []
        global_q_idx = 1

        for sec_title, sec_lines in q_sections:
            if not sec_lines or sec_title == "Header":
                continue

            m_roman = re.match(r'^([一二三四五六七八九十]+)', sec_title)
            roman_idx = ROMAN_TO_INT.get(m_roman.group(1), 1) if m_roman else 1

            sec_score_match = re.search(r'共\s*(\d+)\s*分|（\s*(\d+)\s*分\s*）', sec_title)
            default_score = float(sec_score_match.group(1) or sec_score_match.group(2)) if sec_score_match else None

            if "选择题" in sec_title:
                q_type = "choice"
                items = self._split_numbered_items(sec_lines)
                for item_num, item_lines in items:
                    stem, options = self._parse_choice_item(item_lines)
                    ans_val = ans_dict.get(roman_idx, {}).get(item_num, "")

                    q_item = self._create_question_item(
                        paper_meta=paper_meta,
                        global_idx=global_q_idx,
                        order_in_paper=item_num,
                        sec_type=sec_title,
                        q_type=q_type,
                        score=5.0,
                        stem=stem,
                        options=options,
                        answer=ans_val
                    )
                    questions.append(q_item)
                    global_q_idx += 1

            elif "填空题" in sec_title:
                q_type = "blank"
                items = self._split_numbered_items(sec_lines)
                for item_num, item_lines in items:
                    stem = " ".join(item_lines)
                    ans_val = ans_dict.get(roman_idx, {}).get(item_num, "")

                    q_item = self._create_question_item(
                        paper_meta=paper_meta,
                        global_idx=global_q_idx,
                        order_in_paper=item_num,
                        sec_type=sec_title,
                        q_type=q_type,
                        score=5.0,
                        stem=stem,
                        answer=ans_val
                    )
                    questions.append(q_item)
                    global_q_idx += 1

            else:

                q_type = "proof" if "证明" in sec_title else "calc"
                items = self._split_numbered_items(sec_lines)
                if len(items) > 1:
                    for item_num, item_lines in items:
                        stem, sub_qs = self._parse_subquestions(item_lines)
                        ans_val = ans_dict.get(roman_idx, {}).get(item_num, "")
                        q_item = self._create_question_item(
                            paper_meta=paper_meta,
                            global_idx=global_q_idx,
                            order_in_paper=item_num,
                            sec_type=sec_title,
                            q_type=q_type,
                            score=default_score,
                            stem=stem,
                            sub_questions=sub_qs,
                            answer=ans_val
                        )
                        questions.append(q_item)
                        global_q_idx += 1
                else:

                    full_content = sec_lines

                    title_clean = re.sub(r'^[一二三四五六七八九十]+[、. ]\s*(?:（\s*\d+\s*分\s*）|（\s*附加题\s*\d*\s*分\s*）)?\s*', '', sec_title).strip()
                    if title_clean:
                        full_content = [title_clean] + full_content

                    stem, sub_qs = self._parse_subquestions(full_content)
                    ans_val = ans_dict.get(roman_idx, {}).get(1, "") or ans_dict.get(roman_idx, {}).get(0, "")

                    q_item = self._create_question_item(
                        paper_meta=paper_meta,
                        global_idx=global_q_idx,
                        order_in_paper=roman_idx,
                        sec_type=sec_title,
                        q_type=q_type,
                        score=default_score or 12.0,
                        stem=stem,
                        sub_questions=sub_qs,
                        answer=ans_val
                    )
                    questions.append(q_item)
                    global_q_idx += 1

        return questions

    def _create_question_item(
        self,
        paper_meta: Dict[str, Any],
        global_idx: int,
        order_in_paper: int,
        sec_type: str,
        q_type: str,
        score: Optional[float],
        stem: str,
        options: List[OptionItem] = None,
        sub_questions: List[SubQuestionItem] = None,
        answer: str = ""
    ) -> QuestionItem:
        """封装并生成标准题目对象，同时执行智能章节分类映射。"""
        pid = paper_meta["paper_id"]
        qid = f"BUPT-MATH-P{pid:03d}-Q{global_idx:02d}"

        clean_stem = wrap_math_formulas(stem.strip())
        clean_ans = format_latex_expression(answer.strip()) if answer else ""

        hints = ""
        if "提示：" in clean_ans or "提示:" in clean_ans:
            parts = re.split(r'提示[：:]', clean_ans, maxsplit=1)
            clean_ans = parts[0].strip()
            hints = parts[1].strip()

        meta = QuestionMeta(
            section_type=sec_type,
            type=q_type,
            order_in_paper=order_in_paper,
            score=score
        )
        content = QuestionContent(
            stem=clean_stem,
            options=options or [],
            sub_questions=sub_questions or []
        )
        solution = QuestionSolution(
            answer=clean_ans,
            hints=hints
        )

        item = QuestionItem(
            id=qid,
            source=paper_meta,
            meta=meta,
            content=content,
            solution=solution
        )

        mapping = self.classifier.classify_question(item)
        if mapping:
            item.mapping["engineering_analysis"] = mapping

        return item

    def _split_by_roman_sections(self, text: str) -> List[Tuple[str, List[str]]]:
        """将试卷或答案文本按 一、二、三 等大题标题切分。"""
        lines = text.split('\n')
        sections = []
        curr_title = "Header"
        curr_lines = []

        for line in lines:
            s = line.strip()
            if not s:
                continue
            m = re.match(r'^([一二三四五六七八九十]+)[、. ]\s*(.*)$', s)
            if m:
                if curr_lines:
                    sections.append((curr_title, curr_lines))
                curr_title = s
                curr_lines = []
            else:
                curr_lines.append(s)

        if curr_lines:
            sections.append((curr_title, curr_lines))
        return sections

    def _split_numbered_items(self, lines: List[str]) -> List[Tuple[int, List[str]]]:
        """将大题内部按 1. 2. 3. 序号切分为各个小题。"""
        items = []
        curr_num = 0
        curr_lines = []

        for line in lines:
            s = line.strip()
            if not s:
                continue
            m = re.match(r'^(\d+)\s*[\.、]\s*(.*)$', s)
            if m and (curr_num == 0 and int(m.group(1)) == 1 or int(m.group(1)) == curr_num + 1):
                if curr_lines:
                    items.append((curr_num, curr_lines))
                curr_num = int(m.group(1))
                curr_lines = [m.group(2)] if m.group(2) else []
            else:
                curr_lines.append(s)

        if curr_lines:
            items.append((curr_num, curr_lines))
        return items

    def _parse_choice_item(self, lines: List[str]) -> Tuple[str, List[OptionItem]]:
        """从选择题题干中分离出题干与 A, B, C, D 选项。"""
        stem_lines = []
        options = []
        curr_opt_key = None
        curr_opt_lines = []

        for line in lines:
            s = line.strip()
            m_opt = re.match(r'^([A-D])\s*[\.、]\s*(.*)$', s)
            if m_opt:
                if curr_opt_key:
                    options.append(OptionItem(key=curr_opt_key, text=" ".join(curr_opt_lines)))
                curr_opt_key = m_opt.group(1)
                curr_opt_lines = [m_opt.group(2)] if m_opt.group(2) else []
            elif curr_opt_key:
                curr_opt_lines.append(s)
            else:
                stem_lines.append(s)

        if curr_opt_key:
            options.append(OptionItem(key=curr_opt_key, text=" ".join(curr_opt_lines)))

        return " ".join(stem_lines), options

    def _parse_subquestions(self, lines: List[str]) -> Tuple[str, List[SubQuestionItem]]:
        """从大题中解析出 (1), (2) 小问。"""
        stem_lines = []
        sub_qs = []
        curr_sub_id = None
        curr_sub_lines = []

        for line in lines:
            s = line.strip()
            m_sub = re.match(r'^\((\d+)\)\s*(.*)$', s)
            if m_sub:
                if curr_sub_id:
                    sub_qs.append(SubQuestionItem(sub_id=curr_sub_id, stem=" ".join(curr_sub_lines)))
                curr_sub_id = f"({m_sub.group(1)})"
                curr_sub_lines = [m_sub.group(2)] if m_sub.group(2) else []
            elif curr_sub_id:
                curr_sub_lines.append(s)
            else:
                stem_lines.append(s)

        if curr_sub_id:
            sub_qs.append(SubQuestionItem(sub_id=curr_sub_id, stem=" ".join(curr_sub_lines)))

        return " ".join(stem_lines), sub_qs

    def _build_answer_index(self, a_sections: List[Tuple[str, List[str]]]) -> Dict[int, Dict[int, str]]:
        """将答案区构建为两级索引字典 {大题号: {小题号: 答案文本}}。"""
        ans_index = {}

        for sec_title, sec_lines in a_sections:
            m_roman = re.match(r'^([一二三四五六七八九十]+)', sec_title)
            if not m_roman:
                continue
            roman_idx = ROMAN_TO_INT.get(m_roman.group(1), 1)
            ans_index.setdefault(roman_idx, {})

            rest_title = sec_title[m_roman.end():].strip('、. ')
            all_lines = ([rest_title] if rest_title else []) + sec_lines

            curr_q = 1
            curr_content = []

            for line in all_lines:
                s = line.strip()
                if not s:
                    continue
                m_num = re.match(r'^(\d+)\s*[\.、]\s*(.*)$', s)
                if m_num and (int(m_num.group(1)) == curr_q + 1 or int(m_num.group(1)) == 1):
                    if curr_content:
                        ans_index[roman_idx][curr_q] = " ".join(curr_content)
                    curr_q = int(m_num.group(1))
                    curr_content = [m_num.group(2)] if m_num.group(2) else []
                else:
                    curr_content.append(s)

            if curr_content:
                ans_index[roman_idx][curr_q] = " ".join(curr_content)

            if 0 not in ans_index[roman_idx]:
                ans_index[roman_idx][0] = "\n".join(all_lines)

        return ans_index
