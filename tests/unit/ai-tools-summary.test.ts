import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getAiCollapseToolsSummary,
  saveAiCollapseToolsSummary,
  getEffectiveAiClientConfig,
  formatExplorationSummary,
} from '@/ai/ai-config.ts';

describe('AI Tools Exploration Summary & Auto-collapse (Unit Tests)', () => {
  const store = new Map<string, string>();

  beforeEach(() => {
    store.clear();
    (globalThis as any).localStorage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => store.set(k, String(v)),
      removeItem: (k: string) => store.delete(k),
      clear: () => store.clear(),
    };
  });

  afterEach(() => {
    delete (globalThis as any).localStorage;
  });

  describe('formatExplorationSummary', () => {
    it('should return empty string when tools list is empty or invalid', () => {
      expect(formatExplorationSummary([])).toBe('');
      expect(formatExplorationSummary(null as any)).toBe('');
      expect(formatExplorationSummary(undefined as any)).toBe('');
    });

    it('should format single tool exploration accurately', () => {
      expect(formatExplorationSummary([{ name: 'book_retrieve' }])).toBe('已完成 1 步工具探索 (1 次检索)');
      expect(formatExplorationSummary([{ name: 'book_read_section' }])).toBe('已完成 1 步工具探索 (1 段阅读)');
      expect(formatExplorationSummary([{ name: 'book_chapter_outline' }])).toBe('已完成 1 步工具探索 (1 次大纲)');
      expect(formatExplorationSummary([{ name: 'custom_action' }])).toBe('已完成 1 步工具探索 (1 次操作)');
    });

    it('should accurately aggregate multiple mixed tool calls matching Antigravity style', () => {
      const toolLog = [
        { name: 'book_retrieve' },
        { name: 'book_chapter_outline' },
        { name: 'book_read_section' },
        { name: 'book_read_section' },
        { name: 'book_read_section' },
        { name: 'book_slice_search' },
        { name: 'book_slice_search' },
        { name: 'book_slice_search' },
        { name: 'book_chunk' },
        { name: 'book_read_section' },
        { name: 'book_slice_search' },
        { name: 'book_slice_search' },
      ];

      const summary = formatExplorationSummary(toolLog);
      expect(summary).toBe('已完成 12 步工具探索 (6 次检索，5 段阅读，1 次大纲)');
    });
  });

  describe('Collapse Tools Summary Setting & Persistence', () => {
    it('should default to true for optimal reading experience', () => {
      expect(getAiCollapseToolsSummary()).toBe(true);
      const cfg = getEffectiveAiClientConfig();
      expect(cfg.collapseToolsSummary).toBe(true);
    });

    it('should persist false when disabled by user', () => {
      saveAiCollapseToolsSummary(false);
      expect(getAiCollapseToolsSummary()).toBe(false);
      expect(localStorage.getItem('astrolib_ai_collapse_tools_summary')).toBe('false');

      const cfg = getEffectiveAiClientConfig();
      expect(cfg.collapseToolsSummary).toBe(false);
    });

    it('should persist true when re-enabled', () => {
      saveAiCollapseToolsSummary(false);
      expect(getAiCollapseToolsSummary()).toBe(false);

      saveAiCollapseToolsSummary(true);
      expect(getAiCollapseToolsSummary()).toBe(true);
      expect(localStorage.getItem('astrolib_ai_collapse_tools_summary')).toBe('true');
    });
  });
});
