export type SemanticBlockKind =
  | 'definition'
  | 'theorem'
  | 'lemma'
  | 'corollary'
  | 'proposition'
  | 'axiom'
  | 'property'
  | 'criterion'
  | 'example'
  | 'variant'
  | 'proof'
  | 'solution'
  | 'remark'
  | 'note'
  | 'analysis'
  | 'method'
  | 'academicblock'
  | 'exercise'
  | 'guide'
  | 'summary'
  | 'heading'
  | 'paragraph'
  | 'math'
  | 'list'
  | 'table'
  | 'figure'
  | 'quote'
  | 'code'
  | 'digital_resource'
  | 'qrcode';

export type SemanticResourceCategory =
  | 'digital_resource'
  | 'reference'
  | 'footnote';

export interface DigitalResourceItem {
  id?: string;
  title: string;
  url: string;
  category: SemanticResourceCategory;
  categoryLabel?: string;
  relation: 'flow' | 'embedded' | 'section_end';
  hostKind?: SemanticBlockKind;
  hostId?: string;
}

export interface SemanticTableData {
  headers: string[];
  aligns?: Array<'left' | 'center' | 'right' | null>;
  rows: string[][];
}

export interface SemanticFigureData {
  url: string;
  alt?: string;
  caption?: string;
  localPath?: string;
}

export interface SemanticListData {
  ordered: boolean;
  start?: number;
  items: SemanticBlock[][];
}

export interface SemanticBlock {
  kind: SemanticBlockKind;
  title?: string;
  label?: string;
  number?: string;
  coreNumber?: string;
  level?: number;
  content?: string;
  children?: SemanticBlock[];
  tableData?: SemanticTableData;
  figureData?: SemanticFigureData;
  listData?: SemanticListData;
  resourceData?: DigitalResourceItem;
  meta?: Record<string, any>;
}

export interface ChapterImageItem {
  alt: string;
  url: string;
  originalPath: string;
  localPath?: string;
}

export interface ChapterCanonicalMetadata {
  colSlug: string;
  bookSlug: string;
  bookTitle: string;
  bookAuthor?: string;
  chapterNumber?: number;
  chapterTitle?: string;
  sectionNumber?: string;
  sectionTitle: string;
  fullTitle: string;
  numberingPrefix: string;
}

export interface ChapterDocument {
  title: string;
  cleanTitle: string;
  slug: string;
  bookTitle?: string;
  bookSlug?: string;
  colSlug?: string;
  author?: string;
  courseName?: string;
  metadata?: ChapterCanonicalMetadata;
  blocks: SemanticBlock[];
  images: ChapterImageItem[];
  rawMdx?: string;
}

export interface ChapterLatexConfig {
  documentclass: 'ctexbook' | 'ctexart';
  paperSize: 'a4' | 'b5';
  fontSize: 10 | 10.5 | 11 | 12;
  typography?: 'scholarly' | 'classic' | 'mathematical' | 'lecture' | string;
  resolutionMode?: 'deterministic' | 'adaptive';
  fontFamily?: 'serif' | 'sans';

  mathFont?: 'typst' | 'modern' | 'times' | 'pagella';

  cjkFont?: 'default' | 'sourcehan' | 'song' | 'kai' | string;
  numberingDepth: number;
  showToc: boolean;
  author?: string;
  courseName?: string;
  bookTitle?: string;
  title?: string;
  date?: string;
  headerMode: 'standard' | 'compact' | 'none';
}
