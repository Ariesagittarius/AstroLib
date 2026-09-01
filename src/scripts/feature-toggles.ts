/**
 * feature-toggles —— 前端运行时「功能与偏好设置」模块
 *
 * 结构：自包含 <starlight-feature-toggles> 自定义元素。挂载于顶栏 ThemeSelect 槽位
 * （桌面 header 右侧动作区 / 移动端抽屉底部），页面上可同时渲染多个实例，各自管理
 * 自己的 ⚙ 开合与下拉面板/底部抽屉；构建层元数据由各实例的 data-meta 注入（跨实例内容一致）。
 *
 * 契约：
 *   · 有效启用 = 构建层 enabled（由实例注入的 data-meta 提供） && 运行时未关闭
 *     （本模块读 localStorage 'starlight-features'）。
 *   · build=false 的功能即便运行时也无法开启（产物里没有）。
 *   · 通过 [data-feature="<id>"] 标记的元素做显隐（面板样式 .dsh-feature-off 隐藏）；
 *     fonts 关闭时清 <html data-font-latin / data-font-cjk>，重新打开时恢复读者字体偏好。
 *   · editor：设置 window.__dshFeatureEditorAllowed（editor.ts 据此放行/禁止编辑模式）。
 *   · 每次变化 dispatch 'dsh:feature-change'，供其它脚本联动。
 */

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
} from '../ai/ai-config';

/** 运行时开关存储键 */
const STORAGE_KEY = 'starlight-features';

/** 主题切换动画偏好存储键：'instant'（即时切换，默认，无过渡）| 'animate'（柔和过渡） */
const THEME_TRANSITION_KEY = 'starlight-theme-transition';

/** 章节后台空闲预加载页面数存储键：1 (前后各 1 页滑动窗口，默认) | 2 | 3 | -1 (全书拉取) | 0 (关闭) */
export const PREWARM_PAGES_KEY = 'astrolib_prewarm_pages';
export const DEFAULT_PREWARM_PAGES = 1;

/** 读取章节预加载范围配置（默认 1 为前后各 1 页滑动窗口） */
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

/** 保存章节预加载范围配置 */
export function savePrewarmPref(val: number): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(PREWARM_PAGES_KEY, String(val));
    }
    window.dispatchEvent(new CustomEvent('prewarm:config-change', { detail: { pages: val } }));
  } catch {}
}

type FeatureMeta = { id: string; label: string; build: boolean; runtime: boolean; devOnly: boolean };

/** 最近一次从任一实例读取的构建层元数据（跨实例内容一致，供全局 apply() 使用） */
let meta: FeatureMeta[] = [];
/** 用户显式的运行时开关；缺省视为开启 */
let toggles: Record<string, boolean> = {};

const metaOf = (id: string): FeatureMeta | undefined => meta.find((m) => m.id === id);

/** 从自定义元素的 data-meta 解析构建层元数据（容错：解析失败 → 空数组） */
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
    /* 忽略（隐私模式等） */
  }
}

/** 读取主题切换动画偏好（默认 'instant'，即默认关闭过渡、即时切换） */
function loadThemeTransition(): string {
  try {
    return localStorage.getItem(THEME_TRANSITION_KEY) || 'instant';
  } catch {
    return 'instant';
  }
}

/** 该功能是否可运行时切换（构建层允许 && 面板标记为可切换） */
export function isRuntimeSwitchable(id: string): boolean {
  const m = metaOf(id);
  return !!m && m.runtime && m.build;
}

/** 有效启用：构建层 enabled && 运行时未关闭 */
export function isEnabled(id: string): boolean {
  const m = metaOf(id);
  if (!m || !m.build) return false;
  return toggles[id] !== false;
}

/** 重置所有功能与偏好为系统默认值 */
export function resetToggles(): void {
  toggles = {};
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(THEME_TRANSITION_KEY);
    }
  } catch {}

  // 重置字体偏好
  saveFontPref(DEFAULT_PREF);
  applyFontPref(DEFAULT_PREF);

  // 重置 UI 风格主题
  setSiteTheme(DEFAULT_SITE_THEME);

  // 重置章节预加载配置为全书拉取 (-1)
  savePrewarmPref(DEFAULT_PREWARM_PAGES);

  syncAllCheckboxes();
  syncAllFontButtons();
  syncAllThemeChips();
  syncAllPrewarmButtons();
  syncAllAiSettings();
  apply();
}

/** 同步当前所有实例的 AI 模型与 Key 配置状态 */
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

/** 同步当前所有实例的后台预加载范围按钮状态 */
export function syncAllPrewarmButtons(): void {
  const current = loadPrewarmPref();
  document.querySelectorAll('.ft-panel .ft-prewarm-btn, starlight-feature-toggles .ft-prewarm-btn').forEach((btn) => {
    const val = parseInt(btn.getAttribute('data-prewarm-val') || '-1', 10);
    const active = val === current;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-selected', String(active));
  });
}

/** 应用字体偏好：关闭 fonts 清 <html data-font-latin/…-cjk>（回系统默认）；开启则恢复读者偏好 */
function applyFont(): void {
  if (!isEnabled('fonts')) {
    clearFontPref();
  } else {
    applyFontPref(loadFontPref());
  }
}

/** 设置编辑器放行标志（editor.ts 会读取 window.__dshFeatureEditorAllowed） */
function applyEditorAllowed(): void {
  (window as unknown as Record<string, unknown>).__dshFeatureEditorAllowed = isEnabled('editor');
}

