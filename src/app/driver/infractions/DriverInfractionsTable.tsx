"use client";

import { AlertTriangle } from "lucide-react";
import { PaginatedTableFrame } from "@/components/table";
import { InfractionStatusBadge } from "@/components/ui/InfractionStatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { resolveLedgerStatus } from "@/lib/transactions";
import type { TableQuery } from "@/lib/pagination";
import type { Database, TransactionStatus } from "@/lib/types/database";

type Infraction = Database["public"]["Tables"]["infractions"]["Row"];

const STATUS_FILTER_OPTIONS = [
  { value: "paid", label: "Paid" },
  { value: "unpaid", label: "Unpaid" },
  { value: "pending", label: "Pending" },
];

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
  return (
    <PaginatedTableFrame
      pathname={pathname}
      query={query}
      totalCount={totalCount}
      statusOptions={STATUS_FILTER_OPTIONS}
      searchPlaceholder="Plate, type, location…"
      emptyIcon={<AlertTriangle className="h-8 w-8" />}
      emptyTitle="No infractions"
      emptyDescription="You currently have no infractions on record."
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
                  className="border-b border-stone-100 dark:border-slate-800 last:border-0 align-top"
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
                    {infraction.location || "—"}
                  </td>
                  <td className="py-2 pr-4 text-stone-600 dark:text-slate-400">
                    {formatCurrency(Number(infraction.fine_amount))}
                  </td>
                  <td className="py-2 pr-4">
                    <InfractionStatusBadge status={displayStatus} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </PaginatedTableFrame>
  );
}
