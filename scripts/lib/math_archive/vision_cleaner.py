"""
大邮数学集多模态视觉公式精准清洗与题库重构引擎
结合 PyMuPDF 高精页面渲染与 DeepSeek (deepseek-v4-flash-vision-exp) 视觉模型，将 PDF 试卷精准转录为高质量标准 LaTeX 题库。
"""
import os
import sys
import time
import json
import re
import random
import base64
import urllib.request
import urllib.error
from typing import List, Dict, Any, Optional
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
from .curriculum_mapper import CurriculumClassifier

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

DEFAULT_API_KEY = os.environ.get(
    "GEMINI_API_KEY",
    os.environ.get("GOOGLE_API_KEY", "")
)

PROMPT_SYSTEM = r"""你是一位顶级的大学数学文献数字化与 LaTeX 专家。
你的任务是将传入的一套大学数学考试试卷页面图像（包含试题部分与答案部分）完整转录为高精度的结构化 JSON 数据。

【核心要求与公式规范】
1. **数学公式绝对精度**：
   - 题干 (stem)、选项 (options.text)、答案 (answer) 中的所有数学公式、符号与变量必须使用标准 LaTeX 语法并严格包裹在 $...$ 或 $$...$$ 中。
   - 分式必须使用 \frac{分子}{分母}，如 $\frac{3x^2+5}{5x+3} \sin \frac{2}{x}$、$\frac{6}{5}$。
   - 上下标必须使用 ^{...} 与 _{...}，如 $e^{2x+y}$、$x^2$、$a_n$、$f^{(n)}(x)$。
   - 根式必须使用 \sqrt{...} 或 \sqrt[n]{...}，嵌套根号如 $\sqrt{n+\sqrt{n}} - \sqrt{n-\sqrt{n}}$。
   - 极限必须使用 \lim_{n \to \infty} 或 \lim_{x \to 0^+}。
   - 分段函数与方程组必须使用 \begin{cases} ... \end{cases}。
   - 行列式与矩阵使用 \begin{vmatrix} ... \end{vmatrix} 或 \begin{pmatrix} ... \end{pmatrix}。
   - 导数与微分符号如 \frac{\mathrm{d}y}{\mathrm{d}x}、\frac{\partial z}{\partial x}、\mathrm{d}x。
   - 填空题的下划线处统一用 $\underline{\quad\quad}$ 或 ( ) 表示。
2. **完整性与题目对齐**：
   - 提取试卷中的所有大题与小题，不得遗漏任何一题。
   - 将试卷末尾的“答案”或“参考答案”精准对齐绑定到对应题目的 answer 字段。若题目有小问，请将各小问答案结构化列出。
3. **输出格式**：
   - 严格仅输出合法的 JSON 字符串，不要添加 Markdown ```json 包裹。

【JSON Schema 格式定义】
{
  "paper_title": "试卷标题",
  "sections": [
    {
      "section_title": "一、填空题（共 30 分，每小题 5 分）",
      "type": "blank",
      "questions": [
        {
          "order": 1,
          "score": 5.0,
          "stem": "设 $f(x) = \\begin{cases} 1, & |x| \\le 1 \\\\ 0, & |x| > 1 \\end{cases}$，则 $f(f(x)) = \\underline{\\quad\\quad}$．",
          "options": [],
          "answer": "$1$",
          "analysis": ""
        }
      ]
    },
    {
      "section_title": "二、选择题（共 30 分，每小题 5 分）",
      "type": "choice",
      "questions": [
        {
          "order": 1,
          "score": 5.0,
          "stem": "题干内容（数学公式用 $...$ 包裹）",
          "options": [
            {"key": "A", "text": "选项A内容"},
            {"key": "B", "text": "选项B内容"},
            {"key": "C", "text": "选项C内容"},
            {"key": "D", "text": "选项D内容"}
          ],
          "answer": "D",
          "analysis": ""
        }
      ]
    },
    {
      "section_title": "三、（14 分）",
      "type": "calc",
      "questions": [
        {
          "order": 1,
          "score": 14.0,
          "stem": "求函数 $f(x) = \\frac{\\ln|x|}{|x-1|} \\sin x$ 的间断点并指出其类型．",
          "options": [],
          "answer": "$f(x)$ 有可去间断点 $x=0$，跳跃间断点 $x=1$",
          "analysis": ""
        }
      ]
    }
  ]
}
"""

