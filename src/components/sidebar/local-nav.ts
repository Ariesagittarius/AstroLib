declare global {
  interface Window {
    __vpLocalNavClickHandler?: ((e: MouseEvent) => void) | null;
    __mobileTocKeyHandler?: ((e: KeyboardEvent) => void) | null;
  }
}

export function setMobileTocOpen(open: boolean): void {
  document.body.classList.toggle('mobile-toc-open', open);
  const nav = document.querySelector('.vp-local-nav');
  if (!nav) return;
  const btn = nav.querySelector('.vp-local-nav-btn');
  const items = nav.querySelector('.vp-local-nav-items');
  if (btn) btn.setAttribute('aria-expanded', String(open));
  if (items) items.setAttribute('aria-hidden', String(!open));
  if (open) {
    const activeLink = items && items.querySelector('.toc-link.active');
    if (activeLink) activeLink.scrollIntoView({ block: 'nearest' });
  }
}

export function setupVPLocalNav(): void {
  const header = document.querySelector('.header');
  const rightGroup = header?.querySelector('.right-group');

  const freshNav = document.querySelector('.vp-local-nav:not(.vp-local-nav-teleported)') as HTMLElement | null;
  if (freshNav) {
    document.querySelectorAll('.vp-local-nav.vp-local-nav-teleported').forEach((n) => n.remove());
  }

  let nav = document.querySelector('.vp-local-nav') as HTMLElement | null;
  if (!nav) return;

  if (!nav.classList.contains('vp-local-nav-teleported')) {
    nav.classList.add('vp-local-nav-teleported');
    if (rightGroup) {
      if (rightGroup.firstElementChild !== nav) rightGroup.prepend(nav);
    } else if (header && header.lastElementChild !== nav) {
      header.append(nav);
    }
  }
  document.body.classList.add('vp-local-nav-active');

  const btn = nav.querySelector('.vp-local-nav-btn') as HTMLButtonElement | null;
  const items = nav.querySelector('.vp-local-nav-items') as HTMLElement | null;
  if (!btn || !items) return;

  if (btn.dataset.bound === 'true') return;
  btn.dataset.bound = 'true';

  const navHeight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--sl-nav-height')) || 64;
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const vh = window.innerHeight + Math.min(window.scrollY - navHeight, 0);
    nav?.style.setProperty('--vp-vh', vh + 'px');
    setMobileTocOpen(!document.body.classList.contains('mobile-toc-open'));
  });

  items.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (!target.closest('a') && !target.closest('button')) {
      e.stopPropagation();
    }
  });

  if (!window.__vpLocalNavClickHandler) {
    window.__vpLocalNavClickHandler = (e: MouseEvent) => {
      if (!document.body.classList.contains('mobile-toc-open')) return;
      const currentNav = document.querySelector('.vp-local-nav');
      if (!currentNav || !currentNav.contains(e.target as Node)) {
        setMobileTocOpen(false);
      }
    };
    document.addEventListener('click', window.__vpLocalNavClickHandler);
  }

  if (!window.__mobileTocKeyHandler) {
    window.__mobileTocKeyHandler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || !document.body.classList.contains('mobile-toc-open')) return;
      setMobileTocOpen(false);
      const navBtn = document.querySelector('.vp-local-nav-btn') as HTMLElement | null;
      navBtn?.focus();
    };
    document.addEventListener('keydown', window.__mobileTocKeyHandler);
  }

  nav.querySelector('.vp-local-nav-top-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    setMobileTocOpen(false);
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  });

  nav.querySelector('[data-close-mobile-toc]')?.addEventListener('click', (e) => {
    e.preventDefault();
    setMobileTocOpen(false);
  });

  nav.querySelectorAll('[data-exercise-trigger], [data-inspector-trigger], [data-open-relation-graph], [data-feedback-trigger], [data-chapter-export-trigger]').forEach((btn) => {
    btn.addEventListener('click', () => {
      setMobileTocOpen(false);
    });
  });
}
