"use client";

import { Button } from "@/components/ui/Button";

type Props = {
  page: number;
  totalPages: number;
  filteredCount: number;
  totalRows: number;
  onPageChange: (page: number) => void;
};

export function TablePagination({
  page,
  totalPages,
  filteredCount,
  totalRows,
  onPageChange,
}: Props) {
  if (filteredCount === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-3 border-t border-stone-200 dark:border-slate-800">
      <p className="text-xs text-stone-500 dark:text-slate-400">
        Showing page {page} of {totalPages} ({filteredCount}
        {filteredCount !== totalRows ? ` of ${totalRows}` : ""} rows)
      </p>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
