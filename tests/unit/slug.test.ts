import { describe, it, expect } from 'vitest';
import { cleanSlug } from '@/utils/slug.ts';

describe('Clean Slug Utility (Unit Tests)', () => {
  it('should strip math macros and special characters matching Astro glob loader routing', () => {
    expect(cleanSlug('01_导数与微分')).toBe('01_导数与微分');
    expect(cleanSlug('2.2_求导的基本法则')).toBe('22_求导的基本法则');
    expect(cleanSlug('1.5_函数\\mathbf{R}^n')).toBe('15_函数rn');
  });

  it('should handle nested paths properly', () => {
    expect(cleanSlug('math/engineering_analysis/2.2_求导')).toBe('math/engineering_analysis/22_求导');
  });
});
