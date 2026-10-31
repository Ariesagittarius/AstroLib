/**
 * src/services/bilingual/svg-arrow-renderer.ts
 * ============================================================================
 * AstroLib 跨中缝贝塞尔曲线箭头渲染引擎 (SVG Bézier Arrow Renderer)
 * ============================================================================
 * 负责在双语对照/跨书对比并排阅读器中：
 * 1. 动态量算左右两栏段落 DOM 物理坐标；
 * 2. 在中缝（Gutter）SVG 画布上渲染平滑三次贝塞尔（Cubic Bézier）连线；
 * 3. 关联粗细、透明度与置信度动态渐变；
 * 4. 响应页面滚动与窗口尺寸重算。
 * ============================================================================
 */

import type { ParagraphLink } from './types.ts';

export interface ArrowRenderOptions {
  activeSourceId?: string | null;
  activeTargetIds?: string[];
  hoveredLinkId?: string | null;
  threshold?: number;
}

export class SvgArrowRenderer {
  private svg: SVGSVGElement | null = null;
  private container: HTMLElement | null = null;
  private resizeObserver: ResizeObserver | null = null;

  init(container: HTMLElement, svg: SVGSVGElement) {
    this.container = container;
    this.svg = svg;

    this.ensureMarker();

    if (window.ResizeObserver && this.container) {
      this.resizeObserver = new ResizeObserver(() => {
        this.updateSvgDimensions();
      });
      this.resizeObserver.observe(this.container);
    }
  }

  destroy() {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.svg = null;
    this.container = null;
  }

  /**
   * 确保 SVG 拥有正规箭头定义 (marker-end)
   */
  private ensureMarker() {
    if (!this.svg) return;
    let defs = this.svg.querySelector('defs');
    if (!defs) {
      defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      this.svg.appendChild(defs);
    }

    if (!this.svg.querySelector('#bilingual-arrowhead')) {
      const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
      marker.setAttribute('id', 'bilingual-arrowhead');
      marker.setAttribute('viewBox', '0 0 10 10');
      marker.setAttribute('refX', '7');
      marker.setAttribute('refY', '5');
      marker.setAttribute('markerWidth', '6');
      marker.setAttribute('markerHeight', '6');
      marker.setAttribute('orient', 'auto-start-reverse');

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', 'M 0 1.5 L 8 5 L 0 8.5 z');
      path.setAttribute('class', 'bilingual-arrow-marker');

      marker.appendChild(path);
      defs.appendChild(marker);
    }
  }

  public updateSvgDimensions() {
    if (!this.svg || !this.container) return;
    const rect = this.container.getBoundingClientRect();
    this.svg.setAttribute('width', `${rect.width}`);
    this.svg.setAttribute('height', `${rect.height}`);
    this.svg.setAttribute('viewBox', `0 0 ${rect.width} ${rect.height}`);
  }

  /**
   * 渲染连线集合
   */
  renderLinks(links: ParagraphLink[], options: ArrowRenderOptions = {}) {
    if (!this.svg || !this.container) return;
    this.updateSvgDimensions();

    const svgRect = this.svg.getBoundingClientRect();
    const threshold = options.threshold ?? 0.6;

    // 清空现有路径（保留 defs）
    const existingPaths = this.svg.querySelectorAll('.bilingual-arrow-path');
    existingPaths.forEach((p) => p.remove());

    links.forEach((link) => {
      if (link.similarity < threshold) return;

      const srcEl = this.container?.querySelector(`[data-trans-id="${link.sourceId}"]`) as HTMLElement | null;
      const tgtEl = this.container?.querySelector(`[data-trans-id="${link.targetId}"]`) as HTMLElement | null;
      if (!srcEl || !tgtEl) return;

      const srcRect = srcEl.getBoundingClientRect();
      const tgtRect = tgtEl.getBoundingClientRect();

      // 计算相对于 SVG 容器的坐标
      const x0 = srcRect.right - svgRect.left;
      const y0 = srcRect.top + srcRect.height / 2 - svgRect.top;

      const x3 = tgtRect.left - svgRect.left;
      const y3 = tgtRect.top + tgtRect.height / 2 - svgRect.top;

      const dx = Math.max(30, Math.abs(x3 - x0) * 0.5);
      const cx1 = x0 + dx;
      const cx2 = x3 - dx;

      const pathData = `M ${x0.toFixed(1)} ${y0.toFixed(1)} C ${cx1.toFixed(1)} ${y0.toFixed(1)}, ${cx2.toFixed(1)} ${y3.toFixed(1)}, ${x3.toFixed(1)} ${y3.toFixed(1)}`;

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', pathData);
      path.setAttribute('data-source-id', link.sourceId);
      path.setAttribute('data-target-id', link.targetId);
      path.setAttribute('data-similarity', link.similarity.toString());

      // 计算类名与高亮状态
      const isSourceActive = options.activeSourceId === link.sourceId;
      const isTargetActive = options.activeTargetIds?.includes(link.targetId);
      const isHovered = options.hoveredLinkId === `${link.sourceId}->${link.targetId}`;

      let classNames = ['bilingual-arrow-path'];
      if (isSourceActive || isTargetActive) classNames.push('is-active');
      if (isHovered) classNames.push('is-hovered');
      if (link.isPrimary) classNames.push('is-primary');

      path.setAttribute('class', classNames.join(' '));

      // 动态样式：粗细与透明度
      const strokeWidth = isSourceActive ? 2.5 : Math.max(1, link.similarity * 2);
      const opacity = isSourceActive ? 0.95 : Math.max(0.25, link.similarity * 0.8);

      path.style.strokeWidth = `${strokeWidth}px`;
      path.style.opacity = `${opacity}`;
      path.setAttribute('marker-end', 'url(#bilingual-arrowhead)');

      this.svg?.appendChild(path);
    });
  }
}
