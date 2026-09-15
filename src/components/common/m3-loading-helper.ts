/**
 * ============================================================================
 * m3-loading-helper.ts: Programmatic Material 3 Loading Indicator Helper
 * ============================================================================
 * 严格遵照 Google Material 3 官方规范（m3.material.io）:
 * 1. 采用 M3 灵动形变指示器（基于 @alerix/m3-loading-indicator）与官方原生 (@material/web) 双轨架构
 * 2. 严禁自造粗糙 CSS 旋转圈，支持 Default (无底盘) 与 Contained (带圆形容器底盘) 两种形态
 * 3. 供所有客户端 TypeScript Controller（AI 问答、大纲、题库、图谱、巡检器等）动态插入
 * 4. 允许用户在设置中自由切换「灵动形变 (Morph)」与「官方原生 (Native)」风格
 * ============================================================================
 */

import {
  getLoadingIndicatorStyle,
  setLoadingIndicatorStyle,
  LOADING_STYLE_STORAGE_KEY,
  LOADING_STYLE_CHANGE_EVENT,
  type LoadingIndicatorStyle,
} from './m3-loading-indicator';

export {
  getLoadingIndicatorStyle,
  setLoadingIndicatorStyle,
  LOADING_STYLE_STORAGE_KEY,
  LOADING_STYLE_CHANGE_EVENT,
  type LoadingIndicatorStyle,
};

export type M3LoadingVariant = 'default' | 'contained' | 'linear';
export type M3LoadingSize = 'compact' | 'small' | 'medium' | 'large';
export type M3LoadingLayout = 'inline' | 'block' | 'overlay';
export type M3LoadingMode = 'auto' | 'morph' | 'native';

export interface M3LoadingOptions {
  /** 呈现形态：'default' (无底盘悬浮态) | 'contained' (M3 带圆形底盘) | 'linear' (水平进度条) */
  variant?: M3LoadingVariant;
  /** 尺寸档位：'compact' | 'small' | 'medium' | 'large' */
  size?: M3LoadingSize;
  /** 排版布局：'inline' (行内横向排列) | 'block' (居中纵向堆叠) | 'overlay' (全容器遮罩居中) */
  layout?: M3LoadingLayout;
  /** 渲染内核：'auto' (根据读者全局偏好自动适配) | 'morph' (强制形变) | 'native' (强制官方原生) */
  mode?: M3LoadingMode;
  /** 附带主提示文案 */
  label?: string;
  /** 附带副标题说明文案 */
  sublabel?: string;
  /** 当 variant='linear' 时确定进度 (0 ~ 1)，缺省或 -1 时为 indeterminate */
  value?: number;
  /** 附加 CSS class 类名 */
  className?: string;
  /** 根节点 ID */
  id?: string;
  /** 是否开启无障碍实时朗读 (aria-live / role="status")，默认 true */
  accessibility?: boolean;
}

const SIZE_PX_MAP: Record<M3LoadingSize, number> = {
  compact: 20,
  small: 28,
  medium: 40,
  large: 56,
};

const CONTAINED_PX_MAP: Record<M3LoadingSize, number> = {
  compact: 26,
  small: 36,
  medium: 48,
  large: 64,
};

let customElementsLoaded = false;

/**
 * 确保 @material/web 与 m3-loading-indicator 组件已被浏览器 CustomElementRegistry 注册
 */
export async function ensureM3ProgressComponents(): Promise<void> {
  if (customElementsLoaded) return;
  if (typeof window === 'undefined') return;

  const hasCircular = customElements.get('md-circular-progress');
  const hasLinear = customElements.get('md-linear-progress');
  const hasM3Indicator = customElements.get('m3-loading-indicator');
  if (hasCircular && hasLinear && hasM3Indicator) {
    customElementsLoaded = true;
    return;
  }

  await Promise.all([
    import('@material/web/progress/circular-progress.js'),
    import('@material/web/progress/linear-progress.js'),
    import('./m3-loading-indicator.js'),
  ]);
  customElementsLoaded = true;
}

/**
 * 构建符合 Material 3 官方规范的 Loading Indicator HTML 字符串
 * 适用于 innerHTML 或 insertAdjacentHTML
 */
