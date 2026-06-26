"use client";

import { useMemo, useState } from "react";
import { Eye, Wallet } from "lucide-react";
import { PaginatedTableFrame } from "@/components/table";
import { Button } from "@/components/ui/Button";
import { InfractionStatusBadge } from "@/components/ui/InfractionStatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useI18n } from "@/i18n/context";
import type { TableQuery } from "@/lib/pagination";
import type { StaffPaymentRow } from "@/lib/queries/payments";
import { PaymentTransactionDetailModal } from "./PaymentTransactionDetailModal";

export function StaffPaymentsTable({
  pathname,
  query,
  totalCount,
  rows,
}: {
  pathname: string;
  query: TableQuery;
  totalCount: number;
  rows: StaffPaymentRow[];
}) {
  const { t } = useI18n();
  const [selected, setSelected] = useState<StaffPaymentRow | null>(null);

  const statusFilterOptions = useMemo(
    () => [
      { value: "pending", label: t("staff.payments.filterPending") },
      { value: "paid", label: t("staff.payments.filterPaid") },
      { value: "rejected", label: t("staff.payments.filterRejected") },
      { value: "initialized", label: t("staff.payments.filterInitialized") },
      { value: "unpaid", label: t("staff.payments.filterUnpaid") },
    ],
    [t]
  );

  const open = (row: StaffPaymentRow) => setSelected(row);
  const close = () => setSelected(null);

  return (
    <>
      <PaginatedTableFrame
        pathname={pathname}
        query={query}
        totalCount={totalCount}
        statusOptions={statusFilterOptions}
        statusLabel={t("staff.payments.status")}
        searchPlaceholder={t("staff.payments.searchPlaceholder")}
        emptyIcon={<Wallet className="h-8 w-8" />}
        emptyTitle={t("staff.payments.emptyTitle")}
        emptyDescription={t("staff.payments.emptyDescription")}
        unfilteredHint={t("staff.payments.summary", { count: totalCount })}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-stone-500 dark:text-slate-400 border-b border-stone-200 dark:border-slate-800">
              <tr>
                <th className="py-2 pr-4 font-medium">{t("staff.payments.submittedAt")}</th>
                <th className="py-2 pr-4 font-medium">{t("staff.payments.driver")}</th>
                <th className="py-2 pr-4 font-medium">{t("staff.payments.plate")}</th>
                <th className="py-2 pr-4 font-medium">{t("staff.payments.infraction")}</th>
                <th className="py-2 pr-4 font-medium">{t("staff.payments.amount")}</th>
                <th className="py-2 pr-4 font-medium">{t("staff.payments.status")}</th>
                <th className="py-2 pr-4 font-medium">{t("staff.payments.progress")}</th>
                <th className="py-2 pr-4 font-medium">{t("staff.payments.method")}</th>
                <th className="py-2 pr-4 font-medium text-right">
                  {t("staff.payments.actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const totalDue = Number(row.infraction.fine_amount);
                const paidSoFar = Number(row.infraction.amount_paid);
                return (
                  <tr
                    key={row.id}
                    className="border-b border-stone-100 dark:border-slate-800 last:border-0 cursor-pointer hover:bg-stone-50 dark:hover:bg-slate-900/40"
                    onClick={() => open(row)}
                  >
                    <td className="py-3 pr-4 whitespace-nowrap">
                      {formatDate(row.created_at)}
                    </td>
                    <td className="py-3 pr-4">
                      {row.driver_name ?? t("staff.payments.unknownDriver")}
                    </td>
                    <td className="py-3 pr-4 font-medium font-mono">
                      {row.infraction.plate_number}
                    </td>
                    <td className="py-3 pr-4">{row.infraction.infraction_type}</td>
                    <td className="py-3 pr-4 font-medium">
                      {formatCurrency(Number(row.amount))}
                    </td>
                    <td className="py-3 pr-4">
                      <InfractionStatusBadge status={row.status} />
                    </td>
                    <td className="py-3 pr-4 text-xs text-stone-600 dark:text-slate-400 whitespace-nowrap">
                      {formatCurrency(paidSoFar)} / {formatCurrency(totalDue)}
                    </td>
                    <td className="py-3 pr-4 text-stone-600 dark:text-slate-400">
                      {row.payment_method === "manual"
                        ? t("staff.payments.methodManual")
                        : row.payment_method}
                    </td>
                    <td className="py-3 pr-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <Button
                        type="button"
                        variant="secondary"
                        className="text-xs py-1.5 px-3"
                        onClick={() => open(row)}
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        {t("staff.shared.view")}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </PaginatedTableFrame>

      <PaymentTransactionDetailModal
        row={selected}
        open={Boolean(selected)}
        onClose={close}
      />
    </>
  );
}
