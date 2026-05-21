import { Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Alert } from "@/components/ui/Alert";
import { formatCurrency, formatDate, normalizePlate } from "@/lib/utils";
import { SearchForm } from "./SearchForm";
import { CreateInfractionForm } from "./CreateInfractionForm";
import { getCurrentProfile } from "@/lib/auth";

export default async function AgentSearchPage({
  searchParams,
}: {
  searchParams: { plate?: string };
}) {
  const rawPlate = searchParams.plate?.trim();
  const plate = rawPlate ? normalizePlate(rawPlate) : null;

  const supabase = createClient();
  const profile = await getCurrentProfile();

  const vehicle =
    plate
      ? (
          await supabase
            .from("vehicles")
            .select("*, profiles!vehicles_owner_id_fkey(*)")
            .eq("plate_number", plate)
            .maybeSingle()
        ).data
      : null;

  const infractions = plate
    ? (
        await supabase
          .from("infractions")
          .select("*")
          .eq("plate_number", plate)
          .order("created_at", { ascending: false })
      ).data
    : null;

  const owner = vehicle?.profiles as
    | {
        id: string;
        full_name: string | null;
        phone: string | null;
        email: string | null;
        national_id: string | null;
        driver_license: string | null;
        address: string | null;
      }
    | null
    | undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Plate search"
        description="Look up a vehicle by plate number to view details and file infractions."
      />

      <Card>
        <CardBody>
          <SearchForm initialPlate={rawPlate} />
        </CardBody>
      </Card>

      {plate && !vehicle && (
        <Alert variant="warning">
          No registered vehicle found for plate <strong>{plate}</strong>. You can
          still file an infraction against this plate using the form below.
        </Alert>
      )}

      {plate && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardBody>
              <h3 className="text-sm font-semibold text-slate-900 mb-4">
                Vehicle & owner
              </h3>
              {!vehicle ? (
                <EmptyState
                  icon={<Search className="h-8 w-8" />}
                  title="No record"
                  description={`No vehicle is registered with plate ${plate}.`}
                />
              ) : (
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  <DetailRow label="Plate" value={vehicle.plate_number} />
                  <DetailRow label="Brand" value={vehicle.brand || "—"} />
                  <DetailRow label="Model" value={vehicle.model || "—"} />
                  <DetailRow label="Color" value={vehicle.color || "—"} />
                  <DetailRow label="Year" value={vehicle.year ?? "—"} />
                  <DetailRow
                    label="Insurance"
                    value={vehicle.insurance_status ? "Valid" : "Missing"}
                  />
                  <DetailRow
                    label="Inspection"
                    value={vehicle.inspection_status ? "Valid" : "Missing"}
                  />
                  <div className="col-span-2 mt-2 pt-2 border-t border-slate-200" />
                  <DetailRow label="Owner" value={owner?.full_name || "—"} />
                  <DetailRow label="Email" value={owner?.email || "—"} />
                  <DetailRow label="Phone" value={owner?.phone || "—"} />
                  <DetailRow label="National ID" value={owner?.national_id || "—"} />
                  <DetailRow label="License #" value={owner?.driver_license || "—"} />
                  <DetailRow label="Address" value={owner?.address || "—"} />
                </dl>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <h3 className="text-sm font-semibold text-slate-900 mb-4">
                File new infraction
              </h3>
              <CreateInfractionForm
                plate={plate}
                vehicleId={vehicle?.id ?? null}
                driverId={vehicle?.owner_id ?? null}
                agentId={profile!.id}
              />
            </CardBody>
          </Card>

          <Card className="lg:col-span-2">
            <CardBody>
              <h3 className="text-sm font-semibold text-slate-900 mb-4">
                Infractions for {plate}
              </h3>
              {!infractions || infractions.length === 0 ? (
                <EmptyState
                  title="No infractions on this plate"
                  description="No infractions have been filed for this vehicle."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="py-2 pr-4 font-medium">Date</th>
                        <th className="py-2 pr-4 font-medium">Type</th>
                        <th className="py-2 pr-4 font-medium">Location</th>
                        <th className="py-2 pr-4 font-medium">Amount</th>
                        <th className="py-2 pr-4 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {infractions.map((i) => (
                        <tr key={i.id} className="border-b border-slate-100 last:border-0">
                          <td className="py-2 pr-4 text-slate-700">{formatDate(i.created_at)}</td>
                          <td className="py-2 pr-4 text-slate-700">{i.infraction_type}</td>
                          <td className="py-2 pr-4 text-slate-700">{i.location || "—"}</td>
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
      )}
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <>
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-slate-900 font-medium break-all">{value}</dd>
    </>
  );
}
