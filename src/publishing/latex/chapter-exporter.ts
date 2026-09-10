/**
 * src/publishing/latex/chapter-exporter.ts
 * AstroLib Publishing 层：教材章节 LaTeX 导出统一门面与调度 API
 *
 * 遵循架构规范：
 * - 纯 Publishing 服务，无 DOM/UI 依赖
 * - 串联 Processing (parseMdxChapter) 与 Renderer (renderChapterLatexDocument)
 * - 收集章节关联静态图示资源，提供独立 .tex 源码及完整离线编译 .zip 包
 */

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
  targetPath: string; // 在输出目录/ZIP 中的相对路径，如 assets/fig-01.png
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

/**
 * 统一章节 LaTeX 导出主接口
 */
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

  // 1. Processing 层：将 MDX 解析为语义领域模型 (自动挂载 canonical metadata)
  const doc = parseMdxChapter(mdxSource, {
    slug,
    bookSlug,
    colSlug,
    bookTitle,
    courseName,
  });

  // 2. Resource Resolver：使用 Chapter-scoped 依赖图解析器收集插图
  const chapterDir = colSlug && bookSlug
    ? path.join(ROOT, 'src', 'content', 'docs', 'collections', colSlug, bookSlug)
    : ROOT;
  const resolvedAssets = resolveChapterAssets(doc.images, chapterDir);
  const assets: ChapterExportAsset[] = resolvedAssets.map((a) => ({
    name: path.basename(a.targetPath),
    localPath: a.localPath,
    targetPath: a.targetPath,
  }));

  // 3. Publishing 渲染层：将语义数据模型输出为纯正 LaTeX 源码 (ctexart + adjustbox)
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

/**
 * 将章节导出产物一键打包为可直接独立编译的 ZIP 归档包
 * 包含：chapter.tex、astrolib-chapter.sty 宏包以及 assets/ 目录下的所有插图
 */
export function createChapterZipPackage(exportResult: ChapterExportResult): Buffer {
  const entries: Array<{ name: string; data: Buffer | string }> = [];

  // 1. LaTeX 主文件
  entries.push({
    name: 'chapter.tex',
    data: Buffer.from(exportResult.tex, 'utf8'),
  });

  // 2. 学术样式宏包
  entries.push({
    name: 'astrolib-chapter.sty',
    data: Buffer.from(exportResult.styleSource, 'utf8'),
  });

  // 3. 所有配图
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
