export function initLibraryClient(): void {
      interface FilterState {
        query: string;
        stage: string;
        category: string;
        subject: string;
        sortBy: string;
      }

      const state: FilterState = {
        query: '',
        stage: 'all',
        category: 'all',
        subject: 'all',
        sortBy: 'default',
      };

      const searchInput = document.getElementById('lib-search-input') as HTMLInputElement;
      const searchClearBtn = document.getElementById('lib-search-clear');
      const booksContainer = document.getElementById('books-list');
      const activeFiltersContainer = document.getElementById('active-filters-container');
      const sortSelect = document.getElementById('sort-select') as HTMLSelectElement;
      const emptyBox = document.getElementById('lib-empty-box');

      const modal = document.getElementById('details-modal');
      const modalClose = document.getElementById('dialog-close-btn');
      const dialogTitle = document.getElementById('dialog-title');
      const dialogAuthor = document.getElementById('dialog-author');
      const dialogDesc = document.getElementById('dialog-desc');
      const dialogPublisher = document.getElementById('dialog-publisher');
      const dialogIsbn = document.getElementById('dialog-isbn');
      const dialogEdition = document.getElementById('dialog-edition');
      const dialogStage = document.getElementById('dialog-stage');
      const dialogReadBtn = document.getElementById('dialog-read-btn') as HTMLAnchorElement;
      const dialogEpubBtn = document.getElementById('dialog-epub-btn') as HTMLAnchorElement;

      function parseUrlParams() {
        const params = new URLSearchParams(window.location.search);
        if (params.has('q')) {
          state.query = params.get('q') || '';
          if (searchInput) searchInput.value = state.query;
        }
        if (params.has('stage')) state.stage = params.get('stage') || 'all';
        if (params.has('type') || params.has('category')) {
          state.category = params.get('type') || params.get('category') || 'all';
        }
        if (params.has('subject')) state.subject = params.get('subject') || 'all';
        if (params.has('focus') && searchInput) {
          setTimeout(() => searchInput.focus(), 150);
        }
      }

      function updateUrl() {
        const params = new URLSearchParams();
        if (state.query) params.set('q', state.query);
        if (state.stage !== 'all') params.set('stage', state.stage);
        if (state.category !== 'all') params.set('type', state.category);
        if (state.subject !== 'all') params.set('subject', state.subject);
        const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
        window.history.replaceState({}, '', newUrl);
      }

      function renderActiveChips() {
        if (!activeFiltersContainer) return;
        const chips: string[] = [];

        if (state.query) {
          chips.push(`<span class="filter-tag">检索: "${state.query}" <span class="tag-remove" data-clear="query">✕</span></span>`);
        }
        if (state.stage !== 'all') {
          const label = state.stage === 'high-school' ? '高中' : state.stage === 'university' ? '大学本科' : state.stage;
          chips.push(`<span class="filter-tag">学段: ${label} <span class="tag-remove" data-clear="stage">✕</span></span>`);
        }
        if (state.category !== 'all') {
          const label = state.category === 'supplement' ? '教辅' : state.category === 'textbook' ? '教材' : '课后习题';
          chips.push(`<span class="filter-tag">类别: ${label} <span class="tag-remove" data-clear="category">✕</span></span>`);
        }
        if (state.subject !== 'all') {
          const label = state.subject === 'math' ? '数学' : '物理';
          chips.push(`<span class="filter-tag">学科: ${label} <span class="tag-remove" data-clear="subject">✕</span></span>`);
        }

        const hasFilters = chips.length > 0;
        activeFiltersContainer.innerHTML = `
          <span class="results-summary">收录书目：<strong id="matched-count">0</strong> 部</span>
          ${chips.join('')}
          ${hasFilters ? `<button type="button" class="clear-filters-btn" id="clear-all-btn">清空筛选</button>` : ''}
        `;

        activeFiltersContainer.querySelectorAll('.tag-remove').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const clearType = (e.currentTarget as HTMLElement).dataset.clear;
            if (clearType === 'query') {
              state.query = '';
              if (searchInput) searchInput.value = '';
            } else if (clearType === 'stage') state.stage = 'all';
            else if (clearType === 'category') state.category = 'all';
            else if (clearType === 'subject') state.subject = 'all';

            syncUI();
            applyFilters();
          });
        });

        document.getElementById('clear-all-btn')?.addEventListener('click', resetAll);
      }

      function resetAll() {
        state.query = '';
        state.stage = 'all';
        state.category = 'all';
        state.subject = 'all';
        if (searchInput) searchInput.value = '';
        syncUI();
        applyFilters();
      }

      function syncUI() {
        document.querySelectorAll('.dim-btn').forEach(btn => {
          const b = btn as HTMLElement;
          const type = b.dataset.filterType;
          const val = b.dataset.filterVal;
          if (type === 'stage') b.classList.toggle('active', state.stage === val);
          if (type === 'category') b.classList.toggle('active', state.category === val);
          if (type === 'subject') b.classList.toggle('active', state.subject === val);
        });

        if (searchClearBtn) {
          searchClearBtn.classList.toggle('is-active', state.query.trim().length > 0);
        }
      }

      function applyFilters() {
        if (!booksContainer) return;
        const rows = Array.from(booksContainer.querySelectorAll('.lib-book-row')) as HTMLElement[];
        const q = state.query.toLowerCase().trim();

        let visibleCount = 0;
        const visibleRows: HTMLElement[] = [];

        rows.forEach(row => {
          const title = (row.dataset.title || '').toLowerCase();
          const author = (row.dataset.author || '').toLowerCase();
          const publisher = (row.dataset.publisher || '').toLowerCase();
          const isbn = (row.dataset.isbn || '').toLowerCase();
          const stage = row.dataset.stage || '';
          const category = row.dataset.category || '';
          const subject = row.dataset.subject || '';
          const tags = (row.dataset.tags || '').toLowerCase();
          const desc = (row.dataset.desc || '').toLowerCase();

          const matchStage = state.stage === 'all' || stage === state.stage;
          const matchCat = state.category === 'all' || category === state.category;
          const matchSub = state.subject === 'all' || subject === state.subject;
          const matchQuery = !q ||
            title.includes(q) ||
            author.includes(q) ||
            publisher.includes(q) ||
            isbn.includes(q) ||
            tags.includes(q) ||
            desc.includes(q);

          if (matchStage && matchCat && matchSub && matchQuery) {
            row.style.display = '';
            visibleCount++;
            visibleRows.push(row);
          } else {
            row.style.display = 'none';
          }
        });

        if (state.sortBy === 'title-asc') {
          visibleRows.sort((a, b) => (a.dataset.title || '').localeCompare(b.dataset.title || '', 'zh-CN'));
        } else if (state.sortBy === 'stage-asc') {
          visibleRows.sort((a, b) => (a.dataset.stage || '').localeCompare(b.dataset.stage || ''));
        } else if (state.sortBy === 'stage-desc') {
          visibleRows.sort((a, b) => (b.dataset.stage || '').localeCompare(a.dataset.stage || ''));
        }
        visibleRows.forEach(r => booksContainer.appendChild(r));

        renderActiveChips();
        const countEl = document.getElementById('matched-count');
        if (countEl) countEl.innerText = String(visibleCount);

        if (emptyBox) emptyBox.style.display = visibleCount === 0 ? 'block' : 'none';
        updateUrl();
      }

      function openModal(row: HTMLElement) {
        if (!modal) return;
        const title = row.dataset.title || '';
        const author = row.dataset.author || '';
        const publisher = row.dataset.publisher || '未注明';
        const isbn = row.dataset.isbn || '无';
        const desc = row.dataset.desc || '';
        const stage = row.dataset.stage === 'high-school' ? '高中' : '大学本科';
        const edition = row.dataset.edition || '标准数字化版';
        const entry = row.dataset.entry || '#';
        const epub = row.dataset.epub || '#';
        const hasEpub = row.dataset.hasEpub === '1';

        if (dialogTitle) dialogTitle.innerText = title;
        if (dialogAuthor) dialogAuthor.innerText = `著者：${author}`;
        if (dialogDesc) dialogDesc.innerText = desc;
        if (dialogPublisher) dialogPublisher.innerText = publisher;
        if (dialogIsbn) dialogIsbn.innerText = isbn;
        if (dialogEdition) dialogEdition.innerText = edition;
        if (dialogStage) dialogStage.innerText = stage;
        if (dialogReadBtn) dialogReadBtn.href = entry;
        if (dialogEpubBtn) {
          if (hasEpub) {
            dialogEpubBtn.href = epub;
            dialogEpubBtn.style.display = 'inline-block';
          } else {
            dialogEpubBtn.style.display = 'none';
          }
        }

        modal.classList.add('is-open');
      }

      function closeModal() {
        modal?.classList.remove('is-open');
      }

      function init() {
        parseUrlParams();
        syncUI();
        applyFilters();

        let timer: any;
        searchInput?.addEventListener('input', () => {
          clearTimeout(timer);
          timer = setTimeout(() => {
            state.query = searchInput.value;
            syncUI();
            applyFilters();
          }, 150);
        });

        searchClearBtn?.addEventListener('click', () => {
          if (searchInput) searchInput.value = '';
          state.query = '';
          syncUI();
          applyFilters();
          searchInput?.focus();
        });

        document.querySelectorAll('.dim-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const b = e.currentTarget as HTMLElement;
            if (b.classList.contains('disabled')) return;
            const type = b.dataset.filterType;
            const val = b.dataset.filterVal || 'all';

            if (type === 'stage') state.stage = val;
            if (type === 'category') state.category = val;
            if (type === 'subject') state.subject = val;

            syncUI();
            applyFilters();
          });
        });

        sortSelect?.addEventListener('change', () => {
          state.sortBy = sortSelect.value;
          applyFilters();
        });

        document.getElementById('lib-empty-reset')?.addEventListener('click', resetAll);

        document.querySelectorAll('.btn-modal-trigger').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const row = (e.currentTarget as HTMLElement).closest('.lib-book-row') as HTMLElement;
            if (row) openModal(row);
          });
        });

        modalClose?.addEventListener('click', closeModal);
        modal?.addEventListener('click', (e) => {
          if (e.target === modal) closeModal();
        });
        window.addEventListener('keydown', (e) => {
          if (e.key === 'Escape') closeModal();
        });
      }

      init();
}
