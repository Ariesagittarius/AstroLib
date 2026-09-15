#!/usr/bin/env python3

"""
大邮数学集 (BUPT Math Archive) 全量解析与题库构建调度脚本 (支持多线程高精视觉并发 + 全量聚合)
用法:
  python scripts/process_bupt_math_archive.py --mode vision --workers 4
  python scripts/process_bupt_math_archive.py --mode vision --sample 10 --workers 3
  python scripts/process_bupt_math_archive.py --mode vision --paper-ids 1,2,3,4,5
"""

import os
import sys
import time
import json
import argparse
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Dict, List, Any

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from lib.math_archive.vision_cleaner import BUPTVisionExtractor
from lib.math_archive.pdf_extractor import BUPTMathExtractor
from lib.math_archive.mdx_generator import ChapterMDXGenerator
from lib.math_archive.models import QuestionItem, PaperItem

PDF_SOURCE_PATH = ".agents/src/大邮数学集-1.4.2.pdf"
DATA_OUTPUT_DIR = "src/data/exercises"
MDX_OUTPUT_DIR = "src/content/docs/collections/math/engineering_analysis"

def process_single_paper(extractor, meta: Dict[str, Any], force: bool = False) -> PaperItem:
    """单个试卷处理函数（线程安全）"""
    return extractor.extract_paper(meta, force_recompute=force)

