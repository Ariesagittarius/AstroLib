import renderMathInElement from 'katex/dist/contrib/auto-render.mjs';
import { initFormulaActions } from '../../scripts/formula-actions';
import { formatMultipleChoiceQuestions } from './question-formatter';
import { setupVPLocalNav, setMobileTocOpen } from './local-nav';
import { tameOverflowingInlineMath } from './scroll-spy';
import { linkPageElements } from './cross-ref-client';
import { initJumpNavigator, recordJump } from './jump-navigator';

declare global {
  interface Window {
    __slScrollSpy?: () => void;
  }
}

const bookConfigCache = new Map<string, any>();
const globalIndexCache = new Map<string, Record<string, string>>();

export function getBookConfig(aside: HTMLElement | null): any {
  const key = aside?.getAttribute('data-book-key') || '';
  if (bookConfigCache.has(key)) return bookConfigCache.get(key);
  const cfg = JSON.parse(aside?.getAttribute('data-book-config') || '{}');
  bookConfigCache.set(key, cfg);
  return cfg;
}

export function getGlobalIndex(aside: HTMLElement | null): Record<string, string> {
  const key = aside?.getAttribute('data-book-key') || '';
  if (globalIndexCache.has(key)) return globalIndexCache.get(key);
  const raw = aside?.getAttribute('data-global-index') || '{}';
  const idx = raw === '{}' ? {} : JSON.parse(raw);
  globalIndexCache.set(key, idx);
  return idx;
}

export const katexConfig = {
  delimiters: [
    { left: '$$', right: '$$', display: true },
    { left: '$', right: '$', display: false },
  ],
  throwOnError: false,
};

export function parseTitleFromConfig(
  title: string,
  modules: Record<string, any>
): { type: string; number: string } {
  title = title.trim();
  const emojiRegex = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\uFE0F]/gu;
  title = title.replace(emojiRegex, '').trim();

  for (const [modKey, modMeta] of Object.entries(modules)) {
    const aliases = modMeta.aliases || [modKey];
    for (const alias of aliases) {
      if (title === alias) {
        return { type: modKey, number: '' };
      }
      const escapedAlias = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`^(${escapedAlias})(?:\\s+(.*)|\\s*(\\$?[\\d\\s\\.].*))?$`, 'i');
      const match = title.match(regex);

      if (match) {
        return { type: modKey, number: (match[2] || match[3] || '').trim() };
      }
    }
  }

  if (title.includes('导读')) {
    return { type: '导读', number: '' };
  }
  return { type: '模块', number: title };
}

