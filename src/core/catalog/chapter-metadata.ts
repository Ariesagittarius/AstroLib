import fs from 'node:fs';
import path from 'node:path';
import { collections } from '../../config/collections.config.mjs';
import type { ChapterCanonicalMetadata } from '../../types/chapter-semantic';

const metadataCache = new Map<string, ChapterCanonicalMetadata>();
const exerciseJsonCache = new Map<string, any>();

function cleanString(str: string): string {
  if (!str) return '';
  return str.replace(/['"]/g, '').trim();
}

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

  const fromMapping = tryLookupExerciseMapping(bookSlug, input.slug);

  let chapterNumber = fromMapping?.chapterNumber;
  let chapterTitle = fromMapping?.chapterTitle;
  let sectionNumber = fromMapping?.sectionNumber;
  let sectionTitle = fromMapping?.sectionTitle;

  const baseTitle = cleanString(input.rawTitle || input.slug.replace(/_/g, ' '));

  if (!sectionNumber || !chapterNumber) {

    const matchSec = baseTitle.match(/^(\d+)\.(\d+)[\s_]*(.*)$/);
    if (matchSec) {
      if (!chapterNumber) chapterNumber = parseInt(matchSec[1], 10);
      if (!sectionNumber) sectionNumber = `${matchSec[1]}.${matchSec[2]}`;
      if (!sectionTitle) sectionTitle = matchSec[3].trim();
    } else {

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

  if (!chapterTitle && chapterNumber) {
    chapterTitle = `第 ${chapterNumber} 章`;
  }

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
