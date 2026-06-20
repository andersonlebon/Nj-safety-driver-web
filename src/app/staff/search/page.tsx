import { Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Alert } from "@/components/ui/Alert";
import { formatCurrency, formatDate } from "@/lib/utils";
import { normalizePlateForCountry } from "@/lib/vehicles";
import { DEFAULT_COUNTRY } from "@/lib/countries";
import { CountryBadge } from "@/components/vehicles/CountryBadge";
import { lastKnownLocation, type TrackingEvent } from "@/lib/tracking";
import {
  LastKnownLocationBadge,
  VehicleTrackingTimeline,
} from "@/components/tracking/VehicleTrackingTimeline";
import { LogVehicleCheckIn } from "@/components/tracking/LogVehicleCheckIn";
import { SearchPlateDialog } from "./SearchPlateDialog";
import { CreateInfractionDialog } from "./CreateInfractionDialog";
import { StaffDocumentsLoader } from "@/components/documents/StaffDocumentsLoader";
import { requireStaffProfile } from "@/lib/auth";

export default async function StaffSearchPage({
  searchParams,
}: {
  searchParams: { plate?: string; country?: string };
}) {
  const rawPlate = searchParams.plate?.trim();
  const country = searchParams.country?.trim() || DEFAULT_COUNTRY;
  const plate = rawPlate ? normalizePlateForCountry(rawPlate, country) : null;

  await requireStaffProfile();
  const supabase = createClient();

  const [
    { data: templates },
    vehicleResult,
    infractionsResult,
    trackingResult,
  ] = await Promise.all([
    supabase
      .from("infraction_templates")
      .select("code, label, amount, points, category")
      .eq("active", true)
      .order("label", { ascending: true }),
    plate
      ? supabase
          .from("vehicles")
          .select("*")
          .eq("plate_number", plate)
          .eq("registration_country", country)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    plate
      ? supabase
          .from("infractions")
          .select("*")
          .eq("plate_number", plate)
          .eq("registration_country", country)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: null }),
    plate
      ? supabase
          .from("vehicle_tracking_events")
          .select("*")
          .eq("plate_number", plate)
          .order("created_at", { ascending: false })
          .limit(20)
      : Promise.resolve({ data: null }),
  ]);

  const vehicle = vehicleResult.data;
  let owner = null;
  if (vehicle?.owner_id) {
    const { data: o } = await supabase
      .from("profiles")
      .select("id, full_name, phone, email, national_id, driver_license, address")
      .eq("id", vehicle.owner_id)
      .maybeSingle();
    owner = o;
  }

  const infractions = infractionsResult.data;
  const unpaidTotal = (infractions ?? [])
    .filter((i) => i.status === "unpaid")
    .reduce((s, i) => s + Number(i.fine_amount ?? 0), 0);
  const unpaidCount = (infractions ?? []).filter((i) => i.status === "unpaid").length;

  const trackingEvents: TrackingEvent[] = ((trackingResult.data ?? []) as Array<{
    id: string; event_type: string; location: string | null;
    latitude: string | null; longitude: string | null;
    notes: string | null; created_at: string;
  }>).map((e) => ({
    id: e.id,
    event_type: e.event_type as TrackingEvent["event_type"],
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
        description="Look up a vehicle by plate number to view details, fines, tracking, and file infractions."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <SearchPlateDialog initialPlate={rawPlate} initialCountry={country} />
            {plate && (
              <CreateInfractionDialog
                plate={plate}
                country={country}
                vehicleId={vehicle?.id ?? null}
                driverId={vehicle?.owner_id ?? null}
                templates={templates ?? undefined}
              />
            )}
          </div>
        }
      />

      {plate && !vehicle && (
        <Alert variant="warning">
          No registered vehicle found for plate <strong>{plate}</strong> (
          <CountryBadge code={country} />
          ). You can still file an infraction and log a check-in for this plate.
        </Alert>
      )}

      {plate && unpaidCount > 0 && (
        <Alert variant="error">
          <strong>{unpaidCount} unpaid infraction{unpaidCount !== 1 ? "s" : ""}</strong>{" "}
          — outstanding total {formatCurrency(unpaidTotal)} for plate{" "}
          <strong>{plate}</strong>.
        </Alert>
      )}

      {!plate && (
        <EmptyState
          icon={<Search className="h-8 w-8" />}
          title="Search for a plate"
          description='Click "Search plate" above to look up a vehicle and its history.'
        />
      )}

      {plate && lastLocation && (
        <LastKnownLocationBadge location={lastLocation.location} at={lastLocation.at} />
      )}

      {plate && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardBody>
              <div className="flex items-center justify-between gap-2 mb-4">
                <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                  Vehicle & owner
                </h3>
                <LogVehicleCheckIn plate={plate} country={country} vehicleId={vehicle?.id ?? null} />
              </div>
              {!vehicle ? (
                <EmptyState
                  icon={<Search className="h-8 w-8" />}
                  title="No record"
                  description={`No vehicle is registered with plate ${plate}.`}
                />
              ) : (
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  <Dt>Plate</Dt><Dd>{vehicle.plate_number}</Dd>
                  <Dt>Country</Dt><Dd><CountryBadge code={vehicle.registration_country} /></Dd>
                  <Dt>Brand</Dt><Dd>{vehicle.brand || "—"}</Dd>
                  <Dt>Model</Dt><Dd>{vehicle.model || "—"}</Dd>
                  <Dt>Color</Dt><Dd>{vehicle.color || "—"}</Dd>
                  <Dt>Year</Dt><Dd>{vehicle.year ?? "—"}</Dd>
                  <Dt>Insurance</Dt><Dd>{vehicle.insurance_status ? "Valid" : "Missing"}</Dd>
                  <Dt>Inspection</Dt><Dd>{vehicle.inspection_status ? "Valid" : "Missing"}</Dd>
                  <div className="col-span-2 mt-2 pt-2 border-t border-stone-200 dark:border-slate-800" />
                  <Dt>Owner</Dt><Dd>{owner?.full_name || "—"}</Dd>
                  <Dt>Email</Dt><Dd>{owner?.email || "—"}</Dd>
                  <Dt>Phone</Dt><Dd>{owner?.phone || "—"}</Dd>
                  <Dt>National ID</Dt><Dd>{owner?.national_id || "—"}</Dd>
                  <Dt>License #</Dt><Dd>{owner?.driver_license || "—"}</Dd>
                  <Dt>Address</Dt><Dd>{owner?.address || "—"}</Dd>
                </dl>
              )}
            </CardBody>
          </Card>

          {(owner || vehicle) && (
            <Card className="lg:col-span-2">
              <CardBody>
                <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 mb-4">Documents</h3>
                <StaffDocumentsLoader
                  ownerId={owner?.id ?? vehicle?.owner_id}
                  vehicleId={vehicle?.id}
                  title="Driver & vehicle files"
                />
              </CardBody>
            </Card>
          )}

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
                <EmptyState title="No infractions on this plate" description="No infractions have been filed for this vehicle." />
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
                        <tr key={i.id} className="border-b border-stone-100 dark:border-slate-800 last:border-0">
                          <td className="py-2 pr-4 text-stone-600 dark:text-slate-400">{formatDate(i.created_at)}</td>
                          <td className="py-2 pr-4 text-stone-600 dark:text-slate-400">{i.infraction_type}</td>
                          <td className="py-2 pr-4 text-stone-600 dark:text-slate-400">{i.location || "—"}</td>
                          <td className="py-2 pr-4 text-stone-600 dark:text-slate-400">{formatCurrency(Number(i.fine_amount))}</td>
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

function Dt({ children }: { children: React.ReactNode }) {
  return <dt className="text-stone-500 dark:text-slate-400">{children}</dt>;
}
function Dd({ children }: { children: React.ReactNode }) {
  return <dd className="text-stone-900 dark:text-stone-100 font-medium break-all">{children}</dd>;
}