def parse_latex_json(raw_text: str) -> dict:
    """
    状态机健壮解析可能包含未转义 LaTeX 反斜杠与非法控制字符的 LLM JSON 响应
    """
    if not raw_text or not raw_text.strip():
        raise ValueError("Empty response string received from LLM")

    s = raw_text.strip()
    if s.startswith("```json"):
        s = s[7:]
    if s.startswith("```"):
        s = s[3:]
    if s.endswith("```"):
        s = s[:-3]
    s = s.strip()

    first_brace = s.find('{')
    last_brace = s.rfind('}')
    if first_brace == -1 or last_brace == -1 or last_brace <= first_brace:
        raise ValueError(f"No valid JSON object found in response preview: {s[:150]}")
    s = s[first_brace:last_brace+1]

    res = []
    in_string = False
    i = 0
    n = len(s)

    while i < n:
        char = s[i]

        if not in_string:
            if char == '"':
                in_string = True
                res.append(char)
                i += 1
            else:
                res.append(char)
                i += 1
        else:
            if char == '"':
                in_string = False
                res.append(char)
                i += 1
            elif char == '\n':
                res.append('\\n')
                i += 1
            elif char == '\r':
                res.append('\\r')
                i += 1
            elif char == '\t':
                res.append('\\t')
                i += 1
            elif char == '\\':
                if i + 1 < n:
                    next_char = s[i + 1]
                    if next_char == '"':
                        res.append('\\"')
                        i += 2
                    elif next_char == '\\':
                        res.append('\\\\')
                        i += 2
                    elif next_char == '/':
                        res.append('\\/')
                        i += 2
                    elif next_char == 'n':

                        if i + 2 < n and s[i + 2].isalpha():
                            res.append('\\\\')
                            i += 1
                        else:
                            res.append('\\n')
                            i += 2
                    elif next_char in ['b', 'f', 'r', 't']:

                        res.append('\\\\')
                        i += 1
                    elif next_char == 'u' and i + 5 < n and all(c in '0123456789abcdefABCDEF' for c in s[i+2:i+6]):
                        res.append(s[i:i+6])
                        i += 6
                    else:

                        res.append('\\\\')
                        i += 1
                else:
                    res.append('\\\\')
                    i += 1
            else:
                res.append(char)
                i += 1

    sanitized = "".join(res)
    parsed = None
    try:
        parsed = json.loads(sanitized)
    except json.JSONDecodeError:

        fixed = re.sub(r',\s*([\]}])', r'\1', sanitized)
        parsed = json.loads(fixed)

    def _sanitize_obj(val):
        if isinstance(val, str):
            val = val.replace('\x0c', '\\f')
            val = val.replace('\x08', '\\b')
            val = val.replace('\x0b', '\\v')
            val = re.sub(r'\r(?!\n)', r'\\r', val)
            val = re.sub(r'\t([a-zA-Z])', r'\\t\1', val)
            val = re.sub(r'\$\$[\s\S]+?\$\$|\$[^\$\n]+?\$', lambda m: m.group(0).replace('\t', ' '), val)
            val = re.sub(r'\$\$[\s\S]+?\$\$|\$[^\$\n]+?\$', lambda m: re.sub(r'\n(u|eq|ne|not|nabla|notin|nrightarrow|natural|nearrow|nwarrow|neg|normalsize)\b', r'\\n\1', m.group(0)), val)
            return val
        elif isinstance(val, list):
            return [_sanitize_obj(x) for x in val]
        elif isinstance(val, dict):
            return {k: _sanitize_obj(v) for k, v in val.items()}
        return val

    return _sanitize_obj(parsed)

