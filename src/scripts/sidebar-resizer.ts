/**
 * 双侧边栏统一调宽 / 折叠引擎
 *
 * 设计目标：
 * - 左侧栏与右侧栏使用同一套逻辑与视觉，避免两套实现漂移；
 * - 右侧栏只在“真正存在右侧栏”的页面显示手柄，SPA 切页后自动清理；
 * - 宽度与折叠状态持久化到 localStorage，刷新 / 前进后退后保持一致；
 * - 使用 Pointer Events，避免鼠标拖动移出窗口后卡在拖拽态。
 */

type Side = 'left' | 'right';

const STORAGE_KEY = 'starlight:sidebar-resizer';
const LEFT_VAR = '--sl-sidebar-width';
const RIGHT_VAR = '--right-sidebar-width';
const DEFAULT_WIDTH = '18.75rem';
const MIN_WIDTH = 240;
const MAX_WIDTH = 480;

interface SidebarState {
  left?: string;
  right?: string;
  leftCollapsed?: boolean;
  rightCollapsed?: boolean;
}

let state: SidebarState = loadState();
let initialized = false;

function loadState(): SidebarState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === 'object' ? { ...parsed } : {};
  } catch {
    return {};
  }
}

function saveState(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // 隐私模式或存储不可用时静默降级为“仅本次会话生效”。
  }
}

function cssVar(side: Side): string {
  return side === 'left' ? LEFT_VAR : RIGHT_VAR;
}

function sidebarEl(side: Side): HTMLElement | null {
  return document.querySelector<HTMLElement>(
    side === 'left' ? 'nav.sidebar' : '.right-sidebar-container'
  );
}

function bodyClass(side: Side): string {
  return side === 'left' ? 'left-sidebar-collapsed' : 'right-sidebar-collapsed';
}

function isCollapsed(side: Side): boolean {
  return side === 'left' ? Boolean(state.leftCollapsed) : Boolean(state.rightCollapsed);
}

function getExpandedWidth(side: Side): string {
  const stored = side === 'left' ? state.left : state.right;
  return stored && stored !== '0px' ? stored : DEFAULT_WIDTH;
}

function clampWidth(raw: number): number {
  const max = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, Math.floor(window.innerWidth * 0.4)));
  return Math.min(Math.max(Math.round(raw), MIN_WIDTH), max);
}

function applyWidth(side: Side, width: number): void {
  const value = `${width}px`;
  if (side === 'left') state.left = value;
  else state.right = value;
  document.documentElement.style.setProperty(cssVar(side), value);
}

function setCollapsed(side: Side, collapsed: boolean): void {
  const el = sidebarEl(side);
  if (!el) return;

  if (side === 'left') state.leftCollapsed = collapsed;
  else state.rightCollapsed = collapsed;

  document.documentElement.style.setProperty(
    cssVar(side),
    collapsed ? '0px' : getExpandedWidth(side)
  );
  el.classList.toggle('collapsed-sidebar', collapsed);
  document.body.classList.toggle(bodyClass(side), collapsed);
  saveState();
  updateToggle(side);
}

function toggleSidebar(side: Side): void {
  const el = sidebarEl(side);
  if (!el) return;
  setCollapsed(side, !isCollapsed(side));
}

function updateToggle(side: Side): void {
  const btn = document.querySelector<HTMLElement>(`#${side}-resizer-handle .resizer-toggle-btn`);
  if (!btn) return;

  const collapsed = isCollapsed(side);
  const label = `${collapsed ? '展开' : '折叠'}${side === 'left' ? '左侧' : '右侧'}边栏`;

  // 箭头始终指向“面板将被移动的方向”：
  // 左侧栏可见时指向左（‹），折叠后指向右（›）；
  // 右侧栏可见时指向右（›），折叠后指向左（‹）。
  btn.innerHTML = side === 'left' ? (collapsed ? '›' : '‹') : (collapsed ? '‹' : '›');
  btn.setAttribute('aria-label', label);
  btn.setAttribute('aria-expanded', String(!collapsed));
}

