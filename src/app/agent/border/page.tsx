import { Globe } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/utils";
import { CountryBadge } from "@/components/vehicles/CountryBadge";
import { BorderRegisterDialog } from "./BorderRegisterDialog";

export const dynamic = "force-dynamic";

export default async function AgentBorderPage() {
  const supabase = createClient();
  const { data: transit } = await supabase
    .from("vehicles")
    .select("*")
    .eq("is_border_transit", true)
    .order("border_entry_at", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Border crossings"
        description="Register foreign vehicles entering Gabon. Scan the plate, record the driver, and flag for verification."
        actions={<BorderRegisterDialog />}
      />

      <Card>
        <CardBody>
          {!transit || transit.length === 0 ? (
            <EmptyState
              icon={<Globe className="h-8 w-8" />}
              title="No border registrations yet"
              description='Use "Register border crossing" when a foreign vehicle enters a checkpoint.'
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-stone-500 dark:text-slate-400 border-b border-stone-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2 pr-4 font-medium">Plate</th>
                    <th className="py-2 pr-4 font-medium">Country</th>
                    <th className="py-2 pr-4 font-medium">Driver</th>
                    <th className="py-2 pr-4 font-medium">Checkpoint</th>
                    <th className="py-2 pr-4 font-medium">Entry</th>
                  </tr>
                </thead>
                <tbody>
                  {transit.map((v) => (
                    <tr key={v.id} className="border-b border-stone-100 dark:border-slate-800 last:border-0">
                      <td className="py-2 pr-4 font-mono font-medium">{v.plate_number}</td>
                      <td className="py-2 pr-4"><CountryBadge code={v.registration_country} /></td>
                      <td className="py-2 pr-4">{v.transit_driver_name || "—"}</td>
                      <td className="py-2 pr-4">{v.border_checkpoint || "—"}</td>
                      <td className="py-2 pr-4">{v.border_entry_at ? formatDate(v.border_entry_at) : "—"}</td>
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
