/**
 * src/scripts/pages/index-client.ts
 * 首页客户端交互控制器：最近阅读记录解析渲染与教材实时搜索/Chip 过滤
 */

import { getAllBooks } from '../../config/collections.config.mjs';

export function initHomepageClient(): void {
  // 1. 读取并渲染最近阅读记录 (动态基于 collections.config)
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

  // 2. 首页 Filter Chip 驱动式教材展示与实时搜索
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

    // 切换 Clear 按钮可见性
    if (clearBtn) {
      clearBtn.classList.toggle('is-visible', query.length > 0);
    }

    // 核心逻辑：仅在 chip 选中或者搜索框中有内容时，才展现书籍容器
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

      // Chip 过滤
      if (activeChipId) {
        if (chipType === 'collection') {
          matches = colId === chipQuery;
        } else if (chipType === 'keyword') {
          matches = text.includes(chipQuery);
        }
      }

      // 搜索输入过滤
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

  // 绑定搜索输入
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      updateDisplay();
    });
  }

  // 绑定清空按钮
  if (clearBtn && searchInput) {
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      searchInput.focus();
      updateDisplay();
    });
  }

  // 绑定 Chip 点击 (点击已激活的 Chip 则取消选中并重新收起列表)
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      const id = chip.getAttribute('data-discipline-id');
      if (activeChipId === id) {
        // 反选取消
        activeChipId = null;
        chip.classList.remove('is-selected');
        chip.setAttribute('aria-pressed', 'false');
      } else {
        // 选中新 chip
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

  // 绑定空状态重置按钮
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
