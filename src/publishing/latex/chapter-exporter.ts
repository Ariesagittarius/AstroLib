import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ChapterDocument } from '../../types/chapter-semantic';
import {
  type ChapterExportSettings,
  DEFAULT_CHAPTER_EXPORT_SETTINGS,
} from '../common/export-settings.ts';
import {
  resolveChapterAssets,
  getChapterStyleSource,
} from '../common/resource-resolver.ts';
import { parseMdxChapter } from '../common/mdx-chapter-parser.ts';
import {
  renderChapterLatexDocument,
  stripLeadingNumber,
} from './latex-generator.ts';
import { createZip } from '../../../scripts/epub/zip.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../..');

export interface ChapterExportAsset {
  name: string;
  localPath: string;
  targetPath: string;
}

export interface ChapterExportResult {
  tex: string;
  assets: ChapterExportAsset[];
  styleSource: string;
  title: string;
  cleanTitle: string;
  filename: string;
  doc: ChapterDocument;
}

export interface ExportChapterOptions {
  mdxSource: string;
  slug?: string;
  bookSlug?: string;
  colSlug?: string;
  bookTitle?: string;
  courseName?: string;
  latexConfig?: Partial<ChapterExportSettings & { embedStyle?: boolean }>;
}

export function exportChapterToLatex(options: ExportChapterOptions): ChapterExportResult {
  const {
    mdxSource,
    slug = 'chapter',
    bookSlug = '',
    colSlug = '',
    bookTitle = '',
    courseName = '',
    latexConfig = {},
  } = options;

  const doc = parseMdxChapter(mdxSource, {
    slug,
    bookSlug,
    colSlug,
    bookTitle,
    courseName,
  });

  const chapterDir = colSlug && bookSlug
    ? path.join(ROOT, 'src', 'content', 'docs', 'collections', colSlug, bookSlug)
    : ROOT;
  const resolvedAssets = resolveChapterAssets(doc.images, chapterDir);
  const assets: ChapterExportAsset[] = resolvedAssets.map((a) => ({
    name: path.basename(a.targetPath),
    localPath: a.localPath,
    targetPath: a.targetPath,
  }));

  const tex = renderChapterLatexDocument(doc, {
    ...DEFAULT_CHAPTER_EXPORT_SETTINGS,
    ...latexConfig,
    title: latexConfig.title || doc.title,
    author: latexConfig.author || doc.author,
  });

  const styleSource = getChapterStyleSource();
  const cleanTitle = stripLeadingNumber(doc.title) || doc.title;
  const safeFilenameTitle = cleanTitle.replace(/[^\w\u4e00-\u9fa5\-]/g, '_').replace(/_+/g, '_');
  const filename = `chapter_${safeFilenameTitle}.tex`;

  return {
    tex,
    assets,
    styleSource,
    title: doc.title,
    cleanTitle,
    filename,
    doc,
  };
}

export function createChapterZipPackage(exportResult: ChapterExportResult): Buffer {
  const entries: Array<{ name: string; data: Buffer | string }> = [];

  entries.push({
    name: 'chapter.tex',
    data: Buffer.from(exportResult.tex, 'utf8'),
  });

  entries.push({
    name: 'astrolib-chapter.sty',
    data: Buffer.from(exportResult.styleSource, 'utf8'),
  });

  for (const asset of exportResult.assets) {
    if (fs.existsSync(asset.localPath)) {
      try {
        const imgBuf = fs.readFileSync(asset.localPath);
        entries.push({
          name: asset.targetPath,
          data: imgBuf,
        });
      } catch (err) {
        console.warn(`[chapter-exporter] 读取图片失败 ${asset.localPath}:`, err);
      }
    }
  }

  return createZip(entries);
}
