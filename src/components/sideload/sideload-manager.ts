/**
 * src/components/sideload/sideload-manager.ts
 * ============================================================================
 * AstroLib 统一右侧侧载管理器 (Unified Right Sideload Manager)
 * ============================================================================
 * 核心职责：
 * 1. 作为右侧辅助空间（侧载宿主 SideloadDock）的唯一样式与状态机单一可信源；
 * 2. 统筹管理右侧面板（本章大纲 TOC、课后习题 Exercises、设置 Settings 及未来扩展的 AI、速查等）；
 * 3. 动态计算并注入 CSS 自定义变量 `--sl-sideload-width`，与 `.main-pane` 协调视口空间；
 * 4. 驱动多尺寸（Desktop Docked 并列分栏 / Tablet & Mobile Drawer 侧滑抽屉）自适应；
 * 5. 对外派发标准事件 `astrolib:sideload-change`，解耦各模块间的硬编码依赖。
 * ============================================================================
 */

export type SideloadWidthTier = 'compact' | 'medium' | 'wide' | 'none';

export interface SideloadPanelConfig {
  id: string;
  title: string;
  widthTier: SideloadWidthTier;
  customWidth?: string; // 自定义宽度（如 '24rem'）
  badge?: string;
  allowDrawer?: boolean; // 是否允许在移动/平板端作为抽屉唤出
}

export interface SideloadState {
  activePanelId: string;
  previousPanelId: string | null;
  widthTier: SideloadWidthTier;
  widthValue: string;
  isDrawerOpen: boolean;
}

const WIDTH_MAP: Record<SideloadWidthTier, string> = {
  compact: '16.5rem', // 264px（本章大纲标准宽）
  medium: '22rem',   // 352px
  wide: 'clamp(20rem, 28vw, 25.5rem)', // 习题与宽面板标准宽 (~384px - 408px)
  none: '0rem',
};

export const SIDEBAR_RIGHT_STORAGE_KEY = 'astrolib_sidebar_right_collapsed';

class SideloadManager {
  private activePanelId = 'toc';
  private previousPanelId: string | null = null;
  private panels = new Map<string, SideloadPanelConfig>();
  private listeners = new Set<(state: SideloadState) => void>();
  private isInitialized = false;

  constructor() {
    // 默认内置注册两项核心面板
    this.register({
      id: 'toc',
      title: '本节大纲',
      widthTier: 'compact',
      allowDrawer: false,
    });
    this.register({
      id: 'exercises',
      title: '课后习题',
      widthTier: 'wide',
      allowDrawer: true,
    });
    this.register({
      id: 'ai',
      title: '智能问答',
      widthTier: 'wide',
      allowDrawer: true,
    });
    this.register({
      id: 'translate',
      title: '双语助读',
      widthTier: 'wide',
      allowDrawer: true,
    });
  }

