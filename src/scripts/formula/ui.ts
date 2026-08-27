/**
 * 公式交互操作 UI 模块（formula-ui）
 *
 * 职责：
 *   - 在文章正文带有 data-latex 的 KaTeX 公式上挂载快捷操作工具栏（复制 LaTeX + 导出图片下拉）；
 *   - 管理悬浮态、触屏交互、二级菜单自适应定位（fixed 逃逸 overflow 裁剪）；
 *   - 支持全生命周期（mount / unmount / enable / disable / destroy）：
 *     在关闭状态下完全卸载 DOM、断开 IntersectionObserver，零额外 DOM、零内存与计算损耗；
 *   - 图片导出引擎（exporter.ts）通过动态 import() 懒加载，常规阅读与一键复制零等待。
 */

const COPIED_LABEL = '已复制';
const COPY_FAILED_LABEL = '复制失败';
const SVG_DONE_LABEL = 'SVG 已下载';
const PNG_DONE_LABEL = 'PNG 已下载';
const DOWNLOAD_FAILED_LABEL = '下载失败';
const TOOLTIP_MS = 1600;
const TOUCH_REVEAL_MS = 2600;

/* ------------------------------------------------------------------ *
 *  图标与 DOM 构建工具
 * ------------------------------------------------------------------ */

/** 复制图标 */
function copyIconSvg(): string {
  return (
    '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<rect x="6" y="6" width="8.67" height="8.67" rx="1.33"/>' +
    '<path d="M3.33 10V3.33A1.33 1.33 0 0 1 4.67 2h6.67"/>' +
    '</svg>'
  );
}

/** 导出图标 */
function downloadIconSvg(): string {
  return (
    '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M14 10v2.67a1.33 1.33 0 0 1-1.33 1.33H3.33A1.33 1.33 0 0 1 2 12.67V10"/>' +
    '<path d="M4.67 6.67 8 10l3.33-3.33"/>' +
    '<path d="M8 10V2"/>' +
    '</svg>'
  );
}

/** 对勾图标（操作成功反馈） */
function checkIconSvg(): string {
  return (
    '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.9" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M3.25 8.5l3.1 3.1 6.4-7.1"/>' +
    '</svg>'
  );
}

/** 写入剪贴板：优先 Clipboard API，失败时回退到 execCommand */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // 回退方案
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '0';
    ta.style.left = '0';
    ta.style.opacity = '0';
    ta.style.pointerEvents = 'none';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}

function makeButton(className: string, label: string, iconHtml: string): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = className;
  btn.setAttribute('aria-label', label);
  btn.title = label;
  const icon = document.createElement('span');
  icon.className = `${className}-icon`;
  icon.innerHTML = iconHtml;
  const tip = document.createElement('span');
  tip.className = `${className}-tip`;
  btn.append(icon, tip);
  return btn;
}

function makeMenuItem(label: string): HTMLButtonElement {
  const item = document.createElement('button');
  item.type = 'button';
  item.className = 'katex-menu-item';
  item.setAttribute('role', 'menuitem');
  item.textContent = label;
  return item;
}

interface ActionElements {
  wrap: HTMLSpanElement;
  copyBtn: HTMLButtonElement;
  triggerBtn: HTMLButtonElement;
  menu: HTMLSpanElement;
  svgItem: HTMLButtonElement;
  pngItem: HTMLButtonElement;
}

function makeActions(): ActionElements {
  const wrap = document.createElement('span');
  wrap.className = 'katex-actions';

  const copyBtn = makeButton('katex-copy-btn', '复制公式 LaTeX', copyIconSvg());

  const triggerBtn = makeButton('katex-download-btn', '导出公式图片（SVG / PNG）', downloadIconSvg());
  triggerBtn.setAttribute('aria-haspopup', 'menu');
  triggerBtn.setAttribute('aria-expanded', 'false');

  const menu = document.createElement('span');
  menu.className = 'katex-download-menu';
  menu.setAttribute('role', 'menu');
  const svgItem = makeMenuItem('SVG');
  const pngItem = makeMenuItem('PNG');
  menu.append(svgItem, pngItem);

  wrap.append(copyBtn, triggerBtn, menu);
  return { wrap, copyBtn, triggerBtn, menu, svgItem, pngItem };
}

