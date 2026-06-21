"use client";

import { useMemo } from "react";
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
import { useI18n } from "@/i18n/context";
import type { TableQuery } from "@/lib/pagination";
import type { Database, PaymentStatus, TransactionStatus } from "@/lib/types/database";

type Infraction = Database["public"]["Tables"]["infractions"]["Row"] & {
  registration_country?: string | null;
};

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
  const { t } = useI18n();
  const emDash = t("staff.shared.emDash");
  const statusFilterOptions = useMemo(
    () => [
      { value: "paid", label: t("staff.infractions.table.filterPaid") },
      { value: "unpaid", label: t("staff.infractions.table.filterUnpaid") },
      { value: "pending", label: t("staff.infractions.table.filterPending") },
      { value: "initialized", label: t("staff.infractions.table.filterInitialized") },
    ],
    [t]
  );
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
        statusOptions={statusFilterOptions}
        searchPlaceholder={t("staff.infractions.table.searchPlaceholder")}
        emptyIcon={<AlertTriangle className="h-8 w-8" />}
        emptyTitle={t("staff.infractions.table.emptyTitle")}
        emptyDescription={t("staff.infractions.table.emptyDescription")}
        unfilteredHint={t("staff.infractions.table.unfilteredHint", { count: totalCount })}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-stone-500 dark:text-slate-400 border-b border-stone-200 dark:border-slate-800">
              <tr>
                <th className="py-2 pr-4 font-medium">{t("staff.infractions.table.date")}</th>
                <th className="py-2 pr-4 font-medium">{t("staff.infractions.table.plate")}</th>
                <th className="py-2 pr-4 font-medium">{t("staff.infractions.table.type")}</th>
                <th className="py-2 pr-4 font-medium">{t("staff.infractions.table.location")}</th>
                <th className="py-2 pr-4 font-medium">{t("staff.infractions.table.amount")}</th>
                <th className="py-2 pr-4 font-medium">{t("staff.infractions.table.status")}</th>
                <th className="py-2 pr-4 font-medium">{t("staff.infractions.table.evidence")}</th>
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
                      {i.location || emDash}
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
                            <option value="unpaid">{t("staff.infractions.table.statusUnpaid")}</option>
                            <option value="pending">{t("staff.infractions.table.statusPending")}</option>
                            <option value="paid">{t("staff.infractions.table.statusPaid")}</option>
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
                          <Eye className="h-4 w-4" /> {t("staff.infractions.table.viewEvidence")}
                        </Button>
                      ) : (
                        <span className="text-stone-400 dark:text-slate-500 text-xs">
                          {t("staff.infractions.table.noEvidence")}
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
