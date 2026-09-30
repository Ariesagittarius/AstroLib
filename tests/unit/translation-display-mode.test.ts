import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { sideloadManager } from '../../src/components/sideload/sideload-manager';
import { TranslationStorage } from '../../src/services/translation/storage/translation-storage';
import { features } from '../../src/config/features.config';

class FakeElement {
  public tagName: string;
  public id: string = '';
  public className: string = '';
  public attributes: Record<string, string> = {};
  public dataset: Record<string, string> = {};
  public children: FakeElement[] = [];
  public parentElement: FakeElement | null = null;
  public textContent: string = '';
  public innerHTML: string = '';
  public style: any = {
    setProperty: (k: string, v: string) => {
      this.style[k] = v;
    },
    getPropertyValue: (k: string) => this.style[k] || '',
  };
  public addEventListener = vi.fn();
  public removeEventListener = vi.fn();
  public scrollIntoView = vi.fn();
  public focus = vi.fn();
  public select = vi.fn();

  public classList = {
    add: (cls: string) => {
      const set = new Set(this.className.split(' ').filter(Boolean));
      set.add(cls);
      this.className = Array.from(set).join(' ');
    },
    remove: (cls: string) => {
      const set = new Set(this.className.split(' ').filter(Boolean));
      set.delete(cls);
      this.className = Array.from(set).join(' ');
    },
    toggle: (cls: string, force?: boolean) => {
      const set = new Set(this.className.split(' ').filter(Boolean));
      const has = set.has(cls);
      const next = force !== undefined ? force : !has;
      if (next) set.add(cls);
      else set.delete(cls);
      this.className = Array.from(set).join(' ');
      return next;
    },
    contains: (cls: string) => this.className.split(' ').filter(Boolean).includes(cls),
  };

  get parentNode(): FakeElement | null {
    return this.parentElement;
  }

  constructor(tagName: string) {
    this.tagName = tagName.toUpperCase();
  }

  setAttribute(k: string, v: string) {
    this.attributes[k] = String(v);
    if (k === 'id') this.id = v;
    if (k === 'class') this.className = v;
  }

  getAttribute(k: string): string | null {
    if (k === 'id') return this.id || null;
    if (k === 'class') return this.className || null;
    return this.attributes[k] ?? null;
  }

  removeAttribute(k: string) {
    delete this.attributes[k];
  }

  hasAttribute(k: string): boolean {
    return k in this.attributes;
  }

  closest(sel: string): FakeElement | null {
    const parts = sel.split(',').map((s) => s.trim());
    let curr: FakeElement | null = this;
    while (curr) {
      for (const p of parts) {
        if (p.startsWith('.') && curr.classList.contains(p.slice(1))) return curr;
        if (p.startsWith('#') && curr.id === p.slice(1)) return curr;
        if (p.startsWith('[')) {
          const match = p.match(/^\[([a-zA-Z0-9_-]+)(?:="?([^"\]]+)"?)?\]/);
          if (match) {
            const attrName = match[1];
            const attrVal = match[2];
            if (attrVal !== undefined) {
              if (curr.getAttribute(attrName) === attrVal) return curr;
            } else if (curr.hasAttribute(attrName)) {
              return curr;
            }
          }
        }
        if (curr.tagName.toLowerCase() === p.toLowerCase()) return curr;
      }
      curr = curr.parentElement;
    }
    return null;
  }

  cloneNode(_deep?: boolean): FakeElement {
    const clone = new FakeElement(this.tagName);
    clone.textContent = this.textContent;
    clone.className = this.className;
    clone.id = this.id;
    clone.attributes = { ...this.attributes };
    clone.dataset = { ...this.dataset };
    return clone;
  }

  after(sibling: FakeElement) {
    if (!this.parentElement) return;
    const idx = this.parentElement.children.indexOf(this);
    if (idx !== -1) {
      sibling.parentElement = this.parentElement;
      this.parentElement.children.splice(idx + 1, 0, sibling);
    }
  }

  prepend(child: FakeElement) {
    child.parentElement = this;
    this.children.unshift(child);
  }

  remove() {
    if (this.parentElement) {
      const idx = this.parentElement.children.indexOf(this);
      if (idx !== -1) {
        this.parentElement.children.splice(idx, 1);
      }
      this.parentElement = null;
    }
  }

  replaceChild(newChild: any, oldChild: any) {
    const idx = this.children.indexOf(oldChild);
    if (idx !== -1) {
      newChild.parentElement = this;
      this.children.splice(idx, 1, newChild);
    }
  }

