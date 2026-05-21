import { Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/utils";

export default async function AdminDriversPage() {
  const supabase = createClient();
  const { data: drivers } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "driver")
    .order("created_at", { ascending: false });

  return (
    <div>
      <PageHeader title="Drivers" description="All registered driver accounts." />
      <Card>
        <CardBody>
          {!drivers || drivers.length === 0 ? (
            <EmptyState
              icon={<Users className="h-8 w-8" />}
              title="No drivers"
              description="Driver accounts will appear here once people register."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-2 pr-4 font-medium">Name</th>
                    <th className="py-2 pr-4 font-medium">Email</th>
                    <th className="py-2 pr-4 font-medium">Phone</th>
                    <th className="py-2 pr-4 font-medium">License #</th>
                    <th className="py-2 pr-4 font-medium">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {drivers.map((d) => (
                    <tr key={d.id} className="border-b border-slate-100 last:border-0">
                      <td className="py-2 pr-4 font-medium text-slate-900">{d.full_name || "—"}</td>
                      <td className="py-2 pr-4 text-slate-700">{d.email || "—"}</td>
                      <td className="py-2 pr-4 text-slate-700">{d.phone || "—"}</td>
                      <td className="py-2 pr-4 text-slate-700">{d.driver_license || "—"}</td>
                      <td className="py-2 pr-4 text-slate-700">{formatDate(d.created_at)}</td>
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
