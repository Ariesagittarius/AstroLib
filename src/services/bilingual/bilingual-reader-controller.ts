import { BilingualAlignerClient } from './aligner-client.ts';
import { SvgArrowRenderer } from './svg-arrow-renderer.ts';
import { HeatmapController } from './heatmap-controller.ts';
import { BipartiteMatcher } from './bipartite-matcher.ts';
import type { AlignmentMatrixResult, ParagraphLink, ParagraphToken } from './types.ts';

export class BilingualReaderController {
  private container: HTMLElement | null = null;
  private sourceCol: HTMLElement | null = null;
  private targetCol: HTMLElement | null = null;
  private svgEl: SVGSVGElement | null = null;

  private arrowRenderer = new SvgArrowRenderer();
  private heatmapController = new HeatmapController();

  private sourceTokens: ParagraphToken[] = [];
  private targetTokens: ParagraphToken[] = [];
  private currentResult: AlignmentMatrixResult | null = null;

  private activeSourceId: string | null = null;
  private activeTargetIds: string[] = [];
  private currentThreshold = 0.6;
  private isSyncScrollLocked = true;

  init(container: HTMLElement) {
    this.container = container;
    this.sourceCol = container.querySelector('.bilingual-col-source');
    this.targetCol = container.querySelector('.bilingual-col-target');
    this.svgEl = container.querySelector('.bilingual-svg-canvas');

    if (!this.sourceCol || !this.targetCol || !this.svgEl) return;

    this.arrowRenderer.init(this.container, this.svgEl);

    const sheetEl = document.getElementById('bilingual-heatmap-sheet');
    if (sheetEl) {
      this.heatmapController.init(sheetEl, {
        onCellClick: (srcId, tgtId, sim) => this.handleHeatmapCellSelect(srcId, tgtId, sim),
        onThresholdChange: (threshold) => this.handleThresholdChange(threshold),
      });
    }

    this.bindDomEvents();
    this.runAlignment();
  }

  destroy() {
    this.arrowRenderer.destroy();
    this.container = null;
    this.sourceCol = null;
    this.targetCol = null;
    this.svgEl = null;
  }

  private bindDomEvents() {
    if (!this.sourceCol || !this.targetCol) return;

    this.sourceCol.addEventListener('click', (e) => {
      const targetEl = (e.target as HTMLElement).closest('[data-trans-id]') as HTMLElement | null;
      if (!targetEl) return;
      const id = targetEl.getAttribute('data-trans-id');
      if (id) {
        this.selectSourceParagraph(id);
      }
    });

    this.targetCol.addEventListener('click', (e) => {
      const targetEl = (e.target as HTMLElement).closest('[data-trans-id]') as HTMLElement | null;
      if (!targetEl) return;
      const id = targetEl.getAttribute('data-trans-id');
      if (id) {
        this.selectTargetParagraph(id);
      }
    });

    const handleScroll = () => {
      window.requestAnimationFrame(() => {
        this.redrawArrows();
      });
    };

    this.sourceCol.addEventListener('scroll', handleScroll, { passive: true });
    this.targetCol.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
  }

  async runAlignment() {
    if (!this.sourceCol || !this.targetCol) return;

    this.sourceTokens = BilingualAlignerClient.extractTokens(this.sourceCol, 'src');
    this.targetTokens = BilingualAlignerClient.extractTokens(this.targetCol, 'tgt');

    if (this.sourceTokens.length === 0 || this.targetTokens.length === 0) {
      return;
    }

    this.currentResult = await BilingualAlignerClient.computeAlignment(
      this.sourceTokens,
      this.targetTokens,
      {
        threshold: this.currentThreshold,
        monotonicBias: 0.15,
      }
    );

    this.heatmapController.setData(this.currentResult, this.currentThreshold);
    this.redrawArrows();
  }

  private handleThresholdChange(threshold: number) {
    this.currentThreshold = threshold;
    if (this.currentResult) {
      this.currentResult.links = BipartiteMatcher.extractLinks(
        this.currentResult.matrix,
        this.sourceTokens,
        this.targetTokens,
        {
          threshold: this.currentThreshold,
          monotonicBias: 0.15,
        }
      );
    }
    this.redrawArrows();
  }

  private selectSourceParagraph(srcId: string) {
    this.activeSourceId = srcId;

    this.clearHighlights();

    const srcEl = this.container?.querySelector(`[data-trans-id="${srcId}"]`);
    srcEl?.classList.add('bilingual-highlight-active');

    const matchingLinks = (this.currentResult?.links || []).filter(
      (l) => l.sourceId === srcId && l.similarity >= this.currentThreshold
    );

    this.activeTargetIds = matchingLinks.map((l) => l.targetId);

    matchingLinks.forEach((link, idx) => {
      const tgtEl = this.container?.querySelector(`[data-trans-id="${link.targetId}"]`) as HTMLElement | null;
      if (tgtEl) {
        tgtEl.classList.add('bilingual-highlight-target');
        if (idx === 0) {
          tgtEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    });

    this.redrawArrows();
  }

  private selectTargetParagraph(tgtId: string) {

    const matchingLinks = (this.currentResult?.links || []).filter(
      (l) => l.targetId === tgtId && l.similarity >= this.currentThreshold
    );

    if (matchingLinks.length > 0) {
      this.selectSourceParagraph(matchingLinks[0].sourceId);
    } else {
      this.clearHighlights();
      const tgtEl = this.container?.querySelector(`[data-trans-id="${tgtId}"]`);
      tgtEl?.classList.add('bilingual-highlight-active');
      this.activeSourceId = null;
      this.activeTargetIds = [tgtId];
      this.redrawArrows();
    }
  }

  private handleHeatmapCellSelect(srcId: string, tgtId: string, _similarity: number) {
    this.selectSourceParagraph(srcId);
    const tgtEl = this.container?.querySelector(`[data-trans-id="${tgtId}"]`) as HTMLElement | null;
    tgtEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  private clearHighlights() {
    this.container?.querySelectorAll('.bilingual-highlight-active, .bilingual-highlight-target').forEach((el) => {
      el.classList.remove('bilingual-highlight-active', 'bilingual-highlight-target');
    });
  }

  private redrawArrows() {
    if (!this.currentResult) return;
    this.arrowRenderer.renderLinks(this.currentResult.links, {
      activeSourceId: this.activeSourceId,
      activeTargetIds: this.activeTargetIds,
      threshold: this.currentThreshold,
    });
  }
}
