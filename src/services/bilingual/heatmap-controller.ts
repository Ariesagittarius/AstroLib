import type { AlignmentMatrixResult } from './types.ts';

export interface HeatmapCallbacks {
  onCellClick?: (sourceId: string, targetId: string, similarity: number) => void;
  onThresholdChange?: (newThreshold: number) => void;
}

export class HeatmapController {
  private sheetEl: HTMLElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private tooltipEl: HTMLElement | null = null;
  private sliderEl: HTMLInputElement | null = null;
  private badgeEl: HTMLElement | null = null;
  private thresholdValEl: HTMLElement | null = null;
  private currentResult: AlignmentMatrixResult | null = null;
  private currentThreshold = 0.6;
  private cellSize = 16;
  private callbacks: HeatmapCallbacks = {};

  init(sheetEl: HTMLElement, callbacks: HeatmapCallbacks = {}) {
    this.sheetEl = sheetEl;
    this.callbacks = callbacks;

    this.canvas = sheetEl.querySelector('#heatmap-canvas');
    this.tooltipEl = sheetEl.querySelector('#heatmap-cell-tooltip');
    this.sliderEl = sheetEl.querySelector('#heatmap-threshold-slider');
    this.badgeEl = sheetEl.querySelector('#heatmap-links-badge');
    this.thresholdValEl = sheetEl.querySelector('#heatmap-threshold-val');

    this.bindEvents();
  }

  private bindEvents() {
    if (!this.sheetEl) return;

    const toggleBtn = this.sheetEl.querySelector('#heatmap-sheet-toggle');
    toggleBtn?.addEventListener('click', () => {
      this.sheetEl?.classList.toggle('is-collapsed');
    });

    this.sliderEl?.addEventListener('input', (e) => {
      const val = parseFloat((e.target as HTMLInputElement).value);
      this.currentThreshold = val;
      if (this.thresholdValEl) {
        this.thresholdValEl.textContent = val.toFixed(2);
      }
      this.callbacks.onThresholdChange?.(val);
      this.render();
    });

    this.canvas?.addEventListener('mousemove', (e) => this.handleCanvasHover(e));
    this.canvas?.addEventListener('mouseleave', () => this.hideTooltip());
    this.canvas?.addEventListener('click', (e) => this.handleCanvasClick(e));
  }

  setData(result: AlignmentMatrixResult, threshold: number = 0.6) {
    this.currentResult = result;
    this.currentThreshold = threshold;
    if (this.sliderEl) this.sliderEl.value = threshold.toString();
    if (this.thresholdValEl) this.thresholdValEl.textContent = threshold.toFixed(2);
    this.render();
  }

  private render() {
    if (!this.canvas || !this.currentResult) return;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) return;

    const matrix = this.currentResult.matrix;
    const M = matrix.length;
    const N = M > 0 ? matrix[0].length : 0;
    if (M === 0 || N === 0) return;

    const dpr = window.devicePixelRatio || 1;
    const width = N * this.cellSize;
    const height = M * this.cellSize;

    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    let activePairs = 0;

    for (let i = 0; i < M; i++) {
      for (let j = 0; j < N; j++) {
        const sim = matrix[i][j];
        const x = j * this.cellSize;
        const y = i * this.cellSize;

        if (sim >= this.currentThreshold) {
          activePairs++;

          const alpha = Math.min(1, Math.max(0.35, sim));
          ctx.fillStyle = `rgba(99, 102, 241, ${alpha})`;
          ctx.fillRect(x + 1, y + 1, this.cellSize - 2, this.cellSize - 2);

          if (sim >= 0.85) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.lineWidth = 1;
            ctx.strokeRect(x + 1.5, y + 1.5, this.cellSize - 3, this.cellSize - 3);
          }
        } else {

          ctx.fillStyle = 'rgba(150, 150, 150, 0.08)';
          ctx.fillRect(x + 1, y + 1, this.cellSize - 2, this.cellSize - 2);
        }
      }
    }

    if (this.badgeEl) {
      this.badgeEl.textContent = `${activePairs} 对有效关联`;
    }
  }

  private getCellFromEvent(e: MouseEvent): { i: number; j: number } | null {
    if (!this.canvas || !this.currentResult) return null;
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const j = Math.floor(x / this.cellSize);
    const i = Math.floor(y / this.cellSize);

    const M = this.currentResult.matrix.length;
    const N = M > 0 ? this.currentResult.matrix[0].length : 0;

    if (i >= 0 && i < M && j >= 0 && j < N) {
      return { i, j };
    }
    return null;
  }

  private handleCanvasHover(e: MouseEvent) {
    const cell = this.getCellFromEvent(e);
    if (!cell || !this.currentResult || !this.tooltipEl) {
      this.hideTooltip();
      return;
    }

    const { i, j } = cell;
    const sim = this.currentResult.matrix[i][j];
    const src = this.currentResult.sourceParagraphs[i];
    const tgt = this.currentResult.targetParagraphs[j];

    const srcTitle = src?.text.slice(0, 18).replace(/\n/g, ' ') || `段落 #${i}`;
    const tgtTitle = tgt?.text.slice(0, 18).replace(/\n/g, ' ') || `段落 #${j}`;

    this.tooltipEl.innerHTML = `<strong>${srcTitle}</strong> ↔ <strong>${tgtTitle}</strong><br/>相似度: <strong>${(sim * 100).toFixed(1)}%</strong>`;
    this.tooltipEl.style.opacity = '1';
    this.tooltipEl.style.left = `${e.clientX + 12}px`;
    this.tooltipEl.style.top = `${e.clientY - 28}px`;
  }

  private hideTooltip() {
    if (this.tooltipEl) {
      this.tooltipEl.style.opacity = '0';
    }
  }

  private handleCanvasClick(e: MouseEvent) {
    const cell = this.getCellFromEvent(e);
    if (!cell || !this.currentResult) return;

    const { i, j } = cell;
    const sim = this.currentResult.matrix[i][j];
    const srcId = this.currentResult.sourceParagraphs[i]?.id ?? `src-p-${i}`;
    const tgtId = this.currentResult.targetParagraphs[j]?.id ?? `tgt-p-${j}`;

    this.callbacks.onCellClick?.(srcId, tgtId, sim);
  }
}
