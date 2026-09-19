/**
 * 最近阅读记录维护模块
 * 监听页面加载与 SPA 路由切换，将当前正在阅读的书籍与章节标题持久化到 localStorage
 */

declare global {
  interface Window {
    __renderCustomMath?: (el?: any) => void;
  }
}

// 保持全局兼容性桩函数（构建期已完成转译，运行期无需操作）
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

// 初始化自执行：初次加载与 SPA 换页时触发更新
if (typeof window !== 'undefined') {
  updateRecentReading();
  document.addEventListener('astro:page-load', () => {
    updateRecentReading();
  });
}
