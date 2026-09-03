export interface ModuleItem {
  id: string;
  kind: string;
  tagName: string;
  typeLabel: string;
  code: string;
  theme: string;
  rawTitle: string;
  cleanTitle: string;
  normalizedTitle: string;
  chapterTitle: string;
  chapterSlug: string;
  chapterUrl: string;
  file: string;
  filename: string;
  line: number;
  anchorId: string;
  url: string;
  snippet: string;
  suspiciousReasons: string[];
  _searchIndex?: string;
}

export interface DuplicateGroup {
  title: string;
  normalizedTitle: string;
  chapterTitle?: string;
  chapterSlug?: string;
  file?: string;
  filename?: string;
  count: number;
  chaptersCount?: number;
  items: ModuleItem[];
  _searchIndex?: string;
}

export interface FormulaErrorItem {
  id: string;
  file: string;
  filename: string;
  line: number;
  type: 'display' | 'inline';
  typeLabel: string;
  math: string;
  snippet: string;
  error: string;
  chapterTitle: string;
  chapterSlug: string;
  chapterUrl: string;
  url: string;
  _searchIndex?: string;
}

export interface ScanResult {
  ok: boolean;
  colSlug: string;
  bookSlug: string;
  bookTitle: string;
  totalModules: number;
  totalChapters: number;
  stats: {
    byKind: Record<string, number>;
    sameChapterDupsCount: number;
    allDupsCount: number;
    suspiciousCount: number;
    formulaErrorsCount?: number;
  };
  modules: ModuleItem[];
  sameChapterDuplicates: DuplicateGroup[];
  allDuplicates: DuplicateGroup[];
  suspiciousItems: ModuleItem[];
  formulaErrors?: FormulaErrorItem[];
  message?: string;
}

export interface BookOption {
  colSlug: string;
  colTitle: string;
  bookSlug: string;
  bookTitle: string;
  entryPoint: string;
  key: string;
}

interface FilteredState {
  filteredModules: ModuleItem[];
  filteredSameChapterDups: DuplicateGroup[];
  filteredAllDups: DuplicateGroup[];
  filteredSuspicious: ModuleItem[];
  filteredFormulaErrors: FormulaErrorItem[];
  kindCounts: Record<string, number>;
  totalMatchedKindCount: number;
}

const KIND_LABEL_MAP: Record<string, string> = {
  theorem: '定理',
  definition: '定义',
  property: '性质',
  corollary: '推论',
  lemma: '引理',
  proposition: '命题',
  axiom: '公理',
  criterion: '准则',
  example: '例题',
  variant: '变式',
  exercise: '习题',
  method: '方法',
  note: '注记',
  summary: '总结',
  conclusion: '结论',
  solution: '解析',
  analysis: '思路分析',
  guide: '教学导引',
  qrcodevideo: '拓展微课',
  section: '专题小节',
  knowledge: '知识点',
  block: '通用块',
};

const CHUNK_SIZE = 40;

class ModuleInspectorController {
  private rootEl: HTMLElement | null = null;
  private isOpen = false;
  private isDev = false;
  private activeTab: 'all' | 'same_chapter_dups' | 'all_dups' | 'suspicious' | 'formula_errors' = 'all';
  private selectedKind = 'all';
  private selectedChapter = 'all';
  private searchQuery = '';
  private currentBookKey = '';
  private booksList: BookOption[] = [];
  private scanData: ScanResult | null = null;
  private loading = false;
  private error: string | null = null;
  private renderRafId = 0;
  private searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  private observer: IntersectionObserver | null = null;
  private currentRenderMode: 'flat' | 'same_dups' | 'all_dups' | 'suspicious' | 'formula_errors' = 'flat';
  private currentItems: (ModuleItem | DuplicateGroup | FormulaErrorItem)[] = [];
  private currentRenderedCount = 0;
  private locatedItemId: string | null = null;

  init() {
    this.rootEl = document.getElementById('dsh-inspector-root');
    if (!this.rootEl) return;

    this.isDev = this.rootEl.getAttribute('data-is-dev') === 'true';

    if (this.rootEl.parentElement !== document.body) {
      document.body.appendChild(this.rootEl);
    }

    this.bindGlobalShortcuts();
    this.bindTriggerButtons();
    this.bindUIEvents();
    this.setupPageLoadHighlight();

    const detected = this.detectCurrentBookKey();
    this.currentBookKey = detected || 'math/math_senior';

    document.addEventListener('dsh:feature-change', () => {
      const allowed = (window as unknown as Record<string, unknown>).__dshFeatureInspectorAllowed !== false;
      if (!allowed && this.isOpen) {
        this.close();
      }
    });

    document.addEventListener('dsh:open-inspector', () => {
      this.open();
    });
  }

  private detectCurrentBookKey(): string | null {
    const match = location.pathname.match(/\/collections\/([^/]+)\/([^/]+)/);
    if (match) {
      return `${match[1]}/${match[2]}`;
    }
    return null;
  }

