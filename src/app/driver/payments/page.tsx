import { Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { StatCard } from "@/components/dashboard/StatCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Alert } from "@/components/ui/Alert";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function DriverPaymentsPage() {
  const profile = await requireRole(["driver", "admin"]);
  const supabase = createClient();

  const { data: infractions } = await supabase
    .from("infractions")
    .select("*")
    .eq("driver_id", profile.id)
    .order("created_at", { ascending: false });

  const list = infractions || [];
  const unpaid = list.filter((i) => i.status === "unpaid");
  const pending = list.filter((i) => i.status === "pending");
  const paid = list.filter((i) => i.status === "paid");
  const totalDue = unpaid.reduce((sum, i) => sum + Number(i.fine_amount), 0);

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
                  {list.map((i) => (
                    <tr key={i.id} className="border-b border-slate-100 last:border-0">
                      <td className="py-2 pr-4 text-slate-700">{formatDate(i.created_at)}</td>
                      <td className="py-2 pr-4 font-medium text-slate-900">{i.plate_number}</td>
                      <td className="py-2 pr-4 text-slate-700">{i.infraction_type}</td>
                      <td className="py-2 pr-4 text-slate-700">{formatCurrency(Number(i.fine_amount))}</td>
                      <td className="py-2 pr-4"><StatusBadge status={i.status} /></td>
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
