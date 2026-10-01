import renderMathInElement from 'katex/contrib/auto-render';
import { renderAcademicSolutionMarkdown as renderSolutionMarkdown, EXERCISE_KATEX_OPTIONS as KATEX_OPTIONS } from './exercise-markdown';
import { getEffectiveAiClientConfig } from '../../ai/ai-config';

export interface MathTooltipHost {
  getQuestion(qid: string): any;
  getQuestionIndex(qid: string): number;
  getStoredAiSolution(qid: string): string | null;
  getStoredAiReasoning(qid: string): string | null;
  isGenerating(qid: string): boolean;
  renderCotAccordionHtml(reasoningMd: string, isStreaming: boolean): string;
  bindCotToggle(): void;
}

export class ExerciseMathTooltip {
  private host: MathTooltipHost;
  private tooltipEl: HTMLElement | null = null;
  private activeTooltipQid: string | null = null;
  private isTooltipPinned = false;
  private isCustomPositioned = false;
  private tooltipPosX = 0;
  private tooltipPosY = 0;

  constructor(host: MathTooltipHost) {
    this.host = host;
    if (typeof window !== 'undefined') {
      this.bindWindowEvents();
    }
  }

  private bindWindowEvents() {

    window.addEventListener('pointerdown', (e) => {
      if (!this.activeTooltipQid || !this.tooltipEl) return;
      if (this.isTooltipPinned) return;
      const target = e.target as HTMLElement;
      if (!target) return;
      if (this.tooltipEl.contains(target)) return;
      if (target.closest('.ex-ai-popout-btn')) return;
      this.closeAiRichTooltip();
    });

    window.addEventListener('resize', () => {
      if (this.activeTooltipQid) {
        if (this.isCustomPositioned && this.tooltipEl) {
          const rect = this.tooltipEl.getBoundingClientRect();
          const clampX = Math.max(8, Math.min(rect.left, window.innerWidth - rect.width - 8));
          const clampY = Math.max(8, Math.min(rect.top, window.innerHeight - rect.height - 8));
          this.tooltipEl.style.left = `${clampX}px`;
          this.tooltipEl.style.top = `${clampY}px`;
        } else {
          const btn = document.getElementById(`ai-popout-${this.activeTooltipQid}`);
          if (btn) this.repositionRichTooltip(btn);
        }
      }
    });
  }

  public destroy() {
    if (this.tooltipEl) {
      this.tooltipEl.remove();
      this.tooltipEl = null;
    }
    this.activeTooltipQid = null;
  }

  public getActiveQid(): string | null {
    return this.activeTooltipQid;
  }

  public getOrCreateRichTooltip(): HTMLElement {
    let el = document.getElementById('ex-ai-rich-tooltip');
    if (!el) {
      el = document.createElement('div');
      el.id = 'ex-ai-rich-tooltip';
      el.className = 'ex-ai-rich-tooltip';
      el.setAttribute('role', 'dialog');
      el.setAttribute('aria-modal', 'false');
      el.setAttribute('aria-hidden', 'true');
      document.body.appendChild(el);
    }
    this.tooltipEl = el;
    return el;
  }

  public toggleAiRichTooltip(qid: string, triggerBtn: HTMLElement) {
    if (this.activeTooltipQid === qid) {
      this.closeAiRichTooltip();
    } else {
      this.openAiRichTooltip(qid, triggerBtn);
    }
  }

  public openAiRichTooltip(qid: string, triggerBtn: HTMLElement) {
    const q = this.host.getQuestion(qid);
    if (!q) return;

    if (this.activeTooltipQid && this.activeTooltipQid !== qid) {
      document.getElementById(`ai-body-${this.activeTooltipQid}`)?.classList.remove('tooltip-active-ceded');
    }

    this.activeTooltipQid = qid;
    this.isTooltipPinned = false;
    this.isCustomPositioned = false;
    const tooltip = this.getOrCreateRichTooltip();
    tooltip.classList.remove('is-pinned', 'is-custom-positioned', 'is-dragging');
    const config = getEffectiveAiClientConfig();
    const qIndex = this.host.getQuestionIndex(qid) || 1;
    const solutionMd = this.host.getStoredAiSolution(qid) || '';
    const reasoningMd = this.host.getStoredAiReasoning(qid) || '';

    document.getElementById(`ai-body-${qid}`)?.classList.add('tooltip-active-ceded');

    document.querySelectorAll('.ex-ai-popout-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.id === `ai-popout-${qid}`);
    });

