import Link from "next/link";
import { AlertTriangle, Search, FileCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getCurrentProfile } from "@/lib/auth";

export default async function AgentOverviewPage() {
  const profile = await getCurrentProfile();
  const supabase = createClient();

  const [
    { count: totalInfractions },
    { count: unpaidCount },
    { count: myInfractions },
    { data: recent },
  ] = await Promise.all([
    supabase.from("infractions").select("id", { count: "exact", head: true }),
    supabase
      .from("infractions")
      .select("id", { count: "exact", head: true })
      .eq("status", "unpaid"),
    supabase
      .from("infractions")
      .select("id", { count: "exact", head: true })
      .eq("agent_id", profile!.id),
    supabase
      .from("infractions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  return (
    <div>
      <PageHeader
        title="Agent overview"
        description="Quickly find vehicles and review recent infractions."
        actions={
          <Link href="/agent/search" className="btn-primary">
            <Search className="h-4 w-4" />
            Plate search
          </Link>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total infractions"
          value={totalInfractions ?? 0}
          icon={<AlertTriangle className="h-4 w-4" />}
        />
        <StatCard
          label="Currently unpaid"
          value={unpaidCount ?? 0}
          icon={<AlertTriangle className="h-4 w-4" />}
        />
        <StatCard
          label="Issued by you"
          value={myInfractions ?? 0}
          icon={<FileCheck className="h-4 w-4" />}
        />
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Recent infractions</CardTitle>
            <Link
              href="/agent/infractions"
              className="text-sm font-medium text-brand-700 hover:underline"
            >
              View all
            </Link>
          </CardHeader>
          <CardBody>
            {!recent || recent.length === 0 ? (
              <EmptyState
                title="No infractions yet"
                description="Use the plate search to look up a vehicle and create one."
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
