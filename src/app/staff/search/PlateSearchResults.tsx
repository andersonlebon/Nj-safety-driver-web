import {
  AlertTriangle,
  Car,
  ClipboardList,
  MapPin,
  Search,
  User,
  Wallet,
} from "lucide-react";
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { CountryBadge } from "@/components/vehicles/CountryBadge";
import { VehiclePhotoPreview } from "@/components/vehicles/VehiclePhotoPreview";
import { PlateSearchDocumentsSection } from "./PlateSearchDocumentsSection";
import {
  LastKnownLocationBadge,
  VehicleTrackingTimeline,
} from "@/components/tracking/VehicleTrackingTimeline";
import { VerificationStatusBadge } from "@/app/staff/DriverVerificationPanel";
import { formatCurrency, formatDate } from "@/lib/utils";
import { VERIFICATION_LABELS } from "@/lib/verification";
import type { TrackingEvent } from "@/lib/tracking";
import type { Database, VerificationStatus } from "@/lib/types/database";

type Vehicle = Database["public"]["Tables"]["vehicles"]["Row"];
type Infraction = Database["public"]["Tables"]["infractions"]["Row"];
type Owner = {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  national_id: string | null;
  driver_license: string | null;
  address: string | null;
};

type Props = {
  plate: string;
  country: string;
  vehicle: Vehicle | null;
  owner: Owner | null;
  infractions: Infraction[];
  trackingEvents: TrackingEvent[];
  lastLocation: { location: string; at: string } | null;
  checkInAction: React.ReactNode;
  vehiclePhotoUrl?: string | null;
};

