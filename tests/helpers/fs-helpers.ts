import fs from 'node:fs';
import path from 'node:path';

/**
 * 递归遍历目录下的全部文件
 */
export function walkFiles(dir: string, filter?: (filePath: string) => boolean): string[] {
  if (!fs.existsSync(dir)) return [];
  const results: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkFiles(full, filter));
    } else if (entry.isFile()) {
      if (!filter || filter(full)) {
        results.push(full);
      }
    }
  }

  return results;
}
