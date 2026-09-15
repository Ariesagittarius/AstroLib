/**
 * m3-loading-indicator.ts —— Google Material 3 灵动形变与原生统一加载指示器组件
 *
 * 功能说明：
 *   1. 完整集成开源项目 @alerix/m3-loading-indicator (M3 Expressive Loading Indicator)；
 *   2. 支持 7 种官方形态春生物理形变动画（Soft Burst → Cookie 9 → Pentagon → Pill → Sunny → Cookie 4 → Oval）；
 *   3. 兼容双轨模式（支持用户在偏好设置中自由决定使用「第三方灵动形变实现」或「官方 @material/web 原生实现」）；
 *   4. 作为标准 Web Component `<m3-loading-indicator>` 注册，支持 SSR 与客户端动态注入；
 *   5. 深度集成 Material You 动态主题系统，自动计算与解析 CSS 变量色值。
 */

import {
  M3Animator,
  getMorphedShape,
  drawIndicator,
  setupCanvas,
} from '@alerix/m3-loading-indicator';

export type LoadingIndicatorStyle = 'morph' | 'native';

export const LOADING_STYLE_STORAGE_KEY = 'astrolib_loading_style';
export const LOADING_STYLE_CHANGE_EVENT = 'astrolib:loading-style-changed';

/** 获取读者当前选中的加载动画偏好（默认为 morph 灵动形变） */
export function getLoadingIndicatorStyle(): LoadingIndicatorStyle {
  if (typeof window === 'undefined') return 'morph';
  try {
    const saved = localStorage.getItem(LOADING_STYLE_STORAGE_KEY);
    if (saved === 'native' || saved === 'morph') return saved;
  } catch {
    // ignore
  }
  return 'morph';
}

/** 切换并持久化加载动画风格，通知全站指示器即时重绘 */
export function setLoadingIndicatorStyle(style: LoadingIndicatorStyle): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOADING_STYLE_STORAGE_KEY, style);
  } catch {
    // ignore
  }
  document.documentElement.setAttribute('data-loading-style', style);
  window.dispatchEvent(
    new CustomEvent(LOADING_STYLE_CHANGE_EVENT, {
      detail: { style },
    })
  );
}

/** 辅助方法：从元素解析实时 CSS 颜色值 */
function resolveColor(el: HTMLElement, colorValue: string, fallback: string): string {
  if (!colorValue) return fallback;
  const trimmed = colorValue.trim();

  // 若已经是十六进制或 rgb
  if (trimmed.startsWith('#') || trimmed.startsWith('rgb') || trimmed.startsWith('hsl')) {
    return trimmed;
  }

  // 若为 currentColor
  if (trimmed === 'currentColor') {
    return getComputedStyle(el).color || fallback;
  }

  // 若为 var(--xxx)
  if (trimmed.startsWith('var(')) {
    const varName = trimmed.slice(4, -1).trim();
    const val = getComputedStyle(el).getPropertyValue(varName).trim();
    return val || fallback;
  }

  // 若为 --xxx
  if (trimmed.startsWith('--')) {
    const val = getComputedStyle(el).getPropertyValue(trimmed).trim();
    return val || fallback;
  }

  return trimmed;
}

/** 尺寸字符串到数值的换算 */
export function parseIndicatorSize(sizeAttr: string | number | null | undefined): number {
  if (typeof sizeAttr === 'number') return sizeAttr;
  if (!sizeAttr) return 40;
  const num = parseFloat(sizeAttr);
  if (!isNaN(num) && num > 0) return num;

  switch (sizeAttr) {
    case 'compact':
      return 20;
    case 'small':
      return 28;
    case 'medium':
      return 40;
    case 'large':
      return 56;
    default:
      return 40;
  }
}

/**
 * <m3-loading-indicator> 自定义 Web Component
 */
export class M3LoadingIndicatorElement extends HTMLElement {
  static get observedAttributes() {
    return ['size', 'variant', 'mode', 'color', 'container-color', 'speed', 'paused'];
  }

  private _animator: M3Animator | null = null;
  private _rafId: number | null = null;
  private _canvas: HTMLCanvasElement | null = null;
  private _ctx: CanvasRenderingContext2D | null = null;
  private _intersectionObserver: IntersectionObserver | null = null;
  private _isVisible: boolean = true;
  private _boundStyleHandler: ((e: Event) => void) | null = null;

  constructor() {
    super();
  }

