import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TranslationStorage } from '@/services/translation/storage/translation-storage.ts';
import type { ParagraphUnit } from '@/services/translation/types.ts';

// 模拟浏览器 localStorage
class MockLocalStorage {
  private store: Record<string, string> = {};

  getItem(key: string): string | null {
    return this.store[key] ?? null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = String(value);
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  clear(): void {
    this.store = {};
  }
}

describe('TranslationStorage Suite', () => {
  let mockStorage: MockLocalStorage;

  beforeEach(() => {
    mockStorage = new MockLocalStorage();
    (globalThis as any).localStorage = mockStorage;
  });

  afterEach(() => {
    delete (globalThis as any).localStorage;
  });

  it('normalizeKey 应规范化去除末尾斜杠并兜底默认键', () => {
    expect(TranslationStorage.normalizeKey('/math/linear-algebra/ch01/')).toBe('/math/linear-algebra/ch01');
    expect(TranslationStorage.normalizeKey('/math/linear-algebra/ch01')).toBe('/math/linear-algebra/ch01');
    expect(TranslationStorage.normalizeKey('')).toBe('default-chapter');
  });

  it('saveUnit 应正确保存单个段落译文并能被 loadChapter 读取', () => {
    const chapterKey = '/math/calculus/ch02';
    const unit: ParagraphUnit = {
      id: 'p-0',
      type: 'paragraph',
      index: 0,
      sourceText: 'The derivative represents the rate of change.',
      translatedText: '导数表示瞬时变化率。',
      status: 'done',
      provider: 'bupt',
      isSatisfied: true,
    };

    TranslationStorage.saveUnit(chapterKey, unit);

    const chapter = TranslationStorage.loadChapter(chapterKey);
    expect(chapter).not.toBeNull();
    expect(chapter?.chapterKey).toBe(chapterKey);
    expect(chapter?.units['p-0']).toBeDefined();
    expect(chapter?.units['p-0'].translatedText).toBe('导数表示瞬时变化率。');
    expect(chapter?.units['p-0'].isSatisfied).toBe(true);
    expect(chapter?.units['p-0'].provider).toBe('bupt');
  });

  it('saveChapter 应批量保存整章段落并更新章节标题', () => {
    const chapterKey = '/physics/classical-mechanics';
    const units: ParagraphUnit[] = [
      {
        id: 'p-0',
        type: 'heading',
        index: 0,
        sourceText: 'Newtonian Dynamics',
        translatedText: '牛顿动力学',
        status: 'done',
      },
      {
        id: 'p-1',
        type: 'paragraph',
        index: 1,
        sourceText: 'F equals m times a.',
        translatedText: '力等于质量乘以加速度。',
        status: 'done',
      },
    ];

    TranslationStorage.saveChapter(chapterKey, units, '第一章：动力学基础');

    const chapter = TranslationStorage.loadChapter(chapterKey);
    expect(chapter?.chapterTitle).toBe('第一章：动力学基础');
    expect(Object.keys(chapter?.units || {}).length).toBe(2);
    expect(chapter?.units['p-1'].translatedText).toBe('力等于质量乘以加速度。');
  });

  it('hydrateUnits 应正确就地回填缓存数据并统计满意数量', () => {
    const chapterKey = '/algebra/groups';
    const storedUnits: ParagraphUnit[] = [
      {
        id: 'p-0',
        type: 'paragraph',
        index: 0,
        sourceText: 'A group is a set equipped with a binary operation.',
        translatedText: '群是配备二元代数运算的集合。',
        status: 'done',
        isSatisfied: true,
      },
    ];
    TranslationStorage.saveChapter(chapterKey, storedUnits);

    const activeUnits: ParagraphUnit[] = [
      {
        id: 'p-0',
        type: 'paragraph',
        index: 0,
        sourceText: 'A group is a set equipped with a binary operation.',
        status: 'idle',
      },
      {
        id: 'p-1',
        type: 'paragraph',
        index: 1,
        sourceText: 'It must satisfy associativity, identity, and inverses.',
        status: 'idle',
      },
    ];

    const { hydratedCount, satisfiedCount } = TranslationStorage.hydrateUnits(chapterKey, activeUnits);

    expect(hydratedCount).toBe(1);
    expect(satisfiedCount).toBe(1);
    expect(activeUnits[0].status).toBe('done');
    expect(activeUnits[0].translatedText).toBe('群是配备二元代数运算的集合。');
    expect(activeUnits[0].isSatisfied).toBe(true);

    // 第二个单元未缓存，保持原始状态
    expect(activeUnits[1].status).toBe('idle');
    expect(activeUnits[1].translatedText).toBeUndefined();
  });

  it('toggleSatisfied 应准确翻转段落采纳状态', () => {
    const chapterKey = '/math/topology';
    const unit: ParagraphUnit = {
      id: 'p-0',
      type: 'paragraph',
      index: 0,
      sourceText: 'Topological spaces',
      translatedText: '拓扑空间',
      status: 'done',
      isSatisfied: false,
    };
    TranslationStorage.saveUnit(chapterKey, unit);

    expect(TranslationStorage.getSatisfiedCount(chapterKey)).toBe(0);

    const next1 = TranslationStorage.toggleSatisfied(chapterKey, 'p-0');
    expect(next1).toBe(true);
    expect(TranslationStorage.getSatisfiedCount(chapterKey)).toBe(1);

    const next2 = TranslationStorage.toggleSatisfied(chapterKey, 'p-0');
    expect(next2).toBe(false);
    expect(TranslationStorage.getSatisfiedCount(chapterKey)).toBe(0);
  });

  it('updateCustomTranslation 应将手动微调译文持久化并自动标记为精修与满意', () => {
    const chapterKey = '/quantum/intro';
    const unit: ParagraphUnit = {
      id: 'p-0',
      type: 'paragraph',
      index: 0,
      sourceText: 'Wave function collapse',
      translatedText: '波函数坍缩',
      status: 'done',
    };
    TranslationStorage.saveUnit(chapterKey, unit);

    TranslationStorage.updateCustomTranslation(chapterKey, 'p-0', '波函数的本征态投影坍缩');

    const chapter = TranslationStorage.loadChapter(chapterKey);
    const u = chapter?.units['p-0'];
    expect(u?.translatedText).toBe('波函数的本征态投影坍缩');
    expect(u?.isCustomEdited).toBe(true);
    expect(u?.isSatisfied).toBe(true);
    expect(TranslationStorage.getSatisfiedCount(chapterKey)).toBe(1);
  });

  it('markAllSatisfied 应一键将所有已翻译段落标记为满意', () => {
    const chapterKey = '/stat/probability';
    const units: ParagraphUnit[] = [
      { id: 'p-0', type: 'paragraph', index: 0, sourceText: 'Random variables', translatedText: '随机变量', status: 'done' },
      { id: 'p-1', type: 'paragraph', index: 1, sourceText: 'Probability density', translatedText: '概率密度', status: 'done' },
      { id: 'p-2', type: 'paragraph', index: 2, sourceText: 'Not translated yet', status: 'idle' },
    ];
    TranslationStorage.saveChapter(chapterKey, units);

    TranslationStorage.markAllSatisfied(chapterKey, units);

    expect(units[0].isSatisfied).toBe(true);
    expect(units[1].isSatisfied).toBe(true);
    expect(units[2].isSatisfied).toBeUndefined();
    expect(TranslationStorage.getSatisfiedCount(chapterKey)).toBe(2);
  });

  it('clearChapter 应彻底清除章节的持久化缓存', () => {
    const chapterKey = '/clear/test';
    TranslationStorage.saveUnit(chapterKey, {
      id: 'p-0',
      type: 'paragraph',
      index: 0,
      sourceText: 'A',
      translatedText: '甲',
      status: 'done',
    });
    expect(TranslationStorage.loadChapter(chapterKey)).not.toBeNull();

    TranslationStorage.clearChapter(chapterKey);
    expect(TranslationStorage.loadChapter(chapterKey)).toBeNull();
  });

  describe('TranslationDisplayMode Suite', () => {
    it('默认呈现模式应为 sidebar', () => {
      localStorage.removeItem('astrolib_trans_display_mode');
      expect(TranslationStorage.getDisplayMode()).toBe('sidebar');
    });

    it('能够成功写入并读取 inline 呈现模式', () => {
      TranslationStorage.setDisplayMode('inline');
      expect(TranslationStorage.getDisplayMode()).toBe('inline');
      expect(localStorage.getItem('astrolib_trans_display_mode')).toBe('inline');
    });

    it('能够成功切回 sidebar 呈现模式', () => {
      TranslationStorage.setDisplayMode('sidebar');
      expect(TranslationStorage.getDisplayMode()).toBe('sidebar');
      expect(localStorage.getItem('astrolib_trans_display_mode')).toBe('sidebar');
    });

    it('设置显示模式时应派发 astrolib:translation-display-mode-change 全局事件', () => {
      let eventDetail: any = null;
      const listeners: Record<string, ((e: any) => void)[]> = {};
      (globalThis as any).window = {
        addEventListener: (event: string, fn: any) => {
          listeners[event] = listeners[event] || [];
          listeners[event].push(fn);
        },
        removeEventListener: (event: string, fn: any) => {
          if (!listeners[event]) return;
          listeners[event] = listeners[event].filter((f) => f !== fn);
        },
        dispatchEvent: (e: any) => {
          const fns = listeners[e.type] || [];
          fns.forEach((f) => f(e));
        },
      };

      try {
        const listener = (e: any) => {
          eventDetail = e.detail;
        };
        (globalThis as any).window.addEventListener('astrolib:translation-display-mode-change', listener);

        TranslationStorage.setDisplayMode('inline');
        expect(eventDetail).toEqual({ mode: 'inline' });
      } finally {
        delete (globalThis as any).window;
      }
    });

    it('面对无效值时应安全降级返回默认 sidebar', () => {
      localStorage.setItem('astrolib_trans_display_mode', 'invalid_mode' as any);
      expect(TranslationStorage.getDisplayMode()).toBe('sidebar');
    });
  });
});