    tooltip.innerHTML = `
      <div class="ex-ai-rich-tooltip-caret" aria-hidden="true"></div>
      <div class="ex-ai-rich-tooltip-header">
        <div class="ex-ai-rich-tooltip-title-group">
          <svg class="ex-ai-rich-tooltip-sparkle" viewBox="0 0 24 24" width="16" height="16" fill="var(--md-sys-color-primary)" aria-hidden="true">
            <path d="M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z"/>
          </svg>
          <span class="ex-ai-rich-tooltip-title">第 ${qIndex} 题 · AI 规范推导</span>
          <span class="ex-ai-rich-tooltip-badge">${config.label}</span>
        </div>
        <div class="ex-ai-rich-tooltip-actions">
          <md-icon-button
            toggle
            touch-target="none"
            class="ex-ai-rich-tooltip-action-btn ex-ai-tooltip-pin-btn"
            id="ex-tooltip-pin"
            title="固定浮窗 (不因外部点击关闭)"
            aria-label="固定浮窗"
          >
            <md-icon class="ex-pin-icon-unpinned">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M14 4v5c0 1.12.37 2.16 1 3H9c.65-.86 1-1.9 1-3V4h4m3-2H7c-.55 0-1 .45-1 1s.45 1 1 1h1v5c0 1.66-1.34 3-3 3v2h5.97v7l1 1 1-1v-7H19v-2c-1.66 0-3-1.34-3-3V4h1c.55 0 1-.45 1-1s-.45-1-1-1z"/>
              </svg>
            </md-icon>
            <md-icon slot="selected" class="ex-pin-icon-pinned">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M16 9V4h1c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1h1v5c0 1.66-1.34 3-3 3v2h5.97v7l1 1 1-1v-7H19v-2c-1.66 0-3-1.34-3-3z"/>
              </svg>
            </md-icon>
          </md-icon-button>
          <md-icon-button
            touch-target="none"
            class="ex-ai-rich-tooltip-action-btn ex-ai-tooltip-drag-btn"
            id="ex-tooltip-drag"
            title="按住拖动浮窗"
            aria-label="拖动浮窗"
          >
            <md-icon>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="5 9 2 12 5 15"></polyline>
                <polyline points="9 5 12 2 15 5"></polyline>
                <polyline points="15 19 12 22 9 19"></polyline>
                <polyline points="19 9 22 12 19 15"></polyline>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <line x1="12" y1="2" x2="12" y2="22"></line>
              </svg>
            </md-icon>
          </md-icon-button>
          <md-icon-button
            touch-target="none"
            class="ex-ai-rich-tooltip-action-btn ex-ai-rich-tooltip-close"
            id="ex-tooltip-close"
            title="关闭浮窗 (Esc)"
            aria-label="关闭"
          >
            <md-icon>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </md-icon>
          </md-icon-button>
        </div>
      </div>
      <div class="ex-ai-rich-tooltip-body" id="ex-tooltip-body">
        <div class="ex-ai-cot-container" id="ex-tooltip-cot-container">
          ${this.host.renderCotAccordionHtml(reasoningMd, this.host.isGenerating(qid))}
        </div>
        <div class="ex-ai-solution-content" id="ex-tooltip-solution">
          ${renderSolutionMarkdown(solutionMd, this.host.isGenerating(qid))}
        </div>
      </div>
      <div class="ex-ai-rich-tooltip-footer">
        <button type="button" class="ex-ai-rich-tooltip-btn ex-btn-text" id="ex-tooltip-chat" title="转入书内问答">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>
          <span>转入问答</span>
        </button>
        <button type="button" class="ex-ai-rich-tooltip-btn ex-btn-text" id="ex-tooltip-copy" title="复制推导全文">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
          <span>复制推导</span>
        </button>
        <button type="button" class="ex-ai-rich-tooltip-btn ex-btn-tonal" id="ex-tooltip-dismiss">
          <span>关闭</span>
        </button>
      </div>
    `;

    document.getElementById('ex-tooltip-close')?.addEventListener('click', () => this.closeAiRichTooltip());
    document.getElementById('ex-tooltip-dismiss')?.addEventListener('click', () => this.closeAiRichTooltip());