  querySelectorAll(sel: string): FakeElement[] {
    const results: FakeElement[] = [];
    const check = (el: FakeElement) => {
      const parts = sel.split(',').map((s) => s.trim());
      for (const p of parts) {
        if (p.startsWith('.')) {
          if (el.classList.contains(p.slice(1))) {
            results.push(el);
            break;
          }
        } else if (p.startsWith('#')) {
          if (el.id === p.slice(1)) {
            results.push(el);
            break;
          }
        } else if (p.startsWith('[')) {
          const match = p.match(/^\[([a-zA-Z0-9_-]+)(?:="?([^"\]]+)"?)?\]/);
          if (match) {
            const attrName = match[1];
            const attrVal = match[2];
            if (attrVal !== undefined) {
              if (el.getAttribute(attrName) === attrVal) {
                results.push(el);
                break;
              }
            } else if (el.hasAttribute(attrName)) {
              results.push(el);
              break;
            }
          }
        } else if (el.tagName.toLowerCase() === p.toLowerCase()) {
          results.push(el);
          break;
        }
      }
      for (const child of el.children) {
        check(child);
      }
    };
    for (const child of this.children) {
      check(child);
    }
    return results;
  }

  querySelector(sel: string): FakeElement | null {
    const list = this.querySelectorAll(sel);
    return list.length > 0 ? list[0] : null;
  }
}

