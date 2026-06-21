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
import { getTranslations } from "@/i18n/server";
import { verificationStatusLabel } from "@/i18n/labels";
import type { Translator } from "@/i18n/translate";
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

export async function PlateSearchResults({
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
  const { t } = await getTranslations();
  const emDash = t("staff.shared.emDash");
  const unpaid = infractions.filter((i) => i.status === "unpaid");
  const unpaidTotal = unpaid.reduce((sum, i) => sum + Number(i.fine_amount ?? 0), 0);
  const vehicleStatus = (vehicle?.verification_status ?? "pending_review") as VerificationStatus;
  const registered = Boolean(vehicle);

  return (
    <div className="space-y-6">
      <PlateSearchResultHeader
        t={t}
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
          label={t("staff.search.results.infractionsOnPlate")}
          value={infractions.length}
          icon={<ClipboardList className="h-4 w-4" />}
          accent="navy"
          hint={t("staff.search.results.registrationHint", { country })}
        />
        <KpiCard
          label={t("staff.search.results.unpaidFines")}
          value={unpaid.length === 0 ? t("staff.search.results.none") : formatCurrency(unpaidTotal)}
          icon={<Wallet className="h-4 w-4" />}
          accent={unpaid.length > 0 ? "red" : "brand"}
          hint={
            unpaid.length > 0
              ? t("staff.search.results.openTicketsHint", { count: unpaid.length })
              : t("staff.search.results.allClear")
          }
        />
        <KpiCard
          label={t("staff.search.results.trackingEvents")}
          value={trackingEvents.length}
          icon={<MapPin className="h-4 w-4" />}
          accent="stone"
          hint={
            lastLocation
              ? t("staff.search.results.lastLocationBelow")
              : t("staff.search.results.noCheckInsYet")
          }
        />
        <KpiCard
          label={t("staff.search.results.vehicleRecord")}
          value={
            registered
              ? t("staff.search.results.registered")
              : t("staff.search.results.notFound")
          }
          icon={registered ? <Car className="h-4 w-4" /> : <Search className="h-4 w-4" />}
          accent={registered ? "brand" : "gold"}
          hint={
            registered
              ? verificationStatusLabel(t, vehicleStatus)
              : t("staff.search.results.canStillFileFines")
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-4 w-4 text-stone-500 dark:text-slate-400" />
                {t("staff.search.results.vehicleTitle")}
              </CardTitle>
              <CardDescription>
                {registered
                  ? t("staff.search.results.vehicleDescriptionRegistered")
                  : t("staff.search.results.vehicleDescriptionUnregistered")}
              </CardDescription>
            </div>
            {checkInAction}
          </CardHeader>
          <CardBody className="pt-0">
            {!vehicle ? (
              <div className="rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/20 p-4 text-sm text-amber-950 dark:text-amber-100">
                <p className="font-medium">{t("staff.search.results.notRegisteredTitle")}</p>
                <p className="mt-1 text-amber-900/80 dark:text-amber-200/80">
                  {t("staff.search.results.notRegisteredBody", { plate, country })}
                </p>
              </div>
            ) : (
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <InfoLabel>{t("staff.search.results.plate")}</InfoLabel>
                <InfoValue mono>{vehicle.plate_number}</InfoValue>
                <InfoLabel>{t("staff.search.results.country")}</InfoLabel>
                <InfoValue>
                  <CountryBadge code={vehicle.registration_country} />
                </InfoValue>
                <InfoLabel>{t("staff.search.results.status")}</InfoLabel>
                <InfoValue>
                  <VerificationStatusBadge status={vehicleStatus} />
                </InfoValue>
                <InfoLabel>{t("staff.search.results.brandModel")}</InfoLabel>
                <InfoValue>
                  {[vehicle.brand, vehicle.model].filter(Boolean).join(" ") || emDash}
                </InfoValue>
                <InfoLabel>{t("staff.search.results.color")}</InfoLabel>
                <InfoValue>{vehicle.color || emDash}</InfoValue>
                <InfoLabel>{t("staff.search.results.year")}</InfoLabel>
                <InfoValue>{vehicle.year ?? emDash}</InfoValue>
                <InfoLabel>{t("staff.search.results.insurance")}</InfoLabel>
                <InfoValue>
                  <ComplianceBadge
                    ok={Boolean(vehicle.insurance_status)}
                    validLabel={t("staff.search.results.insuranceValid")}
                    missingLabel={t("staff.search.results.insuranceMissing")}
                  />
                </InfoValue>
                <InfoLabel>{t("staff.search.results.inspection")}</InfoLabel>
                <InfoValue>
                  <ComplianceBadge
                    ok={Boolean(vehicle.inspection_status)}
                    validLabel={t("staff.search.results.inspectionValid")}
                    missingLabel={t("staff.search.results.inspectionMissing")}
                  />
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
                {t("staff.search.results.ownerTitle")}
              </CardTitle>
              <CardDescription>
                {owner
                  ? t("staff.search.results.ownerDescriptionWithOwner")
                  : registered
                    ? t("staff.search.results.ownerDescriptionNoOwnerRegistered")
                    : t("staff.search.results.ownerDescriptionNoVehicle")}
              </CardDescription>
            </div>
          </CardHeader>
          <CardBody className="pt-0">
            {!owner ? (
              <EmptyState
                icon={<User className="h-8 w-8" />}
                title={
                  registered
                    ? t("staff.search.results.noOwnerTitle")
                    : t("staff.search.results.ownerUnknownTitle")
                }
                description={
                  registered
                    ? t("staff.search.results.noOwnerDescription")
                    : t("staff.search.results.ownerUnknownDescription")
                }
              />
            ) : (
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <InfoLabel>{t("staff.search.results.name")}</InfoLabel>
                <InfoValue>{owner.full_name || emDash}</InfoValue>
                <InfoLabel>{t("staff.search.results.phone")}</InfoLabel>
                <InfoValue>{owner.phone || emDash}</InfoValue>
                <InfoLabel>{t("staff.search.results.email")}</InfoLabel>
                <InfoValue>{owner.email || emDash}</InfoValue>
                <InfoLabel>{t("staff.search.results.nationalId")}</InfoLabel>
                <InfoValue mono>{owner.national_id || emDash}</InfoValue>
                <InfoLabel>{t("staff.search.results.license")}</InfoLabel>
                <InfoValue mono>{owner.driver_license || emDash}</InfoValue>
                <InfoLabel>{t("staff.search.results.address")}</InfoLabel>
                <InfoValue className="col-span-1">{owner.address || emDash}</InfoValue>
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
                {t("staff.search.results.trackingTitle")}
              </CardTitle>
              <CardDescription>
                {t("staff.search.results.trackingDescription", { plate })}
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
                {t("staff.search.results.infractionsTitle")}
              </CardTitle>
              <CardDescription>
                {t("staff.search.results.infractionsDescription")}
              </CardDescription>
            </div>
          </CardHeader>
          <CardBody className="pt-0">
            {infractions.length === 0 ? (
              <EmptyState
                title={t("staff.search.results.noInfractionsTitle")}
                description={t("staff.search.results.noInfractionsDescription")}
              />
            ) : (
              <div className="overflow-x-auto -mx-1">
                <table className="w-full text-sm">
                  <thead className="text-left text-stone-500 dark:text-slate-400 border-b border-stone-200 dark:border-slate-800">
                    <tr>
                      <th className="py-2 px-1 pr-4 font-medium">
                        {t("staff.search.results.date")}
                      </th>
                      <th className="py-2 pr-4 font-medium">
                        {t("staff.search.results.type")}
                      </th>
                      <th className="py-2 pr-4 font-medium">
                        {t("staff.search.results.location")}
                      </th>
                      <th className="py-2 pr-4 font-medium">
                        {t("staff.search.results.amount")}
                      </th>
                      <th className="py-2 pr-4 font-medium">
                        {t("staff.search.results.status")}
                      </th>
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
                          {infraction.location || emDash}
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
  t,
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
  t: Translator;
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
            {t("staff.search.results.searchResult")}
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
              {registered
                ? t("staff.search.results.registeredVehicle")
                : t("staff.search.results.notInRegistry")}
            </span>
            {registered && <VerificationStatusBadge status={vehicleStatus} />}
            {unpaidCount > 0 && (
              <span className="badge-unpaid">
                {t("staff.search.results.unpaidBadge", {
                  count: unpaidCount,
                  amount: formatCurrency(unpaidTotal),
                })}
              </span>
            )}
          </div>
          {vehicleSummary && (
            <p className="text-sm text-stone-600 dark:text-slate-400">{vehicleSummary}</p>
          )}
          {!registered && (
            <p className="text-sm text-stone-600 dark:text-slate-400 max-w-2xl">
              {t("staff.search.results.noRecordDescription")}
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

function ComplianceBadge({
  ok,
  validLabel,
  missingLabel,
}: {
  ok: boolean;
  validLabel: string;
  missingLabel: string;
}) {
  return (
    <span className={ok ? "badge-paid" : "badge-unpaid"}>
      {ok ? validLabel : missingLabel}
    </span>
  );
}
