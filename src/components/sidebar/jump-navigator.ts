/**
 * 全站跨页/页内跳转历史栈管理器与 VitePress 风格浮动返回胶囊组件 (Jump Navigator)
 *
 * 核心设计原则：
 * 1. 设计减法（Less is More）：仅在左下角（移动端底部居中）保留唯一的极简半透明返回胶囊，拒绝界面堆砌。
 * 2. 瞬时秒切到位（Zero-latency Instant Return）：返回时消除慢速滚动动画，直接瞬时恢复目标位置与视线脉冲，实现无缝衔接。
 * 3. 内存与性能把控（Strict Memory & Performance Bound）：仅存储轻量元数据，栈容量上限为 8，无 DOM 引用泄漏。
 */

export interface JumpRecord {
  sourceUrl: string;
  sourceScrollY: number;
  sourceTitle: string;
  sourceBadgeId?: string;
  sourceText?: string;
  timestamp: number;
}

const STORAGE_KEY = 'astrolib_jump_history_stack';
const PENDING_RESTORE_KEY = 'astrolib_pending_jump_restore';
const MAX_STACK_SIZE = 8;

let memoryStack: JumpRecord[] = [];
let widgetElement: HTMLElement | null = null;
let listenersInitialized = false;

function normPath(p: string): string {
  if (!p) return '/';
  const clean = p.split('#')[0].split('?')[0];
  return clean === '/' ? '/' : clean.replace(/\/+$/, '');
}

function loadStack(): JumpRecord[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        memoryStack = parsed;
        return memoryStack;
      }
    }
  } catch (err) {
    // 忽略解析异常
  }
  memoryStack = [];
  return memoryStack;
}

function saveStack() {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(memoryStack));
  } catch (err) {
    // 忽略存储异常
  }
}

/**
 * 获取当前页面的简明章节标题
 */
export function getCurrentPageTitle(): string {
  const h1 = document.querySelector('h1');
  if (h1 && h1.textContent) {
    return h1.textContent.replace(/\s+/g, ' ').trim();
  }
  const title = document.title.split('—')[0].split('|')[0].trim();
  return title || '原章节';
}

/**
 * 记录一次跳转行为
 */