export function PlateSearchResults({
  plate,
  country,
  vehicle,
  owner,
  infractions,
  trackingEvents,
  lastLocation,
  checkInAction,
  vehiclePhotoUrl = null,
}: Props) {
  const unpaid = infractions.filter((i) => i.status === "unpaid");
  const unpaidTotal = unpaid.reduce((sum, i) => sum + Number(i.fine_amount ?? 0), 0);
  const vehicleStatus = (vehicle?.verification_status ?? "pending_review") as VerificationStatus;
  const registered = Boolean(vehicle);

  return (
    <div className="space-y-6">
      <PlateSearchResultHeader
        plate={plate}
        country={country}
        registered={registered}
        vehicle={vehicle}
        vehicleStatus={vehicleStatus}
        unpaidCount={unpaid.length}
        unpaidTotal={unpaidTotal}
        lastLocation={lastLocation}
        vehiclePhotoUrl={vehiclePhotoUrl}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label="Infractions on plate"
          value={infractions.length}
          icon={<ClipboardList className="h-4 w-4" />}
          accent="navy"
          hint={`${country} registration`}
        />
        <KpiCard
          label="Unpaid fines"
          value={unpaid.length === 0 ? "None" : formatCurrency(unpaidTotal)}
          icon={<Wallet className="h-4 w-4" />}
          accent={unpaid.length > 0 ? "red" : "brand"}
          hint={
            unpaid.length > 0
              ? `${unpaid.length} open ticket${unpaid.length !== 1 ? "s" : ""}`
              : "All clear"
          }
        />
        <KpiCard
          label="Tracking events"
          value={trackingEvents.length}
          icon={<MapPin className="h-4 w-4" />}
          accent="stone"
          hint={lastLocation ? "Last location below" : "No check-ins yet"}
        />
        <KpiCard
          label="Vehicle record"
          value={registered ? "Registered" : "Not found"}
          icon={registered ? <Car className="h-4 w-4" /> : <Search className="h-4 w-4" />}
          accent={registered ? "brand" : "gold"}
          hint={
            registered
              ? VERIFICATION_LABELS[vehicleStatus]
              : "You can still file fines"
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-4 w-4 text-stone-500 dark:text-slate-400" />
                Vehicle
              </CardTitle>
              <CardDescription>
                {registered
                  ? "Registered vehicle details for this plate and country."
                  : "No vehicle is linked to this plate in the registry."}
              </CardDescription>
            </div>
            {checkInAction}
          </CardHeader>
          <CardBody className="pt-0">
            {!vehicle ? (
              <div className="rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/20 p-4 text-sm text-amber-950 dark:text-amber-100">
                <p className="font-medium">This plate is not registered</p>
                <p className="mt-1 text-amber-900/80 dark:text-amber-200/80">
                  Staff can still log a check-in, review any existing infractions, and
                  file a new fine against <span className="font-mono font-semibold">{plate}</span>{" "}
                  (<CountryBadge code={country} />).
                </p>
              </div>
            ) : (
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <InfoLabel>Plate</InfoLabel>
                <InfoValue mono>{vehicle.plate_number}</InfoValue>
                <InfoLabel>Country</InfoLabel>
                <InfoValue>
                  <CountryBadge code={vehicle.registration_country} />
                </InfoValue>
                <InfoLabel>Status</InfoLabel>
                <InfoValue>
                  <VerificationStatusBadge status={vehicleStatus} />
                </InfoValue>
                <InfoLabel>Brand / model</InfoLabel>
                <InfoValue>
                  {[vehicle.brand, vehicle.model].filter(Boolean).join(" ") || "—"}
                </InfoValue>
                <InfoLabel>Color</InfoLabel>
                <InfoValue>{vehicle.color || "—"}</InfoValue>
                <InfoLabel>Year</InfoLabel>
                <InfoValue>{vehicle.year ?? "—"}</InfoValue>
                <InfoLabel>Insurance</InfoLabel>
                <InfoValue>
                  <ComplianceBadge ok={Boolean(vehicle.insurance_status)} label="Insurance" />
                </InfoValue>
                <InfoLabel>Inspection</InfoLabel>
                <InfoValue>
                  <ComplianceBadge ok={Boolean(vehicle.inspection_status)} label="Inspection" />
                </InfoValue>
              </dl>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="h-4 w-4 text-stone-500 dark:text-slate-400" />
                Owner / driver
              </CardTitle>
              <CardDescription>
                {owner
                  ? "Contact and ID details for the registered owner."
                  : registered
                    ? "No owner profile is linked to this vehicle."
                    : "Owner details appear only when a vehicle record exists."}
              </CardDescription>
            </div>
          </CardHeader>
          <CardBody className="pt-0">
            {!owner ? (
              <EmptyState
                icon={<User className="h-8 w-8" />}
                title={registered ? "No owner on file" : "Owner unknown"}
                description={
                  registered
                    ? "This vehicle has no linked driver profile."
                    : "Register the vehicle first to see owner information here."
                }
              />
            ) : (
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <InfoLabel>Name</InfoLabel>
                <InfoValue>{owner.full_name || "—"}</InfoValue>
                <InfoLabel>Phone</InfoLabel>
                <InfoValue>{owner.phone || "—"}</InfoValue>
                <InfoLabel>Email</InfoLabel>
                <InfoValue>{owner.email || "—"}</InfoValue>
                <InfoLabel>National ID</InfoLabel>
                <InfoValue mono>{owner.national_id || "—"}</InfoValue>
                <InfoLabel>License #</InfoLabel>
                <InfoValue mono>{owner.driver_license || "—"}</InfoValue>
                <InfoLabel>Address</InfoLabel>
                <InfoValue className="col-span-1">{owner.address || "—"}</InfoValue>
              </dl>
            )}
          </CardBody>
        </Card>
      </div>

      {(owner || vehicle) && (
        <PlateSearchDocumentsSection
          ownerId={owner?.id ?? vehicle?.owner_id}
          vehicleId={vehicle?.id}
        />
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-stone-500 dark:text-slate-400" />
                Tracking
              </CardTitle>
              <CardDescription>
                Check-ins and location history for {plate}.
              </CardDescription>
            </div>
          </CardHeader>
          <CardBody className="pt-0">
            <VehicleTrackingTimeline events={trackingEvents} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-stone-500 dark:text-slate-400" />
                Infractions
              </CardTitle>
              <CardDescription>
                Fines filed against this plate and country.
              </CardDescription>
            </div>
          </CardHeader>
          <CardBody className="pt-0">
            {infractions.length === 0 ? (
              <EmptyState
                title="No infractions"
                description="No fines have been filed for this plate yet."
              />
            ) : (
              <div className="overflow-x-auto -mx-1">
                <table className="w-full text-sm">
                  <thead className="text-left text-stone-500 dark:text-slate-400 border-b border-stone-200 dark:border-slate-800">
                    <tr>
                      <th className="py-2 px-1 pr-4 font-medium">Date</th>
                      <th className="py-2 pr-4 font-medium">Type</th>
                      <th className="py-2 pr-4 font-medium">Location</th>
                      <th className="py-2 pr-4 font-medium">Amount</th>
                      <th className="py-2 pr-4 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {infractions.map((infraction) => (
                      <tr
                        key={infraction.id}
                        className="border-b border-stone-100 dark:border-slate-800 last:border-0"
                      >
                        <td className="py-2.5 px-1 pr-4 text-stone-600 dark:text-slate-400 whitespace-nowrap">
                          {formatDate(infraction.created_at)}
                        </td>
                        <td className="py-2.5 pr-4 text-stone-900 dark:text-stone-100 font-medium">
                          {infraction.infraction_type}
                        </td>
                        <td className="py-2.5 pr-4 text-stone-600 dark:text-slate-400">
                          {infraction.location || "—"}
                        </td>
                        <td className="py-2.5 pr-4 text-stone-900 dark:text-stone-100 whitespace-nowrap">
                          {formatCurrency(Number(infraction.fine_amount))}
                        </td>
                        <td className="py-2.5 pr-4">
                          <StatusBadge status={infraction.status} />
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
    </div>
  );
}

function PlateSearchResultHeader({
  plate,
  country,
  registered,
  vehicle,
  vehicleStatus,
  unpaidCount,
  unpaidTotal,
  lastLocation,
  vehiclePhotoUrl,
}: {
  plate: string;
  country: string;
  registered: boolean;
  vehicle: Vehicle | null;
  vehicleStatus: VerificationStatus;
  unpaidCount: number;
  unpaidTotal: number;
  lastLocation: { location: string; at: string } | null;
  vehiclePhotoUrl?: string | null;
}) {
  const vehicleSummary =
    registered && vehicle
      ? [vehicle.brand, vehicle.model, vehicle.color, vehicle.year]
          .filter((part) => part != null && part !== "")
          .join(" · ")
      : null;

  return (
    <Card
      className={
        registered
          ? "ring-1 ring-brand-200/80 dark:ring-brand-900/50"
          : "ring-1 ring-amber-300/80 dark:ring-amber-900/50"
      }
    >
      <CardBody className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        {registered && (
          <VehiclePhotoPreview photoUrl={vehiclePhotoUrl ?? null} plate={plate} />
        )}
        <div className="min-w-0 flex-1 space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-stone-500 dark:text-slate-400">
            Search result
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <p className="font-mono text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
              {plate}
            </p>
            <CountryBadge code={country} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={
                registered
                  ? "badge-paid"
                  : "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200"
              }
            >
              {registered ? "Registered vehicle" : "Not in registry"}
            </span>
            {registered && <VerificationStatusBadge status={vehicleStatus} />}
            {unpaidCount > 0 && (
              <span className="badge-unpaid">
                {unpaidCount} unpaid · {formatCurrency(unpaidTotal)}
              </span>
            )}
          </div>
          {vehicleSummary && (
            <p className="text-sm text-stone-600 dark:text-slate-400">{vehicleSummary}</p>
          )}
          {!registered && (
            <p className="text-sm text-stone-600 dark:text-slate-400 max-w-2xl">
              No vehicle record matches this plate and country. Review tracking and infractions
              below, or file a new fine if needed.
            </p>
          )}
        </div>

        {lastLocation && (
          <div className="w-full lg:max-w-xs shrink-0">
            <LastKnownLocationBadge location={lastLocation.location} at={lastLocation.at} />
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function InfoLabel({ children }: { children: React.ReactNode }) {
  return (
    <dt className="text-stone-500 dark:text-slate-400">{children}</dt>
  );
}

function InfoValue({
  children,
  mono,
  className,
}: {
  children: React.ReactNode;
  mono?: boolean;
  className?: string;
}) {
  return (
    <dd
      className={[
        "text-stone-900 dark:text-stone-100 font-medium break-words",
        mono ? "font-mono text-[13px]" : "",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </dd>
  );
}

function ComplianceBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={ok ? "badge-paid" : "badge-unpaid"}>
      {ok ? `${label} valid` : `${label} missing`}
    </span>
  );
}
