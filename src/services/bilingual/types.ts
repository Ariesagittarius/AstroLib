/**
 * src/services/bilingual/types.ts
 * ============================================================================
 * AstroLib 双语对照与跨书关联领域模型 (Bilingual & Cross-Doc Alignment Types)
 * ============================================================================
 * 遵循 Rule 1 (UI is not a domain model) & Rule 7 (Utils Purity)
 */

export interface ParagraphToken {
  id: string; // e.g., 'src-p-0', 'tgt-p-1'
  index: number;
  text: string;
  type: 'heading' | 'paragraph' | 'math' | 'code' | 'quote' | 'card' | 'list-item';
  sectionTitle?: string;
}

export interface ParagraphLink {
  sourceIndex: number;
  sourceId: string;
  targetIndex: number;
  targetId: string;
  similarity: number; // 0.0 - 1.0
  isPrimary?: boolean;
}

export interface AlignmentMatrixResult {
  sourceParagraphs: ParagraphToken[];
  targetParagraphs: ParagraphToken[];
  matrix: number[][]; // [M][N] 相似度矩阵
  links: ParagraphLink[]; // 过滤并排序后的显式连线
  inferenceTimeMs: number;
  engine: string;
}

export interface TocMatchItem {
  sourceChapter: string;
  targetChapter: string;
  confidence: number;
  sourceTitle: string;
  targetTitle: string;
}

export interface TocMatchResult {
  matches: TocMatchItem[];
  unmatchedSource: string[];
  unmatchedTarget: string[];
}

export interface BilingualViewerState {
  activeSourceId: string | null;
  activeTargetIds: string[];
  hoveredSourceId: string | null;
  hoveredTargetId: string | null;
  threshold: number;
  isLockedScroll: boolean;
  isHeatmapOpen: boolean;
}