/* ------------------------------------------------------------------ *
 *  菜单定位与全局事件绑定
 * ------------------------------------------------------------------ */

function resetMenuInlineStyles(menu: HTMLElement): void {
  menu.style.position = '';
  menu.style.top = '';
  menu.style.left = '';
  menu.style.right = '';
}

function positionOpenMenu(wrap: HTMLElement): void {
  const trigger = wrap.querySelector<HTMLElement>('.katex-download-btn');
  const menu = wrap.querySelector<HTMLElement>('.katex-download-menu');
  if (!trigger || !menu) return;

  const rect = trigger.getBoundingClientRect();
  if (rect.bottom < 0 || rect.top > window.innerHeight || rect.right < 0 || rect.left > window.innerWidth) {
    wrap.classList.remove('is-open');
    trigger.setAttribute('aria-expanded', 'false');
    resetMenuInlineStyles(menu);
    return;
  }

  const gap = 4;
  const menuHeight = menu.offsetHeight || 80;
  const viewportBottom = window.innerHeight - 8;
  let top = rect.bottom + gap;
  if (top + menuHeight > viewportBottom && rect.top - gap - menuHeight > 8) {
    top = rect.top - gap - menuHeight;
  }
  menu.style.position = 'fixed';
  menu.style.top = Math.max(8, top) + 'px';
  menu.style.left = rect.left + 'px';
  menu.style.right = 'auto';
}

function repositionOpenMenus(): void {
  document.querySelectorAll<HTMLElement>('.katex-actions.is-open').forEach(positionOpenMenu);
}

export function closeAllMenus(): void {
  document.querySelectorAll<HTMLElement>('.katex-actions.is-open').forEach((wrap) => {
    wrap.classList.remove('is-open');
    const trigger = wrap.querySelector<HTMLElement>('.katex-download-btn');
    trigger?.setAttribute('aria-expanded', 'false');
    const menu = wrap.querySelector<HTMLElement>('.katex-download-menu');
    if (menu) resetMenuInlineStyles(menu);
  });
}

function handleGlobalKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') closeAllMenus();
}

let globalListenersBound = false;
function ensureGlobalListeners(): void {
  if (globalListenersBound) return;
  globalListenersBound = true;
  document.addEventListener('click', closeAllMenus);
  document.addEventListener('keydown', handleGlobalKeydown);
  window.addEventListener('scroll', repositionOpenMenus, { passive: true, capture: true });
  window.addEventListener('resize', repositionOpenMenus);
}

function removeGlobalListeners(): void {
  if (!globalListenersBound) return;
  globalListenersBound = false;
  document.removeEventListener('click', closeAllMenus);
  document.removeEventListener('keydown', handleGlobalKeydown);
  window.removeEventListener('scroll', repositionOpenMenus, { capture: true });
  window.removeEventListener('resize', repositionOpenMenus);
}

/* ------------------------------------------------------------------ *
 *  公式节点挂接与交互绑定
 * ------------------------------------------------------------------ */

