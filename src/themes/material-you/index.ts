/**
 * ============================================================================
 * Material You (Material 3) Client Runtime for AstroLib
 * ============================================================================
 * Responsibility:
 * 1. Lazily loads official @material/web components when needed.
 * 2. Mounts Material overlays (Dialog, Menu, Snackbar) to #astro-overlay-root.
 * 3. Provides clean Vertical Slice APIs for settings / theme selection.
 * ============================================================================
 */

import { mountToOverlayRoot } from '../../utils/overlay/overlay-root';
import { setSiteTheme, type SiteThemeId } from '../../scripts/site-themes';
import { siteThemes } from '../../config/themes.config.mjs';

import '@material/web/switch/switch.js';
import '@material/web/button/filled-button.js';
import '@material/web/button/outlined-button.js';
import '@material/web/button/text-button.js';
import '@material/web/iconbutton/icon-button.js';
import '@material/web/icon/icon.js';
import '@material/web/dialog/dialog.js';
import '@material/web/menu/menu.js';
import '@material/web/menu/menu-item.js';
import '@material/web/divider/divider.js';
import '@material/web/checkbox/checkbox.js';
import '@material/web/list/list.js';
import '@material/web/list/list-item.js';
import '@material/web/chips/chip-set.js';
import '@material/web/chips/assist-chip.js';
import '@material/web/chips/filter-chip.js';
import '@material/web/textfield/outlined-text-field.js';
import '@material/web/radio/radio.js';
import '@material/web/ripple/ripple.js';
import '@material/web/slider/slider.js';
import { initColorEngine, applyThemeColor } from './color-engine';
export { initColorEngine, applyThemeColor };

let materialWebLoaded = true;

/**
 * Lazily load official @material/web components (no-op as components are bundled).
 */
export async function ensureMaterialWebLoaded(): Promise<void> {
  return Promise.resolve();
}

/**
 * Upgrade hand-crafted .ft-switch elements to official <md-switch> components.
 */
