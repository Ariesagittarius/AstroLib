import { describe, it, expect, beforeEach } from 'vitest';
import { sideloadManager } from '../../src/components/sideload/sideload-manager';

describe('SideloadManager AI 面板与侧载状态流转', () => {
  beforeEach(() => {
    sideloadManager.switchToDefault();
  });

  it('内置注册了 ai 面板，具有正确的宽面板阶梯与抽屉配置', () => {
    const panelsMap = (sideloadManager as any).panels;
    expect(panelsMap.has('ai')).toBe(true);

    const aiConfig = panelsMap.get('ai');
    expect(aiConfig).toMatchObject({
      id: 'ai',
      title: '智能问答',
      widthTier: 'wide',
      allowDrawer: true,
    });
  });

  it('成功打开 ai 面板，并派发 wide 宽度阶梯', () => {
    sideloadManager.open('ai');
    const state = sideloadManager.getState();

    expect(state.activePanelId).toBe('ai');
    expect(state.widthTier).toBe('wide');
    expect(state.widthValue).toBe('clamp(20rem, 28vw, 25.5rem)');
  });

  it('调用 switchToDefault 时，安全平滑退回本节大纲 (toc)', () => {
    sideloadManager.open('ai');
    expect(sideloadManager.getState().activePanelId).toBe('ai');

    sideloadManager.switchToDefault();
    const state = sideloadManager.getState();
    expect(state.activePanelId).toBe('toc');
    expect(state.widthTier).toBe('compact');
  });

  it('toggle(ai) 可在展开与退回大纲之间交替切换', () => {
    sideloadManager.toggle('ai');
    expect(sideloadManager.getState().activePanelId).toBe('ai');

    sideloadManager.toggle('ai');
    expect(sideloadManager.getState().activePanelId).toBe('toc');
  });

  it('mountToOverlayRoot 严禁拔出已处于侧载宿主或带有 is-docked 标记的元素', async () => {
    const { mountToOverlayRoot } = await import('../../src/utils/overlay/overlay-root');

    const root = { id: 'astro-overlay-root', appendChild: (child: any) => { appended = child; } };
    let appended: any = null;

    const sidebarPanel = { id: 'ai-sidebar-panel' };
    const fakeEl = {
      tagName: 'AI-ASK',
      classList: { contains: (cls: string) => cls === 'is-docked' },
      closest: (sel: string) => (sel === '#ai-sidebar-panel' ? sidebarPanel : null),
      parentElement: sidebarPanel,
      _isDocked: true,
    } as any;

    (globalThis as any).document = {
      getElementById: (id: string) => (id === 'astro-overlay-root' ? root : null),
      body: { appendChild: () => {} },
    };

    try {
      mountToOverlayRoot(fakeEl);
      expect(appended).toBeNull();
      expect(fakeEl.parentElement).toBe(sidebarPanel);
    } finally {
      delete (globalThis as any).document;
    }
  });

  it('侧载默认引用本章配置项支持安全读取与持久化保存', async () => {
    const store = new Map<string, string>();
    (globalThis as any).localStorage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => store.set(k, String(v)),
      removeItem: (k: string) => store.delete(k),
      clear: () => store.clear(),
    };

    try {
      const { getAiSideloadRefChapter, saveAiSideloadRefChapter } = await import('../../src/ai/ai-config');

      expect(getAiSideloadRefChapter()).toBe(true);

      saveAiSideloadRefChapter(false);
      expect(getAiSideloadRefChapter()).toBe(false);

      saveAiSideloadRefChapter(true);
      expect(getAiSideloadRefChapter()).toBe(true);
    } finally {
      delete (globalThis as any).localStorage;
    }
  });

  it('buildMessages 在提供 chapterRef 时，准确将当前阅读章节与正文片段组装入提示词', async () => {
    const { buildMessages } = await import('../../src/ai/llm.mjs');

    const messages = buildMessages({
      question: '请解释什么是夹逼定理？',
      context: '[1] 极限性质',
      bookTitle: '高等数学',
      chapterRef: {
        title: '1.2 极限的运算法则',
        url: '/collections/math/advanced_math/12_limit_rules/',
        text: '若在自变量的同一变化过程中，三个函数满足 f(x) <= g(x) <= h(x)，且 lim f(x) = lim h(x) = A，则 lim g(x) = A。',
      },
    });

    expect(messages).toHaveLength(2);
    const userMsg = messages.find((m: any) => m.role === 'user');
    expect(userMsg).toBeDefined();
    expect(userMsg!.content).toContain('【读者当前正在查看的本章节】：1.2 极限的运算法则');
    expect(userMsg!.content).toContain('/collections/math/advanced_math/12_limit_rules/');
    expect(userMsg!.content).toContain('若在自变量的同一变化过程中，三个函数满足 f(x) <= g(x) <= h(x)');
    expect(userMsg!.content).toContain('请解释什么是夹逼定理？');
  });

  it('buildMessages 在提供多章节 chapterRefs 数组时，以编号列表结构化注入各章节内容与交叉分析引导', async () => {
    const { buildMessages } = await import('../../src/ai/llm.mjs');

    const messages = buildMessages({
      question: '请推导格林公式及其与曲线积分的关系',
      context: '[1] 曲线积分',
      bookTitle: '高等数学',
      chapterRefs: [
        {
          title: '6.5 重积分的应用',
          url: '/collections/math/advanced_math/65_integral_app/',
          text: '平面薄片的质量与质心计算公式。',
        },
        {
          title: '6.1 二重积分的概念与性质',
          url: '/collections/math/advanced_math/61_double_integral/',
          text: '二重积分的线性性质与可积性条件。',
        },
      ],
      extendedThinking: true,
    });

    expect(messages).toHaveLength(2);
    const userMsg = messages.find((m: any) => m.role === 'user');
    expect(userMsg).toBeDefined();
    expect(userMsg!.content).toContain('【读者引用的相关章节内容】：');
    expect(userMsg!.content).toContain('1. 《6.5 重积分的应用》（链接：/collections/math/advanced_math/65_integral_app/）');
    expect(userMsg!.content).toContain('平面薄片的质量与质心计算公式。');
    expect(userMsg!.content).toContain('2. 《6.1 二重积分的概念与性质》（链接：/collections/math/advanced_math/61_double_integral/）');
    expect(userMsg!.content).toContain('【思考深度模式】：已开启扩展深度思考');
    expect(userMsg!.content).toContain('《6.5 重积分的应用》、《6.1 二重积分的概念与性质》');
  });

  it('扩展思考 (Extended Thinking) 配置项支持安全存取与持久化', async () => {
    const store = new Map<string, string>();
    (globalThis as any).localStorage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => store.set(k, String(v)),
      removeItem: (k: string) => store.delete(k),
      clear: () => store.clear(),
    };

    try {
      const { getAiExtendedThinking, saveAiExtendedThinking } = await import('../../src/ai/ai-config');

      expect(getAiExtendedThinking()).toBe(false);

      saveAiExtendedThinking(true);
      expect(getAiExtendedThinking()).toBe(true);

      saveAiExtendedThinking(false);
      expect(getAiExtendedThinking()).toBe(false);
    } finally {
      delete (globalThis as any).localStorage;
    }
  });

  it('getShortModelLabel 能为 Gemini 侧载胶囊按钮准确提取极简别名', async () => {
    const { getShortModelLabel } = await import('../../src/ai/ai-config');

    expect(getShortModelLabel('auto')).toBe('自动');
    expect(getShortModelLabel('gemini-3.5-flash-lite')).toBe('3.5 Flash-Lite');
    expect(getShortModelLabel('gemini-3.8-flash')).toBe('3.8 Flash');
    expect(getShortModelLabel('gemini-3.1-pro')).toBe('3.1 Pro');
    expect(getShortModelLabel('deepseek-flash')).toBe('DeepSeek');
  });

  it('浮窗动效契约：ai-theme.css 必须声明 dock-settled 静止态并严禁二次重放 ai-panel-in', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const cssPath = path.resolve('src/components/ai/ai-theme.css');
    const cssContent = fs.readFileSync(cssPath, 'utf-8');

    expect(cssContent).toMatch(/ask-panel\.ask-open:not\(\.docking-in\):not\(\.dock-settled\)/);

    expect(cssContent).toMatch(/\.ask-panel\.dock-settled\s*\{[\s\S]*?animation:\s*none\s*!important;/);

    expect(cssContent).toMatch(/\.ask-panel\.docking-in\s*\{[\s\S]*?animation:\s*ai-floating-dock-in/);
  });

  it('章节导航静止契约：正文与大纲入场严禁 translateY/translate3d 物理跳动动画', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');

    const vpCss = fs.readFileSync(path.resolve('src/styles/vitepress-theme.css'), 'utf-8');
    const vpMatch = vpCss.match(/@keyframes vp-content-enter\s*\{([\s\S]*?)\}/);
    expect(vpMatch).toBeTruthy();
    expect(vpMatch![1]).not.toContain('translateY');
    expect(vpMatch![1]).not.toContain('translate3d');

    const exCss = fs.readFileSync(path.resolve('src/styles/components/exercise-m3.css'), 'utf-8');
    const m3Match = exCss.match(/@keyframes m3-sideload-view-in\s*\{([\s\S]*?)\}/);
    expect(m3Match).toBeTruthy();
    expect(m3Match![1]).not.toContain('translateY');
    expect(m3Match![1]).not.toContain('translate3d');

    const aiCss = fs.readFileSync(path.resolve('src/components/ai/ai-theme.css'), 'utf-8');
    expect(aiCss).not.toMatch(/\.sideload-panel-view\[data-panel-id=['"]ai['"]\]\.active[^{]*?ai-dock-enter/);
  });
});
