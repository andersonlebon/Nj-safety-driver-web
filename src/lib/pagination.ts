export const DEFAULT_PAGE_SIZE = 25;
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

/** Standard table query params synced to the URL. */
export type TableQuery = {
  page: number;
  pageSize: number;
  q: string;
  status: string;
  dateFrom: string;
  dateTo: string;
};

export type PaginatedResult<T> = {
  rows: T[];
  totalCount: number;
  query: TableQuery;
  totalPages: number;
};

const TABLE_KEYS = new Set(["page", "pageSize", "q", "status", "dateFrom", "dateTo"]);

function readParam(
  searchParams: Record<string, string | string[] | undefined> | undefined,
  key: string
): string {
  const raw = searchParams?.[key];
  if (Array.isArray(raw)) return raw[0] ?? "";
  return raw ?? "";
}

export function parseTableQuery(
  searchParams?: Record<string, string | string[] | undefined>,
  options?: { defaultPageSize?: number }
): TableQuery {
  const defaultPageSize = options?.defaultPageSize ?? DEFAULT_PAGE_SIZE;
  const pageRaw = Number.parseInt(readParam(searchParams, "page"), 10);
  const pageSizeRaw = Number.parseInt(readParam(searchParams, "pageSize"), 10);

  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
  const pageSize = PAGE_SIZE_OPTIONS.includes(pageSizeRaw as (typeof PAGE_SIZE_OPTIONS)[number])
    ? pageSizeRaw
    : defaultPageSize;

  return {
    page,
    pageSize,
    q: readParam(searchParams, "q").trim(),
    status: readParam(searchParams, "status").trim(),
    dateFrom: readParam(searchParams, "dateFrom").trim(),
    dateTo: readParam(searchParams, "dateTo").trim(),
  };
}

/** Extra URL keys to preserve when building pagination links (e.g. admin vehicle tabs). */
export function readPreserveParams(
  searchParams: Record<string, string | string[] | undefined> | undefined,
  keys: string[]
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of keys) {
    const value = readParam(searchParams, key);
    if (value) out[key] = value;
  }
  return out;
}

export function totalPagesFor(count: number, pageSize: number): number {
  return Math.max(1, Math.ceil(Math.max(count, 0) / pageSize));
}

export function rangeForPage(page: number, pageSize: number): { from: number; to: number } {
  const from = (page - 1) * pageSize;
  return { from, to: from + pageSize - 1 };
}

export function hasActiveTableFilters(query: TableQuery): boolean {
  return Boolean(query.q || query.status || query.dateFrom || query.dateTo);
}

export function buildTableHref(
  pathname: string,
  query: TableQuery,
  updates?: Partial<TableQuery & { page?: number }>,
  preserve?: Record<string, string>
): string {
  const merged: TableQuery = {
    ...query,
    ...updates,
    page: updates?.page ?? query.page,
  };

  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(preserve ?? {})) {
    if (value && !TABLE_KEYS.has(key)) params.set(key, value);
  }

  if (merged.q) params.set("q", merged.q);
  if (merged.status) params.set("status", merged.status);
  if (merged.dateFrom) params.set("dateFrom", merged.dateFrom);
  if (merged.dateTo) params.set("dateTo", merged.dateTo);
  if (merged.pageSize !== DEFAULT_PAGE_SIZE) {
    params.set("pageSize", String(merged.pageSize));
  }
  if (merged.page > 1) params.set("page", String(merged.page));

  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

export function paginatedResult<T>(
  rows: T[],
  totalCount: number,
  query: TableQuery
): PaginatedResult<T> {
  return {
    rows,
    totalCount,
    query,
    totalPages: totalPagesFor(totalCount, query.pageSize),
  };
}

/** Escape user input for PostgREST ilike patterns. */
export function escapeIlike(value: string): string {
  return value.replace(/[%_,]/g, (char) => `\\${char}`);
}

export function endOfDayIso(date: string): string {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end.toISOString();
}
