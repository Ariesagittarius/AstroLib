/**
 * Reader Feedback & Errata System · Client Controller
 *
 * Implements paragraph/formula selection, keyboard shortcut handling (Alt+F),
 * VitePress-themed dialog interaction, and dual-mode issue dispatching.
 */

import {
  type ErrataPayload,
  type FeedbackConfig,
  FEEDBACK_CATEGORIES,
  formatIssueBody,
  buildGithubIssueUrl,
  submitToBotProxy,
} from './format-issue';

interface BlockTarget {
  el: HTMLElement;
  file: string;
  line: number;
  kind: string;
  excerpt: string;
  isFormula: boolean;
}

let active = false;
let hoveredBlock: HTMLElement | null = null;
let currentConfig: FeedbackConfig = {
  githubRepo: 'Ariesagittarius/AstroLib',
  issueLabels: ['errata', 'community-feedback'],
  shortcutKey: 'Alt+f',
  botEndpoint: '',
};

// UI Element references
let rootEl: HTMLElement | null = null;
let bannerEl: HTMLElement | null = null;
let badgeEl: HTMLElement | null = null;
let modalEl: HTMLElement | null = null;
let toastContainerEl: HTMLElement | null = null;

function mainContainer(): HTMLElement {
  return (
    document.querySelector('main .sl-markdown-content') ||
    document.querySelector('.main-pane') ||
    document.querySelector('main') ||
    document.body
  ) as HTMLElement;
}

function findBlock(target: Element | null): HTMLElement | null {
  if (!target) return null;
  return target.closest('[data-src-line]') as HTMLElement | null;
}

function guessFile(): string {
  const p = location.pathname.replace(/\/+$/, '');
  return p ? `src/content/docs${p}.mdx` : 'src/content/docs/index.mdx';
}

function getPageMetadata(): { bookTitle: string; bookSlug: string; chapterTitle: string } {
  const h1 = document.querySelector('h1')?.textContent?.trim() || '';
  const pageTitle = document.title.split('|')[0].split('—')[0].trim() || 'AstroLib Documentation';

  // Derive book title from sidebar or path if available
  const aside = document.querySelector('aside.custom-page-sidebar');
  const bookKey = aside?.getAttribute('data-book-key') || '';
  const [colSlug = '', bookSlug = ''] = bookKey.split('/');

  const bookHeader = document.querySelector('.vp-local-nav-title, .sidebar-book-title, nav .active-book-title');
  const bookTitle = bookHeader?.textContent?.trim() || (bookSlug ? bookSlug.toUpperCase() : 'AstroLib Book');

  return {
    bookTitle,
    bookSlug,
    chapterTitle: h1 || pageTitle,
  };
}

function extractTargetData(el: HTMLElement, rawTarget?: Element | null): BlockTarget {
  const line = parseInt(el.getAttribute('data-src-line') || '0', 10);
  const file = el.getAttribute('data-src-file') || guessFile();
  const kind = el.getAttribute('data-src-kind') || 'paragraph';

  // Check if click was directly on a KaTeX formula
  const katexEl = rawTarget?.closest('.katex[data-latex], .katex-display[data-latex]');
  if (katexEl) {
    const latex = katexEl.getAttribute('data-latex') || '';
    return {
      el,
      file,
      line: line || 0,
      kind: 'formula',
      excerpt: latex.trim(),
      isFormula: true,
    };
  }

  // If the block itself is a display formula
  if (kind === 'formula') {
    const latex = el.getAttribute('data-latex') || el.querySelector('[data-latex]')?.getAttribute('data-latex') || '';
    return {
      el,
      file,
      line,
      kind,
      excerpt: latex.trim() || el.innerText.trim(),
      isFormula: true,
    };
  }

  // Plain text excerpt (trim and limit length to reasonable snippet)
  let excerpt = el.innerText?.trim() || el.textContent?.trim() || '';
  if (excerpt.length > 800) {
    excerpt = excerpt.slice(0, 800) + '...';
  }

  return {
    el,
    file,
    line,
    kind,
    excerpt,
    isFormula: false,
  };
}

/* ---------------- UI Construction ---------------- */

