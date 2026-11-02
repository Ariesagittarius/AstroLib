/**
 * src/server/plugins/doc-ingestion/types.ts
 * ============================================================================
 * AstroLib MinerU 文档摄取与自动解析系统类型定义
 * ============================================================================
 */

export type IngestEngineType = 'api' | 'agent' | 'local';

export type TaskStatus =
  | 'idle'
  | 'uploading'
  | 'waiting-file'
  | 'pending'
  | 'processing'
  | 'downloading'
  | 'unpacking'
  | 'completed'
  | 'failed';

export interface LayoutBlock {
  id: string;
  type: 'title' | 'text' | 'equation' | 'image' | 'table' | 'header' | 'footer' | 'figure' | 'list' | 'aside';
  pageIndex: number;
  bbox: [number, number, number, number]; // [x0, y0, x1, y1] (72 DPI pt or normalized)
  pageWidth?: number;
  pageHeight?: number;
  text?: string;
  html?: string;
  htmlContent?: string;
  markdownRefId?: string;
  caption?: string;
  level?: number;
}

export interface IngestTaskMeta {
  taskId: string;
  fileName: string;
  fileSize: number;
  pageCount: number;
  pageRanges?: string; // 如 "1-20"
  engine: IngestEngineType;
  status: TaskStatus;
  progress: number; // 0 - 100
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
  error?: string;
  batchId?: string;
  fullZipUrl?: string;
  outputDir: string;
  hasImages: boolean;
  imageCount: number;
}

export interface ParseResultResponse {
  taskId: string;
  fileName: string;
  pageCount: number;
  markdown: string;
  layoutBlocks: LayoutBlock[];
  images: string[];
  status: TaskStatus;
  engine: IngestEngineType;
  durationMs?: number;
}
