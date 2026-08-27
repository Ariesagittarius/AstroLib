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

const STORAGE_KEY = 'starlight-features';

const THEME_TRANSITION_KEY = 'starlight-theme-transition';

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
    }
  } catch {}

  saveFontPref(DEFAULT_PREF);
  applyFontPref(DEFAULT_PREF);

  setSiteTheme(DEFAULT_SITE_THEME);

  syncAllCheckboxes();
  syncAllFontButtons();
  syncAllThemeChips();
  apply();
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
  document.dispatchEvent(new CustomEvent('dsh:feature-change'));
}

function syncAllCheckboxes(): void {
  document
    .querySelectorAll<HTMLInputElement>('.ft-panel input[type="checkbox"][data-feature-id], starlight-feature-toggles input[type="checkbox"][data-feature-id]')
    .forEach((cb) => {
      const id = cb.getAttribute('data-feature-id') || '';
      cb.checked = toggles[id] !== false;
      cb.disabled = !isRuntimeSwitchable(id);
    });

  document
    .querySelectorAll<HTMLInputElement>('.ft-panel input[type="checkbox"][data-theme-transition], starlight-feature-toggles input[type="checkbox"][data-theme-transition]')
    .forEach((cb) => {
      cb.checked = loadThemeTransition() === 'animate';
      cb.disabled = !isEnabled('theme');
    });
}

function syncAllFontButtons(): void {
  const pref = loadFontPref();
  document.querySelectorAll('.ft-panel .ft-font-btn, starlight-feature-toggles .ft-font-btn').forEach((btn) => {
    const setting = btn.getAttribute('data-font-setting');
    const val = btn.getAttribute('data-font-val');
    const active = setting === 'latin' ? val === pref.latin : val === pref.cjk;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-selected', String(active));
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

let documentBound = false;
function bindDocument(): void {
  if (documentBound) return;
  documentBound = true;

  document.addEventListener('click', (e) => {
    const t = e.target;
    if (!(t instanceof Element)) return;

    if (t.closest('.ft-panel') || t.closest('.ft-toggle-btn')) return;
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
    this.bindFonts();
    this.bindSiteThemes();

    syncAllCheckboxes();
    syncAllFontButtons();
    syncAllThemeChips();
    apply();
  }

  disconnectedCallback() {
    this.closePanel();
    if (this.panel && this.panel.parentElement === document.body) {
      this.panel.remove();
    }
    if (this.backdrop && this.backdrop.parentElement === document.body) {
      this.backdrop.remove();
    }
    document.documentElement.classList.remove('ft-scroll-lock');
  }

  ensurePortal() {
    const isMobile = window.matchMedia('(max-width: 49.999rem)').matches;
    if (!this.panel || !this.backdrop) return;

    if (isMobile) {

      if (this.panel.parentElement !== document.body) {
        document.body.appendChild(this.backdrop);
        document.body.appendChild(this.panel);
      }
    } else {

      if (this.panel.parentElement === document.body) {
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

    root.querySelectorAll<HTMLInputElement>('input[type="checkbox"][data-theme-transition]').forEach((cb) => {
      cb.checked = loadThemeTransition() === 'animate';
      cb.disabled = !isEnabled('theme');
      cb.addEventListener('change', () => {
        try {
          localStorage.setItem(THEME_TRANSITION_KEY, cb.checked ? 'animate' : 'instant');
        } catch {}
      });
    });

    root.querySelectorAll<HTMLButtonElement>('[data-action="reset-defaults"]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        resetToggles();
      });
    });

    root.querySelectorAll<HTMLButtonElement>('[data-inspector-trigger]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.closePanel();
      });
    });
  }

  bindFonts() {
    const root = this.panel || this;
    root.querySelectorAll<HTMLButtonElement>('.ft-font-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
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
      });
    });
  }

  bindSiteThemes() {
    const root = this.panel || this;
    root.querySelectorAll<HTMLButtonElement>('.ft-theme-chip').forEach((chip) => {
      chip.addEventListener('click', (e) => {
        e.preventDefault();
        const targetTheme = parseSiteTheme(chip.getAttribute('data-site-theme-val'));
        setSiteTheme(targetTheme);
        syncAllThemeChips();
      });
    });
  }

  openPanel() {

    document
      .querySelectorAll<StarlightFeatureToggles>('starlight-feature-toggles')
      .forEach((el) => el !== this && el.closePanel());

    this.ensurePortal();

    this.classList.add('ft-is-open');
    this.panel?.classList.add('ft-is-open');
    this.backdrop?.classList.add('ft-is-open');
    this.panel?.setAttribute('aria-hidden', 'false');
    this.querySelector<HTMLButtonElement>('.ft-toggle-btn')?.setAttribute('aria-expanded', 'true');

    if (window.matchMedia('(max-width: 49.999rem)').matches) {
      document.documentElement.classList.add('ft-scroll-lock');
    }

    syncAllCheckboxes();
    syncAllFontButtons();
    syncAllThemeChips();
  }

  closePanel() {
    const wasOpen = this.classList.contains('ft-is-open') || this.panel?.classList.contains('ft-is-open');
    this.classList.remove('ft-is-open');
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
  bindDocument();
  loadToggles();

  if (!customElements.get('starlight-feature-toggles')) {
    customElements.define('starlight-feature-toggles', StarlightFeatureToggles);
  }

  document.addEventListener('astro:page-load', () => {
    apply();
    syncAllCheckboxes();
    syncAllFontButtons();
    syncAllThemeChips();
  });

  window.addEventListener('site-theme-change', () => {
    syncAllThemeChips();
  });

  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY || e.key === THEME_TRANSITION_KEY) {
      loadToggles();
      syncAllCheckboxes();
      apply();
    }
  });
}
