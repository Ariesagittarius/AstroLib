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
import { enableFormulaActions, disableFormulaActions } from './formula/ui';
import {
  getAllAiModels,
  getActiveAiModelId,
  saveAiActiveModel,
  getAiApiKey,
  saveAiApiKey,
  getAiEndpoint,
  saveAiEndpoint,
  addCustomAiModel,
  onAiConfigChange,
  testAiConnection,
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

  savePrewarmPref(DEFAULT_PREWARM_PAGES);

  syncAllCheckboxes();
  syncAllFontButtons();
  syncAllThemeChips();
  syncAllPrewarmButtons();
  syncAllAiSettings();
  apply();
}

export function syncAllAiSettings(): void {
  const models = getAllAiModels();
  const activeId = getActiveAiModelId();
  const key = getAiApiKey(activeId);
  const endpoint = getAiEndpoint(activeId);

  document.querySelectorAll('.ft-panel, starlight-feature-toggles').forEach((root) => {
    const select = root.querySelector<HTMLSelectElement>('.ft-ai-model-select');
    if (select) {
      const currentVal = select.value || activeId;
      select.innerHTML = models
        .map((m) => `<option value="${m.id}" ${m.id === activeId ? 'selected' : ''}>${m.label}${m.isCustom ? ' (自定义)' : ''}</option>`)
        .join('');
      select.value = activeId;
    }

    const keyInput = root.querySelector<HTMLInputElement>('.ft-ai-key-input');
    if (keyInput && document.activeElement !== keyInput) {
      keyInput.value = key;
    }

    const keyBadge = root.querySelector<HTMLElement>('.ft-ai-key-badge');
    if (keyBadge) {
      const hasKey = !!key.trim();
      keyBadge.textContent = hasKey ? '已配置' : '未配置';
      keyBadge.classList.toggle('configured', hasKey);
    }

    const endpointInput = root.querySelector<HTMLInputElement>('.ft-ai-endpoint-input');
    if (endpointInput && document.activeElement !== endpointInput) {
      endpointInput.value = endpoint;
    }
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
    this.bindPrewarm();
    this.bindAiSettings();

    syncAllCheckboxes();
    syncAllFontButtons();
    syncAllThemeChips();
    syncAllPrewarmButtons();
    syncAllAiSettings();
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
  }

  bindFonts() {
    const root = this.panel || this;
    root.querySelectorAll<HTMLButtonElement>('.ft-font-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
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
      });
    });
  }

  bindSiteThemes() {
    const root = this.panel || this;
    root.querySelectorAll<HTMLButtonElement>('.ft-theme-chip').forEach((chip) => {
      chip.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const targetTheme = parseSiteTheme(chip.getAttribute('data-site-theme-val'));
        setSiteTheme(targetTheme);
        syncAllThemeChips();
      });
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
    const keyInput = root.querySelector<HTMLInputElement>('.ft-ai-key-input');
    const endpointInput = root.querySelector<HTMLInputElement>('.ft-ai-endpoint-input');
    const revealBtn = root.querySelector<HTMLButtonElement>('.ft-ai-key-reveal');
    const customToggle = root.querySelector<HTMLButtonElement>('[data-action="toggle-custom-model"]');
    const customForm = root.querySelector<HTMLElement>('.ft-ai-custom-form');
    const customCancel = root.querySelector<HTMLButtonElement>('[data-action="cancel-custom-model"]');
    const customAddBtn = root.querySelector<HTMLButtonElement>('[data-action="add-custom-model"]');
    const testBtn = root.querySelector<HTMLButtonElement>('[data-action="test-ai-connection"]');
    const testStatus = root.querySelector<HTMLElement>('.ft-ai-test-status');

    const clearTestStatus = () => {
      if (testStatus) {
        testStatus.textContent = '';
        testStatus.className = 'ft-ai-test-status';
      }
    };

    if (modelSelect) {
      modelSelect.addEventListener('change', () => {
        const nextId = modelSelect.value;
        saveAiActiveModel(nextId);
        clearTestStatus();
        syncAllAiSettings();
      });
    }

    if (keyInput) {
      keyInput.addEventListener('input', () => {
        const activeId = getActiveAiModelId();
        saveAiApiKey(activeId, keyInput.value.trim(), true);
        clearTestStatus();
        syncAllAiSettings();
      });
    }

    if (endpointInput) {
      endpointInput.addEventListener('change', () => {
        const activeId = getActiveAiModelId();
        saveAiEndpoint(activeId, endpointInput.value.trim());
        clearTestStatus();
        syncAllAiSettings();
      });
      endpointInput.addEventListener('input', () => {
        clearTestStatus();
      });
    }

    if (revealBtn && keyInput) {
      revealBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const isPassword = keyInput.type === 'password';
        keyInput.type = isPassword ? 'text' : 'password';
        revealBtn.querySelector('.ft-eye-open')?.classList.toggle('hidden', isPassword);
        revealBtn.querySelector('.ft-eye-closed')?.classList.toggle('hidden', !isPassword);
      });
    }

    if (testBtn && testStatus) {
      testBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        testBtn.disabled = true;
        testStatus.textContent = '测试中...';
        testStatus.className = 'ft-ai-test-status status-loading';

        try {
          const activeId = getActiveAiModelId();
          const keyVal = keyInput ? keyInput.value.trim() : undefined;
          const epVal = endpointInput ? endpointInput.value.trim() : undefined;
          const result = await testAiConnection(activeId, keyVal, epVal);

          testStatus.textContent = result.message;
          testStatus.className = `ft-ai-test-status ${result.ok ? 'status-ok' : 'status-err'}`;
        } catch (err: unknown) {
          testStatus.textContent = (err as Error)?.message || '连接失败';
          testStatus.className = 'ft-ai-test-status status-err';
        } finally {
          testBtn.disabled = false;
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
        const idInput = customForm.querySelector<HTMLInputElement>('.ft-ai-custom-id');
        const labelInput = customForm.querySelector<HTMLInputElement>('.ft-ai-custom-label');
        const epInput = customForm.querySelector<HTMLInputElement>('.ft-ai-custom-ep');

        const id = idInput?.value.trim();
        const label = labelInput?.value.trim() || id;
        const ep = epInput?.value.trim();

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
    syncAllPrewarmButtons();
    syncAllAiSettings();
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

  onAiConfigChange(() => {
    syncAllAiSettings();
  });

  document.addEventListener('astro:page-load', () => {
    apply();
    syncAllCheckboxes();
    syncAllFontButtons();
    syncAllThemeChips();
    syncAllPrewarmButtons();
    syncAllAiSettings();
  });

  window.addEventListener('site-theme-change', () => {
    syncAllThemeChips();
  });

  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY || e.key === THEME_TRANSITION_KEY) {
      loadToggles();
      syncAllCheckboxes();
      apply();
    } else if (e.key === PREWARM_PAGES_KEY) {
      syncAllPrewarmButtons();
    } else if (e.key?.startsWith('astrolib_ai_') || e.key?.startsWith('dsh-aiask-')) {
      syncAllAiSettings();
    }
  });
}
