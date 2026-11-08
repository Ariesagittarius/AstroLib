export const PACK_CACHE_NAME = 'astrolib-pwa-v1-pack';

export const PRIMARY_PACK_URL = '/offline-packs/astrolib-all.json.gz';
export const MANIFEST_URL = '/offline-packs/manifest.json';
export const LEGACY_GITHUB_RELEASE_BASE = 'https://github.com/Ariesagittarius/AstroLib/releases/latest/download';
export const DEFAULT_PACK_NAME = 'astrolib-all.json.gz';

export interface OfflinePackStatus {
  hasPack: boolean;
  count: number;
  approxSizeMb: string;
}

export type ProgressCallback = (percent: number, stageText: string) => void;

interface ManifestBook {
  id: string;
  title: string;
  colSlug: string;
  bookSlug: string;
  count: number;
  packFileName: string;
  rawPackFileName?: string;
  sizeMb: string;
}

interface OfflineManifest {
  version: string;
  generatedAt: string;
  books: ManifestBook[];
  allRoutes?: string[];
  totalArticles?: number;
  allPackFileName?: string;
  allSizeMb?: string;
}

export async function getOfflinePackStatus(): Promise<OfflinePackStatus> {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return { hasPack: false, count: 0, approxSizeMb: '0' };
  }

  try {
    const hasCache = await caches.has(PACK_CACHE_NAME);
    if (!hasCache) {
      return { hasPack: false, count: 0, approxSizeMb: '0' };
    }

    const cache = await caches.open(PACK_CACHE_NAME);
    const keys = await cache.keys();

    const totalKeys = keys.length;
    if (totalKeys === 0) {
      return { hasPack: false, count: 0, approxSizeMb: '0' };
    }

    const uniquePaths = new Set(keys.map(k => {
      const pathname = new URL(k.url).pathname;
      return pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
    }));
    const count = uniquePaths.size;

    const approxSizeMb = ((count * 350) / 1024).toFixed(1);
    return {
      hasPack: true,
      count,
      approxSizeMb,
    };
  } catch (err) {
    console.debug('[PWA-Pack] 查询缓存状态异常:', err);
    return { hasPack: false, count: 0, approxSizeMb: '0' };
  }
}

async function decodePackBytes(
  combined: Uint8Array,
  isGzip: boolean
): Promise<string> {
  if (isGzip) {
    if (typeof DecompressionStream !== 'undefined') {
      const ds = new DecompressionStream('gzip');
      const decompressedStream = new Response(combined).body!.pipeThrough(ds);
      return await new Response(decompressedStream).text();
    }
    throw new Error('当前浏览器内核暂不支持原生 DecompressionStream 解压');
  }

  const decoder = new TextDecoder('utf-8');
  return decoder.decode(combined);
}

async function fetchAndDecodeSinglePack(
  targetUrl: string,
  onProgress?: ProgressCallback,
  progressBase = 5,
  progressSpan = 60
): Promise<Record<string, string>> {
  const isGzip = targetUrl.endsWith('.gz');
  const response = await fetch(targetUrl);
  if (!response.ok) {
    throw new Error(`获取离线包失败 (${response.status}: ${response.statusText})`);
  }

  const contentLength = Number(response.headers.get('content-length')) || 0;
  let receivedBytes = 0;
  const chunks: Uint8Array[] = [];

  if (response.body) {
    const reader = response.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
        receivedBytes += value.length;
        if (onProgress) {
          const mb = (receivedBytes / (1024 * 1024)).toFixed(1);
          if (contentLength > 0) {
            const totalMb = (contentLength / (1024 * 1024)).toFixed(1);
            const pct = Math.min(progressBase + progressSpan, Math.round(progressBase + (receivedBytes / contentLength) * progressSpan));
            onProgress(pct, `正在下载离线数据 (${mb} MB / ${totalMb} MB)...`);
          } else {
            const pct = Math.min(progressBase + progressSpan, Math.round(progressBase + (receivedBytes / 45000000) * progressSpan));
            onProgress(pct, `正在下载离线数据 (${mb} MB)...`);
          }
        }
      }
    }
  } else {
    const blob = await response.blob();
    const arrayBuf = await blob.arrayBuffer();
    chunks.push(new Uint8Array(arrayBuf));
    receivedBytes = arrayBuf.byteLength;
  }

  if (onProgress) {
    onProgress(progressBase + progressSpan + 5, isGzip ? '正在极速解压全站离线数据...' : '正在解析离线数据...');
  }

  let combined = new Uint8Array(receivedBytes || chunks.reduce((acc, c) => acc + c.length, 0));
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.length;
  }

  const jsonText = await decodePackBytes(combined, isGzip);
  const packData = JSON.parse(jsonText);

  if (!packData || !packData.articles) {
    throw new Error('离线数据包格式不合法 (缺少 articles 字典)');
  }

  return packData.articles;
}

