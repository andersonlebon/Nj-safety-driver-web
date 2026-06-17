"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { buildTableHref, type TableQuery } from "@/lib/pagination";

type BaseProps = {
  page: number;
  totalPages: number;
  filteredCount: number;
  totalRows: number;
};

type ClientProps = BaseProps & {
  mode?: "client";
  onPageChange: (page: number) => void;
};

type ServerProps = BaseProps & {
  mode: "server";
  pathname: string;
  query: TableQuery;
  preserveParams?: Record<string, string>;
};

type Props = ClientProps | ServerProps;

export function TablePagination(props: Props) {
  const { page, totalPages, filteredCount, totalRows } = props;

  if (filteredCount === 0) return null;

  const prevDisabled = page <= 1;
  const nextDisabled = page >= totalPages;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-3 border-t border-stone-200 dark:border-slate-800">
      <p className="text-xs text-stone-500 dark:text-slate-400">
        Page {page} of {totalPages} ({filteredCount}
        {filteredCount !== totalRows ? ` of ${totalRows}` : ""} rows)
      </p>
      <div className="flex gap-2">
        {props.mode === "server" ? (
          <>
            {prevDisabled ? (
              <Button type="button" variant="secondary" disabled>
                Previous
              </Button>
            ) : (
              <Link
                href={buildTableHref(
                  props.pathname,
                  props.query,
                  { page: page - 1 },
                  props.preserveParams
                )}
                className="btn-secondary inline-flex items-center justify-center"
              >
                Previous
              </Link>
            )}
            {nextDisabled ? (
              <Button type="button" variant="secondary" disabled>
                Next
              </Button>
            ) : (
              <Link
                href={buildTableHref(
                  props.pathname,
                  props.query,
                  { page: page + 1 },
                  props.preserveParams
                )}
                className="btn-secondary inline-flex items-center justify-center"
              >
                Next
              </Link>
            )}
          </>
        ) : (
          <>
            <Button
              type="button"
              variant="secondary"
              disabled={prevDisabled}
              onClick={() => props.onPageChange(page - 1)}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={nextDisabled}
              onClick={() => props.onPageChange(page + 1)}
            >
              Next
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
