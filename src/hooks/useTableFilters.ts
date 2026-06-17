"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export type TableSortDirection = "asc" | "desc";

export type UseTableFiltersOptions<T> = {
  rows: T[];
  pageSize?: number;
  /** Debounce ms for search input (default 250). */
  searchDebounceMs?: number;
  getSearchText: (row: T) => string;
  getStatus?: (row: T) => string | null | undefined;
  getDate?: (row: T) => string | null | undefined;
  initialSort?: {
    getValue: (row: T) => string | number;
    direction?: TableSortDirection;
  };
};

export function useTableFilters<T>({
  rows,
  pageSize = 25,
  searchDebounceMs = 250,
  getSearchText,
  getStatus,
  getDate,
  initialSort,
}: UseTableFiltersOptions<T>) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortDirection, setSortDirection] = useState<TableSortDirection>(
    initialSort?.direction ?? "desc"
  );
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim().toLowerCase());
    }, searchDebounceMs);
    return () => window.clearTimeout(timer);
  }, [search, searchDebounceMs]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, dateFrom, dateTo, sortDirection]);

  const filtered = useMemo(() => {
    let next = rows;

    if (debouncedSearch) {
      next = next.filter((row) =>
        getSearchText(row).toLowerCase().includes(debouncedSearch)
      );
    }

    if (statusFilter && getStatus) {
      next = next.filter((row) => (getStatus(row) ?? "") === statusFilter);
    }

    if ((dateFrom || dateTo) && getDate) {
      const fromMs = dateFrom ? new Date(dateFrom).getTime() : null;
      const toMs = dateTo ? new Date(dateTo).getTime() + 86_400_000 - 1 : null;
      next = next.filter((row) => {
        const raw = getDate(row);
        if (!raw) return false;
        const ms = new Date(raw).getTime();
        if (fromMs !== null && ms < fromMs) return false;
        if (toMs !== null && ms > toMs) return false;
        return true;
      });
    }

    if (initialSort) {
      const { getValue } = initialSort;
      next = [...next].sort((a, b) => {
        const av = getValue(a);
        const bv = getValue(b);
        if (av < bv) return sortDirection === "asc" ? -1 : 1;
        if (av > bv) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    return next;
  }, [
    rows,
    debouncedSearch,
    statusFilter,
    dateFrom,
    dateTo,
    sortDirection,
    getSearchText,
    getStatus,
    getDate,
    initialSort,
  ]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const paginated = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

  const resetFilters = useCallback(() => {
    setSearch("");
    setDebouncedSearch("");
    setStatusFilter("");
    setDateFrom("");
    setDateTo("");
    setSortDirection(initialSort?.direction ?? "desc");
    setPage(1);
  }, [initialSort?.direction]);

  const toggleSort = useCallback(() => {
    setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
  }, []);

  return {
    search,
    setSearch,
    debouncedSearch,
    statusFilter,
    setStatusFilter,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    sortDirection,
    toggleSort,
    page: safePage,
    setPage,
    pageSize,
    totalRows: rows.length,
    filteredCount: filtered.length,
    totalPages,
    paginated,
    resetFilters,
    hasActiveFilters: Boolean(
      debouncedSearch || statusFilter || dateFrom || dateTo
    ),
  };
}