export function createM3LoadingHtml(options: M3LoadingOptions = {}): string {
  const {
    variant = 'default',
    size = 'small',
    layout = 'inline',
    mode = 'auto',
    label,
    sublabel,
    value = -1,
    className = '',
    id,
    accessibility = true,
  } = options;

  // 保证组件在客户端被注册
  if (typeof window !== 'undefined') {
    ensureM3ProgressComponents().catch(() => {});
  }

  const isContained = variant === 'contained';
  const targetPx = isContained
    ? (CONTAINED_PX_MAP[size] || 36)
    : (SIZE_PX_MAP[size] || 28);

  const idAttr = id ? `id="${id}"` : '';
  const a11yAttrs = accessibility ? 'role="status" aria-live="polite"' : '';

  let indicatorHtml = '';
  if (variant === 'linear') {
    const isDeterminate = typeof value === 'number' && value >= 0 && value <= 1;
    indicatorHtml = isDeterminate
      ? `<md-linear-progress value="${value}" class="m3-loading-linear-core"></md-linear-progress>`
      : `<md-linear-progress indeterminate class="m3-loading-linear-core"></md-linear-progress>`;
  } else {
    indicatorHtml = `
      <m3-loading-indicator
        size="${targetPx}"
        variant="${variant}"
        mode="${mode}"
        class="m3-loading-indicator-core"
      >
        <md-circular-progress
          indeterminate
          slot="fallback"
          style="--md-circular-progress-size: ${targetPx}px; width: ${targetPx}px; height: ${targetPx}px;"
        ></md-circular-progress>
      </m3-loading-indicator>
    `.trim();
  }

  let textGroupHtml = '';
  if (label || sublabel) {
    const labelHtml = label
      ? `<span class="m3-loading-label">${escapeHtml(label)}</span>`
      : '';
    const sublabelHtml = sublabel
      ? `<span class="m3-loading-sublabel">${escapeHtml(sublabel)}</span>`
      : '';
    textGroupHtml = `
      <div class="m3-loading-text-group">
        ${labelHtml}
        ${sublabelHtml}
      </div>
    `.trim();
  }

  const classes = [
    'm3-loading-root',
    `m3-loading-${variant}`,
    `m3-loading-size-${size}`,
    `m3-loading-layout-${layout}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return `
    <div class="${classes}" ${idAttr} ${a11yAttrs}>
      ${indicatorHtml}
      ${textGroupHtml}
    </div>
  `.trim();
}

/**
 * 在目标容器上展示全覆盖加载遮罩 (Overlay)
 * 自动添加 position: relative 协调与清理机制
 */
export function showM3LoadingOverlay(
  container: HTMLElement | null,
  options: Omit<M3LoadingOptions, 'layout'> = {}
): HTMLElement | null {
  if (!container) return null;

  // 避免重复叠加遮罩
  hideM3LoadingOverlay(container);

  const prevPos = getComputedStyle(container).position;
  if (!prevPos || prevPos === 'static') {
    container.style.position = 'relative';
    container.dataset.m3ResetPosition = 'true';
  }

  const overlayEl = document.createElement('div');
  overlayEl.className = 'm3-loading-overlay-host';
  overlayEl.innerHTML = createM3LoadingHtml({
    variant: 'contained',
    size: 'medium',
    layout: 'overlay',
    ...options,
  });

  container.appendChild(overlayEl);
  return overlayEl;
}

/**
 * 隐藏并移除目标容器上的全覆盖加载遮罩
 */
export function hideM3LoadingOverlay(container: HTMLElement | null): void {
  if (!container) return;
  const overlay = container.querySelector(':scope > .m3-loading-overlay-host');
  if (overlay) {
    overlay.remove();
  }
  if (container.dataset.m3ResetPosition === 'true') {
    container.style.position = '';
    delete container.dataset.m3ResetPosition;
  }
}

/**
 * 按钮级 Loading 状态控制器
 * 自动禁用按钮、缓存原有内部 DOM，并置换为小型 M3 Loading 指示器
 */
export function setButtonLoading(
  button: HTMLButtonElement | null,
  loading: boolean,
  loadingText?: string
): void {
  if (!button) return;

  if (loading) {
    if (button.dataset.m3BtnLoading === 'true') return;
    button.dataset.m3BtnLoading = 'true';
    button.dataset.m3OriginalHtml = button.innerHTML;
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');

    button.innerHTML = createM3LoadingHtml({
      variant: 'default',
      size: 'compact',
      layout: 'inline',
      label: loadingText,
      accessibility: false,
    });
  } else {
    if (button.dataset.m3BtnLoading !== 'true') return;
    delete button.dataset.m3BtnLoading;
    button.disabled = false;
    button.removeAttribute('aria-busy');
    if (button.dataset.m3OriginalHtml) {
      button.innerHTML = button.dataset.m3OriginalHtml;
      delete button.dataset.m3OriginalHtml;
    }
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