export function recordJump(params?: {
  badgeEl?: HTMLElement | null;
  sourceText?: string;
  targetUrl?: string;
}): void {
  loadStack();

  const currentUrl = window.location.href;
  const currentScrollY = window.scrollY;
  const pageTitle = getCurrentPageTitle();

  let badgeId = '';
  if (params?.badgeEl) {
    if (!params.badgeEl.id) {
      params.badgeEl.id = `xref-src-badge-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    }
    badgeId = params.badgeEl.id;
  }

  const record: JumpRecord = {
    sourceUrl: currentUrl,
    sourceScrollY: currentScrollY,
    sourceTitle: pageTitle,
    sourceBadgeId: badgeId,
    sourceText: params?.sourceText || (params?.badgeEl ? params.badgeEl.textContent?.trim() : ''),
    timestamp: Date.now(),
  };

  // 避免连续重复压入完全相同的同点记录
  const top = memoryStack[memoryStack.length - 1];
  if (
    top &&
    top.sourceUrl === record.sourceUrl &&
    Math.abs(top.sourceScrollY - record.sourceScrollY) < 30
  ) {
    // 覆盖更新时间戳
    top.timestamp = record.timestamp;
  } else {
    memoryStack.push(record);
    if (memoryStack.length > MAX_STACK_SIZE) {
      memoryStack.shift();
    }
  }

  saveStack();
  // 延迟渲染以确保跳转发生后胶囊平滑浮现
  setTimeout(() => {
    renderJumpWidget();
  }, 100);
}

/**
 * 返回跳转前的阅读位置（瞬时秒切到位，无漫长滚动过渡）
 */
export function returnToPrevious(): void {
  loadStack();
  if (memoryStack.length === 0) {
    dismissJumpWidget();
    return;
  }

  const record = memoryStack.pop();
  saveStack();
  if (!record) return;

  const currentPath = normPath(window.location.pathname);
  let targetPath = '';
  try {
    const parsed = new URL(record.sourceUrl, window.location.href);
    targetPath = normPath(parsed.pathname);
  } catch {
    targetPath = currentPath;
  }

  if (targetPath === currentPath) {
    // 同页瞬时秒切回原阅读位置：零动画延迟，马上到位
    window.scrollTo(0, Math.max(0, record.sourceScrollY));

    // 视线接引瞬发脉冲高亮
    if (record.sourceBadgeId) {
      highlightBadge(record.sourceBadgeId, record.sourceText);
    }

    renderJumpWidget();
  } else {
    // 跨页回跳：存储待恢复状态并通过 SPA 极速导航瞬时切页
    try {
      sessionStorage.setItem(
        PENDING_RESTORE_KEY,
        JSON.stringify({
          scrollY: record.sourceScrollY,
          badgeId: record.sourceBadgeId,
          text: record.sourceText,
          time: Date.now(),
        })
      );
    } catch {}

    const spaNav = (window as unknown as Record<string, unknown>).__spaNavigate as
      | ((u: string) => Promise<unknown>)
      | undefined;
    if (typeof spaNav === 'function') {
      spaNav(record.sourceUrl);
    } else {
      window.location.href = record.sourceUrl;
    }
  }
}

/**
 * 高亮原触发徽章或段落（视线接引）
 */
function highlightBadge(badgeId?: string, fallbackText?: string): void {
  let targetEl: HTMLElement | null = null;
  if (badgeId) {
    targetEl = document.getElementById(badgeId);
  }
  if (!targetEl && fallbackText) {
    const badges = Array.from(document.querySelectorAll('.block-ref-badge, .fig-ref-badge'));
    targetEl = (badges.find((b) => b.textContent?.trim() === fallbackText.trim()) as HTMLElement) || null;
  }

  if (targetEl) {
    targetEl.classList.remove('source-jump-pulse');
    void targetEl.offsetWidth; // 强制重绘
    targetEl.classList.add('source-jump-pulse');
    setTimeout(() => {
      targetEl?.classList.remove('source-jump-pulse');
    }, 700);
  }
}

/**
 * 关闭/放弃当前返回提示
 */
export function dismissJumpWidget(): void {
  if (widgetElement) {
    widgetElement.classList.remove('is-active');
    setTimeout(() => {
      if (widgetElement && !widgetElement.classList.contains('is-active')) {
        widgetElement.remove();
        widgetElement = null;
      }
    }, 200);
  }
  // 弹出当前栈顶
  loadStack();
  if (memoryStack.length > 0) {
    memoryStack.pop();
    saveStack();
  }
  if (memoryStack.length > 0) {
    setTimeout(renderJumpWidget, 250);
  }
}

/**
 * 清空全部跳转历史
 */
export function clearJumpHistory(): void {
  memoryStack = [];
  saveStack();
  dismissJumpWidget();
}

/**
 * 渲染/更新 VitePress 风格左下角浮动返回胶囊组件
 */
export function renderJumpWidget(): void {
  loadStack();

  if (memoryStack.length === 0) {
    if (widgetElement) {
      widgetElement.classList.remove('is-active');
      setTimeout(() => {
        widgetElement?.remove();
        widgetElement = null;
      }, 200);
    }
    return;
  }

  const topRecord = memoryStack[memoryStack.length - 1];
  if (!topRecord) return;

  // 截短标题，保持胶囊紧凑精致
  let displayTitle = topRecord.sourceTitle || '原阅读位置';
  if (displayTitle.length > 18) {
    displayTitle = displayTitle.slice(0, 16) + '...';
  }

  if (!widgetElement) {
    widgetElement = document.createElement('div');
    widgetElement.id = 'vp-jump-back-widget';
    widgetElement.className = 'vp-jump-back-widget';
    document.body.appendChild(widgetElement);
  }

  const badgeCountHtml = memoryStack.length > 1
    ? `<span class="vp-jump-count" title="历史跳转层级">${memoryStack.length}</span>`
    : '';

  // 严禁 Emoji，统一采用精细绘制的矢量 SVG 图标
  widgetElement.innerHTML = `
    <button type="button" class="vp-jump-action-btn" title="返回 ${topRecord.sourceTitle} (Alt+B)" aria-label="返回原阅读位置">
      <svg class="vp-jump-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <polyline points="9 14 4 9 9 4" />
        <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
      </svg>
      <span class="vp-jump-label">返回:</span>
      <span class="vp-jump-target">${displayTitle}</span>
      ${badgeCountHtml}
    </button>
    <div class="vp-jump-divider" aria-hidden="true"></div>
    <button type="button" class="vp-jump-close-btn" title="关闭返回提示 (Esc)" aria-label="关闭">
      <svg class="vp-jump-close-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </button>
  `;

  const actionBtn = widgetElement.querySelector('.vp-jump-action-btn');
  actionBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    returnToPrevious();
  });

  const closeBtn = widgetElement.querySelector('.vp-jump-close-btn');
  closeBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    dismissJumpWidget();
  });

  // 触发平滑滑入
  requestAnimationFrame(() => {
    widgetElement?.classList.add('is-active');
  });
}

/**
 * 检查并执行跨页回跳后的精确瞬时定位与视线高亮恢复
 */
export function checkPendingJumpRestore(): void {
  try {
    const raw = sessionStorage.getItem(PENDING_RESTORE_KEY);
    if (!raw) return;
    sessionStorage.removeItem(PENDING_RESTORE_KEY);

    const pending = JSON.parse(raw);
    if (!pending || typeof pending.scrollY !== 'number') return;

    // 检查时间是否在 30 秒内（防陈旧失效）
    if (Date.now() - (pending.time || 0) > 30000) return;

    // 瞬时秒切到位：零动画延迟
    const restore = () => {
      window.scrollTo(0, Math.max(0, pending.scrollY));
      if (pending.badgeId || pending.text) {
        highlightBadge(pending.badgeId, pending.text);
      }
    };

    if (document.readyState === 'complete') {
      restore();
    } else {
      window.addEventListener('load', restore, { once: true });
    }
  } catch (err) {
    // 忽略异常
  }
}

/**
 * 初始化全局快捷键与监听器
 */
export function initJumpNavigator(): void {
  checkPendingJumpRestore();
  renderJumpWidget();

  if (!listenersInitialized) {
    listenersInitialized = true;

    // 快捷键支持：Alt + B 回跳，Esc 关闭
    window.addEventListener('keydown', (e) => {
      if (e.defaultPrevented) return;
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      if (e.key === 'Escape' && widgetElement && widgetElement.classList.contains('is-active')) {
        dismissJumpWidget();
      } else if (e.altKey && (e.key === 'b' || e.key === 'B')) {
        loadStack();
        if (memoryStack.length > 0) {
          e.preventDefault();
          returnToPrevious();
        }
      }
    });

    // 监听左侧侧边栏主动换章点击：主动浏览新章节时自动清空陈旧跳转栈
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (!target) return;
      const sidebarLink = target.closest('nav.sidebar a, .sidebar-pane a');
      if (sidebarLink && !sidebarLink.closest('#vp-jump-back-widget')) {
        // 用户主动开启全新章节阅读，清空栈
        setTimeout(() => {
          clearJumpHistory();
        }, 100);
      }
    });
  }
}
