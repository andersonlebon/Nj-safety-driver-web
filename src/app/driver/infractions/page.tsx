import { AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function DriverInfractionsPage() {
  const profile = await getCurrentProfile();
  const supabase = createClient();

  const { data: infractions } = await supabase
    .from("infractions")
    .select("*")
    .eq("driver_id", profile!.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <PageHeader
        title="Infractions"
        description="All infractions associated with your registered vehicles."
      />
      <Card>
        <CardBody>
          {!infractions || infractions.length === 0 ? (
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
                  {infractions.map((i) => (
                    <tr key={i.id} className="border-b border-stone-100 dark:border-slate-800 last:border-0 align-top">
                      <td className="py-2 pr-4 text-stone-600 dark:text-slate-400 whitespace-nowrap">
                        {formatDate(i.created_at)}
                      </td>
                      <td className="py-2 pr-4 font-medium text-stone-900 dark:text-stone-100">
                        {i.plate_number}
                      </td>
                      <td className="py-2 pr-4 text-stone-600 dark:text-slate-400">
                        {i.infraction_type}
                        {i.description && (
                          <span className="block text-xs text-stone-400 dark:text-slate-500 mt-0.5">
                            {i.description}
                          </span>
                        )}
                      </td>
                      <td className="py-2 pr-4 text-stone-600 dark:text-slate-400">{i.location || "—"}</td>
                      <td className="py-2 pr-4 text-stone-600 dark:text-slate-400">
                        {formatCurrency(Number(i.fine_amount))}
                      </td>
                      <td className="py-2 pr-4">
                        <StatusBadge status={i.status} />
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
