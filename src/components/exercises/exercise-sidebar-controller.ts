import { ExerciseMathTooltip } from './exercise-math-tooltip';
/**
 * src/components/exercises/exercise-sidebar-controller.ts
 * 课后习题右侧栏抽屉控制器 & M3 Rich Tooltip 交互调度器
 *
 * 核心职责：
 * 1. 拦截各章节末尾 `ExerciseTrigger` 中的 `<md-filter-chip>` 点击事件；
 * 2. 调度右侧边栏（`PageSidebar`）：将章内大纲收纳至顶栏，展开习题专属抽屉；
 * 3. 动态拉取对应章节题目数据并按当前节及选定题库进行过滤；
 * 4. 渲染极简学术风格的轻量 MD 卡片与折叠式推导解析；
 * 5. 挂载 M3 Rich Tooltip，展示开源协议信息并提供原项目 GitHub 外链；
 * 6. 联动全屏自测模态框（ExerciseModal）。
 */

import type { SlimQuestionItem, ChapterData } from '../../types/exercises';
import { getExerciseBankById, type ExerciseBank } from '../../config/exercise-banks.config';
import { streamChat } from '../../ai/llm.mjs';
import { getEffectiveAiClientConfig, saveAiApiKey } from '../../ai/ai-config';
import { parseAiError } from '../../ai/error-handler';
import renderMathInElement from 'katex/dist/contrib/auto-render.mjs';
import { StreamThrottleScheduler } from './stream-scheduler';
import { sideloadManager } from '../sideload/sideload-manager';
import { createM3LoadingHtml } from '../common/m3-loading-helper';
import '@material/web/iconbutton/icon-button.js';
import '@material/web/icon/icon.js';
import '@material/web/progress/circular-progress.js';

import { renderAcademicSolutionMarkdown as renderSolutionMarkdown, EXERCISE_KATEX_OPTIONS as KATEX_OPTIONS } from './exercise-markdown';

const ACTIVE_BANK_SESSION_KEY = 'astrolib_active_exercise_bank';

interface ActiveExerciseSession {
  bankId: string;
  bookSlug: string;
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
  private unsubSideload: (() => void) | null = null;
  private displayedSidebarLimit = 12;
  private currentFilteredList: SlimQuestionItem[] = [];
  private currentProbeToken = 0;

