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
    section_type: str
    type: str
    order_in_paper: int
    score: Optional[float] = None
    difficulty: int = 2
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
    volume: str = ""
    chapter: int = 1
    chapter_title: str = ""
    section: str = ""
    section_title: str = ""
    section_slug: str = ""
    knowledge_points: List[str] = field(default_factory=list)
    cognitive_level: str = "apply"

@dataclass
class QuestionItem:
    """完整题目实体"""
    id: str
    source: Dict[str, Any]
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
    category: str
    course_name: str
    academic_year: str
    term: int
    exam_type: str
    paper_type: str
    page_start: int
    page_end: int
    questions: List[QuestionItem] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)