function makeHandle(side: Side): HTMLElement {
  const handle = document.createElement('div');
  handle.className = `resizer-handle ${side}-handle`;
  handle.id = `${side}-resizer-handle`;

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = `resizer-toggle-btn ${side}-toggle`;
  handle.appendChild(btn);

  handle.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    if ((event.target as HTMLElement).closest('.resizer-toggle-btn')) return;
    startResize(event, side);
  });

  btn.addEventListener('click', (event) => {
    event.stopPropagation();
    toggleSidebar(side);
  });

  updateToggle(side);
  return handle;
}

function startResize(event: PointerEvent, side: Side): void {
  const el = sidebarEl(side);
  if (!el) return;

  const handle = event.currentTarget as HTMLElement;

  // 从折叠态直接拖拽时先展开，避免“拖了但面板不出现”的困惑。
  if (isCollapsed(side)) setCollapsed(side, false);

  event.preventDefault();
  handle.classList.add('active');
  document.body.classList.add('is-resizing');

  const cover = document.createElement('div');
  cover.id = 'resizer-iframe-cover';
  document.body.appendChild(cover);

  const onMove = (moveEvent: PointerEvent): void => {
    const raw = side === 'left' ? moveEvent.clientX : window.innerWidth - moveEvent.clientX;
    applyWidth(side, clampWidth(raw));
  };

  const finish = (): void => {
    handle.classList.remove('active');
    document.body.classList.remove('is-resizing');
    cover.remove();
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', finish);
    window.removeEventListener('pointercancel', finish);
    saveState();
  };

  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerup', finish);
  window.addEventListener('pointercancel', finish);
}

function applySidebarState(): void {
  const left = sidebarEl('left');
  const right = sidebarEl('right');

  if (left) {
    document.documentElement.style.setProperty(LEFT_VAR, isCollapsed('left') ? '0px' : getExpandedWidth('left'));
    left.classList.toggle('collapsed-sidebar', isCollapsed('left'));
    document.body.classList.toggle('left-sidebar-collapsed', isCollapsed('left'));
  } else {
    document.body.classList.remove('left-sidebar-collapsed');
  }

  if (right) {
    document.documentElement.style.setProperty(RIGHT_VAR, isCollapsed('right') ? '0px' : getExpandedWidth('right'));
    right.classList.toggle('collapsed-sidebar', isCollapsed('right'));
    document.body.classList.toggle('right-sidebar-collapsed', isCollapsed('right'));
  } else {
    document.body.classList.remove('right-sidebar-collapsed');
  }
}

function syncSidebarResizers(): void {
  // 每次同步都重新读取持久化状态，避免多入口脚本各自持有过期副本。
  state = loadState();

  const left = sidebarEl('left');
  const right = sidebarEl('right');

  if (left) {
    if (!document.getElementById('left-resizer-handle')) {
      left.parentNode?.insertBefore(makeHandle('left'), left.nextSibling);
    }
    updateToggle('left');
  } else {
    document.getElementById('left-resizer-handle')?.remove();
  }

  if (right) {
    if (!document.getElementById('right-resizer-handle')) {
      right.parentNode?.insertBefore(makeHandle('right'), right);
    }
    updateToggle('right');
  } else {
    // SPA 从“有右侧栏”切到“无右侧栏”时，必须移除残留手柄，否则会出现无法点击的幽灵手柄。
    document.getElementById('right-resizer-handle')?.remove();
  }

  applySidebarState();
}

/**
 * 初始化双侧边栏调宽系统。
 * 可在每次 Astro 页面切换后重复调用：内部只会注册一次全局监听，
 * 但每次都会根据当前 DOM 同步手柄的存在与状态。
 */
export function initSidebarResizers(): void {
  if (!initialized) {
    initialized = true;
    document.addEventListener('astro:page-load', syncSidebarResizers);
  }
  syncSidebarResizers();
}