function wireActions(source: HTMLElement, interact: HTMLElement, actions: ActionElements): void {
  const { wrap, copyBtn, triggerBtn, menu, svgItem, pngItem } = actions;
  const copyIcon = copyBtn.querySelector<HTMLElement>('.katex-copy-btn-icon');
  const copyTip = copyBtn.querySelector<HTMLElement>('.katex-copy-btn-tip');
  const triggerIcon = triggerBtn.querySelector<HTMLElement>('.katex-download-btn-icon');
  const triggerTip = triggerBtn.querySelector<HTMLElement>('.katex-download-btn-tip');
  const isCoarse = window.matchMedia?.('(pointer: coarse)').matches;
  let resetTimer = 0;

  const flash = (
    btn: HTMLButtonElement,
    icon: HTMLElement | null,
    tip: HTMLElement | null,
    ok: boolean,
    okLabel: string,
    failLabel: string
  ): void => {
    window.clearTimeout(resetTimer);
    btn.classList.add('is-done');
    if (icon) icon.innerHTML = ok ? checkIconSvg() : btn === copyBtn ? copyIconSvg() : downloadIconSvg();
    if (tip) tip.textContent = ok ? okLabel : failLabel;
    resetTimer = window.setTimeout(() => {
      btn.classList.remove('is-done');
      if (icon) icon.innerHTML = btn === copyBtn ? copyIconSvg() : downloadIconSvg();
      if (tip) tip.textContent = ok ? okLabel : failLabel;
    }, TOOLTIP_MS);
  };

  const setMenuOpen = (open: boolean): void => {
    wrap.classList.toggle('is-open', open);
    triggerBtn.setAttribute('aria-expanded', String(open));
    if (open) {
      positionOpenMenu(wrap);
    } else {
      resetMenuInlineStyles(menu);
    }
  };

  copyBtn.addEventListener('click', async (event) => {
    event.preventDefault();
    event.stopPropagation();
    const ok = await copyText((source.dataset.latex ?? '').trim());
    flash(copyBtn, copyIcon, copyTip, ok, COPIED_LABEL, COPY_FAILED_LABEL);
  });

  triggerBtn.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    const wasOpen = wrap.classList.contains('is-open');
    closeAllMenus();
    setMenuOpen(!wasOpen);
  });

  const keepFeedbackVisible = (): void => {
    if (!isCoarse) return;
    wrap.classList.add('is-visible');
    window.setTimeout(() => {
      wrap.classList.remove('is-visible');
      if (!wrap.classList.contains('is-open')) setMenuOpen(false);
    }, TOOLTIP_MS + 250);
  };

  // 动态懒加载导出核心模块（按需加载，未点击导出前零执行开销）
  svgItem.addEventListener('click', async (event) => {
    event.preventDefault();
    event.stopPropagation();
    setMenuOpen(false);
    try {
      const { exportFormula } = await import('./exporter');
      const ok = await exportFormula(source, 'svg');
      flash(triggerBtn, triggerIcon, triggerTip, ok, SVG_DONE_LABEL, DOWNLOAD_FAILED_LABEL);
    } catch {
      flash(triggerBtn, triggerIcon, triggerTip, false, SVG_DONE_LABEL, DOWNLOAD_FAILED_LABEL);
    }
    keepFeedbackVisible();
  });

  pngItem.addEventListener('click', async (event) => {
    event.preventDefault();
    event.stopPropagation();
    setMenuOpen(false);
    try {
      const { exportFormula } = await import('./exporter');
      const ok = await exportFormula(source, 'png');
      flash(triggerBtn, triggerIcon, triggerTip, ok, PNG_DONE_LABEL, DOWNLOAD_FAILED_LABEL);
    } catch {
      flash(triggerBtn, triggerIcon, triggerTip, false, PNG_DONE_LABEL, DOWNLOAD_FAILED_LABEL);
    }
    keepFeedbackVisible();
  });

  if (isCoarse) {
    interact.addEventListener('click', (event) => {
      if (event.target instanceof Node && wrap.contains(event.target)) return;
      wrap.classList.add('is-visible');
      window.clearTimeout(resetTimer);
      window.setTimeout(() => {
        wrap.classList.remove('is-visible');
        if (!wrap.classList.contains('is-open')) setMenuOpen(false);
      }, TOUCH_REVEAL_MS);
    });
  }
}

