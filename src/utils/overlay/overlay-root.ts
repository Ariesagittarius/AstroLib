export const OVERLAY_ROOT_ID = 'astro-overlay-root';

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

export function mountToOverlayRoot(el: HTMLElement | null): void {
  if (!el || typeof document === 'undefined') return;

  if (
    el.classList.contains('is-docked') ||
    el.closest('#ai-sidebar-panel') ||
    el.closest('.sideload-panel-view') ||
    (el.tagName.toLowerCase() === 'ai-ask' && (el as any)._isDocked)
  ) {
    return;
  }
  const root = getOverlayRoot();
  if (root && el.parentElement !== root) {
    root.appendChild(el);
  }
}