    const pinBtn = document.getElementById('ex-tooltip-pin') as any;
    if (pinBtn) {
      const syncPin = (newPinned: boolean) => {
        this.isTooltipPinned = newPinned;
        pinBtn.selected = newPinned;
        if (newPinned) {
          pinBtn.setAttribute('selected', '');
        } else {
          pinBtn.removeAttribute('selected');
        }
        pinBtn.title = newPinned ? '取消固定浮窗' : '固定浮窗 (不因外部点击关闭)';
        pinBtn.setAttribute('aria-label', newPinned ? '取消固定' : '固定浮窗');
        tooltip.classList.toggle('is-pinned', newPinned);
      };

      pinBtn.addEventListener('click', (e: Event) => {
        e.stopPropagation();
        syncPin(!this.isTooltipPinned);
      });

      pinBtn.addEventListener('input', (e: Event) => {
        e.stopPropagation();
        syncPin(Boolean(pinBtn.selected));
      });
    }

    const dragBtn = document.getElementById('ex-tooltip-drag') as HTMLElement;
    if (dragBtn) {
      dragBtn.addEventListener('pointerdown', (e: PointerEvent) => {
        if (e.button !== 0) return;
        if (!this.tooltipEl) return;

        try {
          dragBtn.setPointerCapture(e.pointerId);
        } catch {}

        const rect = this.tooltipEl.getBoundingClientRect();
        const startX = e.clientX;
        const startY = e.clientY;
        const initialLeft = rect.left;
        const initialTop = rect.top;

        this.tooltipEl.style.left = `${initialLeft}px`;
        this.tooltipEl.style.right = 'auto';
        this.tooltipEl.style.top = `${initialTop}px`;
        this.tooltipEl.classList.add('is-dragging', 'is-custom-positioned');
        this.isCustomPositioned = true;

        const onPointerMove = (moveEvt: PointerEvent) => {
          if (!this.tooltipEl) return;
          const deltaX = moveEvt.clientX - startX;
          const deltaY = moveEvt.clientY - startY;

          const currentW = rect.width;
          const currentH = this.tooltipEl.offsetHeight || rect.height;

          const newLeft = initialLeft + deltaX;
          const newTop = initialTop + deltaY;

          const clampX = Math.max(8, Math.min(newLeft, window.innerWidth - currentW - 8));
          const clampY = Math.max(8, Math.min(newTop, window.innerHeight - currentH - 8));

          this.tooltipEl.style.left = `${clampX}px`;
          this.tooltipEl.style.top = `${clampY}px`;
        };

        const onPointerUp = (upEvt: PointerEvent) => {
          try {
            dragBtn.releasePointerCapture(upEvt.pointerId);
          } catch {}
          dragBtn.removeEventListener('pointermove', onPointerMove);
          dragBtn.removeEventListener('pointerup', onPointerUp);
          dragBtn.removeEventListener('pointercancel', onPointerUp);

          this.tooltipEl?.classList.remove('is-dragging');
        };

        dragBtn.addEventListener('pointermove', onPointerMove);
        dragBtn.addEventListener('pointerup', onPointerUp);
        dragBtn.addEventListener('pointercancel', onPointerUp);
      });
    }

    document.getElementById('ex-tooltip-copy')?.addEventListener('click', async () => {
      const sol = this.host.getStoredAiSolution(qid) || '';
      if (!sol) return;
      try {
        await navigator.clipboard.writeText(sol);
        const copyBtn = document.getElementById('ex-tooltip-copy');
        if (copyBtn) {
          copyBtn.innerHTML = `
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
            <span>已复制</span>
          `;
          setTimeout(() => {
            if (copyBtn) {
              copyBtn.innerHTML = `
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                <span>复制推导</span>
              `;
            }
          }, 2000);
        }
      } catch {}
    });

    document.getElementById('ex-tooltip-chat')?.addEventListener('click', () => {
      window.dispatchEvent(
        new CustomEvent('aiask:query', {
          detail: {
            prompt: `请对这道题目展开深入解析并讲解核心考点与解题思路：\n${q.stem_raw || q.stem_html}`,
            autoSubmit: true,
          },
        })
      );
    });

    this.host.bindCotToggle();

    const bodyEl = document.getElementById('ex-tooltip-body');
    if (bodyEl) {
      try {
        renderMathInElement(bodyEl, KATEX_OPTIONS);
      } catch {}
    }

    this.repositionRichTooltip(triggerBtn);

    tooltip.classList.add('visible');
    tooltip.setAttribute('aria-hidden', 'false');