async function writeArticlesToCacheStorage(
  articles: Record<string, string>,
  onProgress?: ProgressCallback,
  startPct = 75,
  endPct = 98
): Promise<number> {
  const entries = Object.entries(articles);
  const total = entries.length;
  if (total === 0) return 0;

  if (onProgress) onProgress(startPct, `准备写入本地存储 (共 ${total} 篇)...`);

  const cache = await caches.open(PACK_CACHE_NAME);
  let written = 0;

  for (const [urlPath, htmlContent] of entries) {
    const resp = new Response(htmlContent, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Astrolib-Offline-Pack': 'true',
      },
    });

    await cache.put(urlPath, resp.clone());
    const cleanPath = urlPath.endsWith('/') ? urlPath.slice(0, -1) : urlPath + '/';
    await cache.put(cleanPath, resp);

    written++;
    if (written % 15 === 0 || written === total) {
      const pct = Math.min(endPct, Math.round(startPct + (written / total) * (endPct - startPct)));
      if (onProgress) onProgress(pct, `正在持久化到本地: ${written}/${total} 篇...`);
    }
  }

  return total;
}

async function fallbackDirectCrawl(
  routes: string[],
  onProgress?: ProgressCallback
): Promise<number> {
  if (routes.length === 0) {
    throw new Error('未获取到有效章节路由列表，无法执行离线缓存');
  }

  const total = routes.length;
  const cache = await caches.open(PACK_CACHE_NAME);
  let completed = 0;
  const concurrency = 6;

  if (onProgress) onProgress(10, `正在直录全站 ${total} 篇章节...`);

  async function worker(queue: string[]) {
    while (queue.length > 0) {
      const route = queue.shift();
      if (!route) break;

      try {
        const fullUrl = new URL(route, window.location.origin).href;
        const res = await fetch(fullUrl, { credentials: 'same-origin' });
        if (res.ok) {
          const html = await res.text();
          const cachedResp = new Response(html, {
            headers: {
              'Content-Type': 'text/html; charset=utf-8',
              'X-Astrolib-Offline-Pack': 'true',
            },
          });
          await cache.put(route, cachedResp.clone());
          const altRoute = route.endsWith('/') ? route.slice(0, -1) : route + '/';
          await cache.put(altRoute, cachedResp);
        }
      } catch (err) {
        console.warn(`[PWA-Pack] 直录抓取失败: ${route}`, err);
      }

      completed++;
      if (onProgress) {
        const pct = Math.min(98, Math.round(10 + (completed / total) * 88));
        onProgress(pct, `正在缓存全站章节: ${completed}/${total} 篇...`);
      }
    }
  }

  const queue = [...routes];
  const workers = Array.from({ length: Math.min(concurrency, routes.length) }, () => worker(queue));
  await Promise.all(workers);

  return completed;
}

