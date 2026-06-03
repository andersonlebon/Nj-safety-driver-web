import { Globe } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { friendlyError } from "@/lib/errors";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Alert } from "@/components/ui/Alert";
import { formatDate } from "@/lib/utils";
import { CountryBadge } from "@/components/vehicles/CountryBadge";
import { BorderRegisterDialog } from "./BorderRegisterDialog";
import { assessTransitIdAuthenticity, TRANSIT_ID_DOC_TYPE } from "@/lib/transit-id-documents";

export const dynamic = "force-dynamic";

type BorderTransitRow = {
  id: string;
  plate_number: string;
  registration_country: string;
  transit_driver_name: string | null;
  border_checkpoint: string | null;
  border_entry_at: string | null;
};

export default async function AgentBorderPage() {
  const profile = await requireRole(["agent", "admin"]);

  let transit: BorderTransitRow[] = [];
  let loadError: string | null = null;

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("vehicles")
      .select(
        "id, plate_number, registration_country, transit_driver_name, border_checkpoint, border_entry_at"
      )
      .eq("is_border_transit", true)
      .order("border_entry_at", { ascending: false })
      .limit(50);

    if (error) {
      loadError = friendlyError(error);
    } else {
      transit = (data ?? []) as BorderTransitRow[];
    }
  } catch (err) {
    loadError = friendlyError(err);
  }

  const idCompleteByVehicle: Record<string, boolean> = {};
  if (!loadError && transit.length > 0) {
    const supabase = createClient();
    const ids = transit.map((v) => v.id);
    const { data: idDocs } = await supabase
      .from("documents")
      .select("vehicle_id, label, file_path, file_name")
      .in("vehicle_id", ids)
      .eq("doc_type", TRANSIT_ID_DOC_TYPE);

    for (const vid of ids) {
      const rows = (idDocs ?? []).filter((d) => d.vehicle_id === vid);
      idCompleteByVehicle[vid] = assessTransitIdAuthenticity(rows).complete;
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Border crossings"
        description="Register foreign vehicles entering Gabon. Scan the plate, record the driver, and flag for verification."
        actions={<BorderRegisterDialog agentId={profile.id} />}
      />

      {loadError && (
        <Alert variant="error">
          Could not load border registrations. {loadError}
        </Alert>
      )}

      <Card>
        <CardBody>
          {!loadError && transit.length === 0 ? (
            <EmptyState
              icon={<Globe className="h-8 w-8" />}
              title="No border registrations yet"
              description='Use "Register border crossing" when a foreign vehicle enters a checkpoint.'
            />
          ) : !loadError ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-stone-500 dark:text-slate-400 border-b border-stone-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2 pr-4 font-medium">Plate</th>
                    <th className="py-2 pr-4 font-medium">Country</th>
                    <th className="py-2 pr-4 font-medium">Driver</th>
                    <th className="py-2 pr-4 font-medium">Checkpoint</th>
                    <th className="py-2 pr-4 font-medium">Entry</th>
                    <th className="py-2 pr-4 font-medium">ID docs</th>
                  </tr>
                </thead>
                <tbody>
                  {transit.map((v) => {
                    const idOk = idCompleteByVehicle[v.id];
                    return (
                    <tr
                      key={v.id}
                      className="border-b border-stone-100 dark:border-slate-800 last:border-0"
                    >
                      <td className="py-2 pr-4 font-mono font-medium">
                        {v.plate_number}
                      </td>
                      <td className="py-2 pr-4">
                        <CountryBadge code={v.registration_country} />
                      </td>
                      <td className="py-2 pr-4">
                        {v.transit_driver_name || "—"}
                      </td>
                      <td className="py-2 pr-4">
                        {v.border_checkpoint || "—"}
                      </td>
                      <td className="py-2 pr-4">
                        {v.border_entry_at ? formatDate(v.border_entry_at) : "—"}
                      </td>
                      <td className="py-2 pr-4">
                        <span
                          className={
                            idOk
                              ? "text-brand-700 dark:text-brand-300 text-xs font-medium"
                              : "text-amber-700 dark:text-amber-400 text-xs"
                          }
                        >
                          {idOk ? "Front & back" : "Incomplete"}
                        </span>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
        </CardBody>
      </Card>
    </div>
  );
}
