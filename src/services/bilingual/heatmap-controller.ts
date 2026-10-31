/**
 * src/services/bilingual/heatmap-controller.ts
 * ============================================================================
 * AstroLib 双语关联度热力图客户端控制器 (Heatmap Sheet Controller)
 * ============================================================================
 * 负责：
 * 1. 驱动底部抽屉展开/折叠交互；
 * 2. 在 Canvas 上高性能绘制 M x N 矩阵热力图（避免大篇幅 DOM 节点的重排重绘开销）；
 * 3. 响应阈值滑块拖拽，实时高亮有效关联单元；
 * 4. 悬浮浮层提示与点击联动滚动事件分发。
 * ============================================================================
 */

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

    // 1. 折叠展开切换
    const toggleBtn = this.sheetEl.querySelector('#heatmap-sheet-toggle');
    toggleBtn?.addEventListener('click', () => {
      this.sheetEl?.classList.toggle('is-collapsed');
    });

    // 2. 阈值滑块事件
    this.sliderEl?.addEventListener('input', (e) => {
      const val = parseFloat((e.target as HTMLInputElement).value);
      this.currentThreshold = val;
      if (this.thresholdValEl) {
        this.thresholdValEl.textContent = val.toFixed(2);
      }
      this.callbacks.onThresholdChange?.(val);
      this.render();
    });

    // 3. Canvas 鼠标交互 (Hover & Click)
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
          // 关联高亮色（基于 Material 3 Primary 蓝紫微光）
          const alpha = Math.min(1, Math.max(0.35, sim));
          ctx.fillStyle = `rgba(99, 102, 241, ${alpha})`;
          ctx.fillRect(x + 1, y + 1, this.cellSize - 2, this.cellSize - 2);

          // 超高相似度单元加内边框
          if (sim >= 0.85) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.lineWidth = 1;
            ctx.strokeRect(x + 1.5, y + 1.5, this.cellSize - 3, this.cellSize - 3);
          }
        } else {
          // 底网格微弱占位
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
