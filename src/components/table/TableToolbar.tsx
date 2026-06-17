"use client";

import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
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
  return (
    <div className="mb-4 space-y-3">
      <div className="flex flex-col lg:flex-row lg:flex-wrap lg:items-end gap-3">
        <TableSearch
          value={search}
          onChange={onSearchChange}
          placeholder={searchPlaceholder}
        />
        {(statusOptions.length > 0 || showDateFilters) && (
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
        )}
        {hasActiveFilters && (
          <Button type="button" variant="secondary" onClick={onReset}>
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
