import { getOverlayRoot, mountToOverlayRoot } from '../utils/overlay/overlay-root';
import {
  applyFontPref,
  clearFontPref,
  loadFontPref,
  saveFontPref,
  DEFAULT_PREF,
  LATIN_PRESETS,
  CJK_PRESETS,
  type FontPref,
  type LatinFont,
  type CjkFont,
} from './font-presets';

import {
  loadSiteTheme,
  setSiteTheme,
  parseSiteTheme,
  type SiteThemeId,
} from './site-themes';

import { DEFAULT_SITE_THEME } from '../config/themes.config.mjs';
import {
  applyThemeColor,
  loadThemeColor,
  saveThemeColor,
  DEFAULT_THEME_COLOR_ID,
} from '../themes/material-you/color-engine';
import { enableFormulaActions, disableFormulaActions } from './formula/ui';
import {
  getAllAiProviders,
  getAiProvider,
  getActiveAiProviderId,
  saveAiActiveProvider,
  getProviderApiKey,
  saveProviderApiKey,
  getProviderEndpoint,
  saveProviderEndpoint,
  getModelsByProvider,
  getAllAiModels,
  getActiveAiModelId,
  saveAiActiveModel,
  addCustomAiModel,
  onAiConfigChange,
  testAiConnection,
  getAiParams,
  saveAiParams,
  getAiAnswerMode,
  saveAiAnswerMode,
  getAiSourceOpen,
  saveAiSourceOpen,
  getAiPanelDimensions,
  saveAiPanelDimensions,
  getAiAutoCollapsePreceding,
  saveAiAutoCollapsePreceding,
} from '../ai/ai-config';

const STORAGE_KEY = 'starlight-features';

const THEME_TRANSITION_KEY = 'starlight-theme-transition';

export const PREWARM_PAGES_KEY = 'astrolib_prewarm_pages';
export const DEFAULT_PREWARM_PAGES = 1;

export function loadPrewarmPref(): number {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(PREWARM_PAGES_KEY) : null;
    if (raw !== null && raw !== undefined && raw !== '') {
      const val = parseInt(raw, 10);
      if (!isNaN(val)) return val;
    }
    return DEFAULT_PREWARM_PAGES;
  } catch {
    return DEFAULT_PREWARM_PAGES;
  }
}

export function savePrewarmPref(val: number): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(PREWARM_PAGES_KEY, String(val));
    }
    window.dispatchEvent(new CustomEvent('prewarm:config-change', { detail: { pages: val } }));
  } catch {}
}

export const TYPOGRAPHY_INDENT_KEY = 'astrolib_typography_indent';

export function loadParagraphIndent(): boolean {
  try {
    if (typeof localStorage !== 'undefined') {
      const val = localStorage.getItem(TYPOGRAPHY_INDENT_KEY);
      if (val === 'false') return false;
    }
    return true;
  } catch {
    return true;
  }
}

export function saveParagraphIndent(enabled: boolean): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(TYPOGRAPHY_INDENT_KEY, String(enabled));
    }
  } catch {}
  applyParagraphIndent(enabled);
}

export function applyParagraphIndent(enabled: boolean = loadParagraphIndent()): void {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.paragraphIndent = enabled ? 'true' : 'false';
}

export const PUNCT_STYLE_KEY = 'astrolib_punct_style';
export type PunctStyle = 'dot' | 'circle';

export function loadPunctStyle(): PunctStyle {
  try {
    if (typeof localStorage !== 'undefined') {
      const val = localStorage.getItem(PUNCT_STYLE_KEY);
      if (val === 'circle') return 'circle';
    }
    return 'dot';
  } catch {
    return 'dot';
  }
}

export function savePunctStyle(style: PunctStyle): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(PUNCT_STYLE_KEY, style);
    }
  } catch {}
  applyPunctStyle(style);
}

export function replaceBodyFullStops(targetStyle: PunctStyle): void {
  if (typeof document === 'undefined') return;
  const root = document.querySelector('.sl-markdown-content');
  if (!root) return;

  const fromChar = targetStyle === 'circle' ? '．' : '。';
  const toChar = targetStyle === 'circle' ? '。' : '．';

  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_SKIP;
        if (parent.closest('pre, code, .katex, .katex-display, script, style, .fig-ref-badge, .block-ref-badge')) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  let current = walker.nextNode();
  while (current) {
    if (current.nodeValue && current.nodeValue.includes(fromChar)) {
      current.nodeValue = current.nodeValue.replaceAll(fromChar, toChar);
    }
    current = walker.nextNode();
  }
}

export function applyPunctStyle(style: PunctStyle = loadPunctStyle()): void {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.punctStyle = style;
  replaceBodyFullStops(style);
}

export const FONT_SIZE_KEY = 'astrolib_font_size';
export const DEFAULT_FONT_SIZE = 16;
export const MIN_FONT_SIZE = 14;
export const MAX_FONT_SIZE = 22;

export function loadFontSize(): number {
  try {
    if (typeof localStorage !== 'undefined') {
      const val = parseInt(localStorage.getItem(FONT_SIZE_KEY) || '', 10);
      if (!isNaN(val) && val >= MIN_FONT_SIZE && val <= MAX_FONT_SIZE) {
        return val;
      }
    }
    return DEFAULT_FONT_SIZE;
  } catch {
    return DEFAULT_FONT_SIZE;
  }
}

export function formatFontSizePt(px: number): string {
  const pt = px * 0.75;
  return `${parseFloat(pt.toFixed(2))} pt`;
}

export function formatFontSizeRem(px: number): string {
  return formatFontSizePt(px);
}

export function saveFontSize(val: number): void {
  const clamped = Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, Math.round(val)));
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(FONT_SIZE_KEY, String(clamped));
    }
  } catch {}
  applyFontSize(clamped);
}

export function applyFontSize(val: number = loadFontSize()): void {
  if (typeof document === 'undefined') return;
  const pt = val * 0.75;
  document.documentElement.style.setProperty('--academic-font-size-body', `${parseFloat(pt.toFixed(2))}pt`);
  syncAllFontSizeSliders(val);
}

