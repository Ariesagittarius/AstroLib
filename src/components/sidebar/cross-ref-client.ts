import { recordJump } from './jump-navigator';

export function resolveIndexUrl(rel: string): string {
  if (!rel) return '';
  if (rel.startsWith('/')) return rel;
  const m = location.pathname.match(/^(\/collections\/[^/]+\/[^/]+\/)/);
  return (m ? m[1] : '') + rel;
}

let stylesInjected = false;
function injectPopoverStyles() {
  if (stylesInjected) return;
  stylesInjected = true;
  const style = document.createElement('style');
  style.textContent = `
.xref-disambiguation-popover {
  position: absolute;
  z-index: 2147483000;
  width: 310px;
  max-width: calc(100vw - 24px);
  background: color-mix(in srgb, var(--sl-color-bg) 92%, transparent);
  -webkit-backdrop-filter: saturate(180%) blur(16px);
  backdrop-filter: saturate(180%) blur(16px);
  color: var(--sl-color-gray-1);
  border: 1px solid var(--sl-color-hairline);
  border-radius: 10px;
  box-shadow: var(--sl-shadow-lg), 0 8px 30px rgba(0, 0, 0, 0.12);
  padding: 0.5rem;
  font-family: var(--vp-font-family-base, var(--sl-font), system-ui, -apple-system, sans-serif);
  animation: vp-popover-fade 0.16s cubic-bezier(0.16, 1, 0.3, 1);
  transform-origin: top left;
  box-sizing: border-box;
}

@keyframes vp-popover-fade {
  from { opacity: 0; transform: translateY(-4px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.xref-popover-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.35rem 0.5rem 0.45rem;
  margin-bottom: 0.35rem;
  border-bottom: 1px solid var(--sl-color-hairline);
}

.xref-popover-title-group {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.xref-popover-title {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--sl-color-white);
}

.xref-popover-badge {
  font-size: 0.6875rem;
  font-weight: 600;
  padding: 0.08rem 0.4rem;
  border-radius: 999px;
  background: var(--sl-color-accent-low);
  color: var(--sl-color-text-accent);
  border: 1px solid color-mix(in srgb, var(--sl-color-text-accent) 25%, transparent);
}

.xref-popover-close {
  width: 1.5rem;
  height: 1.5rem;
  border: none;
  background: transparent;
  color: var(--sl-color-gray-3);
  border-radius: 6px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.xref-popover-close:hover {
  background: var(--sl-color-gray-6);
  color: var(--sl-color-white);
}

.xref-popover-close-svg {
  width: 14px;
  height: 14px;
}

.xref-popover-list {
  max-height: 260px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  padding: 0.1rem;
  overscroll-behavior: contain;
}

.xref-popover-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.45rem 0.65rem;
  border-radius: 6px;
  text-decoration: none !important;
  color: var(--sl-color-gray-1);
  background: var(--sl-color-gray-6);
  border: 1px solid transparent;
  transition: background-color 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
  cursor: pointer;
}

.xref-popover-item:hover {
  background: var(--sl-color-accent-low);
  border-color: color-mix(in srgb, var(--sl-color-text-accent) 30%, transparent);
  color: var(--sl-color-text-accent);
}

.xref-popover-item-content {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
  flex: 1;
}

.xref-popover-chap {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.72rem;
  font-weight: 500;
  color: var(--sl-color-gray-2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.xref-popover-item:hover .xref-popover-chap {
  color: var(--sl-color-text-accent);
}

.xref-popover-book-svg {
  width: 11px;
  height: 11px;
  flex-shrink: 0;
  opacity: 0.8;
}

.xref-popover-target {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--sl-color-white);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.xref-popover-item:hover .xref-popover-target {
  color: var(--sl-color-text-accent);
}

.xref-popover-arrow-svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  color: var(--sl-color-gray-4);
  margin-left: 0.5rem;
  transition: transform 0.15s ease, color 0.15s ease;
}

.xref-popover-item:hover .xref-popover-arrow-svg {
  color: var(--sl-color-text-accent);
  transform: translateX(2px);
}
  `;
  document.head.appendChild(style);
}

