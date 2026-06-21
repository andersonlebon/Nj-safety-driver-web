"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Wallet } from "lucide-react";
import { PaginatedTableFrame } from "@/components/table";
import { InfractionStatusBadge } from "@/components/ui/InfractionStatusBadge";
import { Button } from "@/components/ui/Button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useI18n } from "@/i18n/context";
import type { TableQuery } from "@/lib/pagination";
import type { Database } from "@/lib/types/database";
import type { InfractionPaymentSummary } from "@/lib/payments";
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
  const [selected, setSelected] = useState<DriverPaymentLedgerRow | null>(null);

  const statusFilterOptions = useMemo(
    () => [
      { value: "paid", label: t("driver.payments.filterPaid") },
      { value: "unpaid", label: t("driver.payments.filterUnpaid") },
      { value: "pending", label: t("driver.payments.filterPending") },
    ],
    [t]
  );

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
                <tr key={infraction.id} className="border-b border-slate-100 last:border-0">
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
                  <td className="py-2 pr-4">
                    {summary.ledgerStatus !== "paid" && summary.remaining > 0 ? (
                      <Button
                        type="button"
                        variant="secondary"
                        className="text-xs py-1.5"
                        disabled={summary.hasPendingReview}
                        onClick={() => setSelected({ infraction, summary })}
                      >
                        {summary.hasPendingReview
                          ? t("driver.payments.awaitingReview")
                          : t("driver.payments.submitPayment")}
                      </Button>
                    ) : (
                      <span className="text-xs text-slate-400">{t("driver.payments.noAction")}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PaginatedTableFrame>

      <SubmitManualPaymentDialog
        open={selected !== null}
        row={selected}
        onClose={() => setSelected(null)}
        onSubmitted={() => {
          setSelected(null);
          router.refresh();
        }}
      />
    </>
  );
}
