import fs from 'node:fs';
import path from 'node:path';
import { MineruApiClient } from './mineru-api-client.ts';
import { LocalPipelineRunner } from './local-runner.ts';
import { compileIngestAST } from './ast-compiler.ts';
import type {
  IngestEngineType,
  IngestTaskMeta,
  LayoutBlock,
  ParseResultResponse,
  TaskStatus,
} from './types.ts';

export class TaskManager {
  private static instance: TaskManager | null = null;
  private readonly baseDir: string;
  private mineruClient: MineruApiClient;
  private localRunner: LocalPipelineRunner;
  private activeJobs = new Map<string, Promise<void>>();

  private constructor() {
    this.baseDir = path.resolve(process.cwd(), 'task/ingest');
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
    this.mineruClient = new MineruApiClient();
    this.localRunner = new LocalPipelineRunner();
  }

  public static getInstance(): TaskManager {
    if (!TaskManager.instance) {
      TaskManager.instance = new TaskManager();
    }
    return TaskManager.instance;
  }

  public getBaseDir(): string {
    return this.baseDir;
  }

  public getApiClient(): MineruApiClient {
    return this.mineruClient;
  }

  public getLocalRunner(): LocalPipelineRunner {
    return this.localRunner;
  }

  public countPdfPages(buffer: Buffer): number {
    const raw = buffer.toString('latin1');

    const dictRegex = /<<([^>]+)>>/g;
    let maxPagesCount = 0;
    let match: RegExpExecArray | null;
    while ((match = dictRegex.exec(raw)) !== null) {
      const dictContent = match[1];
      if (/\/Type\s*\/Pages\b/.test(dictContent)) {
        const countM = dictContent.match(/\/Count\s+(\d+)/);
        if (countM) {
          const c = parseInt(countM[1], 10);
          if (c > maxPagesCount) maxPagesCount = c;
        }
      }
    }
    if (maxPagesCount > 0) return maxPagesCount;

    const pageMatches = raw.match(/\/Type\s*\/Page\b/g);
    if (pageMatches && pageMatches.length > 0) {
      return pageMatches.length;
    }

    const allCounts = [...raw.matchAll(/\/Count\s+(\d+)/g)].map((m) => parseInt(m[1], 10)).filter((n) => !isNaN(n));
    if (allCounts.length > 0) {
      return Math.max(...allCounts);
    }
    return 1;
  }

