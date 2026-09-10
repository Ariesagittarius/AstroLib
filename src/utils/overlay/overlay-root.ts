/**
 * ============================================================================
 * 全局视窗 Overlay 挂载根节点 (Global Overlay Root Manager)
 * ============================================================================
 * 职责：
 *   1. 统一管理宿主挂载上下文 <div id="astro-overlay-root"></div>。
 *   2. 脱离任何局部父级 Stacking Context（尤其是 Header 的 backdrop-filter 与
 *      .main-pane 的进入动画 transform / will-change）。
 *   3. 零第三方 Portal 框架依赖，纯原生 DOM 操作，零侵入业务逻辑。
 *   4. 严格分离：Overlay Root 是 mounting context，Layer Token 是 ordering policy。
 * ============================================================================
 */

export const OVERLAY_ROOT_ID = 'astro-overlay-root';

/**
 * 获取或按需创建挂载在 document.body 最顶层的 Overlay Root
 */
export function getOverlayRoot(): HTMLElement {
  if (typeof document === 'undefined') {
    return null as unknown as HTMLElement;
  }

  let root = document.getElementById(OVERLAY_ROOT_ID);
  if (!root) {
    root = document.createElement('div');
    root.id = OVERLAY_ROOT_ID;
    document.body.appendChild(root);
  }
  return root;
}

/**
 * 将目标浮层安全挂载至 Overlay Root，防止被局部容器裁剪与层级囚禁
 */
export function mountToOverlayRoot(el: HTMLElement | null): void {
  if (!el || typeof document === 'undefined') return;
  const root = getOverlayRoot();
  if (root && el.parentElement !== root) {
    root.appendChild(el);
  }
}