export async function downloadAndInstallOfflinePack(
  packUrl?: string,
  onProgress?: ProgressCallback
): Promise<{ success: boolean; total: number; message?: string }> {
  if (typeof window === 'undefined' || !('caches' in window)) {
    throw new Error('当前浏览器不支持 Cache Storage，无法离线缓存');
  }

  if (packUrl) {
    if (onProgress) onProgress(5, '正在连接离线数据节点...');
    const articles = await fetchAndDecodeSinglePack(packUrl, onProgress, 5, 65);
    const total = await writeArticlesToCacheStorage(articles, onProgress, 75, 98);
    if (onProgress) onProgress(100, `离线包导入成功！共 ${total} 篇`);
    window.dispatchEvent(new CustomEvent('astrolib:pwa-pack-updated', { detail: { count: total } }));
    return { success: true, total };
  }

  try {
    if (onProgress) onProgress(5, '正在连接全站离线数据节点...');
    const articles = await fetchAndDecodeSinglePack(PRIMARY_PACK_URL, onProgress, 5, 65);
    const total = await writeArticlesToCacheStorage(articles, onProgress, 75, 98);
    if (onProgress) onProgress(100, `全量离线包导入成功！共 ${total} 篇`);
    window.dispatchEvent(new CustomEvent('astrolib:pwa-pack-updated', { detail: { count: total } }));
    return { success: true, total };
  } catch (tier1Error: any) {
    console.warn('[PWA-Pack] Tier 1 全量总包获取未成功，自动切换至 Tier 2 分卷模式:', tier1Error.message);
  }

  try {
    if (onProgress) onProgress(15, '正在查询离线数据分卷清单...');
    const manifestResp = await fetch(MANIFEST_URL);
    if (manifestResp.ok) {
      const manifest: OfflineManifest = await manifestResp.json();
      if (manifest.books && manifest.books.length > 0) {
        let allArticles: Record<string, string> = {};
        const totalBooks = manifest.books.length;

        for (let i = 0; i < totalBooks; i++) {
          const book = manifest.books[i];
          const bookUrl = `/offline-packs/${book.packFileName}`;
          const basePct = 20 + Math.round((i / totalBooks) * 55);
          const spanPct = Math.round(55 / totalBooks);

          if (onProgress) onProgress(basePct, `正在拉取《${book.title}》分卷 (${i + 1}/${totalBooks})...`);
          const bookArticles = await fetchAndDecodeSinglePack(bookUrl, onProgress, basePct, spanPct);
          Object.assign(allArticles, bookArticles);
        }

        const total = await writeArticlesToCacheStorage(allArticles, onProgress, 80, 98);
        if (onProgress) onProgress(100, `分卷离线包导入成功！共 ${total} 篇`);
        window.dispatchEvent(new CustomEvent('astrolib:pwa-pack-updated', { detail: { count: total } }));
        return { success: true, total };
      }

      if (manifest.allRoutes && manifest.allRoutes.length > 0) {
        const total = await fallbackDirectCrawl(manifest.allRoutes, onProgress);
        if (onProgress) onProgress(100, `全站页面直录离线完成！共 ${total} 篇`);
        window.dispatchEvent(new CustomEvent('astrolib:pwa-pack-updated', { detail: { count: total } }));
        return { success: true, total };
      }
    }
  } catch (tier2Error: any) {
    console.warn('[PWA-Pack] Tier 2 分卷拉取未成功，尝试 Tier 3 端侧直录兜底:', tier2Error.message);
  }

  try {
    if (onProgress) onProgress(20, '正在初始化端侧直录缓存...');
    const fallbackRoutes: string[] = [];
    document.querySelectorAll<HTMLAnchorElement>('a[href*="/collections/"]').forEach((a) => {
      const href = a.getAttribute('href');
      if (href && href.startsWith('/collections/')) {
        fallbackRoutes.push(href.split('#')[0].split('?')[0]);
      }
    });

    const uniqueRoutes = [...new Set(fallbackRoutes)];
    if (uniqueRoutes.length > 0) {
      const total = await fallbackDirectCrawl(uniqueRoutes, onProgress);
      if (onProgress) onProgress(100, `离线缓存直录就绪！共 ${total} 篇`);
      window.dispatchEvent(new CustomEvent('astrolib:pwa-pack-updated', { detail: { count: total } }));
      return { success: true, total };
    }
  } catch (tier3Error: any) {
    console.error('[PWA-Pack] Tier 3 端侧直录失败:', tier3Error);
  }

  throw new Error('未检测到可用的离线数据包，请检查网络连接后重试');
}

export async function clearOfflinePack(): Promise<boolean> {
  if (typeof window === 'undefined' || !('caches' in window)) return false;

  try {
    const success = await caches.delete(PACK_CACHE_NAME);
    window.dispatchEvent(new CustomEvent('astrolib:pwa-pack-updated', { detail: { count: 0 } }));
    return success;
  } catch (err) {
    console.error('[PWA-Pack] 清空离线缓存异常:', err);
    return false;
  }
}
