import { getAllBooks } from '../../config/collections.config.mjs';

export function initHomepageClient(): void {

  try {
    const raw = localStorage.getItem('astrolib_recent_reading');
    if (raw) {
      const data = JSON.parse(raw);
      if (data && data.url && data.chapterTitle) {
        const sec = document.getElementById('recent-reading-section');
        const bookEl = document.getElementById('recent-reading-book');
        const chapterEl = document.getElementById('recent-reading-chapter');
        const linkEl = document.getElementById('recent-reading-link');

        if (sec && chapterEl && linkEl) {
          if (bookEl) {
            const allBooks = getAllBooks();
            const bookMatch = allBooks.find(b => b.slug === data.bookSlug);
            bookEl.textContent = bookMatch?.title || data.bookTitle || '章节';
          }
          chapterEl.textContent = data.chapterTitle;
          (linkEl as HTMLAnchorElement).href = data.url;
          sec.style.display = 'block';
        }
      }
    }
  } catch {}

  const searchInput = document.getElementById('homepage-search-input') as HTMLInputElement | null;
  const clearBtn = document.getElementById('homepage-search-clear');
  const resultsSection = document.getElementById('book-results-section');
  const emptyBox = document.getElementById('catalogue-empty');
  const resetBtn = document.getElementById('catalogue-reset-btn');
  const cards = Array.from(document.querySelectorAll<HTMLElement>('.m3-book-card'));
  const chips = Array.from(document.querySelectorAll<HTMLElement>('.m3-filter-chip'));

  let activeChipId: string | null = null;

  function updateDisplay() {
    const query = (searchInput?.value || '').trim().toLowerCase();

    if (clearBtn) {
      clearBtn.classList.toggle('is-visible', query.length > 0);
    }

    if (!activeChipId && !query) {
      if (resultsSection) resultsSection.style.display = 'none';
      return;
    }

    if (resultsSection) resultsSection.style.display = 'block';

    let matchCount = 0;
    const activeChip = chips.find(c => c.getAttribute('data-discipline-id') === activeChipId);
    const chipType = activeChip?.getAttribute('data-type');
    const chipQuery = activeChip?.getAttribute('data-query')?.toLowerCase() || '';

    cards.forEach(card => {
      const text = card.getAttribute('data-search-text') || '';
      const colId = card.getAttribute('data-collection-id') || '';

      let matches = true;

      if (activeChipId) {
        if (chipType === 'collection') {
          matches = colId === chipQuery;
        } else if (chipType === 'keyword') {
          matches = text.includes(chipQuery);
        }
      }

      if (matches && query) {
        matches = text.includes(query);
      }

      card.style.display = matches ? 'flex' : 'none';
      if (matches) matchCount++;
    });

    if (emptyBox) {
      emptyBox.style.display = matchCount === 0 ? 'block' : 'none';
    }
  }

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      updateDisplay();
    });
  }

  if (clearBtn && searchInput) {
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      searchInput.focus();
      updateDisplay();
    });
  }

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      const id = chip.getAttribute('data-discipline-id');
      if (activeChipId === id) {

        activeChipId = null;
        chip.classList.remove('is-selected');
        chip.setAttribute('aria-pressed', 'false');
      } else {

        activeChipId = id;
        chips.forEach(c => {
          const isTarget = c === chip;
          c.classList.toggle('is-selected', isTarget);
          c.setAttribute('aria-pressed', isTarget ? 'true' : 'false');
        });
      }
      updateDisplay();
    });
  });

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      activeChipId = null;
      chips.forEach(c => {
        c.classList.remove('is-selected');
        c.setAttribute('aria-pressed', 'false');
      });
      updateDisplay();
    });
  }
}
