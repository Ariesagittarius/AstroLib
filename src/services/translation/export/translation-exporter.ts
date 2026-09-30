/**
 * src/services/translation/export/translation-exporter.ts
 * ============================================================================
 * AstroLib 双语助读多格式导出器 (Headless Translation Exporter)
 * ============================================================================
 * 职责：
 * 1. 独立纯函数/无头编译器，遵循 Rule 2 (Publishing is independent)；
 * 2. 支持导出为双语对照 Markdown (.md)、纯中文排版 Markdown (.md)、
 *    双语对照文本 (.txt) 以及结构化数据 (.json)；
 * 3. 支持「全量段落」与「仅已采纳/满意段落」两种导出范围筛选；
 * 4. 驱动浏览器端原生无服务器无痛文件下载 (Blob Stream)。
 * ============================================================================
 */

import type { ParagraphUnit, TranslationExportFormat, TranslationExportOptions } from '../types.ts';

export class TranslationExporter {
  /**
   * 格式化并生成导出文件内容
   */
  public static generateExport(
    units: ParagraphUnit[],
    options: TranslationExportOptions
  ): { filename: string; content: string; mimeType: string } {
    const title = options.chapterTitle || 'AstroLib-Chapter-Translation';
    const dateStr = new Date().toISOString().slice(0, 10);
    const safeTitle = title.replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, '_').trim();
    const filterTag = options.onlySatisfied ? '-Satisfied' : '';

    const targetUnits = options.onlySatisfied
      ? units.filter((u) => Boolean(u.isSatisfied && u.translatedText && u.status === 'done'))
      : units.filter((u) => Boolean(u.translatedText && u.status === 'done'));

