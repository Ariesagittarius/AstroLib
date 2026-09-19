let _renderMath: any = null;
async function getMathRenderer() {
  if (!_renderMath) {
    const mod = await import('katex/dist/contrib/auto-render.mjs');
    _renderMath = mod.default || mod;
  }
  return _renderMath;
}

let _aiCoreModules: any = null;
async function getAiCoreModules() {
  if (!_aiCoreModules) {
    const [retrieverMod, llmMod, toolsMod] = await Promise.all([
      import('../retriever.mjs'),
      import('../llm.mjs'),
      import('../tools-client.mjs'),
    ]);
    _aiCoreModules = {
      createRetriever: retrieverMod.createRetriever,
      buildMessages: llmMod.buildMessages,
      buildContext: llmMod.buildContext,
      streamChat: llmMod.streamChat,
      buildToolDefs: toolsMod.buildToolDefs,
      runClientTool: toolsMod.runClientTool,
      toolsDesc: toolsMod.toolsDesc,
    };
  }
  return _aiCoreModules;
}

import {
  getAllAiModels,
  getActiveAiModelId,
  getAiProvider,
  getAiApiKey,
  getAiEndpoint,
  getAiParams,
  getAiAnswerMode,
  getAiSourceOpen,
  getAiPanelDimensions,
  getAiAutoCollapsePreceding,
  getAiCollapseToolsSummary,
  saveAiCollapseToolsSummary,
  formatExplorationSummary,
  getAiSideloadRefChapter,
  saveAiActiveModel,
  getAiExtendedThinking,
  saveAiExtendedThinking,
  getShortModelLabel,
  onAiConfigChange,
} from '../ai-config';

export interface ReferencedChapter {
  title: string;
  url: string;
  text?: string;
  isCurrent?: boolean;
}
import { parseAiError, renderErrorCardHtml } from '../error-handler';
import { createM3LoadingHtml } from '../../components/common/m3-loading-helper';
import { initChatResizer } from './chat-resizer';
import {
  ThreadStore,
  MAX_THREADS,
  MAX_MSGS,
} from './thread-store';
import { mdToHtml, safeLink } from './chat-markdown';
import { sideloadManager } from '../../components/sideload/sideload-manager';

const DOCKED_STORAGE_KEY = 'astrolib_ai_docked';

function decorateFootnotes(html: string, decorate = true): string {
  if (!decorate || !html) return html || '';
  const protectedBlocks: string[] = [];
  // 保护 pre, code, a 标签，以及包含数学公式的标签与 HTML 属性，避免数学公式下标被误换为链接
  let safe = html.replace(/(<(?:pre|code|a|p\s+class="md-math")[^>]*>[\s\S]*?<\/(?:pre|code|a|p)>|<[^>]+>)/gi, (m) => {
    protectedBlocks.push(m);
    return `___FN_PROT_${protectedBlocks.length - 1}___`;
  });
  safe = safe.replace(/\[(\d+)\]/g, (_m, n) => `<a class="cite-ref" href="#ai-cite-${n}">[${n}]</a>`);
  return safe.replace(/___FN_PROT_(\d+)___/g, (_m, i) => protectedBlocks[Number(i)] || '');
}

function cleanSingleLine(s: string): string {
  return (s || '').replace(/\s+/g, ' ').trim();
}

function toolSummary(name: string, out: any = {}): string {
  let summary = '执行完成';
  if (name === 'book_retrieve') {
    const n = out.count ?? (out.results || []).length;
    const titles = (out.results || []).slice(0, 2).map((r: any) => r.title).filter(Boolean).join('、');
    summary = `命中 ${n} 条${titles ? `：${titles}` : ''}`;
  } else if (name === 'book_chunk') {
    summary = out.found ? '已取片段全文' : '未找到片段';
  } else if (name === 'book_slice_search') {
    const n = out.count ?? (out.hits || []).length;
    const titles = (out.hits || []).slice(0, 2).map((r: any) => r.title).filter(Boolean).join('、');
    summary = `命中 ${n} 条${titles ? `：${titles}` : ''}`;
  } else if (name === 'book_chapter_outline') {
    if (out.found === false) {
      summary = '未找到匹配章节（可给章号或标题后重试）';
    } else if (out.chapter) {
      const secs = (out.chapter.sections || []).length;
      const cards = (out.chapter.sections || []).reduce((s: number, x: any) => s + (x.cards || []).length, 0);
      const t = out.chapter.title ? `：${out.chapter.title}` : '';
      summary = `章 ${out.chapter.number || ''}${t}（${secs} 小节 / ${cards} 卡片）`;
    } else {
      summary = `列出 ${(out.chapters || []).length} 章（${out.count ?? ''}）`;
    }
  } else if (name === 'book_read_section') {
    if (out.found === false) {
      summary = '未找到起始片段（可用 id/标题/编号）';
    } else {
      summary = `已读 ${out.count} 段${out.truncated ? '（部分截断）' : ''}`;
    }
  } else if (name === 'list_books') {
    summary = `列出 ${(out.books || []).length} 本书`;
  } else if (name === 'book_toc') {
    summary = `目录 ${(out.toc || []).length} 条`;
  }
  return cleanSingleLine(summary);
}

export { formatExplorationSummary };

function capSnippet(s: string, n = 110): string {
  const t = (s || '').replace(/\s+/g, ' ').trim();
  if (t.length <= n) return t;
  const cut = t.slice(0, n);
  return `${cut.trimEnd()}…`;
}

function jsonHighlight(escaped: string): string {
  if (!escaped) return '';
  let s = esc(escaped);
  s = s.replace(/&quot;((?:[^&]|&(?!quot;))*?)&quot;/g, (m, _g, offset, whole) => {
    const isKey = /^\s*:/.test(whole.slice(offset + m.length));
    return `<span class="${isKey ? 'json-key' : 'json-str'}">${m}</span>`;
  });
  s = s.replace(/(\b-?\d+(?:\.\d+)?\b)/g, '<span class="json-num">$1</span>');
  s = s.replace(/\b(true|false)\b/g, '<span class="json-bool">$1</span>');
  s = s.replace(/\bnull\b/g, '<span class="json-null">null</span>');
  return s;
}

function capJsonText(v: any, cap = 1200): string {
  let s;
  try { s = JSON.stringify(v, null, 2); } catch { s = String(v); }
  if (s.length <= cap) return s;
  return `${s.slice(0, cap)}\n…`;
}

const SUGGESTIONS = [
  '夹逼定理是什么意思？',
  '什么情况下用麦克劳林展开？',
  '这道例题的解题步骤是什么？',
];

function getConfig(el: Element): any {
  try { return JSON.parse(el.getAttribute('data-config') || '{}'); } catch { return {}; }
}

