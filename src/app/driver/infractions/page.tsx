import { AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { resolveLedgerStatus } from "@/lib/transactions";
import type { PaymentStatus, TransactionStatus } from "@/lib/types/database";

function InfractionStatusBadge({
  status,
}: {
  status: PaymentStatus | TransactionStatus;
}) {
  if (status === "initialized") {
    return <span className="badge-pending">Initialized</span>;
  }
  return <StatusBadge status={status as PaymentStatus} />;
}

export default async function DriverInfractionsPage() {
  const profile = await requireRole(["driver", "admin"]);
  const supabase = createClient();

  const { data: infractions } = await supabase
    .from("infractions")
    .select("*")
    .eq("driver_id", profile.id)
    .order("created_at", { ascending: false });

  const list = infractions ?? [];
  const infractionIds = list.map((infraction) => infraction.id);
  const { data: transactions } =
    infractionIds.length > 0
      ? await supabase
          .from("transactions")
          .select("infraction_id, status")
          .in("infraction_id", infractionIds)
      : { data: [] };
  const transactionMap = new Map(
    (transactions ?? []).map((transaction) => [
      transaction.infraction_id,
      transaction.status,
    ])
  );

  return (
    <div>
      <PageHeader
        title="Infractions"
        description="View-only: infractions are filed by field agents and administrators. Contact support if you believe a record is incorrect."
      />
      <Card>
        <CardBody>
          {list.length === 0 ? (
            <EmptyState
              icon={<AlertTriangle className="h-8 w-8" />}
              title="No infractions"
              description="You currently have no infractions on record."
            />
          ) : (
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
                  {list.map((infraction) => {
                    const displayStatus = resolveLedgerStatus(
                      infraction.status,
                      transactionMap.get(infraction.id)
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
          )}
        </CardBody>
      </Card>
    </div>
  );
}