export function buildBookTOC(
  sidebarContainer: HTMLElement | null,
  bookConfig: any,
  _globalBlockIndex: Record<string, string>
): void {
  setupVPLocalNav();

  if (!sidebarContainer) return;

  const modules = bookConfig.modules || {};
  const tocList = document.getElementById('custom-toc-list');
  if (!tocList) return;
  const mobileTocList = document.getElementById('vp-local-nav-toc-list');
  const marker = tocList.closest('.custom-page-sidebar')?.querySelector('.outline-marker') as HTMLElement | null;

  const trackSelectors =
    bookConfig.trackClasses && bookConfig.trackClasses.length > 0
      ? bookConfig.trackClasses.join(', ')
      : '.toc-chunk';

  const contentRoot =
    document.querySelector('main .sl-markdown-content') ||
    document.querySelector('.main-pane') ||
    document.querySelector('main') ||
    document.body;

  const trackList = trackSelectors.split(',').map((s: string) => s.trim()).filter(Boolean);
  const tocEntries: Array<{ kind: 'heading' | 'card'; el: HTMLElement; level?: number; _tocId?: string }> = [];

  for (const el of Array.from(contentRoot.querySelectorAll([...trackList, 'h2', 'h3', 'h4'].join(', '))) as HTMLElement[]) {
    if (el.matches('h2, h3, h4')) {
      if (!el.closest(trackSelectors) && !el.closest('.custom-page-sidebar')) {
        tocEntries.push({ kind: 'heading', el, level: Number(el.tagName.slice(1)) });
      }
    } else {
      tocEntries.push({ kind: 'card', el });
    }
  }

  const seenTocIds = new Set<string>();
  tocEntries.forEach((chunk, index) => {
    const el = chunk.el;
    let base = (el.id || '').trim().replace(/\s+/g, '-');
    if (!base) {
      base =
        chunk.kind === 'heading'
          ? `toc-heading-${index + 1}`
          : (
              el.getAttribute('data-title') ||
              el.querySelector('.card-header, .fallback-header, .guide-header')?.textContent ||
              ''
            )
              .trim()
              .replace(/\s+/g, '-') || `toc-card-${index + 1}`;
    }
    let finalId = base;
    let n = 2;
    while (seenTocIds.has(finalId)) finalId = `${base}-${n++}`;
    seenTocIds.add(finalId);
    el.id = finalId;
    chunk._tocId = finalId;
  });

  if (tocEntries.length === 0) {
    const emptyHtml = '<li class="toc-loading">本节暂无大纲</li>';
    tocList.innerHTML = emptyHtml;
    if (mobileTocList) mobileTocList.innerHTML = emptyHtml;
    const navBtn = document.querySelector('.vp-local-nav-btn');
    if (navBtn) {
      navBtn.classList.add('return-top');
      navBtn.setAttribute('aria-label', '返回顶部');
    }
    return;
  }

  tocList.innerHTML = '';
  if (mobileTocList) mobileTocList.innerHTML = '';

  const desktopLinks: HTMLAnchorElement[] = [];
  const mobileLinks: HTMLAnchorElement[] = [];

  function makeTocEntry(
    chunk: { kind: 'heading' | 'card'; el: HTMLElement; level?: number; _tocId?: string },
    _index: number,
    targetList: HTMLElement | DocumentFragment,
    links: HTMLAnchorElement[],
    isMobile: boolean
  ) {
    const el = chunk.el;
    const isHeading = chunk.kind === 'heading';
    const rawTitle = isHeading
      ? (el.textContent || '').trim()
      : el.getAttribute('data-title') ||
        el.querySelector('.card-header, .fallback-header, .guide-header')?.textContent ||
        '无标题';

    const id = chunk._tocId || el.id;
    if (!el.id) el.id = id;

    const { type, number } = parseTitleFromConfig(rawTitle, modules);
    const modMeta = modules[type] || {};
    const chipClass = modMeta.theme || 'chip-default';

    const displayLabel = (type === '定理' || type === '定义' || type === '性质' || type === '推论' || type === '引理' || type === '命题' || type === '公理')
      ? type
      : (modMeta.short || type);

    const li = document.createElement('li');
    li.className = 'toc-item';

    const a = document.createElement('a');
    a.href = `#${encodeURIComponent(id)}`;
    a.className = 'toc-link';

    if (isHeading) {
      a.classList.add('toc-heading', `toc-level-${chunk.level}`);
      const headingText = document.createElement('span');
      headingText.className = 'toc-heading-text';
      headingText.textContent = rawTitle;
      a.appendChild(headingText);
    } else {
      if (displayLabel && (!number || !number.startsWith(displayLabel))) {
        const chipSpan = document.createElement('span');
        chipSpan.className = 'toc-chip';
        chipSpan.textContent = displayLabel;
        a.appendChild(chipSpan);
      }

      const numSpan = document.createElement('span');
      numSpan.className = 'toc-number';
      numSpan.textContent = number || rawTitle;
      a.appendChild(numSpan);
    }

    a.addEventListener('click', (e) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      if (isMobile) setMobileTocOpen(false);
      const target = document.getElementById(id);
      if (!target) return;
      const rootStyle = getComputedStyle(document.documentElement);
      const navH = parseFloat(rootStyle.getPropertyValue('--sl-nav-height')) || 56;
      const tocH = parseFloat(rootStyle.getPropertyValue('--sl-mobile-toc-height')) || 0;
      const top = target.getBoundingClientRect().top + window.scrollY - navH - tocH - 16;

      if (Math.abs(top - window.scrollY) > 350) {
        recordJump({
          sourceText: rawTitle,
          targetUrl: `#${encodeURIComponent(id)}`,
        });
      }

      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
      history.replaceState({ ...(history.state || {}), scrollY: window.scrollY }, '', `#${encodeURIComponent(id)}`);
    });

    li.appendChild(a);
    targetList.appendChild(li);
    links.push(a);
  }

  const desktopFrag = document.createDocumentFragment();
  const mobileFrag = mobileTocList ? document.createDocumentFragment() : null;

  tocEntries.forEach((chunk, index) => {
    makeTocEntry(chunk, index, desktopFrag, desktopLinks, false);
    if (mobileFrag) makeTocEntry(chunk, index, mobileFrag, mobileLinks, true);
  });

  tocList.appendChild(desktopFrag);
  if (mobileTocList && mobileFrag) mobileTocList.appendChild(mobileFrag);

  let lastSpyIndex = -1;

  function handleSpyScroll() {
    let activeIndex = -1;
    const scrollPosition = window.scrollY + 120;

    tocEntries.forEach((chunk, index) => {
      const rect = chunk.el.getBoundingClientRect();
      const elementTop = rect.top + window.scrollY;
      if (scrollPosition >= elementTop) {
        activeIndex = index;
      }
    });

    desktopLinks.forEach((link, index) => link.classList.toggle('active', index === activeIndex));
    mobileLinks.forEach((link, index) => link.classList.toggle('active', index === activeIndex));

    if (marker) {
      const activeLink = activeIndex >= 0 ? desktopLinks[activeIndex] : null;
      if (activeLink) {
        marker.style.top = `${activeLink.offsetTop}px`;
        marker.style.opacity = '1';
      } else {
        marker.style.opacity = '0';
      }
    }

    if (document.body.classList.contains('mobile-toc-open') && activeIndex !== lastSpyIndex) {
      const activeMobile = mobileLinks[activeIndex];
      if (activeMobile) activeMobile.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
    lastSpyIndex = activeIndex;
  }

  if (window.__slScrollSpy) window.removeEventListener('scroll', window.__slScrollSpy);
  window.__slScrollSpy = handleSpyScroll;
  window.addEventListener('scroll', window.__slScrollSpy);
  handleSpyScroll();
}