function esc(s: string): string {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export class AIAskElement extends HTMLElement {
  _indexCache = new Map<string, any>();
  _inited = false;
  _abort: AbortController | null = null;
  _busy = false;
  _streaming = false;
  _threadStore: ThreadStore = new ThreadStore('');
  _threads: any[] | null = null;
  _activeThread: any = null;
  _config: any = {};
  _bookTitle = '本书';
  _col = '';
  _book = '';
  _panel!: HTMLElement;
  _fab!: HTMLElement;
  _close!: HTMLElement;
  _settingsBtn!: HTMLElement;
  _collapseBtn!: HTMLElement;
  _isPrecedingCollapsed = true;
  _newBtn!: HTMLElement;
  _submit!: HTMLButtonElement;
  _sendIcon!: HTMLElement;
  _stopIcon!: HTMLElement;
  _input!: HTMLTextAreaElement;
  _status!: HTMLElement;
  _thread!: HTMLElement;
  _empty!: HTMLElement;
  _messages!: HTMLElement;
  _bookEl!: HTMLElement;
  _historyBtn!: HTMLElement;
  _history!: HTMLElement;
  _historyList!: HTMLElement;
  _historyEmpty!: HTMLElement;
  _historyNew!: HTMLElement;
  _historyClose!: HTMLElement;
  _isDocked = false;
  _dockBtn!: HTMLElement;
  _dockIcon!: HTMLElement;
  _undockIcon!: HTMLElement;
  _sideloadBackBtn!: HTMLElement;
  _contextContainer!: HTMLElement;
  _contextRow!: HTMLElement;
  _contextText!: HTMLElement;
  _contextExpandBtn!: HTMLButtonElement;
  _contextRemoveBtn!: HTMLButtonElement;
  _contextDropdown!: HTMLElement;
  _contextItemsList!: HTMLElement;
  _addChapterBtn!: HTMLButtonElement;
  _chapterPickerPopover!: HTMLElement;
  _chapterSearchInput!: HTMLInputElement;
  _chapterPickerClose!: HTMLButtonElement;
  _chapterPickerList!: HTMLElement;
  _chapterPickerCount!: HTMLElement;
  _chapterPickerDone!: HTMLButtonElement;
  _modelPillBtn!: HTMLButtonElement;
  _modelPillName!: HTMLElement;
  _modelMenu!: HTMLElement;
  _thinkingSwitch!: HTMLInputElement;
  _collapseToolsSwitch!: HTMLInputElement;
  _modelExtraItem!: HTMLElement;
  _modelExtraHeadline!: HTMLElement;
  _modelExtraSupport!: HTMLElement;
  _referencedChapters: ReferencedChapter[] = [];
  _bookChaptersCache: Array<{ title: string; url: string }> | null = null;
  _chapterTextCache: Map<string, Promise<string>> = new Map();
  _chapterChip!: HTMLElement;
  _chapterChipText!: HTMLElement;
  _chapterChipClose!: HTMLElement;
  _refCurrentChapter = false;
  _unsubSideload: (() => void) | null = null;
  _originalParent: HTMLElement | null = null;
  _originalNextSibling: Node | null = null;
  _onKeyDownAltD!: (e: KeyboardEvent) => void;
  _onRoute!: () => void;
  _onDocClick!: (e: MouseEvent) => void;
  _onKeyDownEsc!: (e: KeyboardEvent) => void;
  _onExternalQuery!: (e: CustomEvent) => void;
  _unsubAi: (() => void) | null = null;
  _katexConfig = {
    delimiters: [
      { left: '$$', right: '$$', display: true },
      { left: '$', right: '$', display: false },
    ],
    throwOnError: false,
  };

  constructor() {
    super();
  }

  connectedCallback() {
    // 单例守卫：确保全站仅存在一个活跃的 ai-ask 根实例（防止 SPA 切页在 main-pane 产生重复实例）
    const allInstances = document.querySelectorAll('ai-ask');
    if (allInstances.length > 1) {
      for (const inst of allInstances) {
        if (inst !== this && (inst as any)._inited) {
          this.remove();
          return;
        }
      }
    }
    if (this._inited) return;
    this._inited = true;
    this._initDom();
    this._onRoute = () => this._route();
    this._onDocClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (this._historyBtn && this._historyBtn.contains(target)) return;
      if (this._history && this._history.classList.contains('open') && !this._history.contains(target)) {
        this._history.classList.remove('open');
        this._historyBtn && this._historyBtn.classList.remove('ask-settings-open');
      }
      // 点击外部关闭模型菜单
      if (this._modelMenu && this._modelMenu.style.display !== 'none') {
        if (!this._modelMenu.contains(target) && (!this._modelPillBtn || !this._modelPillBtn.contains(target))) {
          this._closeModelMenu();
        }
      }
      // 点击外部关闭章节选择器
      if (this._chapterPickerPopover && this._chapterPickerPopover.style.display !== 'none') {
        if (!this._chapterPickerPopover.contains(target) && (!this._addChapterBtn || !this._addChapterBtn.contains(target))) {
          this._closeChapterPicker();
        }
      }
    };
    this._onKeyDownEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (this._chapterPickerPopover && this._chapterPickerPopover.style.display !== 'none') {
          e.stopPropagation();
          this._closeChapterPicker();
          return;
        }
        if (this._modelMenu && this._modelMenu.style.display !== 'none') {
          e.stopPropagation();
          this._closeModelMenu();
          return;
        }
      }
    };
    this._onExternalQuery = (e: CustomEvent) => {
      (e as any).__handled = true;
      const { prompt, autoSubmit = true } = (e && e.detail) || {};
      if (!prompt) return;
      this._openWithQuestion(prompt, autoSubmit);
    };

    this._onKeyDownAltD = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'd' || e.key === 'D')) {
        if (this._isDocked || (this._panel && this._panel.classList.contains('ask-open'))) {
          e.preventDefault();
          this.toggleDock();
        }
      }
    };
    window.addEventListener('keydown', this._onKeyDownAltD);
    window.addEventListener('keydown', this._onKeyDownEsc);

    // 订阅侧载管理器状态变更：若非 AI 面板激活（如 Esc 或切回大纲），自动将 DOM 归位并关闭浮窗
    this._unsubSideload = sideloadManager.subscribe((state) => {
      if (state.activePanelId !== 'ai' && this._isDocked) {
        this._undockInternal(false);
      }
    });

    this._unsubAi = onAiConfigChange(() => {
      const dims = getAiPanelDimensions();
      if (this._panel && dims.width && dims.height) {
        this._panel.style.setProperty('--ask-panel-width', `${dims.width}px`);
        this._panel.style.setProperty('--ask-panel-height', `${dims.height}px`);
      }
      this._applySrcOpenToExisting();
      this._updateModelPill();
      if (this._collapseToolsSwitch) {
        this._collapseToolsSwitch.checked = getAiCollapseToolsSummary();
      }
      if (getAiAutoCollapsePreceding()) {
        this._collapsePreceding(true);
      }
      if (this._isDocked) {
        if (getAiSideloadRefChapter() && !this._refCurrentChapter) {
          this._enableChapterReference();
        } else if (!getAiSideloadRefChapter() && this._refCurrentChapter) {
          this._disableChapterReference();
        }
      }
    });

    window.addEventListener('astro:page-load', this._onRoute);
    window.addEventListener('astrolib:spa-navigated', this._onRoute);
    window.addEventListener('aiask:query', this._onExternalQuery as EventListener);
    document.addEventListener('click', this._onDocClick);
    this._route();
  }

  disconnectedCallback() {
    window.removeEventListener('astro:page-load', this._onRoute);
    window.removeEventListener('astrolib:spa-navigated', this._onRoute);
    window.removeEventListener('aiask:query', this._onExternalQuery as EventListener);
    document.removeEventListener('click', this._onDocClick);
    if (this._onKeyDownAltD) window.removeEventListener('keydown', this._onKeyDownAltD);
    if (this._onKeyDownEsc) window.removeEventListener('keydown', this._onKeyDownEsc);
    if (this._unsubSideload) {
      this._unsubSideload();
      this._unsubSideload = null;
    }
    if (this._unsubAi) this._unsubAi();
    if (this._abort) this._abort.abort();
  }

  _openWithQuestion(prompt: string, autoSubmit = true) {
    if (this._isDocked) {
      const mountEl = document.getElementById('ai-sidebar-panel');
      if (mountEl && this.parentElement !== mountEl) {
        mountEl.appendChild(this);
      }
      if (this._panel) {
        this._panel.classList.add('ask-open');
      }
      sideloadManager.open('ai');
    } else {
      this._openPanel();
    }
    this._startNewThread();
    if (this._input) {
      this._input.value = prompt;
      this._grow();
      if (autoSubmit) {
        setTimeout(() => this._ask(), 80);
      }
    }
    requestAnimationFrame(() => {
      this._scrollThread();
      this._input && this._input.focus({ preventScroll: true });
    });
  }

  _initDom() {
    const cfg = getConfig(this);
    this._config = cfg;
    this._bookTitle = this.getAttribute('data-book-title') || this.getAttribute('data-book') || '本书';

    this._panel = this.querySelector('.ask-panel') as HTMLElement;
    this._fab = this.querySelector('.ask-fab') as HTMLElement;
    this._close = this.querySelector('.ask-close') as HTMLElement;
    this._settingsBtn = this.querySelector('.ask-settings-btn') as HTMLElement;
    this._collapseBtn = this.querySelector('.ask-collapse-tools-btn') as HTMLElement;
    this._dockBtn = this.querySelector('.ask-dock-btn') as HTMLElement;
    this._dockIcon = this.querySelector('.icon-dock-to-sidebar') as HTMLElement;
    this._undockIcon = this.querySelector('.icon-undock-from-sidebar') as HTMLElement;
    this._sideloadBackBtn = this.querySelector('.ai-sideload-back-btn') as HTMLElement;
    this._contextRow = (this.querySelector('#ask-context-row') || this.querySelector('#ask-context-container')) as HTMLElement;
    this._contextContainer = this._contextRow;
    this._contextText = (this.querySelector('#ask-context-text') || this.querySelector('#ask-chapter-chip-text')) as HTMLElement;
    this._chapterChipText = this._contextText;
    this._contextExpandBtn = this.querySelector('#ask-context-expand-btn') as HTMLButtonElement;
    this._contextRemoveBtn = (this.querySelector('#ask-context-remove-btn') || this.querySelector('#ask-chapter-chip-close')) as HTMLButtonElement;
    this._chapterChipClose = this._contextRemoveBtn;
    this._contextDropdown = this.querySelector('#ask-context-dropdown') as HTMLElement;
    this._contextItemsList = this.querySelector('#ask-context-items-list') as HTMLElement;

    if (this._contextRemoveBtn) {
      this._contextRemoveBtn.addEventListener('click', (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        this._disableChapterReference();
      });
    }

    if (this._contextExpandBtn) {
      this._contextExpandBtn.addEventListener('click', (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        this._toggleContextDropdown();
      });
    }

    // 章节多选选择器 Popover 元素与交互
    this._addChapterBtn = this.querySelector('#ask-add-chapter-btn') as HTMLButtonElement;
    this._chapterPickerPopover = this.querySelector('#ask-chapter-picker-popover') as HTMLElement;
    this._chapterSearchInput = this.querySelector('#ask-chapter-search-input') as HTMLInputElement;
    this._chapterPickerClose = this.querySelector('#ask-chapter-picker-close') as HTMLButtonElement;
    this._chapterPickerList = this.querySelector('#ask-chapter-picker-list') as HTMLElement;
    this._chapterPickerCount = this.querySelector('#ask-chapter-picker-count') as HTMLElement;
    this._chapterPickerDone = this.querySelector('#ask-chapter-picker-done') as HTMLButtonElement;

    if (this._addChapterBtn) {
      this._addChapterBtn.addEventListener('click', (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (this._chapterPickerPopover && this._chapterPickerPopover.style.display !== 'none') {
          this._closeChapterPicker();
        } else {
          this._openChapterPicker();
        }
      });
    }

    if (this._chapterPickerClose) {
      this._chapterPickerClose.addEventListener('click', (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        this._closeChapterPicker();
      });
    }

    if (this._chapterPickerDone) {
      this._chapterPickerDone.addEventListener('click', (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        this._closeChapterPicker();
      });
    }

    if (this._chapterSearchInput) {
      this._chapterSearchInput.addEventListener('input', () => {
        this._filterChapterPicker(this._chapterSearchInput.value.trim());
      });
    }

    // 模型快捷切换 Popover 菜单与药丸按钮
    this._modelPillBtn = this.querySelector('#ask-model-pill-btn') as HTMLButtonElement;
    this._modelPillName = this.querySelector('#ask-model-pill-name') as HTMLElement;
    this._modelMenu = this.querySelector('#ask-model-menu') as HTMLElement;
    this._thinkingSwitch = this.querySelector('#ask-thinking-switch') as HTMLInputElement;
    this._collapseToolsSwitch = this.querySelector('#ask-collapse-tools-switch') as HTMLInputElement;
    this._modelExtraItem = this.querySelector('#ask-model-extra-item') as HTMLElement;
    this._modelExtraHeadline = this.querySelector('#ask-model-extra-headline') as HTMLElement;
    this._modelExtraSupport = this.querySelector('#ask-model-extra-support') as HTMLElement;

    if (this._modelPillBtn) {
      this._modelPillBtn.addEventListener('click', (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (this._modelMenu && this._modelMenu.style.display !== 'none') {
          this._closeModelMenu();
        } else {
          this._openModelMenu();
        }
      });
    }

    this._initModelMenu();
    this._updateModelPill();

    this._newBtn = this.querySelector('.ask-new-btn') as HTMLElement;
    this._submit = (this.querySelector('.ask-send-btn') || this.querySelector('.ask-send')) as HTMLButtonElement;
    this._sendIcon = this.querySelector('.ask-send-icon') as HTMLElement;
    this._stopIcon = this.querySelector('.ask-stop-icon') as HTMLElement;
    this._input = this.querySelector('.ask-input') as HTMLTextAreaElement;
    this._status = this.querySelector('.ask-status') as HTMLElement;
    this._thread = this.querySelector('.ask-thread') as HTMLElement;
    this._empty = this.querySelector('.ask-empty') as HTMLElement;
    this._messages = this.querySelector('.ask-messages') as HTMLElement;
    this._bookEl = this.querySelector('.ask-book') as HTMLElement;

    // Apply saved panel dimensions if present
    const dims = getAiPanelDimensions();
    if (this._panel) {
      if (dims.width) this._panel.style.setProperty('--ask-panel-width', `${dims.width}px`);
      if (dims.height) this._panel.style.setProperty('--ask-panel-height', `${dims.height}px`);
    }

    this._initResizeHandles();

    if (this._messages) {
      this._messages.addEventListener('click', (e: MouseEvent) => {
        // 工具面板 Tab 切换 (结果 / 参数)
        const tabBtn = (e.target as HTMLElement).closest('.ask-tool-tab');
        if (tabBtn) {
          e.preventDefault();
          const panel = tabBtn.closest('.ask-tool-panel');
          if (!panel) return;
          const targetTab = tabBtn.getAttribute('data-tab');
          panel.querySelectorAll('.ask-tool-tab').forEach((b) => {
            b.classList.remove('active');
            b.setAttribute('aria-selected', 'false');
          });
          tabBtn.classList.add('active');
          tabBtn.setAttribute('aria-selected', 'true');
          const paneResult = panel.querySelector('.ask-tool-pane-result') as HTMLElement;
          const paneArgs = panel.querySelector('.ask-tool-pane-args') as HTMLElement;
          if (targetTab === 'result') {
            if (paneResult) paneResult.style.display = '';
            if (paneArgs) paneArgs.style.display = 'none';
          } else {
            if (paneResult) paneResult.style.display = 'none';
            if (paneArgs) paneArgs.style.display = '';
          }
          return;
        }

        // 工具数据复制
        const copyBtn = (e.target as HTMLElement).closest('.ask-tool-copy-btn');
        if (copyBtn) {
          e.preventDefault();
          const panel = copyBtn.closest('.ask-tool-panel');
          if (!panel) return;
          const activePane = panel.querySelector<HTMLElement>('.ask-tool-pane:not([style*="display: none"]):not([style*="display:none"]) pre');
          const text = activePane ? activePane.textContent || '' : '';
          if (text) {
            navigator.clipboard.writeText(text).then(() => {
              const label = copyBtn.querySelector('.ask-tool-copy-text');
              if (label) {
                const orig = label.textContent;
                label.textContent = '已复制';
                setTimeout(() => { label.textContent = orig; }, 1500);
              }
            }).catch(() => {});
          }
          return;
        }

        // 错误卡片重试
        const retryBtn = (e.target as HTMLElement).closest('.ask-error-retry-btn');
        if (retryBtn) {
          e.preventDefault();
          this._retryLast();
          return;
        }

        // 错误卡片打开快速设置调整模型
        const settingsTrigger = (e.target as HTMLElement).closest('.ask-error-settings-btn');
        if (settingsTrigger) {
          e.preventDefault();
          window.dispatchEvent(new CustomEvent('astrolib:open-settings', { detail: { section: 'ai' } }));
          return;
        }

        // 错误卡片完整日志复制
        const copyErrBtn = (e.target as HTMLElement).closest('.ask-error-copy-btn');
        if (copyErrBtn) {
          e.preventDefault();
          const card = copyErrBtn.closest('.ask-error-card');
          const pre = card?.querySelector('.ask-error-raw-pre code');
          const text = pre ? pre.textContent || '' : '';
          if (text) {
            navigator.clipboard.writeText(text).then(() => {
              const label = copyErrBtn.querySelector('.ask-copy-label');
              if (label) {
                const orig = label.textContent;
                label.textContent = '已复制';
                setTimeout(() => { label.textContent = orig; }, 1500);
              }
            }).catch(() => {});
          }
          return;
        }

        const target = (e.target as HTMLElement).closest('a');
        if (!target || !target.href) return;
        const rawHref = target.getAttribute('href') || '';
        if (!rawHref || rawHref.startsWith('javascript:')) return;

        if (target.target === '_blank') return;

        try {
          const url = new URL(target.href, location.href);
          if (url.origin === location.origin) {
            const currentPath = location.pathname.replace(/\/$/, '');
            const targetPath = url.pathname.replace(/\/$/, '');
            const hash = url.hash ? decodeURIComponent(url.hash.slice(1)) : '';

            if (currentPath === targetPath && hash) {
              e.preventDefault();
              const el = document.getElementById(hash) || document.querySelector(`[id="${CSS.escape(hash)}"]`);
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              } else {
                location.hash = url.hash;
              }
            }
          }
        } catch {}
      });
    }

    this._historyBtn = this.querySelector('.ask-history-btn') as HTMLElement;
    this._history = this.querySelector('.ask-history') as HTMLElement;
    this._historyList = this.querySelector('.ask-history-list') as HTMLElement;
    this._historyEmpty = this.querySelector('.ask-history-empty') as HTMLElement;
    this._historyNew = this.querySelector('.ask-history-new') as HTMLElement;
    this._historyClose = this.querySelector('.ask-history-close') as HTMLElement;

    if (this._historyBtn) {
      this._historyBtn.addEventListener('click', (e) => { e.stopPropagation(); this._toggleHistory(); });
    }
    if (this._historyNew) {
      this._historyNew.addEventListener('click', () => this._startNewThread());
    }
    if (this._historyClose) {
      this._historyClose.addEventListener('click', () => this._closeHistory());
    }
    if (this._collapseBtn) {
      this._collapseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this._togglePrecedingCollapse();
      });
    }
    if (this._newBtn) {
      this._newBtn.addEventListener('click', () => this._startNewThread());
    }
    if (this._dockBtn) {
      this._dockBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleDock();
      });
    }
    if (this._sideloadBackBtn) {
      this._sideloadBackBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.undockFromSidebar(true);
      });
    }

    this._setBookTitle(this._bookTitle);

    if (this._fab) {
      this._fab.addEventListener('click', () => {
        if (this._panel && this._panel.classList.contains('ask-open')) this._closePanel();
        else this._openPanel();
      });
    }
    if (this._close) this._close.addEventListener('click', () => this._closePanel());

    // Settings trigger dispatches global event to open quick settings AI panel
    if (this._settingsBtn) {
      this._settingsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        window.dispatchEvent(new CustomEvent('astrolib:open-settings', { detail: { section: 'ai' } }));
      });
    }

    if (this._input) {
      this._input.addEventListener('input', () => {
        this._grow();
        const val = this._input.value;
        if (val.endsWith('@') || /(?:^|\s)@$/.test(val)) {
          this._openChapterPicker();
        }
      });
      this._input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          if (this._streaming) {
            if (this._abort) this._abort.abort();
          } else {
            this._ask();
          }
        }
      });
    }
    if (this._submit) {
      this._submit.addEventListener('click', () => {
        if (this._streaming) {
          if (this._abort) this._abort.abort();
        } else {
          this._ask();
        }
      });
    }

    const sugg = this.querySelector('.ask-suggest');
    if (sugg) {
      sugg.innerHTML = '';
      for (const s of SUGGESTIONS) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'ask-suggest-chip';
        b.textContent = s;
        b.addEventListener('click', () => {
          if (this._input) {
            this._input.value = s;
            this._grow();
            this._ask();
          }
        });
        sugg.appendChild(b);
      }
    }
    this._grow();
  }

  _initResizeHandles() {
    if (!this._panel) return;
    initChatResizer(this._panel);
  }

  _setBookTitle(t: string) {
    this._bookTitle = t || '本书';
    if (this._bookEl) this._bookEl.textContent = this._bookTitle;
  }

  _getCurrentChapterInfo(): { title: string; url: string; text: string } {
    const h1 = document.querySelector('.main-pane h1, main h1, #starlight-content-title');
    let title = h1?.textContent?.trim() || '';
    if (!title) {
      title = document.title.split(' - ')[0]?.trim() || '本章节';
    }
    const url = typeof window !== 'undefined' ? window.location.pathname : '';

    let text = '';
    const article = document.querySelector('.main-pane article, .main-pane main, main');
    if (article) {
      const clone = article.cloneNode(true) as HTMLElement;
      clone.querySelectorAll('script, style, .print\\:hidden, button, .ex-card-actions, md-icon').forEach((el) => el.remove());
      text = (clone.innerText || clone.textContent || '').replace(/\s+/g, ' ').trim();
    }
    return { title, url, text };
  }

  _enableChapterReference() {
    this._refCurrentChapter = true;
    const cur = this._getCurrentChapterInfo();
    if (cur.title && !this._referencedChapters.some((c) => c.url === cur.url)) {
      this._referencedChapters.push({ ...cur, isCurrent: true });
    }
    this._updateContextRow();
  }

  _disableChapterReference() {
    this._refCurrentChapter = false;
    this._referencedChapters = [];
    this._updateContextRow();
  }

  _removeReferencedChapter(url: string) {
    this._referencedChapters = this._referencedChapters.filter((c) => c.url !== url);
    const curUrl = typeof window !== 'undefined' ? window.location.pathname : '';
    if (url === curUrl) {
      this._refCurrentChapter = false;
    }
    this._updateContextRow();
    this._updateChapterPickerCount();
    if (this._chapterPickerList) {
      const items = this._chapterPickerList.querySelectorAll<HTMLElement>('.ask-chapter-picker-item');
      items.forEach((item) => {
        if (item.getAttribute('data-url') === url) {
          const cb = item.querySelector<HTMLInputElement>('.ask-chapter-picker-checkbox');
          if (cb) cb.checked = false;
        }
      });
    }
  }

  _toggleContextDropdown() {
    if (!this._contextDropdown) return;
    const isOpen = this._contextDropdown.style.display !== 'none';
    this._contextDropdown.style.display = isOpen ? 'none' : 'block';
    if (this._contextExpandBtn) {
      this._contextExpandBtn.classList.toggle('is-expanded', !isOpen);
      this._contextExpandBtn.setAttribute('aria-expanded', String(!isOpen));
    }
  }

  _updateContextRow() {
    if (!this._contextRow) return;

    if (this._referencedChapters.length === 0) {
      this._contextRow.style.display = 'none';
      if (this._contextDropdown) this._contextDropdown.style.display = 'none';
      if (this._contextExpandBtn) {
        this._contextExpandBtn.classList.remove('is-expanded');
        this._contextExpandBtn.setAttribute('aria-expanded', 'false');
      }
      return;
    }

    this._contextRow.style.display = 'flex';

    if (this._referencedChapters.length === 1) {
      const ch = this._referencedChapters[0];
      if (this._contextText) {
        this._contextText.textContent = `正在引用“${ch.title}”`;
        this._contextText.title = `正在引用章节：${ch.title}`;
      }
      if (this._contextExpandBtn) this._contextExpandBtn.style.display = 'none';
      if (this._contextDropdown) this._contextDropdown.style.display = 'none';
    } else {
      if (this._contextText) {
        this._contextText.textContent = `正在引用 ${this._referencedChapters.length} 个章节`;
        this._contextText.title = `正在引用：${this._referencedChapters.map((c) => c.title).join('、')}`;
      }
      if (this._contextExpandBtn) this._contextExpandBtn.style.display = 'inline-flex';
      this._renderContextDropdownList();
    }
  }

  _renderContextDropdownList() {
    if (!this._contextItemsList) return;
    this._contextItemsList.innerHTML = '';
    this._referencedChapters.forEach((ch) => {
      const li = document.createElement('li');
      li.className = 'ask-context-item';

      const titleSpan = document.createElement('span');
      titleSpan.className = 'ask-context-item-title';
      titleSpan.textContent = ch.title;
      titleSpan.title = ch.title;

      const rmBtn = document.createElement('button');
      rmBtn.type = 'button';
      rmBtn.className = 'ask-context-item-remove';
      rmBtn.title = `取消引用《${ch.title}》`;
      rmBtn.setAttribute('aria-label', `取消引用《${ch.title}》`);
      rmBtn.innerHTML = '<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" aria-hidden="true"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>';
      rmBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this._removeReferencedChapter(ch.url);
      });

      li.appendChild(titleSpan);
      li.appendChild(rmBtn);
      this._contextItemsList.appendChild(li);
    });
  }

  _updateChapterContextChip() {
    this._updateContextRow();
  }

  _extractBookChapters(): Array<{ title: string; url: string }> {
    if (this._bookChaptersCache && this._bookChaptersCache.length > 0) {
      return this._bookChaptersCache;
    }

    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
    const match = currentPath.match(/\/collections\/([^/]+)\/([^/]+)/);
    const bookPrefix = match ? `/collections/${match[1]}/${match[2]}/` : '';

    const links = document.querySelectorAll<HTMLAnchorElement>(
      '#starlight__sidebar a[href], nav.sidebar a[href], aside.sidebar a[href], .custom-sidebar-sublist a[href]'
    );

    const chapters: Array<{ title: string; url: string }> = [];
    const seen = new Set<string>();

    links.forEach((a) => {
      const href = a.getAttribute('href') || '';
      if (!href) return;
      if (bookPrefix && !href.includes(bookPrefix)) return;
      const cleanUrl = href.split('#')[0].split('?')[0];
      if (seen.has(cleanUrl)) return;
      seen.add(cleanUrl);
      const text = (a.textContent || '').trim().replace(/\s+/g, ' ');
      if (text && !text.includes('EPUB') && !text.includes('真题') && !text.includes('习题')) {
        chapters.push({ title: text, url: cleanUrl });
      }
    });

    if (chapters.length === 0) {
      const cur = this._getCurrentChapterInfo();
      if (cur.title && cur.url) {
        chapters.push({ title: cur.title, url: cur.url });
      }
    }

    this._bookChaptersCache = chapters;
    return chapters;
  }

  _openChapterPicker() {
    this._closeModelMenu();
    if (!this._chapterPickerPopover) return;
    this._chapterPickerPopover.style.display = 'flex';
    this._renderChapterPickerList();
    if (this._chapterSearchInput) {
      this._chapterSearchInput.value = '';
      this._chapterSearchInput.focus();
    }
  }

  _closeChapterPicker() {
    if (!this._chapterPickerPopover) return;
    this._chapterPickerPopover.style.display = 'none';
    if (this._input) {
      this._input.value = this._input.value.replace(/@\s*$/, '');
      this._grow();
      this._input.focus();
    }
  }

  _renderChapterPickerList() {
    if (!this._chapterPickerList) return;
    const chapters = this._extractBookChapters();
    this._chapterPickerList.innerHTML = '';

    chapters.forEach((ch) => {
      const isChecked = this._referencedChapters.some((c) => c.url === ch.url);

      const li = document.createElement('li');
      li.className = 'ask-chapter-picker-item';
      li.setAttribute('data-url', ch.url);

      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.className = 'ask-chapter-picker-checkbox';
      cb.checked = isChecked;

      const span = document.createElement('span');
      span.className = 'ask-chapter-picker-label';
      span.textContent = ch.title;
      span.title = ch.title;

      const toggleCheck = () => {
        cb.checked = !cb.checked;
        if (cb.checked) {
          if (!this._referencedChapters.some((c) => c.url === ch.url)) {
            const item: ReferencedChapter = { title: ch.title, url: ch.url };
            const cur = typeof window !== 'undefined' ? window.location.pathname : '';
            if (ch.url === cur) {
              item.isCurrent = true;
              item.text = this._getCurrentChapterInfo().text;
              this._refCurrentChapter = true;
            } else {
              this._prefetchChapterText(ch.url).then((t) => { item.text = t; });
            }
            this._referencedChapters.push(item);
          }
        } else {
          this._removeReferencedChapter(ch.url);
        }
        this._updateChapterPickerCount();
        this._updateContextRow();
      };

      cb.addEventListener('change', (e) => {
        e.stopPropagation();
        if (cb.checked) {
          if (!this._referencedChapters.some((c) => c.url === ch.url)) {
            const item: ReferencedChapter = { title: ch.title, url: ch.url };
            const cur = typeof window !== 'undefined' ? window.location.pathname : '';
            if (ch.url === cur) {
              item.isCurrent = true;
              item.text = this._getCurrentChapterInfo().text;
              this._refCurrentChapter = true;
            } else {
              this._prefetchChapterText(ch.url).then((t) => { item.text = t; });
            }
            this._referencedChapters.push(item);
          }
        } else {
          this._removeReferencedChapter(ch.url);
        }
        this._updateChapterPickerCount();
        this._updateContextRow();
      });

      li.addEventListener('click', (e) => {
        if (e.target !== cb) {
          toggleCheck();
        }
      });

      li.appendChild(cb);
      li.appendChild(span);
      this._chapterPickerList.appendChild(li);
    });

    this._updateChapterPickerCount();
  }

  _filterChapterPicker(kw: string) {
    if (!this._chapterPickerList) return;
    const items = this._chapterPickerList.querySelectorAll<HTMLElement>('.ask-chapter-picker-item');
    const lower = kw.toLowerCase();
    items.forEach((item) => {
      const text = item.textContent?.toLowerCase() || '';
      item.style.display = text.includes(lower) ? '' : 'none';
    });
  }

  _updateChapterPickerCount() {
    if (this._chapterPickerCount) {
      this._chapterPickerCount.textContent = `已选 ${this._referencedChapters.length} 章`;
    }
  }

  async _prefetchChapterText(url: string): Promise<string> {
    if (this._chapterTextCache.has(url)) {
      return this._chapterTextCache.get(url)!;
    }
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
    if (url === currentPath) {
      const cur = this._getCurrentChapterInfo();
      const p = Promise.resolve(cur.text);
      this._chapterTextCache.set(url, p);
      return p;
    }
    const promise = (async () => {
      try {
        const res = await fetch(url);
        if (!res.ok) return '';
        const html = await res.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const article = doc.querySelector('.main-pane article, .main-pane main, main');
        if (article) {
          article.querySelectorAll('script, style, .print\\:hidden, button, .ex-card-actions, md-icon').forEach((el) => el.remove());
          return (article.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 4000);
        }
      } catch {
        // ignore
      }
      return '';
    })();
    this._chapterTextCache.set(url, promise);
    return promise;
  }

  _initModelMenu() {
    if (!this._modelMenu) return;

    this._modelMenu.querySelectorAll<HTMLButtonElement>('.ask-model-menu-item').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const modelId = btn.getAttribute('data-model-id');
        if (modelId) {
          saveAiActiveModel(modelId);
          this._updateModelPill();
          this._closeModelMenu();
        }
      });
    });

    if (this._thinkingSwitch) {
      this._thinkingSwitch.checked = getAiExtendedThinking();
      this._thinkingSwitch.addEventListener('change', () => {
        saveAiExtendedThinking(this._thinkingSwitch.checked);
      });
    }

    if (this._collapseToolsSwitch) {
      this._collapseToolsSwitch.checked = getAiCollapseToolsSummary();
      this._collapseToolsSwitch.addEventListener('change', () => {
        saveAiCollapseToolsSummary(this._collapseToolsSwitch.checked);
      });
    }
  }

  _openModelMenu() {
    this._closeChapterPicker();
    if (!this._modelMenu) return;
    this._modelMenu.style.display = 'block';
    if (this._modelPillBtn) {
      this._modelPillBtn.setAttribute('aria-expanded', 'true');
    }

    const activeId = getActiveAiModelId();

    let matchedPreset = false;
    this._modelMenu.querySelectorAll<HTMLButtonElement>('.ask-model-menu-item:not(.ask-model-extra-item)').forEach((btn) => {
      const mid = btn.getAttribute('data-model-id');
      const isActive = mid === activeId;
      btn.classList.toggle('is-active', isActive);
      if (isActive) matchedPreset = true;
    });

    if (this._modelExtraItem) {
      if (!matchedPreset && activeId) {
        this._modelExtraItem.style.display = 'flex';
        this._modelExtraItem.classList.add('is-active');
        this._modelExtraItem.setAttribute('data-model-id', activeId);
        if (this._modelExtraHeadline) this._modelExtraHeadline.textContent = getShortModelLabel(activeId);
        if (this._modelExtraSupport) this._modelExtraSupport.textContent = '当前激活模型';
      } else {
        this._modelExtraItem.style.display = 'none';
        this._modelExtraItem.classList.remove('is-active');
      }
    }

    if (this._thinkingSwitch) {
      this._thinkingSwitch.checked = getAiExtendedThinking();
    }

    if (this._collapseToolsSwitch) {
      this._collapseToolsSwitch.checked = getAiCollapseToolsSummary();
    }
  }

  _closeModelMenu() {
    if (!this._modelMenu) return;
    this._modelMenu.style.display = 'none';
    if (this._modelPillBtn) {
      this._modelPillBtn.setAttribute('aria-expanded', 'false');
    }
  }

  _updateModelPill() {
    if (this._modelPillName) {
      this._modelPillName.textContent = getShortModelLabel();
    }
  }

  toggleDock() {
    if (this._isDocked) {
      this.undockFromSidebar(true);
    } else {
      this.dockToSidebar();
    }
  }

  dockToSidebar(immediate = false) {
    if (typeof window === 'undefined') return;
    const mountEl = document.getElementById('ai-sidebar-panel');
    if (!mountEl) {
      console.warn('[AIAsk] 未找到右侧栏挂载点 #ai-sidebar-panel');
      return;
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const performDock = () => {
      if (!this._originalParent || this._originalParent === mountEl || this._originalParent.id === 'ai-sidebar-panel') {
        const overlayRoot = document.getElementById('astro-overlay-root') || document.getElementById('astrolib-overlay-root') || document.body;
        this._originalParent = this.parentElement && this.parentElement !== mountEl ? (this.parentElement as HTMLElement) : overlayRoot;
        this._originalNextSibling = this.nextSibling;
      }

      this._isDocked = true;
      try { localStorage.setItem(DOCKED_STORAGE_KEY, 'true'); } catch {}

      // 移动整个 ai-ask 元素至右侧栏侧载面板
      mountEl.appendChild(this);
      mountEl.setAttribute('aria-hidden', 'false');
      this.classList.add('is-docked');
      if (!immediate) {
        this.classList.add('docking-in');
      } else {
        this.classList.remove('docking-in');
      }
      if (this._panel) {
        this._panel.classList.remove('docking-out', 'dock-settled');
        this._panel.classList.add('is-docked');
        this._panel.classList.add('ask-open');
      }

      // 更新按钮状态
      if (this._dockBtn) {
        this._dockBtn.title = '从侧边栏返回浮窗 (Alt+D)';
        this._dockBtn.setAttribute('aria-label', '从侧边栏返回浮窗');
      }
      if (this._dockIcon) this._dockIcon.style.display = 'none';
      if (this._undockIcon) this._undockIcon.style.display = '';
      if (this._sideloadBackBtn) this._sideloadBackBtn.style.display = 'inline-flex';

      // 隐藏 FAB 悬浮球 (同时设置 inline style !important 与 hidden 属性)
      if (this._fab) {
        this._fab.style.setProperty('display', 'none', 'important');
        this._fab.setAttribute('hidden', '');
      }

      // 驱动侧载状态机
      sideloadManager.open('ai');

      // 若开启了“侧载默认引用本章”，自动激活引用 Chip
      if (getAiSideloadRefChapter()) {
        this._enableChapterReference();
      } else {
        this._disableChapterReference();
      }

      // 清除动画 class
      if (!immediate) {
        setTimeout(() => {
          this.classList.remove('docking-in');
        }, 280);
      } else {
        this.classList.remove('docking-in');
      }

      // 维持滚动与焦点
      requestAnimationFrame(() => {
        this._scrollThread();
        this._input && this._input.focus({ preventScroll: true });
      });
    };

    // 若当前浮窗处于展开可见状态且未开启减弱动效，先播放离开淡出动效
    if (!immediate && !prefersReducedMotion && this._panel && this._panel.classList.contains('ask-open')) {
      this._panel.classList.add('docking-out');
      setTimeout(performDock, 130);
    } else {
      performDock();
    }
  }

  undockFromSidebar(keepOpen = true) {
    if (typeof window === 'undefined') return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const performUndock = () => {
      // 1. 先恢复侧载默认视图（大纲），使 data-sideload-active 与 --sl-sideload-width 立即同步就绪
      sideloadManager.switchToDefault();
      // 2. 执行浮窗 DOM 挂载回退与状态恢复
      this._undockInternal(keepOpen);
    };

    if (!prefersReducedMotion && this._panel && this._isDocked) {
      this.classList.add('docking-out');
      setTimeout(performUndock, 110);
    } else {
      performUndock();
    }
  }

  _undockInternal(keepOpen = true) {
    if (!this._isDocked) return;
    this._isDocked = false;
    this._disableChapterReference();
    try { localStorage.setItem(DOCKED_STORAGE_KEY, 'false'); } catch {}

    this.classList.remove('is-docked', 'docking-out');
    if (this._panel) {
      this._panel.classList.remove('is-docked', 'docking-out');
    }

    const mountEl = document.getElementById('ai-sidebar-panel');
    if (mountEl) {
      mountEl.setAttribute('aria-hidden', 'true');
    }

    // 将整个 ai-ask 移回原始容器 (如 #astro-overlay-root)
    let targetParent = this._originalParent;
    if (!targetParent || (mountEl && targetParent === mountEl) || targetParent.id === 'ai-sidebar-panel' || !document.body.contains(targetParent)) {
      targetParent = document.getElementById('astro-overlay-root') || document.getElementById('astrolib-overlay-root') || document.body;
    }
    if (this._originalNextSibling && this._originalNextSibling.parentElement === targetParent) {
      targetParent.insertBefore(this, this._originalNextSibling);
    } else {
      targetParent.appendChild(this);
    }

    // 恢复 FAB 悬浮球显现 (仅主动退出侧载时播放微缩放恢复动效)
    if (this._fab) {
      this._fab.style.removeProperty('display');
      this._fab.removeAttribute('hidden');
      this._fab.classList.add('fab-restoring');
      setTimeout(() => {
        this._fab && this._fab.classList.remove('fab-restoring');
      }, 240);
    }

    // 更新按钮状态
    if (this._dockBtn) {
      this._dockBtn.title = '前往侧边栏 (Alt+D)';
      this._dockBtn.setAttribute('aria-label', '前往侧边栏');
    }
    if (this._dockIcon) this._dockIcon.style.display = '';
    if (this._undockIcon) this._undockIcon.style.display = 'none';
    if (this._sideloadBackBtn) this._sideloadBackBtn.style.display = 'none';

    if (keepOpen) {
      this._panel.classList.remove('dock-settled');
      this._panel.classList.add('ask-open', 'docking-in');

      let settled = false;
      const settleDock = () => {
        if (settled) return;
        settled = true;
        if (this._panel) {
          this._panel.removeEventListener('animationend', settleDock);
          this._panel.classList.remove('docking-in');
          this._panel.classList.add('dock-settled');
        }
      };

      this._panel.addEventListener('animationend', settleDock, { once: true });
      // 兜底定时器：在 250ms 入场动效结束后强制切换为静止就绪态，彻底防止二次动画触发
      setTimeout(settleDock, 260);

      requestAnimationFrame(() => {
        this._input && this._input.focus({ preventScroll: true });
      });
    } else {
      this._panel.classList.remove('ask-open', 'dock-settled', 'docking-in');
      this._history && this._history.classList.remove('open');
      this._historyBtn && this._historyBtn.classList.remove('ask-settings-open');
    }
    requestAnimationFrame(() => this._scrollThread());
  }

  _openPanel() {
    if (this._isDocked) {
      sideloadManager.open('ai');
      requestAnimationFrame(() => {
        this._input && this._input.focus({ preventScroll: true });
      });
      return;
    }
    this._panel.classList.remove('dock-settled', 'docking-in');
    this._panel.classList.add('ask-open');
    requestAnimationFrame(() => {
      this._input && this._input.focus({ preventScroll: true });
    });
    requestAnimationFrame(() => this._scrollThread());
  }
  _closePanel() {
    if (this._isDocked) {
      sideloadManager.switchToDefault();
      this._undockInternal(false);
      return;
    }
    this._panel.classList.remove('ask-open', 'dock-settled', 'docking-in');
    this._history && this._history.classList.remove('open');
    this._historyBtn && this._historyBtn.classList.remove('ask-settings-open');
  }
  _toggleHistory() {
    const open = this._history.classList.toggle('open');
    this._historyBtn && this._historyBtn.classList.toggle('ask-settings-open', open);
    if (open) {
      this._renderHistoryList();
    }
  }
  _closeHistory() {
    this._history && this._history.classList.remove('open');
    this._historyBtn && this._historyBtn.classList.remove('ask-settings-open');
  }

  _route() {
    const m = location.pathname.match(/^\/collections\/([^/]+)\/([^/]+)\//);
    if (!m) {
      this.hidden = true;
      this._closePanel();
      return;
    }
    this.hidden = false;
    const changed = this._col !== m[1] || this._book !== m[2];
    this._col = m[1];
    this._book = m[2];
    if (changed) this._resetThread();
    const cached = this._indexCache.get(this._bookKey());
    if (cached && cached.meta && cached.meta.title) this._setBookTitle(cached.meta.title);
    else this._setBookTitle(this.getAttribute('data-book-title') || m[2]);

    // 路由切换时，重置章节缓存；若处于侧载且引用激活，更新当前章节引用
    this._bookChaptersCache = null;
    if (this._isDocked && this._refCurrentChapter) {
      const cur = this._getCurrentChapterInfo();
      const idx = this._referencedChapters.findIndex((c) => c.isCurrent);
      if (idx !== -1) {
        this._referencedChapters[idx] = { ...cur, isCurrent: true };
      } else {
        this._referencedChapters.unshift({ ...cur, isCurrent: true });
      }
      this._updateContextRow();
    }

    // 探测并平滑恢复侧载停靠态
    if (typeof localStorage !== 'undefined' && localStorage.getItem(DOCKED_STORAGE_KEY) === 'true') {
      const mountEl = document.getElementById('ai-sidebar-panel');
      if (mountEl) {
        requestAnimationFrame(() => {
          this.dockToSidebar(true);
        });
      }
    }
  }

  _resetThread() {
    if (this._abort) this._abort.abort();
    this._abort = null;
    this._busy = false;
    this._streaming = false;
    this._activeThread = null;
    this._threads = null;
    if (this._messages) this._messages.innerHTML = '';
    if (this._empty) this._empty.style.display = '';
    if (this._messages) this._messages.style.display = 'none';
    if (this._input) this._input.value = '';
    if (this._status) this._status.textContent = '';
    this._grow();
    this._updateSendState();
    this._restoreBookThread();
  }

  _bookKey() { return `${this._col}-${this._book}`; }

  _threadsKey() { return this._threadStore.getThreadsKey(); }
  _activeKey() { return this._threadStore.getActiveKey(); }

  _loadThreads(): any[] {
    return this._threadStore.loadThreads();
  }
  _saveThreads(threads: any[]) {
    this._threadStore.saveThreads(threads);
  }
  _saveActiveThreadId(id: string) {
    this._threadStore.saveActiveThreadId(id);
  }
  _newThread() {
    return this._threadStore.newThread();
  }

  _restoreBookThread() {
    this._threadStore.setBookKey(this._bookKey());
    const { threads, activeThread } = this._threadStore.restoreBookThread();
    this._threads = threads;
    this._activeThread = activeThread;
    this._renderThread(activeThread);
  }

  _ensureActiveThread() {
    if (this._activeThread) return this._activeThread;
    const t = this._newThread();
    if (!this._threads) this._threads = this._loadThreads();
    this._threads.push(t);
    this._activeThread = t;
    this._saveActiveThread();
    return t;
  }

  _renderThread(t: any) {
    const msgs = (t && t.messages) || [];
    if (this._messages) this._messages.innerHTML = '';
    if (!msgs.length) {
      if (this._messages) this._messages.style.display = 'none';
      if (this._empty) this._empty.style.display = '';
      return;
    }
    this._hideEmpty();
    for (const m of msgs) {
      const body: any = { text: m.text, chapterTitle: m.chapterTitle };
      this._addMessage(m.role, body);
      if (m.role === 'assistant') {
        const segs = (m.segments && m.segments.length)
          ? m.segments
          : [
              ...(m.text ? [{ kind: 'reply', text: m.text }] : []),
              ...(m.tools || []).map((t: any) => ({ kind: 'tool', name: t.name, args: t.args, summary: t.summary, resultText: t.resultText })),
            ];
        const decorate = !!(m.sources && m.sources.length);
        let currentToolGroup: any[] = [];
        const flushToolGroup = () => {
          if (!currentToolGroup.length) return;
          const shouldOpen = !getAiCollapseToolsSummary();
          body.blocksEl.insertAdjacentHTML('beforeend', this._toolsGroupHtml(currentToolGroup, shouldOpen));
          currentToolGroup = [];
        };

        for (const seg of segs) {
          if (seg.kind === 'tool') {
            currentToolGroup.push(seg);
          } else {
            flushToolGroup();
            if (seg.kind === 'reply') {
              if (!seg.text || !seg.text.trim()) continue;
              this._appendMdBlock(body.blocksEl, seg.text, decorate);
            } else if (seg.kind === 'error') {
              body.blocksEl.insertAdjacentHTML('beforeend', seg.html || (seg.errorInfo ? renderErrorCardHtml(seg.errorInfo) : ''));
            }
          }
        }
        flushToolGroup();
        if (m.sources && m.sources.length) this._renderSources(body.sourcesEl, m.sources.map((s: any) => ({ chunk: s })));
      }
    }
    if (getAiAutoCollapsePreceding()) {
      this._collapsePreceding(true);
    } else {
      this._isPrecedingCollapsed = false;
      this._updateCollapseBtnState();
    }
    this._scrollThread();
  }

  _retryLast() {
    if (this._streaming || this._busy) return;
    const t = this._activeThread;
    if (!t || !Array.isArray(t.messages) || !t.messages.length) return;

    let userIndex = -1;
    for (let i = t.messages.length - 1; i >= 0; i--) {
      if (t.messages[i].role === 'user') {
        userIndex = i;
        break;
      }
    }
    if (userIndex < 0) return;

    const lastUserMsg = t.messages[userIndex].text;
    if (!lastUserMsg) return;

    // 回滚该提问及后续可能失败的消息
    t.messages = t.messages.slice(0, userIndex);
    this._saveActiveThread();
    this._renderThread(t);

    if (this._input) {
      this._input.value = lastUserMsg;
      this._grow();
    }
    this._ask();
  }

  _appendToThread(q: string, text: string, sources: any[], tools: any[], segments: any[], chapterTitle?: string) {
    const t = this._ensureActiveThread();
    t.messages.push({ role: 'user', text: q, chapterTitle });
    if (text) t.messages.push({ role: 'assistant', text, sources, tools, segments: segments || undefined });
    if (!t.title || t.title === '新会话') t.title = (q || '').slice(0, 20) || '新会话';
    t.updatedAt = Date.now();
    this._saveActiveThread();
  }

  _saveActiveThread() {
    const t = this._activeThread;
    if (!t) return;
    if (t.messages.length > MAX_MSGS) t.messages = t.messages.slice(-MAX_MSGS);
    if (!this._threads) this._threads = this._loadThreads();
    const i = this._threads.findIndex((x) => x.id === t.id);
    if (i >= 0) this._threads[i] = t; else this._threads.push(t);
    this._threads = this._threads.slice(-MAX_THREADS);
    this._saveThreads(this._threads);
    this._saveActiveThreadId(t.id);
  }

  _historyFromThread(t: any): any[] {
    return this._threadStore.historyFromThread(t);
  }

  _fallbackSummary(toolLog: any[]): string {
    return [
      '**【AI 本轮未能输出最终回答】**',
      '',
      'AI 已检索了本书相关的背景资料（可参考下方检索到的来源卡片），但未能生成完整的最终总结回答。',
      '',
      '您可以直接点击下方来源卡片查阅教材原文，或稍后换一种问法重新提问。',
    ].join('\n');
  }

  _relTime(ts: number): string {
    return ThreadStore.formatRelativeTime(ts);
  }

  _renderHistoryList() {
    if (!this._historyList) return;
    const threads = (this._threads || this._loadThreads()).slice().sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    this._historyList.innerHTML = '';
    if (this._historyEmpty) this._historyEmpty.style.display = threads.length ? 'none' : '';
    for (const t of threads) {
      const item = document.createElement('md-list-item');
      item.className = 'ask-history-item';
      if (this._activeThread && this._activeThread.id === t.id) {
        item.classList.add('ask-history-item-active');
      }
      item.dataset.id = t.id;
      item.type = 'button';

      const icon = document.createElement('svg');
      icon.slot = 'start';
      icon.setAttribute('viewBox', '0 0 24 24');
      icon.setAttribute('width', '20');
      icon.setAttribute('height', '20');
      icon.setAttribute('fill', 'none');
      icon.setAttribute('stroke', 'currentColor');
      icon.setAttribute('stroke-width', '2');
      icon.setAttribute('stroke-linecap', 'round');
      icon.setAttribute('stroke-linejoin', 'round');
      icon.innerHTML = '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>';

      const headline = document.createElement('div');
      headline.slot = 'headline';
      headline.className = 'ask-history-headline';
      headline.textContent = (t.title || '新会话').slice(0, 32);

      const supporting = document.createElement('div');
      supporting.slot = 'supporting-text';
      supporting.className = 'ask-history-meta';
      supporting.textContent = `${this._relTime(t.updatedAt)} · ${(t.messages || []).length} 条对话`;

      const delBtn = document.createElement('button');
      delBtn.slot = 'end';
      delBtn.type = 'button';
      delBtn.className = 'ask-history-del-btn';
      delBtn.title = '删除会话';
      delBtn.setAttribute('aria-label', '删除会话');
      delBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>`;

      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this._deleteThread(t.id);
      });

      item.appendChild(icon);
      item.appendChild(headline);
      item.appendChild(supporting);
      item.appendChild(delBtn);

      item.addEventListener('click', (e) => {
        if (delBtn.contains(e.target as Node)) return;
        this._loadThreadById(t.id);
      });

      this._historyList.appendChild(item);
    }
  }

  _loadThreadById(id: string) {
    const t = (this._threads || this._loadThreads()).find((x) => x.id === id);
    if (!t) return;
    if (this._abort) this._abort.abort();
    this._busy = false;
    this._streaming = false;
    this._activeThread = t;
    this._saveActiveThreadId(id);
    this._renderThread(t);
    this._closeHistory();
    this._updateSendState();
  }

  _deleteThread(id: string) {
    if (this._abort) this._abort.abort();
    this._busy = false;
    this._streaming = false;
    if (!this._threads) this._threads = this._loadThreads();
    this._threads = this._threads.filter((x) => x.id !== id);
    this._saveThreads(this._threads);
    if (this._activeThread && this._activeThread.id === id) {
      this._activeThread = null;
      try { localStorage.removeItem(this._activeKey()); } catch {}
      this._renderThread(null);
    }
    this._renderHistoryList();
    this._updateSendState();
  }

  _startNewThread() {
    if (this._abort) this._abort.abort();
    this._busy = false;
    this._streaming = false;
    this._activeThread = this._newThread();
    if (!this._threads) this._threads = this._loadThreads();
    this._threads.push(this._activeThread);
    this._threads = this._threads.slice(-MAX_THREADS);
    this._saveThreads(this._threads);
    this._saveActiveThreadId(this._activeThread.id);
    this._renderThread(this._activeThread);
    if (this._input) { this._input.value = ''; this._grow(); }
    this._closeHistory();
    this._updateSendState();
  }

  async _getIndex() {
    const key = this._bookKey();
    if (this._indexCache.has(key)) return this._indexCache.get(key);
    const url = `/ai-index/${key}.json`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`索引加载失败（${res.status}）—— 请先构建 ${url}`);
    const idx = await res.json();
    this._indexCache.set(key, idx);
    if (idx.meta && idx.meta.title) this._setBookTitle(idx.meta.title);
    return idx;
  }

  _allModels(): any[] {
    return getAllAiModels();
  }

  _selectedModel(): any {
    const id = getActiveAiModelId();
    const endpoint = getAiEndpoint(id);
    const all = getAllAiModels();
    const found = all.find((m) => m.id === id);
    const provider = getAiProvider();
    return {
      id,
      model: id,
      label: found ? found.label : id,
      endpoint,
      provider: found ? found.provider : provider.id,
      providerLabel: provider.label,
    };
  }

  _currentKey(): string {
    return getAiApiKey(getActiveAiModelId());
  }

  _params(): any {
    return getAiParams();
  }

  _answerMode(): string {
    return getAiAnswerMode();
  }

  _hideEmpty() {
    if (this._empty) this._empty.style.display = 'none';
    if (this._messages) this._messages.style.display = '';
  }

  _addMessage(role: string, body: any): HTMLElement {
    const msg = document.createElement('div');
    msg.className = 'ask-msg ' + (role === 'user' ? 'ask-msg-user' : 'ask-msg-ai');
    if (role === 'user') {
      if (body.chapterTitle) {
        const badge = document.createElement('div');
        badge.className = 'ask-user-ref-badge';
        const label = body.chapterTitle.includes('章节:')
          ? `引用 ${body.chapterTitle}`
          : `引用: 《${body.chapterTitle}》`;
        badge.innerHTML = `<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" aria-hidden="true"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg> ${label}`;
        msg.appendChild(badge);
      }
      const t = document.createElement('div');
      t.className = 'ask-msg-text ai-md';
      t.innerHTML = mdToHtml(body.text, this._sourceOpenNew());
      msg.appendChild(t);
      this._typeMath(t);
    } else {
      const blocks = document.createElement('div');
      blocks.className = 'ask-blocks';
      const sources = document.createElement('div');
      sources.className = 'ask-sources';
      sources.style.display = 'none';
      msg.appendChild(blocks);
      msg.appendChild(sources);
      body.blocksEl = blocks;
      body.sourcesEl = sources;
    }
    if (this._messages) this._messages.appendChild(msg);
    this._scrollThread();
    return msg;
  }

  _appendMdBlock(blocksEl: HTMLElement, text: string, decorate = true): HTMLElement | null {
    if (!blocksEl) return null;
    const d = document.createElement('div');
    d.className = 'ai-md ask-ai-reply';
    d.innerHTML = decorateFootnotes(mdToHtml(text, this._sourceOpenNew()), decorate);
    blocksEl.appendChild(d);
    this._typeMath(d);
    return d;
  }

  _scrollThread() {
    if (this._thread) this._thread.scrollTop = this._thread.scrollHeight;
  }

  _grow() {
    const t = this._input;
    if (!t) return;
    t.style.height = 'auto';
    const h = Math.min(t.scrollHeight, 128);
    t.style.height = `${h}px`;
    t.style.overflowY = t.scrollHeight > 128 ? 'auto' : 'hidden';
    this._updateSendState();
  }

  _updateSendState() {
    if (!this._submit) return;
    if (this._streaming) {
      this._submit.disabled = false;
      if (this._sendIcon) this._sendIcon.hidden = true;
      if (this._stopIcon) this._stopIcon.hidden = false;
      this._submit.title = '停止生成';
      this._submit.setAttribute('aria-label', '停止生成');
      return;
    }

    if (this._sendIcon) this._sendIcon.hidden = false;
    if (this._stopIcon) this._stopIcon.hidden = true;
    this._submit.title = '发送 (Enter)';
    this._submit.setAttribute('aria-label', '发送');

    const val = this._input ? this._input.value.trim() : '';
    this._submit.disabled = this._busy || !val;
  }

  _renderSources(el: HTMLElement, hits: any[]) {
    el.innerHTML = '';
    if (!hits.length) { el.style.display = 'none'; return; }
    el.style.display = '';
    const openNew = this._sourceOpenNew();
    const label = document.createElement('div');
    label.className = 'ask-sources-label';
    label.textContent = '来源（点击可跳转原文）';
    el.appendChild(label);
    hits.forEach((h: any, i: number) => {
      const a = document.createElement('a');
      a.className = 'ask-source';
      a.id = `ai-cite-${i + 1}`;
      a.href = safeLink(h.chunk.url);
      a.target = openNew ? '_blank' : '_self';
      a.rel = openNew ? 'noopener' : '';
      const head = document.createElement('div');
      head.className = 'ask-source-head';
      const type = document.createElement('span');
      type.className = 'ask-source-type';
      type.textContent = `${i + 1}·${h.chunk.type || '正文'}`;
      const t = document.createElement('span');
      t.className = 'ask-source-title';
      t.textContent = h.chunk.title || `${h.chunk.type || '正文'}（第 ${i + 1} 条）`;
      head.appendChild(type);
      head.appendChild(t);
      a.appendChild(head);
      if (h.chunk.text) {
        const snip = document.createElement('div');
        snip.className = 'ask-source-snip';
        snip.textContent = capSnippet(h.chunk.text);
        a.appendChild(snip);
      }
      el.appendChild(a);
    });
  }

  _sourceOpenNew(): boolean {
    return getAiSourceOpen() !== 'same';
  }

  _applySrcOpenToExisting() {
    const openNew = this._sourceOpenNew();
    const links = this.querySelectorAll('.ask-messages a');
    for (const a of Array.from(links)) {
      (a as HTMLAnchorElement).target = openNew ? '_blank' : '_self';
      if (openNew) {
        (a as HTMLAnchorElement).setAttribute('rel', 'noopener');
      } else {
        (a as HTMLAnchorElement).removeAttribute('rel');
      }
    }
  }

  _typeMath(el: HTMLElement) {
    if (!el) return;
    getMathRenderer().then((renderer) => {
      try { renderer(el, this._katexConfig); }
      catch (e) {}
    }).catch(() => {});
  }

  _jsonHtml(v: any, cap = 1400): string {
    let s;
    if (typeof v === 'string') {
      s = v;
    } else {
      try { s = JSON.stringify(v, null, 2); } catch { s = String(v); }
    }
    if (s.length > cap) s = `${s.slice(0, cap)}\n…`;
    return jsonHighlight(s);
  }

  _collapseTools(container: HTMLElement) {
    if (!container) return;
    const tools = container.querySelectorAll<HTMLDetailsElement>('details.ask-tool[open]');
    for (const t of Array.from(tools)) {
      t.removeAttribute('open');
    }
  }

  _collapsePreceding(forceCollapse?: boolean) {
    if (!this._messages) return;
    const aiMsgs = Array.from(this._messages.querySelectorAll<HTMLElement>('.ask-msg-ai'));
    if (aiMsgs.length === 0) return;

    const shouldCollapse = forceCollapse !== undefined ? forceCollapse : !this._isPrecedingCollapsed;
    this._isPrecedingCollapsed = shouldCollapse;

    if (aiMsgs.length === 1) {
      if (forceCollapse === undefined) {
        const tools = aiMsgs[0].querySelectorAll<HTMLDetailsElement>('details.ask-tool, details.ask-think, details.ask-tools-group');
        for (const t of Array.from(tools)) {
          if (shouldCollapse) t.removeAttribute('open');
          else t.setAttribute('open', '');
        }
      }
    } else {
      const preceding = aiMsgs.slice(0, -1);
      for (const msg of preceding) {
        const tools = msg.querySelectorAll<HTMLDetailsElement>('details.ask-tool, details.ask-think, details.ask-tools-group');
        for (const t of Array.from(tools)) {
          if (shouldCollapse) {
            t.removeAttribute('open');
          } else {
            t.setAttribute('open', '');
          }
        }
      }
      if (!shouldCollapse && forceCollapse === undefined) {
        const lastTools = aiMsgs[aiMsgs.length - 1].querySelectorAll<HTMLDetailsElement>('details.ask-tool, details.ask-think, details.ask-tools-group');
        for (const t of Array.from(lastTools)) {
          t.setAttribute('open', '');
        }
      }
    }

    this._updateCollapseBtnState();
  }

  _togglePrecedingCollapse() {
    this._collapsePreceding(!this._isPrecedingCollapsed);
  }

  _updateCollapseBtnState() {
    if (!this._collapseBtn) return;
    const iconLess = this._collapseBtn.querySelector<HTMLElement>('.icon-unfold-less');
    const iconMore = this._collapseBtn.querySelector<HTMLElement>('.icon-unfold-more');
    if (this._isPrecedingCollapsed) {
      if (iconLess) iconLess.style.display = 'none';
      if (iconMore) iconMore.style.display = '';
      this._collapseBtn.title = '展开所有过程';
      this._collapseBtn.setAttribute('aria-label', '展开所有过程');
    } else {
      if (iconLess) iconLess.style.display = '';
      if (iconMore) iconMore.style.display = 'none';
      this._collapseBtn.title = '折叠前序过程';
      this._collapseBtn.setAttribute('aria-label', '折叠前序过程');
    }
  }

  _toolBlocksHtml(toolLog: any[], isOpen = false): string {
    if (!toolLog || !toolLog.length) return '';
    const items = toolLog.map((t: any) => {
      const raw = t.resultRaw !== undefined ? t.resultRaw : t.resultText;
      const cleanSummary = (t.summary || '').replace(/\s+/g, ' ').trim();
      let countBadge = '';
      if (raw && Array.isArray(raw.results)) countBadge = ` (${raw.results.length})`;
      else if (raw && Array.isArray(raw.hits)) countBadge = ` (${raw.hits.length})`;
      else if (Array.isArray(raw)) countBadge = ` (${raw.length})`;

      return `
        <details class="ask-tool" ${isOpen ? 'open' : ''}>
          <summary class="ask-tool-summary" title="${esc(cleanSummary)}">
            <svg class="ask-tool-chevron" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
            <span class="ask-tool-badge">Tool</span>
            <span class="ask-tool-name">${esc(t.name)}</span>
            <span class="ask-tool-sum">${esc(cleanSummary)}</span>
          </summary>
          <div class="ask-tool-panel">
            <div class="ask-tool-panel-header">
              <div class="ask-tool-tabs" role="tablist" aria-label="工具数据切换">
                <button type="button" class="ask-tool-tab active" data-tab="result" role="tab" aria-selected="true">
                  <span class="ask-tool-tab-label">返回结果</span><span class="ask-tool-tab-count">${countBadge}</span>
                </button>
                <button type="button" class="ask-tool-tab" data-tab="args" role="tab" aria-selected="false">
                  <span class="ask-tool-tab-label">调用参数</span>
                </button>
              </div>
              <button type="button" class="ask-tool-copy-btn" title="复制当前数据" aria-label="复制当前数据">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                <span class="ask-tool-copy-text">复制</span>
              </button>
            </div>
            <div class="ask-tool-pane ask-tool-pane-result" role="tabpanel">
              <pre>${this._jsonHtml(raw)}</pre>
            </div>
            <div class="ask-tool-pane ask-tool-pane-args" role="tabpanel" style="display:none;">
              <pre>${this._jsonHtml(t.args)}</pre>
            </div>
          </div>
        </details>`;
    }).join('');
    return `<div class="ask-tool-block">${items}</div>`;
  }

  _toolsGroupHtml(tools: any[], isOpen = false): string {
    if (!tools || !tools.length) return '';
    const summaryText = formatExplorationSummary(tools);
    const toolItemsHtml = this._toolBlocksHtml(tools, false);
    return `
      <details class="ask-tools-group" ${isOpen ? 'open' : ''}>
        <summary class="ask-tools-group-summary" title="点击展开/收起工具调用详情">
          <span class="ask-tools-group-title">${esc(summaryText)}</span>
          <svg class="ask-tools-group-chevron" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </summary>
        <div class="ask-tools-group-items">
          ${toolItemsHtml}
        </div>
      </details>
    `;
  }

  async _ask() {
    if (!this._input) return;
    const q = this._input.value.trim();
    if (!q || this._busy) return;

    // 收集引用的章节列表
    const chapterRefs: ReferencedChapter[] = this._referencedChapters.slice();
    if (this._isDocked && this._refCurrentChapter) {
      const cur = this._getCurrentChapterInfo();
      if (!chapterRefs.some((c) => c.url === cur.url)) {
        chapterRefs.unshift({ ...cur, isCurrent: true });
      }
    }

    // 确保引用的所有章节文本在发送前已完成拉取 (最多等待 1.2s)
    await Promise.all(
      chapterRefs.map(async (c) => {
        if (!c.text) {
          c.text = await Promise.race([
            this._prefetchChapterText(c.url),
            new Promise<string>((resolve) => setTimeout(() => resolve(''), 1200)),
          ]);
        }
      })
    );

    const chapterRefTitles = chapterRefs.map((c) => c.title).filter(Boolean);
    const chapterRefDisplay =
      chapterRefTitles.length === 1
        ? chapterRefTitles[0]
        : chapterRefTitles.length > 1
        ? `${chapterRefTitles.length} 个章节: ${chapterRefTitles.join('、')}`
        : undefined;

    this._hideEmpty();
    this._addMessage('user', { text: q, chapterTitle: chapterRefDisplay });
    this._input.value = '';
    this._grow();
    this._busy = true;
    this._updateSendState();
    try { (window as any).__astrolibTrack?.('ai_ask', { book: this._bookKey() }); } catch {}

    const status = this._status;
    const mode = this._answerMode();
    const discussion = mode === 'discussion';

    const aiMsg = this._addMessage('ai', {});
    const blocksEl = aiMsg.querySelector('.ask-blocks') as HTMLElement;
    const sourcesEl = aiMsg.querySelector('.ask-sources') as HTMLElement;
    if (discussion) sourcesEl.style.display = 'none';

    // 立即插入 Material 3 官方微光思考占位
    blocksEl.innerHTML = createM3LoadingHtml({
      variant: 'default',
      size: 'compact',
      layout: 'inline',
      label: discussion ? 'AI 正在深入思考与推导...' : '正在检索本书知识库...',
      className: 'ask-msg-thinking-placeholder',
    });
    this._scrollThread();

    status.textContent = discussion ? '深度讨论中：AI 正在基于理解作答，需要时按需检索本书…' : '正在检索本书知识库…';

    const params = this._params();
    try {
      let idx = null;
      let hits: any[] = [];
      const ai = await getAiCoreModules();
      if (!discussion) {
        idx = await this._getIndex();
        const retriever = ai.createRetriever(idx.chunks);
        hits = retriever.search(q, { topK: params.topK });
        if (!hits.length) {
          blocksEl.innerHTML = '';
          this._appendMdBlock(blocksEl, '没有在本书中找到相关内容。');
          status.textContent = '没有在本书中找到相关内容。';
          this._busy = false;
          this._updateSendState();
          this._scrollThread();
          return;
        }
        status.textContent = `命中 ${hits.length} 个片段，正在生成回答…`;
      } else {
        status.textContent = '深度讨论中：AI 正在基于理解作答，需要时按需检索本书…';
      }

      const apiKey = this._currentKey();
      const modelDef = this._selectedModel();
      if (apiKey && modelDef && modelDef.endpoint) {
        const res = await this._generateAnswer(blocksEl, {
          mode,
          idx,
          hits,
          question: q,
          chapterRef: chapterRefs[0] || null,
          chapterRefs,
        });
        const text = res.text || '';
        const sources = discussion ? [] : hits.map((h: any) => ({
          type: h.chunk.type, title: h.chunk.title, url: h.chunk.url, text: h.chunk.text,
        }));
        const tools = (res.tools || []).map((t: any) => ({
          name: t.name, args: t.args, summary: t.summary, resultText: t.resultText,
        }));
        if (!discussion && hits.length) this._renderSources(sourcesEl, hits);
        this._appendToThread(q, text, sources, tools, res.segments, chapterRefDisplay);
        status.textContent = '完成。';
      } else {
        const placeholder = blocksEl.querySelector('.ask-msg-thinking-placeholder');
        if (placeholder) placeholder.remove();
        this._appendMdBlock(blocksEl, discussion
          ? '未配置 API Key（或模型/端点缺失），无法生成深度讨论回答。可在设置中配置 Key、选择模型后继续。'
          : '未配置 API Key（或模型/端点缺失），已仅展示检索来源（点击可跳转原文）。可在设置中配置 Key、选择模型后生成答案。', false);
        if (!discussion && hits.length) this._renderSources(sourcesEl, hits);
        status.textContent = '';
      }
    } catch (e: any) {
      const placeholder = blocksEl.querySelector('.ask-msg-thinking-placeholder');
      if (placeholder) placeholder.remove();
      const provider = getAiProvider();
      const modelDef = this._selectedModel();
      const errInfo = parseAiError(e, {
        providerId: provider.id,
        providerLabel: provider.label,
        modelId: modelDef.model || modelDef.id,
        modelLabel: modelDef.label || modelDef.id,
        endpoint: modelDef.endpoint,
      });
      status.textContent = `出错了：${errInfo.title}`;
      const d = document.createElement('div');
      d.className = 'ask-error-container';
      d.innerHTML = renderErrorCardHtml(errInfo);
      blocksEl.appendChild(d);
      console.error('[ai-ask]', e);
    } finally {
      this._busy = false;
      this._updateSendState();
      this._scrollThread();
    }
  }

  async _generateAnswer(blocksEl: HTMLElement, opts: any): Promise<any> {
    if (this._abort) this._abort.abort();
    this._abort = new AbortController();
    const cfg = getConfig(this);
    const params = this._params();
    const apiKey = this._currentKey();
    const modelDef = this._selectedModel();
    const { mode = 'retrieve', idx = null, hits = [], question, chapterRef = null, chapterRefs = null } = opts || {};
    const discussion = mode === 'discussion';
    const ai = await getAiCoreModules();
    const toolDefs = ai.buildToolDefs();
    const context = discussion ? '' : ai.buildContext(hits.map((h: any) => h.chunk), params.maxContextChars);
    const messages = ai.buildMessages({
      question,
      context,
      bookTitle: (idx && idx.meta && idx.meta.title) || this._bookTitle,
      history: this._historyFromThread(this._activeThread),
      toolsDesc: ai.toolsDesc(),
      discussion,
      chapterRef,
      chapterRefs: chapterRefs || (chapterRef ? [chapterRef] : null),
      extendedThinking: getAiExtendedThinking(),
    });
    const toolCtx = { index: discussion ? null : idx, bookList: (cfg.bookList || []), col: this._col, book: this._book };
    const endpoint = modelDef.endpoint;
    const model = modelDef.model;

    let full = '';
    let lastText = '';
    const toolLog: any[] = [];
    const segments: any[] = [];
    const replyEls: HTMLElement[] = [];

    let curText = '';
    let curTextEl: HTMLElement | null = null;
    let scheduled = false;

    const addReplyEl = () => {
      const d = document.createElement('div');
      d.className = 'ai-md ask-ai-reply';
      blocksEl.appendChild(d);
      replyEls.push(d);
      return d;
    };
    const renderCur = () => {
      if (!curTextEl) return;
      curTextEl.innerHTML = decorateFootnotes(mdToHtml(curText, this._sourceOpenNew()), !discussion)
        + (this._streaming ? '<span class="ask-caret"></span>' : '');
      this._typeMath(curTextEl);
      this._scrollThread();
      scheduled = false;
    };
    const scheduleRender = () => { if (!scheduled) { scheduled = true; requestAnimationFrame(renderCur); } };
    const flushReply = () => {
      if (curText && curText.trim()) {
        segments.push({ kind: 'reply', text: curText });
        if (curTextEl) { const c = curTextEl.querySelector('.ask-caret'); if (c) c.remove(); }
      }
      curText = '';
      curTextEl = null;
    };

    const maxTurns = 8;
    let usedTools = false;
    let currentToolsGroupEl: HTMLElement | null = null;
    let currentGroupTools: any[] = [];

    const finishCurrentExplorationGroup = () => {
      if (!currentToolsGroupEl || !currentGroupTools.length) return;
      const titleEl = currentToolsGroupEl.querySelector('.ask-tools-group-title');
      if (titleEl) {
        titleEl.textContent = formatExplorationSummary(currentGroupTools);
      }
      if (getAiCollapseToolsSummary()) {
        currentToolsGroupEl.removeAttribute('open');
        this._collapseTools(currentToolsGroupEl);
      }
      currentToolsGroupEl = null;
      currentGroupTools = [];
    };

    try {
      this._streaming = true;
      this._updateSendState();
      for (let turn = 0; turn < maxTurns; turn++) {
        curText = '';
        curTextEl = null;
        const res = await ai.streamChat({
          endpoint, apiKey, model, messages,
          tools: toolDefs, toolChoice: 'auto',
          signal: this._abort.signal,
          onDelta: (d: string) => {
            const placeholder = blocksEl.querySelector('.ask-msg-thinking-placeholder');
            if (placeholder) placeholder.remove();
            if (usedTools) {
              finishCurrentExplorationGroup();
              this._collapseTools(blocksEl);
            }
            curText += d;
            full += d;
            if (!curTextEl) curTextEl = addReplyEl();
            scheduleRender();
          },
        });
        lastText = res.text || '';
        if (res.toolCalls && res.toolCalls.length) {
          usedTools = true;
          messages.push({
            role: 'assistant',
            content: res.text || null,
            tool_calls: res.toolCalls.map((tc: any) => {
              const callObj: any = {
                id: tc.id,
                type: 'function',
                function: { name: tc.name, arguments: JSON.stringify(tc.arguments) },
              };
              if (tc.extra_content) {
                callObj.extra_content = tc.extra_content;
              }
              return callObj;
            }),
          });
          flushReply();
          for (const tc of res.toolCalls) {
            const placeholder = blocksEl.querySelector('.ask-msg-thinking-placeholder');
            if (placeholder) placeholder.remove();

            if (!currentToolsGroupEl) {
              const groupEl = document.createElement('details');
              groupEl.className = 'ask-tools-group';
              groupEl.setAttribute('open', '');
              groupEl.innerHTML = `
                <summary class="ask-tools-group-summary" title="点击展开/收起工具调用详情">
                  <span class="ask-tools-group-title">正在执行工具探索...</span>
                  <svg class="ask-tools-group-chevron" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </summary>
                <div class="ask-tools-group-items"></div>
              `;
              blocksEl.appendChild(groupEl);
              currentToolsGroupEl = groupEl;
            }

            const inFlight = document.createElement('div');
            inFlight.className = 'ask-tool-in-flight';
            inFlight.innerHTML = createM3LoadingHtml({
              variant: 'default',
              size: 'compact',
              layout: 'inline',
              label: `正在检索章节知识库 [${tc.name}]...`,
            });
            const itemsEl = currentToolsGroupEl.querySelector<HTMLElement>('.ask-tools-group-items') || blocksEl;
            itemsEl.appendChild(inFlight);
            this._scrollThread();

            let out: any, summary: string;
            try {
              if (!toolCtx.index && tc.name !== 'list_books') toolCtx.index = await this._getIndex();
              out = await ai.runClientTool(tc.name, tc.arguments, toolCtx);
              summary = toolSummary(tc.name, out);
            } catch (e: any) {
              out = { error: e.message || String(e) };
              summary = '执行失败';
            } finally {
              inFlight.remove();
            }
            const t = { name: tc.name, args: tc.arguments || {}, summary, resultRaw: out, resultText: capJsonText(out) };
            toolLog.push(t);
            segments.push({ kind: 'tool', name: t.name, args: t.args, summary: t.summary, resultText: t.resultText });
            currentGroupTools.push(t);
            itemsEl.insertAdjacentHTML('beforeend', this._toolBlocksHtml([t], true));

            const titleEl = currentToolsGroupEl.querySelector('.ask-tools-group-title');
            if (titleEl) {
              titleEl.textContent = `正在执行工具探索 (${currentGroupTools.length} 步)...`;
            }

            messages.push({ role: 'tool', tool_call_id: tc.id, name: tc.name, content: JSON.stringify(out) });
          }
          continue;
        }
        break;
      }
      flushReply();
    } catch (e: any) {
      const placeholder = blocksEl.querySelector('.ask-msg-thinking-placeholder');
      if (placeholder) placeholder.remove();
      if (e.name !== 'AbortError') {
        const provider = getAiProvider();
        const errInfo = parseAiError(e, {
          providerId: provider.id,
          providerLabel: provider.label,
          modelId: modelDef.model || modelDef.id,
          modelLabel: modelDef.label || modelDef.id,
          endpoint,
        });

        const errorCardHtml = renderErrorCardHtml(errInfo);
        if (curText && curText.trim()) segments.push({ kind: 'reply', text: curText });
        segments.push({ kind: 'error', errorInfo: errInfo, html: errorCardHtml });
        full += (full && full.trim() ? '\n\n' : '') + `[${errInfo.title}] ${errInfo.message}`;

        const d = addReplyEl();
        d.innerHTML = errorCardHtml;
      }
    } finally {
      finishCurrentExplorationGroup();
      this._collapseTools(blocksEl);
      if (getAiAutoCollapsePreceding()) {
        this._collapsePreceding(true);
      }
      this._streaming = false;
      this._updateSendState();
      for (const el of replyEls) { const c = el.querySelector('.ask-caret'); if (c) c.remove(); }
      if (usedTools && toolLog.length && !lastText.trim()) {
        const fb = this._fallbackSummary(toolLog);
        if (fb) {
          full = (full && full.trim()) ? `${full.trim()}\n\n${fb}` : fb;
          segments.push({ kind: 'reply', text: fb });
          const d = addReplyEl();
          d.innerHTML = decorateFootnotes(mdToHtml(fb, this._sourceOpenNew()), !discussion);
          this._typeMath(d);
        }
      }
      this._scrollThread();
      this._abort = null;
    }
    return { text: full, tools: toolLog, segments };
  }
}

if (!customElements.get('ai-ask')) {
  customElements.define('ai-ask', AIAskElement);
}
