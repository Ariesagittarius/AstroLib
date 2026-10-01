export const SIDEBAR_LEFT_STORAGE_KEY = 'astrolib_sidebar_left_collapsed';

export interface SidebarLeftState {
  collapsed: boolean;
  isMobile: boolean;
  mobileExpanded: boolean;
}

class SidebarLayoutController {
  private collapsed = false;
  private isInitialized = false;
  private listeners = new Set<(state: SidebarLeftState) => void>();

  public isMobileViewport(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 49.999rem)').matches;
  }

  public init(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(SIDEBAR_LEFT_STORAGE_KEY);
      if (stored === 'true' && !this.isMobileViewport()) {
        this.collapsed = true;
      }
    } catch {}

    this.syncDom();

    if (this.isInitialized) return;
    this.isInitialized = true;

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

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b' && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        this.toggleLeftSidebar();
      }
    });

    const mql = window.matchMedia('(max-width: 49.999rem)');
    mql.addEventListener('change', () => {
      this.syncDom();
    });

    if (typeof MutationObserver !== 'undefined') {
      const observer = new MutationObserver(() => {
        this.notifyListeners();
      });
      observer.observe(document.body, {
        attributes: true,
        attributeFilter: ['data-mobile-menu-expanded'],
      });
    }
  }

  public isCollapsed(): boolean {
    return this.collapsed;
  }

  public getState(): SidebarLeftState {
    const isMobile = this.isMobileViewport();
    const mobileExpanded = typeof document !== 'undefined'
      ? document.body.hasAttribute('data-mobile-menu-expanded')
      : false;

    return {
      collapsed: this.collapsed,
      isMobile,
      mobileExpanded,
    };
  }

  public setCollapsed(collapsed: boolean): void {
    this.collapsed = collapsed;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(SIDEBAR_LEFT_STORAGE_KEY, String(collapsed));
      }
    } catch {}
    this.syncDom();
  }

  public toggleLeftSidebar(): void {
    if (this.isMobileViewport()) {
      const starlightBtn = document.querySelector('starlight-menu-button button') as HTMLButtonElement | null;
      if (starlightBtn) {
        starlightBtn.click();
      } else {
        const isExpanded = document.body.hasAttribute('data-mobile-menu-expanded');
        document.body.toggleAttribute('data-mobile-menu-expanded', !isExpanded);
      }
      this.notifyListeners();
      return;
    }

    this.setCollapsed(!this.collapsed);
  }

  public subscribe(listener: (state: SidebarLeftState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private syncDom(): void {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    const isMobile = this.isMobileViewport();

    if (isMobile) {

      root.dataset.sidebarLeftCollapsed = 'false';
    } else {
      root.dataset.sidebarLeftCollapsed = this.collapsed ? 'true' : 'false';
    }

    this.notifyListeners();
  }

  private notifyListeners(): void {
    const state = this.getState();

    if (typeof window !== 'undefined') {
      const event = new CustomEvent('astrolib:sidebar-left-change', {
        detail: state,
      });
      window.dispatchEvent(event);
    }

    this.listeners.forEach((listener) => {
      try {
        listener(state);
      } catch (err) {
        console.error('[SidebarLayoutController] 监听器执行异常:', err);
      }
    });
  }
}

export const sidebarLayoutController = new SidebarLayoutController();

if (typeof window !== 'undefined') {
  (window as any).__sidebarLayoutController = sidebarLayoutController;
}
