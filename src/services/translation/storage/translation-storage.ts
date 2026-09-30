/**
 * src/services/translation/storage/translation-storage.ts
 * ============================================================================
 * AstroLib 双语助读章节译文持久化管理器 (Translation Storage Manager)
 * ============================================================================
 * 职责：
 * 1. 负责章节段落译文在浏览器本地的持久化存储与瞬时回填 (Hydration)；
 * 2. 支撑读者对满意译文的「采纳 (Satisfied)」、「微调精修 (Custom Edited)」状态记录；
 * 3. 跨会话零延迟恢复已译章节，大幅节省 AI 算力与网络消耗；
 * 4. 遵守 Rule 1 (UI is not a domain model) & Rule 7 (Utils Purity)。
 * ============================================================================
 */

import type { ParagraphUnit, StoredChapterTranslation, StoredUnitTranslation, TranslationDisplayMode, TranslationProviderId } from '../types.ts';

const STORAGE_PREFIX = 'astrolib_trans_doc_';
export const TRANSLATION_DISPLAY_MODE_KEY = 'astrolib_trans_display_mode';
export const DEFAULT_TRANSLATION_DISPLAY_MODE: TranslationDisplayMode = 'sidebar';
export const TRANSLATION_DISPLAY_MODE_CHANGE_EVENT = 'astrolib:translation-display-mode-change';

export const TRANSLATION_PROVIDER_KEY = 'astrolib_trans_provider';
export const DEFAULT_TRANSLATION_PROVIDER: TranslationProviderId = 'google';
export const TRANSLATION_PROVIDER_CHANGE_EVENT = 'astrolib:translation-provider-change';

export class TranslationStorage {
  /**
   * 规范化章节标识 Key（默认提取当前路由 pathname）
   */
  public static normalizeKey(rawKey?: string): string {
    if (rawKey && rawKey.trim()) {
      return rawKey.trim().replace(/\/$/, '') || 'root';
    }
    if (typeof window !== 'undefined' && window.location) {
      return window.location.pathname.replace(/\/$/, '') || 'root';
    }
    return 'default-chapter';
  }

  private static getStorageKey(chapterKey: string): string {
    return `${STORAGE_PREFIX}${this.normalizeKey(chapterKey)}`;
  }

