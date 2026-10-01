import { preprocessPage } from '../../utils/page-preprocess';

declare global {
  interface Window {
    __spaNavInstalled?: boolean;
    __spaNavigate?: (targetUrl: string | URL, options?: { replace?: boolean }) => Promise<void>;
    __renderCustomMath?: (el?: any) => void;
  }
}

export function initSpaNavigationEngine(): void {
  if (typeof window === 'undefined' || window.__spaNavInstalled) {
    return;
  }
  window.__spaNavInstalled = true;

  const pageCache = new Map<string, any>();
  const inFlightRequests = new Map<string, Promise<any>>();
  let navToken = 0;

  function getMaxPageCacheSize(): number {
    try {
      if (localStorage.getItem('astrolib_lite_mode') === 'true') {
        return 0;
      }
      const saved = localStorage.getItem('astrolib_max_page_cache');
      if (saved !== null && saved !== undefined && saved !== '') {
        const val = parseInt(saved, 10);
        if (val === -1) return Infinity;
        if (val === 0) return 0;
        if (!isNaN(val) && val > 0) return val;
      }
    } catch {}
    return 5;
  }

  function prunePageCache(): void {
    const max = getMaxPageCacheSize();
    if (max === 0) {
      for (const [, rec] of pageCache) {
        if (rec) {
          rec.mainHtml = null;
          rec.rightHtml = null;
          rec.sidebarHtml = null;
          rec.textSnippet = null;
        }
      }
      pageCache.clear();
      return;
    }
    if (max === Infinity) return;
    while (pageCache.size > max) {
      const oldestKey = pageCache.keys().next().value;
      if (!oldestKey) break;
      const rec = pageCache.get(oldestKey);
      if (rec) {
        rec.mainHtml = null;
        rec.rightHtml = null;
        rec.sidebarHtml = null;
        rec.textSnippet = null;
      }
      pageCache.delete(oldestKey);
    }
  }

  function normPath(p: string | null | undefined): string {
    if (!p) return '/';
    return p === '/' ? p : p.replace(/\/+$/, '');
  }

  let currentPathname = normPath(location.pathname);

  let progressBarEl: HTMLElement | null = null;
  let progressTimer = 0;
  let progressFinishTimer = 0;

  function ensureProgressBar(): HTMLElement {
    if (progressBarEl) return progressBarEl;
    progressBarEl = document.createElement('div');
    progressBarEl.className = 'vp-progress-bar';
    progressBarEl.innerHTML = '<div class="vp-progress-bar-inner"></div>';
    document.body.appendChild(progressBarEl);
    return progressBarEl;
  }

  function startProgressBar(): void {
    clearTimeout(progressTimer);
    clearTimeout(progressFinishTimer);

    progressTimer = window.setTimeout(() => {
      const bar = ensureProgressBar();
      bar.classList.add('is-active');
      const inner = bar.querySelector<HTMLElement>('.vp-progress-bar-inner');
      if (inner) {
        inner.style.width = '0%';
        inner.style.transition = 'width 0.1s linear';
        requestAnimationFrame(() => {
          inner.style.width = '30%';
          setTimeout(() => {
            if (bar.classList.contains('is-active')) {
              inner.style.transition = 'width 1.8s cubic-bezier(0.1, 0.5, 0.1, 1)';
              inner.style.width = '85%';
            }
          }, 80);
        });
      }
    }, 60);
  }

  function finishProgressBar(): void {
    clearTimeout(progressTimer);
    if (!progressBarEl || !progressBarEl.classList.contains('is-active')) return;
    const inner = progressBarEl.querySelector<HTMLElement>('.vp-progress-bar-inner');
    if (inner) {
      inner.style.transition = 'width 0.12s ease-out';
      inner.style.width = '100%';
    }
    progressFinishTimer = window.setTimeout(() => {
      progressBarEl?.classList.remove('is-active');
      if (inner) inner.style.width = '0%';
    }, 200);
  }

  function isNavLink(a: HTMLAnchorElement | null): boolean {
    if (!a || typeof a.getAttribute !== 'function') return false;
    if (typeof a.hasAttribute === 'function' && a.hasAttribute('download')) return false;
    if (a.target && a.target !== '_self') return false;
    if ((a.getAttribute('rel') || '').split(' ').includes('external')) return false;
    try {
      const href = a.getAttribute('href') || '';
      if (!href || href.startsWith('#') || href.startsWith('javascript:')) return false;
      const url = new URL(href, location.href);
      return url.origin === location.origin && /^https?:$/.test(url.protocol);
    } catch {
      return false;
    }
  }

  function stripScripts(root: Element | null): void {
    if (!root) return;
    root.querySelectorAll('script').forEach((s) => s.remove());
  }

  function parseAndCache(key: string, htmlText: string): any {
    const doc = new DOMParser().parseFromString(htmlText, 'text/html');
    const mainPane = doc.querySelector('.main-pane');
    if (!mainPane) throw new Error('main-pane not found in response');

    stripScripts(mainPane);

    mainPane.querySelectorAll('#dsh-inspector-root, #dsh-editor-root, #dsh-feedback-root, #dsh-chat-root, #dsh-relation-graph-root').forEach((el) => el.remove());

    const rightSidebar = doc.querySelector('.right-sidebar-container');
    if (rightSidebar) stripScripts(rightSidebar);
    const sidebar = doc.querySelector('nav.sidebar, .sidebar-pane, .sidebar');
    if (sidebar) stripScripts(sidebar);
    const title = doc.title || '';

    if (typeof window.__renderCustomMath === 'function') {
      window.__renderCustomMath(mainPane);
    }

    preprocessPage(mainPane as HTMLElement);

    const headLinks = Array.from(doc.querySelectorAll('head link[rel="stylesheet"]'))
      .map((l) => l.getAttribute('href'))
      .filter(Boolean);

    const headStyles = Array.from(doc.querySelectorAll('head style'))
      .map((s) => ({
        id: s.getAttribute('data-vite-dev-id') || s.id || '',
        content: s.textContent || '',
        attrs: Array.from(s.attributes).reduce((acc: Record<string, string>, attr) => {
          acc[attr.name] = attr.value;
          return acc;
        }, {})
      }))
      .filter((s) => s.content.trim().length > 0 || s.id);

    const record = {
      title,
      mainHtml: mainPane.outerHTML,
      rightHtml: rightSidebar ? rightSidebar.outerHTML : null,
      sidebarHtml: sidebar ? sidebar.outerHTML : null,
      headLinks,
      headStyles,
      textSnippet: (mainPane.textContent || '').slice(0, 2500)
    };

    const maxLimit = getMaxPageCacheSize();
    if (maxLimit > 0) {
      if (pageCache.has(key)) {
        pageCache.delete(key);
      }
      pageCache.set(key, record);
      prunePageCache();
    } else {
      pageCache.clear();
    }
    return record;
  }

  function fetchPage(url: URL, { signal }: { signal?: AbortSignal } = {}): Promise<any> {
    const key = normPath(url.pathname);
    if (pageCache.has(key)) {
      const cached = pageCache.get(key);

      pageCache.delete(key);
      pageCache.set(key, cached);
      return Promise.resolve(cached);
    }
    if (inFlightRequests.has(key)) return inFlightRequests.get(key)!;

    const fetchOptions: RequestInit = {
      headers: { Accept: 'text/html' },
      credentials: 'same-origin'
    };
    if (signal) fetchOptions.signal = signal;

    const p = fetch(url.href, fetchOptions)
      .then((r) => {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.text();
      })
      .then((html) => parseAndCache(key, html))
      .finally(() => {
        inFlightRequests.delete(key);
      });

    inFlightRequests.set(key, p);
    return p;
  }

  function getPageNodes(record: any): {
    title: string;
    mainPane: Element | null;
    rightSidebar: Element | null;
    sidebar: Element | null;
  } {
    if (record.mainPane) {
      return {
        title: record.title,
        mainPane: record.mainPane.cloneNode(true),
        rightSidebar: record.rightSidebar ? record.rightSidebar.cloneNode(true) : null,
        sidebar: record.sidebar ? record.sidebar.cloneNode(true) : null,
      };
    }
    const parser = new DOMParser();
    const wrapHtml = `<div id="__astrolib_spa_wrap">${record.mainHtml || ''}${record.rightHtml || ''}${record.sidebarHtml || ''}</div>`;
    const doc = parser.parseFromString(wrapHtml, 'text/html');
    const wrap = doc.getElementById('__astrolib_spa_wrap');
    return {
      title: record.title,
      mainPane: wrap?.querySelector('.main-pane') || null,
      rightSidebar: wrap?.querySelector('.right-sidebar-container') || null,
      sidebar: wrap?.querySelector('nav.sidebar, .sidebar-pane, .sidebar') || null,
    };
  }

  const SIDEBAR_SCROLL_KEY = 'astrolib_sidebar_scroll';

  function getSidebarScroller(): HTMLElement | null {
    return document.getElementById('starlight__sidebar') || document.querySelector<HTMLElement>('.sidebar-pane');
  }

  function saveSidebarScroll(): void {
    const scroller = getSidebarScroller();
    if (scroller) {
      sessionStorage.setItem(SIDEBAR_SCROLL_KEY, String(scroller.scrollTop));
    }
  }

  function restoreSidebarScroll(): void {
    const scroller = getSidebarScroller();
    if (!scroller) return;

    const saved = sessionStorage.getItem(SIDEBAR_SCROLL_KEY);
    if (saved !== null && saved !== '') {
      const top = parseInt(saved, 10);
      if (!isNaN(top) && top >= 0) {
        scroller.scrollTop = top;
        return;
      }
    }

    const active = scroller.querySelector('a[aria-current="page"]');
    if (active) {
      active.scrollIntoView({ block: 'center', behavior: 'instant' });
    }
  }

  function bindSidebarScrollTracker(): void {
    const scroller = getSidebarScroller() as any;
    if (!scroller || scroller.__hasScrollTracker) return;
    scroller.__hasScrollTracker = true;

    let scrollTimer = 0;
    scroller.addEventListener('scroll', () => {
      clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(saveSidebarScroll, 50);
    }, { passive: true });

    scroller.addEventListener('click', (e: MouseEvent) => {
      const target = e.target;
      if (target instanceof Element && target.closest('a[href]')) {
        saveSidebarScroll();
      }
    }, { capture: true });
  }

  function updateSidebarActive(pathname: string): void {
    const sidebar = document.querySelector('nav.sidebar, .sidebar');
    if (!sidebar) return;
    let matched: Element | null = null;
    sidebar.querySelectorAll('a[aria-current="page"]').forEach((a) => {
      a.removeAttribute('aria-current');
      a.classList.remove('active');
    });
    sidebar.querySelectorAll('a[href]').forEach((a) => {
      let url: URL;
      try {
        url = new URL(a.getAttribute('href') || '', location.href);
      } catch {
        return;
      }
      if (normPath(url.pathname) === normPath(pathname)) {
        matched = a;
        let node: HTMLElement | null = a.parentElement;
        while (node && node !== sidebar) {
          if (node.tagName === 'DETAILS') (node as HTMLDetailsElement).open = true;
          node = node.parentElement;
        }
      }
    });
    if (matched) {
      (matched as Element).setAttribute('aria-current', 'page');
      (matched as Element).classList.add('active');
    }
  }

  function closeMobileMenu(): void {
    const btn = document.querySelector<HTMLButtonElement>('starlight-menu-button button');
    if (btn && document.body.hasAttribute('data-mobile-menu-expanded')) btn.click();
    document.body.removeAttribute('data-mobile-menu-expanded');
    document.getElementById('vp-sidebar-toggle-btn')?.setAttribute('aria-expanded', 'false');
  }

  document.addEventListener('click', (e) => {
    if (!document.body.hasAttribute('data-mobile-menu-expanded')) return;
    const target = e.target;
    if (!(target instanceof Element)) return;
    if (
      target.closest('#vp-sidebar-toggle-btn') ||
      target.closest('.vp-sidebar-toggle-btn') ||
      target.closest('starlight-menu-button') ||
      target.closest('.sidebar-pane') ||
      target.closest('.ft-panel') ||
      target.closest('.ft-backdrop') ||
      target.closest('starlight-feature-toggles') ||
      target.closest('#dsh-inspector-root') ||
      target.closest('.insp-root') ||
      target.closest('.insp-panel') ||
      target.closest('.insp-backdrop') ||
      target.closest('#dsh-chat-root') ||
      target.closest('.chat-drawer') ||
      target.closest('.chat-backdrop') ||
      target.closest('#dsh-feedback-root') ||
      target.closest('.feedback-modal') ||
      target.closest('.dsh-relation-graph-modal') ||
      target.closest('[role="dialog"]') ||
      target.closest('dialog') ||
      target.closest('[aria-modal="true"]')
    ) return;
    closeMobileMenu();
  });

  const warmedFontsCache = new Set<string>();

  async function warmPageFonts(text: string | null | undefined, timeoutMs = 80): Promise<void> {
    if (!document.fonts || !document.fonts.load) return;
    if (!text || text.length === 0) return;

    const sample = text.length > 2500 ? text.slice(0, 2500) : text;
    const hashKey = sample.slice(0, 100);
    if (warmedFontsCache.has(hashKey)) return;
    if (warmedFontsCache.size > 50) warmedFontsCache.clear();
    warmedFontsCache.add(hashKey);

    const fontCjk = document.documentElement.dataset.fontCjk || 'sans';
    const targetCjkFont = fontCjk === 'han-serif' ? '"Noto Serif SC Variable"' : '"Noto Sans SC Variable"';

    try {
      const promises = [
        document.fonts.load(`16px ${targetCjkFont}`, sample),
        document.fonts.load('16px "Plus Jakarta Sans Variable"', '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'),
      ];

      if (timeoutMs > 0) {
        await Promise.race([
          Promise.allSettled(promises),
          new Promise((resolve) => setTimeout(resolve, timeoutMs)),
        ]);
      } else {
        await Promise.allSettled(promises);
      }
    } catch {

    }
  }

  async function loadPage(url: URL, { restoreScroll = false }: { restoreScroll?: boolean } = {}): Promise<void> {
    const token = ++navToken;
    startProgressBar();

    try {
      const pageData = await fetchPage(url);
      if (token !== navToken) return;

      const { title, mainPane, rightSidebar, sidebar: newSidebar } = getPageNodes(pageData);
      const currentMain = document.querySelector('.main-pane');
      if (!currentMain) throw new Error('current main-pane not found');
      const flexWrap = currentMain.parentElement;
      const currentRight = document.querySelector('.right-sidebar-container');
      const currentSidebar = document.querySelector('nav.sidebar, .sidebar-pane, .sidebar');

      void warmPageFonts(mainPane ? mainPane.textContent : '', 0);

      document.title = title || document.title;

      try {
        document.dispatchEvent(new CustomEvent('astrolib:page-unload'));
      } catch (e) {
        console.warn('[SPA] page-unload error:', e);
      }

      const currentBookKey = currentPathname.match(/\/collections\/([^/]+)\/([^/]+)/)?.[0];
      const targetBookKey = normPath(url.pathname).match(/\/collections\/([^/]+)\/([^/]+)/)?.[0];
      const isSameBook = Boolean(currentBookKey && targetBookKey && currentBookKey === targetBookKey);

      if (newSidebar && currentSidebar && !isSameBook && newSidebar.innerHTML !== currentSidebar.innerHTML) {
        currentSidebar.replaceWith(newSidebar);
        bindSidebarScrollTracker();
        restoreSidebarScroll();
      }

      if (mainPane) {
        currentMain.replaceWith(mainPane);
      }
      if (rightSidebar) {
        if (currentRight) currentRight.replaceWith(rightSidebar);
        else flexWrap?.prepend(rightSidebar);
      } else if (currentRight) {
        currentRight.remove();
      }

      if (pageData.headLinks && pageData.headLinks.length > 0) {
        pageData.headLinks.forEach((href: string) => {
          if (!document.querySelector(`head link[href="${href}"]`)) {
            const l = document.createElement('link');
            l.rel = 'stylesheet';
            l.href = href;
            document.head.appendChild(l);
          }
        });
      }

      if (pageData.headStyles && pageData.headStyles.length > 0) {
        pageData.headStyles.forEach((item: any) => {
          if (item.id) {
            if (document.querySelector(`head style[data-vite-dev-id="${item.id}"], head style#${CSS.escape(item.id)}`)) {
              return;
            }
          } else if (item.content) {
            const exists = Array.from(document.querySelectorAll('head style')).some(
              (existing) => existing.textContent === item.content
            );
            if (exists) return;
          }
          const s = document.createElement('style');
          if (item.attrs) {
            Object.entries(item.attrs).forEach(([k, v]) => s.setAttribute(k, v as string));
          }
          s.textContent = item.content;
          document.head.appendChild(s);
        });
      }

      updateSidebarActive(url.pathname);
      closeMobileMenu();

      if (url.hash) {
        const targetId = decodeURIComponent(url.hash.slice(1));
        const el = document.getElementById(targetId) || document.querySelector(`[data-src-line="${targetId.replace(/^L/, '')}"]`);
        if (el) {
          el.scrollIntoView({ block: 'center' });
          el.classList.add('card-ref-flash');
          setTimeout(() => el.classList.remove('card-ref-flash'), 700);
        } else {
          window.scrollTo(0, 0);
        }
      } else {
        const y = restoreScroll && history.state && typeof history.state.scrollY === 'number'
          ? history.state.scrollY
          : 0;
        window.scrollTo(0, y);
      }

      document.body.classList.remove('vp-page-entering');

      void document.body.offsetWidth;
      document.body.classList.add('vp-page-entering');
      setTimeout(() => {
        document.body.classList.remove('vp-page-entering');
      }, 150);

      finishProgressBar();

      document.dispatchEvent(new CustomEvent('astro:page-load'));

      triggerIdlePrewarming();

    } catch (err) {
      finishProgressBar();
      console.error('[SPA Navigation Error]', err);
      window.location.href = url.href;
    }
  }

  window.__spaNavigate = function spaNavigate(targetUrl: string | URL, { replace = false }: { replace?: boolean } = {}): Promise<void> {
    const url = typeof targetUrl === 'string' ? new URL(targetUrl, location.href) : targetUrl;
    const targetPath = normPath(url.pathname);

    if (targetPath === currentPathname) {
      if (url.hash) {
        const targetId = decodeURIComponent(url.hash.slice(1));
        const el = document.getElementById(targetId) || document.querySelector(`[data-src-line="${targetId.replace(/^L/, '')}"]`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('card-ref-flash');
          setTimeout(() => el.classList.remove('card-ref-flash'), 700);
        }
      }
      if (replace) {
        history.replaceState({ ...(history.state || {}), scrollY: window.scrollY }, '', url.href);
      } else {
        history.pushState({ scrollY: window.scrollY }, '', url.href);
      }
      return Promise.resolve();
    }

    updateSidebarActive(url.pathname);
    if (replace) {
      history.replaceState({ ...(history.state || {}), scrollY: window.scrollY }, '', url.href);
    } else {
      history.replaceState({ ...(history.state || {}), scrollY: window.scrollY }, '');
      history.pushState({ scrollY: 0 }, '', url.href);
    }
    currentPathname = targetPath;
    return loadPage(url);
  };

  let prewarmQueue: URL[] = [];
  let isPrewarmingActive = false;

  function triggerIdlePrewarming(): void {
    const isDev = location.hostname === 'localhost' || location.hostname === '127.0.0.1' || location.hostname.endsWith('.localhost');

    let prewarmPages = isDev ? 0 : 1;
    try {
      const saved = localStorage.getItem('astrolib_prewarm_pages');
      if (saved !== null && saved !== undefined && saved !== '') {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed)) prewarmPages = parsed;
      }
    } catch {}

    if (prewarmPages === 0 || localStorage.getItem('astrolib_lite_mode') === 'true') {
      prewarmQueue = [];
      return;
    }

    const sidebar = document.querySelector('nav.sidebar, .sidebar');
    if (!sidebar) return;

    const rawLinks = Array.from(sidebar.querySelectorAll<HTMLAnchorElement>('a[href]'))
      .filter((a) => isNavLink(a))
      .map((a) => {
        try {
          return new URL(a.getAttribute('href') || '', location.href);
        } catch {
          return null;
        }
      })
      .filter((u): u is URL => Boolean(u));

    const currentPath = normPath(location.pathname);
    let targetLinks: URL[] = [];

    if (prewarmPages === -1) {

      targetLinks = rawLinks.filter((u) => normPath(u.pathname) !== currentPath);
    } else {

      const curIdx = rawLinks.findIndex((u) => normPath(u.pathname) === currentPath);
      if (curIdx !== -1) {
        const start = Math.max(0, curIdx - prewarmPages);
        const end = Math.min(rawLinks.length, curIdx + prewarmPages + 1);
        targetLinks = rawLinks.slice(start, end).filter((u) => normPath(u.pathname) !== currentPath);
      } else {

        const paginationLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>('.pagination-links a[href]'))
          .map((a) => {
            try { return new URL(a.getAttribute('href') || '', location.href); } catch { return null; }
          })
          .filter((u): u is URL => Boolean(u && normPath(u.pathname) !== currentPath));
        targetLinks = paginationLinks.length > 0 ? paginationLinks : rawLinks.slice(0, prewarmPages * 2);
      }
    }

    prewarmQueue = targetLinks.filter((u) => !pageCache.has(normPath(u.pathname)) && !inFlightRequests.has(normPath(u.pathname)));
    if (prewarmQueue.length === 0) return;

    if (!isPrewarmingActive) {
      isPrewarmingActive = true;
      scheduleNextPrewarm();
    }
  }

  function scheduleNextPrewarm(): void {
    if (prewarmQueue.length === 0) {
      isPrewarmingActive = false;
      return;
    }

    const idleCallback = (window as any).requestIdleCallback || ((cb: Function) => setTimeout(cb, 120));
    idleCallback((deadline: any) => {
      while (prewarmQueue.length > 0 && (deadline.timeRemaining ? deadline.timeRemaining() > 18 : true)) {
        const targetUrl = prewarmQueue.shift();
        const maxCache = getMaxPageCacheSize();

        if (maxCache !== Infinity && maxCache > 0 && pageCache.size >= maxCache) {
          prewarmQueue = [];
          break;
        }
        if (targetUrl && !pageCache.has(normPath(targetUrl.pathname))) {
          fetchPage(targetUrl).then((record) => {
            if (record && record.textSnippet) {
              warmPageFonts(record.textSnippet, 0);
            }
          }).catch(() => {});
          break;
        }
      }

      if (prewarmQueue.length > 0) {
        setTimeout(scheduleNextPrewarm, 60);
      } else {
        isPrewarmingActive = false;
      }
    }, { timeout: 1500 });
  }

  document.addEventListener('click', (e) => {
    const target = e.target;
    if (!(target instanceof Element)) return;
    const a = target.closest('a[href]') as HTMLAnchorElement | null;
    if (!a || !isNavLink(a)) return;
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    const url = new URL(a.getAttribute('href') || '', location.href);
    const targetPath = normPath(url.pathname);

    if (targetPath === currentPathname) {

      e.preventDefault();
      if (url.hash) {
        const targetId = decodeURIComponent(url.hash.slice(1));
        const el = document.getElementById(targetId) || document.querySelector(`[data-src-line="${targetId.replace(/^L/, '')}"]`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        history.pushState({ scrollY: window.scrollY }, '', url.href);
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    e.preventDefault();
    window.__spaNavigate?.(url);
  });

  let hoverPrefetchTimer = 0;
  let hoverAbortController: AbortController | null = null;
  const HOVER_INTENT_DELAY = 65;

  let isSidebarHoverEnabled = true;
  function updateSidebarHoverPref(): void {
    try {
      isSidebarHoverEnabled = localStorage.getItem('astrolib_sidebar_hover_prefetch') !== 'false';
    } catch {
      isSidebarHoverEnabled = true;
    }
  }
  updateSidebarHoverPref();

  function isPrefetchable(a: HTMLAnchorElement): boolean {
    const inSidebar = !!a.closest('nav.sidebar, .sidebar, .sidebar-pane, #starlight__sidebar, .gdocs-book-outline, .gdocs-outline-li, .gdocs-book-li, .sidebar-category-item, [data-sidebar]');
    if (inSidebar && !isSidebarHoverEnabled) {
      return false;
    }
    return inSidebar || !!a.closest('.pagination-links, footer, .main-pane');
  }

  document.addEventListener('pointerover', (e) => {
    const target = e.target;
    if (!(target instanceof Element)) return;
    const a = target.closest('a[href]') as HTMLAnchorElement | null;
    if (!a || !isNavLink(a) || !isPrefetchable(a)) return;

    if (getMaxPageCacheSize() === 0) return;

    const url = new URL(a.getAttribute('href') || '', location.href);
    const key = normPath(url.pathname);
    if (key === normPath(location.pathname) || pageCache.has(key)) return;

    clearTimeout(hoverPrefetchTimer);

    hoverPrefetchTimer = window.setTimeout(() => {

      if (hoverAbortController) {
        hoverAbortController.abort();
      }
      hoverAbortController = new AbortController();
      const signal = hoverAbortController.signal;

      fetchPage(url, { signal }).catch(() => {});
    }, HOVER_INTENT_DELAY);
  }, { passive: true });

  document.addEventListener('pointerout', (e) => {
    const target = e.target;
    if (target instanceof Element && target.closest('a[href]')) {
      clearTimeout(hoverPrefetchTimer);
    }
  }, { passive: true });

  document.addEventListener('pointerdown', (e) => {
    clearTimeout(hoverPrefetchTimer);
    const target = e.target;
    if (!(target instanceof Element)) return;
    const a = target.closest('a[href]') as HTMLAnchorElement | null;
    if (!a || !isNavLink(a)) return;
    if (getMaxPageCacheSize() === 0) return;
    const url = new URL(a.getAttribute('href') || '', location.href);
    const key = normPath(url.pathname);
    if (key === normPath(location.pathname) || pageCache.has(key)) return;
    fetchPage(url).catch(() => {});
  }, { passive: true });

  window.addEventListener('popstate', () => {
    const targetPath = normPath(location.pathname);
    if (targetPath === currentPathname) {

      if (location.hash) {
        const targetId = decodeURIComponent(location.hash.slice(1));
        const el = document.getElementById(targetId) || document.querySelector(`[data-src-line="${targetId.replace(/^L/, '')}"]`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      } else {
        const y = history.state?.scrollY || 0;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
      return;
    }

    currentPathname = targetPath;
    loadPage(new URL(location.href), { restoreScroll: true }).catch(() => {
      location.reload();
    });
  });

  window.addEventListener('cache:config-change', () => {
    prunePageCache();
  });

  window.addEventListener('prewarm:config-change', () => {
    triggerIdlePrewarming();
  });

  window.addEventListener('sidebar-prefetch:config-change', (e: any) => {
    if (e && e.detail && typeof e.detail.enabled === 'boolean') {
      isSidebarHoverEnabled = e.detail.enabled;
    } else {
      updateSidebarHoverPref();
    }
    if (!isSidebarHoverEnabled) {
      clearTimeout(hoverPrefetchTimer);
      if (hoverAbortController) {
        hoverAbortController.abort();
      }
    }
  });

  window.addEventListener('astrolib:lite-mode-change', (e: any) => {
    const isLite = e && e.detail && typeof e.detail.enabled === 'boolean' ? e.detail.enabled : false;
    if (isLite) {

      for (const [, rec] of pageCache) {
        if (rec) {
          rec.mainHtml = null;
          rec.rightHtml = null;
          rec.sidebarHtml = null;
          rec.textSnippet = null;
        }
      }
      pageCache.clear();
      prewarmQueue = [];
      isPrewarmingActive = false;
      clearTimeout(hoverPrefetchTimer);
      if (hoverAbortController) {
        hoverAbortController.abort();
      }
    } else {
      triggerIdlePrewarming();
    }
  });

  bindSidebarScrollTracker();
  restoreSidebarScroll();

  document.addEventListener('astro:page-load', () => {
    bindSidebarScrollTracker();
    restoreSidebarScroll();
  });

  window.addEventListener('beforeunload', saveSidebarScroll);
  document.addEventListener('astro:before-swap', () => {
    try {
      document.dispatchEvent(new CustomEvent('astrolib:page-unload'));
    } catch {}
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') saveSidebarScroll();
  });

  if (document.readyState === 'complete') {
    triggerIdlePrewarming();
  } else {
    window.addEventListener('load', () => triggerIdlePrewarming(), { once: true });
  }
}

if (typeof window !== 'undefined') {
  initSpaNavigationEngine();
}
