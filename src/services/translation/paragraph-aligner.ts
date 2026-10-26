import type { ParagraphUnit } from './types.ts';

export class ParagraphAligner {

  static extractFromMarkdown(markdown: string): ParagraphUnit[] {
    if (!markdown) return [];

    const body = markdown
      .replace(/^---[\r\n]+[\s\S]*?[\r\n]+---(?:\r?\n)?/, '')
      .replace(/^(?:import\s+[\s\S]*?from\s+['"][^'"]+['"];?|import\s+['"][^'"]+['"];?)\s*$/gm, '');

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

  static extractFromArticleDom(container: HTMLElement): ParagraphUnit[] {
    if (!container) return [];

    const units: ParagraphUnit[] = [];
    const cardSelector = '.knowledge-card, .example-card, .variant-card, .method-card, .summary-card, .exercise-card';
    const selector = [
      'h1',
      'h2',
      'h3',
      'h4',
      'p',
      'blockquote',
      'th',
      'td',
      cardSelector,
    ].join(', ');

    const elements = container.querySelectorAll<HTMLElement>(selector);
    let index = 0;

    elements.forEach((el) => {

      if (el.closest?.('.trans-inline-block')) {
        return;
      }

      const parentCard = el.closest?.<HTMLElement>(cardSelector);
      if (parentCard && parentCard !== el) {
        return;
      }

      if (this.isCardElement(el)) {

        const headerEl = el.querySelector<HTMLElement>('.card-header');
        const titleText = el.getAttribute('data-title')?.trim() || (headerEl ? this.getElementTextWithFormulas(headerEl, true) : '');

        if (headerEl && titleText && titleText.length >= 1) {
          const transId = `p-${index}`;
          headerEl.setAttribute('data-trans-id', transId);
          headerEl.setAttribute('data-trans-card-title', 'true');
          headerEl.classList.add('trans-source-block');

          units.push({
            id: transId,
            type: 'card-title',
            index,
            sourceText: titleText,
            status: 'idle',
          });
          index++;
        }

        const bodyEl = el.querySelector<HTMLElement>('.card-body');
        if (bodyEl) {

          const bodyParas = Array.from(bodyEl.querySelectorAll<HTMLElement>('p, blockquote, th, td')).filter(
            (p) => {
              if (p.closest('.katex-display') || p.closest('pre') || p.closest('.trans-inline-block')) {
                return false;
              }
              const pTag = p.tagName.toLowerCase();
              if (pTag === 'p' && p.closest('th, td')) return false;
              if (pTag === 'th' || pTag === 'td') {
                if (p.querySelector('th, td')) return false;
              }
              return true;
            }
          );

          if (bodyParas.length > 0) {
            bodyParas.forEach((p) => {
              const pTag = p.tagName.toLowerCase();
              const isCell = pTag === 'th' || pTag === 'td';
              const text = this.getElementTextWithFormulas(p);
              if (!text || text.length < 2) return;
              if (isCell && !/[a-zA-Z\u4e00-\u9fa5]/.test(text)) return;

              const transId = `p-${index}`;
              p.setAttribute('data-trans-id', transId);
              if (isCell) p.setAttribute('data-trans-kind', 'table-cell');
              p.classList.add('trans-source-block');

              units.push({
                id: transId,
                type: isCell ? 'table-cell' : 'paragraph',
                index,
                sourceText: text,
                status: 'idle',
              });
              index++;
            });
          } else {

            const text = this.getElementTextWithFormulas(bodyEl);
            if (text && text.length >= 2) {
              const transId = `p-${index}`;
              bodyEl.setAttribute('data-trans-id', transId);
              bodyEl.classList.add('trans-source-block');

              units.push({
                id: transId,
                type: 'paragraph',
                index,
                sourceText: text,
                status: 'idle',
              });
              index++;
            }
          }
        }
        return;
      }

      const tagName = el.tagName.toLowerCase();
      if (
        tagName === 'pre' ||
        Boolean(el.classList?.contains('katex-display')) ||
        el.closest?.('.katex-display') ||
        el.closest?.('pre')
      ) {
        return;
      }

      if (tagName === 'p' && el.closest?.('th, td')) {
        return;
      }

      if (tagName === 'th' || tagName === 'td') {
        if (el.querySelector('th, td')) {
          return;
        }

        const text = this.getElementTextWithFormulas(el);
        if (!text || text.length < 2) return;

        if (!/[a-zA-Z\u4e00-\u9fa5]/.test(text)) return;

        const transId = `p-${index}`;
        el.setAttribute('data-trans-id', transId);
        el.setAttribute('data-trans-kind', 'table-cell');
        el.classList.add('trans-source-block');

        units.push({
          id: transId,
          type: 'table-cell',
          index,
          sourceText: text,
          status: 'idle',
        });
        index++;
        return;
      }

      const text = this.getElementTextWithFormulas(el);
      if (!text || text.length < 2) return;

      const transId = `p-${index}`;
      el.setAttribute('data-trans-id', transId);
      el.classList.add('trans-source-block');

      let type: ParagraphUnit['type'] = 'paragraph';
      if (tagName.startsWith('h')) type = 'heading';
      else if (tagName === 'blockquote') type = 'quote';

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

  private static isCardElement(el: HTMLElement): boolean {
    if (el.matches?.('.knowledge-card, .example-card, .variant-card, .method-card, .summary-card, .exercise-card')) {
      return true;
    }
    const cls = el.className || '';
    return (
      typeof cls === 'string' &&
      (cls.includes('knowledge-card') ||
        cls.includes('example-card') ||
        cls.includes('variant-card') ||
        cls.includes('method-card') ||
        cls.includes('summary-card') ||
        cls.includes('exercise-card'))
    );
  }

  static bindBidirectionalSync(
    articleContainer: HTMLElement,
    dockContainer: HTMLElement,
    onActiveChange?: (activeId: string) => void
  ): () => void {
    const cleanupFns: Array<() => void> = [];

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

  private static getElementTextWithFormulas(el: HTMLElement, isHeader = false): string {

    const clone = typeof el.cloneNode === 'function' ? (el.cloneNode(true) as HTMLElement) : el;

    if (clone.querySelectorAll) {

      if (isHeader) {
        clone.querySelectorAll<HTMLElement>('.card-mdicon, svg, [aria-hidden="true"]').forEach((icon) => icon.remove?.());
      }

      clone.querySelectorAll<HTMLElement>('.katex[data-latex], [data-latex]').forEach((kEl) => {
        const latex = kEl.getAttribute('data-latex') || '';
        const isDisplay = kEl.classList.contains('katex-display') || kEl.getAttribute('data-display') === 'true';
        const replacement = document.createTextNode(isDisplay ? `\n$$${latex}$$\n` : ` $${latex}$ `);
        kEl.parentNode?.replaceChild(replacement, kEl);
      });
    }

    return clone.textContent?.trim() || '';
  }
}
