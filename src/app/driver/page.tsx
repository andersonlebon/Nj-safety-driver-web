import Link from "next/link";
import { Car, FileText, AlertTriangle, Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { StatCard } from "@/components/dashboard/StatCard";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function DriverOverviewPage() {
  const profile = await getCurrentProfile();
  const supabase = createClient();

  const [{ count: vehicleCount }, { count: docCount }, { data: infractions }] =
    await Promise.all([
      supabase
        .from("vehicles")
        .select("id", { count: "exact", head: true })
        .eq("owner_id", profile!.id),
      supabase
        .from("documents")
        .select("id", { count: "exact", head: true })
        .eq("owner_id", profile!.id),
      supabase
        .from("infractions")
        .select("*")
        .eq("driver_id", profile!.id)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  const unpaid = (infractions || []).filter((i) => i.status === "unpaid");
  const totalDue = unpaid.reduce((sum, i) => sum + Number(i.fine_amount), 0);

  return (
    <div>
      <PageHeader
        title={`Welcome${profile?.full_name ? ", " + profile.full_name.split(" ")[0] : ""}`}
        description="Manage your driver profile, vehicles, and infractions."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Vehicles"
          value={vehicleCount ?? 0}
          icon={<Car className="h-4 w-4" />}
        />
        <StatCard
          label="Documents"
          value={docCount ?? 0}
          icon={<FileText className="h-4 w-4" />}
        />
        <StatCard
          label="Open infractions"
          value={unpaid.length}
          icon={<AlertTriangle className="h-4 w-4" />}
        />
        <StatCard
          label="Total due"
          value={formatCurrency(totalDue)}
          icon={<Wallet className="h-4 w-4" />}
        />
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Recent infractions</CardTitle>
            <Link
              href="/driver/infractions"
              className="text-sm font-medium text-brand-700 hover:underline"
            >
              View all
            </Link>
          </CardHeader>
          <CardBody>
            {(!infractions || infractions.length === 0) ? (
              <EmptyState
                title="No infractions"
                description="You currently have no infractions on record."
              />
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
                    {infractions.map((i) => (
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
