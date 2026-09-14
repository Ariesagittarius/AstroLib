export interface QuestionOption {
  key: string;
  text_html: string;
  text_raw: string;
}

export interface SubQuestion {
  sub_id: string;
  stem_raw: string;
  stem_html: string;
}

export interface SlimQuestionItem {
  id: string;
  source_type?: 'exam' | 'textbook';
  group?: 'A' | 'B' | string;
  type: 'choice' | 'blank' | 'calc' | 'proof';
  score: number;
  sec: string;
  sec_slug: string;
  sec_title: string;
  chapter: number;
  chapter_title: string;
  paper_id: number;
  paper_title: string;
  paper_raw_title?: string;
  paper_q_num: number;
  order_in_paper: number;
  section_type: string;
  academic_year: string;
  paper_category: string;
  paper_type: string;
  source: string;
  kps: string[];
  stem_html: string;
  stem_raw: string;
  options?: QuestionOption[];
  sub_questions?: SubQuestion[];
  answer: string;
  answer_html: string;
  hints_html?: string;
  steps_html?: string;
  search: string;
}

export interface ChapterSectionSummary {
  section: string;
  section_title: string;
  section_slug: string;
  count: number;
}

export interface ChapterData {
  chapter: number;
  chapter_title: string;
  total: number;
  sections: ChapterSectionSummary[];
  type_counts: Record<string, number>;
  source_counts: Record<string, number>;
  questions: SlimQuestionItem[];
}

export interface PaperSummary {
  paper_id: number;
  clean_title: string;
  category: string;
  course_name: string;
  academic_year: string;
  term: number;
  exam_type: string;
  total_questions: number;
  total_score: number;
  type_counts: Record<string, number>;
  sections_count: number;
}

export interface SinglePaperData {
  paper_id: number;
  clean_title: string;
  raw_title: string;
  category: string;
  course_name: string;
  academic_year: string;
  term: number;
  exam_type: string;
  paper_type: string;
  total_questions: number;
  total_score: number;
  type_counts: Record<string, number>;
  sections_order: string[];
  questions: SlimQuestionItem[];
}

export type { ExerciseBank, ExerciseBankLicense } from '../config/exercise-banks.config';
