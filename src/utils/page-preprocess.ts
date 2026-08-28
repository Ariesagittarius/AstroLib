/**
 * 离屏预处理管线（Offscreen Pre-processing Pipeline）
 * ============================================================================
 *
 * 在 SPA 路由器 `parseAndCache()` 阶段，对尚未挂载到文档的 `.main-pane`
 * DOM 树执行所有会引起 layout shift 的同步突变操作。这些操作在离屏节点上
 * 运行时不触发浏览器的 layout/paint，因此上屏后用户看到的是最终态，零抖动。
 *
 * 当前预处理项：
 *   1. 选择题格式化（formatMultipleChoiceQuestions）
 *   2. 引用徽章箭头占位预注入（preInjectBadgeArrows）
 *   3. 行内公式操作栏 host 容器预包裹（preWrapFormulaHosts）
 *
 * 设计约束：
 *   · 每项操作都具有幂等守卫，与 `astro:page-load` 后的二次调用完全兼容
 *   · 不挂载事件监听器（事件绑定仍由各模块在上屏后的生命周期中完成）
 *   · 纯 DOM 操作，不依赖 document 上下文（传入的 root 是离屏 DOMParser 产物）
 * ============================================================================
 */

import { formatMultipleChoiceQuestions } from '../components/sidebar/question-formatter';

/**
 * 引用徽章箭头 SVG 模板。
 * 与 cross-ref-client.ts 中的 ARROW_SVG 保持一致。
 */
const ARROW_SVG = `<svg class="badge-svg badge-arrow-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17l9.2-9.2M17 17V8H8"/></svg>`;

/**
 * 为正文中所有静态引用徽章预注入箭头占位 span。
 *
 * 这样在 `upgradeStaticBadges()` 后续升级为 interactive 时，
 * 由于箭头节点已存在（守卫 `badge.querySelector('.block-arrow')`），
 * 不会再次插入新节点，段落文字宽度不变，杜绝折行抖动。
 */
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

/**
 * 为正文中所有带 data-latex 的行内 KaTeX 公式预包裹 `span.katex-copy-host` 容器。
 *
 * mountFormula() 在上屏后执行时，会检查 `root.dataset.katexCopyReady`：
 * 预包裹阶段不设置该标志，因此 mountFormula 仍会正常挂载事件。
 * 但 DOM 结构变更（外层套 host）已在离屏完成，不再引起浏览器重排。
 *
 * 注意：仅包裹非 display 的行内公式（.katex-display 的操作栏是 appendChild，
 * 不改变 DOM 层级结构，不触发 IFC 重排，无需预处理）。
 */
function preWrapFormulaHosts(root: ParentNode): void {
  // 选取所有带 data-latex 的行内 .katex 元素（排除 .katex-display 子元素）
  const inlineFormulas = root.querySelectorAll(
    '.katex[data-latex]:not(.katex-display .katex):not(.katex-display)'
  );

  inlineFormulas.forEach((katex) => {
    // 幂等守卫：已有 host 容器则跳过
    const parent = katex.parentElement;
    if (parent && parent.classList.contains('katex-copy-host')) return;

    const host = document.createElement('span');
    host.className = 'katex-copy-host';
    katex.before(host);
    host.appendChild(katex);
  });
}

/**
 * 离屏预处理入口：在 SPA 路由器缓存前调用，对离屏 DOM 树执行全部首屏突变。
 *
 * @param mainPane  DOMParser 解析得到的 `.main-pane` 节点（尚未挂载到文档）
 */
export function preprocessPage(mainPane: ParentNode): void {
  // 1. 选择题格式化（幂等：已有 .formatted-choices-v3 类的卡片自动跳过）
  formatMultipleChoiceQuestions(mainPane);

  // 2. 引用徽章箭头占位（幂等：已有箭头的徽章自动跳过）
  preInjectBadgeArrows(mainPane);

  // 3. 行内公式 host 容器预包裹（幂等：已有 host 的公式自动跳过）
  preWrapFormulaHosts(mainPane);
}
