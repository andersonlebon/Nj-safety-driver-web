"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertTriangle, Eye } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { updateInfractionPaymentStatus } from "@/app/staff/actions";
import { friendlyError } from "@/lib/errors";
import { resolveLedgerStatus } from "@/lib/transactions";
import { PaginatedTableFrame } from "@/components/table";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { InfractionStatusBadge } from "@/components/ui/InfractionStatusBadge";
import { useStaffVehicleDetailModal } from "@/hooks/use-staff-vehicle-detail-modal";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { TableQuery } from "@/lib/pagination";
import type { Database, PaymentStatus, TransactionStatus } from "@/lib/types/database";

type Infraction = Database["public"]["Tables"]["infractions"]["Row"] & {
  registration_country?: string | null;
};

const STATUS_FILTER_OPTIONS = [
  { value: "paid", label: "Paid" },
  { value: "unpaid", label: "Unpaid" },
  { value: "pending", label: "Pending" },
  { value: "initialized", label: "Initialized" },
];

export function InfractionsTable({
  pathname,
  query,
  totalCount,
  preserveParams,
  infractions,
  allowStatusUpdates = true,
  transactionStatusByInfraction = {},
  canManageVehicles = false,
}: {
  pathname: string;
  query: TableQuery;
  totalCount: number;
  preserveParams?: Record<string, string>;
  infractions: Infraction[];
  allowStatusUpdates?: boolean;
  transactionStatusByInfraction?: Record<string, TransactionStatus>;
  canManageVehicles?: boolean;
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { openFromInfraction, modal } = useStaffVehicleDetailModal({
    canManageVehicles,
    transactionStatusByInfraction,
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

      <PaginatedTableFrame
        pathname={pathname}
        query={query}
        totalCount={totalCount}
        preserveParams={preserveParams}
        statusOptions={STATUS_FILTER_OPTIONS}
        searchPlaceholder="Plate, type, location…"
        emptyIcon={<AlertTriangle className="h-8 w-8" />}
        emptyTitle="No infractions"
        emptyDescription="Use plate search to file the first infraction."
        unfilteredHint={`${totalCount} infraction${totalCount === 1 ? "" : "s"}`}
      >
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
              {infractions.map((i) => {
                const displayStatus = resolveLedgerStatus(
                  i.status,
                  transactionStatusByInfraction[i.id]
                );
                return (
                  <tr
                    key={i.id}
                    className="border-b border-stone-100 dark:border-slate-800 last:border-0 align-top cursor-pointer transition-colors hover:bg-stone-50/80 dark:hover:bg-slate-800/40"
                    onClick={() => openFromInfraction(i, { initialTab: "fines" })}
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
                            onClick={(event) => event.stopPropagation()}
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
                          onClick={(event) => {
                            event.stopPropagation();
                            void viewEvidence(i.evidence_path as string);
                          }}
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
      </PaginatedTableFrame>

      {modal}
    </div>
  );
}
