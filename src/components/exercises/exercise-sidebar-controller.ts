import type { SlimQuestionItem, ChapterData } from '../../types/exercises';
import { getExerciseBankById, type ExerciseBank } from '../../config/exercise-banks.config';
import { streamChat } from '../../ai/llm.mjs';
import { getEffectiveAiClientConfig, saveAiApiKey } from '../../ai/ai-config';
import { parseAiError } from '../../ai/error-handler';
import renderMathInElement from 'katex/dist/contrib/auto-render.mjs';
import { StreamThrottleScheduler } from './stream-scheduler';
import { sideloadManager } from '../sideload/sideload-manager';
import '@material/web/iconbutton/icon-button.js';
import '@material/web/icon/icon.js';

const KATEX_OPTIONS = {
  delimiters: [
    { left: '$$', right: '$$', display: true },
    { left: '$', right: '$', display: false },
    { left: '\\[', right: '\\]', display: true },
    { left: '\\(', right: '\\)', display: false },
  ],
  throwOnError: false,
  errorColor: '#cc0000',
  strict: false,
  trust: true,
  macros: {
    '\\dif': '\\mathrm{d}',
    '\\e': '\\mathrm{e}',
    '\\i': '\\mathrm{i}',
    '\\R': '\\mathbb{R}',
    '\\N': '\\mathbb{N}',
    '\\Z': '\\mathbb{Z}',
    '\\C': '\\mathbb{C}',
    '\\iint': '\\int\\!\\!\\int',
    '\\iiint': '\\int\\!\\!\\int\\!\\!\\int',
    '\\iiiint': '\\int\\!\\!\\int\\!\\!\\int\\!\\!\\int',
  },
};

