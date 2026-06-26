"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Wallet } from "lucide-react";
import { PaginatedTableFrame } from "@/components/table";
import { InfractionStatusBadge } from "@/components/ui/InfractionStatusBadge";
import { Button } from "@/components/ui/Button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useI18n } from "@/i18n/context";
import type { TableQuery } from "@/lib/pagination";
import type { Database } from "@/lib/types/database";
import type { InfractionPaymentSummary } from "@/lib/payments";
import { DriverInfractionPaymentDetailModal } from "@/app/driver/DriverInfractionPaymentDetailModal";
import type { DriverInfractionPaymentDetail } from "@/app/driver/payment-actions";
import { SubmitManualPaymentDialog } from "./SubmitManualPaymentDialog";

type Infraction = Database["public"]["Tables"]["infractions"]["Row"];

export type DriverPaymentLedgerRow = {
  infraction: Infraction;
  summary: InfractionPaymentSummary;
};

export function DriverPaymentsTable({
  pathname,
  query,
  totalCount,
  rows,
}: {
  pathname: string;
  query: TableQuery;
  totalCount: number;
  rows: DriverPaymentLedgerRow[];
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [detailId, setDetailId] = useState<string | null>(null);
  const [payRow, setPayRow] = useState<DriverPaymentLedgerRow | null>(null);

  const statusFilterOptions = useMemo(
    () => [
      { value: "paid", label: t("driver.payments.filterPaid") },
      { value: "unpaid", label: t("driver.payments.filterUnpaid") },
      { value: "pending", label: t("driver.payments.filterPending") },
    ],
    [t]
  );

  const openDetail = (id: string) => setDetailId(id);
  const closeDetail = () => setDetailId(null);

  const openPayFromDetail = (detail: DriverInfractionPaymentDetail) => {
    setDetailId(null);
    setPayRow({
      infraction: detail.infraction,
      summary: detail.summary,
    });
  };

  return (
    <>
      <PaginatedTableFrame
        pathname={pathname}
        query={query}
        totalCount={totalCount}
        statusOptions={statusFilterOptions}
        searchPlaceholder={t("driver.payments.searchPlaceholder")}
        emptyIcon={<Wallet className="h-8 w-8" />}
        emptyTitle={t("driver.payments.emptyTitle")}
        emptyDescription={t("driver.payments.emptyDescription")}
        unfilteredHint={t("driver.payments.summary", { count: totalCount })}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-2 pr-4 font-medium">{t("driver.payments.date")}</th>
                <th className="py-2 pr-4 font-medium">{t("driver.payments.plate")}</th>
                <th className="py-2 pr-4 font-medium">{t("driver.payments.type")}</th>
                <th className="py-2 pr-4 font-medium">{t("driver.payments.totalDue")}</th>
                <th className="py-2 pr-4 font-medium">{t("driver.payments.paidSoFar")}</th>
                <th className="py-2 pr-4 font-medium">{t("driver.payments.remaining")}</th>
                <th className="py-2 pr-4 font-medium">{t("driver.payments.transactions")}</th>
                <th className="py-2 pr-4 font-medium">{t("driver.payments.status")}</th>
                <th className="py-2 pr-4 font-medium">{t("driver.payments.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ infraction, summary }) => (
                <tr
                  key={infraction.id}
                  className="border-b border-slate-100 last:border-0 cursor-pointer hover:bg-stone-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  onClick={() => openDetail(infraction.id)}
                >
                  <td className="py-2 pr-4 text-slate-700">{formatDate(infraction.created_at)}</td>
                  <td className="py-2 pr-4 font-medium text-slate-900">{infraction.plate_number}</td>
                  <td className="py-2 pr-4 text-slate-700">{infraction.infraction_type}</td>
                  <td className="py-2 pr-4 text-slate-700">{formatCurrency(summary.totalDue)}</td>
                  <td className="py-2 pr-4 text-slate-700">{formatCurrency(summary.amountPaid)}</td>
                  <td className="py-2 pr-4 text-slate-700">{formatCurrency(summary.remaining)}</td>
                  <td className="py-2 pr-4 text-slate-700">{summary.transactionCount}</td>
                  <td className="py-2 pr-4">
                    <InfractionStatusBadge status={summary.ledgerStatus} />
                  </td>
                  <td className="py-2 pr-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        className="text-xs py-1.5 px-3"
                        onClick={() => openDetail(infraction.id)}
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        {t("driver.infractions.view")}
                      </Button>
                      {summary.ledgerStatus !== "paid" && summary.remaining > 0 ? (
                        <Button
                          type="button"
                          variant="secondary"
                          className="text-xs py-1.5"
                          disabled={summary.hasPendingReview}
                          onClick={() => setPayRow({ infraction, summary })}
                        >
                          {summary.hasPendingReview
                            ? t("driver.payments.awaitingReview")
                            : t("driver.payments.submitPayment")}
                        </Button>
                      ) : (
                        <span className="text-xs text-slate-400">{t("driver.payments.noAction")}</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PaginatedTableFrame>

      <DriverInfractionPaymentDetailModal
        infractionId={detailId}
        open={detailId !== null}
        onClose={closeDetail}
        onPay={openPayFromDetail}
      />

      <SubmitManualPaymentDialog
        open={payRow !== null}
        row={payRow}
        onClose={() => setPayRow(null)}
        onSubmitted={() => {
          setPayRow(null);
          router.refresh();
        }}
      />
    </>
  );
}
