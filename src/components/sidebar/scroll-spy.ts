/**
 * scroll-spy.ts
 *
 * 性能重构说明：
 * 原有的 tameOverflowingInlineMath() 与 visibleContentRight() 已彻底移除。
 * 行内公式超长横向滚动已迁移至 src/styles/custom.css 纯 CSS 解决，
 * 彻底消除了移动端遍历 60,000+ span 节点读取 getBoundingClientRect() 导致的强制同步重排（Layout Thrashing）。
 */

// 保留空导出以确保向后兼容与类型安全
export function tameOverflowingInlineMath(): void {
  // no-op: 由纯 CSS .sl-markdown-content .katex 接管
}

export function visibleContentRight(_el: Element): number {
  return 0;
}
