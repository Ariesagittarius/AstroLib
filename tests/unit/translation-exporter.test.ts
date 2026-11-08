import { describe, it, expect } from 'vitest';
import { TranslationExporter } from '@/services/translation/export/translation-exporter.ts';
import type { ParagraphUnit } from '@/services/translation/types.ts';

describe('TranslationExporter Suite', () => {
  const mockUnits: ParagraphUnit[] = [
    {
      id: 'p-0',
      type: 'heading',
      index: 0,
      sourceText: '## 1.1 Vector Spaces',
      translatedText: '## 1.1 向量空间',
      status: 'done',
      isSatisfied: true,
    },
    {
      id: 'p-1',
      type: 'paragraph',
      index: 1,
      sourceText: 'A vector space $V$ over a field $F$ is a set with two operations.',
      translatedText: '域 $F$ 上的向量空间 $V$ 是配备两种代数运算的集合。',
      status: 'done',
      isSatisfied: true,
      isCustomEdited: true,
    },
    {
      id: 'p-2',
      type: 'math',
      index: 2,
      sourceText: '$$\\mathbf{u} + \\mathbf{v} = \\mathbf{v} + \\mathbf{u}$$',
      translatedText: '$$\\mathbf{u} + \\mathbf{v} = \\mathbf{v} + \\mathbf{u}$$',
      status: 'done',
      isSatisfied: false,
    },
  ];

  it('应正确导出双语 Markdown (.md) 格式并包含公式与采纳标记', () => {
    const res = TranslationExporter.generateExport(mockUnits, {
      format: 'bilingual-markdown',
      chapterTitle: 'Linear Algebra Ch01',
      onlySatisfied: false,
    });

    expect(res.mimeType).toBe('text/markdown;charset=utf-8');
    expect(res.filename).toContain('Linear_Algebra_Ch01-Bilingual-');
    expect(res.filename.endsWith('.md')).toBe(true);

    expect(res.content).toContain('# Linear Algebra Ch01 (中英双语对照)');
    expect(res.content).toContain('Vector Spaces');
    expect(res.content).toContain('【译】');
    expect(res.content).toContain('*(★ 读者精修)*');
    expect(res.content).toContain('$$\\mathbf{u} + \\mathbf{v} = \\mathbf{v} + \\mathbf{u}$$');
  });

  it('应在勾选 onlySatisfied 时只导出满意/采纳的段落', () => {
    const res = TranslationExporter.generateExport(mockUnits, {
      format: 'bilingual-markdown',
      chapterTitle: 'Linear Algebra Ch01',
      onlySatisfied: true,
    });

    expect(res.filename).toContain('-Satisfied-');

    expect(res.content).toContain('向量空间');
    expect(res.content).toContain('篇幅统计：共 2 个对照单元 (仅读者满意/采纳段落)');
    expect(res.content).not.toContain('$$\\mathbf{u} + \\mathbf{v} = \\mathbf{v} + \\mathbf{u}$$');
  });

  it('应正确导出纯中文排版 Markdown (.md) 格式', () => {
    const res = TranslationExporter.generateExport(mockUnits, {
      format: 'chinese-markdown',
      chapterTitle: '向量代数基础',
      onlySatisfied: false,
    });

    expect(res.mimeType).toBe('text/markdown;charset=utf-8');
    expect(res.filename).toContain('向量代数基础-Chinese-');
    expect(res.content).toContain('# 向量代数基础');
    expect(res.content).toContain('## 1.1 向量空间');
    expect(res.content).toContain('域 $F$ 上的向量空间 $V$ 是配备两种代数运算的集合。');

    expect(res.content).not.toContain('(中英双语对照)');
  });

  it('应正确导出双语对齐纯文本 (.txt) 格式', () => {
    const res = TranslationExporter.generateExport(mockUnits, {
      format: 'bilingual-text',
      chapterTitle: 'Vector Spaces',
      onlySatisfied: false,
    });

    expect(res.mimeType).toBe('text/plain;charset=utf-8');
    expect(res.filename.endsWith('.txt')).toBe(true);
    expect(res.content).toContain('[1] 原文:');
    expect(res.content).toContain('[1] 译文 [★ 已采纳]:');
    expect(res.content).toContain('[2] 译文 [★ 读者精修]:');
  });

  it('应正确导出标准 JSON 结构化数据 (.json) 格式', () => {
    const res = TranslationExporter.generateExport(mockUnits, {
      format: 'json',
      chapterTitle: 'Vector Spaces',
      onlySatisfied: false,
    });

    expect(res.mimeType).toBe('application/json;charset=utf-8');
    expect(res.filename.endsWith('.json')).toBe(true);

    const parsed = JSON.parse(res.content);
    expect(parsed.chapterTitle).toBe('Vector Spaces');
    expect(parsed.totalCount).toBe(3);
    expect(Array.isArray(parsed.units)).toBe(true);
    expect(parsed.units[0].id).toBe('p-0');
    expect(parsed.units[1].isCustomEdited).toBe(true);
  });
});
