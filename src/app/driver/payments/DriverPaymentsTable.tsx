"use client";

import { Wallet } from "lucide-react";
import { PaginatedTableFrame } from "@/components/table";
import { InfractionStatusBadge } from "@/components/ui/InfractionStatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { TableQuery } from "@/lib/pagination";
import type { Database, TransactionStatus } from "@/lib/types/database";

type Infraction = Database["public"]["Tables"]["infractions"]["Row"];

const STATUS_FILTER_OPTIONS = [
  { value: "paid", label: "Paid" },
  { value: "unpaid", label: "Unpaid" },
  { value: "pending", label: "Pending" },
];

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
  return (
    <PaginatedTableFrame
      pathname={pathname}
      query={query}
      totalCount={totalCount}
      statusOptions={STATUS_FILTER_OPTIONS}
      searchPlaceholder="Plate, type…"
      emptyIcon={<Wallet className="h-8 w-8" />}
      emptyTitle="Nothing to pay"
      emptyDescription="No infractions on record."
      unfilteredHint={`${totalCount} ledger row${totalCount === 1 ? "" : "s"}`}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500 border-b border-slate-200">
            <tr>
              <th className="py-2 pr-4 font-medium">Date</th>
              <th className="py-2 pr-4 font-medium">Plate</th>
              <th className="py-2 pr-4 font-medium">Type</th>
              <th className="py-2 pr-4 font-medium">Amount</th>
              <th className="py-2 pr-4 font-medium">Status</th>
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
