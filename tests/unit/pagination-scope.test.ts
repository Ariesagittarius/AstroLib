import { describe, it, expect } from 'vitest';
import {
  normalizePath,
  getScopedBoundary,
  filterScopedPagination,
  cleanDisplayTitle,
} from '@/utils/pagination-scope';

describe('Pagination Scope & Sanitization Unit Tests', () => {
  describe('normalizePath', () => {
    it('should append trailing slash if missing', () => {
      expect(normalizePath('/collections/math/engineering_analysis')).toBe(
        '/collections/math/engineering_analysis/'
      );
    });

    it('should keep existing trailing slash', () => {
      expect(normalizePath('/collections/math/engineering_analysis/')).toBe(
        '/collections/math/engineering_analysis/'
      );
    });

    it('should handle empty or root path', () => {
      expect(normalizePath('')).toBe('/');
      expect(normalizePath('/')).toBe('/');
    });
  });

  describe('getScopedBoundary', () => {
    it('should identify book boundary from collection route', () => {
      expect(
        getScopedBoundary('/collections/math/engineering_analysis/0.0_前言/')
      ).toBe('/collections/math/engineering_analysis/');

      expect(
        getScopedBoundary('/collections/math/math_analysis/26.3_建议/')
      ).toBe('/collections/math/math_analysis/');
    });

    it('should identify top-level documentation boundary', () => {
      expect(getScopedBoundary('/dev/setup/')).toBe('/dev/');
    });

    it('should return null for homepage or uncategorized paths', () => {
      expect(getScopedBoundary('/')).toBeNull();
    });
  });

  describe('filterScopedPagination', () => {
    it('should truncate prev when in first chapter of a book and prev belongs to previous book', () => {
      const currentPath = '/collections/math/engineering_analysis/0.0_前言/';
      const prev = {
        href: '/collections/math/math_analysis/26.3_建议/',
        label: '§26.3$ 对于教学的建议',
      };
      const next = {
        href: '/collections/math/engineering_analysis/0.1_绪论/',
        label: '绪论',
      };

      const result = filterScopedPagination(currentPath, prev, next);
      expect(result.prev).toBeUndefined();
      expect(result.next).toEqual(next);
    });

    it('should truncate next when in last chapter of a book and next belongs to next book', () => {
      const currentPath = '/collections/math/engineering_analysis/7.4_级数/';
      const prev = {
        href: '/collections/math/engineering_analysis/7.3_幂级数/',
        label: '7.3 幂级数',
      };
      const next = {
        href: '/collections/math/linear_algebra_geometry/0.0_前言/',
        label: '前言',
      };

      const result = filterScopedPagination(currentPath, prev, next);
      expect(result.prev).toEqual(prev);
      expect(result.next).toBeUndefined();
    });

    it('should preserve both prev and next when navigation is within the same book', () => {
      const currentPath = '/collections/math/engineering_analysis/1.2_数列极限/';
      const prev = {
        href: '/collections/math/engineering_analysis/1.1_集合映射/',
        label: '1.1 集合映射与函数',
      };
      const next = {
        href: '/collections/math/engineering_analysis/1.3_函数极限/',
        label: '1.3 函数极限',
      };

      const result = filterScopedPagination(currentPath, prev, next);
      expect(result.prev).toEqual(prev);
      expect(result.next).toEqual(next);
    });
  });

  describe('cleanDisplayTitle', () => {
    it('should strip raw dollar signs from title', () => {
      expect(cleanDisplayTitle('§26.3$ 对于教学的建议')).toBe('§26.3 对于教学的建议');
      expect(cleanDisplayTitle('$L^p$ 空间')).toBe('L^p 空间');
    });

    it('should handle undefined or empty string safely', () => {
      expect(cleanDisplayTitle(undefined)).toBe('');
      expect(cleanDisplayTitle('')).toBe('');
    });
  });
});
