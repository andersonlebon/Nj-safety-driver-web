import { Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Alert } from "@/components/ui/Alert";
import { formatCurrency, formatDate, normalizePlate } from "@/lib/utils";
import { lastKnownLocation, type TrackingEvent } from "@/lib/tracking";
import {
  LastKnownLocationBadge,
  VehicleTrackingTimeline,
} from "@/components/tracking/VehicleTrackingTimeline";
import { LogVehicleCheckIn } from "@/components/tracking/LogVehicleCheckIn";
import { SearchForm } from "./SearchForm";
import { CreateInfractionForm } from "./CreateInfractionForm";
import { requireRole } from "@/lib/auth";

export default async function AgentSearchPage({
  searchParams,
}: {
  searchParams: { plate?: string };
}) {
  const rawPlate = searchParams.plate?.trim();
  const plate = rawPlate ? normalizePlate(rawPlate) : null;

  const supabase = createClient();
  const profile = await requireRole(["agent", "admin"]);

  let vehicle = null;
  let owner = null;

  if (plate) {
    const { data: v } = await supabase
      .from("vehicles")
      .select("*")
      .eq("plate_number", plate)
      .maybeSingle();

    vehicle = v;
    if (v) {
      const { data: o } = await supabase
        .from("profiles")
        .select(
          "id, full_name, phone, email, national_id, driver_license, address"
        )
        .eq("id", v.owner_id)
        .maybeSingle();
      owner = o;
    }
  }

  const infractions = plate
    ? (
        await supabase
          .from("infractions")
          .select("*")
          .eq("plate_number", plate)
          .order("created_at", { ascending: false })
      ).data
    : null;

  const trackingRows = plate
    ? (
        await supabase
          .from("vehicle_tracking_events")
          .select("*")
          .eq("plate_number", plate)
          .order("created_at", { ascending: false })
          .limit(20)
      ).data
    : null;

  const trackingEvents: TrackingEvent[] = (trackingRows ?? []).map((e) => ({
    id: e.id,
    event_type: e.event_type,
    location: e.location,
    latitude: e.latitude != null ? Number(e.latitude) : null,
    longitude: e.longitude != null ? Number(e.longitude) : null,
    notes: e.notes,
    created_at: e.created_at,
  }));

  const lastLocation = lastKnownLocation(trackingEvents);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Plate search"
        description="Look up a vehicle by plate number to view details, tracking history, and file infractions."
      />

      <Card>
        <CardBody>
          <SearchForm initialPlate={rawPlate} />
        </CardBody>
      </Card>

      {plate && !vehicle && (
        <Alert variant="warning">
          No registered vehicle found for plate <strong>{plate}</strong>. You can
          still file an infraction and log a check-in for this plate.
        </Alert>
      )}

      {plate && lastLocation && (
        <LastKnownLocationBadge
          location={lastLocation.location}
          at={lastLocation.at}
        />
      )}

      {plate && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardBody>
              <div className="flex items-center justify-between gap-2 mb-4">
                <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                  Vehicle & owner
                </h3>
                <LogVehicleCheckIn
                  plate={plate}
                  vehicleId={vehicle?.id ?? null}
                />
              </div>
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
                  <div className="col-span-2 mt-2 pt-2 border-t border-stone-200 dark:border-slate-800" />
                  <DetailRow label="Owner" value={owner?.full_name || "—"} />
                  <DetailRow label="Email" value={owner?.email || "—"} />
                  <DetailRow label="Phone" value={owner?.phone || "—"} />
                  <DetailRow
                    label="National ID"
                    value={owner?.national_id || "—"}
                  />
                  <DetailRow
                    label="License #"
                    value={owner?.driver_license || "—"}
                  />
                  <DetailRow label="Address" value={owner?.address || "—"} />
                </dl>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 mb-4">
                File new infraction
              </h3>
              <CreateInfractionForm
                plate={plate}
                vehicleId={vehicle?.id ?? null}
                driverId={vehicle?.owner_id ?? null}
                agentId={profile.id}
              />
            </CardBody>
          </Card>

          <Card className="lg:col-span-2">
            <CardBody>
              <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 mb-4">
                Tracking history for {plate}
              </h3>
              <VehicleTrackingTimeline events={trackingEvents} />
            </CardBody>
          </Card>

          <Card className="lg:col-span-2">
            <CardBody>
              <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 mb-4">
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
                    <thead className="text-left text-stone-500 dark:text-slate-400 border-b border-stone-200 dark:border-slate-800">
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
                        <tr
                          key={i.id}
                          className="border-b border-stone-100 dark:border-slate-800 last:border-0"
                        >
                          <td className="py-2 pr-4 text-stone-600 dark:text-slate-400">
                            {formatDate(i.created_at)}
                          </td>
                          <td className="py-2 pr-4 text-stone-600 dark:text-slate-400">
                            {i.infraction_type}
                          </td>
                          <td className="py-2 pr-4 text-stone-600 dark:text-slate-400">
                            {i.location || "—"}
                          </td>
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
      <dt className="text-stone-500 dark:text-slate-400">{label}</dt>
      <dd className="text-stone-900 dark:text-stone-100 font-medium break-all">
        {value}
      </dd>
    </>
  );
}