  private bindGlobalShortcuts() {
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      if (e.altKey && (e.key === 'm' || e.key === 'M' || e.code === 'KeyM')) {
        e.preventDefault();
        this.toggle();
        return;
      }

      if (!isInput && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey && (e.key === 'm' || e.key === 'M')) {
        e.preventDefault();
        this.toggle();
        return;
      }

      if (e.key === 'Escape' && this.isOpen) {
        e.preventDefault();
        this.close();
      }
    });
  }

  private bindTriggerButtons() {

    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement | null;
      const btn = target?.closest<HTMLButtonElement>('[data-inspector-trigger]');
      if (btn) {
        e.preventDefault();
        this.toggle();
      }
    });
  }

  private bindUIEvents() {
    if (!this.rootEl) return;

    this.rootEl.querySelector('.insp-backdrop')?.addEventListener('click', () => {
      this.close();
    });

    this.rootEl.querySelector('.insp-close')?.addEventListener('click', () => {
      this.close();
    });

    this.rootEl.querySelector('.insp-refresh-btn')?.addEventListener('click', () => {
      this.loadData(true);
    });

    const bookSelect = this.rootEl.querySelector<HTMLSelectElement>('.insp-book-select');
    bookSelect?.addEventListener('change', () => {
      if (bookSelect.value) {
        this.currentBookKey = bookSelect.value;
        this.loadData();
      }
    });

    const searchInput = this.rootEl.querySelector<HTMLInputElement>('.insp-search-input');
    const searchClear = this.rootEl.querySelector<HTMLButtonElement>('.insp-search-clear');

    const updateClearVisibility = () => {
      if (searchClear) {
        searchClear.classList.toggle('visible', !!this.searchQuery);
      }
    };

    searchInput?.addEventListener('input', () => {
      const val = searchInput.value.trim().toLowerCase();
      if (this.searchQuery === val) return;
      this.searchQuery = val;
      updateClearVisibility();

      if (this.searchDebounceTimer) clearTimeout(this.searchDebounceTimer);
      this.searchDebounceTimer = setTimeout(() => {
        cancelAnimationFrame(this.renderRafId);
        this.renderRafId = requestAnimationFrame(() => {
          this.renderAll();
        });
      }, 80);
    });

    searchClear?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (searchInput) {
        searchInput.value = '';
        searchInput.focus();
      }
      this.searchQuery = '';
      if (this.searchDebounceTimer) clearTimeout(this.searchDebounceTimer);
      updateClearVisibility();
      this.renderAll();
    });

    this.rootEl.querySelectorAll<HTMLButtonElement>('.insp-tab').forEach((tabBtn) => {
      tabBtn.addEventListener('click', () => {
        const tab = tabBtn.getAttribute('data-tab') as typeof this.activeTab;
        if (tab && tab !== this.activeTab) {
          this.activeTab = tab;
          this.rootEl?.querySelectorAll('.insp-tab').forEach((b) => b.classList.remove('active'));
          tabBtn.classList.add('active');
          this.renderAll();
        }
      });
    });

    const chapterSelect = this.rootEl.querySelector<HTMLSelectElement>('.insp-chapter-select');
    chapterSelect?.addEventListener('change', () => {
      this.selectedChapter = chapterSelect.value;
      this.renderAll();
    });

    const listContainer = this.rootEl.querySelector('.insp-body');
    listContainer?.addEventListener('click', (e) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const copyBtn = target.closest<HTMLElement>('[data-action="copy"], .insp-copy-pos-btn');
      if (copyBtn) {
        e.stopPropagation();
        const loc = copyBtn.getAttribute('data-location') || copyBtn.getAttribute('data-pos') || '';
        if (loc) this.copyToClipboard(loc);
        return;
      }

      const editBtn = target.closest<HTMLElement>('[data-action="edit"], .insp-edit-link');
      if (editBtn) {
        e.stopPropagation();
        const itemUrl = editBtn.getAttribute('data-url') || '';
        const line = editBtn.getAttribute('data-line') || '';
        this.openInEditor(itemUrl, line);
        return;
      }

      const jumpBtn = target.closest<HTMLElement>('.insp-jump-btn, .insp-action-jump');
      if (jumpBtn) {
        e.stopPropagation();
        const row = jumpBtn.closest<HTMLElement>('.insp-item-row, .insp-card-suspicious');
        const itemUrl = jumpBtn.getAttribute('data-url') || row?.getAttribute('data-url') || '';
        const anchorId = jumpBtn.getAttribute('data-anchor') || row?.getAttribute('data-anchor') || '';
        const line = Number(jumpBtn.getAttribute('data-line') || row?.getAttribute('data-line') || '0');
        const itemId = row?.getAttribute('data-id') || '';
        if (itemId) this.setLocatedItem(itemId);
        this.navigateTo(itemUrl, anchorId, line, itemId);
        return;
      }

      const cardRow = target.closest<HTMLElement>('.insp-item-row, .insp-card-suspicious');
      if (cardRow) {
        const itemUrl = cardRow.getAttribute('data-url') || '';
        const anchorId = cardRow.getAttribute('data-anchor') || '';
        const line = Number(cardRow.getAttribute('data-line') || '0');
        const itemId = cardRow.getAttribute('data-id') || '';
        if (itemId) this.setLocatedItem(itemId);
        this.navigateTo(itemUrl, anchorId, line, itemId);
      }
    });
  }

  public open() {
    if (!this.rootEl) return;
    this.isOpen = true;
    this.rootEl.classList.add('insp-open');
    document.body.classList.add('insp-drawer-open');

    const detected = this.detectCurrentBookKey();
    if (detected && detected !== this.currentBookKey) {
      this.currentBookKey = detected;
    }

    if (!this.scanData || this.scanData.colSlug + '/' + this.scanData.bookSlug !== this.currentBookKey) {
      this.loadData();
    } else {
      this.renderAll();
    }

    setTimeout(() => {
      this.rootEl?.querySelector<HTMLInputElement>('.insp-search-input')?.focus();
    }, 120);
  }

  public close() {
    if (!this.rootEl) return;
    this.isOpen = false;
    this.rootEl.classList.remove('insp-open');
    document.body.classList.remove('insp-drawer-open');
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  public toggle() {
    if (this.isOpen) this.close();
    else this.open();
  }

  private async loadData(force = false) {
    if (this.loading) return;
    this.loading = true;
    this.error = null;
    this.renderLoading(true);

    try {

      if (!this.booksList.length) {
        let bRes = await fetch('/__inspector__/books').catch(() => null);
        if (!bRes || !bRes.ok) {
          bRes = await fetch('/inspector-data/books.json').catch(() => null);
        }
        if (bRes && bRes.ok) {
          const bJson = await bRes.json();
          this.booksList = bJson.books || [];
          this.renderBookSelect();
        }
      }

      const [col, book] = this.currentBookKey.split('/');
      if (!col || !book) {
        throw new Error('未指定有效的图书标识');
      }

      let res = await fetch(
        `/__inspector__/modules?col=${encodeURIComponent(col)}&book=${encodeURIComponent(book)}&force=${force}&t=${force ? Date.now() : 0}`
      ).catch(() => null);

      if (!res || !res.ok) {
        res = await fetch(`/inspector-data/${col}-${book}.json?t=${force ? Date.now() : 0}`).catch(() => null);
      }

      if (!res || !res.ok) {
        const errJson = await res?.json().catch(() => ({}));
        throw new Error(errJson?.message || `请求失败 HTTP ${res?.status || 404}（无法加载书籍模块索引）`);
      }

      this.scanData = await res.json();

      if (this.scanData) {
        for (const m of this.scanData.modules) {
          m._searchIndex = `${m.cleanTitle} ${m.rawTitle} ${m.snippet || ''} ${m.chapterTitle} ${m.typeLabel} ${m.kind} ${m.code || ''} ${m.filename} ${m.line}`.toLowerCase();
        }
        for (const m of this.scanData.suspiciousItems || []) {
          m._searchIndex = `${m.cleanTitle} ${m.rawTitle} ${m.snippet || ''} ${m.chapterTitle} ${m.typeLabel} ${m.kind} ${m.code || ''} ${m.filename} ${m.line}`.toLowerCase();
        }
        for (const g of this.scanData.sameChapterDuplicates || []) {
          g._searchIndex = `${g.title} ${g.chapterTitle || ''} ${g.items.map((i) => i.snippet || '').join(' ')}`.toLowerCase();
        }
        for (const g of this.scanData.allDuplicates || []) {
          g._searchIndex = `${g.title} ${g.items.map((i) => (i.snippet || '') + ' ' + (i.chapterTitle || '')).join(' ')}`.toLowerCase();
        }
        for (const e of this.scanData.formulaErrors || []) {
          e._searchIndex = `${e.math} ${e.error} ${e.chapterTitle} ${e.line}`.toLowerCase();
        }
      }

      this.selectedChapter = 'all';
      this.renderChapterOptions();
      this.renderAll();
    } catch (err: unknown) {
      this.error = (err as Error)?.message || String(err);
      this.renderError();
    } finally {
      this.loading = false;
      this.renderLoading(false);
    }
  }

  private renderBookSelect() {
    const select = this.rootEl?.querySelector<HTMLSelectElement>('.insp-book-select');
    if (!select) return;

    select.innerHTML = '';
    for (const b of this.booksList) {
      const opt = document.createElement('option');
      opt.value = b.key;
      opt.textContent = `[${b.colTitle}] ${b.bookTitle}`;
      if (b.key === this.currentBookKey) opt.selected = true;
      select.appendChild(opt);
    }
  }

  private renderLoading(isLoading: boolean) {
    const refreshBtn = this.rootEl?.querySelector('.insp-refresh-btn');
    refreshBtn?.classList.toggle('spinning', isLoading);
  }

  private renderError() {
    const listEl = this.rootEl?.querySelector('.insp-list');
    if (!listEl) return;
    listEl.innerHTML = `
      <div class="insp-empty-state">
        <svg class="insp-empty-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <div class="insp-empty-title">结构扫描未完成</div>
        <div class="insp-empty-desc">${this.escapeHtml(this.error || '无法获取书籍结构数据')}</div>
      </div>
    `;
  }

  private computeFilteredState(): FilteredState {
    if (!this.scanData) {
      return {
        filteredModules: [],
        filteredSameChapterDups: [],
        filteredAllDups: [],
        filteredSuspicious: [],
        filteredFormulaErrors: [],
        kindCounts: {},
        totalMatchedKindCount: 0,
      };
    }

    const q = this.searchQuery;
    const kind = this.selectedKind;
    const chapter = this.selectedChapter;

    const filteredModules: ModuleItem[] = [];
    const filteredSuspicious: ModuleItem[] = [];
    const kindCounts: Record<string, number> = {};
    let totalMatchedKindCount = 0;

    for (const m of this.scanData.modules) {

      if (chapter !== 'all' && m.chapterSlug !== chapter) continue;

      if (q && m._searchIndex && !m._searchIndex.includes(q)) continue;

      totalMatchedKindCount++;
      kindCounts[m.kind] = (kindCounts[m.kind] || 0) + 1;

      if (kind !== 'all' && m.kind !== kind) continue;

      filteredModules.push(m);
      if (m.suspiciousReasons.length > 0) {
        filteredSuspicious.push(m);
      }
    }

    const filteredSameChapterDups: DuplicateGroup[] = [];
    for (const g of this.scanData.sameChapterDuplicates) {
      if (chapter !== 'all' && g.chapterSlug !== chapter) continue;
      if (q && g._searchIndex && !g._searchIndex.includes(q)) continue;

      let matchedItems = g.items;
      if (kind !== 'all') {
        matchedItems = matchedItems.filter((i) => i.kind === kind);
      }
      if (matchedItems.length > 1) {
        filteredSameChapterDups.push({ ...g, items: matchedItems, count: matchedItems.length });
      }
    }

    const filteredAllDups: DuplicateGroup[] = [];
    for (const g of this.scanData.allDuplicates) {
      if (q && g._searchIndex && !g._searchIndex.includes(q)) continue;

      let matchedItems = g.items;
      if (kind !== 'all') {
        matchedItems = matchedItems.filter((i) => i.kind === kind);
      }
      if (matchedItems.length > 1) {
        filteredAllDups.push({ ...g, items: matchedItems, count: matchedItems.length });
      }
    }

    const filteredFormulaErrors: FormulaErrorItem[] = [];
    for (const e of this.scanData.formulaErrors || []) {
      if (chapter !== 'all' && e.chapterSlug !== chapter) continue;
      if (q && e._searchIndex && !e._searchIndex.includes(q)) continue;
      filteredFormulaErrors.push(e);
    }

    return {
      filteredModules,
      filteredSameChapterDups,
      filteredAllDups,
      filteredSuspicious,
      filteredFormulaErrors,
      kindCounts,
      totalMatchedKindCount,
    };
  }

  private renderAll() {
    if (!this.scanData) return;

    const titleEl = this.rootEl?.querySelector('.insp-header-title');
    if (titleEl) {
      const bookTitle = this.scanData.bookTitle || this.scanData.bookSlug;
      titleEl.textContent = bookTitle;
      titleEl.title = bookTitle;
    }

    const state = this.computeFilteredState();

    this.renderKindFilterChips(state.kindCounts, state.totalMatchedKindCount);

    this.updateTabBadges(state);

    this.renderList(state);
  }

  private updateTabBadges(state: FilteredState) {
    if (!this.scanData) return;
    const isFiltering = !!this.searchQuery || this.selectedChapter !== 'all' || this.selectedKind !== 'all';

    this.setTabBadge('all', isFiltering ? state.filteredModules.length : this.scanData.totalModules);
    this.setTabBadge('same_chapter_dups', isFiltering ? state.filteredSameChapterDups.length : this.scanData.stats.sameChapterDupsCount);
    this.setTabBadge('all_dups', isFiltering ? state.filteredAllDups.length : this.scanData.stats.allDupsCount);
    this.setTabBadge('suspicious', isFiltering ? state.filteredSuspicious.length : this.scanData.stats.suspiciousCount);
    this.setTabBadge('formula_errors', isFiltering ? state.filteredFormulaErrors.length : (this.scanData.stats.formulaErrorsCount || 0));
  }

  private setTabBadge(tab: string, count: number) {
    const badge = this.rootEl?.querySelector(`.insp-tab[data-tab="${tab}"] .insp-tab-count`);
    if (badge) {
      const next = String(count);
      if (badge.textContent !== next) {
        badge.textContent = next;
      }
      badge.classList.toggle('has-items', count > 0);
      if (tab === 'same_chapter_dups' || tab === 'suspicious' || tab === 'formula_errors') {
        badge.classList.toggle('danger', count > 0);
      }
    }
  }

  private renderKindFilterChips(kindCounts: Record<string, number>, totalMatched: number) {
    const container = this.rootEl?.querySelector('.insp-kind-chips');
    if (!container || !this.scanData) return;

    const byKind = this.scanData.stats.byKind || {};
    const kinds = Object.keys(byKind);

    const existingChips = container.querySelectorAll<HTMLButtonElement>('.insp-chip');
    if (existingChips.length !== kinds.length + 1) {
      let html = `<button type="button" class="insp-chip ${this.selectedKind === 'all' ? 'active' : ''}" data-kind="all"><span>全部</span> <span class="insp-chip-count">${totalMatched}</span></button>`;
      for (const k of kinds) {
        const count = kindCounts[k] || 0;
        const active = this.selectedKind === k ? 'active' : '';
        const label = KIND_LABEL_MAP[k] || k;
        html += `<button type="button" class="insp-chip ${active} ${count === 0 ? 'insp-chip-empty' : ''}" data-kind="${k}"><span>${label}</span> <span class="insp-chip-count">${count}</span></button>`;
      }
      container.innerHTML = html;

      container.querySelectorAll<HTMLButtonElement>('.insp-chip').forEach((chip) => {
        chip.addEventListener('click', () => {
          this.selectedKind = chip.getAttribute('data-kind') || 'all';
          container.querySelectorAll('.insp-chip').forEach((c) => c.classList.remove('active'));
          chip.classList.add('active');
          this.renderAll();
        });
      });
    } else {
      existingChips.forEach((chip) => {
        const kind = chip.getAttribute('data-kind');
        const countEl = chip.querySelector('.insp-chip-count');
        if (!kind || !countEl) return;

        const cnt = kind === 'all' ? totalMatched : (kindCounts[kind] || 0);
        countEl.textContent = String(cnt);
        chip.classList.toggle('insp-chip-empty', cnt === 0);
        chip.classList.toggle('active', this.selectedKind === kind);
      });
    }
  }

  private renderChapterOptions() {
    const select = this.rootEl?.querySelector<HTMLSelectElement>('.insp-chapter-select');
    if (!select || !this.scanData) return;

    const chapters = new Map<string, string>();
    for (const m of this.scanData.modules) {
      chapters.set(m.chapterSlug, m.chapterTitle);
    }

    let html = '<option value="all">全书所有章节</option>';
    for (const [slug, title] of chapters.entries()) {
      html += `<option value="${slug}" ${this.selectedChapter === slug ? 'selected' : ''}>${title}</option>`;
    }
    select.innerHTML = html;
  }

  private renderList(state: FilteredState) {
    const listEl = this.rootEl?.querySelector('.insp-list');
    if (!listEl || !this.scanData) return;

    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    if (this.activeTab === 'all') {
      this.currentRenderMode = 'flat';
      this.currentItems = state.filteredModules;
      this.renderInitialChunk(listEl, '暂无匹配的模块条目', false);
    } else if (this.activeTab === 'same_chapter_dups') {
      this.currentRenderMode = 'same_dups';
      this.currentItems = state.filteredSameChapterDups;
      this.renderInitialChunk(listEl, '未检出同章命名冲突', false);
    } else if (this.activeTab === 'all_dups') {
      this.currentRenderMode = 'all_dups';
      this.currentItems = state.filteredAllDups;
      this.renderInitialChunk(listEl, '未检出全书重名模块', false);
    } else if (this.activeTab === 'suspicious') {
      this.currentRenderMode = 'suspicious';
      this.currentItems = state.filteredSuspicious;
      this.renderInitialChunk(listEl, '未发现结构审查异常项', true);
    } else if (this.activeTab === 'formula_errors') {
      this.currentRenderMode = 'formula_errors';
      this.currentItems = state.filteredFormulaErrors;
      this.renderInitialChunk(listEl, '未发现公式语法异常', false);
    }
  }

  private renderInitialChunk(listEl: Element, emptyText: string, showReasons = false) {
    const totalCount = this.currentItems.length;

    if (!totalCount) {
      const isReviewMode = this.activeTab === 'suspicious';
      const isFormulaMode = this.activeTab === 'formula_errors';
      listEl.innerHTML = `
        <div class="insp-empty-state">
          <svg class="insp-empty-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            ${
              isReviewMode || isFormulaMode || this.activeTab === 'same_chapter_dups' || this.activeTab === 'all_dups'
                ? '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><polyline points="9 12 11 14 15 10"></polyline>'
                : '<circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="8" y1="11" x2="14" y2="11"></line>'
            }
          </svg>
          <div class="insp-empty-title">${emptyText}</div>
          <div class="insp-empty-desc">${
            isFormulaMode
              ? '当前书籍全量 KaTeX 数学公式解析校验 100% 通过'
              : isReviewMode
                ? '全书各模块标题与正文结构校验通过'
                : '请尝试调整检索关键词或切换章节/分类筛选'
          }</div>
        </div>
      `;
      return;
    }

    const isFiltered = !!this.searchQuery || this.selectedChapter !== 'all' || this.selectedKind !== 'all';
    let filterDetails = '';
    if (this.searchQuery) {
      filterDetails += `<span class="insp-status-badge">“${this.escapeHtml(this.searchQuery)}”</span>`;
    }
    if (this.selectedKind !== 'all' && (this.currentRenderMode === 'flat' || this.currentRenderMode === 'suspicious')) {
      const kindLabel = KIND_LABEL_MAP[this.selectedKind] || this.selectedKind;
      filterDetails += (filterDetails ? ' · ' : '') + `<span class="insp-status-badge">${this.escapeHtml(kindLabel)}</span>`;
    }

    let countDesc = '';
    if (this.currentRenderMode === 'flat') {
      const bookTotal = this.scanData?.totalModules || 0;
      countDesc = isFiltered
        ? `<div class="insp-count-status"><span class="insp-count-highlight">匹配 ${totalCount} 项</span><span class="insp-count-total-hint">（全书 ${bookTotal}）</span>${filterDetails ? ` · ${filterDetails}` : ''}</div>`
        : `<div class="insp-count-status"><span class="insp-count-normal">全书共 ${bookTotal} 个模块条目</span></div>`;
    } else if (this.currentRenderMode === 'same_dups') {
      countDesc = `<div class="insp-count-status"><span class="insp-count-highlight">检出 ${totalCount} 组同章冲突</span></div>`;
    } else if (this.currentRenderMode === 'all_dups') {
      countDesc = `<div class="insp-count-status"><span class="insp-count-highlight">跨章聚合 ${totalCount} 组同名条目</span></div>`;
    } else if (this.currentRenderMode === 'suspicious') {
      countDesc = `<div class="insp-count-status"><span class="insp-count-highlight">审查发现 ${totalCount} 处结构异常</span></div>`;
    } else if (this.currentRenderMode === 'formula_errors') {
      countDesc = `<div class="insp-count-status"><span class="insp-count-highlight">检出 ${totalCount} 处公式语法异常</span></div>`;
    }

    let html = `<div class="insp-items-count-hint">${countDesc}</div>`;

    const initialSlice = this.currentItems.slice(0, CHUNK_SIZE);
    html += this.renderChunkHtml(initialSlice, showReasons);

    if (totalCount > CHUNK_SIZE) {
      html += `<div class="insp-sentinel" data-sentinel="true" style="height: 24px; display: flex; align-items: center; justify-content: center; font-size: 11px; color: var(--insp-text-3); opacity: 0.6;">向下滚动加载更多...</div>`;
    }

    listEl.innerHTML = html;
    this.currentRenderedCount = initialSlice.length;

    if (totalCount > CHUNK_SIZE) {
      const sentinelEl = listEl.querySelector('.insp-sentinel');
      const bodyEl = this.rootEl?.querySelector('.insp-body');
      if (sentinelEl && bodyEl) {
        this.observer = new IntersectionObserver(
          (entries) => {
            if (entries[0].isIntersecting) {
              this.appendNextChunk(listEl, sentinelEl, showReasons);
            }
          },
          { root: bodyEl, rootMargin: '250px' }
        );
        this.observer.observe(sentinelEl);
      }
    }
  }

  private appendNextChunk(listEl: Element, sentinelEl: Element, showReasons: boolean) {
    if (this.currentRenderedCount >= this.currentItems.length) {
      if (this.observer) this.observer.disconnect();
      sentinelEl.remove();
      return;
    }

    const nextSlice = this.currentItems.slice(this.currentRenderedCount, this.currentRenderedCount + CHUNK_SIZE);
    if (!nextSlice.length) {
      if (this.observer) this.observer.disconnect();
      sentinelEl.remove();
      return;
    }

    const chunkHtml = this.renderChunkHtml(nextSlice, showReasons);
    sentinelEl.insertAdjacentHTML('beforebegin', chunkHtml);
    this.currentRenderedCount += nextSlice.length;

    if (this.currentRenderedCount >= this.currentItems.length) {
      if (this.observer) this.observer.disconnect();
      sentinelEl.remove();
    }
  }

  private renderChunkHtml(items: (ModuleItem | DuplicateGroup | FormulaErrorItem)[], showReasons: boolean): string {
    let html = '';
    if (this.currentRenderMode === 'flat' || this.currentRenderMode === 'suspicious') {
      for (const item of items) {
        html += this.renderItemCardHtml(item as ModuleItem, showReasons);
      }
    } else if (this.currentRenderMode === 'same_dups') {
      for (const group of items) {
        html += this.renderSameDupGroupHtml(group as DuplicateGroup);
      }
    } else if (this.currentRenderMode === 'all_dups') {
      for (const group of items) {
        html += this.renderAllDupGroupHtml(group as DuplicateGroup);
      }
    } else if (this.currentRenderMode === 'formula_errors') {
      for (const item of items) {
        html += this.renderFormulaErrorCardHtml(item as FormulaErrorItem);
      }
    }
    return html;
  }

  private setLocatedItem(itemId: string) {
    if (!itemId) return;
    this.locatedItemId = itemId;
    const listEl = this.rootEl?.querySelector('.insp-list');
    if (!listEl) return;
    listEl.querySelectorAll('.insp-item-row.is-located').forEach((el) => {
      el.classList.remove('is-located');
    });
    const rows = listEl.querySelectorAll<HTMLElement>('.insp-item-row');
    for (const r of rows) {
      if (r.getAttribute('data-id') === itemId) {
        r.classList.add('is-located');
        break;
      }
    }
  }

  private parseTitleParts(cleanTitle: string, typeLabel: string): { kicker: string; title: string } {
    const clean = (cleanTitle || '').trim();
    if (clean.startsWith('[未命名') && clean.endsWith(']')) {
      return { kicker: typeLabel || '模块', title: '' };
    }

    const prefixRegex = /^(例|例题|定理|定义|性质|推论|引理|命题|公理|准则|习题|练习|微课)\s*([0-9]+(?:\.[0-9]+)*(?:-[0-9]+)?|[一二三四五六七八九十]+)\b\s*(.*)$/;
    const m = clean.match(prefixRegex);
    if (m) {
      const typeName = m[1] === '例' ? '例题' : m[1];
      const num = m[2];
      const rest = (m[3] || '').trim();
      const kicker = `${typeName} ${num}`;
      return { kicker, title: rest };
    }

    const numRegex = /^([0-9]+(?:\.[0-9]+)*)\s*(.*)$/;
    const nm = clean.match(numRegex);
    if (nm && typeLabel) {
      return { kicker: `${typeLabel} ${nm[1]}`, title: nm[2].trim() };
    }

    if (clean === typeLabel || clean === '解析' || clean === '思路分析' || clean === '标注说明' || clean === '教学导引') {
      return { kicker: clean, title: '' };
    }

    return { kicker: typeLabel || '条目', title: clean };
  }

  private renderSameDupGroupHtml(group: DuplicateGroup): string {
    return `
      <div class="insp-dup-group">
        <div class="insp-dup-group-head">
          <div class="insp-dup-group-title">
            <span class="insp-dup-title-text">${this.highlightText(group.title, this.searchQuery)}</span>
            <span class="insp-dup-count-chip">${group.count} 处冲突</span>
          </div>
          <div class="insp-dup-chapter">${this.escapeHtml(group.chapterTitle || group.filename || '')}</div>
        </div>
        <div class="insp-dup-group-body">
          ${group.items.map((i) => this.renderItemCardHtml(i, true)).join('')}
        </div>
      </div>
    `;
  }

  private renderAllDupGroupHtml(group: DuplicateGroup): string {
    return `
      <div class="insp-dup-group">
        <div class="insp-dup-group-head">
          <div class="insp-dup-group-title">
            <span class="insp-dup-title-text">${this.highlightText(group.title, this.searchQuery)}</span>
            <span class="insp-dup-count-chip" style="color: var(--insp-brand);">${group.count} 次引用</span>
            <span class="insp-dup-chapters-chip">跨 ${group.chaptersCount || 1} 章</span>
          </div>
        </div>
        <div class="insp-dup-group-body">
          ${group.items.map((i) => this.renderItemCardHtml(i, false)).join('')}
        </div>
      </div>
    `;
  }

  private renderFormulaErrorCardHtml(item: FormulaErrorItem): string {
    const filePos = `${item.file}:L${item.line}`;
    const editUrl = `${item.chapterUrl}?edit=1#L${item.line}`;
    const isLocated = this.locatedItemId === item.id;
    const isLocatedClass = isLocated ? 'is-located' : '';

    return `
      <div class="insp-item-row ${isLocatedClass}" data-id="${this.escapeHtml(item.id)}" data-url="${this.escapeHtml(item.url)}" data-slug="${this.escapeHtml(item.chapterSlug)}" data-line="${item.line}">
        <div class="insp-item-top">
          <div class="insp-item-heading">
            <span class="insp-item-kicker">公式异常 · ${this.escapeHtml(item.typeLabel)}</span>
            <h3 class="insp-item-title">${this.escapeHtml(item.chapterTitle)}:L${item.line}</h3>
          </div>
          <div class="insp-item-actions">
            <button type="button" class="insp-action-btn insp-copy-pos-btn" title="复制坐标" data-pos="${this.escapeHtml(filePos)}">
              <span>L${item.line}</span>
            </button>
            ${
              this.isDev
                ? `
              <a href="${this.escapeHtml(editUrl)}" class="insp-action-btn insp-edit-link" title="在在线精修工具中打开">
                <span>精修</span>
              </a>
            `
                : ''
            }
            <button type="button" class="insp-action-btn insp-jump-btn insp-action-jump" title="定位跳转至错误位置" data-url="${this.escapeHtml(item.url)}" data-line="${item.line}">
              <span>定位 ↗</span>
            </button>
          </div>
        </div>

        <div class="insp-item-reasons">
          <span class="insp-reason-tag">${this.escapeHtml(item.error)}</span>
        </div>

        <div class="insp-item-snippet" style="font-family: var(--insp-font-mono); font-size: 11px; margin-top: 3px;">${this.highlightText(item.snippet, this.searchQuery)}</div>
      </div>
    `;
  }

  private renderItemCardHtml(item: ModuleItem, showReasons: boolean): string {
    const reasonsHtml =
      this.isDev && showReasons && item.suspiciousReasons.length > 0
        ? `<div class="insp-item-reasons">${item.suspiciousReasons
            .map((r) => `<span class="insp-reason-tag"><span>${this.escapeHtml(r)}</span></span>`)
            .join('')}</div>`
        : '';

    const editBtnHtml = this.isDev
      ? `<button type="button" class="insp-action-btn insp-edit-link" data-action="edit" data-url="${this.escapeHtml(item.url)}" data-line="${item.line}" title="在在线精修工具中定位源码">
          <span>精修</span>
        </button>`
      : '';

    const { kicker, title } = this.parseTitleParts(item.cleanTitle, item.typeLabel);
    const highlightedKicker = this.highlightText(kicker, this.searchQuery);
    const highlightedTitle = title ? this.highlightText(title, this.searchQuery) : '';
    const highlightedSnippet = item.snippet ? this.highlightText(item.snippet, this.searchQuery) : '';
    const isLocated = this.locatedItemId === item.id;
    const isLocatedClass = isLocated ? 'is-located' : '';

    return `
      <article class="insp-item-row ${isLocatedClass}" data-id="${this.escapeHtml(item.id)}" data-url="${this.escapeHtml(item.url)}" data-chapter-url="${this.escapeHtml(item.chapterUrl)}" data-anchor="${this.escapeHtml(item.anchorId)}" data-line="${item.line}" data-file="${this.escapeHtml(item.file)}">
        <div class="insp-item-top">
          <div class="insp-item-heading">
            <span class="insp-item-kicker">${highlightedKicker}</span>
            ${title ? `<h3 class="insp-item-title">${highlightedTitle}</h3>` : ''}
          </div>
          <div class="insp-item-actions">
            <button type="button" class="insp-action-btn insp-copy-pos-btn" data-action="copy" data-location="${this.escapeHtml(item.file)}:${item.line}" title="复制坐标 ${this.escapeHtml(item.filename)}:L${item.line}">
              <span>L${item.line}</span>
            </button>
            ${editBtnHtml}
            <button type="button" class="insp-action-btn insp-jump-btn insp-action-jump" data-url="${this.escapeHtml(item.url)}" data-anchor="${this.escapeHtml(item.anchorId)}" data-line="${item.line}" title="定位跳转至正文卡片">
              <span>定位 ↗</span>
            </button>
          </div>
        </div>
        ${reasonsHtml}
        ${item.snippet ? `<p class="insp-item-snippet">${highlightedSnippet}</p>` : ''}
        <footer class="insp-item-meta">
          <span class="insp-meta-chapter" title="${this.escapeHtml(item.chapterTitle)}">${this.escapeHtml(item.chapterTitle)}</span>
          <span class="insp-meta-dot">·</span>
          <span class="insp-meta-file">L${item.line}</span>
        </footer>
      </article>
    `;
  }

  private highlightText(text: string, query: string): string {
    if (!text || !query) return this.escapeHtml(text);
    const escapedQ = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escapedQ})`, 'gi'));
    return parts
      .map((part) => {
        if (part.toLowerCase() === query.toLowerCase()) {
          return `<mark class="insp-search-match">${this.escapeHtml(part)}</mark>`;
        }
        return this.escapeHtml(part);
      })
      .join('');
  }

  private navigateTo(url: string, anchorId: string, line: number, itemId?: string) {
    if (!url) return;

    const targetUrl = new URL(url, location.href);
    const isSamePage = this.normalizePath(location.pathname) === this.normalizePath(targetUrl.pathname);

    if (isSamePage) {

      this.executeHighlight(anchorId, line);
      if (targetUrl.hash) {
        history.replaceState({ ...(history.state || {}), scrollY: window.scrollY }, '', targetUrl.href);
      }
    } else {

      const highlightTarget = { anchorId, line, itemId: itemId || this.locatedItemId, timestamp: Date.now() };
      sessionStorage.setItem('dsh-pending-highlight', JSON.stringify(highlightTarget));

      const spaNav = (window as unknown as Record<string, unknown>).__spaNavigate as
        | ((u: URL | string) => Promise<unknown>)
        | undefined;
      if (typeof spaNav === 'function') {
        spaNav(targetUrl);
      } else {
        location.href = targetUrl.href;
      }
    }
  }

  private openInEditor(url: string, line: string) {
    const targetUrl = new URL(url, location.href);
    targetUrl.searchParams.set('edit', '1');
    this.navigateTo(targetUrl.href, '', Number(line));
  }

  private normalizePath(p: string): string {
    if (!p) return '/';
    return p === '/' ? p : p.replace(/\/+$/, '');
  }

  private executeHighlight(anchorId: string, line: number) {
    let targetEl: HTMLElement | null = null;

    if (anchorId) {
      targetEl = document.getElementById(decodeURIComponent(anchorId));
    }
    if (!targetEl && line > 0) {
      targetEl = document.querySelector<HTMLElement>(`[data-src-line="${line}"]`);
    }
    if (!targetEl && anchorId) {
      targetEl = document.querySelector<HTMLElement>(`[data-title*="${decodeURIComponent(anchorId)}"]`);
    }

    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      targetEl.classList.remove('dsh-inspector-pulse');

      void targetEl.offsetWidth;
      targetEl.classList.add('dsh-inspector-pulse');

      setTimeout(() => {
        targetEl?.classList.remove('dsh-inspector-pulse');
      }, 2100);
    }
  }

  private setupPageLoadHighlight() {
    const handleHighlight = () => {
      try {
        const raw = sessionStorage.getItem('dsh-pending-highlight');
        if (!raw) return;
        sessionStorage.removeItem('dsh-pending-highlight');
        const target = JSON.parse(raw);
        if (target && Date.now() - target.timestamp < 10000) {
          if (target.itemId) {
            this.locatedItemId = target.itemId;
          }
          requestAnimationFrame(() => {
            setTimeout(() => {
              this.executeHighlight(target.anchorId, target.line);
              if (target.itemId) {
                this.setLocatedItem(target.itemId);
              }
            }, 60);
          });
        }
      } catch {

      }
    };

    document.addEventListener('astro:page-load', handleHighlight);
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      handleHighlight();
    } else {
      document.addEventListener('DOMContentLoaded', handleHighlight);
    }
  }

  private copyToClipboard(text: string) {
    navigator.clipboard?.writeText(text).then(
      () => this.showToast(`已复制坐标: ${text}`),
      () => this.showToast('复制坐标失败')
    );
  }

  private showToast(message: string) {
    let toast = this.rootEl?.querySelector('.insp-toast') as HTMLElement | null;
    if (!toast && this.rootEl) {
      toast = document.createElement('div');
      toast.className = 'insp-toast';
      this.rootEl.appendChild(toast);
    }
    if (toast) {
      toast.textContent = message;
      toast.classList.add('insp-toast-show');
      setTimeout(() => {
        toast?.classList.remove('insp-toast-show');
      }, 1800);
    }
  }

  private escapeHtml(str: string): string {
    return (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}

export function initModuleInspector() {

  const existingInBody = document.querySelector('body > #dsh-inspector-root');
  const allInstances = document.querySelectorAll('#dsh-inspector-root');
  if (existingInBody && allInstances.length > 1) {
    allInstances.forEach((el) => {
      if (el !== existingInBody) el.remove();
    });
  }

  let controller = (window as unknown as Record<string, unknown>).__dshModuleInspector as
    | ModuleInspectorController
    | undefined;
  if (!controller) {
    controller = new ModuleInspectorController();
    controller.init();
    (window as unknown as Record<string, unknown>).__dshModuleInspector = controller;
  } else {

    const rootEl = document.getElementById('dsh-inspector-root');
    if (rootEl && rootEl.parentElement !== document.body) {
      document.body.appendChild(rootEl);
    }
  }
}