  /**
   * 初始化管理器并监听全局按键与响应式变化
   */
  public init(): void {
    if (this.isInitialized || typeof window === 'undefined') return;
    this.isInitialized = true;

    // 0. 读取右侧栏折叠持久化偏好（桌面端 >= 72rem 生效）
    try {
      const stored = localStorage.getItem(SIDEBAR_RIGHT_STORAGE_KEY);
      const isDesktop = window.matchMedia('(min-width: 72rem)').matches;
      if (stored === 'true' && isDesktop) {
        this.activePanelId = 'none';
      }
    } catch {}

    // 绑定全局 Esc 键退出非大纲面板
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        // 如果当前处在非默认面板（如习题），且无高优先级浮层打开，则返回大纲
        if (this.activePanelId !== 'toc' && !document.querySelector('.ex-ai-rich-tooltip.is-active')) {
          this.switchToDefault();
        }
      }
    });

    // 绑定全局 Alt+T / Alt+O 快捷键收放右侧栏（避开文本输入控件）
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'MD-OUTLINED-TEXT-FIELD' ||
        target.isContentEditable
      )) {
        return;
      }

      if (e.altKey && (e.key.toLowerCase() === 't' || e.key.toLowerCase() === 'o') && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        this.toggleRightSidebar();
      }
    });

    // 监听全站低性能模式切换：激活时自动退回本节大纲
    window.addEventListener('astrolib:lite-mode-change', (e: any) => {
      if (e?.detail?.enabled) {
        this.switchToDefault();
      }
    });

    // 绑定侧载抽屉遮罩点击关闭 (作为单例状态机统一防线)
    const scrim = document.getElementById('astrolib-sideload-scrim');
    if (scrim && !(scrim as any).__sideloadBound) {
      (scrim as any).__sideloadBound = true;
      scrim.addEventListener('click', () => this.switchToDefault());
    }

    // 同步初态至 DOM
    this.syncDom();
  }

  /**
   * 注册新的侧载面板配置
   */
  public register(config: SideloadPanelConfig): void {
    this.panels.set(config.id, config);
  }

  /**
   * 打开指定侧载面板
   */
  public open(panelId: string, payload?: any): void {
    if (!this.panels.has(panelId)) {
      console.warn(`[SideloadManager] 未知侧载面板: ${panelId}`);
      return;
    }

    // 低性能模式守卫：严禁打开重型非大纲视图（如习题面板），确保纯净正文阅读
    if (typeof localStorage !== 'undefined' && localStorage.getItem('astrolib_lite_mode') === 'true' && panelId !== 'toc') {
      return;
    }

    if (panelId !== 'none') {
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(SIDEBAR_RIGHT_STORAGE_KEY, 'false');
        }
      } catch {}
    }

    if (this.activePanelId === panelId) return;

    this.previousPanelId = this.activePanelId;
    this.activePanelId = panelId;
    this.syncDom(payload);
  }

  /**
   * 关闭当前面板并恢复默认面板（通常为本节大纲 'toc'）
   */
  public switchToDefault(): void {
    this.open('toc');
  }

  /**
   * 切换面板开合（若当前激活则切回默认，若未激活则打开）
   */
  public toggle(panelId: string, payload?: any): void {
    if (this.activePanelId === panelId) {
      this.switchToDefault();
    } else {
      this.open(panelId, payload);
    }
  }

  /**
   * 判断右侧栏当前是否处于完全收起折叠状态
   */
  public isCollapsed(): boolean {
    return this.activePanelId === 'none';
  }

  /**
   * 获取上一个激活的面板 ID
   */
  public getPreviousPanelId(): string | null {
    return this.previousPanelId;
  }

  /**
   * 恢复右侧栏（若处于收起态，则恢复前次面板或默认大纲）
   */
  public restore(): void {
    if (this.isCollapsed()) {
      const target = (this.previousPanelId && this.previousPanelId !== 'none') ? this.previousPanelId : 'toc';
      this.open(target);
    }
  }

  /**
   * 切换右侧栏收纳/展开：
   * - 若在移动端/平板端 (< 72rem)，触发移动端大纲面板切换
   * - 若在桌面端已收起，则恢复前一个面板或默认大纲
   * - 若在桌面端已展开，则收起右侧栏
   */
  public toggleRightSidebar(): void {
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 71.999rem)').matches) {
      const localNavBtn = document.querySelector('.vp-local-nav-btn') as HTMLButtonElement | null;
      if (localNavBtn) {
        localNavBtn.click();
        return;
      }
    }

    if (this.isCollapsed()) {
      this.restore();
    } else {
      this.collapse();
    }
  }

  /**
   * 完全收起右侧栏（如进入全屏沉浸阅读模式）
   */
  public collapse(): void {
    if (this.activePanelId !== 'none') {
      this.previousPanelId = this.activePanelId;
    }
    this.activePanelId = 'none';
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(SIDEBAR_RIGHT_STORAGE_KEY, 'true');
      }
    } catch {}
    this.syncDom();
  }

  /**
   * 获取当前侧载状态
   */
  public getState(): SideloadState {
    const config = this.panels.get(this.activePanelId);
    const widthTier = config ? config.widthTier : (this.activePanelId === 'none' ? 'none' : 'compact');
    const widthValue = config?.customWidth || WIDTH_MAP[widthTier];
    const isDrawerOpen = typeof window !== 'undefined'
      ? window.matchMedia('(max-width: 71.999rem)').matches && this.activePanelId !== 'toc' && this.activePanelId !== 'none'
      : false;

    return {
      activePanelId: this.activePanelId,
      previousPanelId: this.previousPanelId,
      widthTier,
      widthValue,
      isDrawerOpen,
    };
  }

  /**
   * 订阅侧载状态变更
   */
  public subscribe(listener: (state: SideloadState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public getActivePanelId(): string {
    return this.activePanelId;
  }

  /**
   * 同步状态至 <html> / <body> 与 CSS 变量
   */
  private syncDom(payload?: any): void {
    if (typeof document === 'undefined') return;

    const state = this.getState();
    const root = document.documentElement;
    const body = document.body;

    // 1. 设置数据集属性
    root.dataset.sideloadActive = state.activePanelId;
    root.dataset.sideloadTier = state.widthTier;
    root.dataset.sidebarRightCollapsed = state.activePanelId === 'none' ? 'true' : 'false';

    // 兼容历史样式类名（平滑过渡，避免既有样式瞬间失效）
    if (state.activePanelId === 'exercises') {
      body.classList.add('exercise-sidebar-active');
      document.querySelector('.custom-page-sidebar')?.classList.add('has-exercise-active');
    } else {
      body.classList.remove('exercise-sidebar-active');
      document.querySelector('.custom-page-sidebar')?.classList.remove('has-exercise-active');
    }

    if (state.activePanelId === 'ai') {
      body.classList.add('ai-sidebar-active');
      document.querySelector('.custom-page-sidebar')?.classList.add('has-ai-active');
    } else {
      body.classList.remove('ai-sidebar-active');
      document.querySelector('.custom-page-sidebar')?.classList.remove('has-ai-active');
    }

    if (state.activePanelId === 'translate') {
      body.classList.add('translate-sidebar-active');
      document.querySelector('.custom-page-sidebar')?.classList.add('has-translate-active');
    } else {
      body.classList.remove('translate-sidebar-active');
      document.querySelector('.custom-page-sidebar')?.classList.remove('has-translate-active');
    }

    // 2. 注入核心 CSS 变量（驱动宽度平滑过渡）
    root.style.setProperty('--sl-sideload-width', state.widthValue);

    // 3. 同步侧载面板 DOM 的 active / hidden 状态
    document.querySelectorAll<HTMLElement>('.sideload-panel-view').forEach((panel) => {
      const id = panel.getAttribute('data-panel-id');
      const isActive = id === state.activePanelId;
      panel.setAttribute('aria-hidden', String(!isActive));
      panel.classList.toggle('active', isActive);
    });

    // 4. 同步侧载头部标题与返回按钮
    const panelConfig = this.panels.get(state.activePanelId);
    const titleEl = document.getElementById('sideload-panel-title');
    if (titleEl && panelConfig) {
      titleEl.textContent = panelConfig.title;
    }

    const backBtn = document.getElementById('sideload-back-to-toc');
    if (backBtn) {
      backBtn.style.display = state.activePanelId === 'toc' || state.activePanelId === 'none' ? 'none' : 'inline-flex';
    }

    // 5. 触发事件与监听器回调
    const event = new CustomEvent('astrolib:sideload-change', {
      detail: { ...state, payload },
    });
    window.dispatchEvent(event);

    this.listeners.forEach((listener) => {
      try {
        listener(state);
      } catch (err) {
        console.error('[SideloadManager] 监听器执行异常:', err);
      }
    });
  }
}

// 导出全局单例
export const sideloadManager = new SideloadManager();

if (typeof window !== 'undefined') {
  (window as any).__sideloadManager = sideloadManager;
}
