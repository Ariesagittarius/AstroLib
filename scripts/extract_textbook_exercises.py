# -*- coding: utf-8 -*-
"""
scripts/extract_textbook_exercises.py
从《工科数学分析基础》38个小节MDX正文底部精准抽取课后习题（A组与B组），
转换为标准 QuestionItem 结构化数据并输出到：
  - src/data/exercises/engineering_analysis_textbook_exercises.json
同时将引用的 24 张几何配图安全复制到：
  - public/data/exercises/engineering_analysis/images/
并在各章节 MDX 文件中安全移除 `<Block title="习题X.Y">...</Block>` 习题区。
"""

import os
import sys
import re
import glob
import json
import shutil

try:
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOCS_DIR = os.path.join(ROOT, 'src', 'content', 'docs', 'collections', 'math', 'engineering_analysis')
SRC_IMG_DIR = os.path.join(DOCS_DIR, 'images')
OUT_JSON = os.path.join(ROOT, 'src', 'data', 'exercises', 'engineering_analysis_textbook_exercises.json')
PUBLIC_IMG_DIR = os.path.join(ROOT, 'public', 'data', 'exercises', 'engineering_analysis', 'images')

CHAPTER_TITLES = {
    1: '第1章 极限与连续',
    2: '第2章 一元函数微分学',
    3: '第3章 一元函数积分学',
    4: '第4章 常微分方程',
    5: '第5章 多元函数微分学',
    6: '第6章 多元函数积分学',
    7: '第7章 无穷级数',
}

def clean_section_title(raw_name: str) -> str:
    # E.g. '1.1_集合映射与函数.mdx' -> '集合映射与函数'
    base = os.path.splitext(raw_name)[0]
    m = re.match(r'^\d+\.\d+_(.*)$', base)
    if m:
        return m.group(1).replace('mathbfR^n', 'ℝⁿ')
    return base

def infer_question_type(stem: str) -> str:
    s = stem.strip()
    if re.search(r'[A-D][\.、\s]', s) and re.search(r'\(.*?[A-D].*?\)', s):
        return 'choice'
    if '填空' in s or '\\underline{' in s or '______' in s or '____' in s:
        return 'blank'
    if '证明' in s or '证：' in s or '证 ' in s:
        return 'proof'
    return 'calc'

def extract_sub_questions(stem: str) -> list[dict]:
    # Extract sub-questions like (1), (2), (3)...
    sub_pattern = r'(?:^|\n)\s*[\(（](\d+)[\)）]\s*'
    matches = list(re.finditer(sub_pattern, stem))
    if not matches or len(matches) < 2:
        return []
    subs = []
    for i, m in enumerate(matches):
        sub_id = m.group(1)
        start = m.end()
        end = matches[i+1].start() if i + 1 < len(matches) else len(stem)
        sub_text = stem[start:end].strip()
        subs.append({
            'sub_id': f'({sub_id})',
            'stem': sub_text
        })
    return subs

def parse_section_exercises(sec_id: str, sec_title: str, ch_id: int, body: str, copy_images: bool = True):
    # Split into group A and B
    # Matches patterns like **（$A$）**, **（A）**, （A）, (A), **（$B$）**, **（B）**, etc.
    group_header_re = re.compile(
        r'(?:^|\n)(?:#{1,6}\s*)?(?:\*\*|###)?\s*[\(（]\s*[$]?([ABab])[$]?\s*[\)）]\s*(?:\*\*)?\s*(?:\n|$)'
    )
    splits = list(group_header_re.finditer(body))
    
    groups = []
    if not splits:
        groups.append(('A', body))
    else:
        for i, match in enumerate(splits):
            group_name = match.group(1).upper()
            start_pos = match.end()
            end_pos = splits[i+1].start() if i + 1 < len(splits) else len(body)
            groups.append((group_name, body[start_pos:end_pos].strip()))
            
    questions = []
    running_order = 0
    
    for group_name, group_text in groups:
        # Match numbered questions: e.g. "1. ", "2. ", "## 5. "
        q_header_re = re.compile(r'(?:^|\n)(?:#{1,6}\s*)?(\d+)\.\s+')
        q_splits = list(q_header_re.finditer(group_text))
        
        for j, q_match in enumerate(q_splits):
            running_order += 1
            q_num = int(q_match.group(1))
            q_start = q_match.end()
            q_end = q_splits[j+1].start() if j + 1 < len(q_splits) else len(group_text)
            raw_stem = group_text[q_start:q_end].strip()
            
            # Clean up OCR heading artifacts in stem
            clean_stem = re.sub(r'#{1,6}\s*', '', raw_stem).strip()
            
            # Replace images and copy if needed
            # ![](images/xxx.jpg) -> ![](/data/exercises/engineering_analysis/images/xxx.jpg)
            img_matches = re.findall(r'!\[(.*?)\]\((images/[^)]+)\)', clean_stem)
            for alt, img_rel in img_matches:
                img_name = os.path.basename(img_rel)
                src_path = os.path.join(SRC_IMG_DIR, img_name)
                dest_path = os.path.join(PUBLIC_IMG_DIR, img_name)
                if copy_images and os.path.exists(src_path):
                    shutil.copy2(src_path, dest_path)
                
                clean_img_url = f"/data/exercises/engineering_analysis/images/{img_name}"
                clean_stem = clean_stem.replace(img_rel, clean_img_url)
                
            q_id = f"EA-TB-{sec_id}-{group_name}-Q{q_num:02d}"
            q_type = infer_question_type(clean_stem)
            subs = extract_sub_questions(clean_stem)
            
            group_label = "A组 基础训练" if group_name == 'A' else "B组 综合提高"
            source_desc = f"《工科数学分析基础》第 {sec_id} 节习题 · {group_label}第 {q_num} 题"
            paper_id = 1000 + ch_id
            paper_title = f"《工科数学分析基础》{CHAPTER_TITLES[ch_id]} 课后习题集"
            
            q_obj = {
                "id": q_id,
                "source_type": "textbook",
                "source": {
                    "paper_id": paper_id,
                    "raw_title": paper_title,
                    "clean_title": paper_title,
                    "category": "教材课后习题",
                    "course_name": "工科数学分析基础",
                    "academic_year": "教材配套",
                    "term": 1 if ch_id <= 4 else 2,
                    "exam_type": "textbook",
                    "paper_type": "教材原题",
                    "source_desc": source_desc
                },
                "meta": {
                    "section_type": f"{group_name}组（{'基础' if group_name == 'A' else '提高'}）",
                    "group": group_name,
                    "order_in_paper": running_order,
                    "paper_q_num": running_order,
                    "type": q_type,
                    "difficulty": 1 if group_name == 'A' else 3,
                    "score": 5
                },
                "mapping": {
                    "engineering_analysis": {
                        "volume": "upper" if ch_id <= 4 else "lower",
                        "chapter": ch_id,
                        "chapter_title": CHAPTER_TITLES[ch_id],
                        "section": sec_id,
                        "section_title": sec_title,
                        "section_slug": f"{sec_id}_{sec_title}",
                        "knowledge_points": [sec_title]
                    }
                },
                "content": {
                    "stem": clean_stem,
                    "options": [],
                    "sub_questions": subs
                },
                "solution": {
                    "answer": "",
                    "hints": "",
                    "steps": ""
                }
            }
            questions.append(q_obj)
            
    return questions