export function syncAllFontSizeSliders(val: number = loadFontSize()): void {
  if (typeof document === 'undefined') return;
  const ptText = formatFontSizePt(val);
  document.querySelectorAll<any>('[data-font-size-val]').forEach((badge) => {
    if ('label' in badge) {
      badge.label = ptText;
    }
    badge.textContent = ptText;
    badge.setAttribute('label', ptText);
  });

  document.querySelectorAll<any>('[data-font-size-slider]').forEach((slider) => {
    if (slider.value !== val) {
      slider.value = val;
    }
    slider.valueLabel = ptText;
  });
}

export const THEME_MODE_STORAGE_KEY = 'starlight-theme';
export type ThemeMode = 'light' | 'dark' | 'auto';

export function loadThemeMode(): ThemeMode {
  try {
    if (typeof localStorage !== 'undefined') {
      const val = localStorage.getItem(THEME_MODE_STORAGE_KEY);
      if (val === 'light' || val === 'dark') return val;
      if (val === 'auto') return 'auto';
    }
  } catch {}
  return 'auto';
}

export function saveThemeMode(mode: ThemeMode): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(THEME_MODE_STORAGE_KEY, mode === 'light' || mode === 'dark' ? mode : '');
    }
  } catch {}
}

export function applyThemeMode(mode?: ThemeMode): void {
  if (typeof document === 'undefined') return;
  const currentMode = mode || loadThemeMode();
  const root = document.documentElement;
  const animate = localStorage.getItem(THEME_TRANSITION_KEY) === 'animate';
  if (!animate) root.classList.add('theme-switching');

  const resolved =
    currentMode === 'auto'
      ? window.matchMedia('(prefers-color-scheme: light)').matches
        ? 'light'
        : 'dark'
      : currentMode;
  root.dataset.theme = resolved;

  if (!animate) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => root.classList.remove('theme-switching'));
    });
  }

  document.querySelectorAll('starlight-theme-select').forEach((el: any) => {
    if (typeof el.syncIcon === 'function') el.syncIcon();
    else el.classList.toggle('is-dark', resolved === 'dark');
  });

  window.dispatchEvent(new CustomEvent('starlight-theme-change', { detail: { mode: currentMode, resolved } }));
}

export function syncAllThemeModes(): void {
  const currentMode = loadThemeMode();
  document.querySelectorAll('.ft-panel .ft-mode-btn, starlight-feature-toggles .ft-mode-btn').forEach((btn) => {
    const val = btn.getAttribute('data-mode-val');
    const active = val === currentMode;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-checked', String(active));
    const modeIcon = btn.querySelector('.ft-mode-icon');
    const checkIcon = btn.querySelector('.ft-mode-check-icon');
    if (modeIcon) modeIcon.classList.toggle('hidden', active);
    if (checkIcon) checkIcon.classList.toggle('hidden', !active);
  });
}

type FeatureMeta = { id: string; label: string; build: boolean; runtime: boolean; devOnly: boolean };

let meta: FeatureMeta[] = [];

let toggles: Record<string, boolean> = {};

const metaOf = (id: string): FeatureMeta | undefined => meta.find((m) => m.id === id);

function parseMeta(el: HTMLElement | null): FeatureMeta[] {
  try {
    return JSON.parse(el?.getAttribute('data-meta') || '[]') as FeatureMeta[];
  } catch {
    return [];
  }
}

function loadToggles(): void {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    toggles = raw ? JSON.parse(raw) : {};
  } catch {
    toggles = {};
  }
}

function saveToggles(): void {
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(toggles));
  } catch {

  }
}

function loadThemeTransition(): string {
  try {
    return localStorage.getItem(THEME_TRANSITION_KEY) || 'instant';
  } catch {
    return 'instant';
  }
}

export function isRuntimeSwitchable(id: string): boolean {
  const m = metaOf(id);
  return !!m && m.runtime && m.build;
}

export function isEnabled(id: string): boolean {
  const m = metaOf(id);
  if (!m || !m.build) return false;
  return toggles[id] !== false;
}

export function resetToggles(): void {
  toggles = {};
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(THEME_TRANSITION_KEY);
      localStorage.removeItem('starlight-m3-theme-color');
    }
  } catch {}

  saveFontPref(DEFAULT_PREF);
  applyFontPref(DEFAULT_PREF);

  setSiteTheme(DEFAULT_SITE_THEME);

  saveThemeColor(DEFAULT_THEME_COLOR_ID);
  applyThemeColor(DEFAULT_THEME_COLOR_ID);

  saveThemeMode('auto');
  applyThemeMode('auto');

  savePrewarmPref(DEFAULT_PREWARM_PAGES);

  saveParagraphIndent(true);
  savePunctStyle('dot');
  saveFontSize(DEFAULT_FONT_SIZE);

  syncAllCheckboxes();
  syncAllThemeModes();
  syncAllFontButtons();
  syncAllThemeChips();
  syncAllThemeColors();
  syncAllPrewarmButtons();
  syncAllAiSettings();
  syncAllPunctChips();
  syncAllFontSizeSliders();
  apply();
}