    switch (options.format) {
      case 'bilingual-markdown': {
        const content = this.exportAsBilingualMarkdown(targetUnits, options);
        return {
          filename: `${safeTitle}-Bilingual${filterTag}-${dateStr}.md`,
          content,
          mimeType: 'text/markdown;charset=utf-8',
        };
      }
      case 'chinese-markdown': {
        const content = this.exportAsChineseMarkdown(targetUnits, options);
        return {
          filename: `${safeTitle}-Chinese${filterTag}-${dateStr}.md`,
          content,
          mimeType: 'text/markdown;charset=utf-8',
        };
      }
      case 'bilingual-text': {
        const content = this.exportAsBilingualText(targetUnits, options);
        return {
          filename: `${safeTitle}-Bilingual${filterTag}-${dateStr}.txt`,
          content,
          mimeType: 'text/plain;charset=utf-8',
        };
      }
      case 'json': {
        const content = this.exportAsJson(targetUnits, options);
        return {
          filename: `${safeTitle}-Translation${filterTag}-${dateStr}.json`,
          content,
          mimeType: 'application/json;charset=utf-8',
        };
      }
      default: {
        const content = this.exportAsBilingualMarkdown(targetUnits, options);
        return {
          filename: `${safeTitle}-Bilingual${filterTag}-${dateStr}.md`,
          content,
          mimeType: 'text/markdown;charset=utf-8',
        };
      }
    }
  }

  /**
   * 导出为高质量双语对照 Markdown (.md)
   * 体例：英文原文在上，中文译文在下（或引用块包裹），保留完整 KaTeX 公式与代码结构
   */
  public static exportAsBilingualMarkdown(
    units: ParagraphUnit[],
    options: { chapterTitle?: string; onlySatisfied?: boolean }
  ): string {
    const title = options.chapterTitle || '章节双语助读对照';
    const lines: string[] = [];

    lines.push(`# ${title} (中英双语对照)`);
    lines.push('');
    lines.push(`> 导出时间：${new Date().toLocaleString('zh-CN')}  `);
    lines.push(`> 篇幅统计：共 ${units.length} 个对照单元${options.onlySatisfied ? ' (仅读者满意/采纳段落)' : ''}  `);
    lines.push(`> 出处平台：AstroLib 理工科数字化教材系统`);
    lines.push('');
    lines.push('---');
    lines.push('');

    if (units.length === 0) {
      lines.push('*（当前筛选条件下暂无已翻译段落）*');
      return lines.join('\n');
    }

    for (const u of units) {
      const transText = (u.translatedText || u.sourceText).trim();
      const srcText = u.sourceText.trim();
      const statusBadge = u.isCustomEdited ? ' *(★ 读者精修)*' : u.isSatisfied ? ' *(★ 满意采纳)*' : '';

      if (u.type === 'heading') {
        lines.push(`### ${srcText}`);
        lines.push(`> **【译】** ${transText}${statusBadge}`);
        lines.push('');
      } else if (u.type === 'math') {
        lines.push(srcText);
        lines.push('');
        if (transText && transText !== srcText) {
          lines.push(`> **【公式释义】** ${transText}${statusBadge}`);
          lines.push('');
        }
      } else if (u.type === 'code') {
        lines.push(srcText);
        lines.push('');
        if (transText && transText !== srcText) {
          lines.push(`> **【算法说明】** ${transText}${statusBadge}`);
          lines.push('');
        }
      } else {
        lines.push(srcText);
        lines.push('');
        lines.push(`${transText}${statusBadge}`);
        lines.push('');
        lines.push('---');
        lines.push('');
      }
    }

    return lines.join('\n');
  }

  /**
   * 导出为纯中文排版 Markdown (.md)
   * 体例：通篇标准中文教材，保留原始公式与结构
   */
  public static exportAsChineseMarkdown(
    units: ParagraphUnit[],
    options: { chapterTitle?: string; onlySatisfied?: boolean }
  ): string {
    const title = options.chapterTitle || '章节中文译文';
    const lines: string[] = [];

    lines.push(`# ${title}`);
    lines.push('');
    lines.push(`> 导出时间：${new Date().toLocaleString('zh-CN')}  `);
    lines.push(`> 出处平台：AstroLib 理工科数字化教材系统`);
    lines.push('');
    lines.push('---');
    lines.push('');

    if (units.length === 0) {
      lines.push('*（当前筛选条件下暂无已翻译段落）*');
      return lines.join('\n');
    }

    for (const u of units) {
      const transText = (u.translatedText || u.sourceText).trim();

      if (u.type === 'heading') {
        lines.push(`## ${transText}`);
        lines.push('');
      } else {
        lines.push(transText);
        lines.push('');
      }
    }

    return lines.join('\n');
  }

  /**
   * 导出为双语对齐纯文本 (.txt)
   */
  public static exportAsBilingualText(
    units: ParagraphUnit[],
    options: { chapterTitle?: string; onlySatisfied?: boolean }
  ): string {
    const title = options.chapterTitle || '章节双语对照';
    const lines: string[] = [];

    lines.push(`================================================================`);
    lines.push(`${title} (中英双语对照)`);
    lines.push(`导出时间: ${new Date().toLocaleString('zh-CN')}`);
    lines.push(`段落总数: ${units.length}`);
    lines.push(`================================================================`);
    lines.push('');

    units.forEach((u, i) => {
      const transText = (u.translatedText || u.sourceText).trim();
      const srcText = u.sourceText.trim();
      const statusMark = u.isCustomEdited ? ' [★ 读者精修]' : u.isSatisfied ? ' [★ 已采纳]' : '';

      lines.push(`[${i + 1}] 原文:`);
      lines.push(srcText);
      lines.push('');
      lines.push(`[${i + 1}] 译文${statusMark}:`);
      lines.push(transText);
      lines.push('');
      lines.push('----------------------------------------------------------------');
      lines.push('');
    });

    return lines.join('\n');
  }

  /**
   * 导出为结构化 JSON 数据 (.json)
   */
  public static exportAsJson(
    units: ParagraphUnit[],
    options: { chapterTitle?: string; onlySatisfied?: boolean }
  ): string {
    const payload = {
      chapterTitle: options.chapterTitle || 'AstroLib-Chapter',
      exportedAt: new Date().toISOString(),
      generator: 'AstroLib Translation Exporter',
      totalCount: units.length,
      onlySatisfied: Boolean(options.onlySatisfied),
      units: units.map((u) => ({
        id: u.id,
        index: u.index,
        type: u.type,
        sourceText: u.sourceText,
        translatedText: u.translatedText || u.sourceText,
        isSatisfied: Boolean(u.isSatisfied),
        isCustomEdited: Boolean(u.isCustomEdited),
        provider: u.provider,
        updatedAt: u.updatedAt,
      })),
    };

    return JSON.stringify(payload, null, 2);
  }

  /**
   * 驱动浏览器下载文件
   */
  public static downloadFile(filename: string, content: string, mimeType: string = 'text/markdown;charset=utf-8'): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    try {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);
    } catch (err) {
      console.error('[TranslationExporter] 下载文件失败:', err);
    }
  }
}
