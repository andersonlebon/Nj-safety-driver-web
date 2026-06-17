import { Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { StatCard } from "@/components/dashboard/StatCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { InfractionStatusBadge } from "@/components/ui/InfractionStatusBadge";
import { Alert } from "@/components/ui/Alert";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { PaymentStatus, TransactionStatus } from "@/lib/types/database";

export default async function DriverPaymentsPage() {
  const profile = await requireRole(["driver", "admin"]);
  const supabase = createClient();

  const { data: infractions } = await supabase
    .from("infractions")
    .select("*")
    .eq("driver_id", profile.id)
    .order("created_at", { ascending: false });

  const list = infractions || [];
  const infractionIds = list.map((infraction) => infraction.id);
  const { data: transactions } =
    infractionIds.length > 0
      ? await supabase
          .from("transactions")
          .select("infraction_id, amount, status")
          .in("infraction_id", infractionIds)
      : { data: [] };
  const transactionMap = new Map(
    (transactions ?? []).map((transaction) => [
      transaction.infraction_id,
      transaction,
    ])
  );
  const transactionRows = list.map((infraction) => {
    const transaction = transactionMap.get(infraction.id);
    return {
      infraction,
      amount: Number(transaction?.amount ?? infraction.fine_amount),
      status: transaction?.status ?? infraction.status,
    };
  });
  const unpaid = transactionRows.filter((row) => row.status === "unpaid");
  const pending = transactionRows.filter((row) => row.status === "pending");
  const paid = transactionRows.filter((row) => row.status === "paid");
  const totalDue = unpaid.reduce((sum, row) => sum + row.amount, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description="Track the payment status of your infractions."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total due"
          value={formatCurrency(totalDue)}
          icon={<Wallet className="h-4 w-4" />}
        />
        <StatCard label="Unpaid" value={unpaid.length} />
        <StatCard label="Pending" value={pending.length} />
        <StatCard label="Paid" value={paid.length} />
      </div>

      <Alert variant="info">
        Payments are currently tracked manually. Contact your local agency to
        register a payment; once confirmed, the status will be updated here.
      </Alert>

      <Card>
        <CardBody>
          <h3 className="text-sm font-semibold text-slate-900 mb-4">
            Payment ledger
          </h3>
          {list.length === 0 ? (
            <EmptyState title="Nothing to pay" description="No infractions on record." />
          ) : (
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
                  {transactionRows.map(({ infraction, amount, status }) => (
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
          )}
        </CardBody>
      </Card>
    </div>
  );
}

