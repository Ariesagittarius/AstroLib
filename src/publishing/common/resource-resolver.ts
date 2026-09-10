/**
 * src/publishing/common/resource-resolver.ts
 * AstroLib 统一发布资源解析器 (Publishing Resource Resolver)
 *
 * 架构规范：
 * - 归属于 Publishing Domain Common 层 (Layer 3)
 * - 负责本地宏包模版、章节插图、静态公共资源的统一定位与路径标准化
 * - 坚持 Chapter-scoped 资源解析原则：精确解析当前章节所需的依赖文件
 * - 跨平台支持：保证 Windows 与 Linux/GitHub Actions 下路径分隔符与相对查找一致
 */

import fs from 'node:fs';
import path from 'node:path';
import type { ChapterImageItem } from '../../types/chapter-semantic';

export interface ResolvedAsset {
  originalUrl: string;
  localPath: string;
  targetPath: string; // 在导出目标目录中的相对路径 (如 assets/01.jpg)
  safeLatexPath: string; // 在 LaTeX \includegraphics 中使用的标准路径 (正斜杠)
}

const ROOT = path.resolve(process.cwd());

/**
 * 获取 astrolib-chapter.sty 官方宏包模版路径
 */
export function getChapterStylePath(): string {
  const candidate = path.join(ROOT, 'src', 'publishing', 'latex', 'templates', 'astrolib-chapter.sty');
  if (fs.existsSync(candidate)) return candidate;
  return path.resolve(ROOT, 'templates', 'astrolib-chapter.sty');
}

/**
 * 获取 astrolib-chapter.sty 宏包源码文本
 */
export function getChapterStyleSource(): string {
  const styPath = getChapterStylePath();
  if (fs.existsSync(styPath)) {
    return fs.readFileSync(styPath, 'utf8');
  }
  return '% astrolib-chapter.sty not found on disk\n';
}

/**
 * 规范化 LaTeX 路径为 POSIX 正斜杠格式，避免 Windows 反斜杠转义灾难
 */
export function normalizeLatexPath(filePath: string): string {
  return filePath.replace(/\\/g, '/');
}

/**
 * 针对指定章节精确执行 Chapter-scoped 依赖图解析
 * 仅收集当前章节实际引用的插图资产，绝不无故全量拷贝整书
 */
export function resolveChapterAssets(
  images: ChapterImageItem[],
  chapterDir: string
): ResolvedAsset[] {
  const resolved: ResolvedAsset[] = [];
  const seenUrls = new Set<string>();

  for (const img of images) {
    const rawUrl = img.url || img.originalPath || '';
    if (!rawUrl || seenUrls.has(rawUrl)) continue;
    seenUrls.add(rawUrl);

    // 候选物理路径查找列表（按匹配优先级排序）
    const candidatePaths: string[] = [];

    // 1. 如果已有 localPath
    if (img.localPath && fs.existsSync(img.localPath)) {
      candidatePaths.push(img.localPath);
    }

    // 2. 相对章节所在目录解析 (如 ./images/xxx.jpg 或 images/xxx.jpg)
    const cleanRel = rawUrl.replace(/^\.\//, '');
    candidatePaths.push(path.resolve(chapterDir, cleanRel));
    candidatePaths.push(path.resolve(chapterDir, 'images', path.basename(cleanRel)));

    // 3. 相对 public 目录解析 (如 /covers/xxx.jpg)
    candidatePaths.push(path.resolve(ROOT, 'public', cleanRel.replace(/^\//, '')));
    candidatePaths.push(path.resolve(ROOT, cleanRel.replace(/^\//, '')));

    let foundLocalPath: string | null = null;
    for (const cand of candidatePaths) {
      if (fs.existsSync(cand) && fs.statSync(cand).isFile()) {
        foundLocalPath = cand;
        break;
      }
    }

    if (foundLocalPath) {
      const baseFilename = path.basename(foundLocalPath);
      // 统一归档至 assets/ 目录下
      const targetPath = `assets/${baseFilename}`;
      resolved.push({
        originalUrl: rawUrl,
        localPath: foundLocalPath,
        targetPath,
        safeLatexPath: normalizeLatexPath(targetPath),
      });
    }
  }

  return resolved;
}
