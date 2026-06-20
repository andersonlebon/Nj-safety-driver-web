"use client";

import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { TableSearch } from "./TableSearch";
import { TableFilters, type TableFilterOption } from "./TableFilters";

type Props = {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  statusValue: string;
  onStatusChange: (value: string) => void;
  statusOptions?: TableFilterOption[];
  statusLabel?: string;
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  showDateFilters?: boolean;
  onReset: () => void;
  hasActiveFilters: boolean;
  summary?: string;
};

export function TableToolbar({
  search,
  onSearchChange,
  searchPlaceholder,
  statusValue,
  onStatusChange,
  statusOptions = [],
  statusLabel,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  showDateFilters = true,
  onReset,
  hasActiveFilters,
  summary,
}: Props) {
  const hasStatus = statusOptions.length > 0;
  const columnCount =
    1 + (hasStatus ? 1 : 0) + (showDateFilters ? 2 : 0) + (hasActiveFilters ? 1 : 0);

  return (
    <div className="mb-4 space-y-3">
      <div
        className={cn(
          "grid gap-3 items-end",
          columnCount >= 5 &&
            "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[minmax(12rem,2fr)_10rem_10rem_10rem_auto]",
          columnCount === 4 &&
            "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[minmax(12rem,2fr)_10rem_10rem_auto]",
          columnCount === 3 &&
            "grid-cols-1 sm:grid-cols-2 xl:grid-cols-[minmax(12rem,2fr)_10rem_10rem]",
          columnCount === 2 &&
            "grid-cols-1 sm:grid-cols-[minmax(12rem,1fr)_auto]",
          columnCount === 1 && "grid-cols-1"
        )}
      >
        <div className="min-w-0 sm:col-span-2 xl:col-span-1">
          <TableSearch
            value={search}
            onChange={onSearchChange}
            placeholder={searchPlaceholder}
          />
        </div>

        <TableFilters
          statusValue={statusValue}
          onStatusChange={onStatusChange}
          statusOptions={statusOptions}
          statusLabel={statusLabel}
          dateFrom={dateFrom}
          dateTo={dateTo}
          onDateFromChange={onDateFromChange}
          onDateToChange={onDateToChange}
          showDateFilters={showDateFilters}
        />

        {hasActiveFilters && (
          <Button
            type="button"
            variant="secondary"
            onClick={onReset}
            className="w-full xl:w-auto xl:justify-self-end"
          >
            <RotateCcw className="h-4 w-4 mr-1.5" />
            Reset
          </Button>
        )}
      </div>
      {summary && (
        <p className="text-xs text-stone-500 dark:text-slate-400">{summary}</p>
      )}
    </div>
  );
}
