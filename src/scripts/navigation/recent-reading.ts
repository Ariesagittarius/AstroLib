declare global {
  interface Window {
    __renderCustomMath?: (el?: any) => void;
  }
}

if (typeof window !== 'undefined' && !window.__renderCustomMath) {
  window.__renderCustomMath = function renderCustomMath() {};
}

export function updateRecentReading(): void {
  if (typeof window === 'undefined') return;

  const doUpdate = () => {
    try {
      const match = location.pathname.match(/\/collections\/([^/]+)\/([^/]+)/);
      if (match) {
        const titleEl = document.querySelector('h1');
        const chapterTitle = titleEl ? (titleEl.textContent || '').trim() : '';
        if (chapterTitle) {
          const item = {
            url: location.pathname,
            chapterTitle,
            collectionSlug: match[1],
            bookSlug: match[2],
            timestamp: Date.now(),
          };
          localStorage.setItem('astrolib_recent_reading', JSON.stringify(item));
        }
      }
    } catch {}
  };

  if ('requestIdleCallback' in window) {
    requestIdleCallback(doUpdate, { timeout: 1000 });
  } else {
    setTimeout(doUpdate, 150);
  }
}

if (typeof window !== 'undefined') {
  updateRecentReading();
  document.addEventListener('astro:page-load', () => {
    updateRecentReading();
  });
}