function ensureUI(): HTMLElement {
  if (rootEl) return rootEl;

  rootEl = document.createElement('div');
  rootEl.id = 'sl-feedback-root';
  document.body.appendChild(rootEl);

  bannerEl = document.createElement('div');
  bannerEl.className = 'sl-fb-banner';
  bannerEl.innerHTML = `
    <div class="sl-fb-banner-inner">
      <span class="sl-fb-banner-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      </span>
      <span class="sl-fb-banner-text">勘误选择模式已就绪：请点击正文中存在错漏的段落、公式或卡片（按 <kbd>Esc</kbd> 退出）</span>
      <button type="button" class="sl-fb-banner-close" title="退出勘误模式 (Esc)" aria-label="退出">✕</button>
    </div>
  `;
  bannerEl.querySelector('.sl-fb-banner-close')?.addEventListener('click', () => setFeedbackActive(false));
  bannerEl.style.display = 'none';
  rootEl.appendChild(bannerEl);

  badgeEl = document.createElement('div');
  badgeEl.className = 'sl-fb-badge';
  badgeEl.style.display = 'none';
  rootEl.appendChild(badgeEl);

  modalEl = document.createElement('div');
  modalEl.className = 'sl-fb-modal';
  modalEl.style.display = 'none';
  rootEl.appendChild(modalEl);

  toastContainerEl = document.createElement('div');
  toastContainerEl.className = 'sl-fb-toast-box';
  rootEl.appendChild(toastContainerEl);

  return rootEl;
}

