import { Car } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/utils";

export default async function AdminVehiclesPage() {
  const supabase = createClient();
  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("*, profiles!vehicles_owner_id_fkey(full_name, email)")
    .order("created_at", { ascending: false });

  return (
    <div>
      <PageHeader title="Vehicles" description="All registered vehicles." />
      <Card>
        <CardBody>
          {!vehicles || vehicles.length === 0 ? (
            <EmptyState
              icon={<Car className="h-8 w-8" />}
              title="No vehicles"
              description="Vehicles registered by drivers will appear here."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-2 pr-4 font-medium">Plate</th>
                    <th className="py-2 pr-4 font-medium">Vehicle</th>
                    <th className="py-2 pr-4 font-medium">Owner</th>
                    <th className="py-2 pr-4 font-medium">Insurance</th>
                    <th className="py-2 pr-4 font-medium">Inspection</th>
                    <th className="py-2 pr-4 font-medium">Registered</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicles.map((v: any) => (
                    <tr key={v.id} className="border-b border-slate-100 last:border-0">
                      <td className="py-2 pr-4 font-medium text-slate-900">{v.plate_number}</td>
                      <td className="py-2 pr-4 text-slate-700">
                        {[v.brand, v.model, v.year].filter(Boolean).join(" • ") || "—"}
                      </td>
                      <td className="py-2 pr-4 text-slate-700">
                        {v.profiles?.full_name || v.profiles?.email || "—"}
                      </td>
                      <td className="py-2 pr-4">
                        <span className={v.insurance_status ? "badge-paid" : "badge-unpaid"}>
                          {v.insurance_status ? "Valid" : "Missing"}
                        </span>
                      </td>
                      <td className="py-2 pr-4">
                        <span className={v.inspection_status ? "badge-paid" : "badge-unpaid"}>
                          {v.inspection_status ? "Valid" : "Missing"}
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-slate-700">{formatDate(v.created_at)}</td>
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
