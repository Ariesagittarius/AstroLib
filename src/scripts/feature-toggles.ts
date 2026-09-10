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

/** 亮/暗/设备外观偏好存储键：'light' | 'dark' | '' (表示 auto 跟随系统) */
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

  // 同步顶栏的 starlight-theme-select 图标
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
      localStorage.removeItem('starlight-m3-theme-color');
    }
  } catch {}

  // 重置字体偏好
  saveFontPref(DEFAULT_PREF);
  applyFontPref(DEFAULT_PREF);

  // 重置 UI 风格主题
  setSiteTheme(DEFAULT_SITE_THEME);

  // 重置 Material You 主题色
  saveThemeColor(DEFAULT_THEME_COLOR_ID);
  applyThemeColor(DEFAULT_THEME_COLOR_ID);

  // 重置外观模式为遵循系统/设备
  saveThemeMode('auto');
  applyThemeMode('auto');

  // 重置章节预加载配置为全书拉取 (-1)
  savePrewarmPref(DEFAULT_PREWARM_PAGES);

  syncAllCheckboxes();
  syncAllThemeModes();
  syncAllFontButtons();
  syncAllThemeChips();
  syncAllThemeColors();
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

    const keyInput = root.querySelector<any>('.ft-ai-key-input');
    if (keyInput && !keyInput.matches?.(':focus-within') && document.activeElement !== keyInput) {
      keyInput.value = key;
      keyInput.type = 'password';
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
}

/** 同步当前所有实例的字体高亮按钮与官方 Chip 状态 */
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

/** 同步当前所有实例的 M3 主题色高亮 Swatches */
export function syncAllThemeColors(): void {
  const currentColor = loadThemeColor();
  document.querySelectorAll('.ft-panel .ft-preset-swatch, starlight-feature-toggles .ft-preset-swatch').forEach((swatch) => {
    const val = swatch.getAttribute('data-m3-color');
    const active = val === currentColor;
    swatch.classList.toggle('active', active);
    swatch.setAttribute('aria-selected', String(active));
  });

  // 同步原生 color input
  document.querySelectorAll<HTMLInputElement>('.ft-color-native-input').forEach((input) => {
    if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(currentColor)) {
      input.value = currentColor;
    }
  });

  // 同步自定义 Tile 状态
  const isCustomHex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(currentColor);
  document.querySelectorAll<HTMLElement>('.ft-custom-color-tile').forEach((tile) => {
    tile.classList.toggle('active', isCustomHex);
    const dropper = tile.querySelector<HTMLElement>('.ft-eyedropper-circle');
    if (dropper) {
      dropper.style.backgroundColor = isCustomHex ? currentColor : '';
    }
  });
}

/** 绑定「点击面板外收起」到 document（只注册一次，兼容多实例与 Portal） */
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

    // 在桌面端 Material You 侧边抽屉模式下，点击页面其他元素时不自动收起面板，允许自由操作其他组件
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
      // 移动端：将 panel 和 backdrop 移入 overlay root，彻底逃逸 .sidebar-pane 的 transform / overflow-y 裁剪
      if (this.panel.parentElement !== overlayRoot) {
        mountToOverlayRoot(this.backdrop);
        mountToOverlayRoot(this.panel);
      }
    } else {
      // 桌面端：放回本 host 内部，使 position: absolute 可以基于顶栏按钮精准定位
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

    // 自定义取色器卡片点击唤起原生拾色器
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
      const handleEndpoint = () => {
        const activeId = getActiveAiModelId();
        saveAiEndpoint(activeId, endpointInput.value.trim());
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
          const activeId = getActiveAiModelId();
          const keyVal = keyInput ? keyInput.value.trim() : undefined;
          const epVal = endpointInput ? endpointInput.value.trim() : undefined;
          const result = await testAiConnection(activeId, keyVal, epVal);

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
  }

  openPanel() {
    // 互斥：打开当前面板前先关闭其它所有设置实例
    document
      .querySelectorAll<StarlightFeatureToggles>('starlight-feature-toggles')
      .forEach((el) => el !== this && el.closePanel());

    // 互斥：关闭其他顶栏下拉菜单（如书籍与学习工具）
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
  }

  closePanel() {
    const wasOpen = this.classList.contains('ft-is-open') || this.panel?.classList.contains('ft-is-open');
    this.classList.remove('ft-is-open');
    document.documentElement.classList.remove('ft-settings-open');
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
  // 清理任何历史残留的 M3 dialog
  document.querySelectorAll('#ft-m3-settings-dialog').forEach((el) => el.remove());

  bindDocument();
  loadToggles();
  applyFontPref(loadFontPref());

  if (!customElements.get('starlight-feature-toggles')) {
    customElements.define('starlight-feature-toggles', StarlightFeatureToggles);
  }

  apply();
  syncAllThemeModes();

  onAiConfigChange(() => {
    syncAllAiSettings();
  });

  // 监听系统深浅配色变化（设备模式自动跟随）
  matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
    if (loadThemeMode() === 'auto') {
      applyThemeMode('auto');
      syncAllThemeModes();
    }
  });

  document.addEventListener('astro:page-load', () => {
    apply();
    syncAllCheckboxes();
    syncAllThemeModes();
    syncAllFontButtons();
    syncAllThemeChips();
    syncAllThemeColors();
    syncAllPrewarmButtons();
    syncAllAiSettings();
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
    } else if (e.key?.startsWith('astrolib_ai_') || e.key?.startsWith('dsh-aiask-')) {
      syncAllAiSettings();
    }
  });
}
