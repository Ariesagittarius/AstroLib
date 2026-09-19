export const PACK_CACHE_NAME = 'astrolib-pwa-v1-pack';

export const GITHUB_RELEASE_BASE = 'https://github.com/Ariesagittarius/AstroLib/releases/latest/download';
export const DEFAULT_PACK_NAME = 'astrolib-all.json';

export interface OfflinePackStatus {
  hasPack: boolean;
  count: number;
  approxSizeMb: string;
}

export type ProgressCallback = (percent: number, stageText: string) => void;

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
    const count = keys.length;

    if (count === 0) {
      return { hasPack: false, count: 0, approxSizeMb: '0' };
    }

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

export async function downloadAndInstallOfflinePack(
  packUrl?: string,
  onProgress?: ProgressCallback
): Promise<{ success: boolean; total: number; message?: string }> {
  if (typeof window === 'undefined' || !('caches' in window)) {
    throw new Error('当前浏览器不支持 Cache Storage，无法离线缓存');
  }

  const targetUrl = packUrl || `${GITHUB_RELEASE_BASE}/${DEFAULT_PACK_NAME}`;
  if (onProgress) onProgress(5, '正在连接 GitHub 镜像节点...');

  try {

    const response = await fetch(targetUrl);
    if (!response.ok) {
      throw new Error(`从 GitHub 获取离线包失败 (HTTP ${response.status})`);
    }

    const contentLength = Number(response.headers.get('content-length')) || 0;
    let receivedBytes = 0;
    let chunks: Uint8Array[] = [];

    if (response.body && contentLength > 0) {
      const reader = response.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          receivedBytes += value.length;
          const pct = Math.min(65, Math.round(5 + (receivedBytes / contentLength) * 60));
          const mb = (receivedBytes / (1024 * 1024)).toFixed(1);
          if (onProgress) onProgress(pct, `正在从 GitHub 下载离线数据 (${mb} MB)...`);
        }
      }
    } else {

      if (onProgress) onProgress(40, '正在从 GitHub 接收数据流...');
      const blob = await response.blob();
      const arrayBuf = await blob.arrayBuffer();
      chunks.push(new Uint8Array(arrayBuf));
    }

    if (onProgress) onProgress(70, '正在解析全站离线数据...');

    let combined = new Uint8Array(receivedBytes || chunks.reduce((acc, c) => acc + c.length, 0));
    let offset = 0;
    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }
    const decoder = new TextDecoder('utf-8');
    const jsonText = decoder.decode(combined);
    const packData = JSON.parse(jsonText);

    if (!packData || !packData.articles) {
      throw new Error('离线数据包格式不合法');
    }

    const articles: Record<string, string> = packData.articles;
    const entries = Object.entries(articles);
    const total = entries.length;

    if (onProgress) onProgress(75, `准备写入本地缓存 (共 ${total} 篇)...`);

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
      if (written % 10 === 0 || written === total) {
        const pct = Math.min(98, Math.round(75 + (written / total) * 23));
        if (onProgress) onProgress(pct, `正在持久化到本地: ${written}/${total} 篇...`);
      }
    }

    if (onProgress) onProgress(100, `全量离线包导入成功！共 ${total} 篇`);

    window.dispatchEvent(new CustomEvent('astrolib:pwa-pack-updated', { detail: { count: total } }));

    return { success: true, total };
  } catch (err: any) {
    console.error('[PWA-Pack] 离线包下载与安装失败:', err);
    throw err;
  }
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