def process_all(dry_run: bool = False):
    os.makedirs(PUBLIC_IMG_DIR, exist_ok=True)
    os.makedirs(os.path.dirname(OUT_JSON), exist_ok=True)
    
    pattern = os.path.join(DOCS_DIR, '[1-7].*.mdx')
    files = sorted(glob.glob(pattern))
    
    all_questions_by_chapter = {str(ch): [] for ch in range(1, 8)}
    total_extracted = 0
    
    print(f"开始扫描并拆解《工科数学分析》38 个小节课后习题 (dry_run={dry_run})...")
    
    for fpath in files:
        fname = os.path.basename(fpath)
        m_sec = re.match(r'^(\d+\.\d+)', fname)
        if not m_sec:
            continue
        sec_id = m_sec.group(1)
        ch_id = int(sec_id.split('.')[0])
        sec_title = clean_section_title(fname)
        
        with open(fpath, 'r', encoding='utf-8') as fp:
            raw_content = fp.read()
            
        block_m = re.search(r'<Block title="([^"]*习题[^"]*)">([\s\S]*?)</Block>', raw_content)
        if not block_m:
            print(f"  [跳过] {fname} 未发现 <Block title=\"习题...\">")
            continue
            
        block_body = block_m.group(2).strip()
        
        # 1. 抽取习题
        qs = parse_section_exercises(sec_id, sec_title, ch_id, block_body, copy_images=not dry_run)
        all_questions_by_chapter[str(ch_id)].extend(qs)
        total_extracted += len(qs)
        
        print(f"  [{sec_id} {sec_title}] 成功解析 {len(qs)} 题 (A组: {sum(1 for q in qs if q['meta']['group']=='A')}, B组: {sum(1 for q in qs if q['meta']['group']=='B')})")
        
        # 2. 从 MDX 移除该 <Block>
        if not dry_run:
            new_content = raw_content[:block_m.start()].rstrip() + '\n\n' + raw_content[block_m.end():].lstrip()
            new_content = re.sub(r'\n{3,}', '\n\n', new_content).strip() + '\n'
            with open(fpath, 'w', encoding='utf-8') as fp:
                fp.write(new_content)
                
    # 3. 写入提取出来的结构化 JSON 数据库
    if not dry_run:
        payload = {
            "book": "engineering_analysis",
            "title": "工科数学分析基础（第三版）课后习题集",
            "total_questions": total_extracted,
            "chapters": all_questions_by_chapter
        }
        with open(OUT_JSON, 'w', encoding='utf-8') as fp:
            json.dump(payload, fp, ensure_ascii=False, indent=2)
            
        print(f"\n课后习题拆解入库成功：共收录 {total_extracted} 道题目！")
        print(f"题目数据库导出至: {OUT_JSON}")
        print(f"配图静态资源导出至: {PUBLIC_IMG_DIR}")
    else:
        print(f"\n[Dry-Run] 预估抽取 {total_extracted} 道题目，未修改文件。")

if __name__ == '__main__':
    import sys
    dry_run = '--dry-run' in sys.argv
    process_all(dry_run=dry_run)
