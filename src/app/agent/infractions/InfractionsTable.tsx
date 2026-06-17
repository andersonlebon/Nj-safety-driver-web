"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertTriangle, Eye } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { updateInfractionPaymentStatus } from "@/app/agent/actions";
import { friendlyError } from "@/lib/errors";
import { resolveLedgerStatus } from "@/lib/transactions";
import { useTableFilters } from "@/hooks/useTableFilters";
import {
  TableToolbar,
  TablePagination,
  TableEmptyState,
} from "@/components/table";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { InfractionStatusBadge } from "@/components/ui/InfractionStatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Database, PaymentStatus, TransactionStatus } from "@/lib/types/database";

type Infraction = Database["public"]["Tables"]["infractions"]["Row"];

const STATUS_FILTER_OPTIONS = [
  { value: "paid", label: "Paid" },
  { value: "unpaid", label: "Unpaid" },
  { value: "pending", label: "Pending" },
  { value: "initialized", label: "Initialized" },
];

export function InfractionsTable({
  infractions,
  allowStatusUpdates = true,
  transactionStatusByInfraction = {},
}: {
  infractions: Infraction[];
  allowStatusUpdates?: boolean;
  transactionStatusByInfraction?: Record<string, TransactionStatus>;
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const table = useTableFilters({
    rows: infractions,
    pageSize: 25,
    getSearchText: (row) =>
      [row.plate_number, row.infraction_type, row.location, row.description]
        .filter(Boolean)
        .join(" "),
    getStatus: (row) =>
      resolveLedgerStatus(row.status, transactionStatusByInfraction[row.id]),
    getDate: (row) => row.created_at,
    initialSort: {
      getValue: (row) => new Date(row.created_at).getTime(),
      direction: "desc",
    },
  });

  const updateStatus = async (id: string, status: PaymentStatus) => {
    setBusyId(id);
    setError(null);
    const result = await updateInfractionPaymentStatus(id, status);
    if (!result.ok) setError(result.error);
    setBusyId(null);
    router.refresh();
  };

  const viewEvidence = async (path: string) => {
    const supabase = createClient();
    const { data, error: signError } = await supabase.storage
      .from("evidence")
      .createSignedUrl(path, 60);
    if (signError) {
      setError(friendlyError(signError));
      return;
    }
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  return (
    <div className="space-y-3">
      {error && <Alert variant="error">{error}</Alert>}

      <TableToolbar
        search={table.search}
        onSearchChange={table.setSearch}
        searchPlaceholder="Plate, type, location…"
        statusValue={table.statusFilter}
        onStatusChange={table.setStatusFilter}
        statusOptions={STATUS_FILTER_OPTIONS}
        dateFrom={table.dateFrom}
        dateTo={table.dateTo}
        onDateFromChange={table.setDateFrom}
        onDateToChange={table.setDateTo}
        onReset={table.resetFilters}
        hasActiveFilters={table.hasActiveFilters}
        summary={
          table.hasActiveFilters
            ? `${table.filteredCount} of ${table.totalRows} infractions`
            : undefined
        }
      />

      {table.filteredCount === 0 ? (
        <TableEmptyState
          icon={<AlertTriangle className="h-8 w-8" />}
          title="No infractions"
          description="Use plate search to file the first infraction."
          filtered={table.totalRows > 0}
          searchTerm={table.debouncedSearch}
        />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-stone-500 dark:text-slate-400 border-b border-stone-200 dark:border-slate-800">
                <tr>
                  <th className="py-2 pr-4 font-medium">Date</th>
                  <th className="py-2 pr-4 font-medium">Plate</th>
                  <th className="py-2 pr-4 font-medium">Type</th>
                  <th className="py-2 pr-4 font-medium">Location</th>
                  <th className="py-2 pr-4 font-medium">Amount</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 pr-4 font-medium">Evidence</th>
                </tr>
              </thead>
              <tbody>
                {table.paginated.map((i) => {
                  const displayStatus = resolveLedgerStatus(
                    i.status,
                    transactionStatusByInfraction[i.id]
                  );
                  return (
                    <tr
                      key={i.id}
                      className="border-b border-stone-100 dark:border-slate-800 last:border-0 align-top"
                    >
                      <td className="py-2 pr-4 text-stone-600 dark:text-slate-400 whitespace-nowrap">
                        {formatDate(i.created_at)}
                      </td>
                      <td className="py-2 pr-4 font-medium text-stone-900 dark:text-stone-100">
                        {i.plate_number}
                      </td>
                      <td className="py-2 pr-4 text-stone-600 dark:text-slate-400">
                        {i.infraction_type}
                        {i.description && (
                          <span className="block text-xs text-stone-400 dark:text-slate-500 mt-0.5">
                            {i.description}
                          </span>
                        )}
                      </td>
                      <td className="py-2 pr-4 text-stone-600 dark:text-slate-400">
                        {i.location || "—"}
                      </td>
                      <td className="py-2 pr-4 text-stone-600 dark:text-slate-400">
                        {formatCurrency(Number(i.fine_amount))}
                      </td>
                      <td className="py-2 pr-4">
                        <div className="flex items-center gap-2">
                          <InfractionStatusBadge status={displayStatus} />
                          {allowStatusUpdates ? (
                            <select
                              className="input py-1 text-xs"
                              value={
                                displayStatus === "initialized"
                                  ? "unpaid"
                                  : displayStatus === "pending"
                                    ? "pending"
                                    : displayStatus
                              }
                              disabled={busyId === i.id}
                              onChange={(e) =>
                                updateStatus(i.id, e.target.value as PaymentStatus)
                              }
                            >
                              <option value="unpaid">Unpaid</option>
                              <option value="pending">Pending</option>
                              <option value="paid">Paid</option>
                            </select>
                          ) : null}
                        </div>
                      </td>
                      <td className="py-2 pr-4">
                        {i.evidence_path ? (
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => viewEvidence(i.evidence_path as string)}
                          >
                            <Eye className="h-4 w-4" /> View
                          </Button>
                        ) : (
                          <span className="text-stone-400 dark:text-slate-500 text-xs">
                            None
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <TablePagination
            page={table.page}
            totalPages={table.totalPages}
            filteredCount={table.filteredCount}
            totalRows={table.totalRows}
            onPageChange={table.setPage}
          />
        </>
      )}
    </div>
  );
}
