import { describe, it, expect } from 'vitest';
import { collections, getAllBooks } from '@/config/collections.config.ts';

describe('Collections Source of Truth Schema Contract', () => {
  it('collections 必须为非空合集数组，且每个合集具有唯一样本 slug 和非空 books', () => {
    expect(Array.isArray(collections)).toBe(true);
    expect(collections.length).toBeGreaterThan(0);

    const colSlugs = new Set<string>();
    for (const col of collections) {
      expect(col.id).toBeDefined();
      expect(col.slug).toBeDefined();
      expect(col.title).toBeDefined();
      expect(colSlugs.has(col.slug)).toBe(false);
      colSlugs.add(col.slug);
      expect(col.books.length).toBeGreaterThan(0);
    }
  });

  it('全站所有图书 slug 必须全局唯一，且具备必填元数据字段', () => {
    const allBooks = getAllBooks();
    expect(allBooks.length).toBeGreaterThan(0);

    const bookSlugs = new Set<string>();
    for (const book of allBooks) {
      expect(book.id).toBeDefined();
      expect(book.slug).toBeDefined();
      expect(book.title).toBeDefined();
      expect(book.entryPoint).toBeDefined();
      expect(bookSlugs.has(book.slug)).toBe(false);
      bookSlugs.add(book.slug);
    }
  });

  it('图书若声明 modules，必须包含有效的 chip 映射', () => {
    for (const col of collections) {
      for (const book of col.books) {
        if (book.modules) {
          for (const [modKey, modConfig] of Object.entries(book.modules)) {
            expect(modKey).toBeDefined();
            expect(modConfig.short).toBeDefined();
            expect(modConfig.theme).toBeDefined();
          }
        }
      }
    }
  });
});