function renderSolutionMarkdown(md: string, isStreaming = false): string {
  if (!md) return '<div class="ex-ai-placeholder">正在调用学术模型进行规范推导演算...</div>';
  let safe = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  if (isStreaming) {
    const openBrackets = (safe.match(/\\\[/g) || []).length;
    const closeBrackets = (safe.match(/\\\]/g) || []).length;
    if (openBrackets > closeBrackets) {
      safe += '\n\\]';
    }
  }

  safe = safe.replace(/\\\[([\s\S]*?)\\\]/g, (_m, inner) => `\n$$\n${inner.trim()}\n$$\n`);
  safe = safe.replace(/\\\(([\s\S]*?)\\\)/g, (_m, inner) => `$${inner.trim()}$`);

  const mathBlocks: string[] = [];

  if (isStreaming) {
    const doubleDollarCount = (safe.match(/\$\$/g) || []).length;
    if (doubleDollarCount % 2 !== 0) {
      safe += '\n$$';
    }
  }

  safe = safe.replace(/\$\$([\s\S]*?)\$\$/g, (_m, inner) => {
    mathBlocks.push(`$$${inner}$$`);
    return `___MATH_BLOCK_${mathBlocks.length - 1}___`;
  });

  safe = safe.replace(/\$([^\$\n]+?)\$/g, (_m, inner) => {
    mathBlocks.push(`$${inner}$`);
    return `___MATH_BLOCK_${mathBlocks.length - 1}___`;
  });

  const lines = safe.split(/\r?\n/);
  const out: string[] = [];
  let inCode = false;
  let codeBuf: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (/^```/.test(line)) {
      if (inCode) {
        out.push(`<pre><code>${codeBuf.join('\n')}</code></pre>`);
        codeBuf = [];
        inCode = false;
      } else {
        inCode = true;
      }
      continue;
    }
    if (inCode) {
      codeBuf.push(line);
      continue;
    }

    if (/^###\s+(.*)$/.test(line)) {
      const title = line.replace(/^###\s+/, '');
      out.push(`<h6>${title}</h6>`);
      continue;
    }
    if (/^##\s+(.*)$/.test(line)) {
      const title = line.replace(/^##\s+/, '');
      out.push(`<h5>${title}</h5>`);
      continue;
    }
    if (/^#\s+(.*)$/.test(line)) {
      const title = line.replace(/^#\s+/, '');
      out.push(`<h4>${title}</h4>`);
      continue;
    }

    if (/^[-*]\s+(.*)$/.test(line)) {
      const item = line.replace(/^[-*]\s+/, '');
      out.push(`<li>${item}</li>`);
      continue;
    }

    if (/^\d+\.\s+(.*)$/.test(line)) {
      const item = line.replace(/^\d+\.\s+/, '');
      out.push(`<li>${item}</li>`);
      continue;
    }

    if (line.trim() === '') {
      continue;
    }

    out.push(`<p>${line}</p>`);
  }

  let html = out.join('\n');
  html = html.replace(/<li>[\s\S]*?<\/li>/g, (m) => `<ul>${m}</ul>`);
  html = html.replace(/<\/ul>\s*<ul>/g, '');

  html = html.replace(/___MATH_BLOCK_(\d+)___/g, (_m, idx) => {
    return mathBlocks[parseInt(idx, 10)] || '';
  });

  return html;
}

class ExerciseSidebarController {
  private isOpen = false;
  private activeBankId: string | null = null;
  private activeChip: HTMLElement | null = null;
  private currentBook = 'engineering_analysis';
  private currentChapter = 1;
  private currentSection = 'all';
  private chapterCache = new Map<string, ChapterData>();
  private questionsMap = new Map<string, SlimQuestionItem>();
  private questionIndexMap = new Map<string, number>();
  private aiControllers = new Map<string, AbortController>();
  private aiSolutions = new Map<string, string>();
  private aiReasonings = new Map<string, string>();
  private activeTooltipQid: string | null = null;
  private tooltipEl: HTMLElement | null = null;
  private isTooltipPinned = false;
  private isCustomPositioned = false;

  constructor() {

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;

        if (this.activeTooltipQid) {
          this.closeAiRichTooltip();
          return;
        }

        if (!this.isOpen) return;

        const modal = document.getElementById('exercise-modal-root');
        if (modal && modal.classList.contains('is-open')) {
          return;
        }

        if (document.body.classList.contains('mobile-toc-open')) {
          return;
        }

        this.close();
      });

      window.addEventListener('pointerdown', (e) => {
        if (!this.activeTooltipQid || !this.tooltipEl) return;
        if (this.isTooltipPinned) return;
        const target = e.target as HTMLElement;
        if (!target) return;
        if (this.tooltipEl.contains(target)) return;
        if (target.closest('.ex-ai-popout-btn')) return;
        this.closeAiRichTooltip();
      });

      window.addEventListener('resize', () => {
        if (this.activeTooltipQid) {
          if (this.isCustomPositioned && this.tooltipEl) {
            const rect = this.tooltipEl.getBoundingClientRect();
            const clampX = Math.max(8, Math.min(rect.left, window.innerWidth - rect.width - 8));
            const clampY = Math.max(8, Math.min(rect.top, window.innerHeight - rect.height - 8));
            this.tooltipEl.style.left = `${clampX}px`;
            this.tooltipEl.style.top = `${clampY}px`;
          } else {
            const btn = document.getElementById(`ai-popout-${this.activeTooltipQid}`);
            if (btn) this.repositionRichTooltip(btn);
          }
        }
      });
    }
  }

  public init() {
    this.bindTriggerChips();
    this.bindPanelActions();

    sideloadManager.subscribe((state) => {
      if (state.activePanelId !== 'exercises' && this.isOpen) {
        this.closeInternal();
      }
    });
  }

  private bindTriggerChips() {
    const triggerCards = document.querySelectorAll('[data-exercise-trigger-card]');
    triggerCards.forEach((card) => {
      const chapter = parseInt(card.getAttribute('data-chapter') || '1', 10);
      const section = card.getAttribute('data-section') || 'all';
      const book = card.getAttribute('data-book') || 'engineering_analysis';

      const chips = card.querySelectorAll<HTMLElement>('.ex-bank-chip');
      chips.forEach((chip) => {
        chip.onclick = () => {
          const bankId = chip.getAttribute('data-bank-id') || '';
          this.handleChipClick(chip, bankId, chapter, section, book);
        };
      });
    });
  }

  private bindPanelActions() {
    const closeBtn = document.getElementById('ex-sidebar-close');
    if (closeBtn) {
      closeBtn.onclick = () => this.close();
    }

    const backBtn = document.getElementById('sideload-back-to-toc');
    if (backBtn) {
      backBtn.onclick = () => this.close();
    }

    const openModalBtn = document.getElementById('ex-sidebar-open-modal');
    if (openModalBtn) {
      openModalBtn.onclick = () => this.openInFullModal();
    }
  }

  private handleChipClick(
    chip: HTMLElement,
    bankId: string,
    chapter: number,
    section: string,
    book: string
  ) {

    if (this.isOpen && this.activeBankId === bankId) {
      this.close();
      return;
    }

    document.querySelectorAll('.ex-bank-chip').forEach((c: any) => {
      if (typeof c.selected === 'boolean') {
        c.selected = false;
      }
    });

    if (typeof (chip as any).selected === 'boolean') {
      (chip as any).selected = true;
    }
    this.activeChip = chip;
    this.activeBankId = bankId;
    this.currentChapter = chapter;
    this.currentSection = section;
    this.currentBook = book;

    this.open();
  }

  public async open() {
    this.isOpen = true;

    sideloadManager.open('exercises');

    const panel = document.getElementById('exercise-sidebar-panel');
    if (panel) {
      panel.setAttribute('aria-hidden', 'false');
      panel.classList.add('active');
    }

    const bankConfig = this.activeBankId ? getExerciseBankById(this.activeBankId) : undefined;
    const titleEl = document.getElementById('ex-sidebar-title');
    if (titleEl) {
      titleEl.textContent = bankConfig?.title || '课后习题';
    }

    const countEl = document.getElementById('ex-sidebar-count');
    if (countEl) {
      countEl.textContent = '加载中...';
    }

    const contentEl = document.getElementById('ex-sidebar-content');
    if (contentEl) {
      contentEl.innerHTML = `
        <div class="ex-sb-loading">
          <div class="ex-sb-spinner"></div>
          <span>正在加载本节题目与 KaTeX 公式...</span>
        </div>
      `;
    }

    await this.loadAndRenderQuestions();
  }

  public close() {
    this.closeInternal();
    sideloadManager.switchToDefault();
  }

  public closeInternal() {
    this.isOpen = false;
    this.activeBankId = null;

    this.closeAiRichTooltip();

    this.aiControllers.forEach((c) => c.abort());
    this.aiControllers.clear();

    if (this.activeChip && typeof (this.activeChip as any).selected === 'boolean') {
      (this.activeChip as any).selected = false;
    }
    this.activeChip = null;
    document.querySelectorAll('.ex-bank-chip').forEach((c: any) => {
      if (typeof c.selected === 'boolean') {
        c.selected = false;
      }
    });

    const panel = document.getElementById('exercise-sidebar-panel');
    if (panel) {
      panel.setAttribute('aria-hidden', 'true');
      panel.classList.remove('active');
    }
  }

  public async openInFullModal() {
    try {
      window.dispatchEvent(
        new CustomEvent('exercises:open', {
          detail: {
            chapter: this.currentChapter,
            section: this.currentSection,
          },
        })
      );
    } catch (err) {
      console.error('[ExerciseSidebar] 打开全量题库中心失败:', err);
    }
  }

  private async loadAndRenderQuestions() {
    const cacheKey = `${this.currentBook}_ch${this.currentChapter}`;
    let chapterData = this.chapterCache.get(cacheKey);

    if (!chapterData) {
      try {
        const resp = await fetch(`/data/exercises/${this.currentBook}/ch${this.currentChapter}.json`);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        chapterData = (await resp.json()) as ChapterData;
        this.chapterCache.set(cacheKey, chapterData);
      } catch (err) {
        console.error('[ExerciseSidebar] 拉取题目失败:', err);
        const contentEl = document.getElementById('ex-sidebar-content');
        if (contentEl) {
          contentEl.innerHTML = `
            <div class="ex-sb-empty">
              <p>题库加载失败，请检查网络后重试。</p>
              <button type="button" class="ex-sb-retry-btn" id="ex-sb-retry">重新加载</button>
            </div>
          `;
          document.getElementById('ex-sb-retry')?.addEventListener('click', () => {
            this.loadAndRenderQuestions();
          });
        }
        return;
      }
    }

    const bankConfig = this.activeBankId ? getExerciseBankById(this.activeBankId) : undefined;
    const targetSourceType = bankConfig?.sourceType || 'exam';

    const allQuestions = chapterData.questions || [];
    const filtered = allQuestions.filter((q) => {

      const qSourceType = q.source_type || 'exam';
      if (qSourceType !== targetSourceType) return false;

      if (this.currentSection === 'all') return true;
      if (q.sec === this.currentSection) return true;
      if (q.sec_slug && q.sec_slug.startsWith(this.currentSection)) return true;
      return false;
    });

    const countEl = document.getElementById('ex-sidebar-count');
    if (countEl) {
      countEl.textContent = `共 ${filtered.length} 题`;
    }

    const contentEl = document.getElementById('ex-sidebar-content');
    if (!contentEl) return;

    const licenseBannerHtml = bankConfig?.license ? this.renderLicenseBannerCard(bankConfig) : '';

    if (filtered.length === 0) {
      contentEl.innerHTML = `
        ${licenseBannerHtml}
        <div class="ex-sb-empty">
          <svg class="ex-sb-empty-icon" viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
          <p class="ex-sb-empty-text">本小节暂未收录该习题册的题目</p>
          <button type="button" class="ex-sb-open-all-btn" id="ex-sb-view-all">打开完整题库浏览全书</button>
        </div>
      `;
      document.getElementById('ex-sb-view-all')?.addEventListener('click', () => {
        this.openInFullModal();
      });
      return;
    }

    filtered.forEach((q, idx) => {
      this.questionsMap.set(q.id, q);
      this.questionIndexMap.set(q.id, idx + 1);
    });

    contentEl.innerHTML = licenseBannerHtml + filtered.map((q, idx) => this.renderQuestionCard(q, idx)).join('');

    this.bindQuestionCardInteractions(contentEl);
  }

  private renderQuestionCard(q: SlimQuestionItem, index: number): string {
    const typeNames: Record<string, string> = {
      choice: '单选题',
      blank: '填空题',
      calc: '计算题',
      proof: '证明题',
    };
    const typeLabel = typeNames[q.type] || '练习题';
    const sourceLabel = q.source || q.paper_title || `第 ${q.paper_q_num || index + 1} 题`;

    let optionsHtml = '';
    if (q.type === 'choice' && q.options && q.options.length > 0) {
      optionsHtml = `
        <div class="ex-card-options">
          ${q.options
            .map(
              (opt) => `
            <div class="ex-card-option-item">
              <span class="ex-card-option-key">${opt.key}</span>
              <div class="ex-card-option-content">${opt.text_html || opt.text_raw}</div>
            </div>
          `
            )
            .join('')}
        </div>
      `;
    }

    const hasAnswer = Boolean(q.answer_html || q.answer);
    const hasSteps = Boolean(q.steps_html);
    const hasHints = Boolean(q.hints_html);
    const hasSolution = hasAnswer || hasSteps || hasHints;

    return `
      <article class="ex-light-card" data-question-id="${q.id}">
        <header class="ex-card-header">
          <div class="ex-card-meta">
            <span class="ex-card-index">第 ${index + 1} 题</span>
            <span class="ex-card-type-chip ex-type-${q.type}">${typeLabel}</span>
          </div>
          <span class="ex-card-source-tag" title="${sourceLabel}">${sourceLabel}</span>
        </header>

        <div class="ex-card-stem">
          ${q.stem_html || q.stem_raw}
        </div>

        ${optionsHtml}

        <!-- 底部右侧 M3 图标操作栏（无冗余文本） -->
        <div class="ex-card-actions">
          ${
            hasSolution
              ? `
            <button
              type="button"
              class="ex-card-icon-btn ex-card-toggle-sol"
              data-qid="${q.id}"
              aria-expanded="false"
              title="查看官方推导与解析"
              aria-label="查看官方推导与解析"
            >
              <svg class="ex-mdicon" viewBox="0 0 24 24">
                <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
              </svg>
            </button>
          `
              : ''
          }
          <button
            type="button"
            class="ex-card-icon-btn ex-card-ask-ai"
            data-qid="${q.id}"
            aria-expanded="false"
            title="AI 规范推导与答疑"
            aria-label="AI 规范推导与答疑"
          >
            <svg class="ex-mdicon" viewBox="0 0 24 24">
              <path d="M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z"/>
            </svg>
          </button>
        </div>

        <!-- 官方解析面板 (默认折叠) -->
        ${
          hasSolution
            ? `
          <div class="ex-card-solution-body" id="sol-body-${q.id}" hidden>
            ${
              hasAnswer
                ? `
              <div class="ex-sol-block ex-sol-answer">
                <span class="ex-sol-label">参考答案</span>
                <div class="ex-sol-content">${q.answer_html || q.answer}</div>
              </div>
            `
                : ''
            }
            ${
              hasSteps
                ? `
              <div class="ex-sol-block ex-sol-steps">
                <span class="ex-sol-label">推导过程</span>
                <div class="ex-sol-content">${q.steps_html}</div>
              </div>
            `
                : ''
            }
            ${
              hasHints
                ? `
              <div class="ex-sol-block ex-sol-hints">
                <span class="ex-sol-label">解题思路</span>
                <div class="ex-sol-content">${q.hints_html}</div>
              </div>
            `
                : ''
            }
          </div>
        `
            : ''
        }

        <!-- AI 规范推导面板 (默认折叠) -->
        <div class="ex-card-ai-body" id="ai-body-${q.id}" hidden></div>
      </article>
    `;
  }

  private bindQuestionCardInteractions(contentEl: HTMLElement) {

    contentEl.querySelectorAll<HTMLElement>('.ex-card-toggle-sol').forEach((btn) => {
      btn.onclick = () => {
        const qid = btn.getAttribute('data-qid');
        if (!qid) return;
        const solBody = document.getElementById(`sol-body-${qid}`);
        if (!solBody) return;

        const isExpanded = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!isExpanded));
        btn.classList.toggle('active', !isExpanded);
        solBody.hidden = isExpanded;
      };
    });

    contentEl.querySelectorAll<HTMLElement>('.ex-card-ask-ai').forEach((btn) => {
      btn.onclick = () => {
        const qid = btn.getAttribute('data-qid');
        if (!qid) return;
        const aiBody = document.getElementById(`ai-body-${qid}`);
        if (!aiBody) return;

        const isCurrentlyOpen = !aiBody.hidden && aiBody.children.length > 0;
        if (isCurrentlyOpen) {
          aiBody.hidden = true;
          btn.setAttribute('aria-expanded', 'false');
          btn.classList.remove('active');
          if (this.activeTooltipQid === qid) {
            this.closeAiRichTooltip();
          }
          return;
        }

        aiBody.hidden = false;
        btn.setAttribute('aria-expanded', 'true');
        btn.classList.add('active');

        const cached = this.getStoredAiSolution(qid);
        if (cached) {
          this.renderCompletedAiSolution(qid, cached);
        } else {
          const q = this.questionsMap.get(qid);
          if (q) {
            this.triggerAiGeneration(qid, q);
          }
        }
      };
    });
  }

  private getStoredAiSolution(qid: string): string | null {
    if (this.aiSolutions.has(qid)) return this.aiSolutions.get(qid)!;
    try {
      if (typeof localStorage !== 'undefined') {
        const item = localStorage.getItem(`astrolib_ai_solution_${qid}`);
        if (item) {
          this.aiSolutions.set(qid, item);
          return item;
        }
      }
    } catch {}
    return null;
  }

  private getStoredAiReasoning(qid: string): string | null {
    if (this.aiReasonings.has(qid)) return this.aiReasonings.get(qid)!;
    try {
      if (typeof localStorage !== 'undefined') {
        const item = localStorage.getItem(`astrolib_ai_reasoning_${qid}`);
        if (item) {
          this.aiReasonings.set(qid, item);
          return item;
        }
      }
    } catch {}
    return null;
  }

  private renderCotAccordionHtml(reasoningMd: string, isStreamingReasoning = false): string {
    if (!reasoningMd && !isStreamingReasoning) return '';

    const summaryText = isStreamingReasoning
      ? (reasoningMd ? `正在深度推理推演中... · ${reasoningMd.length} 字` : '正在深度推理推演中...')
      : `已完成思考 · 共 ${reasoningMd.length} 字`;

    const contentHtml = reasoningMd
      ? renderSolutionMarkdown(reasoningMd, isStreamingReasoning)
      : '<div class="ex-ai-placeholder">正在深度梳理思路与构建推导步骤...</div>';

    return `
      <div class="ex-ai-cot-box" id="ex-tooltip-cot-box">
        <button type="button" class="ex-ai-cot-toggle" id="ex-tooltip-cot-toggle" aria-expanded="false" title="点击展开/折叠深度推理思考过程">
          <svg class="ex-ai-cot-icon" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
            <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7zm2.85 11.1l-.85.6V16h-4v-2.3l-.85-.6C7.8 12.16 7 10.63 7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.63-.8 3.16-2.15 4.1z"/>
          </svg>
          <span class="ex-ai-cot-toggle-label">深度推导思路 (CoT)</span>
          <span class="ex-ai-cot-summary" id="ex-tooltip-cot-summary">${summaryText}</span>
          <svg class="ex-ai-cot-chevron" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
            <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
          </svg>
        </button>
        <div class="ex-ai-cot-content" id="ex-tooltip-cot-content">
          ${contentHtml}
        </div>
      </div>
    `;
  }

  private bindCotToggle() {
    const box = document.getElementById('ex-tooltip-cot-box');
    const toggle = document.getElementById('ex-tooltip-cot-toggle');
    const content = document.getElementById('ex-tooltip-cot-content');
    if (!box || !toggle) return;

    toggle.onclick = (e) => {
      e.stopPropagation();
      const isExpanded = box.classList.toggle('is-expanded');
      toggle.setAttribute('aria-expanded', String(isExpanded));
      if (isExpanded && content) {

        const qid = this.activeTooltipQid;
        const reasoning = qid ? (this.aiReasonings.get(qid) || this.getStoredAiReasoning(qid) || '') : '';
        if (reasoning) {
          const isStreaming = qid ? this.aiControllers.has(qid) : false;
          content.innerHTML = renderSolutionMarkdown(reasoning, isStreaming);
          try {
            renderMathInElement(content, KATEX_OPTIONS);
          } catch {}
        }
      }
    };
  }

  private async triggerAiGeneration(qid: string, q: SlimQuestionItem, forceRetry = false) {
    const aiBody = document.getElementById(`ai-body-${qid}`);
    if (!aiBody) return;

    const config = getEffectiveAiClientConfig();
    if (!config.apiKey) {
      this.renderAiKeyPrompt(qid, q);
      return;
    }

    const oldCtrl = this.aiControllers.get(qid);
    if (oldCtrl) oldCtrl.abort();

    const controller = new AbortController();
    this.aiControllers.set(qid, controller);

    aiBody.innerHTML = `
      <div class="ex-ai-box-header">
        <div class="ex-ai-box-title-group" title="当前学术模型: ${config.label}">
          <svg class="ex-ai-box-sparkle" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z"/>
          </svg>
          <span class="ex-ai-box-title">AI 规范推导</span>
          <span class="ex-ai-status-indicator" id="ai-status-${qid}" title="正在推理...">
            <span class="ex-ai-status-spinner"></span>
          </span>
        </div>
        <div class="ex-ai-box-actions">
          <button type="button" class="ex-ai-action-btn ex-ai-popout-btn" id="ai-popout-${qid}" title="在左侧弹出浮窗卡片对照查看 (M3 Rich Tooltip)" aria-label="弹出推导浮窗">
            <svg viewBox="0 0 24 24"><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg>
          </button>
          <button type="button" class="ex-ai-action-btn ex-ai-stop-btn" id="ai-stop-${qid}" title="停止推理">
            <svg viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
          </button>
          <button type="button" class="ex-ai-action-btn ex-ai-copy-btn hidden" id="ai-copy-${qid}" title="复制 Markdown">
            <svg viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
          </button>
          <button type="button" class="ex-ai-action-btn ex-ai-retry-btn hidden" id="ai-retry-${qid}" title="重新推导">
            <svg viewBox="0 0 24 24"><path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>
          </button>
          <button type="button" class="ex-ai-action-btn ex-ai-chat-btn" id="ai-chat-${qid}" title="转入书内 AI 智能问答">
            <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>
          </button>
        </div>
      </div>
      <div class="ex-ai-box-content" id="ai-content-${qid}">
        <div class="ex-ai-placeholder">正在连接学术模型，准备进行规范推导...</div>
      </div>
      <div class="ex-ai-ceded-notice" id="ai-ceded-${qid}">
        <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
          <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
        </svg>
        <span class="ex-ai-ceded-notice-text">推导过程正在左侧浮窗中对照展示</span>
        <button type="button" class="ex-ai-ceded-restore-btn" id="ai-restore-${qid}">收回侧栏</button>
      </div>
    `;

    const popoutBtn = document.getElementById(`ai-popout-${qid}`);
    if (popoutBtn) {
      popoutBtn.onclick = () => {
        this.toggleAiRichTooltip(qid, popoutBtn);
      };
    }

    document.getElementById(`ai-restore-${qid}`)?.addEventListener('click', () => {
      this.closeAiRichTooltip();
    });

    document.getElementById(`ai-stop-${qid}`)?.addEventListener('click', () => {
      scheduler.stop();
      controller.abort();
      this.aiControllers.delete(qid);
      const status = document.getElementById(`ai-status-${qid}`);
      if (status) {
        status.setAttribute('title', '已停止推理');
        status.innerHTML = `
          <svg viewBox="0 0 24 24" width="13" height="13" fill="var(--md-sys-color-error, #ba1a1a)" style="flex-shrink:0;">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
        `;
      }
      document.getElementById(`ai-stop-${qid}`)?.classList.add('hidden');
      document.getElementById(`ai-retry-${qid}`)?.classList.remove('hidden');
    });

    document.getElementById(`ai-chat-${qid}`)?.addEventListener('click', () => {
      window.dispatchEvent(
        new CustomEvent('aiask:query', {
          detail: {
            prompt: `请对这道题目展开深入解析并讲解核心考点与解题思路：\n${q.stem_raw || q.stem_html}`,
            autoSubmit: true,
          },
        })
      );
    });

    const contentEl = document.getElementById(`ai-content-${qid}`);
    let accumulatedMd = '';
    let accumulatedReasoning = '';

    const scheduler = new StreamThrottleScheduler(() => {
      this.aiSolutions.set(qid, accumulatedMd);
      if (accumulatedReasoning) {
        this.aiReasonings.set(qid, accumulatedReasoning);
      }

      if (contentEl) {
        if (!accumulatedMd && accumulatedReasoning) {
          contentEl.innerHTML = '<div class="ex-ai-placeholder">正在深度梳理思路与推导演算...</div>';
        } else if (accumulatedMd) {
          contentEl.innerHTML = renderSolutionMarkdown(accumulatedMd, true);
          try {
            renderMathInElement(contentEl, KATEX_OPTIONS);
          } catch {}
        }
      }

      this.syncStreamingToRichTooltip(qid, accumulatedMd, accumulatedReasoning, true);
    }, 100);

    const systemPrompt = `你是专注理科高精数学与物理推导的学术导师，以严谨细致、无跳步分步推导著称。
【严格数学排版规范——必须100%遵从】：
1. 绝对严禁使用任何 LaTeX 原生界定符 \\[ ... \\] 或 \\( ... \\)，绝不允许输出类似 "\\[" 或 "\\]" 单独成行的标记！
2. 行内数学公式：必须且只能使用单个美元符号包裹，例如 $f(x) = 2x^2 + 3y^2$、$P_0(x_0, y_0, z_0)$。
3. 独立块级居中公式：必须且只能使用双美元符号包裹，前后换行单独成段，例如：
$$
z_0 = 2x_0^2 + 3y_0^2
$$
4. 凡是多行推导或方程组，必须在同一个 $$ ... $$ 块内使用 \\begin{aligned} ... \\end{aligned} 组织，绝不可拆分成多个单独的公式块或输出 \\[！
5. 所有数学符号、变量、几何点（如 $P_0$、\\lambda）、方程均须使用 KaTeX 公式渲染，不得作为裸露文本输出。`;

    const userPrompt = `请对以下题目给出极为规范、详尽的推导过程与标准解法。
【输出排版强制要求】：
1. 严格使用标准 Markdown 与 KaTeX 规范：行内公式一律用 $...$，独立居中公式一律用 $$...$$；
2. 绝对严禁输出任何 \\[、\\]、\\(、\\) 界定符！
3. 给出规范分步推导演算过程与最终标准答案，步骤严谨无跳步。

【题目信息】
来源：${q.source || q.paper_title || ''}
题型：${q.type}
题干：
${q.stem_raw || q.stem_html}

${q.options && q.options.length ? `选项：\n${q.options.map((o) => `${o.key}. ${o.text_raw || o.text_html}`).join('\n')}` : ''}
${q.answer ? `参考结果：${q.answer}` : ''}`;

    try {
      await streamChat({
        endpoint: config.endpoint,
        apiKey: config.apiKey,
        model: config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        signal: controller.signal,
        onReasoningDelta: (chunk: string) => {
          accumulatedReasoning += chunk;
          scheduler.schedule();
        },
        onDelta: (chunk: string) => {
          accumulatedMd += chunk;
          scheduler.schedule();
        },
      });

      scheduler.flush(true);
      scheduler.stop();
      this.aiControllers.delete(qid);

      const hasContent = Boolean(accumulatedMd && accumulatedMd.trim());
      const hasReasoning = Boolean(accumulatedReasoning && accumulatedReasoning.trim());

      if (!hasContent && !hasReasoning) {
        if (contentEl) {
          contentEl.innerHTML = `
            <div class="ex-sb-empty" style="padding: 1rem 0;">
              <p style="color: var(--md-sys-color-error, #ba1a1a); font-size: 0.75rem;">模型未返回有效推导内容（空响应），请检查服务状态并重试</p>
              <button type="button" class="ex-sb-retry-btn" id="ai-err-retry-${qid}">重试</button>
            </div>
          `;
          document.getElementById(`ai-err-retry-${qid}`)?.addEventListener('click', () => {
            this.triggerAiGeneration(qid, q, true);
          });
        }
        return;
      }

      if (!hasContent && hasReasoning) {
        accumulatedMd = accumulatedReasoning;
      }

      this.aiSolutions.set(qid, accumulatedMd);
      if (accumulatedReasoning) {
        this.aiReasonings.set(qid, accumulatedReasoning);
      }
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(`astrolib_ai_solution_${qid}`, accumulatedMd);
          if (accumulatedReasoning) {
            localStorage.setItem(`astrolib_ai_reasoning_${qid}`, accumulatedReasoning);
          }
        }
      } catch {}

      if (contentEl) {
        contentEl.innerHTML = renderSolutionMarkdown(accumulatedMd, false);
        try {
          renderMathInElement(contentEl, KATEX_OPTIONS);
        } catch {}
      }

      this.finishAiBoxView(qid, q, accumulatedMd, accumulatedReasoning);
      this.syncStreamingToRichTooltip(qid, accumulatedMd, accumulatedReasoning, false);
    } catch (err: any) {
      scheduler.stop();
      this.aiControllers.delete(qid);
      if (err.name === 'AbortError') return;
      console.error('[ExerciseSidebar] AI 生成失败:', err);
      const errInfo = parseAiError(err);
      if (contentEl) {
        contentEl.innerHTML = `
          <div class="ex-sb-empty" style="padding: 1rem 0;">
            <p style="color: var(--md-sys-color-error, #ba1a1a); font-size: 0.75rem; line-height: 1.5;">${errInfo.title}：${errInfo.message}</p>
            <button type="button" class="ex-sb-retry-btn" id="ai-err-retry-${qid}">重试</button>
          </div>
        `;
        document.getElementById(`ai-err-retry-${qid}`)?.addEventListener('click', () => {
          this.triggerAiGeneration(qid, q, true);
        });
      }
    }
  }

  private finishAiBoxView(qid: string, q: SlimQuestionItem, solutionMd: string, reasoningMd?: string) {
    const statusEl = document.getElementById(`ai-status-${qid}`);
    if (statusEl) {
      statusEl.setAttribute('title', '推导就绪');
      statusEl.innerHTML = `
        <svg viewBox="0 0 24 24" width="13" height="13" fill="var(--md-sys-color-primary)" style="flex-shrink:0;">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
        </svg>
      `;
    }

    const stopBtn = document.getElementById(`ai-stop-${qid}`);
    if (stopBtn) stopBtn.classList.add('hidden');

    const popoutBtn = document.getElementById(`ai-popout-${qid}`);
    if (popoutBtn) {
      popoutBtn.classList.remove('hidden');
      popoutBtn.onclick = () => {
        this.toggleAiRichTooltip(qid, popoutBtn);
      };
    }

    const copyBtn = document.getElementById(`ai-copy-${qid}`);
    if (copyBtn) {
      copyBtn.classList.remove('hidden');
      copyBtn.onclick = async () => {
        try {
          await navigator.clipboard.writeText(solutionMd);
          const oldTitle = copyBtn.getAttribute('title') || '复制 Markdown';
          copyBtn.setAttribute('title', '已复制到剪贴板！');
          copyBtn.style.color = 'var(--md-sys-color-primary)';
          setTimeout(() => {
            copyBtn.setAttribute('title', oldTitle);
            copyBtn.style.color = '';
          }, 2000);
        } catch {}
      };
    }

    const retryBtn = document.getElementById(`ai-retry-${qid}`);
    if (retryBtn) {
      retryBtn.classList.remove('hidden');
      retryBtn.onclick = () => {
        this.triggerAiGeneration(qid, q, true);
      };
    }
  }

  private renderCompletedAiSolution(qid: string, solutionMd: string) {
    const aiBody = document.getElementById(`ai-body-${qid}`);
    if (!aiBody) return;

    const config = getEffectiveAiClientConfig();
    const q = this.questionsMap.get(qid);

    aiBody.innerHTML = `
      <div class="ex-ai-box-header">
        <div class="ex-ai-box-title-group" title="当前学术模型: ${config.label}">
          <svg class="ex-ai-box-sparkle" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z"/>
          </svg>
          <span class="ex-ai-box-title">AI 规范推导</span>
          <span class="ex-ai-status-indicator" id="ai-status-${qid}" title="推导就绪">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="var(--md-sys-color-primary)" style="flex-shrink:0;">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
          </span>
        </div>
        <div class="ex-ai-box-actions">
          <button type="button" class="ex-ai-action-btn ex-ai-popout-btn" id="ai-popout-${qid}" title="在左侧弹出浮窗卡片对照查看 (M3 Rich Tooltip)" aria-label="弹出推导浮窗">
            <svg viewBox="0 0 24 24"><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg>
          </button>
          <button type="button" class="ex-ai-action-btn ex-ai-stop-btn hidden" id="ai-stop-${qid}" title="停止推理">
            <svg viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
          </button>
          <button type="button" class="ex-ai-action-btn ex-ai-copy-btn" id="ai-copy-${qid}" title="复制 Markdown">
            <svg viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
          </button>
          <button type="button" class="ex-ai-action-btn ex-ai-retry-btn" id="ai-retry-${qid}" title="重新推导">
            <svg viewBox="0 0 24 24"><path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>
          </button>
          <button type="button" class="ex-ai-action-btn ex-ai-chat-btn" id="ai-chat-${qid}" title="转入书内 AI 智能问答">
            <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>
          </button>
        </div>
      </div>
      <div class="ex-ai-box-content" id="ai-content-${qid}">
        ${renderSolutionMarkdown(solutionMd, false)}
      </div>
      <div class="ex-ai-ceded-notice" id="ai-ceded-${qid}">
        <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
          <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
        </svg>
        <span class="ex-ai-ceded-notice-text">推导过程正在左侧浮窗中对照展示</span>
        <button type="button" class="ex-ai-ceded-restore-btn" id="ai-restore-${qid}">收回侧栏</button>
      </div>
    `;

    const contentEl = document.getElementById(`ai-content-${qid}`);
    if (contentEl) {
      try {
        renderMathInElement(contentEl, KATEX_OPTIONS);
      } catch {}
    }

    const popoutBtn = document.getElementById(`ai-popout-${qid}`);
    if (popoutBtn) {
      popoutBtn.onclick = () => {
        this.toggleAiRichTooltip(qid, popoutBtn);
      };
    }

    document.getElementById(`ai-restore-${qid}`)?.addEventListener('click', () => {
      this.closeAiRichTooltip();
    });

    if (q) {
      this.finishAiBoxView(qid, q, solutionMd);
      document.getElementById(`ai-chat-${qid}`)?.addEventListener('click', () => {
        window.dispatchEvent(
          new CustomEvent('aiask:query', {
            detail: {
              prompt: `请对这道题目展开深入解析并讲解核心考点与解题思路：\n${q.stem_raw || q.stem_html}`,
              autoSubmit: true,
            },
          })
        );
      });
    }
  }

  private renderAiKeyPrompt(qid: string, q: SlimQuestionItem) {
    const aiBody = document.getElementById(`ai-body-${qid}`);
    if (!aiBody) return;

    const config = getEffectiveAiClientConfig();

    aiBody.innerHTML = `
      <div class="ex-ai-box-header">
        <div class="ex-ai-box-title-group">
          <svg class="ex-ai-box-sparkle" viewBox="0 0 24 24">
            <path d="M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z"/>
          </svg>
          <span class="ex-ai-box-title">AI 规范推导配置</span>
          <span class="ex-ai-model-chip">${config.label}</span>
        </div>
      </div>
      <div class="ex-ai-key-card">
        <div class="ex-ai-key-card-tip">未检测到有效 API 凭据。请输入用于 ${config.label} 的 API Key，密钥仅安全存储在本机浏览器中：</div>
        <div class="ex-ai-key-card-row">
          <input type="password" class="ex-ai-key-input" id="ai-key-input-${qid}" placeholder="输入 sk-... API Key" autocomplete="off" />
          <button type="button" class="ex-ai-key-save-btn" id="ai-key-save-${qid}">保存并推导</button>
        </div>
      </div>
    `;

    document.getElementById(`ai-key-save-${qid}`)?.addEventListener('click', () => {
      const input = document.getElementById(`ai-key-input-${qid}`) as HTMLInputElement;
      const keyVal = input?.value.trim();
      if (!keyVal) return;
      saveAiApiKey(config.model, keyVal);
      this.triggerAiGeneration(qid, q);
    });
  }

  private renderLicenseBannerCard(bank: ExerciseBank): string {
    const lic = bank.license;
    if (!lic) return '';

    return `
      <section class="ex-license-banner-card" role="region" aria-label="${bank.title} 开源许可与来源声明">
        <div class="ex-license-card-header">
          <span class="ex-license-card-title">${bank.title} · 开源许可与来源声明</span>
        </div>
        <div class="ex-license-card-section-label">使用须知与开源条款</div>
        <ul class="ex-license-card-list">
          <li class="ex-license-card-item">
            <svg class="ex-license-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z"/>
            </svg>
            <div class="ex-license-item-text">
              遵循 <strong>${lic.shortName || 'CC BY-NC-SA 4.0'}</strong> 国际许可协议（${lic.name || '署名-非商业性使用-相同方式共享'}）
            </div>
          </li>
          ${
            lic.repoUrl
              ? `
            <li class="ex-license-card-item">
              <svg class="ex-license-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
              </svg>
              <div class="ex-license-item-text">
                开源归档仓库：<a href="${lic.repoUrl}" target="_blank" rel="noopener noreferrer" class="ex-license-repo-link">${lic.repoName || '查看 GitHub 仓库'}<span class="ex-link-arrow"> ↗</span></a>
              </div>
            </li>
          `
              : ''
          }
          <li class="ex-license-card-item">
            <svg class="ex-license-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
            </svg>
            <div class="ex-license-item-text">
              试卷题库提取自${lic.author || '开源团队'}，由本项目进行数字化排版，仅供自测学习与学术研讨使用，严禁商用。
            </div>
          </li>
        </ul>
      </section>
    `;
  }

  private getOrCreateRichTooltip(): HTMLElement {
    let el = document.getElementById('ex-ai-rich-tooltip');
    if (!el) {
      el = document.createElement('div');
      el.id = 'ex-ai-rich-tooltip';
      el.className = 'ex-ai-rich-tooltip';
      el.setAttribute('role', 'dialog');
      el.setAttribute('aria-modal', 'false');
      el.setAttribute('aria-hidden', 'true');
      document.body.appendChild(el);
    }
    this.tooltipEl = el;
    return el;
  }

  private toggleAiRichTooltip(qid: string, triggerBtn: HTMLElement) {
    if (this.activeTooltipQid === qid) {
      this.closeAiRichTooltip();
    } else {
      this.openAiRichTooltip(qid, triggerBtn);
    }
  }

  private openAiRichTooltip(qid: string, triggerBtn: HTMLElement) {
    const q = this.questionsMap.get(qid);
    if (!q) return;

    if (this.activeTooltipQid && this.activeTooltipQid !== qid) {
      document.getElementById(`ai-body-${this.activeTooltipQid}`)?.classList.remove('tooltip-active-ceded');
    }

    this.activeTooltipQid = qid;
    this.isTooltipPinned = false;
    this.isCustomPositioned = false;
    const tooltip = this.getOrCreateRichTooltip();
    tooltip.classList.remove('is-pinned', 'is-custom-positioned', 'is-dragging');
    const config = getEffectiveAiClientConfig();
    const qIndex = this.questionIndexMap.get(qid) || 1;
    const solutionMd = this.getStoredAiSolution(qid) || '';
    const reasoningMd = this.getStoredAiReasoning(qid) || '';

    document.getElementById(`ai-body-${qid}`)?.classList.add('tooltip-active-ceded');

    document.querySelectorAll('.ex-ai-popout-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.id === `ai-popout-${qid}`);
    });

    tooltip.innerHTML = `
      <div class="ex-ai-rich-tooltip-caret" aria-hidden="true"></div>
      <div class="ex-ai-rich-tooltip-header">
        <div class="ex-ai-rich-tooltip-title-group">
          <svg class="ex-ai-rich-tooltip-sparkle" viewBox="0 0 24 24" width="16" height="16" fill="var(--md-sys-color-primary)" aria-hidden="true">
            <path d="M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z"/>
          </svg>
          <span class="ex-ai-rich-tooltip-title">第 ${qIndex} 题 · AI 规范推导</span>
          <span class="ex-ai-rich-tooltip-badge">${config.label}</span>
        </div>
        <div class="ex-ai-rich-tooltip-actions">
          <md-icon-button
            toggle
            touch-target="none"
            class="ex-ai-rich-tooltip-action-btn ex-ai-tooltip-pin-btn"
            id="ex-tooltip-pin"
            title="固定浮窗 (不因外部点击关闭)"
            aria-label="固定浮窗"
          >
            <md-icon class="ex-pin-icon-unpinned">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M14 4v5c0 1.12.37 2.16 1 3H9c.65-.86 1-1.9 1-3V4h4m3-2H7c-.55 0-1 .45-1 1s.45 1 1 1h1v5c0 1.66-1.34 3-3 3v2h5.97v7l1 1 1-1v-7H19v-2c-1.66 0-3-1.34-3-3V4h1c.55 0 1-.45 1-1s-.45-1-1-1z"/>
              </svg>
            </md-icon>
            <md-icon slot="selected" class="ex-pin-icon-pinned">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M16 9V4h1c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1h1v5c0 1.66-1.34 3-3 3v2h5.97v7l1 1 1-1v-7H19v-2c-1.66 0-3-1.34-3-3z"/>
              </svg>
            </md-icon>
          </md-icon-button>
          <md-icon-button
            touch-target="none"
            class="ex-ai-rich-tooltip-action-btn ex-ai-tooltip-drag-btn"
            id="ex-tooltip-drag"
            title="按住拖动浮窗"
            aria-label="拖动浮窗"
          >
            <md-icon>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="5 9 2 12 5 15"></polyline>
                <polyline points="9 5 12 2 15 5"></polyline>
                <polyline points="15 19 12 22 9 19"></polyline>
                <polyline points="19 9 22 12 19 15"></polyline>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <line x1="12" y1="2" x2="12" y2="22"></line>
              </svg>
            </md-icon>
          </md-icon-button>
          <md-icon-button
            touch-target="none"
            class="ex-ai-rich-tooltip-action-btn ex-ai-rich-tooltip-close"
            id="ex-tooltip-close"
            title="关闭浮窗 (Esc)"
            aria-label="关闭"
          >
            <md-icon>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </md-icon>
          </md-icon-button>
        </div>
      </div>
      <div class="ex-ai-rich-tooltip-body" id="ex-tooltip-body">
        <div class="ex-ai-cot-container" id="ex-tooltip-cot-container">
          ${this.renderCotAccordionHtml(reasoningMd, this.aiControllers.has(qid))}
        </div>
        <div class="ex-ai-solution-content" id="ex-tooltip-solution">
          ${renderSolutionMarkdown(solutionMd, this.aiControllers.has(qid))}
        </div>
      </div>
      <div class="ex-ai-rich-tooltip-footer">
        <button type="button" class="ex-ai-rich-tooltip-btn ex-btn-text" id="ex-tooltip-chat" title="转入书内问答">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>
          <span>转入问答</span>
        </button>
        <button type="button" class="ex-ai-rich-tooltip-btn ex-btn-text" id="ex-tooltip-copy" title="复制推导全文">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
          <span>复制推导</span>
        </button>
        <button type="button" class="ex-ai-rich-tooltip-btn ex-btn-tonal" id="ex-tooltip-dismiss">
          <span>关闭</span>
        </button>
      </div>
    `;

    document.getElementById('ex-tooltip-close')?.addEventListener('click', () => this.closeAiRichTooltip());
    document.getElementById('ex-tooltip-dismiss')?.addEventListener('click', () => this.closeAiRichTooltip());

    const pinBtn = document.getElementById('ex-tooltip-pin') as any;
    if (pinBtn) {
      const syncPin = (newPinned: boolean) => {
        this.isTooltipPinned = newPinned;
        pinBtn.selected = newPinned;
        if (newPinned) {
          pinBtn.setAttribute('selected', '');
        } else {
          pinBtn.removeAttribute('selected');
        }
        pinBtn.title = newPinned ? '取消固定浮窗' : '固定浮窗 (不因外部点击关闭)';
        pinBtn.setAttribute('aria-label', newPinned ? '取消固定' : '固定浮窗');
        tooltip.classList.toggle('is-pinned', newPinned);
      };

      pinBtn.addEventListener('click', (e: Event) => {
        e.stopPropagation();
        syncPin(!this.isTooltipPinned);
      });

      pinBtn.addEventListener('input', (e: Event) => {
        e.stopPropagation();
        syncPin(Boolean(pinBtn.selected));
      });
    }

    const dragBtn = document.getElementById('ex-tooltip-drag') as HTMLElement;
    if (dragBtn) {
      dragBtn.addEventListener('pointerdown', (e: PointerEvent) => {
        if (e.button !== 0) return;
        if (!this.tooltipEl) return;

        try {
          dragBtn.setPointerCapture(e.pointerId);
        } catch {}

        const rect = this.tooltipEl.getBoundingClientRect();
        const startX = e.clientX;
        const startY = e.clientY;
        const initialLeft = rect.left;
        const initialTop = rect.top;

        this.tooltipEl.style.left = `${initialLeft}px`;
        this.tooltipEl.style.right = 'auto';
        this.tooltipEl.style.top = `${initialTop}px`;
        this.tooltipEl.classList.add('is-dragging', 'is-custom-positioned');
        this.isCustomPositioned = true;

        const onPointerMove = (moveEvt: PointerEvent) => {
          if (!this.tooltipEl) return;
          const deltaX = moveEvt.clientX - startX;
          const deltaY = moveEvt.clientY - startY;

          const currentW = rect.width;
          const currentH = this.tooltipEl.offsetHeight || rect.height;

          const newLeft = initialLeft + deltaX;
          const newTop = initialTop + deltaY;

          const clampX = Math.max(8, Math.min(newLeft, window.innerWidth - currentW - 8));
          const clampY = Math.max(8, Math.min(newTop, window.innerHeight - currentH - 8));

          this.tooltipEl.style.left = `${clampX}px`;
          this.tooltipEl.style.top = `${clampY}px`;
        };

        const onPointerUp = (upEvt: PointerEvent) => {
          try {
            dragBtn.releasePointerCapture(upEvt.pointerId);
          } catch {}
          dragBtn.removeEventListener('pointermove', onPointerMove);
          dragBtn.removeEventListener('pointerup', onPointerUp);
          dragBtn.removeEventListener('pointercancel', onPointerUp);

          this.tooltipEl?.classList.remove('is-dragging');
        };

        dragBtn.addEventListener('pointermove', onPointerMove);
        dragBtn.addEventListener('pointerup', onPointerUp);
        dragBtn.addEventListener('pointercancel', onPointerUp);
      });
    }

    document.getElementById('ex-tooltip-copy')?.addEventListener('click', async () => {
      const sol = this.getStoredAiSolution(qid) || '';
      if (!sol) return;
      try {
        await navigator.clipboard.writeText(sol);
        const copyBtn = document.getElementById('ex-tooltip-copy');
        if (copyBtn) {
          copyBtn.innerHTML = `
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
            <span>已复制</span>
          `;
          setTimeout(() => {
            if (copyBtn) {
              copyBtn.innerHTML = `
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                <span>复制推导</span>
              `;
            }
          }, 2000);
        }
      } catch {}
    });

    document.getElementById('ex-tooltip-chat')?.addEventListener('click', () => {
      window.dispatchEvent(
        new CustomEvent('aiask:query', {
          detail: {
            prompt: `请对这道题目展开深入解析并讲解核心考点与解题思路：\n${q.stem_raw || q.stem_html}`,
            autoSubmit: true,
          },
        })
      );
    });

    this.bindCotToggle();

    const bodyEl = document.getElementById('ex-tooltip-body');
    if (bodyEl) {
      try {
        renderMathInElement(bodyEl, KATEX_OPTIONS);
      } catch {}
    }

    this.repositionRichTooltip(triggerBtn);

    tooltip.classList.add('visible');
    tooltip.setAttribute('aria-hidden', 'false');

    requestAnimationFrame(() => {
      this.repositionRichTooltip(triggerBtn);
    });
  }

  private repositionRichTooltip(triggerBtn: HTMLElement) {
    if (!this.tooltipEl) return;
    const btnRect = triggerBtn.getBoundingClientRect();
    const sidebar = document.querySelector('.custom-page-sidebar') || document.getElementById('exercise-sidebar-panel');
    const sidebarRect = sidebar ? sidebar.getBoundingClientRect() : { left: window.innerWidth - 320 };

    const rightDist = window.innerWidth - sidebarRect.left + 14;
    this.tooltipEl.style.right = `${Math.max(16, rightDist)}px`;
    this.tooltipEl.style.left = 'auto';

    const viewportH = window.innerHeight;
    const navHeight = 72;
    const bottomPadding = 24;
    const maxAvailableH = Math.max(260, viewportH - navHeight - bottomPadding);

    const targetH = Math.min(maxAvailableH, 620);

    const btnCenterY = btnRect.top + btnRect.height / 2;
    let top = btnRect.top - 24;

    const maxTop = Math.max(navHeight, viewportH - targetH - bottomPadding);
    top = Math.max(navHeight, Math.min(top, maxTop));

    this.tooltipEl.style.top = `${top}px`;

    this.tooltipEl.style.maxHeight = `${viewportH - top - bottomPadding}px`;

    const caret = this.tooltipEl.querySelector('.ex-ai-rich-tooltip-caret') as HTMLElement;
    if (caret) {
      const caretTop = btnCenterY - top - 6;

      const actualHeight = this.tooltipEl.offsetHeight || targetH;
      const clampedCaretTop = Math.max(20, Math.min(caretTop, actualHeight - 36));
      caret.style.top = `${clampedCaretTop}px`;
    }
  }

  private closeAiRichTooltip() {
    const prevQid = this.activeTooltipQid;
    this.isTooltipPinned = false;
    this.isCustomPositioned = false;
    if (this.tooltipEl) {
      this.tooltipEl.classList.remove('visible', 'is-pinned', 'is-custom-positioned', 'is-dragging');
      this.tooltipEl.setAttribute('aria-hidden', 'true');
    }
    document.querySelectorAll('.ex-ai-popout-btn').forEach((btn) => {
      btn.classList.remove('active');
    });
    this.activeTooltipQid = null;

    if (prevQid) {
      const aiBody = document.getElementById(`ai-body-${prevQid}`);
      if (aiBody) {
        aiBody.classList.remove('tooltip-active-ceded');

        const contentEl = document.getElementById(`ai-content-${prevQid}`);
        if (contentEl) {
          try {
            renderMathInElement(contentEl, KATEX_OPTIONS);
          } catch {}
        }
      }
    }
  }

  private syncStreamingToRichTooltip(qid: string, md: string, reasoningMd = '', isStreaming = true) {
    if (this.activeTooltipQid !== qid) return;

    const cotContainer = document.getElementById('ex-tooltip-cot-container');
    if (cotContainer) {
      let box = document.getElementById('ex-tooltip-cot-box');
      if (!box && (reasoningMd || (isStreaming && !md))) {
        cotContainer.innerHTML = this.renderCotAccordionHtml(reasoningMd, isStreaming && !md);
        this.bindCotToggle();
        box = document.getElementById('ex-tooltip-cot-box');
      }

      if (box) {

        const summaryEl = document.getElementById('ex-tooltip-cot-summary');
        if (summaryEl) {
          summaryEl.textContent = isStreaming && !md
            ? (reasoningMd ? `正在深度推理推演中... · ${reasoningMd.length} 字` : '正在深度推理推演中...')
            : `已完成思考 · 共 ${reasoningMd.length} 字`;
        }

        const isExpanded = box.classList.contains('is-expanded');
        if (isExpanded) {
          const content = document.getElementById('ex-tooltip-cot-content');
          if (content) {
            content.innerHTML = renderSolutionMarkdown(reasoningMd, isStreaming && !md);
            try {
              renderMathInElement(content, KATEX_OPTIONS);
            } catch {}
          }
        }
      }
    }

    const solutionEl = document.getElementById('ex-tooltip-solution');
    if (solutionEl) {
      solutionEl.innerHTML = renderSolutionMarkdown(md, isStreaming);
      try {
        renderMathInElement(solutionEl, KATEX_OPTIONS);
      } catch {}
    } else {
      const bodyEl = document.getElementById('ex-tooltip-body');
      if (bodyEl && !cotContainer) {
        bodyEl.innerHTML = renderSolutionMarkdown(md, isStreaming);
        try {
          renderMathInElement(bodyEl, KATEX_OPTIONS);
        } catch {}
      }
    }
  }
}

let sidebarControllerInstance: ExerciseSidebarController | null = null;

export function getExerciseSidebarController(): ExerciseSidebarController {
  if (!sidebarControllerInstance) {
    sidebarControllerInstance = new ExerciseSidebarController();
  }
  return sidebarControllerInstance;
}