  connectedCallback() {
    // 监听全局风格切换事件
    this._boundStyleHandler = () => this.render();
    window.addEventListener(LOADING_STYLE_CHANGE_EVENT, this._boundStyleHandler);

    // 挂载 IntersectionObserver，仅在可视时执行动画循环以节省 CPU / 电池
    if (typeof IntersectionObserver !== 'undefined') {
      this._intersectionObserver = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          this._isVisible = entry.isIntersecting;
          if (this._isVisible && !this._rafId && this._animator && !this.isPaused) {
            this._startAnimation();
          }
        }
      });
      this._intersectionObserver.observe(this);
    }

    this.render();
  }

  disconnectedCallback() {
    this._stopAnimation();
    if (this._boundStyleHandler) {
      window.removeEventListener(LOADING_STYLE_CHANGE_EVENT, this._boundStyleHandler);
      this._boundStyleHandler = null;
    }
    if (this._intersectionObserver) {
      this._intersectionObserver.disconnect();
      this._intersectionObserver = null;
    }
  }

  attributeChangedCallback(name: string, oldVal: string | null, newVal: string | null) {
    if (oldVal !== newVal && this.isConnected) {
      this.render();
    }
  }

  get size(): number {
    return parseIndicatorSize(this.getAttribute('size'));
  }

  get variant(): 'default' | 'contained' {
    return (this.getAttribute('variant') as any) === 'contained' ? 'contained' : 'default';
  }

  get mode(): 'auto' | 'morph' | 'native' {
    const m = this.getAttribute('mode');
    return m === 'morph' || m === 'native' ? m : 'auto';
  }

  get speed(): number {
    const s = parseFloat(this.getAttribute('speed') || '1');
    return isNaN(s) || s <= 0 ? 1 : s;
  }

  get isPaused(): boolean {
    return this.hasAttribute('paused');
  }

  /** 获取当前实际生效的渲染模式 */
  private _resolveActiveMode(): LoadingIndicatorStyle {
    if (this.mode === 'morph' || this.mode === 'native') {
      return this.mode;
    }
    return getLoadingIndicatorStyle();
  }

  public render() {
    this._stopAnimation();
    this.innerHTML = '';

    const effectiveMode = this._resolveActiveMode();
    const cssSize = this.size;
    const isContained = this.variant === 'contained';

    this.style.display = 'inline-flex';
    this.style.alignItems = 'center';
    this.style.justifyContent = 'center';
    this.style.verticalAlign = 'middle';
    this.style.width = `${cssSize}px`;
    this.style.height = `${cssSize}px`;

    if (effectiveMode === 'morph') {
      // ===== 渲染 M3 灵动形变 Canvas 实现 =====
      const canvas = document.createElement('canvas');
      canvas.className = 'm3-morph-canvas';
      this.appendChild(canvas);
      this._canvas = canvas;

      try {
        this._ctx = setupCanvas(canvas, cssSize);
        this._animator = new M3Animator();
        this._animator.speed = this.speed;

        if (this._isVisible && !this.isPaused) {
          this._startAnimation();
        }
      } catch (err) {
        console.warn('[m3-loading-indicator] Canvas 初始化回退为原生模式:', err);
        this._renderNative(cssSize, isContained);
      }
    } else {
      // ===== 渲染 Google 官方原生 @material/web 实现 =====
      this._renderNative(cssSize, isContained);
    }
  }

  private _renderNative(cssSize: number, isContained: boolean) {
    if (isContained) {
      const container = document.createElement('div');
      container.className = 'm3-loading-contained-box';
      container.style.width = `${cssSize}px`;
      container.style.height = `${cssSize}px`;
      container.style.borderRadius = '50%';
      container.style.display = 'inline-flex';
      container.style.alignItems = 'center';
      container.style.justifyContent = 'center';
      container.style.background = 'var(--md-sys-color-primary-container, rgba(11, 87, 208, 0.12))';

      const innerSize = Math.max(12, Math.round(cssSize * 0.65));
      const progress = document.createElement('md-circular-progress');
      progress.setAttribute('indeterminate', '');
      progress.style.setProperty('--md-circular-progress-size', `${innerSize}px`);
      progress.style.width = `${innerSize}px`;
      progress.style.height = `${innerSize}px`;

      container.appendChild(progress);
      this.appendChild(container);
    } else {
      const progress = document.createElement('md-circular-progress');
      progress.setAttribute('indeterminate', '');
      progress.style.setProperty('--md-circular-progress-size', `${cssSize}px`);
      progress.style.width = `${cssSize}px`;
      progress.style.height = `${cssSize}px`;
      this.appendChild(progress);
    }
  }

  private _startAnimation() {
    if (!this._ctx || !this._animator) return;
    const cssSize = this.size;
    const isContained = this.variant === 'contained';

    // 动态解析 Material 主题颜色
    const colorVal = resolveColor(
      this,
      this.getAttribute('color') || 'var(--md-sys-color-primary)',
      '#0b57d0'
    );
    const containerColorVal = resolveColor(
      this,
      this.getAttribute('container-color') || 'var(--md-sys-color-primary-container)',
      'rgba(11, 87, 208, 0.12)'
    );

    const tick = (ts: number) => {
      if (!this._isVisible || this.isPaused || !this.isConnected || !this._ctx || !this._animator) {
        this._rafId = null;
        return;
      }

      this._animator.update(ts);
      const shape = getMorphedShape(this._animator.morph);

      drawIndicator(this._ctx, cssSize, shape, this._animator.rotation, {
        color: colorVal,
        sizeRatio: isContained ? 0.68 : 0.82,
        contained: isContained,
        containerColor: containerColorVal,
      });

      this._rafId = requestAnimationFrame(tick);
    };

    this._rafId = requestAnimationFrame(tick);
  }

  private _stopAnimation() {
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
    this._canvas = null;
    this._ctx = null;
    this._animator = null;
  }
}

// 自动在全局浏览器环境中注册 Custom Element
if (typeof window !== 'undefined' && !customElements.get('m3-loading-indicator')) {
  customElements.define('m3-loading-indicator', M3LoadingIndicatorElement);
}
