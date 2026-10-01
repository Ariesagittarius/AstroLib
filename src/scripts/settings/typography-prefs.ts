import {
  applyFontPref,
  clearFontPref,
  loadFontPref,
  saveFontPref,
  DEFAULT_PREF,
  type FontPref,
} from '../font-presets';

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

let currentDomPunctStyle: PunctStyle = 'dot';

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

export function applyPunctStyle(style: PunctStyle = loadPunctStyle(), force = false): void {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.punctStyle = style;

  if (!force && style === currentDomPunctStyle && style === 'dot') {
    return;
  }

  const idle = (typeof window !== 'undefined' && window.requestIdleCallback) || ((fn: Function) => setTimeout(fn, 60));
  idle(() => {
    replaceBodyFullStops(style);
    currentDomPunctStyle = style;
  }, { timeout: 800 });
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

export function syncAllPunctChips(targetStyle: PunctStyle = loadPunctStyle()): void {
  if (typeof document === 'undefined') return;
  document.querySelectorAll<any>('.ft-panel .ft-punct-chip, starlight-feature-toggles .ft-punct-chip').forEach((chip) => {
    const val = chip.getAttribute('data-punct');
    const isSelected = val === targetStyle;
    chip.classList.toggle('is-selected', isSelected);
    if ('selected' in chip) {
      chip.selected = isSelected;
    }
  });
}

export function syncAllFontButtons(targetPref: FontPref = loadFontPref()): void {
  if (typeof document === 'undefined') return;
  document.querySelectorAll<any>('.ft-panel .ft-font-btn, starlight-feature-toggles .ft-font-btn, .ft-panel .ft-font-chip, starlight-feature-toggles .ft-font-chip').forEach((el) => {
    const latinVal = el.getAttribute('data-font-latin');
    const cjkVal = el.getAttribute('data-font-cjk');
    const isSelected = (latinVal && latinVal === targetPref.latin) || (cjkVal && cjkVal === targetPref.cjk);
    el.classList.toggle('is-selected', !!isSelected);
    if ('selected' in el) {
      el.selected = !!isSelected;
    }
  });
}

export function applyFont(enabled: boolean): void {
  if (typeof document === 'undefined') return;
  if (!enabled) {
    clearFontPref();
  } else {
    applyFontPref(loadFontPref());
  }
}
