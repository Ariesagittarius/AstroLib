import { describe, it, expect } from 'vitest';
import { naturalSort } from '@/utils/natural-sort.ts';

describe('Natural Sort Utility (Unit Tests)', () => {
  it('should sort chapter strings numerically (e.g. 1.2 before 1.10, 1.1 before 10.1)', () => {
    const chapters = ['10.1_多元微分', '1.10_极限', '1.2_导数', '2.1_积分', '1.1_集合'];
    const sorted = [...chapters].sort(naturalSort);

    expect(sorted).toEqual([
      '1.1_集合',
      '1.2_导数',
      '1.10_极限',
      '2.1_积分',
      '10.1_多元微分',
    ]);
  });
});