/** 应用引用联动与样式控制 */
function applyCrossRef(): void {
  const root = document.documentElement;
  const enabled = isEnabled('crossRef');
  root.classList.toggle('dsh-crossref-off', !enabled);
}

/** 应用公式操作与图片导出开关（关闭时完全卸载 DOM 还原原生排版） */
function applyFormulaActions(): void {
  if (isEnabled('formulaActions')) {
    enableFormulaActions();
  } else {
    disableFormulaActions();
  }
}

/** 应用到页面：显隐 [data-feature] 元素 + 字体 + 引用联动 + 编辑器放行 + 广播 */
export function apply(): void {
  if (meta.length === 0) return;

  for (const el of document.querySelectorAll('[data-feature]')) {
    const id = el.getAttribute('data-feature') || '';
    el.classList.toggle('dsh-feature-off', !isEnabled(id));
  }

  // 主题切换动画子选项：仅当 theme 功能启用时可调（避免无意义交互）
  document.querySelectorAll<HTMLInputElement>('input[type="checkbox"][data-theme-transition]').forEach((cb) => {
    cb.disabled = !isEnabled('theme');
  });

  applyFont();
  applyCrossRef();
  applyEditorAllowed();
  applyFormulaActions();
  document.dispatchEvent(new CustomEvent('dsh:feature-change'));
}

/** 同步当前所有实例的复选框/滑块状态 */
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

/** 同步当前所有实例的字体高亮按钮状态 */
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

/** 同步当前所有实例的 UI 风格主题高亮 Chips */
function syncAllThemeChips(): void {
  const theme = loadSiteTheme();
  document.querySelectorAll('.ft-panel .ft-theme-chip, starlight-feature-toggles .ft-theme-chip').forEach((chip) => {
    const val = chip.getAttribute('data-site-theme-val');
    const active = val === theme;
    chip.classList.toggle('active', active);
    chip.setAttribute('aria-selected', String(active));
  });
}

/** 绑定「点击面板外收起」到 document（只注册一次，兼容多实例与 Portal） */
let documentBound = false;
function bindDocument(): void {
  if (documentBound) return;
  documentBound = true;

  document.addEventListener('click', (e) => {
    const t = e.target;
    if (!(t instanceof Element)) return;
    // 点击面板本体或触发按钮时不收起
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

/** 任意值 → 合法拉丁档（非法回退 'sans'） */
const parseLatin = (v: unknown): LatinFont =>
  LATIN_PRESETS.some((p) => p.value === v) ? (v as LatinFont) : 'sans';
/** 任意值 → 合法中文档（非法回退 'sans'） */
const parseCjk = (v: unknown): CjkFont =>
  CJK_PRESETS.some((p) => p.value === v) ? (v as CjkFont) : 'sans';

/** 各实例自包含的开关逻辑：绑定 ⚙ 开合、关闭钮、面板复选框与重置操作 */
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
      // 移动端：将 panel 和 backdrop 移入 document.body，彻底逃逸 .sidebar-pane 的 transform / overflow-y 裁剪
      if (this.panel.parentElement !== document.body) {
        document.body.appendChild(this.backdrop);
        document.body.appendChild(this.panel);
      }
    } else {
      // 桌面端：放回本 host 内部，使 position: absolute 可以基于顶栏按钮精准定位
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

    // 遮罩点击关闭
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
      // 仅在移动端 Bottom Sheet 模式下激活顶部拖拽
      if (!window.matchMedia('(max-width: 49.999rem)').matches) return;
      // 忽略关闭按钮上的点击
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
        // 向下拖动：1:1 跟随手指/指针
        currentDeltaY = dy;
        this.panel.style.transform = `translateY(${dy}px)`;
        if (this.backdrop) {
          const opacity = Math.max(0, 1 - dy / 320);
          this.backdrop.style.opacity = `${opacity}`;
        }
      } else {
        // 向上拖动：增加弹性阻尼，防止无限上拉
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

      // 下拉超过 90px 或快速滑脱（velocity > 0.4 且 dy > 30px）触发关闭
      if (currentDeltaY > 90 || (currentDeltaY > 30 && velocity > 0.4)) {
        this.closePanel();
      } else {
        // 否则弹性弹回展开位置
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

    // 模块巡检一键打开按钮：点击时先关闭设置面板，让巡检抽屉无遮挡打开
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

    if (modelSelect) {
      modelSelect.addEventListener('change', () => {
        const nextId = modelSelect.value;
        saveAiActiveModel(nextId);
        syncAllAiSettings();
      });
    }

    if (keyInput) {
      keyInput.addEventListener('input', () => {
        const activeId = getActiveAiModelId();
        saveAiApiKey(activeId, keyInput.value.trim(), true);
        syncAllAiSettings();
      });
    }

    if (endpointInput) {
      endpointInput.addEventListener('change', () => {
        const activeId = getActiveAiModelId();
        saveAiEndpoint(activeId, endpointInput.value.trim());
        syncAllAiSettings();
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
        syncAllAiSettings();
      });
    }
  }

  openPanel() {
    // 互斥：打开当前面板前先关闭其它所有实例
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

/**
 * 初始化：注册自定义元素（幂等）+ 首次应用到页面 + 订阅 SPA 路由/跨标签页。
 */
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
