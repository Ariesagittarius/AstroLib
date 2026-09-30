/**
 * src/services/translation/paragraph-aligner.ts
 * ============================================================================
 * AstroLib 段落对齐与双向联动引擎 (Paragraph Aligner & Bidirectional Linker)
 * ============================================================================
 * 核心职责：
 * 1. 从正文 DOM 或 Markdown 文本中提取离散的段落单元（ParagraphUnit）；
 * 2. 保证每个段落具备唯一的索引与标识（data-trans-id="p-0", "p-1"...）；
 * 3. 驱动正文段落与右侧侧载栏（Sideload Dock）翻译卡片之间的双向联动：
 *    - 侧载卡片悬浮 (Hover) -> 正文对应段落微光高亮 (Highlight)；
 *    - 侧载卡片点击 (Click) -> 正文平滑定位滚动至视口中央 (Scroll-into-view)；
 *    - 正文滚动阅读 (IntersectionObserver) -> 侧载栏同步高亮当前聚焦段落。
 * ============================================================================
 */

import type { ParagraphUnit } from './types.ts';

export class ParagraphAligner {
  /**
   * 从纯 Markdown/MDX 文本中分块提取段落（可用于构建期或预编译）
   */
  static extractFromMarkdown(markdown: string): ParagraphUnit[] {
    if (!markdown) return [];

    // 剔除 Frontmatter 与 import 声明
    const body = markdown
      .replace(/^---[\r\n]+[\s\S]*?[\r\n]+---(?:\r?\n)?/, '')
      .replace(/^(?:import\s+[\s\S]*?from\s+['"][^'"]+['"];?|import\s+['"][^'"]+['"];?)\s*$/gm, '');

    // 双换行分段切分（保留卡片与公式块完整性）
    const rawBlocks = body.split(/\n\s*\n/);
    const units: ParagraphUnit[] = [];
    let index = 0;

    for (const raw of rawBlocks) {
      const trimmed = raw.trim();
      if (!trimmed) continue;

      let type: ParagraphUnit['type'] = 'paragraph';
      if (trimmed.startsWith('#')) {
        type = 'heading';
      } else if (trimmed.startsWith('$$')) {
        type = 'math';
      } else if (trimmed.startsWith('```')) {
        type = 'code';
      } else if (trimmed.startsWith('>')) {
        type = 'quote';
      } else if (trimmed.startsWith('<')) {
        type = 'card';
      }

      units.push({
        id: `p-${index}`,
        type,
        index,
        sourceText: trimmed,
        status: 'idle',
      });
      index++;
    }

    return units;
  }

  /**
   * 从客户端文章容器 DOM 提取所有可读段落单元并赋予 data-trans-id 标记
   */
  static extractFromArticleDom(container: HTMLElement): ParagraphUnit[] {
    if (!container) return [];

    const units: ParagraphUnit[] = [];
    // 选取正文中所有顶层核心阅读语义块
    const selector = [
      'h1',
      'h2',
      'h3',
      'h4',
      'p',
      'blockquote',
      '.katex-display',
      'pre',
      '.knowledge-card',
      '.example-card',
      '.variant-card',
      '.method-card',
      '.exercise-card',
    ].join(', ');

    const elements = container.querySelectorAll<HTMLElement>(selector);
    let index = 0;

    elements.forEach((el) => {
      // 避免选取卡片内部嵌套的子段落，以及已经存在的行内翻译块
      if (el.closest('.trans-inline-block')) {
        return;
      }
      if (el.parentElement && el.parentElement.closest('.knowledge-card, .example-card, .variant-card, .exercise-card')) {
        return;
      }


      const text = this.getElementTextWithFormulas(el);
      if (!text || text.length < 2) return;

      const transId = `p-${index}`;
      el.setAttribute('data-trans-id', transId);
      el.classList.add('trans-source-block');

      let type: ParagraphUnit['type'] = 'paragraph';
      const tagName = el.tagName.toLowerCase();
      if (tagName.startsWith('h')) type = 'heading';
      else if (el.classList.contains('katex-display')) type = 'math';
      else if (tagName === 'pre') type = 'code';
      else if (tagName === 'blockquote') type = 'quote';
      else if (el.classList.contains('knowledge-card') || el.classList.contains('example-card')) type = 'card';

      units.push({
        id: transId,
        type,
        index,
        sourceText: text,
        status: 'idle',
      });
      index++;
    });

    return units;
  }

