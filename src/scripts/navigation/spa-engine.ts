/**
 * src/scripts/navigation/spa-engine.ts
 * SPA 极速导航引擎：不可变内存缓存、全书空闲预热、乐观 UI、Scoped 优雅内容微动效
 */

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

  // 不可变页面缓存：保存预解析清洗的母版 DOM 字符串，导航时按需取用，采用受控 LRU 淘汰策略
  const pageCache = new Map<string, any>(); // key -> { title: string, mainHtml: string, rightHtml: string, sidebarHtml: string, headLinks, headStyles, textSnippet }
  const inFlightRequests = new Map<string, Promise<any>>(); // key -> Promise<{ ... }>
  let navToken = 0;

  /**
   * 读取页面内存缓存上限（由用户独立配置，控制 LRU 淘汰池大小）
   * 3: 极简节能 (3页) | 5: 标准平衡 (5页，默认) | 10: 充裕内存 (10页) | 20: 超大缓存 (20页) | -1: 不限
   */
  function getMaxPageCacheSize(): number {
    try {
      if (localStorage.getItem('astrolib_lite_mode') === 'true') {
        return 0; // 低性能模式下坚决不缓存历史页面 DOM，彻底释放内存
      }
      const saved = localStorage.getItem('astrolib_max_page_cache');
      if (saved !== null && saved !== undefined && saved !== '') {
        const val = parseInt(saved, 10);
        if (val === -1) return Infinity; // 不限制缓存上限
        if (val === 0) return 0; // 完全不缓存
        if (!isNaN(val) && val > 0) return val;
      }
    } catch {}
    return 5;
  }

  /**
   * LRU 缓存裁剪与内存深度释放
   * 当超过最大配额时，丢弃最早的预加载页面，保留最近访问的页面，并主动断开 DOM/HTML 字符串引用协助 V8 GC 回收
   */
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

  // 顶栏极简微光进度条
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
    // 仅对超过 60ms 的网络慢请求展示进度条，本地秒开缓存零闪烁
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

  // 解析与清洗 HTML，构建不可变母版缓存项（严格维护 LRU 顺序与内存回收）
  function parseAndCache(key: string, htmlText: string): any {
    const doc = new DOMParser().parseFromString(htmlText, 'text/html');
    const mainPane = doc.querySelector('.main-pane');
    if (!mainPane) throw new Error('main-pane not found in response');

    stripScripts(mainPane);
    // 清除离屏 main-pane 中将被 Portal 到 body 的多余重复组件外壳，保持母版 DOM 纯净
    mainPane.querySelectorAll('#dsh-inspector-root, #dsh-editor-root, #dsh-feedback-root, #dsh-chat-root, #dsh-relation-graph-root').forEach((el) => el.remove());

    const rightSidebar = doc.querySelector('.right-sidebar-container');
    if (rightSidebar) stripScripts(rightSidebar);
    const sidebar = doc.querySelector('nav.sidebar, .sidebar-pane, .sidebar');
    if (sidebar) stripScripts(sidebar);
    const title = doc.title || '';

    // 预先将 H1 中的数学公式完成 KaTeX 转换，杜绝 DOM 上树后的闪烁
    if (typeof window.__renderCustomMath === 'function') {
      window.__renderCustomMath(mainPane);
    }

    // 离屏预处理：在缓存前对离屏 DOM 执行所有会引起 layout shift 的同步突变
    preprocessPage(mainPane as HTMLElement);

    // 提取 head 中的额外样式表 link[rel="stylesheet"] 与 style 标签 (涵盖 dev HMR 样式与 prod scoped styles)
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

    // 性能突破：缓存序列化后的 HTML 字符串与文本切片，杜绝脱体 DOM 节点在 Blink C++ 内存中常驻
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
      // 真 LRU 保鲜：在命中读取时重新移至 Map 队列末端，确保最近使用的页面不会被意外淘汰
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

  // 从不可变 HTML 字符串缓存中反序列化 DOM 节点供当前页面挂载（按需即时生成，杜绝脱体 DOM 泄漏）
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

    // 若未记录过滚动条位置（如首次直接访问该 URL），自动将当前章节滚动到可视区域中央
    const active = scroller.querySelector('a[aria-current="page"]');
    if (active) {
      active.scrollIntoView({ block: 'center', behavior: 'instant' });
    }
  }

  function bindSidebarScrollTracker(): void {
    const scroller = getSidebarScroller() as any;
    if (!scroller || scroller.__hasScrollTracker) return;
    scroller.__hasScrollTracker = true;

    // 实时记录左栏滚动偏好
    let scrollTimer = 0;
    scroller.addEventListener('scroll', () => {
      clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(saveSidebarScroll, 50);
    }, { passive: true });

    // 点击章节链接前立即精准记录
    scroller.addEventListener('click', (e: MouseEvent) => {
      const target = e.target;
      if (target instanceof Element && target.closest('a[href]')) {
        saveSidebarScroll();
      }
    }, { capture: true });
  }

  // 更新左侧栏当前页高亮，并展开所属分组
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

  // 移动端：点击侧边栏链接后收起菜单遮罩
  function closeMobileMenu(): void {
    const btn = document.querySelector<HTMLButtonElement>('starlight-menu-button button');
    if (btn && document.body.hasAttribute('data-mobile-menu-expanded')) btn.click();
    document.body.removeAttribute('data-mobile-menu-expanded');
    document.getElementById('vp-sidebar-toggle-btn')?.setAttribute('aria-expanded', 'false');
  }

  // 移动端左侧抽屉：点击抽屉外区域关闭
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

  // 字体内存预热缓存：已就绪字符集缓存，杜绝 FOUT 与字体替换重排跳变
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
      // 忽略字体加载异常
    }
  }

  // 核心页面切换执行器：Scoped 作用域受控微动效与 0ms 本地瞬切
  async function loadPage(url: URL, { restoreScroll = false }: { restoreScroll?: boolean } = {}): Promise<void> {
    const token = ++navToken;
    startProgressBar();

    try {
      const pageData = await fetchPage(url);
      if (token !== navToken) return; // 已被最新导航取代

      const { title, mainPane, rightSidebar, sidebar: newSidebar } = getPageNodes(pageData);
      const currentMain = document.querySelector('.main-pane');
      if (!currentMain) throw new Error('current main-pane not found');
      const flexWrap = currentMain.parentElement;
      const currentRight = document.querySelector('.right-sidebar-container');
      const currentSidebar = document.querySelector('nav.sidebar, .sidebar-pane, .sidebar');

      // 异步非阻塞预热字体：正文 DOM 立即 0ms 上屏，杜绝切章人为停顿
      void warmPageFonts(mainPane ? mainPane.textContent : '', 0);

      document.title = title || document.title;

      // 0. 在 DOM 置换前派发全站页面卸载生命周期，通知各控制器析构旧页面资源、断开观察器并解除脱体引用
      try {
        document.dispatchEvent(new CustomEvent('astrolib:page-unload'));
      } catch (e) {
        console.warn('[SPA] page-unload error:', e);
      }

      // 1. 跨图书切换时若侧边栏结构不同则同步替换侧边栏（同书导航保留侧边栏 DOM 避免滚动条弹回顶部）
      const currentBookKey = currentPathname.match(/\/collections\/([^/]+)\/([^/]+)/)?.[0];
      const targetBookKey = normPath(url.pathname).match(/\/collections\/([^/]+)\/([^/]+)/)?.[0];
      const isSameBook = Boolean(currentBookKey && targetBookKey && currentBookKey === targetBookKey);

      if (newSidebar && currentSidebar && !isSameBook && newSidebar.innerHTML !== currentSidebar.innerHTML) {
        currentSidebar.replaceWith(newSidebar);
        bindSidebarScrollTracker();
        restoreSidebarScroll();
      }

      // 2. 正文与右侧大纲置换
      if (mainPane) {
        currentMain.replaceWith(mainPane);
      }
      if (rightSidebar) {
        if (currentRight) currentRight.replaceWith(rightSidebar);
        else flexWrap?.prepend(rightSidebar);
      } else if (currentRight) {
        currentRight.remove();
      }

      // 同步 head 中的新增样式表与内联 style (保障含有专属组件的页面通过 SPA 瞬切时样式完整)
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

      // 3. 滚动位置恢复与目标定位
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

      // 4. 触发平滑作用域入场微动效（Scoped Micro-Transition，零层级遮挡）
      document.body.classList.remove('vp-page-entering');
      // 强制重绘以重置动画
      void document.body.offsetWidth;
      document.body.classList.add('vp-page-entering');
      setTimeout(() => {
        document.body.classList.remove('vp-page-entering');
      }, 150);

      finishProgressBar();

      // 5. 立即触发既有初始化管线（大纲重建、公式交互、图文联动等，直接在真实 live DOM 上初始化，零闪烁）
      document.dispatchEvent(new CustomEvent('astro:page-load'));

      // 6. 触发全书空闲智能预热
      triggerIdlePrewarming();

    } catch (err) {
      finishProgressBar();
      console.error('[SPA Navigation Error]', err);
      window.location.href = url.href;
    }
  }

  // 全局统一编程式 SPA 导航 API
  window.__spaNavigate = function spaNavigate(targetUrl: string | URL, { replace = false }: { replace?: boolean } = {}): Promise<void> {
    const url = typeof targetUrl === 'string' ? new URL(targetUrl, location.href) : targetUrl;
    const targetPath = normPath(url.pathname);

    // 同页跳转：直接滚动 + 同步地址栏，绝不触发全量换页与重绘
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

    // 跨页跳转：执行极速 SPA 导航
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

  // 智能预热引擎（Configurable Pre-warming Queue）
  let prewarmQueue: URL[] = [];
  let isPrewarmingActive = false;

  function triggerIdlePrewarming(): void {
    const isDev = location.hostname === 'localhost' || location.hostname === '127.0.0.1' || location.hostname.endsWith('.localhost');
    // 1. 读取用户后台预加载范围偏好设置（1: 前后1页 [默认] | 2: 前后2页 | 3: 前后3页 | -1: 全书拉取 | 0: 关闭）
    // 在本地 Dev 模式下默认不自动全量扫全书，避免每次刷新触发 Vite 全量 SSR 编译
    let prewarmPages = isDev ? 0 : 1;
    try {
      const saved = localStorage.getItem('astrolib_prewarm_pages');
      if (saved !== null && saved !== undefined && saved !== '') {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed)) prewarmPages = parsed;
      }
    } catch {}

    // 若用户设置为 0 或处于低性能模式，则完全关闭后台空闲预热
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
      // -1: 全书全量拉取
      targetLinks = rawLinks.filter((u) => normPath(u.pathname) !== currentPath);
    } else {
      // > 0: 按前后指定页数切片（滑动窗口）
      const curIdx = rawLinks.findIndex((u) => normPath(u.pathname) === currentPath);
      if (curIdx !== -1) {
        const start = Math.max(0, curIdx - prewarmPages);
        const end = Math.min(rawLinks.length, curIdx + prewarmPages + 1);
        targetLinks = rawLinks.slice(start, end).filter((u) => normPath(u.pathname) !== currentPath);
      } else {
        // 若不在侧边栏中（如首页），尝试使用 pagination-links 或取前 N 个
        const paginationLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>('.pagination-links a[href]'))
          .map((a) => {
            try { return new URL(a.getAttribute('href') || '', location.href); } catch { return null; }
          })
          .filter((u): u is URL => Boolean(u && normPath(u.pathname) !== currentPath));
        targetLinks = paginationLinks.length > 0 ? paginationLinks : rawLinks.slice(0, prewarmPages * 2);
      }
    }

    // 提取尚未缓存且未在请求中的链接
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
        // 若设置了有限页面缓存上限且当前常驻缓存已达上限，中止后续拉取避免无谓的先拉后丢
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
          break; // 每次执行拉取 1 个，平滑让出主线程与网络带宽
        }
      }

      if (prewarmQueue.length > 0) {
        setTimeout(scheduleNextPrewarm, 60);
      } else {
        isPrewarmingActive = false;
      }
    }, { timeout: 1500 });
  }

  // 拦截全站内部导航链接
  document.addEventListener('click', (e) => {
    const target = e.target;
    if (!(target instanceof Element)) return;
    const a = target.closest('a[href]') as HTMLAnchorElement | null;
    if (!a || !isNavLink(a)) return;
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    const url = new URL(a.getAttribute('href') || '', location.href);
    const targetPath = normPath(url.pathname);

    if (targetPath === currentPathname) {
      // 同页锚点或返回顶部
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

  // 悬停/触碰即时预取：Hover-Intent 防抖与在途请求取消
  let hoverPrefetchTimer = 0;
  let hoverAbortController: AbortController | null = null;
  const HOVER_INTENT_DELAY = 65; // 65ms 意图识别：快速划过目录不发起请求，停留超 65ms 确认意图后才预加载

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

    // 若用户设置关闭预加载 (0)，完全不执行任何预取
    if (getMaxPageCacheSize() === 0) return;

    const url = new URL(a.getAttribute('href') || '', location.href);
    const key = normPath(url.pathname);
    if (key === normPath(location.pathname) || pageCache.has(key)) return;

    // 清除上一个悬停等待定时器
    clearTimeout(hoverPrefetchTimer);

    // 启动 65ms 意图防抖：快速滑过不发起网络与 DOM 解析
    hoverPrefetchTimer = window.setTimeout(() => {
      // 中止前一个悬停在途请求，避免无效并发堆叠
      if (hoverAbortController) {
        hoverAbortController.abort();
      }
      hoverAbortController = new AbortController();
      const signal = hoverAbortController.signal;

      fetchPage(url, { signal }).catch(() => {});
    }, HOVER_INTENT_DELAY);
  }, { passive: true });

  // 指针移出链接：若停留时间不足 65ms，立刻撤销预加载计时器
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

  // 浏览器前进/后退处理：精确区分同页 hash 变化与跨页换页
  window.addEventListener('popstate', () => {
    const targetPath = normPath(location.pathname);
    if (targetPath === currentPathname) {
      // 同页历史回退（如锚点定位）：平滑滚动定位，不重新加载页面
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

  // 监听用户在偏好设置中实时调整页面缓存上限
  window.addEventListener('cache:config-change', () => {
    prunePageCache();
  });

  // 监听用户在偏好设置中实时调整后台空闲预加载范围
  window.addEventListener('prewarm:config-change', () => {
    triggerIdlePrewarming();
  });

  // 监听用户在偏好设置中实时调整左侧栏悬停预加载开关
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

  // 监听全站【低性能模式】切换事件并深度释放缓存
  window.addEventListener('astrolib:lite-mode-change', (e: any) => {
    const isLite = e && e.detail && typeof e.detail.enabled === 'boolean' ? e.detail.enabled : false;
    if (isLite) {
      // 立即彻底清空并断开页面内存缓存中的全部母版字符串引用
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

  // 侧边栏滚动位置持久化：初始化绑定与视口恢复
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

  // 初始页面就绪后，排队启动全书空闲智能预热
  if (document.readyState === 'complete') {
    triggerIdlePrewarming();
  } else {
    window.addEventListener('load', () => triggerIdlePrewarming(), { once: true });
  }
}

if (typeof window !== 'undefined') {
  initSpaNavigationEngine();
}