    requestAnimationFrame(() => {
      this.repositionRichTooltip(triggerBtn);
    });
  }

  public repositionRichTooltip(triggerBtn: HTMLElement) {
    if (!this.tooltipEl) return;
    const btnRect = triggerBtn.getBoundingClientRect();
    const sidebar = document.querySelector('.custom-page-sidebar') || document.getElementById('exercise-sidebar-panel');
    const sidebarRect = sidebar ? sidebar.getBoundingClientRect() : { left: window.innerWidth - 320 };

    const rightDist = window.innerWidth - sidebarRect.left + 14;
    this.tooltipEl.style.right = `${Math.max(16, rightDist)}px`;
    this.tooltipEl.style.left = 'auto';

    const viewportH = window.innerHeight;
    const navHeight = 72;
    const bottomPadding = 24;
    const maxAvailableH = Math.max(260, viewportH - navHeight - bottomPadding);

    const targetH = Math.min(maxAvailableH, 620);

    const btnCenterY = btnRect.top + btnRect.height / 2;
    let top = btnRect.top - 24;

    const maxTop = Math.max(navHeight, viewportH - targetH - bottomPadding);
    top = Math.max(navHeight, Math.min(top, maxTop));

    this.tooltipEl.style.top = `${top}px`;

    this.tooltipEl.style.maxHeight = `${viewportH - top - bottomPadding}px`;

    const caret = this.tooltipEl.querySelector('.ex-ai-rich-tooltip-caret') as HTMLElement;
    if (caret) {
      const caretTop = btnCenterY - top - 6;

      const actualHeight = this.tooltipEl.offsetHeight || targetH;
      const clampedCaretTop = Math.max(20, Math.min(caretTop, actualHeight - 36));
      caret.style.top = `${clampedCaretTop}px`;
    }
  }

  public closeAiRichTooltip() {
    const prevQid = this.activeTooltipQid;
    this.isTooltipPinned = false;
    this.isCustomPositioned = false;
    if (this.tooltipEl) {
      this.tooltipEl.classList.remove('visible', 'is-pinned', 'is-custom-positioned', 'is-dragging');
      this.tooltipEl.setAttribute('aria-hidden', 'true');
    }
    document.querySelectorAll('.ex-ai-popout-btn').forEach((btn) => {
      btn.classList.remove('active');
    });
    this.activeTooltipQid = null;

    if (prevQid) {
      const aiBody = document.getElementById(`ai-body-${prevQid}`);
      if (aiBody) {
        aiBody.classList.remove('tooltip-active-ceded');

        const contentEl = document.getElementById(`ai-content-${prevQid}`);
        if (contentEl) {
          try {
            renderMathInElement(contentEl, KATEX_OPTIONS);
          } catch {}
        }
      }
    }
  }

  public syncStreamingToRichTooltip(qid: string, md: string, reasoningMd = '', isStreaming = true) {
    if (this.activeTooltipQid !== qid) return;

    const cotContainer = document.getElementById('ex-tooltip-cot-container');
    if (cotContainer) {
      let box = document.getElementById('ex-tooltip-cot-box');
      if (!box && (reasoningMd || (isStreaming && !md))) {
        cotContainer.innerHTML = this.host.renderCotAccordionHtml(reasoningMd, isStreaming && !md);
        this.host.bindCotToggle();
        box = document.getElementById('ex-tooltip-cot-box');
      }

      if (box) {

        const summaryEl = document.getElementById('ex-tooltip-cot-summary');
        if (summaryEl) {
          summaryEl.textContent = isStreaming && !md
            ? (reasoningMd ? `正在深度推理推演中... · ${reasoningMd.length} 字` : '正在深度推理推演中...')
            : `已完成思考 · 共 ${reasoningMd.length} 字`;
        }

        const isExpanded = box.classList.contains('is-expanded');
        if (isExpanded) {
          const content = document.getElementById('ex-tooltip-cot-content');
          if (content) {
            content.innerHTML = renderSolutionMarkdown(reasoningMd, isStreaming && !md);
            try {
              renderMathInElement(content, KATEX_OPTIONS);
            } catch {}
          }
        }
      }
    }

    const solutionEl = document.getElementById('ex-tooltip-solution');
    if (solutionEl) {
      solutionEl.innerHTML = renderSolutionMarkdown(md, isStreaming);
      try {
        renderMathInElement(solutionEl, KATEX_OPTIONS);
      } catch {}
    } else {
      const bodyEl = document.getElementById('ex-tooltip-body');
      if (bodyEl && !cotContainer) {
        bodyEl.innerHTML = renderSolutionMarkdown(md, isStreaming);
        try {
          renderMathInElement(bodyEl, KATEX_OPTIONS);
        } catch {}
      }
    }
  }

}