export function syncAllAiSettings(): void {
  const activeProviderId = getActiveAiProviderId();
  const provider = getAiProvider(activeProviderId);
  const providerModels = getModelsByProvider(activeProviderId);
  const activeModelId = getActiveAiModelId();
  const key = getProviderApiKey(activeProviderId);
  const endpoint = getProviderEndpoint(activeProviderId);
  const params = getAiParams();
  const mode = getAiAnswerMode();
  const srcOpen = getAiSourceOpen();
  const dimensions = getAiPanelDimensions();

  document.querySelectorAll('.ft-panel, starlight-feature-toggles').forEach((root) => {

    root.querySelectorAll<any>('.ft-ai-provider-chip-set md-filter-chip').forEach((chip) => {
      const pId = chip.getAttribute('data-provider-id');
      const isSelected = pId === activeProviderId;
      chip.selected = isSelected;
      chip.classList.toggle('active', isSelected);
    });

    const providerBadge = root.querySelector<HTMLElement>('.ft-ai-provider-badge');
    if (providerBadge) {
      providerBadge.textContent = provider.label;
    }

    const select = root.querySelector<HTMLSelectElement>('.ft-ai-model-select');
    if (select) {
      if (providerModels.length > 0) {
        select.innerHTML = providerModels
          .map(
            (m) =>
              `<option value="${m.id}" ${m.id === activeModelId ? 'selected' : ''} title="${m.desc || ''}">${m.label}${m.isCustom ? ' (自定义)' : ''}</option>`
          )
          .join('');
        select.value = activeModelId;
        select.disabled = false;
      } else {
        select.innerHTML = `<option value="">暂无模型 (点击上方添加)</option>`;
        select.disabled = true;
      }
    }

    const keyInput = root.querySelector<any>('.ft-ai-key-input');
    if (keyInput && !keyInput.matches?.(':focus-within') && document.activeElement !== keyInput) {
      keyInput.value = key;
      keyInput.type = 'password';
      keyInput.placeholder = provider.keyPlaceholder || '填写 API Key';
      const revealBtn = root.querySelector<any>('.ft-ai-key-reveal');
      if (revealBtn) {
        revealBtn.selected = false;
      }
    }

    const keyBadge = root.querySelector<HTMLElement>('.ft-ai-key-badge, .ft-ai-key-chip');
    if (keyBadge) {
      const hasKey = !!key.trim();
      const labelEl = keyBadge.querySelector<HTMLElement>('.ft-chip-label') || keyBadge;
      labelEl.textContent = hasKey ? '已配置' : '未配置';
      keyBadge.classList.toggle('configured', hasKey);
    }

    const endpointInput = root.querySelector<any>('.ft-ai-endpoint-input');
    if (endpointInput && !endpointInput.matches?.(':focus-within') && document.activeElement !== endpointInput) {
      endpointInput.value = endpoint;
      endpointInput.placeholder = provider.defaultEndpoint || 'OpenAI 兼容端点 URL';
    }

    root.querySelectorAll<any>('.ft-ai-mode-chip-set md-filter-chip').forEach((chip) => {
      const chipVal = chip.getAttribute('data-ai-mode-val');
      const isSelected = chipVal === mode;
      chip.selected = isSelected;
      chip.classList.toggle('active', isSelected);
    });

    root.querySelectorAll<any>('.ft-ai-src-chip-set md-filter-chip').forEach((chip) => {
      const chipVal = chip.getAttribute('data-ai-src-val');
      const isSelected = chipVal === srcOpen;
      chip.selected = isSelected;
      chip.classList.toggle('active', isSelected);
    });

    const topkSlider = root.querySelector<any>('.ft-ai-topk-slider');
    if (topkSlider) {
      topkSlider.value = params.topK;
    }
    const topkChip = root.querySelector<any>('.ft-ai-topk-val-chip');
    if (topkChip) {
      topkChip.label = `${params.topK} 条`;
    }

    const maxCtxInput = root.querySelector<any>('.ft-ai-maxctx-input');
    if (maxCtxInput && !maxCtxInput.matches?.(':focus-within') && document.activeElement !== maxCtxInput) {
      maxCtxInput.value = String(params.maxContextChars);
    }
    const maxTokInput = root.querySelector<any>('.ft-ai-maxtok-input');
    if (maxTokInput && !maxTokInput.matches?.(':focus-within') && document.activeElement !== maxTokInput) {
      maxTokInput.value = String(params.maxTokens);
    }

    const collapseToggle = root.querySelector<HTMLInputElement>('.ft-ai-collapse-preceding-toggle');
    if (collapseToggle) {
      collapseToggle.checked = getAiAutoCollapsePreceding();
    }

    root.querySelectorAll<any>('.ft-ai-win-chip-set md-filter-chip').forEach((chip) => {
      const chipVal = chip.getAttribute('data-ai-win-val');
      const isSelected = chipVal === dimensions.preset;
      chip.selected = isSelected;
      chip.classList.toggle('active', isSelected);
      if (chipVal === 'custom') {
        const custW = dimensions.customWidth || dimensions.width;
        chip.label = `自定义 (${custW}px)`;
        chip.title = `自定义尺寸 (${custW}px × ${dimensions.customHeight || dimensions.height}px)`;
      }
    });
  });
}

export function syncAllPrewarmButtons(): void {
  const current = loadPrewarmPref();
  document.querySelectorAll('.ft-panel .ft-prewarm-btn, starlight-feature-toggles .ft-prewarm-btn').forEach((btn) => {
    const val = parseInt(btn.getAttribute('data-prewarm-val') || '-1', 10);
    const active = val === current;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-selected', String(active));
  });
}

function applyFont(): void {
  if (!isEnabled('fonts')) {
    clearFontPref();
  } else {
    applyFontPref(loadFontPref());
  }
}

function applyEditorAllowed(): void {
  (window as unknown as Record<string, unknown>).__dshFeatureEditorAllowed = isEnabled('editor');
}

function applyCrossRef(): void {
  const root = document.documentElement;
  const enabled = isEnabled('crossRef');
  root.classList.toggle('dsh-crossref-off', !enabled);
}

function applyFormulaActions(): void {
  if (isEnabled('formulaActions')) {
    enableFormulaActions();
  } else {
    disableFormulaActions();
  }
}

export function apply(): void {
  if (meta.length === 0) return;

  for (const el of document.querySelectorAll('[data-feature]')) {
    const id = el.getAttribute('data-feature') || '';
    el.classList.toggle('dsh-feature-off', !isEnabled(id));
  }

  document.querySelectorAll<HTMLInputElement>('input[type="checkbox"][data-theme-transition]').forEach((cb) => {
    cb.disabled = !isEnabled('theme');
  });

  applyFont();
  applyCrossRef();
  applyEditorAllowed();
  applyFormulaActions();
  document.dispatchEvent(new CustomEvent('dsh:feature-change'));
}

