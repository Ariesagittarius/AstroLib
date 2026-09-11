import { initFormulaActions } from '../../scripts/formula-actions';
import { formatMultipleChoiceQuestions } from './question-formatter';
import { setupVPLocalNav, setMobileTocOpen } from './local-nav';
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

const inFlightIndexFetches = new Map<string, Promise<Record<string, any>>>();

export async function fetchGlobalIndex(aside: HTMLElement | null): Promise<Record<string, any>> {
  const key = aside?.getAttribute('data-book-key') || '';
  if (!key) return {};
  if (globalIndexCache.has(key)) return globalIndexCache.get(key)!;
  if (inFlightIndexFetches.has(key)) return inFlightIndexFetches.get(key)!;

  const raw = aside?.getAttribute('data-global-index');
  if (raw && raw !== '{}') {
    try {
      const idx = JSON.parse(raw);
      globalIndexCache.set(key, idx);
      return idx;
    } catch {}
  }

  const [col, book] = key.split('/');
  if (col && book) {
    const fetchPromise = (async () => {
      try {
        const res = await fetch(`/data/cross-ref/${col}-${book}.json`);
        if (res.ok) {
          const idx = await res.json();
          globalIndexCache.set(key, idx);
          return idx;
        }
      } catch (e) {
        console.warn('[cross-ref] Failed to fetch index:', e);
      } finally {
        inFlightIndexFetches.delete(key);
      }
      return {};
    })();

    inFlightIndexFetches.set(key, fetchPromise);
    return fetchPromise;
  }

  return {};
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

  interface TocSectionGroup {
    headingChunk: { kind: 'heading'; el: HTMLElement; level?: number; _tocId?: string } | null;
    cardChunks: Array<{ kind: 'card'; el: HTMLElement; level?: number; _tocId?: string }>;
  }

  const sectionGroups: TocSectionGroup[] = [];
  let currentGroup: TocSectionGroup = { headingChunk: null, cardChunks: [] };

  tocEntries.forEach((chunk) => {
    if (chunk.kind === 'heading') {
      if (currentGroup.headingChunk !== null || currentGroup.cardChunks.length > 0) {
        sectionGroups.push(currentGroup);
      }
      currentGroup = { headingChunk: chunk, cardChunks: [] };
    } else {
      currentGroup.cardChunks.push(chunk);
    }
  });

  if (currentGroup.headingChunk !== null || currentGroup.cardChunks.length > 0) {
    sectionGroups.push(currentGroup);
  }

  function createTocAnchor(
    id: string,
    rawTitle: string,
    contentNode: DocumentFragment | HTMLElement,
    isMobile: boolean,
    extraClass = ''
  ): HTMLAnchorElement {
    const a = document.createElement('a');
    a.href = `#${encodeURIComponent(id)}`;
    a.className = `toc-link ${extraClass}`.trim();
    a.appendChild(contentNode);

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

    return a;
  }

  function createCardContent(chunk: { el: HTMLElement; _tocId?: string }): { fragment: DocumentFragment; rawTitle: string } {
    const el = chunk.el;
    const titleTextEl = el.querySelector('.card-title-text, .block-title-text, .note-title-text') as HTMLElement | null;
    const headerEl = el.querySelector('.card-header, .fallback-header, .guide-header, .note-header') as HTMLElement | null;
    const rawTitle = el.getAttribute('data-title') ||
      (titleTextEl ? titleTextEl.textContent : headerEl?.textContent) ||
      '无标题';

    const { type, number } = parseTitleFromConfig(rawTitle, modules);
    const modMeta = modules[type] || {};
    const displayLabel = (type === '定理' || type === '定义' || type === '性质' || type === '推论' || type === '引理' || type === '命题' || type === '公理')
      ? type
      : (modMeta.short || type);

    const frag = document.createDocumentFragment();
    const hasChip = Boolean(displayLabel && displayLabel !== '模块');
    if (hasChip) {
      const chipSpan = document.createElement('span');
      chipSpan.className = 'toc-chip';
      chipSpan.textContent = displayLabel;
      frag.appendChild(chipSpan);
    }

    const numSpan = document.createElement('span');
    numSpan.className = 'toc-number';

    const sourceEl = titleTextEl || headerEl;
    if (sourceEl) {
      const clone = sourceEl.cloneNode(true) as HTMLElement;
      clone.querySelectorAll('.card-mdicon, .block-mdicon, .note-mdicon, svg').forEach((s) => s.remove());

      if (hasChip) {
        const walker = document.createTreeWalker(clone, NodeFilter.SHOW_TEXT);
        const firstText = walker.nextNode() as Text | null;
        if (firstText && firstText.nodeValue) {
          const val = firstText.nodeValue.trimStart();
          const labelRegex = new RegExp(`^${displayLabel}\\s*`, 'i');
          if (labelRegex.test(val)) {
            firstText.nodeValue = val.replace(labelRegex, '');
          }
        }
      }
      const trimmedHtml = clone.innerHTML.trim();
      if (trimmedHtml) {
        numSpan.innerHTML = trimmedHtml;
      } else {
        numSpan.textContent = number || rawTitle;
      }
    } else {
      numSpan.textContent = number || rawTitle;
    }
    frag.appendChild(numSpan);

    return { fragment: frag, rawTitle };
  }

  function renderGroup(
    group: TocSectionGroup,
    targetContainer: HTMLElement | DocumentFragment,
    links: HTMLAnchorElement[],
    isMobile: boolean
  ) {
    if (group.headingChunk) {
      const headingChunk = group.headingChunk;
      const hEl = headingChunk.el;
      const hId = headingChunk._tocId || hEl.id;
      const hRawTitle = (hEl.textContent || '').trim();

      const groupLi = document.createElement('li');
      groupLi.className = 'toc-group';

      groupLi.setAttribute('data-collapsed', 'false');

      const rowDiv = document.createElement('div');
      rowDiv.className = 'toc-heading-row';

      if (group.cardChunks.length > 0) {
        const collapseBtn = document.createElement('button');
        collapseBtn.type = 'button';
        collapseBtn.className = 'toc-collapse-btn';
        collapseBtn.setAttribute('aria-label', `折叠/展开「${hRawTitle}」板块`);
        collapseBtn.setAttribute('aria-expanded', 'true');
        collapseBtn.innerHTML = `
          <svg class="toc-caret-icon" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
            <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
          </svg>
        `;

        collapseBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          e.preventDefault();
          const isCollapsed = groupLi.getAttribute('data-collapsed') === 'true';
          const nextState = !isCollapsed;
          groupLi.setAttribute('data-collapsed', String(nextState));
          collapseBtn.setAttribute('aria-expanded', String(!nextState));
        });

        rowDiv.appendChild(collapseBtn);
      } else {
        const placeholder = document.createElement('span');
        placeholder.className = 'toc-collapse-placeholder';
        placeholder.setAttribute('aria-hidden', 'true');
        rowDiv.appendChild(placeholder);
      }

      const headingTextSpan = document.createElement('span');
      headingTextSpan.className = 'toc-heading-text';
      const hClone = hEl.cloneNode(true) as HTMLElement;
      hClone.querySelectorAll('.card-mdicon, .block-mdicon, .note-mdicon, svg, .heading-anchor, .anchor-icon').forEach((s) => s.remove());
      headingTextSpan.innerHTML = hClone.innerHTML.trim();

      const headingAnchor = createTocAnchor(
        hId,
        hRawTitle,
        headingTextSpan,
        isMobile,
        `toc-heading toc-level-${headingChunk.level}`
      );
      rowDiv.appendChild(headingAnchor);
      links.push(headingAnchor);
      groupLi.appendChild(rowDiv);

      if (group.cardChunks.length > 0) {
        const subUl = document.createElement('ul');
        subUl.className = 'toc-sublist';

        group.cardChunks.forEach((cChunk) => {
          const cId = cChunk._tocId || cChunk.el.id;
          const { fragment, rawTitle } = createCardContent(cChunk);
          const cLi = document.createElement('li');
          cLi.className = 'toc-item';
          const cardAnchor = createTocAnchor(cId, rawTitle, fragment, isMobile);
          cLi.appendChild(cardAnchor);
          subUl.appendChild(cLi);
          links.push(cardAnchor);
        });

        groupLi.appendChild(subUl);
      }

      targetContainer.appendChild(groupLi);
    } else if (group.cardChunks.length > 0) {

      const introUl = document.createElement('ul');
      introUl.className = 'toc-sublist toc-intro-sublist';

      group.cardChunks.forEach((cChunk) => {
        const cId = cChunk._tocId || cChunk.el.id;
        const { fragment, rawTitle } = createCardContent(cChunk);
        const cLi = document.createElement('li');
        cLi.className = 'toc-item';
        const cardAnchor = createTocAnchor(cId, rawTitle, fragment, isMobile);
        cLi.appendChild(cardAnchor);
        introUl.appendChild(cLi);
        links.push(cardAnchor);
      });

      targetContainer.appendChild(introUl);
    }
  }

  const desktopFrag = document.createDocumentFragment();
  const mobileFrag = mobileTocList ? document.createDocumentFragment() : null;

  sectionGroups.forEach((grp) => {
    renderGroup(grp, desktopFrag, desktopLinks, false);
    if (mobileFrag) renderGroup(grp, mobileFrag, mobileLinks, true);
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

    if (activeIndex >= 0) {
      const activeLink = desktopLinks[activeIndex];
      if (activeLink) {

        const parentGroup = activeLink.closest('.toc-group');
        if (parentGroup && parentGroup.getAttribute('data-collapsed') === 'true') {
          parentGroup.setAttribute('data-collapsed', 'false');
          const btn = parentGroup.querySelector('.toc-collapse-btn');
          if (btn) btn.setAttribute('aria-expanded', 'true');
        }

        if (marker) {
          marker.style.top = `${activeLink.offsetTop}px`;
          marker.style.opacity = '1';
        }
      }
    } else if (marker) {
      marker.style.opacity = '0';
    }

    if (document.body.classList.contains('mobile-toc-open') && activeIndex !== lastSpyIndex) {
      const activeMobile = mobileLinks[activeIndex];
      if (activeMobile) activeMobile.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
    lastSpyIndex = activeIndex;
  }

  let ticking = false;
  function handleSpyScrollThrottled() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(() => {
        handleSpyScroll();
        ticking = false;
      });
    }
  }

  if (window.__slScrollSpy) window.removeEventListener('scroll', window.__slScrollSpy);
  window.__slScrollSpy = handleSpyScrollThrottled;
  window.addEventListener('scroll', window.__slScrollSpy, { passive: true });
  handleSpyScroll();
}

export function renderSidebarMath(): void {

}

export function initPageSidebar(): void {
  formatMultipleChoiceQuestions();
  initJumpNavigator();

  const aside = document.querySelector('.custom-page-sidebar') as HTMLElement | null;
  const refsMode = aside?.getAttribute('data-refs-mode') || 'interactive';

  const raf = window.requestAnimationFrame || ((fn) => window.setTimeout(fn, 16));
  raf(() => {
    const bookConfig = getBookConfig(aside);
    buildBookTOC(aside, bookConfig, {});
    renderSidebarMath();

    const idle = window.requestIdleCallback || ((fn) => window.setTimeout(fn, 150));
    idle(
      async () => {
        if (refsMode !== 'static') {
          const globalBlockIndex = await fetchGlobalIndex(aside);
          linkPageElements(bookConfig, globalBlockIndex, refsMode, parseTitleFromConfig);
        }
        initFormulaActions();
      },
      { timeout: 400 }
    );
  });
}
