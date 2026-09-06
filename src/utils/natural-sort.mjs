// src/utils/natural-sort.mjs
// 作用：纯文本高精度自然排序算法（确保 1.10 在 1.2 之后，1.1 在 10.1 之前）

/**
 * 原生自然排序辅助函数（确保 1.10 在 1.2 之后，1.1 在 10.1 之前）
 *
 * @param {string} a 比较项 A
 * @param {string} b 比较项 B
 * @returns {number} 排序差值 (-1, 0, 1)
 */
export function naturalSort(a, b) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}
