export type SideloadWidthTier = 'compact' | 'medium' | 'wide' | 'none';

export interface SideloadPanelConfig {
  id: string;
  title: string;
  widthTier: SideloadWidthTier;
  customWidth?: string;
  badge?: string;
  allowDrawer?: boolean;
}

export interface SideloadState {
  activePanelId: string;
  previousPanelId: string | null;
  widthTier: SideloadWidthTier;
  widthValue: string;
  isDrawerOpen: boolean;
}

const WIDTH_MAP: Record<SideloadWidthTier, string> = {
  compact: '16.5rem',
  medium: '22rem',
  wide: 'clamp(20rem, 28vw, 25.5rem)',
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

  public init(): void {
    if (this.isInitialized || typeof window === 'undefined') return;
    this.isInitialized = true;

    try {
      const stored = localStorage.getItem(SIDEBAR_RIGHT_STORAGE_KEY);
      const isDesktop = window.matchMedia('(min-width: 72rem)').matches;
      if (stored === 'true' && isDesktop) {
        this.activePanelId = 'none';
      }
    } catch {}

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {

        if (this.activePanelId !== 'toc' && !document.querySelector('.ex-ai-rich-tooltip.is-active')) {
          this.switchToDefault();
        }
      }
    });

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

    window.addEventListener('astrolib:lite-mode-change', (e: any) => {
      if (e?.detail?.enabled) {
        this.switchToDefault();
      }
    });

    const scrim = document.getElementById('astrolib-sideload-scrim');
    if (scrim && !(scrim as any).__sideloadBound) {
      (scrim as any).__sideloadBound = true;
      scrim.addEventListener('click', () => this.switchToDefault());
    }

    this.syncDom();
  }

  public register(config: SideloadPanelConfig): void {
    this.panels.set(config.id, config);
  }

  public open(panelId: string, payload?: any): void {
    if (!this.panels.has(panelId)) {
      console.warn(`[SideloadManager] 未知侧载面板: ${panelId}`);
      return;
    }

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

  public switchToDefault(): void {
    this.open('toc');
  }

  public toggle(panelId: string, payload?: any): void {
    if (this.activePanelId === panelId) {
      this.switchToDefault();
    } else {
      this.open(panelId, payload);
    }
  }

  public isCollapsed(): boolean {
    return this.activePanelId === 'none';
  }

  public getPreviousPanelId(): string | null {
    return this.previousPanelId;
  }

  public restore(): void {
    if (this.isCollapsed()) {
      const target = (this.previousPanelId && this.previousPanelId !== 'none') ? this.previousPanelId : 'toc';
      this.open(target);
    }
  }

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

  public subscribe(listener: (state: SideloadState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public getActivePanelId(): string {
    return this.activePanelId;
  }

  private syncDom(payload?: any): void {
    if (typeof document === 'undefined') return;

    const state = this.getState();
    const root = document.documentElement;
    const body = document.body;

    root.dataset.sideloadActive = state.activePanelId;
    root.dataset.sideloadTier = state.widthTier;
    root.dataset.sidebarRightCollapsed = state.activePanelId === 'none' ? 'true' : 'false';

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

    root.style.setProperty('--sl-sideload-width', state.widthValue);

    document.querySelectorAll<HTMLElement>('.sideload-panel-view').forEach((panel) => {
      const id = panel.getAttribute('data-panel-id');
      const isActive = id === state.activePanelId;
      panel.setAttribute('aria-hidden', String(!isActive));
      panel.classList.toggle('active', isActive);
    });

    const panelConfig = this.panels.get(state.activePanelId);
    const titleEl = document.getElementById('sideload-panel-title');
    if (titleEl && panelConfig) {
      titleEl.textContent = panelConfig.title;
    }

    const backBtn = document.getElementById('sideload-back-to-toc');
    if (backBtn) {
      backBtn.style.display = state.activePanelId === 'toc' || state.activePanelId === 'none' ? 'none' : 'inline-flex';
    }

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

export const sideloadManager = new SideloadManager();

if (typeof window !== 'undefined') {
  (window as any).__sideloadManager = sideloadManager;
}