/** 挂载单个公式操作条 */
export function mountFormula(root: HTMLElement): void {
  if (root.dataset.katexCopyReady) return;
  root.dataset.katexCopyReady = '1';

  const actions = makeActions();

  if (root.classList.contains('katex-display')) {
    root.appendChild(actions.wrap);
    wireActions(root, root, actions);
  } else {
    const host = document.createElement('span');
    host.className = 'katex-copy-host';
    root.before(host);
    host.appendChild(root);
    host.appendChild(actions.wrap);
    wireActions(root, host, actions);
  }
}

/** 卸载单个公式操作条并还原 DOM（零多余节点残余） */
export function unmountFormula(root: HTMLElement): void {
  if (!root.dataset.katexCopyReady) return;
  delete root.dataset.katexCopyReady;

  if (root.classList.contains('katex-display')) {
    const actions = root.querySelector('.katex-actions');
    actions?.remove();
  } else {
    const host = root.parentElement;
    if (host && host.classList.contains('katex-copy-host')) {
      const actions = host.querySelector('.katex-actions');
      actions?.remove();
      host.before(root);
      host.remove();
    } else {
      const actions = root.querySelector('.katex-actions');
      actions?.remove();
    }
  }
}

/* ------------------------------------------------------------------ *
 *  全局生命周期与状态控制
 * ------------------------------------------------------------------ */

let isActionsEnabled = true;

/** 获取当前公式操作功能是否处于激活状态 */
export function isFormulaActionsEnabled(): boolean {
  return isActionsEnabled;
}

/**
 * 启用公式操作功能：
 * 挂接 DOM、恢复 IntersectionObserver，按需渲染操作条。
 */
export function enableFormulaActions(): void {
  isActionsEnabled = true;
  const content = document.querySelector<HTMLElement>('main .sl-markdown-content');
  if (!content) return;

  const roots = Array.from(content.querySelectorAll<HTMLElement>('[data-latex]'));
  if (!roots.length) return;

  ensureGlobalListeners();

  const win = window as unknown as { __formulaIO?: IntersectionObserver };
  const useLazy = typeof IntersectionObserver === 'function' && roots.length > 48;

  if (useLazy) {
    if (!win.__formulaIO) {
      win.__formulaIO = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              const root = entry.target as HTMLElement;
              mountFormula(root);
              win.__formulaIO?.unobserve(root);
            }
          }
        },
        { rootMargin: '480px 0px' }
      );
    }
    for (const root of roots) {
      if (!root.dataset.katexCopyReady) win.__formulaIO.observe(root);
    }
  } else {
    for (const root of roots) {
      mountFormula(root);
    }
  }
}

/**
 * 禁用公式操作功能：
 * 彻底卸载所有公式上的 DOM 结构、断开 Observer、移除全局事件，保证零性能开销。
 */
export function disableFormulaActions(): void {
  isActionsEnabled = false;
  closeAllMenus();

  const win = window as unknown as { __formulaIO?: IntersectionObserver };
  if (win.__formulaIO) {
    win.__formulaIO.disconnect();
    win.__formulaIO = undefined;
  }

  const content = document.querySelector<HTMLElement>('main .sl-markdown-content');
  if (content) {
    const roots = Array.from(content.querySelectorAll<HTMLElement>('[data-latex]'));
    for (const root of roots) {
      unmountFormula(root);
    }
  }

  removeGlobalListeners();
}

function isStoredEnabled(): boolean {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem('starlight-features');
      if (raw) {
        const data = JSON.parse(raw);
        if (data.formulaActions === false) return false;
      }
    }
  } catch {}
  return true;
}

/**
 * 初始化文章正文公式操作（页面加载或 SPA 切换时调用）。
 */
export function initFormulaActions(): void {
  if (!isStoredEnabled()) {
    isActionsEnabled = false;
    return;
  }
  if (isActionsEnabled) {
    enableFormulaActions();
  }
}

/**
 * 销毁并清理（页面卸载时调用）。
 */
export function destroyFormulaActions(): void {
  disableFormulaActions();
}
