import { formatMultipleChoiceQuestions } from '../components/sidebar/question-formatter';

const ARROW_SVG = `<svg class="badge-svg badge-arrow-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17l9.2-9.2M17 17V8H8"/></svg>`;

function preInjectBadgeArrows(root: ParentNode): void {
  root.querySelectorAll('.block-ref-badge, .fig-ref-badge').forEach((badge) => {
    if (badge.querySelector('.block-arrow') || badge.querySelector('.fig-arrow')) return;

    const isFig = badge.classList.contains('fig-ref-badge');
    const arrow = document.createElement('span');
    arrow.className = isFig ? 'fig-arrow' : 'block-arrow';
    arrow.innerHTML = ARROW_SVG;
    badge.appendChild(arrow);
  });
}

function preWrapFormulaHosts(root: ParentNode): void {

  const inlineFormulas = root.querySelectorAll(
    '.katex[data-latex]:not(.katex-display .katex):not(.katex-display)'
  );

  inlineFormulas.forEach((katex) => {

    const parent = katex.parentElement;
    if (parent && parent.classList.contains('katex-copy-host')) return;

    const host = document.createElement('span');
    host.className = 'katex-copy-host';
    katex.before(host);
    host.appendChild(katex);
  });
}

export function preprocessPage(mainPane: ParentNode): void {

  formatMultipleChoiceQuestions(mainPane);

  preInjectBadgeArrows(mainPane);

  preWrapFormulaHosts(mainPane);
}
