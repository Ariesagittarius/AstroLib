import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import zlib from 'node:zlib';
import {
  PACK_CACHE_NAME,
  PRIMARY_PACK_URL,
  MANIFEST_URL,
  getOfflinePackStatus,
  downloadAndInstallOfflinePack,
  clearOfflinePack,
} from '../../src/scripts/pwa-offline-manager.ts';

class MockCache {
  private store = new Map<string, Response>();

  async put(request: any, response: Response): Promise<void> {
    const key = typeof request === 'string' ? request : request.url || '';
    this.store.set(key, response.clone());
  }

  async match(request: any): Promise<Response | undefined> {
    const key = typeof request === 'string' ? request : request.url || '';
    const res = this.store.get(key);
    return res ? res.clone() : undefined;
  }

  async keys(): Promise<{ url: string }[]> {
    return Array.from(this.store.keys()).map((k) => ({ url: k.startsWith('http') ? k : `https://astrolib.cloud${k}` }));
  }

  async delete(request: any): Promise<boolean> {
    const key = typeof request === 'string' ? request : request.url || '';
    return this.store.delete(key);
  }
}

class MockCacheStorage {
  private caches = new Map<string, MockCache>();

  async has(name: string): Promise<boolean> {
    return this.caches.has(name);
  }

  async open(name: string): Promise<MockCache> {
    let c = this.caches.get(name);
    if (!c) {
      c = new MockCache();
      this.caches.set(name, c);
    }
    return c;
  }

  async delete(name: string): Promise<boolean> {
    return this.caches.delete(name);
  }

  async keys(): Promise<string[]> {
    return Array.from(this.caches.keys());
  }
}

describe('pwa-offline-manager (PWA 离线全量数据包管理引擎)', () => {
  let mockCaches: MockCacheStorage;
  let originalFetch: typeof fetch;

  beforeEach(() => {
    mockCaches = new MockCacheStorage();
    vi.stubGlobal('caches', mockCaches);
    vi.stubGlobal('window', {
      caches: mockCaches,
      dispatchEvent: vi.fn(),
      location: { origin: 'https://astrolib.cloud' },
    });
    originalFetch = global.fetch;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    global.fetch = originalFetch;
  });

  it('常量导出检查：主缓存桶名、主包路径与清单路径必须规范', () => {
    expect(PACK_CACHE_NAME).toBe('astrolib-pwa-v1-pack');
    expect(PRIMARY_PACK_URL).toBe('/offline-packs/astrolib-all.json.gz');
    expect(MANIFEST_URL).toBe('/offline-packs/manifest.json');
  });

  it('getOfflinePackStatus: 未安装或缓存为空时返回 hasPack = false', async () => {
    const status = await getOfflinePackStatus();
    expect(status.hasPack).toBe(false);
    expect(status.count).toBe(0);
    expect(status.approxSizeMb).toBe('0');
  });

  it('getOfflinePackStatus: 已灌入数据时能正确去重统计唯一篇数与估算占用空间', async () => {
    const cache = await mockCaches.open(PACK_CACHE_NAME);

    const dummyResp = new Response('<h1>Test</h1>', {
      headers: { 'Content-Type': 'text/html' }
    });
    await cache.put('/collections/math/test1/', dummyResp.clone());
    await cache.put('/collections/math/test1', dummyResp.clone());
    await cache.put('/collections/math/test2/', dummyResp.clone());
    await cache.put('/collections/math/test2', dummyResp.clone());

    const status = await getOfflinePackStatus();
    expect(status.hasPack).toBe(true);
    expect(status.count).toBe(2);
    expect(Number(status.approxSizeMb)).toBeGreaterThan(0);
  });

  it('downloadAndInstallOfflinePack: 支持通过 DecompressionStream 硬件加速解压并批量灌入 PACK_CACHE', async () => {
    const mockPackData = {
      version: '1.1.0',
      total: 3,
      articles: {
        '/collections/math/linear_algebra/01_绪论/': '<html><body>绪论内容</body></html>',
        '/collections/math/linear_algebra/02_矩阵/': '<html><body>矩阵内容</body></html>',
        '/collections/math/linear_algebra/03_向量/': '<html><body>向量内容</body></html>',
      }
    };

    const jsonStr = JSON.stringify(mockPackData);
    const gzBuffer = zlib.gzipSync(Buffer.from(jsonStr, 'utf8'));

    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url === '/offline-packs/astrolib-all.json.gz') {
        return new Response(gzBuffer, {
          status: 200,
          headers: {
            'Content-Type': 'application/gzip',
            'Content-Length': String(gzBuffer.length)
          }
        });
      }
      return new Response(null, { status: 404 });
    });

    const progressLogs: { pct: number; text: string }[] = [];
    const result = await downloadAndInstallOfflinePack(undefined, (pct, text) => {
      progressLogs.push({ pct, text });
    });

    expect(result.success).toBe(true);
    expect(result.total).toBe(3);

    const cache = await mockCaches.open(PACK_CACHE_NAME);
    const cachedChapter = await cache.match('/collections/math/linear_algebra/01_绪论/');
    expect(cachedChapter).toBeDefined();
    const htmlText = await cachedChapter!.text();
    expect(htmlText).toContain('绪论内容');

    const lastProgress = progressLogs[progressLogs.length - 1];
    expect(lastProgress.pct).toBe(100);
    expect(lastProgress.text).toContain('全量离线包导入成功');
  });

  it('downloadAndInstallOfflinePack: Tier 1 失败时能够自动降级至 Tier 2 分卷清单拉取', async () => {
    const book1Data = {
      version: '1.1.0',
      total: 1,
      articles: {
        '/collections/math/test/chapter1/': '<html>Chapter 1</html>'
      }
    };
    const book1Gz = zlib.gzipSync(Buffer.from(JSON.stringify(book1Data), 'utf8'));

    const mockManifest = {
      version: '1.1.0',
      books: [
        {
          id: 'b1',
          title: '测试教材',
          colSlug: 'math',
          bookSlug: 'test',
          count: 1,
          packFileName: 'math-test.json.gz',
          sizeMb: '0.1'
        }
      ]
    };

    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url === PRIMARY_PACK_URL) {
        return new Response('Not Found', { status: 404 });
      }
      if (url === MANIFEST_URL) {
        return new Response(JSON.stringify(mockManifest), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      if (url === '/offline-packs/math-test.json.gz') {
        return new Response(book1Gz, {
          status: 200,
          headers: { 'Content-Type': 'application/gzip' }
        });
      }
      return new Response(null, { status: 404 });
    });

    const result = await downloadAndInstallOfflinePack();
    expect(result.success).toBe(true);
    expect(result.total).toBe(1);

    const cache = await mockCaches.open(PACK_CACHE_NAME);
    const cached = await cache.match('/collections/math/test/chapter1/');
    expect(cached).toBeDefined();
    expect(await cached!.text()).toContain('Chapter 1');
  });

  it('clearOfflinePack: 能够一键清空本地已缓存离线数据并广播事件', async () => {
    const cache = await mockCaches.open(PACK_CACHE_NAME);
    await cache.put('/test', new Response('ok'));
    expect(await mockCaches.has(PACK_CACHE_NAME)).toBe(true);

    const success = await clearOfflinePack();
    expect(success).toBe(true);
    expect(await mockCaches.has(PACK_CACHE_NAME)).toBe(false);
  });
});
