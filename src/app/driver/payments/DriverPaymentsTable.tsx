"use client";

import { useMemo } from "react";
import { Wallet } from "lucide-react";
import { PaginatedTableFrame } from "@/components/table";
import { InfractionStatusBadge } from "@/components/ui/InfractionStatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useI18n } from "@/i18n/context";
import type { TableQuery } from "@/lib/pagination";
import type { Database, TransactionStatus } from "@/lib/types/database";

type Infraction = Database["public"]["Tables"]["infractions"]["Row"];

type LedgerRow = {
  infraction: Infraction;
  amount: number;
  status: TransactionStatus;
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
  rows: LedgerRow[];
}) {
  const { t } = useI18n();
  const statusFilterOptions = useMemo(
    () => [
      { value: "paid", label: t("driver.payments.filterPaid") },
      { value: "unpaid", label: t("driver.payments.filterUnpaid") },
      { value: "pending", label: t("driver.payments.filterPending") },
    ],
    [t]
  );

  return (
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
              <th className="py-2 pr-4 font-medium">{t("driver.payments.amount")}</th>
              <th className="py-2 pr-4 font-medium">{t("driver.payments.status")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ infraction, amount, status }) => (
              <tr key={infraction.id} className="border-b border-slate-100 last:border-0">
                <td className="py-2 pr-4 text-slate-700">{formatDate(infraction.created_at)}</td>
                <td className="py-2 pr-4 font-medium text-slate-900">{infraction.plate_number}</td>
                <td className="py-2 pr-4 text-slate-700">{infraction.infraction_type}</td>
                <td className="py-2 pr-4 text-slate-700">{formatCurrency(amount)}</td>
                <td className="py-2 pr-4">
                  <InfractionStatusBadge status={status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PaginatedTableFrame>
  );
}
