/**
 * src/utils/pagination-scope.ts
 * 底栏翻页单书作用域隔离与标题清洗纯函数工具
 *
 * 遵循 Rule 7 (Utils Purity) & Rule 1 (UI is not a domain model)
 */

export interface PaginationLink {
  href: string;
  label: string;
}

/**
 * 标准化 URL 路径，统一补齐末尾斜杠以确保前缀精确匹配
 */
export function normalizePath(path: string): string {
  if (!path) return '/';
  return path.endsWith('/') ? path : `${path}/`;
}

/**
 * 提取当前页面作用域前缀，杜绝跨图书/跨顶级模块串链
 * - 图书路由：/collections/:col/:book/
 * - 文档路由：/:top/ (如 /dev/)
 */
export function getScopedBoundary(pathname: string): string | null {
  const bookMatch = pathname.match(/\/collections\/([^/]+)\/([^/]+)/);
  if (bookMatch) {
    return `/collections/${bookMatch[1]}/${bookMatch[2]}/`;
  }
  const topMatch = pathname.match(/^\/([^/]+)\//);
  if (topMatch) {
    return `/${topMatch[1]}/`;
  }
  return null;
}

/**
 * 根据当前页面作用域过滤翻页链接，超出作用域则安全截断为 undefined
 */
export function filterScopedPagination(
  pathname: string,
  prev: PaginationLink | undefined,
  next: PaginationLink | undefined
): { prev: PaginationLink | undefined; next: PaginationLink | undefined } {
  const currentScope = getScopedBoundary(pathname);
  if (!currentScope) {
    return { prev, next };
  }

  const safePrev = prev && normalizePath(prev.href).startsWith(currentScope) ? prev : undefined;
  const safeNext = next && normalizePath(next.href).startsWith(currentScope) ? next : undefined;

  return { prev: safePrev, next: safeNext };
}

/**
 * 辅助清洗翻页标题中的多余 Markdown 数学边界符（如误入或未闭合的 $ 符号），保持学术纯净
 */
export function cleanDisplayTitle(label: string | undefined): string {
  if (!label) return '';
  return label.replace(/\$/g, '').trim();
}
