import { cleanSlug } from '../sidebar.mjs';

export interface SidebarLinkItem {
  type: 'link';
  label: string;
  href: string;
  isBook?: boolean;
  isCurrentBook?: boolean;
  [key: string]: any;
}

export interface SidebarGroupItem {
  type: 'group';
  label: string;
  href?: string;
  isCategory?: boolean;
  isBook?: boolean;
  isCurrentBook?: boolean;
  collapsed?: boolean;
  entries: Array<SidebarLinkItem | SidebarGroupItem>;
  [key: string]: any;
}

export type SidebarItem = SidebarLinkItem | SidebarGroupItem;

/**
 * 递归检测子节点是否包含某 URL 前缀
 */
function hasHrefPrefix(item: any, pfx: string): boolean {
  if (item.type === 'link' && typeof item.href === 'string' && item.href.startsWith(pfx)) {
    return true;
  }
  if (item.type === 'group' && Array.isArray(item.entries)) {
    return item.entries.some((child: any) => hasHrefPrefix(child, pfx));
  }
  return false;
}

/**
 * 从原始 sidebar 中提取任意图书的完整章节目录树
 */
function getBookEntries(sidebar: any[], colSlug: string, bookSlug: string): any[] | null {
  const bookPrefix = `/collections/${colSlug}/${bookSlug}/`;
  for (const entry of sidebar) {
    if (entry.type !== 'group') continue;
    for (const sub of entry.entries || []) {
      if (sub.type === 'group' && hasHrefPrefix(sub, bookPrefix)) {
        return sub.entries;
      }
    }
  }
  return null;
}

/**
 * 构造 Google Docs 规范的双级侧边栏结构：
 * 一级菜单：列出各合集分类（大学数学、大学物理）及同级别所有图书
 * 二级菜单：各图书均支持展开查看章节目录树，当前图书自动展开定位
 */
export function buildTwoTierSidebar(
  sidebar: any[],
  pathname: string,
  collections: any[]
): any[] {
  const bookMatch = pathname.match(/\/collections\/([^/]+)\/([^/]+)/);
  if (bookMatch) {
    const currentColSlug = bookMatch[1];
    const currentBookSlug = bookMatch[2];

    return collections.map((col) => {
      const isCurrentCol = col.slug === currentColSlug;
      const colLabel = col.title === '数学' ? '大学数学' : (col.title === '物理' ? '大学物理' : col.title);

      const bookEntries = col.books.map((book: any) => {
        const isCurrentBook = isCurrentCol && book.slug === currentBookSlug;
        const entryUrl = `/collections/${col.slug}/${book.slug}/${cleanSlug(book.entryPoint)}/`;
        const chapters = getBookEntries(sidebar, col.slug, book.slug);

        if (chapters && chapters.length > 0) {
          return {
            type: 'group',
            label: book.title,
            href: entryUrl,
            isBook: true,
            isCurrentBook,
            collapsed: !isCurrentBook,
            entries: chapters,
          };
        }

        return {
          type: 'link',
          label: book.title,
          href: entryUrl,
          isBook: true,
          isCurrentBook,
        };
      });

      return {
        type: 'group',
        label: colLabel,
        isCategory: true,
        collapsed: !isCurrentCol,
        entries: bookEntries,
      };
    });
  }

  if (pathname.startsWith('/dev')) {
    const kept = sidebar.filter(
      (entry) => entry.type === 'group' && (entry.label.includes('开发文档') || (entry.entries || []).some(
        (i: any) => (i.type === 'link' && typeof i.href === 'string' && i.href.startsWith('/dev')) ||
               (i.type === 'group' && (i.entries || []).some((sub: any) => typeof sub.href === 'string' && sub.href.startsWith('/dev')))
      ))
    );
    if (kept.length > 0) return kept;
  }

  return sidebar;
}
