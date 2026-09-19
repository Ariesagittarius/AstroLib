/**
 * src/ai/client/chat-resizer.ts
 * AI 问答抽屉多向拖拽缩放手势交互管理器
 */

import { saveAiPanelDimensions } from '../ai-config';

export function initChatResizer(
  panel: HTMLElement,
  onResizeEnd?: (dims: { width: number; height: number }) => void
) {
  const handles = panel.querySelectorAll<HTMLElement>('.ask-resize-handle');
  if (!handles.length) return;

  handles.forEach((handle) => {
    handle.addEventListener('pointerdown', (e: PointerEvent) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();

      const type =
        handle.dataset.handle ||
        (handle.classList.contains('ask-resize-w')
          ? 'w'
          : handle.classList.contains('ask-resize-n')
          ? 'n'
          : 'nw');

      try {
        handle.setPointerCapture(e.pointerId);
      } catch {}

      const startX = e.clientX;
      const startY = e.clientY;
      const rect = panel.getBoundingClientRect();
      const startWidth = rect.width;
      const startHeight = rect.height;

      panel.classList.add('ask-resizing');
      if (type === 'w') panel.classList.add('is-resizing-w');
      else if (type === 'n') panel.classList.add('is-resizing-n');
      else panel.classList.add('is-resizing-nw');
      document.body.style.userSelect = 'none';

      const onPointerMove = (moveEv: PointerEvent) => {
        if (type === 'w' || type === 'nw') {
          const deltaX = startX - moveEv.clientX;
          const newW = Math.max(
            380,
            Math.min(1000, Math.min(window.innerWidth - 24, Math.round(startWidth + deltaX)))
          );
          panel.style.setProperty('--ask-panel-width', `${newW}px`);
        }
        if (type === 'n' || type === 'nw') {
          const deltaY = startY - moveEv.clientY;
          const newH = Math.max(
            420,
            Math.min(960, Math.min(window.innerHeight - 80, Math.round(startHeight + deltaY)))
          );
          panel.style.setProperty('--ask-panel-height', `${newH}px`);
        }
      };

      const onPointerUp = (upEv: PointerEvent) => {
        try {
          handle.releasePointerCapture(upEv.pointerId);
        } catch {}
        panel.classList.remove('ask-resizing', 'is-resizing-w', 'is-resizing-n', 'is-resizing-nw');
        document.body.style.userSelect = '';
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        window.removeEventListener('pointercancel', onPointerUp);

        const curRect = panel.getBoundingClientRect();
        const curW = Math.round(curRect.width);
        const curH = Math.round(curRect.height);
        saveAiPanelDimensions({ width: curW, height: curH, preset: 'custom' });
        if (onResizeEnd) {
          onResizeEnd({ width: curW, height: curH });
        }
      };

      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('pointercancel', onPointerUp);
    });
  });
}
