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

  variant?: M3LoadingVariant;

  size?: M3LoadingSize;

  layout?: M3LoadingLayout;

  mode?: M3LoadingMode;

  label?: string;

  sublabel?: string;

  value?: number;

  className?: string;

  id?: string;

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

export function showM3LoadingOverlay(
  container: HTMLElement | null,
  options: Omit<M3LoadingOptions, 'layout'> = {}
): HTMLElement | null {
  if (!container) return null;

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
