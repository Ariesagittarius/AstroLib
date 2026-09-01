# -*- coding: utf-8 -*-
"""
数据模型定义模块
定义题目 (Question)、试卷 (Paper)、元数据 (Meta)、解析 (Solution) 及教材知识点映射 (CurriculumMapping)。
"""

from dataclasses import dataclass, field, asdict
from typing import List, Dict, Optional, Any


@dataclass
class OptionItem:
    """选择题选项"""
    key: str
    text: str


@dataclass
class SubQuestionItem:
    """大题小问 (1), (2)..."""
    sub_id: str
    stem: str
    score: Optional[float] = None
    answer: str = ""
    steps: str = ""


@dataclass
class QuestionMeta:
    """题目元数据"""
    section_type: str            # 一、选择题 / 二、填空题 / 三、计算题 / 六、证明题 等
    type: str                    # choice / blank / calc / proof / comprehensive
    order_in_paper: int          # 试卷内题号
    score: Optional[float] = None
    difficulty: int = 2          # 1: 基础, 2: 中等, 3: 进阶, 4: 拔高/压轴
    has_images: bool = False
    images: List[str] = field(default_factory=list)


@dataclass
class QuestionContent:
    """题干与选项内容"""
    stem: str
    options: List[OptionItem] = field(default_factory=list)
    sub_questions: List[SubQuestionItem] = field(default_factory=list)


@dataclass
class QuestionSolution:
    """题目解答与解析"""
    answer: str = ""
    hints: str = ""
    steps: str = ""


@dataclass
class BookChapterMapping:
    """教材映射条目"""
    volume: str = ""             # upper (上册) / lower (下册)
    chapter: int = 1             # 章号 (1..7)
    chapter_title: str = ""      # 章标题
    section: str = ""            # 节号 (如 "1.3")
    section_title: str = ""      # 节标题
    section_slug: str = ""       # 对应 MDX slug 文件名
    knowledge_points: List[str] = field(default_factory=list) # 考察考点
    cognitive_level: str = "apply" # remember / understand / apply / analyze


@dataclass
class QuestionItem:
    """完整题目实体"""
    id: str                      # 全局唯一编号，如 BUPT-EMATH-2025F-MID-Q01
    source: Dict[str, Any]       # 试卷来源信息 (paper_id, title, category, year, term, etc.)
    meta: QuestionMeta
    content: QuestionContent
    solution: QuestionSolution
    mapping: Dict[str, BookChapterMapping] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class PaperItem:
    """试卷实体"""
    paper_id: int
    raw_title: str
    category: str                # 分析上期中 / 分析上期末 / 线代期末 等
    course_name: str             # 工科数学分析 / 数学分析 / 线性代数 等
    academic_year: str           # 2025-2026
    term: int                    # 1 / 2
    exam_type: str               # midterm / final / quiz / test
    paper_type: str              # A卷 / B卷 / 综合
    page_start: int
    page_end: int
    questions: List[QuestionItem] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)