  /**
   * 加载指定章节的本地缓存
   */
  public static loadChapter(chapterKey?: string): StoredChapterTranslation | null {
    if (typeof localStorage === 'undefined') return null;
    const key = this.getStorageKey(chapterKey || '');
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as StoredChapterTranslation;
      if (parsed && typeof parsed.units === 'object') {
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * 将解析出的段落数组与本地缓存比对，就地回填 (Hydrate)
   * 返回回填的段落数量及满意的段落数量
   */
  public static hydrateUnits(chapterKey: string, units: ParagraphUnit[]): { hydratedCount: number; satisfiedCount: number } {
    const stored = this.loadChapter(chapterKey);
    if (!stored || !stored.units) {
      return { hydratedCount: 0, satisfiedCount: 0 };
    }

    let hydratedCount = 0;
    let satisfiedCount = 0;

    for (const unit of units) {
      const saved = stored.units[unit.id];
      if (saved && saved.translatedText && saved.translatedText.trim()) {
        unit.translatedText = saved.translatedText;
        unit.status = 'done';
        unit.isSatisfied = Boolean(saved.isSatisfied);
        unit.isCustomEdited = Boolean(saved.isCustomEdited);
        unit.provider = saved.provider;
        unit.updatedAt = saved.updatedAt;
        hydratedCount++;
        if (unit.isSatisfied) {
          satisfiedCount++;
        }
      }
    }

    return { hydratedCount, satisfiedCount };
  }

  /**
   * 保存单个段落译文及其满意/精修状态
   */
  public static saveUnit(chapterKey: string, unit: ParagraphUnit): void {
    if (typeof localStorage === 'undefined' || !unit.translatedText) return;
    const key = this.getStorageKey(chapterKey);
    const existing = this.loadChapter(chapterKey) || {
      chapterKey: this.normalizeKey(chapterKey),
      updatedAt: Date.now(),
      units: {},
    };

    existing.units[unit.id] = {
      translatedText: unit.translatedText,
      isSatisfied: Boolean(unit.isSatisfied),
      isCustomEdited: Boolean(unit.isCustomEdited),
      provider: unit.provider,
      updatedAt: Date.now(),
    };
    existing.updatedAt = Date.now();

    try {
      localStorage.setItem(key, JSON.stringify(existing));
    } catch (err) {
      console.warn('[TranslationStorage] 保存单段译文失败:', err);
    }
  }

  /**
   * 批量保存整章段落译文
   */
  public static saveChapter(chapterKey: string, units: ParagraphUnit[], chapterTitle?: string): void {
    if (typeof localStorage === 'undefined') return;
    const key = this.getStorageKey(chapterKey);
    const existing = this.loadChapter(chapterKey) || {
      chapterKey: this.normalizeKey(chapterKey),
      chapterTitle,
      updatedAt: Date.now(),
      units: {},
    };

    if (chapterTitle) {
      existing.chapterTitle = chapterTitle;
    }

    for (const u of units) {
      if (u.translatedText && u.status === 'done') {
        existing.units[u.id] = {
          translatedText: u.translatedText,
          isSatisfied: Boolean(u.isSatisfied ?? existing.units[u.id]?.isSatisfied),
          isCustomEdited: Boolean(u.isCustomEdited ?? existing.units[u.id]?.isCustomEdited),
          provider: u.provider || existing.units[u.id]?.provider,
          updatedAt: Date.now(),
        };
      }
    }
    existing.updatedAt = Date.now();

    try {
      localStorage.setItem(key, JSON.stringify(existing));
    } catch (err) {
      console.warn('[TranslationStorage] 保存整章译文失败:', err);
    }
  }

  /**
   * 切换单个段落的满意（采纳）状态，返回切换后的状态
   */
  public static toggleSatisfied(chapterKey: string, unitId: string, satisfied?: boolean): boolean {
    if (typeof localStorage === 'undefined') return false;
    const stored = this.loadChapter(chapterKey);
    if (!stored || !stored.units[unitId]) return false;

    const current = stored.units[unitId].isSatisfied;
    const nextVal = satisfied !== undefined ? satisfied : !current;
    stored.units[unitId].isSatisfied = nextVal;
    stored.units[unitId].updatedAt = Date.now();
    stored.updatedAt = Date.now();

    try {
      localStorage.setItem(this.getStorageKey(chapterKey), JSON.stringify(stored));
    } catch {}

    return nextVal;
  }

  /**
   * 保存读者手动微调/精修的译文（自动标记为满意）
   */
  public static updateCustomTranslation(chapterKey: string, unitId: string, customText: string): void {
    if (typeof localStorage === 'undefined') return;
    const stored = this.loadChapter(chapterKey) || {
      chapterKey: this.normalizeKey(chapterKey),
      updatedAt: Date.now(),
      units: {},
    };

    const prev = stored.units[unitId] || {
      translatedText: customText,
      updatedAt: Date.now(),
    };

    stored.units[unitId] = {
      ...prev,
      translatedText: customText,
      isCustomEdited: true,
      isSatisfied: true, // 用户精修过的译文默认视为满意
      updatedAt: Date.now(),
    };
    stored.updatedAt = Date.now();

    try {
      localStorage.setItem(this.getStorageKey(chapterKey), JSON.stringify(stored));
    } catch {}
  }

  /**
   * 一键将当前所有已翻译段落标记为满意
   */
  public static markAllSatisfied(chapterKey: string, units: ParagraphUnit[]): void {
    if (typeof localStorage === 'undefined') return;
    const stored = this.loadChapter(chapterKey) || {
      chapterKey: this.normalizeKey(chapterKey),
      updatedAt: Date.now(),
      units: {},
    };

    for (const unit of units) {
      if (unit.translatedText && unit.status === 'done') {
        unit.isSatisfied = true;
        if (!stored.units[unit.id]) {
          stored.units[unit.id] = {
            translatedText: unit.translatedText,
            isSatisfied: true,
            provider: unit.provider,
            updatedAt: Date.now(),
          };
        } else {
          stored.units[unit.id].isSatisfied = true;
          stored.units[unit.id].updatedAt = Date.now();
        }
      }
    }
    stored.updatedAt = Date.now();

    try {
      localStorage.setItem(this.getStorageKey(chapterKey), JSON.stringify(stored));
    } catch {}
  }

  /**
   * 获取指定章节标记为满意的段落数量
   */
  public static getSatisfiedCount(chapterKey?: string): number {
    const stored = this.loadChapter(chapterKey);
    if (!stored || !stored.units) return 0;
    return Object.values(stored.units).filter((u) => Boolean(u.isSatisfied)).length;
  }

  /**
   * 清除指定章节的翻译缓存
   */
  public static clearChapter(chapterKey?: string): void {
    if (typeof localStorage === 'undefined') return;
    const key = this.getStorageKey(chapterKey || '');
    try {
      localStorage.removeItem(key);
    } catch {}
  }


  /**
   * 获取当前全局译文呈现方式 ('sidebar' | 'inline')
   */
  public static getDisplayMode(): TranslationDisplayMode {
    if (typeof localStorage === 'undefined') return DEFAULT_TRANSLATION_DISPLAY_MODE;
    try {
      const mode = localStorage.getItem(TRANSLATION_DISPLAY_MODE_KEY);
      if (mode === 'sidebar' || mode === 'inline') return mode;
    } catch {}
    return DEFAULT_TRANSLATION_DISPLAY_MODE;
  }

  /**
   * 设置并持久化全局译文呈现方式，并派发全局同步事件
   */
  public static setDisplayMode(mode: TranslationDisplayMode): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(TRANSLATION_DISPLAY_MODE_KEY, mode);
    } catch {}
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent(TRANSLATION_DISPLAY_MODE_CHANGE_EVENT, { detail: { mode } })
      );
    }
  }

  /**
   * 获取当前全局翻译服务商 ('google' | 'bupt' | 'gemini' 等)
   */
  public static getProvider(): TranslationProviderId {
    if (typeof localStorage === 'undefined') return DEFAULT_TRANSLATION_PROVIDER;
    try {
      const p = localStorage.getItem(TRANSLATION_PROVIDER_KEY) as TranslationProviderId | null;
      if (p && ['google', 'gemini', 'bupt', 'deepseek', 'custom'].includes(p)) {
        return p === 'deepseek' ? 'bupt' : p;
      }
    } catch {}
    return DEFAULT_TRANSLATION_PROVIDER;
  }

  /**
   * 设置并持久化全局翻译服务商，并派发全局同步事件
   */
  public static setProvider(provider: TranslationProviderId): void {
    if (typeof localStorage === 'undefined') return;
    const normalized = provider === 'deepseek' ? 'bupt' : provider;
    const prev = this.getProvider();
    try {
      localStorage.setItem(TRANSLATION_PROVIDER_KEY, normalized);
    } catch {}
    if (prev !== normalized && typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent(TRANSLATION_PROVIDER_CHANGE_EVENT, { detail: { provider: normalized } })
      );
    }
  }
}