let activePopover: HTMLElement | null = null;
export function closeDisambiguationPopover() {
  if (activePopover) {
    activePopover.remove();
    activePopover = null;
  }
}

function showDisambiguationPopover(
  badge: HTMLElement,
  candidates: Array<{ url: string; chapterTitle: string; rawTitle: string; cleanTitle: string }>
) {
  injectPopoverStyles();
  closeDisambiguationPopover();

  const popover = document.createElement('div');
  popover.className = 'xref-disambiguation-popover';

  const header = document.createElement('div');
  header.className = 'xref-popover-header';
  header.innerHTML = `
    <div class="xref-popover-title-group">
      <span class="xref-popover-title">选择跳转目标</span>
      <span class="xref-popover-badge">${candidates.length}处</span>
    </div>
    <button type="button" class="xref-popover-close" aria-label="关闭" title="关闭 (Esc)">
      <svg class="xref-popover-close-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </button>
  `;
  popover.appendChild(header);

  const list = document.createElement('div');
  list.className = 'xref-popover-list';

  candidates.forEach((cand) => {
    const item = document.createElement('a');
    item.className = 'xref-popover-item';
    const targetUrl = resolveIndexUrl(cand.url);
    item.href = targetUrl;
    item.innerHTML = `
      <div class="xref-popover-item-content">
        <div class="xref-popover-chap">
          <svg class="xref-popover-book-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
          <span>${cand.chapterTitle || '目标章节'}</span>
        </div>
        <div class="xref-popover-target">${cand.rawTitle || cand.cleanTitle}</div>
      </div>
      <svg class="xref-popover-arrow-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    `;
    item.addEventListener('click', (e) => {
      e.preventDefault();
      closeDisambiguationPopover();

      recordJump({
        badgeEl: badge,
        sourceText: badge.textContent?.trim(),
        targetUrl,
      });

      const currentPath = window.location.pathname.replace(/\/$/, '') || '/';
      const pathMatch = targetUrl.match(/^([^#]*)(#.*)$/);
      const targetPath = (pathMatch ? pathMatch[1].replace(/\/$/, '') : targetUrl.replace(/\/$/, '')) || '/';
      const targetHash = pathMatch ? pathMatch[2] : '';
      const targetId = targetHash ? decodeURIComponent(targetHash.replace('#', '')) : '';

      if (targetPath === '' || targetPath === currentPath) {
        if (targetId) {
          const card = document.getElementById(targetId);
          if (card) {
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            card.classList.add('card-ref-flash');
            setTimeout(() => card.classList.remove('card-ref-flash'), 700);
          }
          if (targetHash) {
            history.pushState({ scrollY: window.scrollY }, '', targetUrl);
          }
        }
      } else {
        const spaNav = (window as unknown as Record<string, unknown>).__spaNavigate as
          | ((u: string) => Promise<unknown>)
          | undefined;
        if (typeof spaNav === 'function') {
          spaNav(targetUrl);
        } else {
          window.location.href = targetUrl;
        }
      }
    });
    list.appendChild(item);
  });

  popover.appendChild(list);
  document.body.appendChild(popover);

  const rect = badge.getBoundingClientRect();
  const popoverWidth = 310;
  const popoverHeight = Math.min(320, 50 + candidates.length * 52);

  let left = rect.left + window.scrollX;
  let top = rect.bottom + window.scrollY + 6;

  if (rect.bottom + popoverHeight > window.innerHeight - 16 && rect.top > popoverHeight + 16) {
    top = Math.max(16, rect.top + window.scrollY - popoverHeight - 6);
  }

  if (left + popoverWidth > window.innerWidth - 16) {
    left = Math.max(12, window.innerWidth - popoverWidth - 16);
  }
  if (left < 12) left = 12;

  popover.style.left = `${left}px`;
  popover.style.top = `${top}px`;

  activePopover = popover;

  const closeBtn = header.querySelector('.xref-popover-close');
  closeBtn?.addEventListener('click', closeDisambiguationPopover);

  setTimeout(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (!popover.contains(e.target as Node) && e.target !== badge) {
        closeDisambiguationPopover();
        document.removeEventListener('click', handleOutsideClick);
      }
    };
    document.addEventListener('click', handleOutsideClick);
  }, 10);
}

function getCandidates(text: string, globalBlockIndex: Record<string, any>): any[] {
  if (!globalBlockIndex) return [];
  const clean = text.replace(/\s+/g, '');
  const res = globalBlockIndex[text] || globalBlockIndex[clean];
  if (Array.isArray(res)) return res;
  if (typeof res === 'string') return [{ url: res, chapterTitle: '', rawTitle: text, cleanTitle: text }];
  return [];
}

function getModuleSvgIcon(masterKey: string): string {
  switch (masterKey) {
    case '例题':
    case '例':
      return `<svg class="badge-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>`;
    case '定理':
    case '公理':
    case '命题':
    case '推论':
    case '引理':
    case '性质':
      return `<svg class="badge-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 22 22 22"/><circle cx="12" cy="14" r="2"/></svg>`;
    case '定义':
      return `<svg class="badge-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`;
    case '变式':
      return `<svg class="badge-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`;
    case '结论总结':
    case '结论':
    case '经验总结':
    case '经验':
      return `<svg class="badge-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>`;
    case '方法总结':
    case '方法':
      return `<svg class="badge-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`;
    case '知识点':
    case '考点':
      return `<svg class="badge-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-7 7c0 2.5 1.5 4.7 3.5 6h7c2-1.3 3.5-3.5 3.5-6a7 7 0 0 0-7-7z"/></svg>`;
    case '问题':
    case '习题':
    case '解析':
      return `<svg class="badge-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
    case '图':
    default:
      return `<svg class="badge-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`;
  }
}

const ARROW_SVG = `<svg class="badge-svg badge-arrow-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17l9.2-9.2M17 17V8H8"/></svg>`;

export function upgradeStaticBadges(root: ParentNode, globalBlockIndex: Record<string, any>): void {
  if (!root || !globalBlockIndex) return;
  const solDetails = Array.from(root.querySelectorAll('.solution-details'));
  solDetails.forEach((sol, idx) => {
    if (!sol.id) sol.id = `sol-ref-block-${idx + 1}`;
  });

  root.querySelectorAll('.block-ref-badge.static-badge').forEach((badge) => {
    const text = (badge.querySelector('.block-text')?.textContent || '').trim();
    if (!text) return;
    const candidates = getCandidates(text, globalBlockIndex);
    if (candidates.length === 1) {
      badge.classList.remove('static-badge');
      badge.classList.add('interactive-badge');
      badge.setAttribute('data-url', resolveIndexUrl(candidates[0].url));
      if (!badge.querySelector('.block-arrow')) {
        const arrow = document.createElement('span');
        arrow.className = 'block-arrow';
        arrow.innerHTML = ARROW_SVG;
        badge.appendChild(arrow);
      }
    } else if (candidates.length > 1) {
      badge.classList.remove('static-badge');
      badge.classList.add('interactive-badge', 'multi-candidate-badge');
      badge.setAttribute('data-candidates', JSON.stringify(candidates));
      if (!badge.querySelector('.block-arrow')) {
        const arrow = document.createElement('span');
        arrow.className = 'block-arrow';
        arrow.innerHTML = ARROW_SVG;
        badge.appendChild(arrow);
      }
    }
  });
}

export function linkPageElements(
  bookConfig: any,
  globalBlockIndex: Record<string, any>,
  refsMode: 'interactive' | 'static' | string,
  parseTitleFromConfig: (title: string, modules: any) => { type: string; number: string; coreNumber?: string }
): void {
  if (refsMode === 'static') return;

  const mainContent =
    document.querySelector('main') ||
    document.querySelector('.main-pane') ||
    document.querySelector('article') ||
    document.body;
  if (!mainContent) return;

  const modules = bookConfig.modules || {};

  if (modules['图']) {
    modules['图'].isImage = true;
    modules['图'].short = '图';
    modules['图'].theme = 'chip-default';
  }

  if (mainContent.querySelector('[data-xref-built]')) {
    upgradeStaticBadges(mainContent, globalBlockIndex);
    attachInteractiveListeners();
    return;
  }

  const localTargets: Record<string, string> = {};
  const trackSelectors = bookConfig.trackClasses ? bookConfig.trackClasses.join(', ') : '.toc-chunk';
  const localChunks = Array.from(document.querySelectorAll(trackSelectors));
  const chunks = localChunks;

  chunks.forEach((chunk) => {
    const rawTitle =
      chunk.getAttribute('data-title') || chunk.querySelector('.card-header, h1, h2, h3')?.textContent || '';
    if (rawTitle) {
      const { type, number, coreNumber } = parseTitleFromConfig(rawTitle, modules);
      if (number) {
        const cleanKey = `${type}${number}`.replace(/\s+/g, '');
        localTargets[cleanKey] = chunk.id;
        if (coreNumber) {
          const coreKey = `${type}${coreNumber}`.replace(/\s+/g, '');
          localTargets[coreKey] = chunk.id;
        }
      }
    }
  });

  const solutions = Array.from(document.querySelectorAll('.solution-details'));
  solutions.forEach((sol, idx) => {
    const summary = sol.querySelector('summary');
    const summaryText = summary ? summary.textContent?.trim() || '' : '';
    const { type, number, coreNumber } = parseTitleFromConfig(summaryText, modules);
    if (number) {
      const cleanKey = `${type}${number}`.replace(/\s+/g, '');
      let id = sol.id;
      if (!id) {
        id = `sol-ref-block-${idx + 1}`;
        sol.id = id;
      }
      localTargets[cleanKey] = id;
      if (coreNumber) {
        localTargets[`${type}${coreNumber}`.replace(/\s+/g, '')] = id;
      }
    }
  });

  const allAliases: string[] = [];
  Object.entries(modules).forEach(([key, meta]: [string, any]) => {
    if (key !== '图' && !meta.isImage && meta.aliases) {
      allAliases.push(...meta.aliases);
    }
  });

  const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const typePattern = allAliases.map(escapeRegExp).join('|');
  const globalRefRegex = new RegExp(`(${typePattern})\\s*(\\d+(?:\\.\\d+)*)`, 'g');

  const imageModules = Object.entries(modules).filter(([_, meta]: [string, any]) => meta.isImage);

  imageModules.forEach(([_, meta]: [string, any]) => {
    const targetQuery = meta.targetQuery || 'p, div, figcaption';
    const targetPattern = /^图\s*(\d+\s*[-－]\s*\d+)$/;

    const allParagraphs = Array.from(mainContent.querySelectorAll(targetQuery));

    allParagraphs.forEach((el) => {
      const text = el.textContent || '';
      const captionMatch = text.trim().match(targetPattern);

      if (captionMatch) {
        const figNum = captionMatch[1].replace(/\s+/g, '');
        const figId = `${meta.short}-${figNum}`;
        el.id = figId;
        el.classList.add('fig-target-caption');

        const prev = el.previousElementSibling;
        if (prev) {
          const img = prev.tagName === 'IMG' ? prev : prev.querySelector('img');
          if (img) {
            img.classList.add('fig-target-image');
            img.setAttribute('data-fig-ref', figId);
          }
        }
      }
    });
  });

  walkTextNodes(
    mainContent,
    (node) => {
      const text = node.textContent || '';
      let modified = false;

      if (globalRefRegex.test(text)) {
        const span = document.createElement('span');

        span.innerHTML = text.replace(globalRefRegex, (_match, matchedType, matchedNum) => {
          const cleanType = matchedType.trim();
          const cleanNum = matchedNum.trim();

          let masterKey = cleanType;
          for (const [modKey, modMeta] of Object.entries(modules) as [string, any][]) {
            if (modMeta.aliases && modMeta.aliases.includes(cleanType)) {
              masterKey = modKey;
              break;
            }
          }
          const iconSvg = getModuleSvgIcon(masterKey);
          const fullMatchedText = `${matchedType}${matchedNum}`;

          const lookupKey = `${masterKey}${cleanNum}`.replace(/\s+/g, '');
          const localId = localTargets[lookupKey];

          const keyNoSpace = `${cleanType}${cleanNum}`;
          const masterKeyNoSpace = `${masterKey}${cleanNum}`;

          const candidates = getCandidates(keyNoSpace, globalBlockIndex).concat(
            getCandidates(masterKeyNoSpace, globalBlockIndex)
          );
          const uniqueCandidates = Array.from(new Map(candidates.map((c) => [c.url, c])).values());

          if (localId) {
            return `
              <span class="block-ref-badge interactive-badge" data-target="${localId}" data-type="${masterKey}">
                <span class="block-icon">${iconSvg}</span>
                <span class="block-text">${fullMatchedText}</span>
                <span class="block-arrow">${ARROW_SVG}</span>
              </span>
            `.trim().replace(/\n\s*/g, '');
          } else if (uniqueCandidates.length === 1) {
            const targetUrl = resolveIndexUrl(uniqueCandidates[0].url);
            return `
              <span class="block-ref-badge interactive-badge" data-url="${targetUrl}" data-type="${masterKey}">
                <span class="block-icon">${iconSvg}</span>
                <span class="block-text">${fullMatchedText}</span>
                <span class="block-arrow">${ARROW_SVG}</span>
              </span>
            `.trim().replace(/\n\s*/g, '');
          } else if (uniqueCandidates.length > 1) {
            const safeJson = JSON.stringify(uniqueCandidates).replace(/"/g, '&quot;');
            return `
              <span class="block-ref-badge interactive-badge multi-candidate-badge" data-candidates="${safeJson}" data-type="${masterKey}">
                <span class="block-icon">${iconSvg}</span>
                <span class="block-text">${fullMatchedText}</span>
                <span class="block-arrow">${ARROW_SVG}</span>
              </span>
            `.trim().replace(/\n\s*/g, '');
          } else {
            return `
              <span class="block-ref-badge static-badge" data-type="${masterKey}">
                <span class="block-icon">${iconSvg}</span>
                <span class="block-text">${fullMatchedText}</span>
              </span>
            `.trim().replace(/\n\s*/g, '');
          }
        });

        if (span.innerHTML !== text) {
          node.parentNode?.replaceChild(span, node);
          modified = true;
        }
      }

      if (modified) return;

      imageModules.forEach(([_, meta]: [string, any]) => {
        const tPattern = meta.aliases.map(escapeRegExp).join('|');
        const refRegex = new RegExp(`(${tPattern})\\s*(\\d+\\s*[-－]\\s*\\d+)`, 'g');

        if (refRegex.test(text)) {
          const span = document.createElement('span');
          span.innerHTML = text.replace(refRegex, (_match, _matchedType, matchedNum) => {
            const figNum = matchedNum.replace(/\s+/g, '');
            const figId = `${meta.short}-${figNum}`;
            const localFig = document.getElementById(figId);
            const iconSvg = getModuleSvgIcon('图');

            if (localFig) {
              return `
                <span class="fig-ref-badge interactive-badge" data-target="${figId}">
                  <span class="fig-icon">${iconSvg}</span>
                  <span class="fig-text">图 ${matchedNum}</span>
                  <span class="fig-arrow">${ARROW_SVG}</span>
                </span>
              `.trim().replace(/\n\s*/g, '');
            } else {
              return `
                <span class="fig-ref-badge static-badge">
                  <span class="fig-icon">${iconSvg}</span>
                  <span class="fig-text">图 ${matchedNum}</span>
                </span>
              `.trim().replace(/\n\s*/g, '');
            }
          });
          node.parentNode?.replaceChild(span, node);
        }
      });
    },
    () => {
      attachInteractiveListeners();
    }
  );
}

export function attachInteractiveListeners(): void {

  document.querySelectorAll('.fig-ref-badge.interactive-badge').forEach((badge) => {
    if (badge.classList.contains('listeners-attached')) return;
    badge.classList.add('listeners-attached');

    const targetId = badge.getAttribute('data-target');
    if (!targetId) return;

    badge.addEventListener('mouseenter', () => {
      const caption = document.getElementById(targetId);
      const image = document.querySelector(`.fig-target-image[data-fig-ref="${targetId}"]`);
      if (caption) caption.classList.add('fig-highlight');
      if (image) image.classList.add('fig-highlight');
      badge.classList.add('badge-highlight');
    });

    badge.addEventListener('mouseleave', () => {
      const caption = document.getElementById(targetId);
      const image = document.querySelector(`.fig-target-image[data-fig-ref="${targetId}"]`);
      if (caption) caption.classList.remove('fig-highlight');
      if (image) image.classList.remove('fig-highlight');
      badge.classList.remove('badge-highlight');
    });

    badge.addEventListener('click', (e) => {
      e.preventDefault();
      const caption = document.getElementById(targetId);
      if (caption) {
        recordJump({
          badgeEl: badge as HTMLElement,
          sourceText: badge.textContent?.trim(),
        });
        caption.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const image = document.querySelector(`.fig-target-image[data-fig-ref="${targetId}"]`);
        if (caption) {
          caption.classList.add('fig-flash');
          setTimeout(() => caption.classList.remove('fig-flash'), 700);
        }
        if (image) {
          image.classList.add('fig-flash');
          setTimeout(() => image.classList.remove('fig-flash'), 700);
        }
      }
    });
  });

  document.querySelectorAll('.block-ref-badge.interactive-badge').forEach((badge) => {
    if (badge.classList.contains('listeners-attached')) return;
    badge.classList.add('listeners-attached');

    const candidatesAttr = badge.getAttribute('data-candidates');
    if (candidatesAttr) {
      badge.addEventListener('click', (e) => {
        e.preventDefault();
        try {
          const candidates = JSON.parse(candidatesAttr);
          if (Array.isArray(candidates) && candidates.length > 0) {
            showDisambiguationPopover(badge as HTMLElement, candidates);
          }
        } catch (err) {}
      });
      return;
    }

    const targetUrl = badge.getAttribute('data-url') || '';
    const fallbackId = badge.getAttribute('data-target') || '';

    const currentPath = window.location.pathname.replace(/\/$/, '');
    const pathMatch = targetUrl.match(/^([^#]*)(#.*)$/);
    const targetPath = pathMatch ? pathMatch[1].replace(/\/$/, '') : '';
    const targetHash = pathMatch ? pathMatch[2] : '';
    const targetId = targetHash ? decodeURIComponent(targetHash.replace('#', '')) : fallbackId;

    if (targetPath === '' || targetPath === currentPath) {
      badge.addEventListener('mouseenter', () => {
        const card = document.getElementById(targetId);
        if (card) card.classList.add('card-ref-highlight');
        badge.classList.add('badge-highlight');
      });

      badge.addEventListener('mouseleave', () => {
        const card = document.getElementById(targetId);
        if (card) card.classList.remove('card-ref-highlight');
        badge.classList.remove('badge-highlight');
      });
    }

    badge.addEventListener('click', (e) => {
      e.preventDefault();

      recordJump({
        badgeEl: badge as HTMLElement,
        sourceText: badge.textContent?.trim(),
        targetUrl: targetUrl || `#${targetId}`,
      });

      if (targetPath === '' || targetPath === currentPath) {
        const card = document.getElementById(targetId);
        if (card) {
          card.scrollIntoView({ behavior: 'smooth', block: 'center' });
          card.classList.add('card-ref-flash');
          setTimeout(() => card.classList.remove('card-ref-flash'), 700);
        }
        if (targetHash) {
          history.pushState({ scrollY: window.scrollY }, '', targetUrl);
        }
      } else {
        const spaNav = (window as unknown as Record<string, unknown>).__spaNavigate as
          | ((u: string) => Promise<unknown>)
          | undefined;
        if (typeof spaNav === 'function') {
          spaNav(targetUrl);
        } else {
          window.location.href = targetUrl;
        }
      }
    });
  });
}
