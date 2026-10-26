export interface DocumentMetadata {
  title: string;
  description?: string;
  author?: string;
  subject?: string;
  tags?: string[];
  date?: string;
  [key: string]: any;
}

export type WorkspaceViewMode = 'split' | 'preview' | 'edit';

export interface ScratchpadDraft {
  metadata: DocumentMetadata;
  rawFrontmatter: string;
  content: string;
  lastSaved: number;
}

export interface TemplatePreset {
  id: string;
  title: string;
  description: string;
  badge?: string;
  category: 'translation' | 'math' | 'diagram' | 'cards' | 'blank';
  draft: {
    metadata: DocumentMetadata;
    content: string;
  };
}

export interface ParsedHeadingItem {
  id: string;
  text: string;
  level: number;
}

export interface ParsedDocument {
  metadata: DocumentMetadata;
  rawFrontmatter: string;
  body: string;
  html: string;
  headings: ParsedHeadingItem[];
}