function syncAllCheckboxes(): void {
  document
    .querySelectorAll<HTMLInputElement>('input[type="checkbox"][data-feature-id]')
    .forEach((cb) => {
      const id = cb.getAttribute('data-feature-id') || '';
      cb.checked = toggles[id] !== false;
      cb.disabled = !isRuntimeSwitchable(id);
    });

  document
    .querySelectorAll<any>('md-switch[data-feature-id]')
    .forEach((sw) => {
      const id = sw.getAttribute('data-feature-id') || '';
      sw.selected = toggles[id] !== false;
      sw.disabled = !isRuntimeSwitchable(id);
    });

  document
    .querySelectorAll<HTMLInputElement>('input[type="checkbox"][data-theme-transition]')
    .forEach((cb) => {
      cb.checked = loadThemeTransition() === 'animate';
      cb.disabled = !isEnabled('theme');
    });

  document
    .querySelectorAll<any>('md-switch[data-theme-transition]')
    .forEach((sw) => {
      sw.selected = loadThemeTransition() === 'animate';
      sw.disabled = !isEnabled('theme');
    });

  document
    .querySelectorAll<HTMLInputElement>('input[type="checkbox"][data-typography-indent]')
    .forEach((cb) => {
      cb.checked = loadParagraphIndent();
    });

  document
    .querySelectorAll<any>('md-switch[data-typography-indent]')
    .forEach((sw) => {
      sw.selected = loadParagraphIndent();
    });
}

export function syncAllPunctChips(): void {
  const current = loadPunctStyle();
  document.querySelectorAll<any>('.ft-panel .ft-punct-chip, starlight-feature-toggles .ft-punct-chip').forEach((chip) => {
    const val = chip.getAttribute('data-punct-val');
    const active = val === current;
    chip.classList.toggle('active', active);
    chip.setAttribute('aria-selected', String(active));
    if ('selected' in chip) {
      chip.selected = active;
    }
  });
}

function syncAllFontButtons(): void {
  const pref = loadFontPref();
  document.querySelectorAll<any>('.ft-panel .ft-font-btn, starlight-feature-toggles .ft-font-btn, .ft-panel .ft-font-chip, starlight-feature-toggles .ft-font-chip').forEach((el) => {
    const setting = el.getAttribute('data-font-setting');
    const val = el.getAttribute('data-font-val');
    const active = setting === 'latin' ? val === pref.latin : val === pref.cjk;
    el.classList.toggle('active', active);
    el.setAttribute('aria-selected', String(active));
    if ('selected' in el) {
      el.selected = active;
    }
  });
}

function syncAllThemeChips(): void {
  const theme = loadSiteTheme();
  document.querySelectorAll('.ft-panel .ft-theme-chip, starlight-feature-toggles .ft-theme-chip').forEach((chip) => {
    const val = chip.getAttribute('data-site-theme-val');
    const active = val === theme;
    chip.classList.toggle('active', active);
    chip.setAttribute('aria-selected', String(active));
  });
}

export function syncAllThemeColors(): void {
  const currentColor = loadThemeColor();
  document.querySelectorAll('.ft-panel .ft-preset-swatch, starlight-feature-toggles .ft-preset-swatch').forEach((swatch) => {
    const val = swatch.getAttribute('data-m3-color');
    const active = val === currentColor;
    swatch.classList.toggle('active', active);
    swatch.setAttribute('aria-selected', String(active));
  });

  document.querySelectorAll<HTMLInputElement>('.ft-color-native-input').forEach((input) => {
    if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(currentColor)) {
      input.value = currentColor;
    }
  });

  const isCustomHex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(currentColor);
  document.querySelectorAll<HTMLElement>('.ft-custom-color-tile').forEach((tile) => {
    tile.classList.toggle('active', isCustomHex);
    const dropper = tile.querySelector<HTMLElement>('.ft-eyedropper-circle');
    if (dropper) {
      dropper.style.backgroundColor = isCustomHex ? currentColor : '';
    }
  });
}

