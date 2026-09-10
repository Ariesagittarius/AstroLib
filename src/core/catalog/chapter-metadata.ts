/**
 * src/core/catalog/chapter-metadata.ts
 * 教材章节权威层级元数据解析器 (Canonical Chapter Metadata Resolver)
 *
 * 架构规范：
 * - 归属于 Core / Catalog 领域层 (Layer 1/2)
 * - 纯领域逻辑，负责结合 collections.config.mjs、题库映射与文件 Frontmatter，
 *   为章节生成绝对权威的章号、大章名称、节号与动态计数器前缀。
 * - 严格遵循 Rule 1 (UI is not a domain model) & Rule 2 (Publishing is independent):
 *   Publishing 仅作为该元数据的消费者，绝不负责反向推断章节语义。
 */

import fs from 'node:fs';
import path from 'node:path';
import { collections } from '../../config/collections.config.mjs';
import type { ChapterCanonicalMetadata } from '../../types/chapter-semantic';

// 内存缓存：避免重复读取磁盘与题库 JSON
const metadataCache = new Map<string, ChapterCanonicalMetadata>();
const exerciseJsonCache = new Map<string, any>();

/**
 * 清洗标题字符串中的特殊控制字符与首尾空格
 */
function cleanString(str: string): string {
  if (!str) return '';
  return str.replace(/['"]/g, '').trim();
}

/**
 * 尝试从题库映射数据中读取权威章节元数据
 */
function tryLookupExerciseMapping(bookSlug: string, sectionSlug: string): {
  chapterNumber?: number;
  chapterTitle?: string;
  sectionNumber?: string;
  sectionTitle?: string;
} | null {
  if (!bookSlug || !sectionSlug) return null;

  try {
    let exerciseData = exerciseJsonCache.get(bookSlug);
    if (!exerciseData) {
      // 检查可能存在的题库文件
      const candidatePaths = [
        path.resolve(process.cwd(), `src/data/exercises/${bookSlug}_textbook_exercises.json`),
        path.resolve(process.cwd(), `src/data/exercises/${bookSlug.replace(/_/g, '-')}_textbook_exercises.json`),
      ];

      for (const p of candidatePaths) {
        if (fs.existsSync(p)) {
          const raw = fs.readFileSync(p, 'utf8');
          exerciseData = JSON.parse(raw);
          exerciseJsonCache.set(bookSlug, exerciseData);
          break;
        }
      }
    }

    if (!exerciseData || !exerciseData.chapters) return null;

    const targetClean = sectionSlug.replace(/_/g, ' ').trim();

    for (const [chKey, questions] of Object.entries(exerciseData.chapters)) {
      if (!Array.isArray(questions)) continue;
      for (const q of questions) {
        const mapping = q.mapping?.[bookSlug] || q.mapping?.engineering_analysis;
        if (!mapping) continue;

        if (
          mapping.section_slug === sectionSlug ||
          mapping.section_slug?.replace(/_/g, ' ') === targetClean ||
          mapping.section_title === targetClean ||
          mapping.section === sectionSlug.split('_')[0]
        ) {
          const chNum = typeof mapping.chapter === 'number' ? mapping.chapter : parseInt(chKey, 10);
          return {
            chapterNumber: !isNaN(chNum) ? chNum : undefined,
            chapterTitle: mapping.chapter_title || `第${chKey}章`,
            sectionNumber: mapping.section,
            sectionTitle: mapping.section_title,
          };
        }
      }
    }
  } catch (err) {
    // 忽略读取错误，自动降级至命名规范解析
  }

  return null;
}

export interface ResolveChapterMetadataInput {
  slug: string;
  colSlug?: string;
  bookSlug?: string;
  bookTitle?: string;
  bookAuthor?: string;
  rawTitle?: string;
  filePath?: string;
}

/**
 * 权威解析教材章节层级元数据
 */
export function resolveChapterCanonicalMetadata(
  input: ResolveChapterMetadataInput
): ChapterCanonicalMetadata {
  const cacheKey = `${input.colSlug || ''}:${input.bookSlug || ''}:${input.slug}`;
  if (metadataCache.has(cacheKey)) {
    return metadataCache.get(cacheKey)!;
  }

  let colSlug = input.colSlug || '';
  let bookSlug = input.bookSlug || '';
  let bookTitle = input.bookTitle || '';
  let bookAuthor = input.bookAuthor || '';

  // 1. 若缺少书籍信息，从 collections.config.mjs 权威查询
  if ((!bookTitle || !bookAuthor) && bookSlug) {
    for (const col of collections) {
      const b = col.books.find((item) => item.slug === bookSlug || item.id === bookSlug);
      if (b) {
        if (!colSlug) colSlug = col.slug;
        if (!bookTitle) bookTitle = b.title;
        if (!bookAuthor) bookAuthor = b.author || '';
        break;
      }
    }
  }

  // 2. 尝试从既有教材题库映射中提取最高精度的章号与章名
  const fromMapping = tryLookupExerciseMapping(bookSlug, input.slug);

  let chapterNumber = fromMapping?.chapterNumber;
  let chapterTitle = fromMapping?.chapterTitle;
  let sectionNumber = fromMapping?.sectionNumber;
  let sectionTitle = fromMapping?.sectionTitle;

  const baseTitle = cleanString(input.rawTitle || input.slug.replace(/_/g, ' '));

  // 3. 若无映射，使用规范正则表达式解析标题与文件名
  if (!sectionNumber || !chapterNumber) {
    // 形如 "2.2 求导的基本法则" 或 "10.1 定积分概念"
    const matchSec = baseTitle.match(/^(\d+)\.(\d+)[\s_]*(.*)$/);
    if (matchSec) {
      if (!chapterNumber) chapterNumber = parseInt(matchSec[1], 10);
      if (!sectionNumber) sectionNumber = `${matchSec[1]}.${matchSec[2]}`;
      if (!sectionTitle) sectionTitle = matchSec[3].trim();
    } else {
      // 形如 "第2章 一元函数微分学" 或 "02 导数"
      const matchCh = baseTitle.match(/^(?:第)?(\d+)[章节讲部分\s_]+(.*)$/);
      if (matchCh) {
        if (!chapterNumber) chapterNumber = parseInt(matchCh[1], 10);
        if (!sectionTitle) sectionTitle = matchCh[2].trim();
      } else {
        sectionTitle = baseTitle;
      }
    }
  }

  if (!sectionTitle) {
    sectionTitle = baseTitle;
  }

  // 补全大章标题
  if (!chapterTitle && chapterNumber) {
    chapterTitle = `第 ${chapterNumber} 章`;
  }

  // 4. 动态计算节内编号前缀 numberingPrefix（绝不硬编码！）
  // 针对例如 "2.2 求导的基本法则"：
  // 节内的小节标题在教材原文中通常为 "2.1 ...", "2.2 ...", 定理为 "定理 2.1", "定理 2.2"
  // 其中前缀 '2.' 正对应当前节号在教材中的次级编号 (minor number: 2)
  let numberingPrefix = '1.';
  if (sectionNumber) {
    const parts = sectionNumber.split('.');
    if (parts.length >= 2 && parts[1]) {
      numberingPrefix = `${parts[1]}.`;
    } else if (parts.length >= 1 && parts[0]) {
      numberingPrefix = `${parts[0]}.`;
    }
  } else if (chapterNumber) {
    numberingPrefix = `${chapterNumber}.`;
  }

  const fullTitle = sectionNumber && !sectionTitle.startsWith(sectionNumber)
    ? `${sectionNumber} ${sectionTitle}`
    : sectionTitle;

  const result: ChapterCanonicalMetadata = {
    colSlug,
    bookSlug,
    bookTitle: bookTitle || 'AstroLib 学术教材',
    bookAuthor: bookAuthor || 'AstroLib',
    chapterNumber,
    chapterTitle,
    sectionNumber,
    sectionTitle,
    fullTitle,
    numberingPrefix,
  };

  metadataCache.set(cacheKey, result);
  return result;
}
