import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { collections } from '../../src/config/collections.config.ts';
import { BilingualAlignerClient } from '../../src/services/bilingual/aligner-client.ts';
import { BipartiteMatcher } from '../../src/services/bilingual/bipartite-matcher.ts';
import type { ParagraphToken } from '../../src/services/bilingual/types.ts';

describe('Bilingual Algorithms Book Contract', () => {
  const csCol = collections.find((c) => c.slug === 'cs');
  const algorithmsBook = csCol?.books.find((b) => b.slug === 'algorithms');

  it('declares bilingual configuration for algorithms', () => {
    expect(algorithmsBook).toBeDefined();
    expect(algorithmsBook?.languages).toBeDefined();
    expect(algorithmsBook?.languages?.length).toBe(2);

    const enConfig = algorithmsBook?.languages?.find((l) => l.id === 'en');
    const zhConfig = algorithmsBook?.languages?.find((l) => l.id === 'zh');

    expect(enConfig).toBeDefined();
    expect(enConfig?.default).toBe(true);
    expect(zhConfig).toBeDefined();
    expect(zhConfig?.pathPrefix).toBe('zh');
  });

  it('contains complete 69-chapter tocMapping with 100% symmetric files on disk', () => {
    expect(algorithmsBook?.tocMapping).toBeDefined();
    const mapping = algorithmsBook!.tocMapping!;
    const keys = Object.keys(mapping);

    expect(keys.length).toBe(69);

    const baseDir = path.resolve(process.cwd(), 'src/content/docs/collections/cs/algorithms');

    for (const [enKey, zhVal] of Object.entries(mapping)) {
      const enFile = path.join(baseDir, `${enKey}.mdx`);
      const zhPath = Array.isArray(zhVal) ? zhVal[0] : zhVal;
      const zhFile = path.join(baseDir, `${zhPath}.mdx`);

      expect(fs.existsSync(enFile), `English file missing: ${enFile}`).toBe(true);
      expect(fs.existsSync(zhFile), `Chinese file missing: ${zhFile}`).toBe(true);

      const enContent = fs.readFileSync(enFile, 'utf-8');
      const zhContent = fs.readFileSync(zhFile, 'utf-8');

      expect(enContent).toContain('title:');
      expect(zhContent).toContain('title:');
      expect(enContent.length).toBeGreaterThan(100);
      expect(zhContent.length).toBeGreaterThan(100);
    }
  });

  it('performs accurate multilingual paragraph alignment on Chapter 00.1', () => {
    const enFile = path.resolve(process.cwd(), 'src/content/docs/collections/cs/algorithms/00.1_books-and-algorithms.mdx');
    const zhFile = path.resolve(process.cwd(), 'src/content/docs/collections/cs/algorithms/zh/00.1_books-and-algorithms.mdx');

    const enRaw = fs.readFileSync(enFile, 'utf-8');
    const zhRaw = fs.readFileSync(zhFile, 'utf-8');

    // Extract non-empty paragraphs
    const extractParas = (content: string, prefix: 'src' | 'tgt'): ParagraphToken[] => {
      const body = content
        .replace(/^---[\s\S]*?---/, '')
        .replace(/^import\s+.*?;\s*$/gm, '')
        .trim();
      const rawBlocks = body.split(/(?:\r?\n){2,}/).map((b) => b.trim()).filter((b) => b.length > 2);

      return rawBlocks.slice(0, 6).map((text, idx) => ({
        id: `${prefix}-${idx}`,
        index: idx,
        text: text.slice(0, 300),
        type: text.startsWith('#') ? ('heading' as const) : ('paragraph' as const),
      }));
    };

    const sources = extractParas(enRaw, 'src');
    const targets = extractParas(zhRaw, 'tgt');

    expect(sources.length).toBeGreaterThan(2);
    expect(targets.length).toBeGreaterThan(2);

    const matrix = BilingualAlignerClient.fallbackLexicalMatrix(sources, targets);

    // Diagonal elements should have higher similarity than off-diagonal
    expect(matrix[0][0]).toBeGreaterThan(matrix[0][1]);
    expect(matrix[1][1]).toBeGreaterThan(matrix[1][0]);
    expect(matrix[4][4]).toBeGreaterThan(matrix[4][3]);

    const links = BipartiteMatcher.extractLinks(matrix, sources, targets, {
      threshold: 0.45,
      maxPerSource: 1,
      monotonicBias: 0.1,
    });

    expect(links.length).toBeGreaterThanOrEqual(2);
    expect(links[0].sourceId).toBe('src-0');
    expect(links[0].targetId).toBe('tgt-0');
  });
});