describe('Translation Display Mode Suite (侧边栏对照 vs 段落下方显示)', () => {
  let store: Map<string, string>;
  let mockDoc: any;
  let mockWindow: any;
  let rootArticle: FakeElement;
  let dockPanel: FakeElement;
  let origFetch: any;

  beforeEach(async () => {
    store = new Map<string, string>();
    (globalThis as any).localStorage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => store.set(k, String(v)),
      removeItem: (k: string) => store.delete(k),
      clear: () => store.clear(),
    };

    origFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        translatedText: '中文段落测试翻译',
      }),
    } as any);

    rootArticle = new FakeElement('article');
    rootArticle.className = 'sl-markdown-content';

    const p1 = new FakeElement('p');
    p1.textContent = 'A vector space is a collection of objects called vectors.';
    p1.parentElement = rootArticle;
    rootArticle.children.push(p1);

    const p2 = new FakeElement('p');
    p2.textContent = 'Scalars can be multiplied by vectors to produce new vectors.';
    p2.parentElement = rootArticle;
    rootArticle.children.push(p2);

    dockPanel = new FakeElement('div');
    dockPanel.id = 'trans-sidebar-panel';

    const dockContent = new FakeElement('div');
    dockContent.id = 'trans-sidebar-content';
    dockContent.parentElement = dockPanel;
    dockPanel.children.push(dockContent);

    const windowListeners: Record<string, ((...args: any[]) => void)[]> = {};
    mockDoc = {
      documentElement: new FakeElement('html'),
      body: new FakeElement('body'),
      querySelector: (sel: string) => {
        if (sel === '.sl-markdown-content' || sel === 'article') return rootArticle;
        if (sel === '#trans-sidebar-panel') return dockPanel;
        if (sel === '#trans-sidebar-content') return dockContent;
        if (sel.includes('[data-trans-inline-id]')) return rootArticle.querySelector(sel);
        return rootArticle.querySelector(sel) || dockPanel.querySelector(sel);
      },
      querySelectorAll: (sel: string) => {
        if (sel === '.sideload-panel-view') return [];
        return rootArticle.querySelectorAll(sel);
      },
      getElementById: (id: string) => {
        if (id === 'trans-sidebar-panel') return dockPanel;
        if (id === 'trans-sidebar-content') return dockContent;
        if (id === 'astrolib-sideload-dock') return new FakeElement('div');
        if (id === 'sideload-panel-title') return new FakeElement('span');
        if (id === 'sideload-back-to-toc') return new FakeElement('button');
        if (id === 'trans-inline-toolbar') return rootArticle.querySelector('#trans-inline-toolbar');
        return null;
      },
      createElement: (tag: string) => new FakeElement(tag),
      createTextNode: (text: string) => ({ textContent: text, nodeType: 3 }),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    (globalThis as any).document = mockDoc;

    mockWindow = {
      addEventListener: (type: string, fn: any) => {
        windowListeners[type] = windowListeners[type] || [];
        windowListeners[type].push(fn);
      },
      removeEventListener: (type: string, fn: any) => {
        if (!windowListeners[type]) return;
        windowListeners[type] = windowListeners[type].filter((cb) => cb !== fn);
      },
      dispatchEvent: (e: any) => {
        const list = windowListeners[e.type] || [];
        for (const fn of list) {
          try {
            fn(e);
          } catch (err) {
            console.error(err);
          }
        }
      },
      matchMedia: () => ({ matches: false, addEventListener: vi.fn() }),
      location: { pathname: '/collections/math/linear-algebra/ch01/' },
    };
    (globalThis as any).window = mockWindow;

    sideloadManager.switchToDefault();

    const { TranslationDockController } = await import('../../src/services/translation/client/translation-dock-controller');
    const controller = TranslationDockController.getInstance();
    controller.hideInlineTranslations();
    (controller as any).isTranslating = false;
    (controller as any).paragraphs = [];
  });

  afterEach(() => {
    vi.restoreAllMocks();
    globalThis.fetch = origFetch;
    delete (globalThis as any).document;
    delete (globalThis as any).window;
    delete (globalThis as any).localStorage;
  });

  it('特性配置中心中 translation 默认显示模式必须为 sidebar', () => {
    expect((features.translation.config as any)?.defaultDisplayMode).toBe('sidebar');
  });

  it('初始状态下 TranslationStorage 默认呈现模式为 sidebar', () => {
    expect(TranslationStorage.getDisplayMode()).toBe('sidebar');
  });

  it('TranslationStorage 支持自主切换与持久化 inline 模式', () => {
    TranslationStorage.setDisplayMode('inline');
    expect(TranslationStorage.getDisplayMode()).toBe('inline');
    expect(store.get('astrolib_trans_display_mode')).toBe('inline');

    TranslationStorage.setDisplayMode('sidebar');
    expect(TranslationStorage.getDisplayMode()).toBe('sidebar');
    expect(store.get('astrolib_trans_display_mode')).toBe('sidebar');
  });

  it('sidebar 模式下：触发翻译应打开右侧侧边栏 translate 面板', async () => {
    const { TranslationDockController } = await import('../../src/services/translation/client/translation-dock-controller');
    const controller = TranslationDockController.getInstance();
    controller.setDisplayMode('sidebar', false);

    expect(sideloadManager.getActivePanelId()).toBe('toc');

    controller.handleTriggerClick();
    expect(sideloadManager.getActivePanelId()).toBe('translate');

    controller.handleTriggerClick();
    expect(sideloadManager.getActivePanelId()).toBe('toc');
  });

  it('inline 模式下：触发翻译绝对不应影响右侧侧边栏 (保持 toc 状态)', async () => {
    const { TranslationDockController } = await import('../../src/services/translation/client/translation-dock-controller');
    const controller = TranslationDockController.getInstance();
    controller.setDisplayMode('inline', false);

    // 确保右侧栏处于本节大纲 (toc)
    expect(sideloadManager.getActivePanelId()).toBe('toc');

    // 触发翻译
    await controller.showInlineTranslations();

    // 核心断言：右侧边栏完全未被打开或劫持，保持为大纲 toc
    expect(sideloadManager.getActivePanelId()).toBe('toc');

    // 核心断言：正文各段落下方直接注入了行内翻译块
    const inlineBlocks = rootArticle.querySelectorAll('.trans-inline-block');
    expect(inlineBlocks.length).toBeGreaterThan(0);

    // 再次触发翻译时，平滑收起行内翻译，右侧边栏依然保持为大纲 toc
    controller.hideInlineTranslations();
    expect(sideloadManager.getActivePanelId()).toBe('toc');
    const remainingBlocks = rootArticle.querySelectorAll('.trans-inline-block');
    expect(remainingBlocks.length).toBe(0);
  });

  it('若用户在侧边栏翻译开启时切换至 inline，右侧边栏应自动退回大纲并无缝切换至段落下显示', async () => {
    const { TranslationDockController } = await import('../../src/services/translation/client/translation-dock-controller');
    const controller = TranslationDockController.getInstance();
    controller.setDisplayMode('sidebar', false);

    // 展开右侧边栏翻译
    sideloadManager.open('translate');
    expect(sideloadManager.getActivePanelId()).toBe('translate');

    // 用户在设置中切换显示方式为 inline
    controller.setDisplayMode('inline', false);

    // 右侧边栏应立即恢复默认大纲，不被占用
    expect(sideloadManager.getActivePanelId()).toBe('toc');

    // 正文中应出现行内段落下翻译块
    const inlineBlocks = rootArticle.querySelectorAll('.trans-inline-block');
    expect(inlineBlocks.length).toBeGreaterThan(0);
  });

  it('若用户在侧边栏未处于翻译状态时在设置中选择 inline，正文应立即呈现段落下翻译且右侧栏完全保持 toc', async () => {
    const { TranslationDockController } = await import('../../src/services/translation/client/translation-dock-controller');
    const controller = TranslationDockController.getInstance();
    controller.setDisplayMode('sidebar', false);
    expect(sideloadManager.getActivePanelId()).toBe('toc');

    // 用户在设置中切换显示方式为 inline
    controller.setDisplayMode('inline', false);

    // 右侧边栏必须绝对保持为大纲 toc
    expect(sideloadManager.getActivePanelId()).toBe('toc');

    // 正文中必须立即出现段落下翻译块（解决“选择段落下方显示时正文没有反应”的问题）
    const inlineBlocks = rootArticle.querySelectorAll('.trans-inline-block');
    expect(inlineBlocks.length).toBeGreaterThan(0);
  });

  it('极简减负验证：行内翻译块绝不包含冗余的「译文」Badge 与独立 meta 标题行', async () => {
    const { TranslationDockController } = await import('../../src/services/translation/client/translation-dock-controller');
    const controller = TranslationDockController.getInstance();
    await controller.showInlineTranslations(true);

    const inlineBlocks = rootArticle.querySelectorAll('.trans-inline-block');
    expect(inlineBlocks.length).toBeGreaterThan(0);

    for (const block of inlineBlocks) {
      // 核心断言：绝对没有 .trans-inline-badge 与 .trans-inline-meta
      expect(block.innerHTML).not.toContain('trans-inline-badge');
      expect(block.innerHTML).not.toContain('trans-inline-meta');
      expect(block.innerHTML).not.toContain('>译文<');

      // 核心断言：正文紧凑包裹在 .trans-inline-text 内
      expect(block.innerHTML).toContain('trans-inline-text');
    }
  });

  it('服务商配置验证：TranslationStorage 与 Controller 支撑服务商持久化与就地切换', async () => {
    const { TranslationDockController } = await import('../../src/services/translation/client/translation-dock-controller');
    const controller = TranslationDockController.getInstance();

    // 默认提供商应为 google
    expect(TranslationStorage.getProvider()).toBe('google');
    expect(controller.getProvider()).toBe('google');

    // 切换至 gemini
    controller.setProvider('gemini');
    expect(TranslationStorage.getProvider()).toBe('gemini');
    expect(controller.getProvider()).toBe('gemini');
    expect(store.get('astrolib_trans_provider')).toBe('gemini');

    // 切换至 bupt
    controller.setProvider('bupt');
    expect(TranslationStorage.getProvider()).toBe('bupt');
    expect(controller.getProvider()).toBe('bupt');
  });

  it('行内模式下服务商切换与控制条联动验证：切换服务商立即以新服务商重译正文，并同步控制条状态', async () => {
    const { TranslationDockController } = await import('../../src/services/translation/client/translation-dock-controller');
    const controller = TranslationDockController.getInstance();
    controller.setDisplayMode('inline', false);

    // 开启行内助读
    await controller.showInlineTranslations();

    // 验证正文顶端挂载了行内控制条
    const toolbar = rootArticle.querySelector('.trans-inline-toolbar');
    expect(toolbar).not.toBeNull();
    expect(toolbar?.innerHTML).toContain('双语助读');
    expect(toolbar?.innerHTML).toContain('data-inline-provider="gemini"');

    // 清空 fetch 调用记录并切换服务商为 gemini
    (globalThis.fetch as any).mockClear();
    controller.setProvider('gemini');

    // 验证调用了翻译端点重新发起翻译，且请求体内 provider 为 gemini
    expect(globalThis.fetch).toHaveBeenCalled();
    const calls = (globalThis.fetch as any).mock.calls;
    const lastCallBody = JSON.parse(calls[0][1].body);
    expect(lastCallBody.provider).toBe('gemini');

    // 关闭行内助读时，控制条随之安全移除
    controller.hideInlineTranslations();
    const remainingToolbar = rootArticle.querySelector('.trans-inline-toolbar');
    expect(remainingToolbar).toBeNull();
  });
});