export function renderSidebarMath(): void {
  const sidebar = document.querySelector('.custom-page-sidebar');
  if (sidebar && sidebar.textContent?.includes('$')) {
    renderMathInElement(sidebar as HTMLElement, katexConfig);
  }
  const mobileNav = document.querySelector('.vp-local-nav');
  if (mobileNav && mobileNav.textContent?.includes('$')) {
    renderMathInElement(mobileNav as HTMLElement, katexConfig);
  }
}

export function tameInlineMathWhenReady(): void {
  tameOverflowingInlineMath();
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      const schedule = window.requestIdleCallback || ((fn) => window.setTimeout(fn, 60));
      schedule(() => tameOverflowingInlineMath(), { timeout: 200 });
    });
  }
}

export function initPageSidebar(): void {
  formatMultipleChoiceQuestions();
  initJumpNavigator();

  const aside = document.querySelector('.custom-page-sidebar') as HTMLElement | null;
  const refsMode = aside?.getAttribute('data-refs-mode') || 'interactive';

  const raf = window.requestAnimationFrame || ((fn) => window.setTimeout(fn, 16));
  raf(() => {
    const bookConfig = getBookConfig(aside);
    const globalBlockIndex = getGlobalIndex(aside);
    buildBookTOC(aside, bookConfig, globalBlockIndex);
    renderSidebarMath();

    const idle = window.requestIdleCallback || ((fn) => window.setTimeout(fn, 150));
    idle(
      () => {
        linkPageElements(bookConfig, globalBlockIndex, refsMode, parseTitleFromConfig);
        initFormulaActions();
        tameInlineMathWhenReady();
      },
      { timeout: 400 }
    );
  });
}
