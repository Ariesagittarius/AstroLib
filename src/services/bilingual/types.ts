export interface ParagraphToken {
  id: string;
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
  similarity: number;
  isPrimary?: boolean;
}

export interface AlignmentMatrixResult {
  sourceParagraphs: ParagraphToken[];
  targetParagraphs: ParagraphToken[];
  matrix: number[][];
  links: ParagraphLink[];
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
