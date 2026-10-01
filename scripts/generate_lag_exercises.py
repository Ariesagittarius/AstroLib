#!/usr/bin/env python3

"""
scripts/generate_lag_exercises.py
《线性代数与几何》（北京邮电大学出版社）《大邮数学集》历年期末真题生成与图谱归并脚本。
从 bupt_math_full_database.json (或 raw_papers/) 提取试卷 42~62（共 21 套《线性代数》期末试卷，360 道题目），
精准映射至全书 9 大章节，补全自包含题干前置条件，输出题库与倒排索引。
"""

import os
import sys
import json
import re
from typing import Dict, List, Any

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from lib.math_archive.curriculum_mapper import CurriculumClassifier
from lib.math_archive.models import QuestionItem, QuestionMeta, QuestionContent, QuestionSolution, OptionItem, SubQuestionItem

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DATA_DIR = os.path.join(ROOT_DIR, "src", "data", "exercises")
FULL_DB_PATH = os.path.join(DATA_DIR, "bupt_math_full_database.json")
OUTPUT_LAG_PATH = os.path.join(DATA_DIR, "linear_algebra_geometry_exercises.json")
CHAPTER_INDEX_PATH = os.path.join(DATA_DIR, "chapter_index.json")

def make_self_contained_stem(stem: str, sec_type: str) -> str:
    """如果题干简短或为小问编号，且大题标题中包含方程组/矩阵/定义等前提，将其前置以保证题目自包含性"""
    premise = re.sub(r'^[一二三四五六七八九十]+、\s*（[^）]*分\s*）\s*', '', sec_type or '').strip()
    if not premise or len(premise) < 10:
        return stem

    if re.match(r'^[（(][1-9][)）]', stem) or stem.startswith('(1)') or stem.startswith('（1）'):
        if not premise.endswith('：') and not premise.endswith(':'):
            return f"{premise}\n\n{stem}"
        return f"{premise}\n{stem}"

    if len(stem) < 25 and not any(kw in stem for kw in ['\\begin', '\\matrix', '已知', '设']):
        if any(kw in premise for kw in ['求', '证明', '计算', '判断']) and len(premise) > len(stem) + 15:
            return premise
        return f"{premise}\n\n{stem}"
    return stem

def main():
    print("================================================================")
    print("🚀 开始构建《线性代数与几何》真题题库（大邮数学集试卷 42~62）")
    print(f"📄 题库源数据: {FULL_DB_PATH}")
    print("================================================================")

    if not os.path.exists(FULL_DB_PATH):
        print(f"❌ 错误: 找不到题库全量数据库 {FULL_DB_PATH}")
        sys.exit(1)

    with open(FULL_DB_PATH, "r", encoding="utf-8") as f:
        full_db = json.load(f)

    all_papers = full_db.get("papers", [])
    target_papers = [p for p in all_papers if 42 <= p.get("paper_id", 0) <= 62]
    print(f"📚 成功定位到《线性代数》期末试卷: {len(target_papers)} 套 (试卷 42 ~ 62)")

    classifier = CurriculumClassifier()
    questions_by_chapter: Dict[int, List[Dict[str, Any]]] = {ch: [] for ch in range(1, 10)}
    total_extracted = 0
    all_q_ids = []

    lag_inverted_index: Dict[str, List[str]] = {}

    for paper in target_papers:
        p_id = paper.get("paper_id")
        p_raw_title = paper.get("raw_title", "")
        p_cat = paper.get("category", "线代期末")

        for q in paper.get("questions", []):
            total_extracted += 1
            qid = q.get("id")
            all_q_ids.append(qid)

            orig_stem = q.get("content", {}).get("stem", "")
            sec_type = q.get("meta", {}).get("section_type", "")
            final_stem = make_self_contained_stem(orig_stem, sec_type)

            options_list = [
                OptionItem(key=opt.get("key", ""), text=opt.get("text", ""))
                for opt in q.get("content", {}).get("options", [])
            ]
            q_obj = QuestionItem(
                id=qid,
                source=paper,
                meta=QuestionMeta(
                    section_type=sec_type,
                    type=q.get("meta", {}).get("type", "calc"),
                    order_in_paper=q.get("meta", {}).get("order_in_paper", 1),
                    score=q.get("meta", {}).get("score", 5.0)
                ),
                content=QuestionContent(
                    stem=final_stem,
                    options=options_list
                ),
                solution=QuestionSolution(
                    answer=q.get("solution", {}).get("answer", ""),
                    hints=q.get("solution", {}).get("hints", ""),
                    steps=q.get("solution", {}).get("steps", "")
                )
            )

            lag_mapping = classifier._classify_linear_algebra_geometry(q_obj)
            ch_num = lag_mapping.chapter
            sec_slug = lag_mapping.section_slug

            q["content"]["stem"] = final_stem
            if "mapping" not in q or not isinstance(q["mapping"], dict):
                q["mapping"] = {}
            q["mapping"]["linear_algebra_geometry"] = {
                "volume": "single",
                "chapter": ch_num,
                "chapter_title": lag_mapping.chapter_title,
                "section": lag_mapping.section,
                "section_title": lag_mapping.section_title,
                "section_slug": sec_slug,
                "knowledge_points": lag_mapping.knowledge_points,
                "cognitive_level": lag_mapping.cognitive_level
            }

            questions_by_chapter[ch_num].append(q)
            lag_inverted_index.setdefault(sec_slug, []).append(qid)

    print("\n----------------------------------------------------------------")
    print(f"📈 9 大章节知识图谱映射结果 (共 {total_extracted} 题):")
    for ch in range(1, 10):
        ch_title = classifier.lag_curriculum[ch]["title"]
        count = len(questions_by_chapter[ch])
        print(f"   • 第 {ch} 章 ({ch_title}): {count:3d} 道")
    print("----------------------------------------------------------------")

    lag_payload = {
        "course": "linear_algebra_geometry",
        "title": "线性代数与几何真题题库",
        "total_questions": total_extracted,
        "total_papers": len(target_papers),
        "chapters": {
            str(ch): questions_by_chapter[ch]
            for ch in range(1, 10)
        }
    }
    with open(OUTPUT_LAG_PATH, "w", encoding="utf-8") as f:
        json.dump(lag_payload, f, ensure_ascii=False, indent=2)
    print(f"💾 已导出《线性代数与几何》真题题库: {OUTPUT_LAG_PATH}")

    if os.path.exists(CHAPTER_INDEX_PATH):
        try:
            with open(CHAPTER_INDEX_PATH, "r", encoding="utf-8") as f:
                ch_idx = json.load(f)
        except Exception:
            ch_idx = {}
    else:
        ch_idx = {}

    ch_idx["linear_algebra_geometry"] = lag_inverted_index
    with open(CHAPTER_INDEX_PATH, "w", encoding="utf-8") as f:
        json.dump(ch_idx, f, ensure_ascii=False, indent=2)
    print(f"💾 已更新章节检索倒排索引: {CHAPTER_INDEX_PATH}")

    with open(FULL_DB_PATH, "w", encoding="utf-8") as f:
        json.dump(full_db, f, ensure_ascii=False, indent=2)
    print(f"💾 已同步回写全量题库数据库: {FULL_DB_PATH}")

    print("\n🎉 《线性代数与几何》大邮数学集真题数据生成完毕！")

if __name__ == "__main__":
    main()
