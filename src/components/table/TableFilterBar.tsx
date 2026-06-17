"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  buildTableHref,
  hasActiveTableFilters,
  type TableQuery,
} from "@/lib/pagination";
import { TableToolbar } from "./TableToolbar";
import type { TableFilterOption } from "./TableFilters";

type Props = {
  pathname: string;
  query: TableQuery;
  preserveParams?: Record<string, string>;
  statusOptions?: TableFilterOption[];
  statusLabel?: string;
  searchPlaceholder?: string;
  showDateFilters?: boolean;
  totalCount: number;
  unfilteredHint?: string;
};

export function TableFilterBar({
  pathname,
  query,
  preserveParams,
  statusOptions,
  statusLabel,
  searchPlaceholder,
  showDateFilters = true,
  totalCount,
  unfilteredHint,
}: Props) {
  const router = useRouter();
  const currentPath = usePathname();
  const basePath = pathname || currentPath;

  const [search, setSearch] = useState(query.q);

  useEffect(() => {
    setSearch(query.q);
  }, [query.q]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (search.trim() === query.q.trim()) return;
      router.push(
        buildTableHref(
          basePath,
          query,
          { q: search.trim(), page: 1 },
          preserveParams
        )
      );
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search, query, basePath, preserveParams, router]);

  const pushUpdate = (updates: Partial<TableQuery>) => {
    router.push(buildTableHref(basePath, query, { ...updates, page: 1 }, preserveParams));
  };

  const summary = useMemo(() => {
    if (hasActiveTableFilters(query)) {
      return `${totalCount} matching row${totalCount === 1 ? "" : "s"}`;
    }
    return unfilteredHint;
  }, [query, totalCount, unfilteredHint]);

  return (
    <TableToolbar
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder={searchPlaceholder}
      statusValue={query.status}
      onStatusChange={(status) => pushUpdate({ status })}
      statusOptions={statusOptions}
      statusLabel={statusLabel}
      dateFrom={query.dateFrom}
      dateTo={query.dateTo}
      onDateFromChange={(dateFrom) => pushUpdate({ dateFrom })}
      onDateToChange={(dateTo) => pushUpdate({ dateTo })}
      showDateFilters={showDateFilters}
      hasActiveFilters={hasActiveTableFilters(query)}
      onReset={() =>
        router.push(
          buildTableHref(
            basePath,
            query,
            { q: "", status: "", dateFrom: "", dateTo: "", page: 1 },
            preserveParams
          )
        )
      }
      summary={summary}
    />
  );
}
