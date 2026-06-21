"use client";

import type { ReactNode } from "react";
import { hasActiveTableFilters, type TableQuery } from "@/lib/pagination";
import { useI18n } from "@/i18n/context";
import { TableFilterBar } from "./TableFilterBar";
import { TablePagination } from "./TablePagination";
import { TableEmptyState } from "./TableEmptyState";
import type { TableFilterOption } from "./TableFilters";

type Props = {
  pathname: string;
  query: TableQuery;
  totalCount: number;
  preserveParams?: Record<string, string>;
  statusOptions?: TableFilterOption[];
  statusLabel?: string;
  searchPlaceholder?: string;
  showDateFilters?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: ReactNode;
  unfilteredHint?: string;
  children: ReactNode;
};

export function PaginatedTableFrame({
  pathname,
  query,
  totalCount,
  preserveParams,
  statusOptions,
  statusLabel,
  searchPlaceholder,
  showDateFilters = true,
  emptyTitle,
  emptyDescription,
  emptyIcon,
  unfilteredHint,
  children,
}: Props) {
  const { t } = useI18n();
  const resolvedEmptyTitle = emptyTitle ?? t("tables.noRows");
  const totalPages = Math.max(1, Math.ceil(Math.max(totalCount, 0) / query.pageSize));

  return (
    <div className="space-y-3">
      <TableFilterBar
        pathname={pathname}
        query={query}
        preserveParams={preserveParams}
        statusOptions={statusOptions}
        statusLabel={statusLabel}
        searchPlaceholder={searchPlaceholder}
        showDateFilters={showDateFilters}
        totalCount={totalCount}
        unfilteredHint={unfilteredHint}
      />

      {totalCount === 0 ? (
        <TableEmptyState
          icon={emptyIcon}
          title={resolvedEmptyTitle}
          description={emptyDescription}
          filtered={hasActiveTableFilters(query)}
          searchTerm={query.q}
        />
      ) : (
        <>
          {children}
          <TablePagination
            mode="server"
            page={query.page}
            totalPages={totalPages}
            filteredCount={totalCount}
            totalRows={totalCount}
            pathname={pathname}
            query={query}
            preserveParams={preserveParams}
          />
        </>
      )}
    </div>
  );
}