  public async createTask(
    fileName: string,
    fileBuffer: Buffer,
    options: { engine?: IngestEngineType; pageRanges?: string } = {}
  ): Promise<IngestTaskMeta> {
    const sanitizedName = path.basename(fileName).replace(/[^a-zA-Z0-9_\u4e00-\u9fa5\.\-\s]/g, '_');
    const taskId = `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const taskDir = path.join(this.baseDir, taskId);
    fs.mkdirSync(taskDir, { recursive: true });

    const pdfPath = path.join(taskDir, 'origin.pdf');
    fs.writeFileSync(pdfPath, fileBuffer);

    const pageCount = this.countPdfPages(fileBuffer);
    const engine: IngestEngineType = options.engine || 'api';

    const meta: IngestTaskMeta = {
      taskId,
      fileName: sanitizedName,
      fileSize: fileBuffer.length,
      pageCount,
      pageRanges: options.pageRanges?.trim() || undefined,
      engine,
      status: 'idle',
      progress: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      outputDir: taskDir,
      hasImages: false,
      imageCount: 0,
    };

    this.saveTaskMeta(meta);
    return meta;
  }

  public startParse(taskId: string, engine?: IngestEngineType): IngestTaskMeta {
    const meta = this.getTask(taskId);
    if (!meta) {
      throw new Error(`找不到任务 ${taskId}`);
    }

    if (engine) {
      meta.engine = engine;
    }

    if (this.activeJobs.has(taskId)) {
      return meta;
    }

    meta.status = 'uploading';
    meta.progress = 5;
    meta.error = undefined;
    meta.updatedAt = Date.now();
    this.saveTaskMeta(meta);

    const jobPromise = (async () => {
      try {
        if (meta.engine === 'api') {
          await this.executeApiParse(meta);
        } else if (meta.engine === 'agent') {
          await this.executeAgentParse(meta);
        } else {
          await this.executeLocalParse(meta);
        }
      } catch (err) {
        meta.status = 'failed';
        meta.error = err instanceof Error ? err.message : String(err);
        meta.updatedAt = Date.now();
        this.saveTaskMeta(meta);
      } finally {
        this.activeJobs.delete(taskId);
      }
    })();

    this.activeJobs.set(taskId, jobPromise);
    return meta;
  }

  private async executeApiParse(meta: IngestTaskMeta): Promise<void> {
    const taskDir = meta.outputDir;
    const pdfPath = path.join(taskDir, 'origin.pdf');
    const unpackedDir = path.join(taskDir, 'unpacked');

    meta.status = 'uploading';
    meta.progress = 10;
    this.saveTaskMeta(meta);

    const { batchId, fileUrl } = await this.mineruClient.requestBatchUploadUrls(
      meta.fileName,
      meta.taskId,
      {
        modelVersion: 'vlm',
        pageRanges: meta.pageRanges,
      }
    );

    meta.batchId = batchId;
    meta.status = 'waiting-file';
    meta.progress = 20;
    this.saveTaskMeta(meta);

    await this.mineruClient.uploadFileToPreSignedUrl(fileUrl, pdfPath);

    meta.status = 'processing';
    meta.progress = 30;
    this.saveTaskMeta(meta);

    const { fullZipUrl } = await this.mineruClient.pollBatchStatus(batchId, {
      intervalMs: 2500,
      onProgress: (state) => {
        if (state === 'pending') {
          meta.status = 'pending';
          meta.progress = 40;
        } else if (state === 'processing') {
          meta.status = 'processing';
          meta.progress = Math.min(85, (meta.progress || 40) + 5);
        }
        meta.updatedAt = Date.now();
        this.saveTaskMeta(meta);
      },
    });

    meta.fullZipUrl = fullZipUrl;
    meta.status = 'downloading';
    meta.progress = 88;
    this.saveTaskMeta(meta);

    await this.mineruClient.downloadAndExtractZip(fullZipUrl, unpackedDir);

    meta.status = 'unpacking';
    meta.progress = 95;
    this.saveTaskMeta(meta);

    this.finalizeUnpackedArtifacts(meta, unpackedDir);

    meta.status = 'completed';
    meta.progress = 100;
    meta.error = undefined;
    meta.completedAt = Date.now();
    meta.updatedAt = Date.now();
    this.saveTaskMeta(meta);
  }

  private async executeAgentParse(meta: IngestTaskMeta): Promise<void> {
    const taskDir = meta.outputDir;
    const pdfPath = path.join(taskDir, 'origin.pdf');
    const unpackedDir = path.join(taskDir, 'unpacked');

    meta.status = 'processing';
    meta.progress = 20;
    this.saveTaskMeta(meta);

    const { markdown } = await this.mineruClient.parseWithAgentApi(pdfPath, {
      onProgress: (msg: string) => {
        meta.progress = Math.min(85, (meta.progress || 20) + 15);
        meta.updatedAt = Date.now();
        this.saveTaskMeta(meta);
      },
    });

    if (!fs.existsSync(unpackedDir)) {
      fs.mkdirSync(unpackedDir, { recursive: true });
    }

    const mdPath = path.join(unpackedDir, 'full.md');
    fs.writeFileSync(mdPath, markdown, 'utf-8');

    meta.status = 'completed';
    meta.progress = 100;
    meta.error = undefined;
    meta.completedAt = Date.now();
    meta.updatedAt = Date.now();
    this.saveTaskMeta(meta);
  }

  private async executeLocalParse(meta: IngestTaskMeta): Promise<void> {
    const taskDir = meta.outputDir;
    const pdfPath = path.join(taskDir, 'origin.pdf');
    const unpackedDir = path.join(taskDir, 'unpacked');

    meta.status = 'processing';
    meta.progress = 25;
    this.saveTaskMeta(meta);

    await this.localRunner.runPipeline(pdfPath, unpackedDir, (msg) => {
      meta.progress = Math.min(90, (meta.progress || 25) + 10);
      meta.updatedAt = Date.now();
      this.saveTaskMeta(meta);
    });

    this.finalizeUnpackedArtifacts(meta, unpackedDir);

    meta.status = 'completed';
    meta.progress = 100;
    meta.error = undefined;
    meta.completedAt = Date.now();
    meta.updatedAt = Date.now();
    this.saveTaskMeta(meta);
  }

  private finalizeUnpackedArtifacts(meta: IngestTaskMeta, unpackedDir: string): void {

    const findMdFile = (dir: string): string | null => {
      if (!fs.existsSync(dir)) return null;
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const ent of entries) {
        const full = path.join(dir, ent.name);
        if (ent.isFile() && ent.name.toLowerCase() === 'full.md') {
          return full;
        }
      }
      for (const ent of entries) {
        const full = path.join(dir, ent.name);
        if (ent.isFile() && ent.name.endsWith('.md')) {
          return full;
        }
        if (ent.isDirectory()) {
          const res = findMdFile(full);
          if (res) return res;
        }
      }
      return null;
    };

    const targetMd = findMdFile(unpackedDir);
    if (targetMd) {
      const parentDir = path.dirname(targetMd);
      const imagesDir = path.join(parentDir, 'images');
      if (fs.existsSync(imagesDir)) {
        const imgs = fs.readdirSync(imagesDir);
        meta.hasImages = imgs.length > 0;
        meta.imageCount = imgs.length;
      }
    }
  }

  public getTask(taskId: string): IngestTaskMeta | null {
    const metaPath = path.join(this.baseDir, taskId, 'meta.json');
    if (!fs.existsSync(metaPath)) return null;
    try {
      return JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
    } catch {
      return null;
    }
  }

  public getResult(taskId: string): ParseResultResponse | null {
    const meta = this.getTask(taskId);
    if (!meta || meta.status !== 'completed') return null;

    const taskDir = path.join(this.baseDir, taskId);
    const unpackedDir = path.join(taskDir, 'unpacked');

    let markdown = '';
    let targetDir = unpackedDir;

    const findArtifacts = (dir: string) => {
      if (!fs.existsSync(dir)) return;
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const ent of entries) {
        const p = path.join(dir, ent.name);
        if (ent.isFile() && ent.name.toLowerCase() === 'full.md' && !markdown) {
          markdown = fs.readFileSync(p, 'utf-8');
          targetDir = dir;
        }
      }
      if (!markdown) {
        for (const ent of entries) {
          const p = path.join(dir, ent.name);
          if (ent.isFile() && ent.name.endsWith('.md') && !markdown) {
            markdown = fs.readFileSync(p, 'utf-8');
            targetDir = dir;
          } else if (ent.isDirectory()) {
            findArtifacts(p);
          }
        }
      }
    };

    findArtifacts(unpackedDir);

    const images: string[] = [];
    const imagesDir = path.join(targetDir, 'images');
    if (fs.existsSync(imagesDir)) {
      const imgFiles = fs.readdirSync(imagesDir);
      for (const f of imgFiles) {
        if (/\.(png|jpe?g|webp|svg)$/i.test(f)) {
          images.push(f);
        }
      }
    }

    const layoutBlocks = this.extractLayoutBlocks(targetDir, meta.taskId);

    return {
      taskId: meta.taskId,
      fileName: meta.fileName,
      pageCount: meta.pageCount,
      markdown,
      layoutBlocks,
      images,
      status: meta.status,
      engine: meta.engine,
      durationMs: meta.completedAt && meta.createdAt ? meta.completedAt - meta.createdAt : undefined,
    };
  }

  private extractLayoutBlocks(targetDir: string, taskId: string): LayoutBlock[] {
    return compileIngestAST(targetDir, taskId);
  }

  public async exportToCollection(
    taskId: string,
    collectionSlug: string,
    bookSlug: string,
    bookTitle: string
  ): Promise<{ success: boolean; outDir: string; chapterCount: number }> {
    const result = this.getResult(taskId);
    if (!result || !result.markdown) {
      throw new Error('未找到该任务的解析成果 Markdown');
    }

    const colDir = path.resolve(process.cwd(), `src/content/docs/collections/${collectionSlug}`);
    if (!fs.existsSync(colDir)) {
      fs.mkdirSync(colDir, { recursive: true });
    }

    const bookDir = path.join(colDir, bookSlug);
    if (!fs.existsSync(bookDir)) {
      fs.mkdirSync(bookDir, { recursive: true });
    }

    const bookImagesDir = path.join(bookDir, 'images');
    if (!fs.existsSync(bookImagesDir)) {
      fs.mkdirSync(bookImagesDir, { recursive: true });
    }

    const taskDir = path.join(this.baseDir, taskId);
    const unpackedDir = path.join(taskDir, 'unpacked');

    const copyImages = (dir: string) => {
      if (!fs.existsSync(dir)) return;
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const ent of entries) {
        const p = path.join(dir, ent.name);
        if (ent.isDirectory() && ent.name.toLowerCase() === 'images') {
          const files = fs.readdirSync(p);
          for (const f of files) {
            fs.copyFileSync(path.join(p, f), path.join(bookImagesDir, f));
          }
          return;
        } else if (ent.isDirectory()) {
          copyImages(p);
        }
      }
    };
    copyImages(unpackedDir);

    const safeMdx = this.escapeMdxContent(result.markdown);

    const mainChapterPath = path.join(bookDir, '01_全文研判.mdx');
    const mdxHeader = `---
title: "${bookTitle}"
description: "由 MinerU 智能解析与规整的学术文献"
---

`;
    fs.writeFileSync(mainChapterPath, mdxHeader + safeMdx, 'utf-8');

    return {
      success: true,
      outDir: bookDir,
      chapterCount: 1,
    };
  }

  private escapeMdxContent(content: string): string {

    const mathTokens: string[] = [];
    let tokenized = content.replace(/\$\$[\s\S]*?\$\$|\$[^\$\n]+?\$/g, (match) => {
      mathTokens.push(match);
      return `___MATH_TOKEN_${mathTokens.length - 1}___`;
    });

    tokenized = tokenized.replace(/\{/g, '&#123;').replace(/\}/g, '&#125;');
    tokenized = tokenized.replace(/(\d+)~(\d+)/g, '$1～$2');

    const restored = tokenized.replace(/___MATH_TOKEN_(\d+)___/g, (_, idx) => {
      return mathTokens[parseInt(idx, 10)] || '';
    });

    return restored;
  }

  private saveTaskMeta(meta: IngestTaskMeta): void {
    const metaPath = path.join(this.baseDir, meta.taskId, 'meta.json');
    fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf-8');
  }
}
