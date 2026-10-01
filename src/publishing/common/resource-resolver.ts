import fs from 'node:fs';
import path from 'node:path';
import type { ChapterImageItem } from '../../types/chapter-semantic';

export interface ResolvedAsset {
  originalUrl: string;
  localPath: string;
  targetPath: string;
  safeLatexPath: string;
}

const ROOT = path.resolve(process.cwd());

export function getChapterStylePath(): string {
  const candidate = path.join(ROOT, 'src', 'publishing', 'latex', 'templates', 'astrolib-chapter.sty');
  if (fs.existsSync(candidate)) return candidate;
  return path.resolve(ROOT, 'templates', 'astrolib-chapter.sty');
}

export function getChapterStyleSource(): string {
  const styPath = getChapterStylePath();
  if (fs.existsSync(styPath)) {
    return fs.readFileSync(styPath, 'utf8');
  }
  return '% astrolib-chapter.sty not found on disk\n';
}

export function normalizeLatexPath(filePath: string): string {
  return filePath.replace(/\\/g, '/');
}

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

    const candidatePaths: string[] = [];

    if (img.localPath && fs.existsSync(img.localPath)) {
      candidatePaths.push(img.localPath);
    }

    const cleanRel = rawUrl.replace(/^\.\//, '');
    candidatePaths.push(path.resolve(chapterDir, cleanRel));
    candidatePaths.push(path.resolve(chapterDir, 'images', path.basename(cleanRel)));

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