  constructor() {
    // 监听全局按键：Esc 退出习题模式（与顶栏大纲及全量模态题库状态独立）
    if (typeof window !== 'undefined') {
      // 监听页面卸载，中止运行中 AI 流，清理 DOM 句柄与旧请求；保留 chapterCache 以加速同章跨节翻页
      document.addEventListener('astrolib:page-unload', () => {
        this.currentProbeToken++;
        this.closeInternal();
        this.aiSolutions.clear();
        this.aiReasonings.clear();
        this.mathTooltip.destroy();
      });

      window.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;

        // 0. 若 AI Rich Tooltip 浮窗处于打开状态，优先由浮窗消费 Esc 并关闭
        if (this.mathTooltip.getActiveQid()) {
          this.closeAiRichTooltip();
          return;
        }

        if (!this.isOpen) return;

        // 1. 若全屏题库中心处于打开状态 (is-open)，优先由模态框消费 Esc，右侧栏保持开启
        const modal = document.getElementById('exercise-modal-root');
        if (modal && modal.classList.contains('is-open')) {
          return;
        }

        // 2. 若顶栏大纲浮层处于打开状态 (mobile-toc-open)，优先由大纲浮层消费 Esc，右侧栏保持开启
        if (document.body.classList.contains('mobile-toc-open')) {
          return;
        }

        // 3. 仅当无前台浮层与弹窗时，Esc 才收起右侧习题抽屉
        this.close();
      });
    }
  }

  /**
   * 初始化挂载事件监听（在 DOMContentLoaded 与 astro:page-load 时执行）
   */
  public init() {
    this.bindTriggerChips();
    this.bindPanelActions();

    // 幂等订阅统一侧载状态变化，避免跨章节切换时监听器无节制叠加
    if (this.unsubSideload) {
      this.unsubSideload();
      this.unsubSideload = null;
    }
    this.unsubSideload = sideloadManager.subscribe((state) => {
      if (state.activePanelId !== 'exercises' && this.isOpen) {
        this.clearActiveSession();
        this.closeInternal();
      }
    });

    // 异步非阻塞：若此前章节已展开某习题集，尝试探测并平滑恢复当前小节题目
    this.probeAndRestoreActiveSession();
  }

  /**
   * 绑定章节末尾 ExerciseTrigger 内部的 Chip 点击事件
   */
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

  /**
   * 绑定右侧栏习题面板内的关闭与“打开完整题库”按钮
   */
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

  /**
   * 持久化当前激活的题库会话（SessionStorage 驱动，跨小节翻页保持）
   */
  private saveActiveSession(bankId: string, bookSlug: string): void {
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(
          ACTIVE_BANK_SESSION_KEY,
          JSON.stringify({ bankId, bookSlug })
        );
      }
    } catch {}
  }

  /**
   * 获取当前活跃的题库会话
   */
  private getActiveSession(): ActiveExerciseSession | null {
    try {
      if (typeof sessionStorage !== 'undefined') {
        const raw = sessionStorage.getItem(ACTIVE_BANK_SESSION_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed.bankId === 'string' && typeof parsed.bookSlug === 'string') {
            return parsed;
          }
        }
      }
    } catch {}
    return null;
  }

  /**
   * 清除当前活跃题库会话（仅在用户明确主动关闭习题栏时触发）
   */
  public clearActiveSession(): void {
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem(ACTIVE_BANK_SESSION_KEY);
      }
    } catch {}
  }

  /**
   * 异步非阻塞探测：若读者此前已展开某题库，且新章节收录有该题库题目，则平滑自动恢复展示
   * 全过程推迟至主渲染帧之后执行，0ms 阻塞页面秒开与正文交互
   */
  private probeAndRestoreActiveSession(): void {
    if (typeof window === 'undefined') return;

    const activeSession = this.getActiveSession();
    if (!activeSession) return;

    // 探测当前页面是否含有习题卡片
    const triggerCard = document.querySelector('[data-exercise-trigger-card]');
    if (!triggerCard) {
      // 当前页面无习题卡片（如前言、附录、纯概述节），保持默认大纲展示，不打扰阅读
      return;
    }

    const currentBookSlug = triggerCard.getAttribute('data-book') || '';
    // 跨书安全守卫：若当前书籍与记录的习题集所属书籍不同，清除记录并退出
    if (currentBookSlug && activeSession.bookSlug && currentBookSlug !== activeSession.bookSlug) {
      this.clearActiveSession();
      return;
    }

    const targetBankId = activeSession.bankId;
    const targetChip = triggerCard.querySelector<HTMLElement>(`.ex-bank-chip[data-bank-id="${targetBankId}"]`);
    if (!targetChip) {
      // 当前小节未挂载该题库，保持大纲
      return;
    }

    const chapter = parseInt(triggerCard.getAttribute('data-chapter') || '1', 10);
    const section = triggerCard.getAttribute('data-section') || 'all';
    const book = currentBookSlug || 'engineering_analysis';

    const token = ++this.currentProbeToken;

    // 使用 requestAnimationFrame 将探测与渲染工作排入下一次空闲微任务，绝不阻塞当前主渲染帧
    requestAnimationFrame(async () => {
      if (token !== this.currentProbeToken) return;

      const questionCount = await this.probeSectionQuestionCount(book, chapter, section, targetBankId);
      if (token !== this.currentProbeToken) return;

      // 仅当本节在当前已打开的习题集中确实收录有题目时，才自动恢复展开
      if (questionCount > 0) {
        // 取消其他 chip 的选中态
        document.querySelectorAll('.ex-bank-chip').forEach((c: any) => {
          if (typeof c.selected === 'boolean') {
            c.selected = false;
          }
        });

        // 激活当前 Chip
        if (typeof (targetChip as any).selected === 'boolean') {
          (targetChip as any).selected = true;
        }
        this.activeChip = targetChip;
        this.activeBankId = targetBankId;
        this.currentChapter = chapter;
        this.currentSection = section;
        this.currentBook = book;

        await this.open();
      }
    });
  }

  /**
   * 探测指定章节及题库下的题目数量（优先从 LRU 内存缓存读取，未命中则异步获取）
   */
  private async probeSectionQuestionCount(
    book: string,
    chapter: number,
    section: string,
    bankId: string
  ): Promise<number> {
    const cacheKey = `${book}_ch${chapter}`;
    let chapterData = this.chapterCache.get(cacheKey);

    if (!chapterData) {
      try {
        const resp = await fetch(`/data/exercises/${book}/ch${chapter}.json`);
        if (!resp.ok) return 0;
        chapterData = (await resp.json()) as ChapterData;
        this.chapterCache.set(cacheKey, chapterData);
        this.trimChapterCache(2);
      } catch {
        return 0;
      }
    }

    const bankConfig = getExerciseBankById(bankId);
    const targetSourceType = bankConfig?.sourceType || 'exam';
    const questions = chapterData.questions || [];

    const matched = questions.filter((q) => {
      const qSourceType = q.source_type || 'exam';
      if (qSourceType !== targetSourceType) return false;

      if (section === 'all') return true;
      if (q.sec === section) return true;
      if (q.sec_slug && q.sec_slug.startsWith(section)) return true;
      return false;
    });

    return matched.length;
  }

  /**
   * 响应读者点击习题册 Chip
   */
  public handleChipClick(
    chip: HTMLElement,
    bankId: string,
    chapter: number,
    section: string,
    book: string
  ) {
    // 若点击已选中的 Chip，则取消选中并关闭右侧习题栏（明确关闭意图）
    if (this.isOpen && this.activeBankId === bankId) {
      this.close();
      return;
    }

    // 取消其他 chip 的 selected 状态
    document.querySelectorAll('.ex-bank-chip').forEach((c: any) => {
      if (typeof c.selected === 'boolean') {
        c.selected = false;
      }
    });

    // 选中当前 Chip
    if (typeof (chip as any).selected === 'boolean') {
      (chip as any).selected = true;
    }
    this.activeChip = chip;
    this.activeBankId = bankId;
    this.currentChapter = chapter;
    this.currentSection = section;
    this.currentBook = book;

    this.saveActiveSession(bankId, book);
    this.open();
  }

  /**
   * 打开右侧栏习题面板，统一调度侧载宿主
   */
  public async open() {
    this.isOpen = true;

    if (this.activeBankId && this.currentBook) {
      this.saveActiveSession(this.activeBankId, this.currentBook);
    }

    // 1. 通过统一侧载管理器激活习题面板（驱动宽度平滑自适应与正文协同）
    sideloadManager.open('exercises');

    const panel = document.getElementById('exercise-sidebar-panel');
    if (panel) {
      panel.setAttribute('aria-hidden', 'false');
      panel.classList.add('active');
    }

    // 2. 更新面板头部信息
    const bankConfig = this.activeBankId ? getExerciseBankById(this.activeBankId) : undefined;
    const titleEl = document.getElementById('ex-sidebar-title');
    if (titleEl) {
      titleEl.textContent = bankConfig?.title || '课后习题';
    }

    const countEl = document.getElementById('ex-sidebar-count');
    if (countEl) {
      countEl.textContent = '加载中...';
    }

    // 3. 渲染骨架加载态
    const contentEl = document.getElementById('ex-sidebar-content');
    if (contentEl) {
      contentEl.innerHTML = createM3LoadingHtml({
        variant: 'default',
        size: 'small',
        layout: 'inline',
        label: '正在加载本节题目与 KaTeX 公式...',
        className: 'ex-sb-loading',
      });
    }

    // 4. 加载数据并渲染题目
    await this.loadAndRenderQuestions();
  }

  /**
   * 关闭右侧习题面板，切回大纲原生显示（用户主动关闭操作）
   */
  public close() {
    this.clearActiveSession();
    this.closeInternal();
    sideloadManager.switchToDefault();
  }

  /**
   * 内部状态与控制器清理（不直接触发外部状态循环）
   */
  public closeInternal() {
    this.isOpen = false;
    this.activeBankId = null;

    // 关闭 AI Rich Tooltip 浮窗
    this.closeAiRichTooltip();

    // 中止正在流式推导的 AI 控制器
    this.aiControllers.forEach((c) => c.abort());
    this.aiControllers.clear();

    // 取消 chip 选中态
    if (this.activeChip && typeof (this.activeChip as any).selected === 'boolean') {
      (this.activeChip as any).selected = false;
    }
    this.activeChip = null;
    document.querySelectorAll('.ex-bank-chip').forEach((c: any) => {
      if (typeof c.selected === 'boolean') {
        c.selected = false;
      }
    });

    // 释放题目索引与当前过滤列表
    this.questionsMap.clear();
    this.questionIndexMap.clear();
    this.currentFilteredList = [];

    const panel = document.getElementById('exercise-sidebar-panel');
    if (panel) {
      panel.setAttribute('aria-hidden', 'true');
      panel.classList.remove('active');
    }

    // 清空 DOM 释放 KaTeX 节点内存
    const contentEl = document.getElementById('ex-sidebar-content');
    if (contentEl) {
      contentEl.innerHTML = '';
    }
  }

  /**
   * LRU 缓存淘汰策略：保持最多保活 max 个章节 JSON，防止内存单调无上限膨胀
   */
  private trimChapterCache(max = 2) {
    while (this.chapterCache.size > max) {
      const oldestKey = this.chapterCache.keys().next().value;
      if (oldestKey) {
        this.chapterCache.delete(oldestKey);
      } else {
        break;
      }
    }
  }

  /**
   * 调取 ExerciseModal 全屏打开完整题库
   */
  public async openInFullModal() {
    try {
      window.dispatchEvent(
        new CustomEvent('exercises:open', {
          detail: {
            chapter: this.currentChapter,
            section: this.currentSection,
            book: this.currentBook,
          },
        })
      );
    } catch (err) {
      console.error('[ExerciseSidebar] 打开全量题库中心失败:', err);
    }
  }

  /**
   * 加载本章 JSON 并过滤渲染本节题目
   */
  private async loadAndRenderQuestions() {
    const cacheKey = `${this.currentBook}_ch${this.currentChapter}`;
    let chapterData = this.chapterCache.get(cacheKey);

    if (!chapterData) {
      try {
        const resp = await fetch(`/data/exercises/${this.currentBook}/ch${this.currentChapter}.json`);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        chapterData = (await resp.json()) as ChapterData;
        this.chapterCache.set(cacheKey, chapterData);
        this.trimChapterCache(2);
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

    // 筛选适用于当前节与题库类型的题目
    const allQuestions = chapterData.questions || [];
    const filtered = allQuestions.filter((q) => {
      // 1. 过滤题库来源类型
      const qSourceType = q.source_type || 'exam';
      if (qSourceType !== targetSourceType) return false;

      // 2. 过滤小节
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

    // 缓存题目对象方便 AI 与解析调用
    filtered.forEach((q, idx) => {
      this.questionsMap.set(q.id, q);
      this.questionIndexMap.set(q.id, idx + 1);
    });

    this.currentFilteredList = filtered;
    this.displayedSidebarLimit = 12;

    // 分块渲染题目列表与加载更多按钮
    this.renderSidebarQuestionsChunk(contentEl, licenseBannerHtml);
  }

  /**
   * 分块按需渲染侧栏题目列表
   */
  private renderSidebarQuestionsChunk(contentEl: HTMLElement, licenseBannerHtml = '') {
    const total = this.currentFilteredList.length;
    const chunk = this.currentFilteredList.slice(0, this.displayedSidebarLimit);
    const hasMore = total > this.displayedSidebarLimit;

    const cardsHtml = chunk.map((q, idx) => this.renderQuestionCard(q, idx)).join('');
    const loadMoreHtml = hasMore
      ? `
        <div class="ex-sb-load-more-wrap" id="ex-sb-load-more-wrap">
          <button type="button" class="ex-sb-load-more-btn" id="ex-sb-load-more">
            加载更多题目 (${chunk.length}/${total})
          </button>
        </div>
      `
      : '';

    contentEl.innerHTML = `${licenseBannerHtml}<div class="ex-sb-cards-list" id="ex-sb-cards-list">${cardsHtml}</div>${loadMoreHtml}`;

    this.bindQuestionCardInteractions(contentEl);
    this.bindLoadMoreAction();
  }

  /**
   * 绑定加载更多按钮交互（仅追加 DOM 片段，不销毁已挂载卡片状态）
   */
  private bindLoadMoreAction() {
    const loadMoreBtn = document.getElementById('ex-sb-load-more');
    if (!loadMoreBtn) return;

    loadMoreBtn.onclick = () => {
      const cardsList = document.getElementById('ex-sb-cards-list');
      const loadMoreWrap = document.getElementById('ex-sb-load-more-wrap');
      if (!cardsList) return;

      const currentCount = this.displayedSidebarLimit;
      const nextCount = currentCount + 12;
      const nextChunk = this.currentFilteredList.slice(currentCount, nextCount);
      this.displayedSidebarLimit = nextCount;

      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = nextChunk.map((q, idx) => this.renderQuestionCard(q, currentCount + idx)).join('');

      this.bindQuestionCardInteractions(tempDiv);
      while (tempDiv.firstChild) {
        cardsList.appendChild(tempDiv.firstChild);
      }

      const total = this.currentFilteredList.length;
      if (this.displayedSidebarLimit >= total) {
        loadMoreWrap?.remove();
      } else {
        const displayed = Math.min(this.displayedSidebarLimit, total);
        loadMoreBtn.textContent = `加载更多题目 (${displayed}/${total})`;
      }
    };
  }

  /**
   * 构造单道题目的轻量 Material 3 Filled 卡片 HTML
   */
  private renderQuestionCard(q: SlimQuestionItem, index: number): string {
    const typeNames: Record<string, string> = {
      choice: '单选题',
      blank: '填空题',
      calc: '计算题',
      proof: '证明题',
    };
    const typeLabel = typeNames[q.type] || '练习题';
    const sourceLabel = q.source || q.paper_title || `第 ${q.paper_q_num || index + 1} 题`;

    // 选项列表（单选题）
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

    // 解题答案与推导步骤是否存在
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

        <!-- 官方解析面板 (按需挂载，初始为空以防内存膨胀) -->
        ${
          hasSolution
            ? `<div class="ex-card-solution-body" id="sol-body-${q.id}" hidden></div>`
            : ''
        }

        <!-- AI 规范推导面板 (默认折叠) -->
        <div class="ex-card-ai-body" id="ai-body-${q.id}" hidden></div>
      </article>
    `;
  }

  /**
   * 延迟构造官方推导与解析 HTML
   */
  private renderSolutionBodyHtml(q: SlimQuestionItem): string {
    const hasAnswer = Boolean(q.answer_html || q.answer);
    const hasSteps = Boolean(q.steps_html);
    const hasHints = Boolean(q.hints_html);

    return `
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
    `;
  }

  /**
   * 绑定题目卡片交互：官方解析展开与 Ask AI 流式推导
   */
  private bindQuestionCardInteractions(contentEl: HTMLElement) {
    // 1. 官方解析展开/收起 (按需延迟挂载 DOM 与 KaTeX)
    contentEl.querySelectorAll<HTMLElement>('.ex-card-toggle-sol').forEach((btn) => {
      btn.onclick = () => {
        const qid = btn.getAttribute('data-qid');
        if (!qid) return;
        const solBody = document.getElementById(`sol-body-${qid}`);
        if (!solBody) return;

        const isExpanded = btn.getAttribute('aria-expanded') === 'true';
        if (!isExpanded && !solBody.hasChildNodes()) {
          const q = this.questionsMap.get(qid);
          if (q) {
            solBody.innerHTML = this.renderSolutionBodyHtml(q);
          }
        }
        btn.setAttribute('aria-expanded', String(!isExpanded));
        btn.classList.toggle('active', !isExpanded);
        solBody.hidden = isExpanded;
      };
    });

    // 2. Ask AI 展开与推导
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
          if (this.mathTooltip.getActiveQid() === qid) {
            this.closeAiRichTooltip();
          }
          return;
        }

        aiBody.hidden = false;
        btn.setAttribute('aria-expanded', 'true');
        btn.classList.add('active');

        // 检查本地已有缓存
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

  /**
   * 获取本地缓存的题解
   */
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

  /**
   * 获取本地缓存的深度思考推导链 (CoT)
   */
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

  /**
   * 渲染 M3 CoT (深度推导思路 / Chain-of-Thought) 折叠手风琴组件
   */
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

  /**
   * 绑定 Tooltip 内 CoT 折叠栏的交互
   */
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
        // 展开时立即执行一次高保真 Markdown 与 KaTeX 排版渲染
        const qid = this.mathTooltip.getActiveQid();
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

  /**
   * 触发 AI 规范推导生成
   */
  private async triggerAiGeneration(qid: string, q: SlimQuestionItem, forceRetry = false) {
    const aiBody = document.getElementById(`ai-body-${qid}`);
    if (!aiBody) return;

    const config = getEffectiveAiClientConfig();
    if (!config.apiKey) {
      this.renderAiKeyPrompt(qid, q);
      return;
    }

    // 中止已有推导
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
            <md-circular-progress indeterminate style="--md-circular-progress-size: 14px; width: 14px; height: 14px; display: inline-flex; vertical-align: middle;"></md-circular-progress>
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
        ${createM3LoadingHtml({
          variant: 'default',
          size: 'compact',
          layout: 'inline',
          label: '正在连接学术模型，准备进行规范推导...',
          className: 'ex-ai-placeholder',
        })}
      </div>
      <div class="ex-ai-ceded-notice" id="ai-ceded-${qid}">
        <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
          <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
        </svg>
        <span class="ex-ai-ceded-notice-text">推导过程正在左侧浮窗中对照展示</span>
        <button type="button" class="ex-ai-ceded-restore-btn" id="ai-restore-${qid}">收回侧栏</button>
      </div>
    `;

    // 绑定弹出浮窗按钮与收回按钮
    const popoutBtn = document.getElementById(`ai-popout-${qid}`);
    if (popoutBtn) {
      popoutBtn.onclick = () => {
        this.toggleAiRichTooltip(qid, popoutBtn);
      };
    }

    document.getElementById(`ai-restore-${qid}`)?.addEventListener('click', () => {
      this.closeAiRichTooltip();
    });

    // 绑定停止按钮
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

    // 绑定转入书内问答按钮
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

    // 初始化流式批处理节流调度器（100ms 窗口）
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
        maxTokens: config.maxTokens,
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

      // 1. 若完全未收到任何内容（空响应）
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

      // 2. 关键防御：若模型输出了深度思考思路但正文未输出（例如 Token 限制、上游截断）
      // 绝对禁止将思考链冒充赋给正文（杜绝草稿冒充最终解答与虚假对勾）
      if (!hasContent && hasReasoning) {
        this.aiReasonings.set(qid, accumulatedReasoning);
        try {
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem(`astrolib_ai_reasoning_${qid}`, accumulatedReasoning);
          }
        } catch {}

        if (contentEl) {
          contentEl.innerHTML = `
            <div class="ex-sb-empty" style="padding: 1rem 0;">
              <p style="color: var(--md-sys-color-error, #ba1a1a); font-size: 0.75rem; line-height: 1.5;">
                模型已完成思路推演，但未输出正文推导（可能因服务端连接中断或生成异常）。请点击下方按钮重新生成。
              </p>
              <button type="button" class="ex-sb-retry-btn" id="ai-err-retry-${qid}">重新推导</button>
            </div>
          `;
          document.getElementById(`ai-err-retry-${qid}`)?.addEventListener('click', () => {
            this.triggerAiGeneration(qid, q, true);
          });
        }

        const statusEl = document.getElementById(`ai-status-${qid}`);
        if (statusEl) {
          statusEl.setAttribute('title', '推导中断（正文未返回）');
          statusEl.innerHTML = `
            <svg viewBox="0 0 24 24" width="13" height="13" fill="var(--md-sys-color-error, #ba1a1a)" style="flex-shrink:0;">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
          `;
        }

        document.getElementById(`ai-stop-${qid}`)?.classList.add('hidden');
        document.getElementById(`ai-retry-${qid}`)?.classList.remove('hidden');

        // 同步至浮窗：保留思考折叠栏，但在正文区明确展示中断提示
        this.syncStreamingToRichTooltip(qid, '', accumulatedReasoning, false);
        const tooltipSol = document.getElementById('ex-tooltip-solution');
        if (tooltipSol) {
          tooltipSol.innerHTML = `
            <div class="ex-sb-empty" style="padding: 0.75rem 0;">
              <p style="color: var(--md-sys-color-error, #ba1a1a); font-size: 0.75rem; line-height: 1.5;">
                模型已完成思路推演，但未输出正文推导。请重新推导。
              </p>
            </div>
          `;
        }
        return;
      }

      // 3. 正常完成（正文非空）
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

  /**
   * 渲染推导完成后的 AI 面板工具栏与操作
   */
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

  /**
   * 渲染已缓存的完成题解
   */
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

  /**
   * 渲染未配置 API Key 时的快速输入引导卡片
   */
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

  /**
   * 构造题库专属的 Material 3 主题色 Fill 开源协议与来源声明卡片
   */
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


  // ==========================================================================
  // M3 Rich Tooltip 委托控制器 (解耦至 exercise-math-tooltip.ts)
  // ==========================================================================
  private mathTooltip = new ExerciseMathTooltip({
    getQuestion: (qid) => this.questionsMap.get(qid),
    getQuestionIndex: (qid) => this.questionIndexMap.get(qid) || 1,
    getStoredAiSolution: (qid) => this.getStoredAiSolution(qid),
    getStoredAiReasoning: (qid) => this.getStoredAiReasoning(qid),
    isGenerating: (qid) => this.aiControllers.has(qid),
    renderCotAccordionHtml: (md, isStreaming) => this.renderCotAccordionHtml(md, isStreaming),
    bindCotToggle: () => this.bindCotToggle(),
  });

  private toggleAiRichTooltip(qid: string, triggerBtn: HTMLElement) {
    this.mathTooltip.toggleAiRichTooltip(qid, triggerBtn);
  }

  private closeAiRichTooltip() {
    this.mathTooltip.closeAiRichTooltip();
  }

  private repositionRichTooltip(triggerBtn: HTMLElement) {
    this.mathTooltip.repositionRichTooltip(triggerBtn);
  }

  private syncStreamingToRichTooltip(qid: string, md: string, reasoningMd = '', isStreaming = true) {
    this.mathTooltip.syncStreamingToRichTooltip(qid, md, reasoningMd, isStreaming);
  }

}

// 单例模式暴露
let sidebarControllerInstance: ExerciseSidebarController | null = null;

export function getExerciseSidebarController(): ExerciseSidebarController {
  if (!sidebarControllerInstance) {
    sidebarControllerInstance = new ExerciseSidebarController();
  }
  return sidebarControllerInstance;
}
