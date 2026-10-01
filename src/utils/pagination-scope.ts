export interface PaginationLink {
  href: string;
  label: string;
}

export function normalizePath(path: string): string {
  if (!path) return '/';
  return path.endsWith('/') ? path : `${path}/`;
}

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

export function cleanDisplayTitle(label: string | undefined): string {
  if (!label) return '';
  return label.replace(/\$/g, '').trim();
}
