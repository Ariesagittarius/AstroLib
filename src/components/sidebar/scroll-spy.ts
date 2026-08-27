export function visibleContentRight(el: Element): number {
  let max = el.getBoundingClientRect().right;
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_ELEMENT, {
    acceptNode(node) {
      if ((node as Element).namespaceURI === 'http://www.w3.org/2000/svg') return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  while (walker.nextNode()) {
    const n = walker.currentNode as Element;
    const r = n.getBoundingClientRect();
    if (r.width > 0 && r.right > max) max = r.right;
  }
  el.querySelectorAll('svg').forEach((svg) => {
    const r = svg.getBoundingClientRect();
    if (r.width > 0 && r.right > max) max = r.right;
  });
  return max;
}

export function tameOverflowingInlineMath(): void {
  const main = document.querySelector('main');
  if (!main) return;

  if (!window.matchMedia('(max-width: 1024px)').matches) return;

  const lineSelector = [
    '.sl-markdown-content',
    '.card-body',
    '.card-header',
    '.solution-content',
    '.analysis-content',
    '.note-content',
    '.fallback-content',
    '.fallback-header',
    '.guide-content',
    '.guide-header',
    '.question-stem',
    '.option-chip-content',
  ].join(', ');

  main.querySelectorAll('.katex:not(.katex-display .katex)').forEach((el) => {
    if (el.classList.contains('katex-scroll-capsule')) return;
    const line = el.closest(lineSelector);
    if (!line) return;
    if (visibleContentRight(el) > line.getBoundingClientRect().right + 1) {
      el.classList.add('katex-scroll-capsule');
    }
  });
}
