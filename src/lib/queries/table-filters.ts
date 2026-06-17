import type { TableQuery } from "@/lib/pagination";
import { endOfDayIso, escapeIlike } from "@/lib/pagination";

type FilterableQuery = {
  or: (filters: string) => FilterableQuery;
  eq: (column: string, value: string) => FilterableQuery;
  gte: (column: string, value: string) => FilterableQuery;
  lte: (column: string, value: string) => FilterableQuery;
  in: (column: string, values: string[]) => FilterableQuery;
};

type SearchColumn = { column: string; cast?: "text" };

export function applyTableQueryFilters<T extends FilterableQuery>(
  query: T,
  tableQuery: TableQuery,
  options: {
    searchColumns?: SearchColumn[];
    statusColumn?: string;
    dateColumn?: string;
  }
): T {
  let next = query;

  if (tableQuery.q && options.searchColumns?.length) {
    const term = escapeIlike(tableQuery.q);
    const parts = options.searchColumns.map(({ column, cast }) =>
      cast ? `${column}.${cast}.ilike.%${term}%` : `${column}.ilike.%${term}%`
    );
    next = next.or(parts.join(",")) as T;
  }

  if (tableQuery.status && options.statusColumn) {
    next = next.eq(options.statusColumn, tableQuery.status) as T;
  }

  if (tableQuery.dateFrom && options.dateColumn) {
    next = next.gte(options.dateColumn, tableQuery.dateFrom) as T;
  }

  if (tableQuery.dateTo && options.dateColumn) {
    next = next.lte(options.dateColumn, endOfDayIso(tableQuery.dateTo)) as T;
  }

  return next;
}
