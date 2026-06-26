"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Eye } from "lucide-react";
import { PaginatedTableFrame } from "@/components/table";
import { Button } from "@/components/ui/Button";
import { InfractionStatusBadge } from "@/components/ui/InfractionStatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { resolveLedgerStatus } from "@/lib/transactions";
import { useI18n } from "@/i18n/context";
import type { TableQuery } from "@/lib/pagination";
import type { Database, TransactionStatus } from "@/lib/types/database";
import { DriverInfractionPaymentDetailModal } from "@/app/driver/DriverInfractionPaymentDetailModal";

type Infraction = Database["public"]["Tables"]["infractions"]["Row"];

export function DriverInfractionsTable({
  pathname,
  query,
  totalCount,
  infractions,
  transactionStatusByInfraction,
}: {
  pathname: string;
  query: TableQuery;
  totalCount: number;
  infractions: Infraction[];
  transactionStatusByInfraction: Record<string, TransactionStatus>;
}) {
  const { t } = useI18n();
  const [detailId, setDetailId] = useState<string | null>(null);

  const statusFilterOptions = useMemo(
    () => [
      { value: "paid", label: t("driver.infractions.filterPaid") },
      { value: "unpaid", label: t("driver.infractions.filterUnpaid") },
      { value: "pending", label: t("driver.infractions.filterPending") },
    ],
    [t]
  );

  const openDetail = (id: string) => setDetailId(id);
  const closeDetail = () => setDetailId(null);

  return (
    <>
      <PaginatedTableFrame
        pathname={pathname}
        query={query}
        totalCount={totalCount}
        statusOptions={statusFilterOptions}
        searchPlaceholder={t("driver.infractions.searchPlaceholder")}
        emptyIcon={<AlertTriangle className="h-8 w-8" />}
        emptyTitle={t("driver.infractions.emptyTitle")}
        emptyDescription={t("driver.infractions.emptyDescription")}
        unfilteredHint={t("driver.infractions.summary", { count: totalCount })}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-stone-500 dark:text-slate-400 border-b border-stone-200 dark:border-slate-800">
              <tr>
                <th className="py-2 pr-4 font-medium">{t("driver.infractions.date")}</th>
                <th className="py-2 pr-4 font-medium">{t("driver.infractions.plate")}</th>
                <th className="py-2 pr-4 font-medium">{t("driver.infractions.type")}</th>
                <th className="py-2 pr-4 font-medium">{t("driver.infractions.location")}</th>
                <th className="py-2 pr-4 font-medium">{t("driver.infractions.amount")}</th>
                <th className="py-2 pr-4 font-medium">{t("driver.infractions.status")}</th>
                <th className="py-2 pr-4 font-medium text-right">
                  <span className="sr-only">{t("driver.infractions.view")}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {infractions.map((infraction) => {
                const displayStatus = resolveLedgerStatus(
                  infraction.status,
                  transactionStatusByInfraction[infraction.id]
                );
                return (
                  <tr
                    key={infraction.id}
                    className="border-b border-stone-100 dark:border-slate-800 last:border-0 align-top cursor-pointer transition-colors hover:bg-stone-50/80 dark:hover:bg-slate-800/40"
                    onClick={() => openDetail(infraction.id)}
                  >
                    <td className="py-2 pr-4 text-stone-600 dark:text-slate-400 whitespace-nowrap">
                      {formatDate(infraction.created_at)}
                    </td>
                    <td className="py-2 pr-4 font-medium text-stone-900 dark:text-stone-100">
                      {infraction.plate_number}
                    </td>
                    <td className="py-2 pr-4 text-stone-600 dark:text-slate-400">
                      {infraction.infraction_type}
                      {infraction.description && (
                        <span className="block text-xs text-stone-400 dark:text-slate-500 mt-0.5">
                          {infraction.description}
                        </span>
                      )}
                    </td>
                    <td className="py-2 pr-4 text-stone-600 dark:text-slate-400">
                      {infraction.location || t("driver.infractions.emptyValue")}
                    </td>
                    <td className="py-2 pr-4 text-stone-600 dark:text-slate-400">
                      {formatCurrency(Number(infraction.fine_amount))}
                    </td>
                    <td className="py-2 pr-4">
                      <InfractionStatusBadge status={displayStatus} />
                    </td>
                    <td className="py-2 pr-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <Button
                        type="button"
                        variant="secondary"
                        className="text-xs py-1.5 px-3"
                        onClick={() => openDetail(infraction.id)}
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        {t("driver.infractions.view")}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </PaginatedTableFrame>

      <DriverInfractionPaymentDetailModal
        infractionId={detailId}
        open={detailId !== null}
        onClose={closeDetail}
      />
    </>
  );
}