export function showToast(message: string, duration = 3200): void {
  ensureUI();
  if (!toastContainerEl) return;

  const toast = document.createElement('div');
  toast.className = 'sl-fb-toast';
  toast.textContent = message;
  toastContainerEl.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('sl-fb-toast-fade');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

function updateBadge(block: HTMLElement): void {
  if (!badgeEl) return;
  const line = block.getAttribute('data-src-line') || '';
  const kind = block.getAttribute('data-src-kind') || 'block';

  badgeEl.textContent = `${kind}${line ? ` · L${line}` : ''}`;
  badgeEl.style.display = 'block';

  const rect = block.getBoundingClientRect();
  const badgeWidth = badgeEl.offsetWidth;
  let left = rect.left + rect.width / 2 - badgeWidth / 2;
  left = Math.max(8, Math.min(left, window.innerWidth - badgeWidth - 8));
  badgeEl.style.left = `${left}px`;
  badgeEl.style.top = `${Math.max(8, rect.top - 24)}px`;
}

function hideBadge(): void {
  if (badgeEl) badgeEl.style.display = 'none';
}

/* ---------------- Errata Dialog ---------------- */

function openErrataModal(target: BlockTarget): void {
  ensureUI();
  if (!modalEl) return;

  const { bookTitle, bookSlug, chapterTitle } = getPageMetadata();
  const shortFile = (target.file || 'unknown.mdx').split('/').pop();

  modalEl.innerHTML = '';
  const box = document.createElement('div');
  box.className = 'sl-fb-modal-box';

  // Modal Header
  const header = document.createElement('div');
  header.className = 'sl-fb-modal-head';
  header.innerHTML = `
    <div class="sl-fb-modal-title-wrap">
      <span class="sl-fb-modal-title">读者勘误与问题反馈</span>
      <span class="sl-fb-modal-meta">${shortFile}${target.line > 0 ? ` : L${target.line}` : ''}</span>
    </div>
    <button type="button" class="sl-fb-modal-close" title="关闭 (Esc)" aria-label="关闭">✕</button>
  `;
  header.querySelector('.sl-fb-modal-close')?.addEventListener('click', closeErrataModal);

  // Modal Body
  const body = document.createElement('div');
  body.className = 'sl-fb-modal-body';

  const categoryOptionsHtml = FEEDBACK_CATEGORIES.map(
    (c) => `<option value="${c.id}">${c.label}</option>`
  ).join('');

  body.innerHTML = `
    <div class="sl-fb-field">
      <label class="sl-fb-label">定位范围 (Location)</label>
      <div class="sl-fb-location-tag">
        <code>${target.file}${target.line > 0 ? ` (Line ${target.line})` : ''}</code>
        <span class="sl-fb-kind-chip">${target.kind}</span>
      </div>
    </div>

    <div class="sl-fb-field">
      <label class="sl-fb-label">目标段落 / 源码片段 (Target Excerpt)</label>
      <textarea class="sl-fb-textarea sl-fb-excerpt" readonly spellcheck="false">${target.excerpt}</textarea>
    </div>

    <div class="sl-fb-field">
      <label class="sl-fb-label" for="sl-fb-cat-select">错误分类 (Category)</label>
      <select id="sl-fb-cat-select" class="sl-fb-select">
        ${categoryOptionsHtml}
      </select>
    </div>

    <div class="sl-fb-field sl-fb-custom-cat-field" style="display: none;">
      <label class="sl-fb-label" for="sl-fb-custom-cat">自定义类型 (Custom Category)</label>
      <input type="text" id="sl-fb-custom-cat" class="sl-fb-input" placeholder="输入自定义错误类别（英文或中文）..." autocomplete="off" />
    </div>

    <div class="sl-fb-field">
      <label class="sl-fb-label" for="sl-fb-desc">问题描述 (Problem Description) <span class="sl-fb-req">*</span></label>
      <textarea id="sl-fb-desc" class="sl-fb-textarea sl-fb-desc-input" placeholder="请具体描述该处错漏（例如：公式分母符号错误、条件缺失、解题推导步骤逻辑颠倒等）..." spellcheck="false"></textarea>
    </div>

    <div class="sl-fb-field">
      <label class="sl-fb-label" for="sl-fb-fix">建议修改为 (Proposed Correction - 选填)</label>
      <textarea id="sl-fb-fix" class="sl-fb-textarea" placeholder="如有正确计算结果、替代公式或修改文本，可在此填入..." spellcheck="false"></textarea>
    </div>

    <div class="sl-fb-field">
      <label class="sl-fb-label" for="sl-fb-reporter">反馈人署名 (Reporter - 选填)</label>
      <input type="text" id="sl-fb-reporter" class="sl-fb-input" placeholder="GitHub ID 或联系邮箱（用于鸣谢致意）..." autocomplete="off" />
    </div>

    <div class="sl-fb-status-msg" style="display: none;"></div>
  `;

  // Dynamic category switch
  const catSelect = body.querySelector('#sl-fb-cat-select') as HTMLSelectElement;
  const customCatField = body.querySelector('.sl-fb-custom-cat-field') as HTMLElement;
  catSelect.addEventListener('change', () => {
    customCatField.style.display = catSelect.value === 'custom' ? 'block' : 'none';
  });

  // Modal Footer Actions
  const foot = document.createElement('div');
  foot.className = 'sl-fb-modal-foot';

  const btnCopy = document.createElement('button');
  btnCopy.type = 'button';
  btnCopy.className = 'sl-fb-btn sl-fb-btn-aux';
  btnCopy.textContent = '📋 复制 Markdown';
  btnCopy.title = '复制全英文规范 Issue 内容到剪贴板';

  const btnGithubUrl = document.createElement('button');
  btnGithubUrl.type = 'button';
  btnGithubUrl.className = 'sl-fb-btn sl-fb-btn-sec';
  btnGithubUrl.textContent = '🔗 在 GitHub 提交';
  btnGithubUrl.title = '在新标签页打开预填好的 GitHub Issue 页面';

  const btnSubmitBot = document.createElement('button');
  btnSubmitBot.type = 'button';
  btnSubmitBot.className = 'sl-fb-btn sl-fb-btn-primary';
  btnSubmitBot.textContent = '🚀 提交勘误 (Bot)';
  btnSubmitBot.title = '通过 Serverless Bot 静默创建 GitHub Issue';

  foot.appendChild(btnCopy);
  foot.appendChild(btnGithubUrl);
  foot.appendChild(btnSubmitBot);

  // Helper to gather form payload
  const gatherPayload = (): ErrataPayload | null => {
    const descInput = body.querySelector('#sl-fb-desc') as HTMLTextAreaElement;
    const desc = descInput.value.trim();
    if (!desc) {
      descInput.focus();
      descInput.classList.add('sl-fb-input-error');
      setTimeout(() => descInput.classList.remove('sl-fb-input-error'), 1500);
      showToast('请填写问题描述 (Description)');
      return null;
    }

    const selectedCatId = catSelect.value;
    const catItem = FEEDBACK_CATEGORIES.find((c) => c.id === selectedCatId) || FEEDBACK_CATEGORIES[0];
    const customCatInput = body.querySelector('#sl-fb-custom-cat') as HTMLInputElement;
    const fixInput = body.querySelector('#sl-fb-fix') as HTMLTextAreaElement;
    const reporterInput = body.querySelector('#sl-fb-reporter') as HTMLInputElement;

    return {
      bookTitle,
      bookSlug,
      chapterTitle,
      filePath: target.file,
      line: target.line,
      blockKind: target.kind,
      targetExcerpt: target.excerpt,
      isFormula: target.isFormula,
      category: selectedCatId,
      categoryLabel: catItem.label,
      customCategory: selectedCatId === 'custom' ? customCatInput.value.trim() : undefined,
      description: desc,
      correction: fixInput.value.trim() || undefined,
      reporter: reporterInput.value.trim() || undefined,
      url: location.href,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    };
  };

  // Action: Copy Markdown
  btnCopy.addEventListener('click', async () => {
    const payload = gatherPayload();
    if (!payload) return;
    const markdown = formatIssueBody(payload);
    try {
      await navigator.clipboard.writeText(markdown);
      showToast('已成功复制全英文 Issue 报告至剪贴板');
    } catch {
      showToast('剪贴板复制失败，请手动选择复制');
    }
  });

  // Action: Open in GitHub URL
  btnGithubUrl.addEventListener('click', () => {
    const payload = gatherPayload();
    if (!payload) return;
    const targetUrl = buildGithubIssueUrl(payload, currentConfig);
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
    closeErrataModal();
    setFeedbackActive(false);
  });

  // Action: Submit via Bot Proxy
  btnSubmitBot.addEventListener('click', async () => {
    const payload = gatherPayload();
    if (!payload) return;

    const statusMsgEl = body.querySelector('.sl-fb-status-msg') as HTMLElement;
    statusMsgEl.style.display = 'block';
    statusMsgEl.className = 'sl-fb-status-msg sl-fb-status-loading';
    statusMsgEl.textContent = '正在通过 Serverless Bot 提交至 GitHub...';
    btnSubmitBot.disabled = true;

    if (!currentConfig.botEndpoint) {
      // If endpoint is not configured, fall back gracefully to URL submission
      statusMsgEl.className = 'sl-fb-status-msg sl-fb-status-warn';
      statusMsgEl.innerHTML = `
        当前站点未配置 Serverless Bot API 端点，已为您无缝切换至 
        <a href="${buildGithubIssueUrl(payload, currentConfig)}" target="_blank" rel="noopener">GitHub 预填提交页</a>。
      `;
      btnSubmitBot.disabled = false;
      return;
    }

    const res = await submitToBotProxy(payload, currentConfig.botEndpoint, currentConfig);
    if (res.ok && res.issueUrl) {
      try { (window as any).__astrolibTrack?.('errata_submit', { category: payload.category }); } catch {}
      statusMsgEl.className = 'sl-fb-status-msg sl-fb-status-success';
      statusMsgEl.innerHTML = `
        ✓ 勘误 Issue 创建成功：<a href="${res.issueUrl}" target="_blank" rel="noopener">#${res.issueNumber || ''} 查看已创建的 Issue</a>
      `;
      showToast('勘误 Issue 已成功创建！');
      setTimeout(() => {
        closeErrataModal();
        setFeedbackActive(false);
      }, 2500);
    } else {
      statusMsgEl.className = 'sl-fb-status-msg sl-fb-status-error';
      statusMsgEl.textContent = `提交失败：${res.message || '未知错误'}。建议点击上方「在 GitHub 提交」或「复制 Markdown」。`;
      btnSubmitBot.disabled = false;
    }
  });

  box.appendChild(header);
  box.appendChild(body);
  box.appendChild(foot);
  modalEl.appendChild(box);
  modalEl.style.display = 'flex';

  // Focus description input
  const descInput = body.querySelector('#sl-fb-desc') as HTMLTextAreaElement;
  descInput?.focus();
}

function closeErrataModal(): void {
  if (modalEl) {
    modalEl.style.display = 'none';
    modalEl.innerHTML = '';
  }
}

function isModalOpen(): boolean {
  return !!modalEl && modalEl.style.display !== 'none';
}

/* ---------------- State Management ---------------- */

export function setFeedbackActive(enable: boolean): void {
  active = enable;
  ensureUI();

  if (active) {
    document.body.classList.add('sl-feedback-active');
    if (bannerEl) bannerEl.style.display = 'block';
    showToast('已进入勘误选择模式：点击正文目标段落即可');
  } else {
    document.body.classList.remove('sl-feedback-active');
    if (bannerEl) bannerEl.style.display = 'none';
    if (hoveredBlock) {
      hoveredBlock.classList.remove('sl-fb-hover');
      hoveredBlock = null;
    }
    hideBadge();
    closeErrataModal();
  }
}

export function toggleFeedback(): void {
  setFeedbackActive(!active);
}

/* ---------------- Event Handlers ---------------- */

function onKeyDown(e: KeyboardEvent): void {
  const isAltF = (e.altKey || e.metaKey) && (e.key === 'f' || e.key === 'F');

  if (isAltF) {
    e.preventDefault();
    toggleFeedback();
    return;
  }

  if (e.key === 'Escape') {
    if (isModalOpen()) {
      closeErrataModal();
    } else if (active) {
      setFeedbackActive(false);
    }
  }
}

function onMouseOver(e: MouseEvent): void {
  if (!active || isModalOpen()) return;
  const target = e.target as Element | null;
  if (!target || (rootEl && rootEl.contains(target))) return;

  if (hoveredBlock) hoveredBlock.classList.remove('sl-fb-hover');
  hoveredBlock = null;

  const block = findBlock(target);
  if (block) {
    hoveredBlock = block;
    block.classList.add('sl-fb-hover');
    updateBadge(block);
  } else {
    hideBadge();
  }
}

function onMouseOut(e: MouseEvent): void {
  if (!active || isModalOpen()) return;
  const related = e.relatedTarget as Node | null;
  if (hoveredBlock && (!related || !hoveredBlock.contains(related))) {
    hoveredBlock.classList.remove('sl-fb-hover');
    hoveredBlock = null;
    hideBadge();
  }
}

function onClick(e: MouseEvent): void {
  if (!active || isModalOpen()) return;
  const target = e.target as Element | null;
  if (!target) return;
  if (rootEl && rootEl.contains(target)) return;

  // Don't intercept clicks inside details summary navigation
  if (target.closest('summary')) return;

  const block = findBlock(target);
  if (block) {
    e.preventDefault();
    e.stopPropagation();
    const data = extractTargetData(block, target);
    openErrataModal(data);
  }
}

/* ---------------- Public Initializer ---------------- */

export function initFeedback(config?: Partial<FeedbackConfig>): void {
  const w = window as any;
  if (w.__slFeedbackInstalled) return;
  w.__slFeedbackInstalled = true;

  if (config) {
    currentConfig = { ...currentConfig, ...config };
  }

  ensureUI();

  document.addEventListener('keydown', onKeyDown, true);
  document.addEventListener('mouseover', onMouseOver, true);
  document.addEventListener('mouseout', onMouseOut, true);
  document.addEventListener('click', onClick, true);

  // Global trigger buttons hook (data-feedback-trigger)
  document.addEventListener('click', (e) => {
    const btn = (e.target as Element | null)?.closest('[data-feedback-trigger]');
    if (btn) {
      e.preventDefault();
      toggleFeedback();
    }
  });

  // Page lifecycle synchronization
  const resetOnPageChange = (): void => {
    if (active) setFeedbackActive(false);
  };
  document.addEventListener('astro:page-load', resetOnPageChange);
  window.addEventListener('popstate', resetOnPageChange);
}