let documentBound = false;
function bindDocument(): void {
  if (documentBound) return;
  documentBound = true;

  document.addEventListener('click', (e) => {
    const path = e.composedPath();
    const isInside = path.some(
      (node) =>
        node instanceof HTMLElement &&
        (node.closest?.('.ft-panel') || node.closest?.('.ft-toggle-btn'))
    );
    if (isInside) return;

    const isDesktopM3 =
      document.documentElement.dataset.siteTheme === 'material-you' &&
      window.matchMedia('(min-width: 50rem)').matches;
    if (isDesktopM3) return;

    document.querySelectorAll<StarlightFeatureToggles>('starlight-feature-toggles').forEach((host) => {
      host.closePanel();
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    document.querySelectorAll<StarlightFeatureToggles>('starlight-feature-toggles').forEach((host) => {
      host.closePanel();
    });
  });
}

const parseLatin = (v: unknown): LatinFont =>
  LATIN_PRESETS.some((p) => p.value === v) ? (v as LatinFont) : 'sans';

const parseCjk = (v: unknown): CjkFont =>
  CJK_PRESETS.some((p) => p.value === v) ? (v as CjkFont) : 'sans';

class StarlightFeatureToggles extends HTMLElement {
  panel: HTMLElement | null = null;
  backdrop: HTMLElement | null = null;

  connectedCallback() {
    if (this.dataset.bound) return;
    this.dataset.bound = '1';

    this.panel = this.querySelector('.ft-panel');
    this.backdrop = this.querySelector('.ft-backdrop');

    meta = parseMeta(this);
    this.ensurePortal();
    this.bindToggle();
    this.bindClose();
    this.bindDrag();
    this.bindUI();
    this.bindThemeMode();
    this.bindFonts();
    this.bindSiteThemes();
    this.bindThemeColors();
    this.bindPrewarm();
    this.bindAiSettings();

    syncAllCheckboxes();
    syncAllThemeModes();
    syncAllFontButtons();
    syncAllThemeChips();
    syncAllThemeColors();
    syncAllPrewarmButtons();
    syncAllAiSettings();
    syncAllPunctChips();
    syncAllFontSizeSliders();
    apply();
  }

  disconnectedCallback() {
    this.closePanel();
    const overlayRoot = getOverlayRoot();
    if (this.panel && (this.panel.parentElement === overlayRoot || this.panel.parentElement === document.body)) {
      this.panel.remove();
    }
    if (this.backdrop && (this.backdrop.parentElement === overlayRoot || this.backdrop.parentElement === document.body)) {
      this.backdrop.remove();
    }
    document.documentElement.classList.remove('ft-scroll-lock');
  }

  ensurePortal() {
    const isMobile = window.matchMedia('(max-width: 49.999rem)').matches;
    if (!this.panel || !this.backdrop) return;

    const overlayRoot = getOverlayRoot();
    if (isMobile) {

      if (this.panel.parentElement !== overlayRoot) {
        mountToOverlayRoot(this.backdrop);
        mountToOverlayRoot(this.panel);
      }
    } else {

      if (this.panel.parentElement === overlayRoot || this.panel.parentElement === document.body) {
        this.appendChild(this.backdrop);
        this.appendChild(this.panel);
      }
    }
  }

  bindToggle() {
    this.querySelector<HTMLButtonElement>('.ft-toggle-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = this.classList.contains('ft-is-open') || this.panel?.classList.contains('ft-is-open');
      if (isOpen) this.closePanel();
      else this.openPanel();
    });
  }

  bindClose() {
    this.panel?.querySelector<HTMLButtonElement>('.ft-close')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.closePanel();
    });

    this.backdrop?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.closePanel();
    });
  }

  bindDrag() {
    if (!this.panel) return;
    const handle = this.panel.querySelector<HTMLElement>('.ft-sheet-handle');
    const head = this.panel.querySelector<HTMLElement>('.ft-panel-head');
    const dragTargets = [handle, head].filter(Boolean) as HTMLElement[];

    let startY = 0;
    let currentDeltaY = 0;
    let startTime = 0;
    let isDragging = false;

    const onPointerDown = (e: PointerEvent) => {

      if (!window.matchMedia('(max-width: 49.999rem)').matches) return;

      if ((e.target as Element)?.closest('.ft-close')) return;

      isDragging = true;
      startY = e.clientY;
      currentDeltaY = 0;
      startTime = Date.now();

      if (this.panel) {
        this.panel.style.transition = 'none';
        this.panel.classList.add('ft-is-dragging');
      }
      if (this.backdrop) {
        this.backdrop.style.transition = 'none';
      }

      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging || !this.panel) return;
      const dy = e.clientY - startY;

      if (dy > 0) {

        currentDeltaY = dy;
        this.panel.style.transform = `translateY(${dy}px)`;
        if (this.backdrop) {
          const opacity = Math.max(0, 1 - dy / 320);
          this.backdrop.style.opacity = `${opacity}`;
        }
      } else {

        currentDeltaY = dy * 0.2;
        this.panel.style.transform = `translateY(${currentDeltaY}px)`;
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!isDragging || !this.panel) return;
      isDragging = false;

      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}

      this.panel.style.transition = '';
      this.panel.classList.remove('ft-is-dragging');
      if (this.backdrop) this.backdrop.style.transition = '';

      const duration = Date.now() - startTime;
      const velocity = currentDeltaY / Math.max(duration, 1);

      if (currentDeltaY > 90 || (currentDeltaY > 30 && velocity > 0.4)) {
        this.closePanel();
      } else {

        this.panel.style.transform = '';
        if (this.backdrop) this.backdrop.style.opacity = '';
      }
    };

    dragTargets.forEach((target) => {
      target.addEventListener('pointerdown', onPointerDown);
      target.addEventListener('pointermove', onPointerMove);
      target.addEventListener('pointerup', onPointerUp);
      target.addEventListener('pointercancel', onPointerUp);
    });
  }

  bindUI() {
    const root = this.panel || this;
    root.querySelectorAll<HTMLInputElement>('input[type="checkbox"][data-feature-id]').forEach((cb) => {
      const id = cb.getAttribute('data-feature-id') || '';
      cb.checked = toggles[id] !== false;
      cb.disabled = !isRuntimeSwitchable(id);
      cb.addEventListener('change', () => {
        toggles[id] = cb.checked;
        saveToggles();
        syncAllCheckboxes();
        apply();
      });
    });

    root.querySelectorAll<any>('md-switch[data-feature-id]').forEach((sw) => {
      const id = sw.getAttribute('data-feature-id') || '';
      sw.selected = toggles[id] !== false;
      sw.disabled = !isRuntimeSwitchable(id);
      sw.addEventListener('change', () => {
        toggles[id] = sw.selected;
        saveToggles();
        syncAllCheckboxes();
        apply();
      });
    });

    root.querySelectorAll<HTMLInputElement>('input[type="checkbox"][data-theme-transition]').forEach((cb) => {
      cb.checked = loadThemeTransition() === 'animate';
      cb.disabled = !isEnabled('theme');
      cb.addEventListener('change', () => {
        try {
          localStorage.setItem(THEME_TRANSITION_KEY, cb.checked ? 'animate' : 'instant');
        } catch {}
      });
    });

    root.querySelectorAll<any>('md-switch[data-theme-transition]').forEach((sw) => {
      sw.selected = loadThemeTransition() === 'animate';
      sw.disabled = !isEnabled('theme');
      sw.addEventListener('change', () => {
        try {
          localStorage.setItem(THEME_TRANSITION_KEY, sw.selected ? 'animate' : 'instant');
        } catch {}
      });
    });

    root.querySelectorAll<HTMLButtonElement>('[data-action="reset-defaults"]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        resetToggles();
      });
    });

    root.querySelectorAll<HTMLButtonElement>('[data-inspector-trigger]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closePanel();
      });
    });

    root.querySelectorAll<HTMLInputElement>('input[type="checkbox"][data-typography-indent]').forEach((cb) => {
      cb.checked = loadParagraphIndent();
      cb.addEventListener('change', () => {
        saveParagraphIndent(cb.checked);
        syncAllCheckboxes();
      });
    });

    root.querySelectorAll<any>('md-switch[data-typography-indent]').forEach((sw) => {
      sw.selected = loadParagraphIndent();
      sw.addEventListener('change', () => {
        saveParagraphIndent(sw.selected);
        syncAllCheckboxes();
      });
    });

    root.querySelectorAll<HTMLElement>('.ft-punct-chip').forEach((chip) => {
      const handleSelect = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        const val = chip.getAttribute('data-punct-val') as PunctStyle;
        if (val) {
          savePunctStyle(val);
          syncAllPunctChips();
        }
      };
      chip.addEventListener('click', handleSelect);
      chip.addEventListener('change', handleSelect);
    });

    root.querySelectorAll<any>('[data-font-size-slider]').forEach((slider) => {
      const initVal = loadFontSize();
      slider.value = initVal;
      slider.valueLabel = formatFontSizePt(initVal);

      const handleInput = () => {
        const val = typeof slider.value === 'number' ? slider.value : parseInt(slider.value, 10);
        if (!isNaN(val)) {
          slider.valueLabel = formatFontSizePt(val);
          saveFontSize(val);
        }
      };

      slider.addEventListener('input', handleInput);
      slider.addEventListener('change', handleInput);
    });
  }

  bindFonts() {
    const root = this.panel || this;
    root.querySelectorAll<HTMLElement>('.ft-font-btn, .ft-font-chip').forEach((btn) => {
      const handleSelect = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        const setting = btn.getAttribute('data-font-setting');
        const val = btn.getAttribute('data-font-val');
        const current = loadFontPref();
        const next: FontPref =
          setting === 'latin'
            ? { ...current, latin: parseLatin(val) }
            : { ...current, cjk: parseCjk(val) };
        saveFontPref(next);
        applyFontPref(next);
        syncAllFontButtons();
      };
      btn.addEventListener('click', handleSelect);
      btn.addEventListener('change', handleSelect);
    });
  }

  bindSiteThemes() {
    const root = this.panel || this;
    root.querySelectorAll<HTMLButtonElement>('.ft-theme-chip').forEach((chip) => {
      chip.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (chip.disabled || chip.hasAttribute('disabled') || chip.classList.contains('is-disabled')) {
          return;
        }
        const targetTheme = parseSiteTheme(chip.getAttribute('data-site-theme-val'));
        setSiteTheme(targetTheme);
        syncAllThemeChips();
      });
    });
  }

  bindThemeMode() {
    const root = this.panel || this;
    root.querySelectorAll<HTMLButtonElement>('.ft-mode-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const mode = btn.getAttribute('data-mode-val') as ThemeMode;
        if (mode) {
          saveThemeMode(mode);
          applyThemeMode(mode);
          syncAllThemeModes();
        }
      });
    });
  }

  bindThemeColors() {
    const root = this.panel || this;
    root.querySelectorAll<HTMLButtonElement>('.ft-preset-swatch').forEach((swatch) => {
      swatch.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const colorVal = swatch.getAttribute('data-m3-color');
        if (colorVal) {
          saveThemeColor(colorVal);
          applyThemeColor(colorVal);
          syncAllThemeColors();
        }
      });
    });

    root.querySelectorAll<HTMLElement>('.ft-custom-color-tile, [data-action="open-custom-color"]').forEach((tile) => {
      const colorInput = tile.querySelector<HTMLInputElement>('.ft-color-native-input');
      tile.addEventListener('click', (e) => {
        if (e.target === colorInput) return;
        e.preventDefault();
        e.stopPropagation();
        if (colorInput) {
          try {
            if ('showPicker' in colorInput && typeof (colorInput as any).showPicker === 'function') {
              (colorInput as any).showPicker();
            } else {
              colorInput.click();
            }
          } catch {
            colorInput.click();
          }
        }
      });
    });

    root.querySelectorAll<HTMLInputElement>('.ft-color-native-input').forEach((input) => {
      const handleCustom = (e: Event) => {
        e.stopPropagation();
        const hex = (e.target as HTMLInputElement).value;
        if (hex) {
          saveThemeColor(hex);
          applyThemeColor(hex);
          syncAllThemeColors();
        }
      };
      input.addEventListener('input', handleCustom);
      input.addEventListener('change', handleCustom);
    });
  }

  bindPrewarm() {
    const root = this.panel || this;
    root.querySelectorAll<HTMLButtonElement>('.ft-prewarm-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const val = parseInt(btn.getAttribute('data-prewarm-val') || '-1', 10);
        savePrewarmPref(val);
        syncAllPrewarmButtons();
      });
    });
  }

  bindAiSettings() {
    const root = this.panel || this;
    const modelSelect = root.querySelector<HTMLSelectElement>('.ft-ai-model-select');
    const keyInput = root.querySelector<any>('.ft-ai-key-input');
    const endpointInput = root.querySelector<any>('.ft-ai-endpoint-input');
    const revealBtn = root.querySelector<any>('.ft-ai-key-reveal');
    const customToggle = root.querySelector<HTMLButtonElement>('[data-action="toggle-custom-model"]');
    const customForm = root.querySelector<HTMLElement>('.ft-ai-custom-form');
    const customCancel = root.querySelector<HTMLButtonElement>('[data-action="cancel-custom-model"]');
    const customAddBtn = root.querySelector<HTMLButtonElement>('[data-action="add-custom-model"]');
    const testBtn = root.querySelector<any>('[data-action="test-ai-connection"]');

    const setTestStatus = (state: 'idle' | 'loading' | 'ok' | 'err', message = '') => {
      const allStatusChips = document.querySelectorAll<HTMLElement>('.ft-ai-test-status');
      allStatusChips.forEach((chip) => {
        const textEl = chip.querySelector<HTMLElement>('.ft-test-chip-text');
        const okIcon = chip.querySelector<HTMLElement>('.ft-test-chip-icon-ok');
        const errIcon = chip.querySelector<HTMLElement>('.ft-test-chip-icon-err');
        const spinIcon = chip.querySelector<HTMLElement>('.ft-test-chip-spinner');

        if (state === 'idle') {
          chip.classList.add('hidden');
          chip.classList.remove('status-loading', 'status-ok', 'status-err');
          if (textEl) textEl.textContent = '';
          return;
        }

        chip.classList.remove('hidden');
        chip.classList.toggle('status-loading', state === 'loading');
        chip.classList.toggle('status-ok', state === 'ok');
        chip.classList.toggle('status-err', state === 'err');

        if (okIcon) okIcon.classList.toggle('hidden', state !== 'ok');
        if (errIcon) errIcon.classList.toggle('hidden', state !== 'err');
        if (spinIcon) spinIcon.classList.toggle('hidden', state !== 'loading');

        if (textEl) {
          textEl.textContent = message;
        }
      });
    };

    const clearTestStatus = () => {
      setTestStatus('idle');
    };

    const providerChips = root.querySelectorAll<any>('.ft-ai-provider-chip-set md-filter-chip');
    providerChips.forEach((chip) => {
      chip.addEventListener('click', (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        const pId = chip.getAttribute('data-provider-id') as any;
        if (pId) {
          saveAiActiveProvider(pId);
          clearTestStatus();
          syncAllAiSettings();
        }
      });
    });

    if (modelSelect) {
      modelSelect.addEventListener('change', () => {
        const nextId = modelSelect.value;
        if (nextId) {
          saveAiActiveModel(nextId);
          clearTestStatus();
          syncAllAiSettings();
        }
      });
    }

    if (keyInput) {
      keyInput.addEventListener('input', () => {
        const activeProvider = getActiveAiProviderId();
        saveProviderApiKey(activeProvider, keyInput.value.trim());
        clearTestStatus();
        syncAllAiSettings();
      });
    }

    if (endpointInput) {
      const handleEndpoint = () => {
        const activeProvider = getActiveAiProviderId();
        saveProviderEndpoint(activeProvider, endpointInput.value.trim());
        clearTestStatus();
        syncAllAiSettings();
      };
      endpointInput.addEventListener('change', handleEndpoint);
      endpointInput.addEventListener('input', () => {
        clearTestStatus();
      });
    }

    if (revealBtn && keyInput) {
      const handleReveal = () => {
        const isRevealed = !!revealBtn.selected;
        keyInput.type = isRevealed ? 'text' : 'password';
      };
      revealBtn.addEventListener('input', handleReveal);
      revealBtn.addEventListener('change', handleReveal);
      revealBtn.addEventListener('click', (e: Event) => {
        e.stopPropagation();
        setTimeout(handleReveal, 0);
      });
    }

    if (testBtn) {
      testBtn.addEventListener('click', async (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        testBtn.disabled = true;
        testBtn.querySelector('.ft-test-bolt-icon')?.classList.add('hidden');
        testBtn.querySelector('.ft-test-spinner')?.classList.remove('hidden');
        setTestStatus('loading', '测试中...');

        try {
          const activeProvider = getActiveAiProviderId();
          const activeId = getActiveAiModelId();
          const keyVal = keyInput ? keyInput.value.trim() : undefined;
          const epVal = endpointInput ? endpointInput.value.trim() : undefined;
          const result = await testAiConnection(activeId, keyVal, epVal, activeProvider);

          setTestStatus(result.ok ? 'ok' : 'err', result.message);
        } catch (err: unknown) {
          setTestStatus('err', (err as Error)?.message || '连接失败');
        } finally {
          testBtn.disabled = false;
          testBtn.querySelector('.ft-test-bolt-icon')?.classList.remove('hidden');
          testBtn.querySelector('.ft-test-spinner')?.classList.add('hidden');
        }
      });
    }

    if (customToggle && customForm) {
      customToggle.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        customForm.classList.toggle('hidden');
      });
    }

    if (customCancel && customForm) {
      customCancel.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        customForm.classList.add('hidden');
      });
    }

    if (customAddBtn && customForm) {
      customAddBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const idInput = customForm.querySelector<any>('.ft-ai-custom-id');
        const labelInput = customForm.querySelector<any>('.ft-ai-custom-label');
        const epInput = customForm.querySelector<any>('.ft-ai-custom-ep');

        const id = idInput?.value?.trim();
        const label = labelInput?.value?.trim() || id;
        const ep = epInput?.value?.trim();

        if (!id) { idInput?.focus(); return; }
        if (!ep) { epInput?.focus(); return; }

        addCustomAiModel({ id, label: label || id, endpoint: ep });
        if (idInput) idInput.value = '';
        if (labelInput) labelInput.value = '';
        if (epInput) epInput.value = '';
        customForm.classList.add('hidden');
        clearTestStatus();
        syncAllAiSettings();
      });
    }

    root.querySelectorAll<any>('.ft-ai-mode-chip-set md-filter-chip').forEach((chip) => {
      chip.addEventListener('click', (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        const modeVal = chip.getAttribute('data-ai-mode-val') as 'retrieve' | 'discussion';
        if (modeVal) {
          saveAiAnswerMode(modeVal);
          syncAllAiSettings();
        }
      });
    });

    root.querySelectorAll<any>('.ft-ai-src-chip-set md-filter-chip').forEach((chip) => {
      chip.addEventListener('click', (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        const srcVal = chip.getAttribute('data-ai-src-val') as 'new' | 'same';
        if (srcVal) {
          saveAiSourceOpen(srcVal);
          syncAllAiSettings();
        }
      });
    });

    const topkSlider = root.querySelector<any>('.ft-ai-topk-slider');
    if (topkSlider) {
      const handleTopK = () => {
        const val = typeof topkSlider.value === 'number' ? topkSlider.value : parseInt(topkSlider.value, 10);
        if (!isNaN(val) && val >= 1) {
          saveAiParams({ topK: val });
          const topkChip = root.querySelector<any>('.ft-ai-topk-val-chip');
          if (topkChip) topkChip.label = `${val} 条`;
        }
      };
      topkSlider.addEventListener('input', handleTopK);
      topkSlider.addEventListener('change', handleTopK);
    }

    const maxCtxInput = root.querySelector<any>('.ft-ai-maxctx-input');
    if (maxCtxInput) {
      maxCtxInput.addEventListener('change', () => {
        const val = parseInt(maxCtxInput.value, 10);
        if (!isNaN(val)) saveAiParams({ maxContextChars: val });
      });
    }
    const maxTokInput = root.querySelector<any>('.ft-ai-maxtok-input');
    if (maxTokInput) {
      maxTokInput.addEventListener('change', () => {
        const val = parseInt(maxTokInput.value, 10);
        if (!isNaN(val)) saveAiParams({ maxTokens: val });
      });
    }

    root.querySelectorAll<any>('.ft-ai-win-chip-set md-filter-chip').forEach((chip) => {
      chip.addEventListener('click', (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        const preset = chip.getAttribute('data-ai-win-val');
        const dims = getAiPanelDimensions();
        let width = 560;
        let height = dims.height;
        if (preset === 'compact') {
          width = 460;
        } else if (preset === 'wide') {
          width = 720;
        } else if (preset === 'custom') {
          width = dims.customWidth || dims.width || 560;
          height = dims.customHeight || dims.height || 680;
        }
        saveAiPanelDimensions({ width, height, preset: preset || 'standard' });
        syncAllAiSettings();
      });
    });

    const collapseToggle = root.querySelector<HTMLInputElement>('.ft-ai-collapse-preceding-toggle');
    if (collapseToggle) {
      collapseToggle.addEventListener('change', () => {
        saveAiAutoCollapsePreceding(collapseToggle.checked);
      });
    }

    if (!(window as any).__astrolibOpenSettingsBound) {
      (window as any).__astrolibOpenSettingsBound = true;
      window.addEventListener('astrolib:open-settings', (e: any) => {
        const target = document.querySelector<StarlightFeatureToggles>('starlight-feature-toggles');
        if (target) {
          target.openPanel();
          if (e?.detail?.section === 'ai') {
            const panel = target.panel || target;
            const aiSec = panel.querySelector('.ft-section:has(.ft-ai-block), .ft-section:has([data-feature-id="aiAsk"])') as HTMLElement;
            if (aiSec) {
              setTimeout(() => {
                aiSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
                const advDetails = aiSec.querySelector<HTMLDetailsElement>('[data-ai-advanced-details]');
                if (advDetails) advDetails.open = true;
              }, 120);
            }
          }
        }
      });
    }
  }

  openPanel() {

    document
      .querySelectorAll<StarlightFeatureToggles>('starlight-feature-toggles')
      .forEach((el) => el !== this && el.closePanel());

    const toolsWrapper = document.getElementById('vp-tools-wrapper');
    if (toolsWrapper?.classList.contains('is-open')) {
      toolsWrapper.classList.remove('is-open');
      document.getElementById('vp-tools-trigger')?.setAttribute('aria-expanded', 'false');
      document.getElementById('vp-tools-menu')?.setAttribute('aria-hidden', 'true');
    }

    this.ensurePortal();

    this.classList.add('ft-is-open');
    this.panel?.classList.add('ft-is-open');
    this.backdrop?.classList.add('ft-is-open');
    this.panel?.setAttribute('aria-hidden', 'false');
    this.querySelector<HTMLButtonElement>('.ft-toggle-btn')?.setAttribute('aria-expanded', 'true');
    document.documentElement.classList.add('ft-settings-open');
    document.body.classList.add('ft-settings-open');

    if (window.matchMedia('(max-width: 49.999rem)').matches) {
      document.documentElement.classList.add('ft-scroll-lock');
    }

    if (document.documentElement.dataset.siteTheme === 'material-you') {
      import('../themes/material-you/index').then((m) => {
        m.upgradeSwitchesToMaterialWeb?.();
        syncAllCheckboxes();
      }).catch(() => {});
    }

    syncAllCheckboxes();
    syncAllThemeModes();
    syncAllFontButtons();
    syncAllThemeChips();
    syncAllPrewarmButtons();
    syncAllAiSettings();
    syncAllPunctChips();
    syncAllFontSizeSliders();
  }

  closePanel() {
    const wasOpen = this.classList.contains('ft-is-open') || this.panel?.classList.contains('ft-is-open');
    this.classList.remove('ft-is-open');
    document.documentElement.classList.remove('ft-settings-open');
    document.body.classList.remove('ft-settings-open');
    if (this.panel) {
      this.panel.classList.remove('ft-is-open');
      this.panel.classList.remove('ft-is-dragging');
      this.panel.style.transform = '';
      this.panel.style.transition = '';
      this.panel.setAttribute('aria-hidden', 'true');
    }
    if (this.backdrop) {
      this.backdrop.classList.remove('ft-is-open');
      this.backdrop.style.opacity = '';
      this.backdrop.style.transition = '';
    }
    this.querySelector<HTMLButtonElement>('.ft-toggle-btn')?.setAttribute('aria-expanded', 'false');

    document.documentElement.classList.remove('ft-scroll-lock');

    if (wasOpen) this.querySelector<HTMLElement>('.ft-toggle-btn')?.focus();
  }
}

