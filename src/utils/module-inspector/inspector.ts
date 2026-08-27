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
  };
  modules: ModuleItem[];
  sameChapterDuplicates: DuplicateGroup[];
  allDuplicates: DuplicateGroup[];
  suspiciousItems: ModuleItem[];
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

class ModuleInspectorController {
  private rootEl: HTMLElement | null = null;
  private isOpen = false;
  private isDev = false;
  private activeTab: 'all' | 'same_chapter_dups' | 'all_dups' | 'suspicious' = 'all';
  private selectedKind = 'all';
  private selectedChapter = 'all';
  private searchQuery = '';
  private currentBookKey = '';
  private booksList: BookOption[] = [];
  private scanData: ScanResult | null = null;
  private loading = false;
  private error: string | null = null;

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
    searchInput?.addEventListener('input', () => {
      this.searchQuery = searchInput.value.trim().toLowerCase();
      this.renderList();
    });

    this.rootEl.querySelector('.insp-search-clear')?.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      this.searchQuery = '';
      this.renderList();
    });

    this.rootEl.querySelectorAll<HTMLButtonElement>('.insp-tab').forEach((tabBtn) => {
      tabBtn.addEventListener('click', () => {
        const tab = tabBtn.getAttribute('data-tab') as typeof this.activeTab;
        if (tab) {
          this.activeTab = tab;
          this.rootEl?.querySelectorAll('.insp-tab').forEach((b) => b.classList.remove('active'));
          tabBtn.classList.add('active');
          this.renderList();
        }
      });
    });

    const chapterSelect = this.rootEl.querySelector<HTMLSelectElement>('.insp-chapter-select');
    chapterSelect?.addEventListener('change', () => {
      this.selectedChapter = chapterSelect.value;
      this.renderList();
    });

    const listContainer = this.rootEl.querySelector('.insp-body');
    listContainer?.addEventListener('click', (e) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const copyBtn = target.closest<HTMLElement>('[data-action="copy"]');
      if (copyBtn) {
        e.stopPropagation();
        const loc = copyBtn.getAttribute('data-location') || '';
        if (loc) this.copyToClipboard(loc);
        return;
      }

      const editBtn = target.closest<HTMLElement>('[data-action="edit"]');
      if (editBtn) {
        e.stopPropagation();
        const itemUrl = editBtn.getAttribute('data-url') || '';
        const line = editBtn.getAttribute('data-line') || '';
        this.openInEditor(itemUrl, line);
        return;
      }

      const cardRow = target.closest<HTMLElement>('.insp-item-row');
      if (cardRow) {
        const itemUrl = cardRow.getAttribute('data-url') || '';
        const anchorId = cardRow.getAttribute('data-anchor') || '';
        const line = Number(cardRow.getAttribute('data-line') || '0');
        this.navigateTo(itemUrl, anchorId, line);
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
    }, 150);
  }

  public close() {
    if (!this.rootEl) return;
    this.isOpen = false;
    this.rootEl.classList.remove('insp-open');
    document.body.classList.remove('insp-drawer-open');
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
        `/__inspector__/modules?col=${encodeURIComponent(col)}&book=${encodeURIComponent(book)}&t=${force ? Date.now() : 0}`
      ).catch(() => null);

      if (!res || !res.ok) {
        res = await fetch(`/inspector-data/${col}-${book}.json?t=${force ? Date.now() : 0}`).catch(() => null);
      }

      if (!res || !res.ok) {
        const errJson = await res?.json().catch(() => ({}));
        throw new Error(errJson?.message || `请求失败 HTTP ${res?.status || 404}（无法加载书籍模块索引）`);
      }

      this.scanData = await res.json();
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

  private renderAll() {
    if (!this.scanData) return;

    const titleEl = this.rootEl?.querySelector('.insp-header-title');
    if (titleEl) {
      titleEl.textContent = `模块速查 · ${this.scanData.bookTitle || this.scanData.bookSlug}`;
    }

    this.updateTabBadge('all', this.scanData.totalModules);
    this.updateTabBadge('same_chapter_dups', this.scanData.stats.sameChapterDupsCount);
    this.updateTabBadge('all_dups', this.scanData.stats.allDupsCount);
    this.updateTabBadge('suspicious', this.scanData.stats.suspiciousCount);

    this.renderKindFilterChips();

    this.renderChapterOptions();

    this.renderList();
  }

  private updateTabBadge(tab: string, count: number) {
    const badge = this.rootEl?.querySelector(`.insp-tab[data-tab="${tab}"] .insp-tab-count`);
    if (badge) {
      badge.textContent = String(count);
      badge.classList.toggle('has-items', count > 0);
      if (tab === 'same_chapter_dups' || tab === 'suspicious') {
        badge.classList.toggle('danger', count > 0);
      }
    }
  }

  private renderKindFilterChips() {
    const container = this.rootEl?.querySelector('.insp-kind-chips');
    if (!container || !this.scanData) return;

    const byKind = this.scanData.stats.byKind || {};
    const kinds = Object.keys(byKind);

    let html = `<button type="button" class="insp-chip ${this.selectedKind === 'all' ? 'active' : ''}" data-kind="all"><span>全部</span> <span class="insp-chip-count">${this.scanData.totalModules}</span></button>`;
    for (const k of kinds) {
      const count = byKind[k];
      const active = this.selectedKind === k ? 'active' : '';
      const label = KIND_LABEL_MAP[k] || k;
      html += `<button type="button" class="insp-chip ${active}" data-kind="${k}"><span>${label}</span> <span class="insp-chip-count">${count}</span></button>`;
    }
    container.innerHTML = html;

    container.querySelectorAll<HTMLButtonElement>('.insp-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        this.selectedKind = chip.getAttribute('data-kind') || 'all';
        container.querySelectorAll('.insp-chip').forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        this.renderList();
      });
    });
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

  private filterItems(items: ModuleItem[]): ModuleItem[] {
    return items.filter((item) => {

      if (this.selectedKind !== 'all' && item.kind !== this.selectedKind) {
        return false;
      }

      if (this.selectedChapter !== 'all' && item.chapterSlug !== this.selectedChapter) {
        return false;
      }

      if (this.searchQuery) {
        const q = this.searchQuery;
        const inTitle = item.cleanTitle.toLowerCase().includes(q) || item.rawTitle.toLowerCase().includes(q);
        const inSnippet = item.snippet.toLowerCase().includes(q);
        const inChapter = item.chapterTitle.toLowerCase().includes(q);
        const inType =
          item.typeLabel.toLowerCase().includes(q) ||
          item.kind.toLowerCase().includes(q) ||
          item.code.toLowerCase().includes(q);
        const inLine = String(item.line) === q;
        if (!inTitle && !inSnippet && !inChapter && !inType && !inLine) {
          return false;
        }
      }
      return true;
    });
  }

  private renderList() {
    const listEl = this.rootEl?.querySelector('.insp-list');
    if (!listEl || !this.scanData) return;

    if (this.activeTab === 'all') {
      const filtered = this.filterItems(this.scanData.modules);
      this.renderFlatModuleList(listEl, filtered, '暂无匹配的模块条目');
    } else if (this.activeTab === 'same_chapter_dups') {
      this.renderSameChapterDups(listEl);
    } else if (this.activeTab === 'all_dups') {
      this.renderAllDups(listEl);
    } else if (this.activeTab === 'suspicious') {
      const filtered = this.filterItems(this.scanData.suspiciousItems);
      this.renderFlatModuleList(listEl, filtered, '未发现结构审查异常项', true);
    }
  }

  private renderFlatModuleList(listEl: Element, items: ModuleItem[], emptyText: string, showReasons = false) {
    if (!items.length) {
      const isReviewMode = this.activeTab === 'suspicious';
      listEl.innerHTML = `
        <div class="insp-empty-state">
          <svg class="insp-empty-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            ${
              isReviewMode
                ? '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><polyline points="9 12 11 14 15 10"></polyline>'
                : '<circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="8" y1="11" x2="14" y2="11"></line>'
            }
          </svg>
          <div class="insp-empty-title">${emptyText}</div>
          <div class="insp-empty-desc">${isReviewMode ? '全书各模块标题与正文结构校验通过' : '请尝试调整检索关键词或切换章节筛选'}</div>
        </div>
      `;
      return;
    }

    let html = `<div class="insp-items-count-hint"><span>已展示 ${items.length} 个条目</span><span>${this.scanData?.bookTitle || ''}</span></div>`;
    for (const item of items) {
      html += this.renderItemCardHtml(item, showReasons);
    }
    listEl.innerHTML = html;
  }

  private renderSameChapterDups(listEl: Element) {
    if (!this.scanData) return;
    let groups = this.scanData.sameChapterDuplicates;

    if (this.selectedChapter !== 'all') {
      groups = groups.filter((g) => g.chapterSlug === this.selectedChapter);
    }
    if (this.selectedKind !== 'all') {
      groups = groups
        .map((g) => ({ ...g, items: g.items.filter((i) => i.kind === this.selectedKind) }))
        .filter((g) => g.items.length > 1);
    }
    if (this.searchQuery) {
      const q = this.searchQuery;
      groups = groups.filter(
        (g) =>
          g.title.toLowerCase().includes(q) ||
          g.chapterTitle?.toLowerCase().includes(q) ||
          g.items.some((i) => i.snippet.toLowerCase().includes(q))
      );
    }

    if (!groups.length) {
      listEl.innerHTML = `
        <div class="insp-empty-state">
          <svg class="insp-empty-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <div class="insp-empty-title">未检出同章命名冲突</div>
          <div class="insp-empty-desc">当前筛选条件下各章节模块编号规范且无冲突</div>
        </div>
      `;
      return;
    }

    let html = `<div class="insp-items-count-hint"><span>检出 ${groups.length} 组同章冲突条目</span><span>建议优先核对序号</span></div>`;
    for (const group of groups) {
      html += `
        <div class="insp-dup-group">
          <div class="insp-dup-group-head">
            <div class="insp-dup-group-title">
              <svg class="insp-dup-head-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
              <span class="insp-dup-title-text">${this.escapeHtml(group.title)}</span>
              <span class="insp-dup-count-chip">${group.count} 处重复</span>
            </div>
            <div class="insp-dup-chapter">${this.escapeHtml(group.chapterTitle || group.filename || '')}</div>
          </div>
          <div class="insp-dup-group-body">
            ${group.items.map((i) => this.renderItemCardHtml(i, true)).join('')}
          </div>
        </div>
      `;
    }
    listEl.innerHTML = html;
  }

  private renderAllDups(listEl: Element) {
    if (!this.scanData) return;
    let groups = this.scanData.allDuplicates;

    if (this.selectedKind !== 'all') {
      groups = groups
        .map((g) => ({ ...g, items: g.items.filter((i) => i.kind === this.selectedKind) }))
        .filter((g) => g.items.length > 1);
    }
    if (this.searchQuery) {
      const q = this.searchQuery;
      groups = groups.filter(
        (g) =>
          g.title.toLowerCase().includes(q) ||
          g.items.some((i) => i.snippet.toLowerCase().includes(q) || i.chapterTitle.toLowerCase().includes(q))
      );
    }

    if (!groups.length) {
      listEl.innerHTML = `
        <div class="insp-empty-state">
          <svg class="insp-empty-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <div class="insp-empty-title">未检出全书重名模块</div>
          <div class="insp-empty-desc">全书模块标识在各章节间分布清晰</div>
        </div>
      `;
      return;
    }

    let html = `<div class="insp-items-count-hint"><span>全书聚合 ${groups.length} 组同名条目</span><span>跨章节索引</span></div>`;
    for (const group of groups) {
      html += `
        <div class="insp-dup-group">
          <div class="insp-dup-group-head">
            <div class="insp-dup-group-title">
              <svg class="insp-dup-head-svg" style="color: var(--insp-brand);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                <polyline points="2 17 12 22 22 17"></polyline>
                <polyline points="2 12 12 17 22 12"></polyline>
              </svg>
              <span class="insp-dup-title-text">${this.escapeHtml(group.title)}</span>
              <span class="insp-dup-count-chip" style="color: var(--insp-brand); background: var(--insp-brand-soft); border-color: transparent;">${group.count} 次引用</span>
              <span class="insp-dup-chapters-chip">跨 ${group.chaptersCount || 1} 章节</span>
            </div>
          </div>
          <div class="insp-dup-group-body">
            ${group.items.map((i) => this.renderItemCardHtml(i, false)).join('')}
          </div>
        </div>
      `;
    }
    listEl.innerHTML = html;
  }

  private renderItemCardHtml(item: ModuleItem, showReasons: boolean): string {
    const reasonsHtml =
      this.isDev && showReasons && item.suspiciousReasons.length > 0
        ? `<div class="insp-item-reasons">${item.suspiciousReasons
            .map(
              (r) =>
                `<span class="insp-reason-tag"><svg class="insp-reason-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg><span>${this.escapeHtml(r)}</span></span>`
            )
            .join('')}</div>`
        : '';

    const editBtnHtml = this.isDev
      ? `<button type="button" class="insp-action-btn" data-action="edit" data-url="${this.escapeHtml(item.url)}" data-line="${item.line}" title="在在线精修工具中定位源码">
          <svg class="insp-btn-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 20h9"></path>
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
          </svg>
          <span>精修</span>
        </button>`
      : '';

    return `
      <div class="insp-item-row" data-url="${this.escapeHtml(item.url)}" data-chapter-url="${this.escapeHtml(item.chapterUrl)}" data-anchor="${this.escapeHtml(item.anchorId)}" data-line="${item.line}" data-file="${this.escapeHtml(item.file)}">
        <div class="insp-item-top">
          <div class="insp-item-badge-wrap">
            <span class="insp-item-chip ${item.theme || 'chip-default'}">
              <span class="insp-badge-code">${item.code || 'BLK'}</span>
              <span class="insp-badge-label">${item.typeLabel || item.tagName}</span>
            </span>
            <span class="insp-item-title">${this.escapeHtml(item.cleanTitle)}</span>
          </div>
          <div class="insp-item-actions">
            <button type="button" class="insp-action-btn" data-action="copy" data-location="${this.escapeHtml(item.file)}:${item.line}" title="复制坐标 ${this.escapeHtml(item.filename)}:L${item.line}">
              <svg class="insp-btn-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              <span>L${item.line}</span>
            </button>
            ${editBtnHtml}
            <button type="button" class="insp-action-btn insp-action-jump" title="定位跳转至正文卡片">
              <svg class="insp-btn-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="7"></circle>
                <line x1="12" y1="2" x2="12" y2="5"></line>
                <line x1="12" y1="19" x2="12" y2="22"></line>
                <line x1="2" y1="12" x2="5" y2="12"></line>
                <line x1="19" y1="12" x2="22" y2="12"></line>
              </svg>
              <span>定位</span>
            </button>
          </div>
        </div>
        ${reasonsHtml}
        <div class="insp-item-snippet">${this.escapeHtml(item.snippet || '（无正文描述）')}</div>
        <div class="insp-item-meta">
          <span class="insp-meta-chapter" title="${this.escapeHtml(item.chapterTitle)}">
            <svg class="insp-meta-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
            </svg>
            ${this.escapeHtml(item.chapterTitle)}
          </span>
          <span class="insp-meta-file" title="${this.escapeHtml(item.file)}">
            <svg class="insp-meta-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
            </svg>
            ${this.escapeHtml(item.filename)}:L${item.line}
          </span>
        </div>
      </div>
    `;
  }

  private navigateTo(url: string, anchorId: string, line: number) {
    if (!url) return;

    const highlightTarget = { anchorId, line, timestamp: Date.now() };
    sessionStorage.setItem('dsh-pending-highlight', JSON.stringify(highlightTarget));

    const targetUrl = new URL(url, location.href);
    const isSamePage = this.normalizePath(location.pathname) === this.normalizePath(targetUrl.pathname);

    if (isSamePage) {
      this.executeHighlight(anchorId, line);
    } else {

      const link = document.createElement('a');
      link.href = url;
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
  }

  private openInEditor(url: string, line: string) {

    const targetUrl = new URL(url, location.href);
    targetUrl.searchParams.set('edit', '1');
    this.navigateTo(targetUrl.href, '', Number(line));
  }

  private normalizePath(p: string): string {
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
          setTimeout(() => {
            this.executeHighlight(target.anchorId, target.line);
          }, 150);
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
