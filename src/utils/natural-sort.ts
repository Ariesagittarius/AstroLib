/**
 * src/utils/natural-sort.ts
 * 原生自然排序辅助函数（确保 1.10 在 1.2 之后，1.1 在 10.1 之前）
 */
export function naturalSort(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}
