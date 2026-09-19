import { streamChat } from '../../ai/llm.mjs';
import renderMathInElement from 'katex/dist/contrib/auto-render.mjs';
import { StreamThrottleScheduler } from './stream-scheduler';
import { exerciseDb, type CommunityAiSolution, type ExerciseFeedbackPayload } from '../../utils/exercise-db/exercise-db-client';
import type {
  SlimQuestionItem,
  ChapterData,
  PaperSummary,
  SinglePaperData,
  QuestionOption,
  SubQuestion,
  ChapterSectionSummary,
} from '../../types/exercises';

import { ExerciseExportPipeline } from './exercise-export-pipeline';
import {
  getEffectiveAiClientConfig,
  saveAiApiKey,
  getActiveAiModel,
  onAiConfigChange,
} from '../../ai/ai-config';
import { parseAiError } from '../../ai/error-handler';
import { createM3LoadingHtml } from '../common/m3-loading-helper';

function sanitizeLatexString(val: string): string {
  if (typeof val !== 'string') return '';
  let str = val;
  str = str.replace(/\x0c/g, '\\f');
  str = str.replace(/\x08/g, '\\b');
  str = str.replace(/\x0b/g, '\\v');
  str = str.replace(/\r(?!\n)/g, '\\r');
  str = str.replace(/\t([a-zA-Z])/g, '\\t$1');
  str = str.replace(/(\$\$[\s\S]+?\$\$|\$[^\$\n]+?\$)/g, (m) => m.replace(/\t/g, ' '));
  str = str.replace(/(\$\$[\s\S]+?\$\$|\$[^\$\n]+?\$)/g, (m) =>
    m.replace(/\n(u|eq|ne|not|nabla|notin|nrightarrow|natural|nearrow|nwarrow|neg|normalsize)\b/g, '\\n$1')
  );
  str = str.replace(/\\iiiint_{\\Omega}/g, '\\iiint_{\\Omega}');
  str = str.replace(/\\overparen\{([^}]+)\}/g, '\\stackrel{\\frown}{$1}');
  str = str.replace(/\\wideparen\{([^}]+)\}/g, '\\stackrel{\\frown}{$1}');
  return str;
}

function sanitizeLatexValue(val: any): any {
  if (typeof val === 'string') {
    return sanitizeLatexString(val);
  } else if (Array.isArray(val)) {
    return val.map(sanitizeLatexValue);
  } else if (val && typeof val === 'object') {
    const res: any = {};
    for (const [k, v] of Object.entries(val)) {
      res[k] = sanitizeLatexValue(v);
    }
    return res;
  }
  return val;
}

import { renderAcademicSolutionMarkdown as renderSolutionMarkdown, EXERCISE_KATEX_OPTIONS as KATEX_OPTIONS } from './exercise-markdown';

export type {
  SlimQuestionItem,
  ChapterData,
  PaperSummary,
  SinglePaperData,
  QuestionOption,
  SubQuestion,
  ChapterSectionSummary,
};

interface UserPracticeRecord {
  answered: boolean;
  userChoice?: string;
  userBlank?: string;
  isCorrect?: boolean;
  mastered?: boolean;
  revealedSolution?: boolean;
}

const PAGE_SIZE = 15;

class ExerciseCenterController {
  private root: HTMLElement | null = null;
  private dialogEl: HTMLElement | null = null;
  private windowEl: HTMLElement | null = null;
  private chapterSelect: HTMLSelectElement | null = null;
  private paperSelect: HTMLSelectElement | null = null;
  private sourcePillsContainer: HTMLElement | null = null;
  private groupPillsContainer: HTMLElement | null = null;
  private sectionPillsContainer: HTMLElement | null = null;
  private paperOutlineContainer: HTMLElement | null = null;
  private typePillsContainer: HTMLElement | null = null;
  private searchInput: HTMLInputElement | null = null;
  private searchClearBtn: HTMLElement | null = null;
  private bodyContainer: HTMLElement | null = null;
  private fullscreenBtn: HTMLElement | null = null;
  private closeBtn: HTMLElement | null = null;
  private modeTabs: NodeListOf<HTMLButtonElement> | null = null;
  private toastBox: HTMLElement | null = null;

  private feedbackModal: HTMLElement | null = null;
  private sourceEditorModal: HTMLElement | null = null;
  private aiUploadModal: HTMLElement | null = null;
  private exportPipeline = new ExerciseExportPipeline({
    getCurrentMode: () => this.currentMode,
    getCurrentChapter: () => this.currentChapter,
    getCurrentPaperId: () => this.currentPaperId,
    getChapterData: (ch) => this.chapterCache.get(ch),
    getPaperData: (pId) => this.paperCache.get(pId),
    getSearchQuery: () => this.searchQuery,
    getFilteredQuestions: () =>
      this.currentFilteredQuestions.length > 0
        ? this.currentFilteredQuestions
        : this.chapterCache.get(this.currentChapter)?.questions || [],
    showToast: (msg) => this.showToast(msg),
  });

  private toolbarEl: HTMLElement | null = null;
  private toolbarToggleBtn: HTMLButtonElement | null = null;
  private isFilterCollapsed = false;

  private totalStatEl: HTMLElement | null = null;
  private doneStatEl: HTMLElement | null = null;
  private accStatEl: HTMLElement | null = null;

  private boundRoot: HTMLElement | null = null;
  private isOpen = false;
  private isFullscreen = false;
  private isGlobalSearch = false;
  private currentMode: 'practice' | 'paper' = 'practice';
  private currentChapter = 1;
  private currentPaperId = 1;
  private currentSource: 'all' | 'textbook' | 'exam' = 'all';
  private currentGroup: 'all' | 'A' | 'B' = 'all';
  private currentSection = 'all';
  private currentPaperSection = 'all';
  private currentType = 'all';
  private searchQuery = '';
  private displayedLimit = PAGE_SIZE;
  private currentBook = 'engineering_analysis';

  private currentFilteredQuestions: SlimQuestionItem[] = [];
  private chapterCache = new Map<number, ChapterData>();
  private paperListSummary: PaperSummary[] = [];
  private paperCache = new Map<number, SinglePaperData>();
  private allQuestionsCache: SlimQuestionItem[] = [];
  private isLoading = false;

  private communitySolutions = new Map<string, CommunityAiSolution[]>();
  private activeSolutionVersions = new Map<string, string>();
  private practiceRecords = new Map<string, UserPracticeRecord>();

  private aiSolutions = new Map<string, string>();
  private aiControllers = new Map<string, AbortController>();
  private aiStreamActive = new Set<string>();
  private aiSchedulers = new Map<string, StreamThrottleScheduler>();

  private activeFeedbackQuestion: SlimQuestionItem | null = null;
  private activeEditorQuestion: SlimQuestionItem | null = null;
  private activeUploadQuestionId: string = '';
  private scopeToggleBtn: HTMLElement | null = null;

  constructor() {
    this.init();
  }

  private init() {
    if (typeof document === 'undefined') return;

    const setup = () => {
      // 路由换页安全清理：若存在多个 root 节点，移除多余的旧节点
      const allRoots = document.querySelectorAll('#exercise-modal-root');
      if (allRoots.length > 1) {
        allRoots.forEach((node, idx) => {
          if (idx < allRoots.length - 1) node.remove();
        });
      }

      const newRoot = document.getElementById('exercise-modal-root');
      if (!newRoot) return;

      if (this.root && this.root !== newRoot) {
        this.root.remove();
      }
      this.root = newRoot;

      if (this.root.parentElement !== document.body) {
        document.body.appendChild(this.root);
      }

      this.dialogEl = this.root.querySelector('#exercise-modal-dialog');
      this.windowEl = (this.dialogEl || this.root.querySelector('.ex-modal-window')) as HTMLElement;
      this.chapterSelect = this.root.querySelector('.ex-chapter-select');
      this.paperSelect = this.root.querySelector('.ex-paper-select');
      this.sourcePillsContainer = this.root.querySelector('.ex-source-pills');
      this.groupPillsContainer = this.root.querySelector('.ex-group-pills');
      this.sectionPillsContainer = this.root.querySelector('.ex-section-pills');
      this.paperOutlineContainer = this.root.querySelector('.ex-paper-outline-bar');
      this.typePillsContainer = this.root.querySelector('.ex-type-pills');
      this.searchInput = this.root.querySelector('.ex-search-input');
      this.searchClearBtn = this.root.querySelector('.ex-search-clear');
      this.scopeToggleBtn = this.root.querySelector('#ex-scope-toggle-btn');
      this.bodyContainer = this.root.querySelector('.ex-body');
      this.fullscreenBtn = this.root.querySelector('.ex-fullscreen-btn');
      this.closeBtn = this.root.querySelector('.ex-close-btn');
      this.modeTabs = this.root.querySelectorAll('.ex-mode-tab');
      this.toastBox = this.root.querySelector('#ex-toast-box');

      this.feedbackModal = this.root.querySelector('#ex-feedback-modal');
      this.sourceEditorModal = this.root.querySelector('#ex-source-editor-modal');
      this.aiUploadModal = this.root.querySelector('#ex-ai-upload-modal');
      this.exportPipeline.initElements(this.root);

      this.totalStatEl = this.root.querySelector('.ex-stat-total');
      this.doneStatEl = this.root.querySelector('.ex-stat-done');
      this.accStatEl = this.root.querySelector('.ex-stat-acc');

      this.toolbarEl = this.root.querySelector('.ex-toolbar');
      this.toolbarToggleBtn = this.root.querySelector('#ex-toolbar-toggle-btn');
      try {
        const savedCollapsed = localStorage.getItem('astro_exercise_filter_collapsed');
        const isMobileScreen = typeof window !== 'undefined' && window.innerWidth <= 640;
        // 规范第九条：移动端优先进入「沉浸做题态」，筛选默认收起；桌面端遵从用户记忆
        const shouldCollapse = savedCollapsed !== null ? savedCollapsed === '1' : isMobileScreen;
        if (shouldCollapse) {
          this.setFilterCollapsed(true);
        }
      } catch {}

      this.bindEvents();
    };

    onAiConfigChange((cfg) => {
      if (this.bodyContainer) {
        this.bodyContainer.querySelectorAll<HTMLElement>('.ex-ai-model-badge').forEach((badge) => {
          const card = badge.closest('.ex-q-card');
          const qid = card?.getAttribute('data-qid');
          if (qid) {
            const activeVer = this.activeSolutionVersions.get(qid) || 'local';
            if (activeVer === 'local') {
              badge.textContent = cfg.label;
            }
          }
        });
      }
    });

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', setup);
    } else {
      setup();
    }