export function upgradeSwitchesToMaterialWeb(): void {
  const switchLabels = document.querySelectorAll<HTMLLabelElement>('.ft-switch');

  switchLabels.forEach((label) => {
    const input = label.querySelector<HTMLInputElement>('input[type="checkbox"]');
    if (!input) return;

    let mdSwitch = label.querySelector<any>('md-switch.m3-hydrated-switch');
    if (!mdSwitch) {
      mdSwitch = document.createElement('md-switch');
      mdSwitch.className = 'm3-hydrated-switch';

      if (input.hasAttribute('data-feature-id')) {
        mdSwitch.setAttribute('data-feature-id', input.getAttribute('data-feature-id')!);
      }
      if (input.hasAttribute('data-theme-transition')) {
        mdSwitch.setAttribute('data-theme-transition', '');
      }
      if (input.hasAttribute('data-action')) {
        mdSwitch.setAttribute('data-action', input.getAttribute('data-action')!);
      }
      const title = label.getAttribute('title') || '功能开关';
      mdSwitch.setAttribute('aria-label', title);

      label.appendChild(mdSwitch);

      // Prevent label click from triggering duplicate toggle on hidden native input
      label.addEventListener('click', (e) => {
        if (e.target !== mdSwitch && !mdSwitch.contains(e.target as Node)) {
          e.preventDefault();
          if (!mdSwitch.disabled) {
            mdSwitch.selected = !mdSwitch.selected;
            mdSwitch.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }
      });

      mdSwitch.addEventListener('change', (e: Event) => {
        e.stopPropagation();
        if (input.checked !== mdSwitch.selected) {
          input.checked = mdSwitch.selected;
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });

      input.addEventListener('change', () => {
        mdSwitch.selected = input.checked;
        mdSwitch.disabled = input.disabled;
      });
    }

    mdSwitch.selected = input.checked;
    mdSwitch.disabled = input.disabled;
  });
}

/**
 * Clean up any legacy injected appearance switch, keeping the canonical 40px circular mdicon.
 */
export function upgradeAppearanceSwitchToMaterialWeb(): void {
  document.querySelectorAll('#m3-appearance-switch').forEach((el) => el.remove());
}

/**
 * Initialize Material You theme runtime: load components and hydrate official elements.
 */
export async function initMaterialYouTheme(): Promise<void> {
  if (typeof document === 'undefined') return;
  if (document.documentElement.dataset.siteTheme !== 'material-you') return;

  await ensureMaterialWebLoaded();
  upgradeSwitchesToMaterialWeb();
  upgradeAppearanceSwitchToMaterialWeb();

  // Watch for any dynamic UI insertions (like settings drawer reopening)
  if (!(window as any).__m3ObserverBound) {
    (window as any).__m3ObserverBound = true;
    const observer = new MutationObserver(() => {
      if (document.documentElement.dataset.siteTheme === 'material-you') {
        upgradeSwitchesToMaterialWeb();
        upgradeAppearanceSwitchToMaterialWeb();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }
}


/**
 * Options for Material 3 Snackbar.
 */
export interface MaterialSnackbarOptions {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  durationMs?: number;
}

/**
 * Show a Material 3 Snackbar feedback message at --layer-toast.
 */
export function showMaterialSnackbar(options: MaterialSnackbarOptions): void {
  const { message, actionLabel, onAction, durationMs = 4000 } = options;

  let host = document.querySelector<HTMLElement>('#astro-overlay-root .m3-snackbar-host');
  if (!host) {
    host = document.createElement('div');
    host.className = 'm3-snackbar-host';
    mountToOverlayRoot(host);
  }

  const snackbar = document.createElement('div');
  snackbar.className = 'm3-snackbar';
  snackbar.setAttribute('role', 'status');
  snackbar.setAttribute('aria-live', 'polite');

  const textSpan = document.createElement('span');
  textSpan.className = 'm3-snackbar-text';
  textSpan.textContent = message;
  snackbar.appendChild(textSpan);

  if (actionLabel) {
    const actionBtn = document.createElement('button');
    actionBtn.type = 'button';
    actionBtn.className = 'm3-snackbar-action';
    actionBtn.textContent = actionLabel;
    actionBtn.addEventListener('click', () => {
      onAction?.();
      dismiss();
    });
    snackbar.appendChild(actionBtn);
  }

  host.appendChild(snackbar);

  // Trigger animation in next frame
  requestAnimationFrame(() => {
    snackbar.classList.add('is-visible');
  });

  let timer: number | null = null;
  const dismiss = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    snackbar.classList.remove('is-visible');
    setTimeout(() => {
      snackbar.remove();
    }, 250);
  };

  timer = window.setTimeout(dismiss, durationMs);
}

/**
 * Vertical Slice: Open Material You Theme Dialog.
 * Uses official <md-dialog>, <md-filled-button>, <md-outlined-button>, <md-menu>, etc.
 */
export async function openMaterialThemeDialog(): Promise<void> {
  await ensureMaterialWebLoaded();

  let dialog = document.querySelector<HTMLElement>('#astro-overlay-root > #m3-theme-dialog') as any;

  if (!dialog) {
    dialog = document.createElement('md-dialog') as any;
    dialog.id = 'm3-theme-dialog';

    dialog.innerHTML = `
      <div slot="headline" style="display: flex; align-items: center; gap: 0.5rem;">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M12 21a9 9 0 1 1 0-18c4.97 0 9 3.58 9 8 0 2.76-2.24 5-5 5h-1.7c-.55 0-1 .45-1 1 0 .28.11.53.29.71.3.3.48.71.48 1.16 0 .9-.73 1.63-1.63 1.63-1.03 0-1.87-.84-1.87-1.87 0-.45.16-.87.44-1.19" />
          <circle cx="7.5" cy="10.5" r="1.2" fill="currentColor" />
          <circle cx="12" cy="7.5" r="1.2" fill="currentColor" />
          <circle cx="16.5" cy="10.5" r="1.2" fill="currentColor" />
        </svg>
        <span>Material You 主题设置</span>
      </div>

      <div slot="content" style="display: flex; flex-direction: column; gap: 1rem; min-width: 280px; padding: 0.25rem 0;">
        <p style="margin: 0; font-size: 0.875rem; line-height: 1.5; color: var(--md-sys-color-on-surface-variant);">
          当前正在使用 <strong>Material 3</strong> 学术视觉系统。选择下方的界面预设可即时切换站点整体表现。
        </p>

        <div style="position: relative;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
            <span style="font-size: 0.8125rem; font-weight: 500; color: var(--md-sys-color-on-surface);">UI 风格预设</span>
            <span id="m3-current-theme-badge" style="font-size: 0.8125rem; font-weight: 500; color: var(--md-sys-color-primary);">
              Material You
            </span>
          </div>

          <!-- Anchor button for <md-menu> -->
          <md-outlined-button id="m3-theme-menu-anchor" style="width: 100%; justify-content: space-between;">
            <span>选择风格主题...</span>
            <svg slot="icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </md-outlined-button>

          <!-- Official <md-menu> -->
          <md-menu id="m3-theme-options-menu" anchor="m3-theme-menu-anchor" positioning="popover">
            ${siteThemes
              .map(
                (st) => `
              <md-menu-item data-theme-val="${st.id}">
                <div slot="headline">${st.label}</div>
                <div slot="supporting-text">${st.desc}</div>
              </md-menu-item>
            `
              )
              .join('')}
          </md-menu>
        </div>

        <div style="border-top: 1px solid var(--md-sys-color-outline-variant); padding-top: 0.75rem;">
          <div style="font-size: 0.75rem; color: var(--md-sys-color-on-surface-variant); line-height: 1.4;">
            💡 提示：无论切换何种 UI 视觉主题，数学公式、KaTeX 排版与教材正文均受严格保护，保持学术级规范。
          </div>
        </div>
      </div>

      <div slot="actions">
        <md-text-button id="m3-dialog-close-btn">关闭</md-text-button>
        <md-filled-button id="m3-dialog-confirm-btn">完成</md-filled-button>
      </div>
    `;

    mountToOverlayRoot(dialog);

    // Bind menu anchor
    const menuAnchor = dialog.querySelector('#m3-theme-menu-anchor');
    const menu = dialog.querySelector('#m3-theme-options-menu');

    menuAnchor?.addEventListener('click', () => {
      menu.open = !menu.open;
    });

    // Handle menu item selection
    menu?.querySelectorAll('md-menu-item').forEach((item: any) => {
      item.addEventListener('click', () => {
        const themeVal = item.getAttribute('data-theme-val') as SiteThemeId;
        if (themeVal) {
          if (themeVal !== 'material-you') {
            dialog.close();
          }
          setSiteTheme(themeVal);
          menu.open = false;

          const badge = dialog.querySelector('#m3-current-theme-badge');
          if (badge) {
            const matched = siteThemes.find((t) => t.id === themeVal);
            badge.textContent = matched ? matched.label : themeVal;
          }

          if (themeVal === 'material-you') {
            showMaterialSnackbar({
              message: `已切换至「${siteThemes.find((t) => t.id === themeVal)?.label || themeVal}」`,
              actionLabel: '好的',
            });
          }
        }
      });
    });

    // Bind action buttons
    dialog.querySelector('#m3-dialog-close-btn')?.addEventListener('click', () => {
      dialog.close();
    });

    dialog.querySelector('#m3-dialog-confirm-btn')?.addEventListener('click', () => {
      dialog.close();
    });
  }

  // Update current badge
  const currentTheme = document.documentElement.dataset.siteTheme || 'material-you';
  const badge = dialog.querySelector('#m3-current-theme-badge');
  if (badge) {
    const matched = siteThemes.find((t) => t.id === currentTheme);
    badge.textContent = matched ? matched.label : currentTheme;
  }

  dialog.show();
}

// Global runtime listener
if (typeof window !== 'undefined' && !(window as any).__m3ThemeListenerBound) {
  (window as any).__m3ThemeListenerBound = true;

  const checkAndInit = () => {
    if (document.documentElement.dataset.siteTheme === 'material-you') {
      initMaterialYouTheme();
      initColorEngine();
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAndInit);
  } else {
    checkAndInit();
  }

  document.addEventListener('astro:page-load', checkAndInit);

  window.addEventListener('site-theme-change', (e: Event) => {
    const detail = (e as CustomEvent).detail;
    if (detail?.theme === 'material-you') {
      initMaterialYouTheme();
      showMaterialSnackbar({
        message: '已启用 Material You 风格',
        actionLabel: '配置',
        onAction: () => openMaterialThemeDialog(),
      });
    }
  });
}
