/**
 * AstroLib Progressive Web App - Service Worker
 * ============================================================================
 * 针对大学理工科教材与学术数字化阅读系统深度定制的轻量分层离线调度引擎：
 * 1. App Shell 预缓存：仅缓存核心骨架与离线兜底页，拒绝盲目全量预取
 * 2. 静态长效缓存 (CacheFirst)：思源字体切片 (woff2)、KaTeX 样式与静态图标
 * 3. 动态阅读缓存 (NetworkFirst)：读者读到哪一章，自动持久化哪一章，断网秒开
 * 4. LRU 容量守卫：限制动态章节缓存最大数量（60篇），杜绝磁盘无节制膨胀
 * ============================================================================
 */

const CACHE_VERSION = 'astrolib-pwa-v1';
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

// 仅预缓存极轻量的核心外壳 (< 500KB)，保障秒级完成激活
const PRECACHE_URLS = [
  '/',
  '/offline.html',
  '/manifest.webmanifest',
  '/favicon.png',
  '/apple-touch-icon.png',
  '/astrolib-logo.webp',
  '/favicon.svg'
];

// 动态缓存上限（保留最近访问的 60 个页面/数据条目）
const MAX_RUNTIME_ITEMS = 60;

/**
 * LRU 清理：防止动态缓存超出条目上限
 */
async function trimCache(cacheName, maxItems) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    if (keys.length > maxItems) {
      const deleteCount = keys.length - maxItems;
      for (let i = 0; i < deleteCount; i++) {
        await cache.delete(keys[i]);
      }
    }
  } catch (err) {
    // 忽略缓存修剪微小异常
  }
}

// 1. 安装阶段：下载并缓存 App Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// 2. 激活阶段：清理旧版本缓存，立即接管客户端
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key.startsWith('astrolib-') && !key.startsWith(CACHE_VERSION)) {
            return caches.delete(key);
          }
          return Promise.resolve();
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. 拦截请求：分流缓存调度
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // 仅拦截 HTTP(S) GET 请求
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // 绕过本地开发与动态代理端点（API/精修/图谱等）
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/__') ||
    url.hostname.includes('trycloudflare.com') ||
    url.hostname.includes('generativelanguage.googleapis.com') ||
    url.hostname.includes('api.deepseek.com')
  ) {
    return;
  }

  // 策略 A：静态长效资产 (Cache-First)
  // 包含：字体文件 (woff2/woff)、KaTeX 样式、_astro 构建哈希产物、图片与 SVG 图标
  const isStaticAsset = (
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.woff') ||
    url.pathname.endsWith('.ttf') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.webp') ||
    url.pathname.includes('/_astro/') ||
    url.pathname.includes('katex.min.css')
  );

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // 策略 B：页面导航与章节 HTML、题库数据 (Network-First with Cache Fallback)
  const isNavigation = request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html');
  const isDataJson = url.pathname.startsWith('/data/') || url.pathname.startsWith('/ai-index/');

  if (isNavigation || isDataJson) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, copy);
              trimCache(RUNTIME_CACHE, MAX_RUNTIME_ITEMS);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          // 断网或拉取失败：优先寻找本地已读过的缓存
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          // 若为 HTML 导航且无本地缓存，返回优雅离线提示页
          if (isNavigation) {
            const offlinePage = await caches.match('/offline.html');
            if (offlinePage) {
              return offlinePage;
            }
          }
          // 数据请求失败无回退
          return new Response(JSON.stringify({ error: 'offline', offline: true }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
    return;
  }

  // 其它普通请求：网络优先
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

// 4. 客户端与 Service Worker 实时通信通道
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