def main():
    parser = argparse.ArgumentParser(description="Process BUPT Math Archive PDF into JSON Database & MDX")
    parser.add_argument("--pdf", default=PDF_SOURCE_PATH, help="Path to PDF file")
    parser.add_argument("--data-dir", default=DATA_OUTPUT_DIR, help="Output directory for JSON data")
    parser.add_argument("--mode", choices=["vision", "local"], default="vision", help="Extraction mode (vision or local)")
    parser.add_argument("--sample", type=int, default=None, help="Process only first N papers for quick testing")
    parser.add_argument("--paper-ids", type=str, default=None, help="Comma-separated paper IDs (e.g. 1,2,3)")
    parser.add_argument("--category", type=str, default=None, help="Filter papers by category substring (e.g. 分析上期中)")
    parser.add_argument("--force", action="store_true", default=False, help="Force re-fetch from LLM without using cache")
    parser.add_argument("--workers", type=int, default=2, help="Number of concurrent worker threads (recommended: 1-2 for Gemini Flash-Lite)")
    parser.add_argument("--api-key", type=str, default=None, help="Gemini API Key (defaults to GEMINI_API_KEY env or built-in key)")
    parser.add_argument("--generate-mdx", action="store_true", default=True, help="Generate chapter MDX pages")
    args = parser.parse_args()

    print("================================================================")
    print(f"🚀 开始处理《大邮数学集》[模式: {args.mode.upper()} | 并发线程: {args.workers}]")
    print(f"📄 源文件: {args.pdf}")
    print("================================================================")

    if not os.path.exists(args.pdf):
        print(f"❌ 错误: 找不到 PDF 源文件 {args.pdf}")
        sys.exit(1)

    raw_cache_dir = os.path.join(args.data_dir, "raw_papers")
    os.makedirs(raw_cache_dir, exist_ok=True)

    if args.mode == "vision":
        extractor = BUPTVisionExtractor(args.pdf, cache_dir=raw_cache_dir, api_key=args.api_key)
    else:
        extractor = BUPTMathExtractor(args.pdf)

    all_meta = extractor.get_all_papers_meta()
    print(f"📚 勘察到全书总计 {len(all_meta)} 套试卷目录索引")

    papers_to_process = all_meta
    if args.paper_ids:
        target_ids = {int(x.strip()) for x in args.paper_ids.split(",") if x.strip().isdigit()}
        papers_to_process = [m for m in papers_to_process if m["paper_id"] in target_ids]
    elif args.category:
        papers_to_process = [m for m in papers_to_process if args.category in m["category"]]
    elif args.sample:
        papers_to_process = papers_to_process[:args.sample]

    print(f"🎯 本次待处理目标试卷数: {len(papers_to_process)} 套")

    cached_count = sum(
        1 for m in papers_to_process
        if os.path.exists(os.path.join(raw_cache_dir, f"paper_{m['paper_id']:03d}.json"))
    )
    print(f"📦 已命中磁盘断点缓存: {cached_count}/{len(papers_to_process)} 套，待调用模型转录: {len(papers_to_process) - cached_count} 套")

    total_target = len(papers_to_process)
    completed_count = 0
    failed_papers = []
    lock = threading.Lock()
    start_time = time.time()

    print(f"\n⚡ 正在启动并发抽取流水线 (最大 {args.workers} 个并发请求)...")

    def _worker(meta):
        nonlocal completed_count
        p_id = meta["paper_id"]
        try:
            paper_obj = extractor.extract_paper(meta, force_recompute=args.force)
            with lock:
                completed_count += 1
                elapsed = time.time() - start_time
                q_count = len(paper_obj.questions)
                print(f"[{completed_count:3d}/{total_target}] ✅ 试卷 {p_id:03d} ({meta['category']}) 完成 ({q_count:2d} 题) | 耗时: {elapsed:.1f}s", flush=True)
            return paper_obj
        except Exception as e:
            with lock:
                completed_count += 1
                failed_papers.append((p_id, str(e)))
                print(f"[{completed_count:3d}/{total_target}] ❌ 试卷 {p_id:03d} 提取失败: {e}")
            return None

    extracted_results = []
    with ThreadPoolExecutor(max_workers=args.workers) as executor:
        futures = {executor.submit(_worker, m): m for m in papers_to_process}
        for f in as_completed(futures):
            res = f.result()
            if res:
                extracted_results.append(res)

    print("\n----------------------------------------------------------------")
    print(f"🏁 试卷提取阶段结束！成功: {len(extracted_results)} 套，失败: {len(failed_papers)} 套")
    if failed_papers:
        print(f"⚠️ 失败试卷清单: {', '.join(str(p[0]) for p in failed_papers)}")
    print("----------------------------------------------------------------")

    print("\n📊 正在进行全量题库数据聚合与知识图谱归并...")

    all_papers_dict = []
    all_questions: List[QuestionItem] = []
    ea_questions_by_chapter: Dict[int, List[QuestionItem]] = {i: [] for i in range(1, 8)}
    la_questions: List[QuestionItem] = []
    ps_questions: List[QuestionItem] = []

    inverted_index: Dict[str, Dict[str, List[str]]] = {
        "engineering_analysis": {},
        "linear_algebra": {},
        "probability_statistics": {}
    }

    for meta in all_meta:
        p_id = meta["paper_id"]
        cache_file = os.path.join(raw_cache_dir, f"paper_{p_id:03d}.json")
        if not os.path.exists(cache_file):
            continue

        try:
            with open(cache_file, "r", encoding="utf-8") as f:
                parsed_data = json.load(f)

            questions = extractor._convert_to_questions(meta, parsed_data)
            paper_item = PaperItem(
                paper_id=meta["paper_id"],
                raw_title=meta["raw_title"],
                category=meta["category"],
                course_name=meta["course_name"],
                academic_year=meta["academic_year"],
                term=meta["term"],
                exam_type=meta["exam_type"],
                paper_type=meta["paper_type"],
                page_start=meta["page_start"],
                page_end=meta["page_end"],
                questions=questions
            )

            all_papers_dict.append(paper_item.to_dict())

            for q in questions:
                all_questions.append(q)

                ea_map = q.mapping.get("engineering_analysis")
                if ea_map and any(x in meta["category"] for x in ["分析上", "分析下", "工数"]):
                    ea_questions_by_chapter[ea_map.chapter].append(q)
                    sec_key = ea_map.section_slug
                    inverted_index["engineering_analysis"].setdefault(sec_key, []).append(q.id)

                la_map = q.mapping.get("linear_algebra")
                if la_map or any(x in meta["category"] for x in ["线代", "高代", "矩阵论"]):
                    la_questions.append(q)
                    inverted_index["linear_algebra"].setdefault(meta["category"], []).append(q.id)

                ps_map = q.mapping.get("probability_statistics")
                if ps_map or any(x in meta["category"] for x in ["概统", "概随", "研概随"]):
                    ps_questions.append(q)
                    inverted_index["probability_statistics"].setdefault(meta["category"], []).append(q.id)

        except Exception as err:
            print(f"⚠️ 解析缓存试卷 paper_{p_id:03d}.json 出错: {err}")

    print("\n----------------------------------------------------------------")
    print("📈 全库聚合统计指标")
    print(f"  • 聚合试卷总数: {len(all_papers_dict)} / {len(all_meta)} 套")
    print(f"  • 提取题目总数: {len(all_questions)} 道")
    print(f"  • 《工科数学分析》题量: {sum(len(v) for v in ea_questions_by_chapter.values())} 道")
    for ch_id, q_list in ea_questions_by_chapter.items():
        print(f"     - 第 {ch_id} 章: {len(q_list)} 道")
    print(f"  • 《线性代数》题量: {len(la_questions)} 道")
    print(f"  • 《概率论与数理统计》题量: {len(ps_questions)} 道")
    print("----------------------------------------------------------------")

    full_db_path = os.path.join(args.data_dir, "bupt_math_full_database.json")
    full_payload = {
        "version": "1.4.2",
        "title": "大邮数学集题库数据库",
        "total_papers": len(all_papers_dict),
        "total_questions": len(all_questions),
        "papers": all_papers_dict,
        "questions": [q.to_dict() for q in all_questions]
    }
    with open(full_db_path, "w", encoding="utf-8") as f:
        json.dump(full_payload, f, ensure_ascii=False, indent=2)
    print(f"💾 已导出题库数据库: {full_db_path}")

    ea_db_path = os.path.join(args.data_dir, "engineering_analysis_exercises.json")
    ea_flat_questions = [q.to_dict() for q_list in ea_questions_by_chapter.values() for q in q_list]
    ea_payload = {
        "course": "engineering_analysis",
        "title": "工科数学分析基础真题题库",
        "total_questions": len(ea_flat_questions),
        "chapters": {
            ch_id: [q.to_dict() for q in q_list]
            for ch_id, q_list in ea_questions_by_chapter.items()
        }
    }
    with open(ea_db_path, "w", encoding="utf-8") as f:
        json.dump(ea_payload, f, ensure_ascii=False, indent=2)
    print(f"💾 已导出《工科数学分析》专项题库: {ea_db_path}")

    index_path = os.path.join(args.data_dir, "chapter_index.json")
    with open(index_path, "w", encoding="utf-8") as f:
        json.dump(inverted_index, f, ensure_ascii=False, indent=2)
    print(f"💾 已导出章节检索倒排索引: {index_path}")

    if args.generate_mdx and any(ea_questions_by_chapter.values()):
        print("\n📝 正在生成《工科数学分析》各章课后真题自测 MDX 页面...")
        mdx_gen = ChapterMDXGenerator(MDX_OUTPUT_DIR)
        mdx_gen.generate_chapter_pages(ea_questions_by_chapter, max_per_chapter=12)
        print("✅ MDX 章节页面生成完毕！")

    print(f"\n🎉 处理完成！总耗时: {time.time() - start_time:.1f}s")

if __name__ == "__main__":
    main()