class BUPTVisionExtractor:
    """基于 Gemini 2.5 Flash 视觉多模态的试卷重构抽取器"""

    def __init__(self, pdf_path: str, cache_dir: str = "src/data/exercises/raw_papers", api_key: Optional[str] = None):
        self.pdf_path = pdf_path
        self.cache_dir = cache_dir
        self.api_key = api_key or DEFAULT_API_KEY
        self.classifier = CurriculumClassifier()
        os.makedirs(self.cache_dir, exist_ok=True)

    def get_all_papers_meta(self) -> List[Dict[str, Any]]:
        """从目录树中提取 173 套试卷元数据与起止页码"""
        doc = pymupdf.open(self.pdf_path)
        try:
            toc = doc.get_toc()
            total_pages = len(doc)
        finally:
            doc.close()

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
            p_end = total_pages
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
            if "A 卷" in rest or "A卷" in rest or "（A）" in rest or "(A)" in rest:
                paper_type = "A卷"
            elif "B 卷" in rest or "B卷" in rest or "（B）" in rest or "(B)" in rest:
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

            paper_items.append({
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
            })

        return paper_items

    def extract_paper(self, paper_meta: Dict[str, Any], force_recompute: bool = False) -> PaperItem:
        """提取整套试卷（优先读取本地缓存，无缓存则调用视觉模型并存盘）"""
        paper_id = paper_meta["paper_id"]
        cache_path = os.path.join(self.cache_dir, f"paper_{paper_id:03d}.json")

        if not force_recompute and os.path.exists(cache_path):
            with open(cache_path, "r", encoding="utf-8") as f:
                parsed_data = json.load(f)
        else:
            parsed_data = self._fetch_paper_from_gemini(paper_meta)
            with open(cache_path, "w", encoding="utf-8") as f:
                json.dump(parsed_data, f, ensure_ascii=False, indent=2)

        questions = self._convert_to_questions(paper_meta, parsed_data)

        return PaperItem(
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

    def _fetch_paper_from_gemini(self, paper_meta: Dict[str, Any]) -> dict:
        """调用 Google Gemini 视觉多模态轻量模型 (Flash-Lite) 解析多页试卷"""
        p_start = paper_meta["page_start"] - 1
        p_end = paper_meta["page_end"]

        images_b64 = []
        doc = pymupdf.open(self.pdf_path)
        try:
            for p_idx in range(p_start, min(p_end, len(doc))):
                page = doc[p_idx]
                pix = page.get_pixmap(dpi=150, colorspace=pymupdf.csGRAY)
                img_bytes = pix.tobytes("jpeg", jpg_quality=85)
                images_b64.append(base64.b64encode(img_bytes).decode("utf-8"))
        finally:
            doc.close()

        parts = [{"text": PROMPT_SYSTEM + "\n\n请解析以下试卷图像并以指定 JSON 格式输出："}]
        for img_b64 in images_b64:
            parts.append({
                "inline_data": {
                    "mime_type": "image/jpeg",
                    "data": img_b64
                }
            })

        payload = {
            "contents": [{"parts": parts}],
            "generationConfig": {
                "responseMimeType": "application/json",
                "temperature": 0.1,
                "maxOutputTokens": 8192
            }
        }
        data_bytes = json.dumps(payload).encode("utf-8")

        models = [
            "gemini-3.1-flash-lite",
            "gemini-flash-lite-latest",
            "gemini-3.5-flash-lite",
            "gemini-2.5-flash"
        ]

        for attempt in range(8):
            model = models[attempt % len(models)]
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={self.api_key}"
            try:
                req = urllib.request.Request(
                    url,
                    data=data_bytes,
                    headers={"Content-Type": "application/json"}
                )
                with urllib.request.urlopen(req, timeout=120) as resp:
                    raw_resp = resp.read().decode("utf-8")

                if not raw_resp.strip():
                    raise ValueError("Empty HTTP response from Gemini API")
                res = json.loads(raw_resp)
                if "candidates" not in res or not res["candidates"]:
                    raise ValueError(f"No candidates in Gemini response: {raw_resp[:200]}")

                cand = res["candidates"][0]["content"]["parts"][0]["text"]

                time.sleep(1.0)
                return parse_latex_json(cand)

            except urllib.error.HTTPError as he:
                error_body = ""
                try:
                    error_body = he.read().decode("utf-8")
                except Exception:
                    pass
                wait_sec = 2.0 + (attempt + 1) * 2.5 + random.uniform(0.5, 2.0)
                print(f"⚠️ [试卷 {paper_meta['paper_id']:03d}] Gemini {model} HTTP {he.code} ({error_body[:120]})，等待 {wait_sec:.1f}s 后重试 ({attempt+1}/8)...", flush=True)
                time.sleep(wait_sec)
            except Exception as e:
                wait_sec = 2.0 + (attempt + 1) * 2.5 + random.uniform(0.5, 2.0)
                print(f"⚠️ [试卷 {paper_meta['paper_id']:03d}] Gemini {model} 请求异常 ({e})，等待 {wait_sec:.1f}s 后重试 ({attempt+1}/8)...", flush=True)
                time.sleep(wait_sec)

        raise RuntimeError(f"试卷 {paper_meta['paper_id']} 经过 8 次重试依然解析失败！")

    def _convert_to_questions(self, paper_meta: Dict[str, Any], parsed_data: dict) -> List[QuestionItem]:
        """将 JSON 格式化为 QuestionItem 实体并自动映射考点"""
        questions = []
        global_idx = 1
        paper_id = paper_meta["paper_id"]

        for sec in parsed_data.get("sections", []):
            sec_title = sec.get("section_title", "")
            raw_sec_type = str(sec.get("type", "")).lower()

            for q in sec.get("questions", []):
                q_num = q.get("order") or global_idx

                stem_raw = q.get("stem", "")
                if isinstance(stem_raw, list):
                    stem = "\n".join(str(x) for x in stem_raw).strip()
                else:
                    stem = str(stem_raw or "").strip()

                ans_raw = q.get("answer", "")
                sub_questions = []
                if isinstance(ans_raw, list):
                    formatted_parts = []
                    for item in ans_raw:
                        if isinstance(item, dict):
                            sub_id = item.get("sub_order") or item.get("sub_id") or ""
                            sub_ans = item.get("answer") or item.get("text") or ""
                            if sub_id and sub_ans:
                                formatted_parts.append(f"{sub_id} {sub_ans}")
                                sub_questions.append(SubQuestionItem(sub_id=sub_id, stem="", answer=sub_ans))
                            elif sub_ans:
                                formatted_parts.append(str(sub_ans))
                            else:
                                formatted_parts.append(str(item))
                        else:
                            formatted_parts.append(str(item))
                    ans = "； ".join(formatted_parts).strip()
                else:
                    ans = str(ans_raw or "").strip()

                hints_raw = q.get("analysis", "")
                if isinstance(hints_raw, list):
                    hints = "\n".join(str(x) for x in hints_raw).strip()
                else:
                    hints = str(hints_raw or "").strip()

                score = q.get("score")

                options = []
                for opt in q.get("options", []):
                    if isinstance(opt, str):
                        m_opt = re.match(r'^([A-D])[\.、\s]+(.*)$', opt)
                        if m_opt:
                            options.append(OptionItem(key=m_opt.group(1).upper(), text=m_opt.group(2).strip()))
                        else:
                            options.append(OptionItem(key="", text=opt.strip()))
                    elif isinstance(opt, dict):
                        key = opt.get("key") or opt.get("label") or ""
                        text = str(opt.get("text", "")).strip()
                        if key:
                            options.append(OptionItem(key=str(key).upper(), text=text))

                if options or "choice" in raw_sec_type or "选择" in sec_title:
                    q_type = "choice"
                    score = score or 5.0
                elif "blank" in raw_sec_type or "填空" in sec_title:
                    q_type = "blank"
                    score = score or 5.0
                elif "proof" in raw_sec_type or "证明" in sec_title or "证明" in stem[:20]:
                    q_type = "proof"
                else:
                    q_type = "calc"

                qid = f"BUPT-MATH-P{paper_id:03d}-Q{global_idx:02d}"

                q_item = QuestionItem(
                    id=qid,
                    source=paper_meta,
                    meta=QuestionMeta(
                        section_type=sec_title,
                        type=q_type,
                        order_in_paper=q_num,
                        score=score,
                        difficulty=2
                    ),
                    content=QuestionContent(
                        stem=stem,
                        options=options,
                        sub_questions=sub_questions
                    ),
                    solution=QuestionSolution(
                        answer=ans,
                        hints=hints
                    ),
                    mapping={}
                )

                mapping_obj = self.classifier.classify_question(q_item)
                cat = paper_meta.get("category", "")
                if mapping_obj:
                    if any(x in cat for x in ["分析上", "分析下", "工数"]):
                        q_item.mapping["engineering_analysis"] = mapping_obj
                    elif any(x in cat for x in ["线代", "高代", "矩阵论"]):
                        q_item.mapping["linear_algebra"] = mapping_obj
                    elif any(x in cat for x in ["概统", "概随", "研概随"]):
                        q_item.mapping["probability_statistics"] = mapping_obj
                    else:
                        q_item.mapping["engineering_analysis"] = mapping_obj

                questions.append(q_item)
                global_idx += 1

        return questions