export function initFeatureToggles(): void {

  document.querySelectorAll('#ft-m3-settings-dialog').forEach((el) => el.remove());

  bindDocument();
  loadToggles();
  applyFontPref(loadFontPref());
  applyParagraphIndent();
  applyPunctStyle();
  applyFontSize();

  if (!customElements.get('starlight-feature-toggles')) {
    customElements.define('starlight-feature-toggles', StarlightFeatureToggles);
  }

  apply();
  syncAllThemeModes();
  syncAllPunctChips();
  syncAllFontSizeSliders();

  onAiConfigChange(() => {
    syncAllAiSettings();
  });

  matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
    if (loadThemeMode() === 'auto') {
      applyThemeMode('auto');
      syncAllThemeModes();
    }
  });

  document.addEventListener('astro:page-load', () => {
    apply();
    applyParagraphIndent();
    applyPunctStyle();
    applyFontSize();
    syncAllCheckboxes();
    syncAllThemeModes();
    syncAllFontButtons();
    syncAllThemeChips();
    syncAllThemeColors();
    syncAllPrewarmButtons();
    syncAllAiSettings();
    syncAllPunctChips();
    syncAllFontSizeSliders();
  });

  window.addEventListener('site-theme-change', () => {
    syncAllThemeChips();
    syncAllThemeColors();
  });

  window.addEventListener('m3-theme-color-change', () => {
    syncAllThemeColors();
  });

  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY || e.key === THEME_TRANSITION_KEY) {
      loadToggles();
      syncAllCheckboxes();
      apply();
    } else if (e.key === THEME_MODE_STORAGE_KEY) {
      syncAllThemeModes();
    } else if (e.key === 'starlight-m3-theme-color') {
      applyThemeColor();
      syncAllThemeColors();
    } else if (e.key === PREWARM_PAGES_KEY) {
      syncAllPrewarmButtons();
    } else if (e.key === TYPOGRAPHY_INDENT_KEY) {
      applyParagraphIndent();
      syncAllCheckboxes();
    } else if (e.key === PUNCT_STYLE_KEY) {
      applyPunctStyle();
      syncAllPunctChips();
    } else if (e.key === FONT_SIZE_KEY) {
      applyFontSize();
      syncAllFontSizeSliders();
    } else if (e.key?.startsWith('astrolib_ai_') || e.key?.startsWith('dsh-aiask-')) {
      syncAllAiSettings();
    }
  });
}