  /**
   * 绑定正文与侧载对照卡片的双向高亮与平滑定位滚动
   */
  static bindBidirectionalSync(
    articleContainer: HTMLElement,
    dockContainer: HTMLElement,
    onActiveChange?: (activeId: string) => void
  ): () => void {
    const cleanupFns: Array<() => void> = [];

    // 1. 侧载卡片事件监听
    const handleDockMouseOver = (e: MouseEvent) => {
      const card = (e.target as HTMLElement).closest<HTMLElement>('[data-trans-card-id]');
      if (!card) return;
      const transId = card.getAttribute('data-trans-card-id');
      if (transId) {
        this.highlightSourceBlock(articleContainer, transId, true);
      }
    };

    const handleDockMouseOut = (e: MouseEvent) => {
      const card = (e.target as HTMLElement).closest<HTMLElement>('[data-trans-card-id]');
      if (!card) return;
      const transId = card.getAttribute('data-trans-card-id');
      if (transId) {
        this.highlightSourceBlock(articleContainer, transId, false);
      }
    };

    const handleDockClick = (e: MouseEvent) => {
      const card = (e.target as HTMLElement).closest<HTMLElement>('[data-trans-card-id]');
      if (!card) return;
      const transId = card.getAttribute('data-trans-card-id');
      if (transId) {
        this.scrollToSourceBlock(articleContainer, transId);
        if (onActiveChange) onActiveChange(transId);
      }
    };

    dockContainer.addEventListener('mouseover', handleDockMouseOver);
    dockContainer.addEventListener('mouseout', handleDockMouseOut);
    dockContainer.addEventListener('click', handleDockClick);

    cleanupFns.push(() => {
      dockContainer.removeEventListener('mouseover', handleDockMouseOver);
      dockContainer.removeEventListener('mouseout', handleDockMouseOut);
      dockContainer.removeEventListener('click', handleDockClick);
    });

    // 2. 正文段落事件监听 (Hover 回溯高亮侧载对应卡片)
    const handleArticleMouseOver = (e: MouseEvent) => {
      const block = (e.target as HTMLElement).closest<HTMLElement>('[data-trans-id]');
      if (!block) return;
      const transId = block.getAttribute('data-trans-id');
      if (transId) {
        this.highlightDockCard(dockContainer, transId, true);
      }
    };

    const handleArticleMouseOut = (e: MouseEvent) => {
      const block = (e.target as HTMLElement).closest<HTMLElement>('[data-trans-id]');
      if (!block) return;
      const transId = block.getAttribute('data-trans-id');
      if (transId) {
        this.highlightDockCard(dockContainer, transId, false);
      }
    };

    articleContainer.addEventListener('mouseover', handleArticleMouseOver);
    articleContainer.addEventListener('mouseout', handleArticleMouseOut);

    cleanupFns.push(() => {
      articleContainer.removeEventListener('mouseover', handleArticleMouseOver);
      articleContainer.removeEventListener('mouseout', handleArticleMouseOut);
    });

    return () => {
      cleanupFns.forEach((fn) => fn());
    };
  }

  private static highlightSourceBlock(container: HTMLElement, transId: string, active: boolean): void {
    const el = container.querySelector<HTMLElement>(`[data-trans-id="${transId}"]`);
    if (el) {
      if (active) {
        el.classList.add('astrolib-trans-highlight');
      } else {
        el.classList.remove('astrolib-trans-highlight');
      }
    }
  }

  private static highlightDockCard(dock: HTMLElement, transId: string, active: boolean): void {
    const card = dock.querySelector<HTMLElement>(`[data-trans-card-id="${transId}"]`);
    if (card) {
      if (active) {
        card.classList.add('astrolib-card-highlight');
      } else {
        card.classList.remove('astrolib-card-highlight');
      }
    }
  }

  private static scrollToSourceBlock(container: HTMLElement, transId: string): void {
    const el = container.querySelector<HTMLElement>(`[data-trans-id="${transId}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('astrolib-trans-pulse');
      setTimeout(() => {
        el.classList.remove('astrolib-trans-pulse');
      }, 1500);
    }
  }

  /**
   * 从带有 KaTeX 的 DOM 元素中提取保留公式语法的文本内容
   */
  private static getElementTextWithFormulas(el: HTMLElement): string {
    // 若元素携带 data-latex (由 rehype-katex-source 回填)，优先提取原生 LaTeX
    const clone = el.cloneNode(true) as HTMLElement;

    // 针对行内公式替换为 $data-latex$
    clone.querySelectorAll<HTMLElement>('.katex[data-latex], [data-latex]').forEach((kEl) => {
      const latex = kEl.getAttribute('data-latex') || '';
      const isDisplay = kEl.classList.contains('katex-display') || kEl.getAttribute('data-display') === 'true';
      const replacement = document.createTextNode(isDisplay ? `\n$$${latex}$$\n` : ` $${latex}$ `);
      kEl.parentNode?.replaceChild(replacement, kEl);
    });

    return clone.textContent?.trim() || '';
  }
}
