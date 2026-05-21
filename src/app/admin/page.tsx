import { Users, Car, ShieldCheck, AlertTriangle, Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function AdminOverviewPage() {
  const supabase = createClient();

  const [
    { count: drivers },
    { count: agents },
    { count: vehicles },
    { count: infractions },
    { data: unpaid },
    { data: recent },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "driver"),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "agent"),
    supabase.from("vehicles").select("id", { count: "exact", head: true }),
    supabase.from("infractions").select("id", { count: "exact", head: true }),
    supabase.from("infractions").select("fine_amount").eq("status", "unpaid"),
    supabase
      .from("infractions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const totalUnpaid = (unpaid || []).reduce(
    (sum, i) => sum + Number(i.fine_amount),
    0
  );

  return (
    <div>
      <PageHeader
        title="Administrator overview"
        description="System-wide statistics and recent activity."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          label="Drivers"
          value={drivers ?? 0}
          icon={<Users className="h-4 w-4" />}
        />
        <StatCard
          label="Agents"
          value={agents ?? 0}
          icon={<ShieldCheck className="h-4 w-4" />}
        />
        <StatCard
          label="Vehicles"
          value={vehicles ?? 0}
          icon={<Car className="h-4 w-4" />}
        />
        <StatCard
          label="Infractions"
          value={infractions ?? 0}
          icon={<AlertTriangle className="h-4 w-4" />}
        />
        <StatCard
          label="Unpaid total"
          value={formatCurrency(totalUnpaid)}
          icon={<Wallet className="h-4 w-4" />}
        />
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Recent infractions</CardTitle>
          </CardHeader>
          <CardBody>
            {!recent || recent.length === 0 ? (
              <EmptyState title="No activity yet" />
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
                    {recent.map((i) => (
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
    </div>
  );
}