    document.addEventListener('astro:page-load', setup);

    // 监听页面卸载，释放全屏题库、PDF 渲染引擎与长周期缓存
    document.addEventListener('astrolib:page-unload', () => {
      if (this.isOpen) {
        this.close();
      }
      this.exportPipeline.destroy();
      this.chapterCache.clear();
      this.paperCache.clear();
      this.allQuestionsCache = [];
      this.boundRoot = null;
    });

    const win = window as any;
    if (!win.__exerciseGlobalBound) {
      win.__exerciseGlobalBound = true;

      window.addEventListener('exercises:open', (e: any) => {
        const detail = e.detail || {};
        if (detail.mode === 'paper') {
          this.openPaper(detail.paperId || 1, detail.targetQid, detail.book);
        } else {
          this.open(detail.chapter || 1, detail.section || 'all', detail.book);
        }
      });

      document.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const trigger = target?.closest('[data-exercise-trigger]');
        if (trigger) {
          e.preventDefault();
          const ch = parseInt(trigger.getAttribute('data-chapter') || '1', 10);
          const sec = trigger.getAttribute('data-section') || 'all';
          this.open(ch, sec);
        }
      });

      document.addEventListener('keydown', (e) => {
        if (e.altKey && (e.key === 'e' || e.key === 'E')) {
          e.preventDefault();
          if (this.isOpen) {
            this.close();
          } else {
            this.open(this.detectCurrentChapter(), this.detectCurrentSection());
          }
        } else if (e.key === 'Escape' && this.isOpen) {
          if (this.isSubmodalOpen()) {
            this.closeAllSubmodals();
          } else {
            this.close();
          }
        }
      });
    }
  }

  private isSubmodalOpen(): boolean {
    return (
      (this.feedbackModal && !this.feedbackModal.classList.contains('hidden')) ||
      (this.sourceEditorModal && !this.sourceEditorModal.classList.contains('hidden')) ||
      (this.aiUploadModal && !this.aiUploadModal.classList.contains('hidden')) ||
      this.exportPipeline.isModalOpen()
    );
  }

  private closeAllSubmodals() {
    this.feedbackModal?.classList.add('hidden');
    this.sourceEditorModal?.classList.add('hidden');
    this.aiUploadModal?.classList.add('hidden');
    this.exportPipeline.closeLatexModal();
  }

  public openLatexModal() {
    this.exportPipeline.openLatexModal();
  }

  public closeLatexModal() {
    this.exportPipeline.closeLatexModal();
  }

  private detectCurrentChapter(): number {
    const path = window.location.pathname;
    const match = path.match(/\/(\d+)\.\d+_/);
    if (match) return parseInt(match[1], 10);
    return this.currentChapter || 1;
  }

  private detectCurrentSection(): string {
    const path = window.location.pathname;
    const match = path.match(/\/(\d+\.\d+)_/);
    if (match) return match[1];
    return 'all';
  }

  private bindEvents() {
    if (!this.root || this.boundRoot === this.root) return;
    this.boundRoot = this.root;

    const backdrop = this.root.querySelector('.ex-modal-backdrop');
    if (backdrop) backdrop.addEventListener('click', () => this.close());

    if (this.dialogEl) {
      this.dialogEl.addEventListener('cancel', (e: Event) => {
        if (this.isSubmodalOpen()) {
          e.preventDefault();
          this.closeAllSubmodals();
          return;
        }
        this.close();
      });
      this.dialogEl.addEventListener('closed', () => {
        this.isOpen = false;
        this.root?.classList.remove('is-open');
        document.body.style.overflow = '';
        this.closeAllSubmodals();
      });
    }

    if (this.closeBtn) this.closeBtn.addEventListener('click', () => this.close());
    if (this.fullscreenBtn) this.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
    if (this.toolbarToggleBtn) this.toolbarToggleBtn.addEventListener('click', () => this.toggleFilterCollapse());

    if (this.toolbarEl) {
      this.toolbarEl.addEventListener('click', (e) => {
        if (window.innerWidth <= 640 && !this.isFilterCollapsed) {
          const filterRow = this.toolbarEl?.querySelector('.ex-filter-row');
          if (filterRow && !filterRow.contains(e.target as Node) && !this.toolbarToggleBtn?.contains(e.target as Node)) {
            this.setFilterCollapsed(true);
          }
        }
      });
    }

    if (this.chapterSelect) {
      this.chapterSelect.addEventListener('change', (e) => {
        const val = parseInt((e.target as HTMLSelectElement).value, 10);
        this.currentChapter = val;
        this.currentSection = 'all';
        this.displayedLimit = PAGE_SIZE;
        this.loadChapter(val);
      });
    }

    if (this.paperSelect) {
      this.paperSelect.addEventListener('change', (e) => {
        const val = parseInt((e.target as HTMLSelectElement).value, 10);
        if (!isNaN(val)) {
          this.currentPaperId = val;
          this.currentPaperSection = 'all';
          this.displayedLimit = PAGE_SIZE;
          this.loadPaper(val);
        }
      });
    }

    if (this.modeTabs) {
      this.modeTabs.forEach((tab) => {
        tab.addEventListener('click', () => {
          const mode = (tab.getAttribute('data-mode') || 'practice') as 'practice' | 'paper';
          this.switchMode(mode);
        });
      });
    }

    if (this.scopeToggleBtn) {
      this.scopeToggleBtn.addEventListener('click', async () => {
        this.isGlobalSearch = !this.isGlobalSearch;
        this.scopeToggleBtn?.classList.toggle('active', this.isGlobalSearch);
        if (this.searchInput) {
          this.searchInput.placeholder = this.isGlobalSearch
            ? '全库检索题目、LaTeX 或考点...'
            : '输入题干关键字、LaTeX 或考点...';
        }
        if (this.isGlobalSearch) {
          await this.ensureAllQuestionsLoaded();
        } else {
          this.allQuestionsCache = [];
          this.trimChapterCache(2);
        }
        this.displayedLimit = PAGE_SIZE;
        this.filterAndRender();
      });
    }

    if (this.searchInput) {
      let debounceTimer: any = null;
      this.searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(async () => {
          this.searchQuery = (e.target as HTMLInputElement).value.trim();
          if (this.isGlobalSearch) {
            await this.ensureAllQuestionsLoaded();
          }
          this.displayedLimit = PAGE_SIZE;
          this.filterAndRender();
        }, 50);
      });
    }

    if (this.searchClearBtn && this.searchInput) {
      this.searchClearBtn.addEventListener('click', () => {
        if (this.searchInput) this.searchInput.value = '';
        this.searchQuery = '';
        this.displayedLimit = PAGE_SIZE;
        this.filterAndRender();
      });
    }

    if (this.typePillsContainer) {
      this.typePillsContainer.addEventListener('click', (e) => {
        const pill = (e.target as HTMLElement).closest('.ex-nav-item, .ex-filter-pill');
        if (!pill) return;
        this.typePillsContainer?.querySelectorAll('.ex-nav-item, .ex-filter-pill').forEach((p) => p.classList.remove('active'));
        pill.classList.add('active');
        this.currentType = pill.getAttribute('data-type') || 'all';
        this.displayedLimit = PAGE_SIZE;
        this.filterAndRender();
      });
    }

    if (this.sourcePillsContainer) {
      this.sourcePillsContainer.addEventListener('click', (e) => {
        const pill = (e.target as HTMLElement).closest('.ex-nav-item');
        if (!pill) return;
        this.sourcePillsContainer?.querySelectorAll('.ex-nav-item').forEach((p) => p.classList.remove('active'));
        pill.classList.add('active');
        const src = (pill.getAttribute('data-source') || 'all') as any;
        this.currentSource = src;
        if (this.currentSource === 'textbook') {
          this.groupPillsContainer?.classList.remove('hidden');
        } else {
          this.groupPillsContainer?.classList.add('hidden');
        }
        this.currentGroup = 'all';
        this.groupPillsContainer?.querySelectorAll('.ex-nav-item').forEach((p) => {
          p.classList.toggle('active', p.getAttribute('data-group') === 'all');
        });
        this.displayedLimit = PAGE_SIZE;
        this.filterAndRender();
      });
    }

    if (this.groupPillsContainer) {
      this.groupPillsContainer.addEventListener('click', (e) => {
        const pill = (e.target as HTMLElement).closest('.ex-nav-item');
        if (!pill) return;
        this.groupPillsContainer?.querySelectorAll('.ex-nav-item').forEach((p) => p.classList.remove('active'));
        pill.classList.add('active');
        this.currentGroup = (pill.getAttribute('data-group') || 'all') as any;
        this.displayedLimit = PAGE_SIZE;
        this.filterAndRender();
      });
    }

    if (this.bodyContainer) {
      this.bindBodyDelegatedInteractions(this.bodyContainer);
    }

    this.bindSubmodalEvents();
  }

  private switchMode(mode: 'practice' | 'paper') {
    this.currentMode = mode;
    this.displayedLimit = PAGE_SIZE;

    this.modeTabs?.forEach((t) => {
      t.classList.toggle('active', t.getAttribute('data-mode') === mode);
    });

    if (mode === 'practice') {
      this.chapterSelect?.classList.remove('hidden');
      this.paperSelect?.classList.add('hidden');
      this.sourcePillsContainer?.classList.remove('hidden');
      if (this.currentSource === 'textbook') {
        this.groupPillsContainer?.classList.remove('hidden');
      } else {
        this.groupPillsContainer?.classList.add('hidden');
      }
      this.sectionPillsContainer?.classList.remove('hidden');
      this.paperOutlineContainer?.classList.add('hidden');
      this.loadChapter(this.currentChapter);
    } else if (mode === 'paper') {
      this.chapterSelect?.classList.add('hidden');
      this.paperSelect?.classList.remove('hidden');
      this.sourcePillsContainer?.classList.add('hidden');
      this.groupPillsContainer?.classList.add('hidden');
      this.sectionPillsContainer?.classList.add('hidden');
      this.paperOutlineContainer?.classList.remove('hidden');
      this.ensurePaperListLoaded().then(() => {
        this.loadPaper(this.currentPaperId);
      });
    }
  }

  private ensureDialogCentered(targetModal: HTMLElement) {
    targetModal.setAttribute('quick', '');
    (targetModal as any).quick = true;
    const shadow = targetModal.shadowRoot;
    if (!shadow) return;
    const nativeDialog = shadow.querySelector('dialog');
    if (nativeDialog) {
      nativeDialog.style.margin = 'auto';
      nativeDialog.style.inset = '0';
    }
    let style = shadow.querySelector('#m3-dialog-centering-style') as HTMLStyleElement | null;
    if (!style) {
      style = document.createElement('style');
      style.id = 'm3-dialog-centering-style';
      shadow.appendChild(style);
    }
    style.textContent = `
      dialog {
        margin: auto !important;
        inset: 0 !important;
        transform-origin: center center;
        width: inherit !important;
        height: inherit !important;
        max-width: inherit !important;
        max-height: inherit !important;
        border-radius: inherit !important;
        overflow: hidden !important;
        display: flex !important;
        flex-direction: column !important;
      }
      .container {
        border-radius: inherit !important;
        display: flex !important;
        flex-direction: column !important;
        flex: 1 !important;
        height: 100% !important;
        min-height: 0 !important;
        overflow: hidden !important;
      }
      .scroller {
        overflow: hidden !important;
        display: flex !important;
        flex: 1 !important;
        flex-direction: column !important;
        min-height: 0 !important;
      }
      .content {
        height: 100% !important;
        display: flex !important;
        flex-direction: column !important;
        min-height: 0 !important;
        padding: 0 !important;
      }
      slot[name=headline]::slotted(*) {
        padding: 0 !important;
        width: 100% !important;
      }
      slot[name=content]::slotted(*) {
        padding: 0 !important;
        height: 100% !important;
        display: flex !important;
        flex-direction: column !important;
        min-height: 0 !important;
      }
      .scrim {
        background-color: rgba(0, 0, 0, 0.38) !important;
        backdrop-filter: blur(4px) !important;
        -webkit-backdrop-filter: blur(4px) !important;
        z-index: var(--layer-dialog, 500) !important;
      }
      ::backdrop {
        background: rgba(0, 0, 0, 0.38) !important;
        backdrop-filter: blur(4px) !important;
        -webkit-backdrop-filter: blur(4px) !important;
      }
    `;
  }

  public open(chapter = 1, section = 'all', book?: string) {
    if (!this.root) this.root = document.getElementById('exercise-modal-root');
    if (!this.root) return;

    if (book && book !== this.currentBook) {
      this.currentBook = book;
      this.chapterCache.clear();
      this.paperCache.clear();
      this.paperListSummary = [];
      this.allQuestionsCache = [];
    }

    if (this.root.parentElement !== document.body) {
      document.body.appendChild(this.root);
    }

    this.isOpen = true;
    this.root.classList.add('is-open');
    document.body.style.overflow = 'hidden';

    if (this.dialogEl) {
      this.ensureDialogCentered(this.dialogEl);
      const dlg = this.dialogEl as any;
      if (typeof dlg.show === 'function') {
        dlg.show();
      } else {
        dlg.open = true;
      }
    }

    this.currentChapter = chapter;
    this.currentSection = section;
    this.displayedLimit = PAGE_SIZE;

    if (this.chapterSelect) {
      this.chapterSelect.value = String(chapter);
    }

    this.switchMode('practice');
  }

  public openPaper(paperId = 1, targetQid?: string, book?: string) {
    if (!this.root) this.root = document.getElementById('exercise-modal-root');
    if (!this.root) return;

    if (book && book !== this.currentBook) {
      this.currentBook = book;
      this.chapterCache.clear();
      this.paperCache.clear();
      this.paperListSummary = [];
      this.allQuestionsCache = [];
    }

    if (this.root.parentElement !== document.body) {
      document.body.appendChild(this.root);
    }

    this.isOpen = true;
    this.root.classList.add('is-open');
    document.body.style.overflow = 'hidden';

    if (this.dialogEl) {
      this.ensureDialogCentered(this.dialogEl);
      const dlg = this.dialogEl as any;
      if (typeof dlg.show === 'function') {
        dlg.show();
      } else {
        dlg.open = true;
      }
    }

    this.currentPaperId = paperId;
    this.currentPaperSection = 'all';
    this.displayedLimit = PAGE_SIZE;

    this.switchMode('paper');

    if (targetQid) {
      setTimeout(() => {
        this.scrollToQuestion(targetQid);
      }, 250);
    }
  }

  public close() {
    if (!this.root) return;
    this.isOpen = false;
    this.root.classList.remove('is-open');
    document.body.style.overflow = '';
    this.closeAllSubmodals();
    this.allQuestionsCache = [];
    this.trimChapterCache(2);
    this.trimPaperCache(2);

    if (this.dialogEl) {
      const dlg = this.dialogEl as any;
      if (typeof dlg.close === 'function') {
        dlg.close();
      } else {
        dlg.open = false;
      }
    }
  }

  /**
   * LRU 缓存淘汰策略：保持最多保活 max 个章节 JSON，防止内存无上限膨胀
   */
  private trimChapterCache(max = 2) {
    while (this.chapterCache.size > max) {
      const oldestKey = this.chapterCache.keys().next().value;
      if (oldestKey !== undefined) {
        this.chapterCache.delete(oldestKey);
      } else {
        break;
      }
    }
  }

  /**
   * LRU 缓存淘汰策略：保持最多保活 max 套试卷 JSON
   */
  private trimPaperCache(max = 2) {
    while (this.paperCache.size > max) {
      const oldestKey = this.paperCache.keys().next().value;
      if (oldestKey !== undefined) {
        this.paperCache.delete(oldestKey);
      } else {
        break;
      }
    }
  }

  private toggleFullscreen() {
    this.isFullscreen = !this.isFullscreen;
    if (this.dialogEl) {
      this.dialogEl.classList.toggle('is-fullscreen', this.isFullscreen);
    }
    if (this.windowEl && this.windowEl !== this.dialogEl) {
      this.windowEl.classList.toggle('is-fullscreen', this.isFullscreen);
    }
    const fsIcon = this.root?.querySelector('#ex-fullscreen-icon');
    if (fsIcon) {
      fsIcon.textContent = this.isFullscreen ? 'fullscreen_exit' : 'fullscreen';
    }
    if (this.fullscreenBtn) {
      this.fullscreenBtn.setAttribute('title', this.isFullscreen ? '退出全屏 (F)' : '全屏/窗口切换 (F)');
    }
  }

  private toggleFilterCollapse() {
    this.setFilterCollapsed(!this.isFilterCollapsed);
  }

  private setFilterCollapsed(collapsed: boolean) {
    this.isFilterCollapsed = collapsed;
    if (this.toolbarEl) {
      this.toolbarEl.classList.toggle('is-collapsed', collapsed);
    }
    if (this.toolbarToggleBtn) {
      const label = this.toolbarToggleBtn.querySelector('.ex-toggle-label');
      if (label) label.textContent = collapsed ? '展开筛选' : '收起筛选';
      this.toolbarToggleBtn.setAttribute('title', collapsed ? '展开筛选' : '收起筛选');
      this.toolbarToggleBtn.setAttribute('aria-label', collapsed ? '展开筛选' : '收起筛选');
    }
    try {
      localStorage.setItem('astro_exercise_filter_collapsed', collapsed ? '1' : '0');
    } catch {}
  }

  private scrollToQuestion(qid: string) {
    if (!this.bodyContainer) return;
    const card = this.bodyContainer.querySelector(`#q-card-${qid}`) as HTMLElement;
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card.classList.add('ex-q-card-pulse');
      setTimeout(() => {
        card.classList.remove('ex-q-card-pulse');
      }, 1500);
    }
  }

  private async loadChapter(chId: number) {
    if (this.chapterCache.has(chId)) {
      const data = this.chapterCache.get(chId)!;
      this.updateSectionPills(data);
      this.filterAndRender();
      return;
    }

    this.isLoading = true;
    this.renderLoading(`正在加载第 ${chId} 章题库与公式...`);

    try {
      const resp = await fetch(`/data/exercises/${this.currentBook}/ch${chId}.json`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data: ChapterData = await resp.json();
      this.chapterCache.set(chId, data);
      this.trimChapterCache(2);
      this.isLoading = false;
      this.updateSectionPills(data);
      this.filterAndRender();
    } catch (err) {
      this.isLoading = false;
      this.renderError('题库数据加载失败，请检查网络或刷新重试。');
    }
  }

  private async ensurePaperListLoaded() {
    if (this.paperListSummary.length > 0) return;

    try {
      const resp = await fetch(`/data/exercises/${this.currentBook}/papers.json`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      this.paperListSummary = data.papers || [];

      if (this.paperSelect && this.paperListSummary.length > 0) {
        let optionsHtml = '';
        const tbPapers = this.paperListSummary.filter((p) => p.category === '教材课后习题');
        const examPapers = this.paperListSummary.filter((p) => p.category !== '教材课后习题');

        if (tbPapers.length > 0) {
          optionsHtml += `<optgroup label="📚 教材分章课后习题集（${tbPapers.length}套）">`;
          tbPapers.forEach((p) => {
            const isSelected = p.paper_id === this.currentPaperId;
            optionsHtml += `<option value="${p.paper_id}" ${isSelected ? 'selected' : ''}>${p.clean_title} [${p.total_questions}题]</option>`;
          });
          optionsHtml += `</optgroup>`;
        }

        if (examPapers.length > 0) {
          optionsHtml += `<optgroup label="🎓 《大邮数学集》历年真题试卷（CC协议 · ${examPapers.length}套）">`;
          examPapers.forEach((p) => {
            const isSelected = p.paper_id === this.currentPaperId;
            const scoreText = p.total_score ? `[${p.total_score}分 / ${p.total_questions}题]` : `[${p.total_questions}题]`;
            optionsHtml += `<option value="${p.paper_id}" ${isSelected ? 'selected' : ''}>${p.clean_title} ${scoreText}</option>`;
          });
          optionsHtml += `</optgroup>`;
        }
        this.paperSelect.innerHTML = optionsHtml;
      }
    } catch (err) {
      console.warn('[ExerciseController] 加载试卷列表失败:', err);
    }
  }

  private async loadPaper(paperId: number) {
    if (this.paperCache.has(paperId)) {
      const data = this.paperCache.get(paperId)!;
      this.updatePaperOutlineBar(data);
      this.filterAndRender();
      return;
    }

    this.isLoading = true;
    this.renderLoading(`正在加载真题试卷内容与大纲...`);

    try {
      const resp = await fetch(`/data/exercises/${this.currentBook}/papers/p${paperId}.json`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data: SinglePaperData = await resp.json();
      this.paperCache.set(paperId, data);
      this.trimPaperCache(2);
      this.isLoading = false;
      this.updatePaperOutlineBar(data);
      this.filterAndRender();
    } catch (err) {
      this.isLoading = false;
      this.renderError('试卷数据加载失败，请检查网络或刷新重试。');
    }
  }

  private async ensureAllQuestionsLoaded() {
    if (this.allQuestionsCache.length > 0) return;
    this.isLoading = true;
    this.renderLoading('正在构建全书题目全局检索索引...');

    const maxCh = this.currentBook === 'linear_algebra_geometry' ? 9 : 7;
    const chList = Array.from({ length: maxCh }, (_, i) => i + 1);
    const loadPromises = chList.map(async (ch) => {
      if (this.chapterCache.has(ch)) return this.chapterCache.get(ch)!.questions;
      try {
        const resp = await fetch(`/data/exercises/${this.currentBook}/ch${ch}.json`);
        if (resp.ok) {
          const data: ChapterData = await resp.json();
          this.chapterCache.set(ch, data);
          return data.questions;
        }
      } catch {}
      return [];
    });

    const results = await Promise.all(loadPromises);
    this.allQuestionsCache = results.flat();
    this.isLoading = false;
  }

  private updateSectionPills(data: ChapterData) {
    if (!this.sectionPillsContainer) return;

    let html = `<button type="button" class="ex-nav-item ${this.currentSection === 'all' ? 'active' : ''}" data-section="all">
      全部小节 <span class="ex-nav-count">${data.total}</span>
    </button>`;

    (data.sections || []).forEach((sec) => {
      const isActive = this.currentSection === sec.section;
      const titleSnippet = sec.section_title ? ` ${this.esc(sec.section_title)}` : '';
      html += `<button type="button" class="ex-nav-item ${isActive ? 'active' : ''}" data-section="${sec.section}" title="${this.esc(sec.section_title || sec.section)}">
        <span class="ex-nav-label">${sec.section}${titleSnippet}</span><span class="ex-nav-count">${sec.count}</span>
      </button>`;
    });

    this.sectionPillsContainer.innerHTML = html;

    this.sectionPillsContainer.querySelectorAll('.ex-nav-item').forEach((item) => {
      item.addEventListener('click', () => {
        this.sectionPillsContainer?.querySelectorAll('.ex-nav-item').forEach((p) => p.classList.remove('active'));
        item.classList.add('active');
        this.currentSection = item.getAttribute('data-section') || 'all';
        this.displayedLimit = PAGE_SIZE;
        this.filterAndRender();
      });
    });
  }

  private updatePaperOutlineBar(data: SinglePaperData) {
    if (!this.paperOutlineContainer) return;

    let html = `<button type="button" class="ex-nav-item ${this.currentPaperSection === 'all' ? 'active' : ''}" data-paper-sec="all">
      整卷 <span class="ex-nav-count">${data.total_questions}</span>
    </button>`;

    (data.sections_order || []).forEach((secName) => {
      const count = data.questions.filter((q) => q.section_type === secName).length;
      const isActive = this.currentPaperSection === secName;
      const shortTitle = secName.replace(/（.*）/, '').replace(/\(.*\)/, '').trim();
      html += `<button type="button" class="ex-nav-item ${isActive ? 'active' : ''}" data-paper-sec="${this.esc(secName)}">
        <span class="ex-nav-label">${shortTitle}</span><span class="ex-nav-count">${count}</span>
      </button>`;
    });

    this.paperOutlineContainer.innerHTML = html;

    this.paperOutlineContainer.querySelectorAll('.ex-nav-item').forEach((item) => {
      item.addEventListener('click', () => {
        this.paperOutlineContainer?.querySelectorAll('.ex-nav-item').forEach((p) => p.classList.remove('active'));
        item.classList.add('active');
        this.currentPaperSection = item.getAttribute('data-paper-sec') || 'all';
        this.displayedLimit = PAGE_SIZE;
        this.filterAndRender();
      });
    });
  }

  private renderLoading(msg: string) {
    if (!this.bodyContainer) return;
    this.bodyContainer.innerHTML = createM3LoadingHtml({
      variant: 'contained',
      size: 'medium',
      layout: 'block',
      label: msg,
      className: 'ex-loading-state',
    });
  }

  private renderError(msg: string) {
    if (!this.bodyContainer) return;
    this.bodyContainer.innerHTML = `
      <div class="ex-empty-state">
        <svg class="ex-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span>${msg}</span>
      </div>
    `;
  }

  private renderEmpty(msg: string) {
    if (!this.bodyContainer) return;
    this.bodyContainer.innerHTML = `
      <div class="ex-empty-state">
        <svg class="ex-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <span>${msg}</span>
      </div>
    `;
  }

  private filterAndRender() {
    if (!this.bodyContainer) return;

    let sourceList: SlimQuestionItem[] = [];

    if (this.isGlobalSearch) {
      sourceList = this.allQuestionsCache.length > 0 ? this.allQuestionsCache : (this.chapterCache.get(this.currentChapter)?.questions || []);
    } else if (this.currentMode === 'practice') {
      const data = this.chapterCache.get(this.currentChapter);
      sourceList = data?.questions || [];
    } else if (this.currentMode === 'paper') {
      const data = this.paperCache.get(this.currentPaperId);
      sourceList = data?.questions || [];
    }

    if (sourceList.length === 0 && !this.isLoading) {
      this.renderEmpty('暂无题目数据');
      return;
    }

    let filtered = sourceList;

    if (!this.isGlobalSearch && this.currentMode === 'practice' && this.currentSection !== 'all') {
      filtered = filtered.filter((q) => {
        return q.sec === this.currentSection || q.sec_slug?.startsWith(this.currentSection);
      });
    }

    if (!this.isGlobalSearch && this.currentMode === 'paper' && this.currentPaperSection !== 'all') {
      filtered = filtered.filter((q) => q.section_type === this.currentPaperSection);
    }

    if (this.currentSource !== 'all') {
      filtered = filtered.filter((q) => (q.source_type || 'exam') === this.currentSource);
    }

    if (this.currentSource === 'textbook' && this.currentGroup !== 'all') {
      filtered = filtered.filter((q) => q.group === this.currentGroup);
    }

    if (this.currentType !== 'all') {
      filtered = filtered.filter((q) => q.type === this.currentType);
    }

    if (this.searchQuery) {
      const qLower = this.searchQuery.toLowerCase();
      filtered = filtered.filter((q) => q.search.includes(qLower));
    }

    this.currentFilteredQuestions = filtered;

    if (filtered.length === 0) {
      this.renderEmpty('未找到符合当前筛选条件的题目');
      this.updateStats(0, 0, 0);
      return;
    }

    let doneCount = 0;
    let correctCount = 0;
    filtered.forEach((q) => {
      const rec = this.practiceRecords.get(q.id);
      if (rec && rec.answered) {
        doneCount++;
        if (rec.isCorrect || rec.mastered) correctCount++;
      }
    });
    this.updateStats(filtered.length, doneCount, correctCount);

    this.renderQuestionSlice();
  }

  private updateStats(total: number, done: number, correct: number) {
    if (this.totalStatEl) this.totalStatEl.textContent = String(total);
    if (this.doneStatEl) this.doneStatEl.textContent = String(done);
    if (this.accStatEl) {
      const rate = done > 0 ? Math.round((correct / done) * 100) : 0;
      this.accStatEl.textContent = `${rate}%`;
    }
  }

  private renderQuestionSlice() {
    if (!this.bodyContainer) return;
    const questionsToRender = this.currentFilteredQuestions.slice(0, this.displayedLimit);
    const totalFiltered = this.currentFilteredQuestions.length;

    let cardsHtml = '';
    let lastSectionType = '';

    questionsToRender.forEach((q, idx) => {
      if (this.currentMode === 'paper' && q.section_type && q.section_type !== lastSectionType) {
        lastSectionType = q.section_type;
        cardsHtml += `
          <div class="ex-paper-section-header">
            <h3 class="ex-paper-sec-heading">${this.esc(lastSectionType)}</h3>
          </div>
        `;
      }
      cardsHtml += this.renderSingleCardHtml(q, idx);
    });

    let footerHtml = '';
    if (totalFiltered > this.displayedLimit) {
      const remaining = totalFiltered - this.displayedLimit;
      footerHtml = `
        <div class="ex-load-more-wrap">
          <button type="button" class="ex-load-more-btn" data-action="load-more">
            <span>加载更多（剩余 ${remaining} 题）</span>
          </button>
        </div>
      `;
    } else if (totalFiltered > PAGE_SIZE) {
      footerHtml = `
        <div class="ex-all-loaded">
          <span>— 已加载全部 ${totalFiltered} 道题目 —</span>
        </div>
      `;
    }

    this.bodyContainer.innerHTML = cardsHtml + footerHtml;

    this.renderAllAiKaTeX();

    if (this.displayedLimit === PAGE_SIZE) {
      this.bodyContainer.scrollTop = 0;
    }
  }

  private renderAllAiKaTeX() {
    if (!this.bodyContainer) return;
    const aiContents = this.bodyContainer.querySelectorAll('.ex-ai-content');
    aiContents.forEach((el) => {
      try {
        renderMathInElement(el as HTMLElement, KATEX_OPTIONS);
      } catch (e) {}
    });
  }

  private renderSingleCardHtml(q: SlimQuestionItem, idx: number): string {
    const qid = q.id;
    const qType = q.type;
    const typeLabel = qType === 'choice' ? '单选' : qType === 'blank' ? '填空' : qType === 'proof' ? '证明' : '解答';
    const record = this.practiceRecords.get(qid) || { answered: false };
    const secSlug = q.sec_slug || '';
    const knowledgePoints = q.kps || [];
    const hasLocalAiSolution = this.aiSolutions.has(qid);
    const paperQNum = q.paper_q_num || (idx + 1);

    const activeVer = this.activeSolutionVersions.get(qid) || 'local';
    const communityList = this.communitySolutions.get(qid) || [];
    let currentSolutionMd = '';

    if (activeVer === 'local') {
      currentSolutionMd = this.aiSolutions.get(qid) || '';
    } else {
      const match = communityList.find((s) => s.id === activeVer);
      if (match) currentSolutionMd = match.solution_md;
    }

    const hasAnySolution = Boolean(currentSolutionMd) || hasLocalAiSolution;
    const aiSolutionHtml = currentSolutionMd
      ? renderSolutionMarkdown(currentSolutionMd, false)
      : '<div class="ex-ai-placeholder">点击下方「问 AI 题解」获取本题规范推导与考点解析...</div>';

    return `
      <div class="ex-q-card" id="q-card-${qid}" data-qid="${qid}" data-type="${qType}" data-answer="${this.esc(q.answer)}">
        <div class="ex-q-header">
          <div class="ex-q-meta-left">
            <span class="ex-q-num">第 ${idx + 1} 题</span>
            <span class="ex-q-type-label">· ${typeLabel}</span>
            ${q.source_type === 'textbook'
              ? `<span class="ex-q-source-badge textbook">教材 · ${q.group || 'A'}组</span>`
              : `<span class="ex-q-source-badge exam" title="来源：《大邮数学集》（CC BY-NC-SA 4.0）">真题自测</span>`}
          </div>
          <div class="ex-q-meta-right">
            <button type="button" class="ex-text-link-btn" data-action="open-feedback" data-qid="${qid}" title="向开发团队报告题干/公式/答案错误">
              <md-icon class="ex-meta-mdicon">flag</md-icon>
              <span>报错</span>
            </button>
            <button type="button" class="ex-text-link-btn" data-action="open-source-editor" data-qid="${qid}" title="查看或直接修改题目 JSON/LaTeX 源码 (Dev-Only)">
              <md-icon class="ex-meta-mdicon">code</md-icon>
              <span>源码</span>
            </button>
          </div>
        </div>

        <div class="ex-q-stem">
          ${q.stem_html}
        </div>

        <div class="ex-interactive-wrap">
          ${this.renderInteractiveArea(q, record)}
        </div>

        <div class="ex-q-source-row">
          <button type="button" class="ex-source-link" data-action="jump-to-paper" data-paper-id="${q.paper_id}" data-qid="${qid}" title="点击秒切至该试卷【${this.esc(q.paper_title)}】查看整卷所有题目">
            <span>${this.esc(q.source || `${q.paper_title} · 原卷第 ${paperQNum} 题`)}</span>
          </button>
          ${secSlug ? `<span class="ex-source-sec">· ${secSlug}</span>` : ''}
        </div>

        <div class="ex-card-actions">
          <div class="ex-left-actions">
            ${
              qType !== 'choice' && qType !== 'blank'
                ? `<button type="button" class="ex-action-btn ex-toggle-steps-btn" data-action="toggle-steps" data-qid="${qid}">
                    <md-icon class="ex-btn-mdicon">${record.revealedSolution ? 'visibility_off' : 'visibility'}</md-icon>
                    <span>${record.revealedSolution ? '收起解析' : '查看解析'}</span>
                  </button>`
                : ''
            }
            <button type="button" class="ex-action-btn ex-toggle-hints-btn" data-action="toggle-hints" data-qid="${qid}">
              <md-icon class="ex-btn-mdicon">lightbulb</md-icon>
              <span>思路与考点</span>
            </button>
          </div>
          <div class="ex-right-actions">
            <button type="button" class="ex-action-btn ex-ask-ai-btn" data-action="ask-ai" data-qid="${qid}" title="在此题下方生成或查看 AI 规范推导">
              <md-icon class="ex-btn-mdicon">auto_awesome</md-icon>
              <span>问 AI 题解</span>
            </button>
          </div>
        </div>

        <div class="ex-solution-box ${record.answered || record.revealedSolution ? '' : 'hidden'}" id="sol-${qid}">
          ${(record.answered || record.revealedSolution) ? this.renderSolutionBoxContent(q) : ''}
        </div>

        <div class="ex-ai-box ${hasAnySolution ? '' : 'hidden'}" id="ai-box-${qid}">
          <div class="ex-ai-header">
            <div class="ex-ai-title">
              <span>AI 规范推导</span>
              <span class="ex-ai-model-badge" id="ai-model-${qid}">${this.getAiModelLabel(qid, activeVer)}</span>
              <span class="ex-ai-status" id="ai-status-${qid}">${hasAnySolution ? '推导就绪' : ''}</span>
            </div>
            <div class="ex-ai-tools">
              <button type="button" class="ex-ai-tool-btn ex-ai-copy-btn ${hasAnySolution ? '' : 'hidden'}" data-action="copy-ai" data-qid="${qid}" title="复制 LaTeX / Markdown 题解">
                <span>复制</span>
              </button>
              <button type="button" class="ex-ai-tool-btn ex-ai-upload-btn" data-action="open-ai-upload" data-qid="${qid}" title="将我自己生成的 AI 题解上传到统一数据库共享给全网读者">
                <span>分享</span>
              </button>
              <button type="button" class="ex-ai-tool-btn ex-ai-retry-btn ${hasAnySolution ? '' : 'hidden'}" data-action="retry-ai" data-qid="${qid}" title="重新生成规范推导">
                <span>重算</span>
              </button>
              <button type="button" class="ex-ai-tool-btn ex-ai-stop-btn hidden" data-action="stop-ai" data-qid="${qid}" title="停止生成">
                <span>停止</span>
              </button>
              <button type="button" class="ex-ai-tool-btn ex-ai-toggle-btn" data-action="toggle-ai-box" data-qid="${qid}" title="收起/展开">
                <md-icon class="ex-ai-chevron">expand_less</md-icon>
              </button>
            </div>
          </div>

          <div class="ex-ai-versions-bar" id="ai-versions-${qid}">
            ${this.renderAiVersionsBarHtml(qid, activeVer, communityList)}
          </div>

          <div class="ex-ai-content" id="ai-content-${qid}">
            ${aiSolutionHtml}
          </div>

          <div class="ex-ai-key-config hidden" id="ai-key-config-${qid}">
            <div class="ex-ai-key-tip">未检测到 API Key，请输入您的 API Key（当前推导模型：<strong>${this.getAiModelLabel(qid, activeVer)}</strong>）：</div>
            <div class="ex-ai-key-row">
              <input type="password" class="ex-ai-key-input" placeholder="输入 API Key (sk-...)" autocomplete="off" />
              <button type="button" class="ex-ai-key-save-btn" data-action="save-ai-key" data-qid="${qid}">保存并开始推导</button>
            </div>
            <div class="ex-ai-key-subtip" style="font-size: 0.72rem; color: var(--ex-text-3); margin-top: 4px;">
              密钥仅保存在本机浏览器 localStorage。
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private renderAiVersionsBarHtml(qid: string, activeVer: string, communityList: CommunityAiSolution[]): string {
    let pillsHtml = `
      <button type="button" class="ex-ai-ver-tab ${activeVer === 'local' ? 'active' : ''}" data-action="switch-ai-ver" data-qid="${qid}" data-ver="local">
        <span>本地实时推导</span>
      </button>
    `;

    communityList.forEach((sol) => {
      const isActive = activeVer === sol.id;
      const isUpvoted = exerciseDb.isUpvoted(sol.id);
      pillsHtml += `
        <div class="ex-ai-ver-item ${isActive ? 'active' : ''}">
          <button type="button" class="ex-ai-ver-tab ${isActive ? 'active' : ''}" data-action="switch-ai-ver" data-qid="${qid}" data-ver="${sol.id}">
            <span>${this.esc(sol.model_name)}</span>
            <span class="ex-ver-author">by ${this.esc(sol.author_name)}</span>
          </button>
          <button type="button" class="ex-ai-upvote-btn ${isUpvoted ? 'upvoted' : ''}" data-action="upvote-sol" data-sol-id="${sol.id}" data-qid="${qid}" title="点赞支持此题解">
            <md-icon class="ex-upvote-mdicon">thumb_up</md-icon>
            <span class="ex-upvote-count">${sol.upvotes || 0}</span>
          </button>
        </div>
      `;
    });

    return pillsHtml;
  }

  private getAiModelLabel(qid: string, activeVer: string): string {
    if (activeVer !== 'local') {
      const list = this.communitySolutions.get(qid) || [];
      const match = list.find((s) => s.id === activeVer);
      if (match) return match.model_name;
    }
    return getActiveAiModel().label;
  }

  private renderInteractiveArea(q: SlimQuestionItem, record: UserPracticeRecord): string {
    const qid = q.id;
    const qType = q.type;

    if (qType === 'choice' && q.options && q.options.length > 0) {
      return `
        <div class="ex-options-grid" data-qid="${qid}">
          ${q.options
            .map((opt) => {
              const optKey = opt.key;
              const isSelected = record.userChoice === optKey;
              let stateClass = '';
              if (record.answered) {
                if (optKey === q.answer) {
                  stateClass = 'is-correct';
                } else if (isSelected) {
                  stateClass = 'is-wrong';
                }
              }
              return `
                <button type="button" class="ex-option-btn ${stateClass} ${isSelected ? 'is-selected' : ''}" data-action="select-option" data-qid="${qid}" data-key="${optKey}">
                  <span class="ex-option-key">${optKey}</span>
                  <span class="ex-option-text">${opt.text_html || opt.text_raw}</span>
                </button>
              `;
            })
            .join('')}
        </div>
      `;
    }

    if (qType === 'blank') {
      const userVal = record.userBlank || '';
      const isAnswered = record.answered;
      let stateClass = '';
      if (isAnswered) {
        stateClass = record.isCorrect ? 'is-correct' : 'is-wrong';
      }
      return `
        <div class="ex-blank-wrap ${stateClass}" data-qid="${qid}">
          <input type="text" class="ex-blank-input" placeholder="输入填空计算结果 (支持 LaTeX 公式)..." value="${this.esc(userVal)}" ${isAnswered ? 'readonly' : ''} />
          <button type="button" class="ex-blank-check-btn" data-action="check-blank" data-qid="${qid}">
            ${isAnswered ? (record.isCorrect ? '正确' : '重做') : '核对答案'}
          </button>
        </div>
      `;
    }

    return '';
  }

  private bindBodyDelegatedInteractions(body: HTMLElement) {
    body.addEventListener('click', async (e) => {
      try {
        const target = e.target as HTMLElement;
        const btn = target.closest('[data-action]') as HTMLElement;
        if (!btn) return;

        const action = btn.getAttribute('data-action');
        const qid = btn.getAttribute('data-qid') || '';

        if (action === 'jump-to-paper') {
          const paperId = parseInt(btn.getAttribute('data-paper-id') || '1', 10);
          this.openPaper(paperId, qid);
          return;
        }

        if (action === 'open-feedback') {
          this.openFeedbackModal(qid);
          return;
        }

        if (action === 'open-source-editor') {
          this.openSourceEditorModal(qid);
          return;
        }

        if (action === 'open-ai-upload') {
          this.openAiUploadModal(qid);
          return;
        }

        if (action === 'switch-ai-ver') {
          const ver = btn.getAttribute('data-ver') || 'local';
          this.switchAiVersion(qid, ver);
          return;
        }

        if (action === 'upvote-sol') {
          const solId = btn.getAttribute('data-sol-id') || '';
          this.upvoteSolution(qid, solId);
          return;
        }

        if (action === 'select-option') {
          const optKey = btn.getAttribute('data-key') || '';
          this.handleOptionSelect(qid, optKey);
          return;
        }

        if (action === 'check-blank') {
          this.handleBlankCheck(qid);
          return;
        }

        if (action === 'toggle-steps') {
          this.toggleSteps(qid);
          return;
        }

        if (action === 'toggle-hints') {
          this.toggleHints(qid);
          return;
        }

        if (action === 'master') {
          this.toggleMaster(qid);
          return;
        }

        if (action === 'ask-ai') {
          this.handleAskAi(qid);
          return;
        }

        if (action === 'retry-ai') {
          this.handleAskAi(qid, true);
          return;
        }

        if (action === 'stop-ai') {
          this.stopAiStream(qid);
          return;
        }

        if (action === 'copy-ai') {
          this.copyAiSolution(qid);
          return;
        }

        if (action === 'toggle-ai-box') {
          this.toggleAiBox(qid);
          return;
        }

        if (action === 'save-ai-key') {
          this.saveAiKey(qid);
          return;
        }

        if (action === 'load-more') {
          this.displayedLimit += PAGE_SIZE;
          this.renderQuestionSlice();
          return;
        }
      } catch (err) {
        console.error('[ExerciseController] Click action error:', err);
      }
    });

    body.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const target = e.target as HTMLElement;
        if (target.classList.contains('ex-blank-input')) {
          const wrap = target.closest('.ex-blank-wrap');
          const qid = wrap?.getAttribute('data-qid');
          if (qid) this.handleBlankCheck(qid);
        }
      }
    });
  }

  /**
   * 构造参考答案、推导步骤与考点提示 HTML (按需执行，避免全量 KaTeX DOM 挂载)
   */
  private renderSolutionBoxContent(q: SlimQuestionItem): string {
    const qid = q.id;
    const qType = q.type;
    const record = this.practiceRecords.get(qid) || { answered: false };
    const knowledgePoints = q.kps || [];

    return `
      <div class="ex-solution-title">
        <span>【参考答案】${q.answer_html || '详见解析'}</span>
      </div>
      ${q.steps_html ? `<div class="ex-solution-steps">${q.steps_html}</div>` : ''}
      ${q.hints_html ? `<div class="ex-solution-steps"><strong>【思路提示】</strong>${q.hints_html}</div>` : ''}
      <div class="ex-solution-footer">
        <div class="ex-knowledge-tags">
          <span class="ex-k-label">考察考点：</span>
          ${knowledgePoints.map((kp) => `<span class="ex-k-tag">${kp}</span>`).join('')}
        </div>
        ${
          qType !== 'choice' && qType !== 'blank'
            ? `<div class="ex-mastery-btns">
                <button type="button" class="ex-action-btn ${record.mastered ? 'active' : ''}" data-action="master" data-qid="${qid}">
                  <span>${record.mastered ? '已掌握' : '标为已掌握'}</span>
                </button>
              </div>`
            : ''
        }
      </div>
    `;
  }

  private ensureSolutionBoxRendered(qid: string, solBox: Element) {
    if (!solBox.hasChildNodes()) {
      const q = this.currentFilteredQuestions.find((item) => item.id === qid);
      if (q) {
        solBox.innerHTML = this.renderSolutionBoxContent(q);
      }
    }
  }

  private handleOptionSelect(qid: string, userKey: string) {
    const card = this.bodyContainer?.querySelector(`#q-card-${qid}`);
    if (!card) return;
    const answer = card.getAttribute('data-answer') || '';
    const isCorrect = userKey.trim().toUpperCase() === answer.trim().toUpperCase();

    const record: UserPracticeRecord = {
      answered: true,
      userChoice: userKey,
      isCorrect,
    };
    this.practiceRecords.set(qid, record);

    const optBtns = card.querySelectorAll('.ex-option-btn');
    optBtns.forEach((btn) => {
      const k = btn.getAttribute('data-key');
      btn.classList.remove('is-selected', 'is-correct', 'is-wrong');
      if (k === userKey) btn.classList.add('is-selected');
      if (k === answer) {
        btn.classList.add('is-correct');
      } else if (k === userKey && !isCorrect) {
        btn.classList.add('is-wrong');
      }
    });

    const solBox = card.querySelector(`#sol-${qid}`);
    if (solBox) {
      this.ensureSolutionBoxRendered(qid, solBox);
      solBox.classList.remove('hidden');
    }

    this.filterAndRenderStatsOnly();
  }

  private handleBlankCheck(qid: string) {
    const card = this.bodyContainer?.querySelector(`#q-card-${qid}`);
    if (!card) return;
    const input = card.querySelector('.ex-blank-input') as HTMLInputElement;
    if (!input) return;

    const record = this.practiceRecords.get(qid);
    if (record && record.answered) {
      this.practiceRecords.delete(qid);
      input.removeAttribute('readonly');
      input.value = '';
      const wrap = card.querySelector('.ex-blank-wrap');
      wrap?.classList.remove('is-correct', 'is-wrong');
      const btn = card.querySelector('.ex-blank-check-btn');
      if (btn) btn.textContent = '核对答案';
      const solBox = card.querySelector(`#sol-${qid}`);
      if (solBox) solBox.classList.add('hidden');
      this.filterAndRenderStatsOnly();
      return;
    }

    const userVal = input.value.trim();
    if (!userVal) {
      this.showToast('请输入计算答案后再核对');
      return;
    }

    const answer = card.getAttribute('data-answer') || '';
    const cleanUser = userVal.replace(/\$/g, '').replace(/\s+/g, '');
    const cleanAns = answer.replace(/\$/g, '').replace(/\s+/g, '');
    const isCorrect = cleanUser === cleanAns || cleanAns.includes(cleanUser);

    this.practiceRecords.set(qid, {
      answered: true,
      userBlank: userVal,
      isCorrect,
    });

    input.setAttribute('readonly', 'true');
    const wrap = card.querySelector('.ex-blank-wrap');
    wrap?.classList.remove('is-correct', 'is-wrong');
    wrap?.classList.add(isCorrect ? 'is-correct' : 'is-wrong');

    const btn = card.querySelector('.ex-blank-check-btn');
    if (btn) btn.textContent = isCorrect ? '正确' : '重做';

    const solBox = card.querySelector(`#sol-${qid}`);
    if (solBox) {
      this.ensureSolutionBoxRendered(qid, solBox);
      solBox.classList.remove('hidden');
    }

    this.filterAndRenderStatsOnly();
  }

  private toggleSteps(qid: string) {
    const card = this.bodyContainer?.querySelector(`#q-card-${qid}`);
    if (!card) return;
    const solBox = card.querySelector(`#sol-${qid}`);
    if (!solBox) return;

    const record = this.practiceRecords.get(qid) || { answered: false };
    record.revealedSolution = !record.revealedSolution;
    this.practiceRecords.set(qid, record);

    if (record.revealedSolution) {
      this.ensureSolutionBoxRendered(qid, solBox);
    }
    solBox.classList.toggle('hidden', !record.revealedSolution);
    const btn = card.querySelector('.ex-toggle-steps-btn span');
    if (btn) btn.textContent = record.revealedSolution ? '收起解析' : '查看解析';
    const icon = card.querySelector('.ex-toggle-steps-btn md-icon');
    if (icon) icon.textContent = record.revealedSolution ? 'visibility_off' : 'visibility';
  }

  private toggleHints(qid: string) {
    const card = this.bodyContainer?.querySelector(`#q-card-${qid}`);
    if (!card) return;
    const solBox = card.querySelector(`#sol-${qid}`);
    if (!solBox) return;
    this.ensureSolutionBoxRendered(qid, solBox);
    solBox.classList.toggle('hidden');
  }

  private toggleMaster(qid: string) {
    const record = this.practiceRecords.get(qid) || { answered: false };
    record.mastered = !record.mastered;
    record.answered = true;
    this.practiceRecords.set(qid, record);

    const card = this.bodyContainer?.querySelector(`#q-card-${qid}`);
    const btn = card?.querySelector('[data-action="master"] span');
    const btnEl = card?.querySelector('[data-action="master"]');
    if (btnEl) btnEl.classList.toggle('active', record.mastered);
    if (btn) {
      btn.textContent = record.mastered ? '已掌握' : '标为已掌握';
    }

    this.filterAndRenderStatsOnly();
  }

  private filterAndRenderStatsOnly() {
    let doneCount = 0;
    let correctCount = 0;
    this.currentFilteredQuestions.forEach((q) => {
      const rec = this.practiceRecords.get(q.id);
      if (rec && rec.answered) {
        doneCount++;
        if (rec.isCorrect || rec.mastered) correctCount++;
      }
    });
    this.updateStats(this.currentFilteredQuestions.length, doneCount, correctCount);
  }

  private async handleAskAi(qid: string, forceRetry = false) {
    const card = this.bodyContainer?.querySelector(`#q-card-${qid}`);
    if (!card) return;

    const aiBox = card.querySelector(`#ai-box-${qid}`);
    if (aiBox) aiBox.classList.remove('hidden');

    this.loadCommunitySolutions(qid);

    if (this.aiSolutions.has(qid) && !forceRetry) {
      this.switchAiVersion(qid, 'local');
      return;
    }

    const q = this.currentFilteredQuestions.find((item) => item.id === qid);
    if (!q) return;

    const config = getEffectiveAiClientConfig();
    const configBox = card.querySelector(`#ai-key-config-${qid}`);
    if (!config.apiKey) {
      configBox?.classList.remove('hidden');
      return;
    }
    configBox?.classList.add('hidden');

    const contentEl = card.querySelector(`#ai-content-${qid}`) as HTMLElement;
    const statusEl = card.querySelector(`#ai-status-${qid}`);
    const stopBtn = card.querySelector('.ex-ai-stop-btn');
    const copyBtn = card.querySelector('.ex-ai-copy-btn');
    const retryBtn = card.querySelector('.ex-ai-retry-btn');

    if (stopBtn) stopBtn.classList.remove('hidden');
    if (copyBtn) copyBtn.classList.add('hidden');
    if (retryBtn) retryBtn.classList.add('hidden');
    if (statusEl) statusEl.textContent = '正在推导...';

    const prompt = `请对以下题目给出极为规范、详尽的推导过程与标准解法。
【输出排版强制要求】：
1. 严格使用标准 Markdown 与 KaTeX 规范：行内公式一律用 $...$，独立居中公式一律用 $$...$$；
2. 绝对严禁输出任何 \\[、\\]、\\(、\\) 界定符！
3. 给出规范分步推导演算过程与最终标准答案，步骤严谨无跳步。

【题目信息】
来源：${q.source || `${q.paper_title}（原卷第 ${q.paper_q_num} 题）`}
小节：${q.sec_title || q.sec}
题型：${q.type}
题干：
${q.stem_raw}

${q.options && q.options.length ? `选项：\n${q.options.map((o) => `${o.key}. ${o.text_raw}`).join('\n')}` : ''}
${q.answer ? `参考结果：${q.answer}` : ''}`;

    const controller = new AbortController();
    this.aiControllers.set(qid, controller);
    this.aiStreamActive.add(qid);

    let accumulatedMd = '';
    let accumulatedReasoning = '';
    this.activeSolutionVersions.set(qid, 'local');

    // 初始化流式批处理节流调度器（100ms 窗口）
    const scheduler = new StreamThrottleScheduler(() => {
      this.aiSolutions.set(qid, accumulatedMd);
      if (contentEl) {
        if (!accumulatedMd && accumulatedReasoning) {
          contentEl.innerHTML = '<div class="ex-ai-placeholder">正在深度梳理推导演算与思考过程...</div>';
        } else if (accumulatedMd) {
          contentEl.innerHTML = renderSolutionMarkdown(accumulatedMd, true);
          try {
            renderMathInElement(contentEl, KATEX_OPTIONS);
          } catch (e) {}
        }
      }
    }, 100);
    this.aiSchedulers.set(qid, scheduler);

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
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ];

    try {
      await streamChat({
        endpoint: config.endpoint,
        apiKey: config.apiKey,
        model: config.model,
        maxTokens: config.maxTokens,
        messages,
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
      this.aiSchedulers.delete(qid);
      this.aiStreamActive.delete(qid);

      const hasContent = Boolean(accumulatedMd && accumulatedMd.trim());
      const hasReasoning = Boolean(accumulatedReasoning && accumulatedReasoning.trim());

      if (!hasContent && !hasReasoning) {
        if (statusEl) statusEl.textContent = '推导中断';
        if (contentEl) {
          contentEl.innerHTML = '<div class="ex-ai-error">模型未返回有效推导内容，请检查服务状态并重试</div>';
        }
        if (stopBtn) stopBtn.classList.add('hidden');
        if (retryBtn) retryBtn.classList.remove('hidden');
        return;
      }

      if (!hasContent && hasReasoning) {
        if (statusEl) statusEl.textContent = '推导中断（正文未返回）';
        if (contentEl) {
          contentEl.innerHTML = '<div class="ex-ai-error">模型已完成思路推演，但未输出正文推导（可能因服务端连接中断或生成异常）。请点击重新生成。</div>';
        }
        if (stopBtn) stopBtn.classList.add('hidden');
        if (retryBtn) retryBtn.classList.remove('hidden');
        return;
      }

      this.aiSolutions.set(qid, accumulatedMd);
      if (contentEl) {
        contentEl.innerHTML = renderSolutionMarkdown(accumulatedMd, false);
        try {
          renderMathInElement(contentEl, KATEX_OPTIONS);
        } catch (e) {}
      }

      if (statusEl) statusEl.textContent = '推导完成';
      if (stopBtn) stopBtn.classList.add('hidden');
      if (copyBtn) copyBtn.classList.remove('hidden');
      if (retryBtn) retryBtn.classList.remove('hidden');
      this.updateAiVersionsBar(qid);
    } catch (err: any) {
      const sch = this.aiSchedulers.get(qid);
      if (sch) {
        sch.stop();
        this.aiSchedulers.delete(qid);
      }
      this.aiStreamActive.delete(qid);
      if (err.name === 'AbortError') {
        if (statusEl) statusEl.textContent = '已停止生成';
      } else {
        const errInfo = parseAiError(err);
        if (statusEl) statusEl.textContent = `推导中断: ${errInfo.title}`;
        if (contentEl && !accumulatedMd) {
          contentEl.innerHTML = `<div class="ex-ai-error"><strong>${errInfo.title}</strong><br/>${errInfo.message}</div>`;
        }
      }
      if (stopBtn) stopBtn.classList.add('hidden');
      if (retryBtn) retryBtn.classList.remove('hidden');
    }
  }

  private stopAiStream(qid: string) {
    const scheduler = this.aiSchedulers.get(qid);
    if (scheduler) {
      scheduler.stop();
      this.aiSchedulers.delete(qid);
    }
    const ctrl = this.aiControllers.get(qid);
    if (ctrl) {
      ctrl.abort();
      this.aiControllers.delete(qid);
    }
  }

  private async loadCommunitySolutions(qid: string) {
    try {
      const list = await exerciseDb.fetchCommunitySolutions(qid);
      this.communitySolutions.set(qid, list);
      this.updateAiVersionsBar(qid);
    } catch (err) {
      console.warn('[ExerciseController] 加载社区题解失败:', err);
    }
  }

  private updateAiVersionsBar(qid: string) {
    const card = this.bodyContainer?.querySelector(`#q-card-${qid}`);
    if (!card) return;
    const verBar = card.querySelector(`#ai-versions-${qid}`);
    if (!verBar) return;

    const activeVer = this.activeSolutionVersions.get(qid) || 'local';
    const list = this.communitySolutions.get(qid) || [];
    verBar.innerHTML = this.renderAiVersionsBarHtml(qid, activeVer, list);
  }

  private switchAiVersion(qid: string, verId: string) {
    this.activeSolutionVersions.set(qid, verId);
    const card = this.bodyContainer?.querySelector(`#q-card-${qid}`);
    if (!card) return;

    this.updateAiVersionsBar(qid);

    const contentEl = card.querySelector(`#ai-content-${qid}`) as HTMLElement;
    const modelBadge = card.querySelector(`#ai-model-${qid}`);
    const statusEl = card.querySelector(`#ai-status-${qid}`);

    let md = '';
    if (verId === 'local') {
      md = this.aiSolutions.get(qid) || '';
      if (modelBadge) modelBadge.textContent = this.getAiModelLabel(qid, 'local');
      if (statusEl) statusEl.textContent = md ? '推导完成' : '';
    } else {
      const list = this.communitySolutions.get(qid) || [];
      const match = list.find((s) => s.id === verId);
      if (match) {
        md = match.solution_md;
        if (modelBadge) modelBadge.textContent = match.model_name;
        if (statusEl) statusEl.textContent = `社区贡献 (by ${match.author_name})`;
      }
    }

    if (contentEl) {
      contentEl.innerHTML = md
        ? renderSolutionMarkdown(md, false)
        : '<div class="ex-ai-placeholder">暂未生成推导内容</div>';
      try {
        renderMathInElement(contentEl, KATEX_OPTIONS);
      } catch (e) {}
    }
  }

  private async upvoteSolution(qid: string, solId: string) {
    if (exerciseDb.isUpvoted(solId)) {
      this.showToast('您已经点赞过该题解');
      return;
    }

    const res = await exerciseDb.upvoteSolution(solId);
    if (res.success) {
      const list = this.communitySolutions.get(qid) || [];
      const match = list.find((s) => s.id === solId);
      if (match) match.upvotes = res.newUpvotes;
      this.updateAiVersionsBar(qid);
      this.showToast('点赞成功，感谢您的认可！');
    }
  }

  private copyAiSolution(qid: string) {
    const activeVer = this.activeSolutionVersions.get(qid) || 'local';
    let md = '';
    if (activeVer === 'local') {
      md = this.aiSolutions.get(qid) || '';
    } else {
      const list = this.communitySolutions.get(qid) || [];
      const match = list.find((s) => s.id === activeVer);
      if (match) md = match.solution_md;
    }

    if (!md) return;
    navigator.clipboard.writeText(md).then(() => {
      this.showToast('AI 规范推导 LaTeX/Markdown 源码已复制至剪贴板');
    });
  }

  private toggleAiBox(qid: string) {
    const card = this.bodyContainer?.querySelector(`#q-card-${qid}`);
    const content = card?.querySelector(`#ai-content-${qid}`);
    const chevron = card?.querySelector('.ex-ai-chevron');
    if (content) {
      content.classList.toggle('hidden');
      if (chevron) {
        chevron.classList.toggle('rotated', content.classList.contains('hidden'));
      }
    }
  }

  private saveAiKey(qid: string) {
    const card = this.bodyContainer?.querySelector(`#q-card-${qid}`);
    const input = card?.querySelector('.ex-ai-key-input') as HTMLInputElement;
    if (input && input.value.trim()) {
      saveAiApiKey(getActiveAiModel().id, input.value.trim());
      card?.querySelector(`#ai-key-config-${qid}`)?.classList.add('hidden');
      this.showToast('API Key 保存成功');
      this.handleAskAi(qid);
    }
  }

  private bindSubmodalEvents() {
    if (!this.root) return;

    this.root.querySelectorAll('[data-action="close-feedback-modal"]').forEach((btn) => {
      btn.addEventListener('click', () => this.feedbackModal?.classList.add('hidden'));
    });

    const fbSubmitBtn = this.root.querySelector('#ex-fb-submit-btn');
    if (fbSubmitBtn) {
      fbSubmitBtn.addEventListener('click', () => this.submitFeedback());
    }

    this.root.querySelectorAll('[data-action="close-source-modal"]').forEach((btn) => {
      btn.addEventListener('click', () => this.sourceEditorModal?.classList.add('hidden'));
    });

    const srcCopyBtn = this.root.querySelector('#ex-src-copy-btn');
    if (srcCopyBtn) {
      srcCopyBtn.addEventListener('click', () => {
        const textarea = this.root?.querySelector('#ex-src-editor-textarea') as HTMLTextAreaElement;
        if (textarea && textarea.value) {
          navigator.clipboard.writeText(textarea.value).then(() => {
            this.showToast('题目完整 JSON 源码已复制');
          });
        }
      });
    }

    const srcSaveBtn = this.root.querySelector('#ex-src-save-btn');
    if (srcSaveBtn) {
      srcSaveBtn.addEventListener('click', () => this.saveSourceChanges());
    }

    this.root.querySelectorAll('[data-action="close-upload-modal"]').forEach((btn) => {
      btn.addEventListener('click', () => this.aiUploadModal?.classList.add('hidden'));
    });

    const aiUploadSubmitBtn = this.root.querySelector('#ex-ai-upload-submit-btn');
    if (aiUploadSubmitBtn) {
      aiUploadSubmitBtn.addEventListener('click', () => this.submitAiSolutionUpload());
    }

    // LaTeX 导出模态框交互与云端编译事件由 this.exportPipeline 统一驱动管理
  }

  private openFeedbackModal(qid: string) {
    const q = this.currentFilteredQuestions.find((item) => item.id === qid);
    if (!q || !this.feedbackModal) return;
    this.activeFeedbackQuestion = q;

    const qidBadge = this.feedbackModal.querySelector('#ex-fb-qid-badge');
    const sourceHint = this.feedbackModal.querySelector('#ex-fb-source-hint');
    if (qidBadge) qidBadge.textContent = q.id;
    if (sourceHint) sourceHint.textContent = `${q.paper_title} · 原卷第 ${q.paper_q_num} 题 (${q.type})`;

    const descInput = this.feedbackModal.querySelector('#ex-fb-desc-input') as HTMLTextAreaElement;
    const suggInput = this.feedbackModal.querySelector('#ex-fb-sugg-input') as HTMLTextAreaElement;
    if (descInput) descInput.value = '';
    if (suggInput) suggInput.value = '';

    this.feedbackModal.classList.remove('hidden');
  }

  private async submitFeedback() {
    if (!this.activeFeedbackQuestion || !this.feedbackModal) return;

    const descInput = this.feedbackModal.querySelector('#ex-fb-desc-input') as HTMLTextAreaElement;
    const suggInput = this.feedbackModal.querySelector('#ex-fb-sugg-input') as HTMLTextAreaElement;
    const reporterInput = this.feedbackModal.querySelector('#ex-fb-reporter-input') as HTMLInputElement;

    const desc = descInput?.value.trim();
    if (!desc) {
      this.showToast('请填写问题详情描述');
      return;
    }

    const checkboxes = this.feedbackModal.querySelectorAll('input[name="fb-err"]:checked');
    const errorTypes: string[] = [];
    checkboxes.forEach((cb: any) => errorTypes.push(cb.value));

    const payload: ExerciseFeedbackPayload = {
      question_id: this.activeFeedbackQuestion.id,
      paper_title: this.activeFeedbackQuestion.paper_title,
      order_in_paper: this.activeFeedbackQuestion.paper_q_num,
      chapter: this.activeFeedbackQuestion.chapter,
      section: this.activeFeedbackQuestion.sec,
      question_type: this.activeFeedbackQuestion.type,
      error_types: errorTypes,
      description: desc,
      suggestion: suggInput?.value.trim() || '',
      reporter_name: reporterInput?.value.trim() || '热心读者',
    };

    const submitBtn = this.feedbackModal.querySelector('#ex-fb-submit-btn') as HTMLButtonElement;
    if (submitBtn) submitBtn.disabled = true;

    const res = await exerciseDb.submitFeedback(payload);
    if (submitBtn) submitBtn.disabled = false;

    this.feedbackModal.classList.add('hidden');
    this.showToast(res.message || '勘误反馈已成功提交，感谢您的支持！');
  }

  private openSourceEditorModal(qid: string) {
    const q = this.currentFilteredQuestions.find((item) => item.id === qid);
    if (!q || !this.sourceEditorModal) return;
    this.activeEditorQuestion = q;

    const textarea = this.sourceEditorModal.querySelector('#ex-src-editor-textarea') as HTMLTextAreaElement;
    const statusMsg = this.sourceEditorModal.querySelector('#ex-src-status-msg');
    if (statusMsg) statusMsg.textContent = '';

    const editorPayload = {
      id: q.id,
      meta: {
        type: q.type,
        score: q.score,
        order_in_paper: q.order_in_paper,
        section_type: q.section_type,
      },
      content: {
        stem: q.stem_raw,
        options: q.options ? q.options.map((o) => ({ key: o.key, text: o.text_raw })) : [],
      },
      solution: {
        answer: q.answer,
        hints: '',
        steps: '',
      },
      source: {
        paper_id: q.paper_id,
        raw_title: q.paper_raw_title || q.paper_title,
        academic_year: q.academic_year,
        category: q.paper_category,
      },
      mapping: {
        engineering_analysis: {
          chapter: q.chapter,
          chapter_title: q.chapter_title,
          section: q.sec,
          section_title: q.sec_title,
          section_slug: q.sec_slug,
          knowledge_points: q.kps,
        },
      },
    };

    if (textarea) {
      textarea.value = JSON.stringify(editorPayload, null, 2);
    }

    this.sourceEditorModal.classList.remove('hidden');
  }

  private async saveSourceChanges() {
    if (!this.activeEditorQuestion || !this.sourceEditorModal) return;
    const textarea = this.sourceEditorModal.querySelector('#ex-src-editor-textarea') as HTMLTextAreaElement;
    const statusMsg = this.sourceEditorModal.querySelector('#ex-src-status-msg');
    const saveBtn = this.sourceEditorModal.querySelector('#ex-src-save-btn') as HTMLButtonElement;

    let parsedData: any = null;
    try {
      parsedData = sanitizeLatexValue(JSON.parse(textarea.value));
    } catch (e: any) {
      if (statusMsg) statusMsg.textContent = `JSON 语法错误: ${e.message}`;
      return;
    }

    if (saveBtn) saveBtn.disabled = true;
    if (statusMsg) statusMsg.textContent = '正在向本地 Dev Server 写入并重载...';

    const res = await exerciseDb.saveQuestionSource({
      question_id: this.activeEditorQuestion.id,
      chapter: this.activeEditorQuestion.chapter,
      question_data: parsedData,
    });

    if (saveBtn) saveBtn.disabled = false;

    if (res.success) {
      this.sourceEditorModal.classList.add('hidden');
      this.showToast(res.message || '源码修改已成功保存并完成热重载！');

      // 清理缓存以保证下次加载最新编译产物
      this.chapterCache.delete(this.activeEditorQuestion.chapter);
      this.paperCache.delete(this.activeEditorQuestion.paper_id);
      this.allQuestionsCache = [];

      if (parsedData.content?.stem) this.activeEditorQuestion.stem_raw = parsedData.content.stem;
      if (parsedData.solution?.answer) this.activeEditorQuestion.answer = parsedData.solution.answer;
      if (parsedData.meta?.type) this.activeEditorQuestion.type = parsedData.meta.type;

      // 重新拉取当前章节
      if (this.currentMode === 'practice') {
        this.loadChapter(this.currentChapter);
      } else if (this.currentMode === 'paper') {
        this.loadPaper(this.currentPaperId);
      } else {
        this.filterAndRender();
      }
    } else {
      if (statusMsg) statusMsg.textContent = res.message || '保存失败';
    }
  }

  private openAiUploadModal(qid: string) {
    if (!this.aiUploadModal) return;
    this.activeUploadQuestionId = qid;

    const qidEl = this.aiUploadModal.querySelector('#ex-ai-upload-qid');
    if (qidEl) qidEl.textContent = qid;

    const solTextarea = this.aiUploadModal.querySelector('#ex-ai-solution-textarea') as HTMLTextAreaElement;
    const existingMd = this.aiSolutions.get(qid) || '';
    if (solTextarea) solTextarea.value = existingMd;

    this.aiUploadModal.classList.remove('hidden');
  }

  private async submitAiSolutionUpload() {
    if (!this.activeUploadQuestionId || !this.aiUploadModal) return;

    const modelInput = this.aiUploadModal.querySelector('#ex-ai-model-input') as HTMLInputElement;
    const authorInput = this.aiUploadModal.querySelector('#ex-ai-author-input') as HTMLInputElement;
    const solTextarea = this.aiUploadModal.querySelector('#ex-ai-solution-textarea') as HTMLTextAreaElement;
    const remarksInput = this.aiUploadModal.querySelector('#ex-ai-remarks-input') as HTMLInputElement;

    const solutionMd = solTextarea?.value.trim();
    if (!solutionMd) {
      this.showToast('请填入 AI 题解推导 Markdown 内容');
      return;
    }

    const modelName = modelInput?.value.trim() || 'AI 推导模型';
    const authorName = authorInput?.value.trim() || '热心读者';
    const remarks = remarksInput?.value.trim() || '';

    const submitBtn = this.aiUploadModal.querySelector('#ex-ai-upload-submit-btn') as HTMLButtonElement;
    if (submitBtn) submitBtn.disabled = true;

    const res = await exerciseDb.uploadCommunitySolution({
      question_id: this.activeUploadQuestionId,
      model_name: modelName,
      author_name: authorName,
      solution_md: solutionMd,
      remarks,
    });

    if (submitBtn) submitBtn.disabled = false;

    if (res.success && res.data) {
      this.aiUploadModal.classList.add('hidden');
      this.showToast('AI 题解已成功上传至统一题解库！');

      const list = this.communitySolutions.get(this.activeUploadQuestionId) || [];
      list.unshift(res.data);
      this.communitySolutions.set(this.activeUploadQuestionId, list);
      this.switchAiVersion(this.activeUploadQuestionId, res.data.id);
    } else {
      this.showToast('上传失败，请重试');
    }
  }

  // =========================================================================
  // LaTeX / Typst 导出与云端/本地编译流水线已解耦至 ExerciseExportPipeline
  // (参见 src/components/exercises/exercise-export-pipeline.ts)
  // =========================================================================

  private showToast(msg: string) {
    if (!this.toastBox) return;
    const toast = document.createElement('div');
    toast.className = 'ex-toast';
    toast.textContent = msg;
    this.toastBox.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('ex-toast-fade');
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }

  private esc(s: string): string {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

export const exerciseController = new ExerciseCenterController();
