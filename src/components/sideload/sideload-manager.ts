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
  }

  public init(): void {
    if (this.isInitialized || typeof window === 'undefined') return;
    this.isInitialized = true;

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {

        if (this.activePanelId !== 'toc' && !document.querySelector('.ex-ai-rich-tooltip.is-active')) {
          this.switchToDefault();
        }
      }
    });

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

  public collapse(): void {
    this.previousPanelId = this.activePanelId;
    this.activePanelId = 'none';
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

  private syncDom(payload?: any): void {
    if (typeof document === 'undefined') return;

    const state = this.getState();
    const root = document.documentElement;
    const body = document.body;

    root.dataset.sideloadActive = state.activePanelId;
    root.dataset.sideloadTier = state.widthTier;

    if (state.activePanelId === 'exercises') {
      body.classList.add('exercise-sidebar-active');
      document.querySelector('.custom-page-sidebar')?.classList.add('has-exercise-active');
    } else {
      body.classList.remove('exercise-sidebar-active');
      document.querySelector('.custom-page-sidebar')?.classList.remove('has-exercise-active');
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
