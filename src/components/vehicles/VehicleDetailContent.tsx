"use client";

import Link from "next/link";
import { AlertTriangle, Car, MapPin, QrCode, Wallet } from "lucide-react";
import { CountryBadge } from "@/components/vehicles/CountryBadge";
import { VehicleTrackingTimeline } from "@/components/tracking/VehicleTrackingTimeline";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { VERIFICATION_LABELS } from "@/lib/verification";
import { formatCurrency, formatDate } from "@/lib/utils";
import { isForeignVehicle } from "@/lib/vehicles";
import { totalsByPaymentStatus } from "@/components/dashboard/analytics";
import { TransitIdDocumentGallery } from "@/components/vehicles/TransitIdDocumentGallery";
import type { TrackingEvent } from "@/lib/tracking";
import type { TransitIdDocRow, TransitIdDocUrls } from "@/lib/transit-id-documents";
import type { Database, VerificationStatus } from "@/lib/types/database";

type Vehicle = Database["public"]["Tables"]["vehicles"]["Row"];
type Infraction = Database["public"]["Tables"]["infractions"]["Row"];

type Props = {
  vehicle: Vehicle;
  photoUrl?: string | null;
  owner?: { full_name: string | null; email: string | null; phone: string | null } | null;
  infractions?: Infraction[];
  trackingEvents?: TrackingEvent[];
  agentSearchUrl?: string;
  showOwner?: boolean;
  transitIdDocuments?: TransitIdDocRow[];
  transitIdUrls?: TransitIdDocUrls;
  showIdAuthenticityCheck?: boolean;
};

export function VehicleDetailContent({
  vehicle,
  photoUrl,
  owner,
  infractions = [],
  trackingEvents = [],
  agentSearchUrl,
  showOwner = true,
  transitIdDocuments = [],
  transitIdUrls = { front: null, back: null },
  showIdAuthenticityCheck = false,
}: Props) {
  const status = (vehicle.verification_status ?? "pending_review") as VerificationStatus;
  const unpaid = infractions.filter((i) => i.status === "unpaid");
  const paymentTotals = totalsByPaymentStatus(infractions);
  const foreign = isForeignVehicle(
    vehicle.registration_country,
    vehicle.is_foreign
  );

  const statusClass =
    status === "active"
      ? "badge-paid"
      : status === "rejected"
        ? "badge-unpaid"
        : "badge-pending";

  const showIdSection =
    vehicle.is_border_transit ||
    vehicle.transit_passport_id ||
    transitIdDocuments.length > 0;

  return (
    <div className="space-y-5">
      <div
        id="vehicle-detail-summary"
        className="flex flex-wrap items-start gap-3 scroll-mt-3"
      >
        <div className="aspect-video w-full sm:w-48 rounded-lg overflow-hidden bg-stone-100 dark:bg-slate-800 border border-stone-200 dark:border-slate-700">
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full min-h-[8rem] grid place-items-center text-stone-400">
              <Car className="h-10 w-10" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-mono text-lg font-bold text-stone-900 dark:text-stone-100">
              {vehicle.plate_number}
            </p>
            <CountryBadge code={vehicle.registration_country} />
            {foreign && (
              <span className="badge-pending text-[10px]">Foreign / transit</span>
            )}
            <span className={statusClass}>{VERIFICATION_LABELS[status]}</span>
          </div>
          <p className="text-sm text-stone-600 dark:text-slate-400">
            {[vehicle.brand, vehicle.model, vehicle.color, vehicle.year]
              .filter(Boolean)
              .join(" · ") || "No vehicle details"}
          </p>
          {agentSearchUrl && (
            <Link
              href={agentSearchUrl}
              className="inline-flex items-center gap-1 text-xs text-brand-700 dark:text-brand-300 hover:underline"
            >
              <QrCode className="h-3.5 w-3.5" />
              Agent search link
            </Link>
          )}
        </div>
      </div>

      <dl
        id="vehicle-detail-registration"
        className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm rounded-lg border border-stone-200 dark:border-slate-800 p-4 bg-stone-50/50 dark:bg-slate-900/40 scroll-mt-3"
      >
        <dt className="text-stone-500 dark:text-slate-400">Registered</dt>
        <dd>{formatDate(vehicle.created_at)}</dd>
        <dt className="text-stone-500 dark:text-slate-400">Insurance</dt>
        <dd>{vehicle.insurance_status ? "Valid" : "Missing"}</dd>
        <dt className="text-stone-500 dark:text-slate-400">Inspection</dt>
        <dd>{vehicle.inspection_status ? "Valid" : "Missing"}</dd>
        {vehicle.border_checkpoint && (
          <>
            <dt className="text-stone-500 dark:text-slate-400">Border checkpoint</dt>
            <dd>{vehicle.border_checkpoint}</dd>
          </>
        )}
        {vehicle.border_entry_at && (
          <>
            <dt className="text-stone-500 dark:text-slate-400">Border entry</dt>
            <dd>{formatDate(vehicle.border_entry_at)}</dd>
          </>
        )}
        {vehicle.transit_driver_name && (
          <>
            <dt className="text-stone-500 dark:text-slate-400">Transit driver</dt>
            <dd>{vehicle.transit_driver_name}</dd>
          </>
        )}
        {vehicle.transit_driver_phone && (
          <>
            <dt className="text-stone-500 dark:text-slate-400">Transit phone</dt>
            <dd>{vehicle.transit_driver_phone}</dd>
          </>
        )}
        {vehicle.transit_passport_id && (
          <>
            <dt className="text-stone-500 dark:text-slate-400">Passport / ID no.</dt>
            <dd className="font-mono">{vehicle.transit_passport_id}</dd>
          </>
        )}
        {vehicle.foreign_notes && (
          <>
            <dt className="text-stone-500 dark:text-slate-400 col-span-2">Notes</dt>
            <dd className="col-span-2">{vehicle.foreign_notes}</dd>
          </>
        )}
      </dl>

      {showIdSection && (
        <div id="vehicle-detail-id" className="scroll-mt-3">
        <TransitIdDocumentGallery
          passportNumber={vehicle.transit_passport_id}
          documents={transitIdDocuments}
          urls={transitIdUrls}
          showAuthenticityCheck={showIdAuthenticityCheck}
        />
        </div>
      )}

      {showOwner && owner && (
        <div id="vehicle-detail-owner" className="text-sm scroll-mt-3">
          <p className="font-medium text-stone-900 dark:text-stone-100 mb-1">Owner</p>
          <p className="text-stone-600 dark:text-slate-400">
            {owner.full_name || owner.email || "—"}
            {owner.phone ? ` · ${owner.phone}` : ""}
          </p>
        </div>
      )}

      <div
        id="vehicle-detail-fines"
        className="rounded-lg border border-stone-200 dark:border-slate-800 p-4 scroll-mt-3"
      >
        <div className="flex items-center gap-2 mb-3">
          <Wallet className="h-4 w-4 text-stone-500" />
          <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
            Fine totals
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <FineTotal label="Paid" value={paymentTotals.paid} />
          <FineTotal label="Pending" value={paymentTotals.pending} />
          <FineTotal label="Unpaid" value={paymentTotals.unpaid} emphasis />
        </div>
        <p className="text-xs text-stone-500 dark:text-slate-400 mt-2">
          {unpaid.length} unpaid infraction{unpaid.length !== 1 ? "s" : ""} of{" "}
          {infractions.length} total
        </p>
      </div>

      {infractions.length > 0 && (
        <div id="vehicle-detail-infractions" className="scroll-mt-3">
          <p className="text-sm font-semibold text-stone-900 dark:text-stone-100 mb-2 flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4" />
            Recent infractions
          </p>
          <ul className="space-y-2 text-sm max-h-40 overflow-y-auto">
            {infractions.slice(0, 5).map((i) => (
              <li
                key={i.id}
                className="flex justify-between gap-2 border-b border-stone-100 dark:border-slate-800 pb-2 last:border-0"
              >
                <span className="text-stone-700 dark:text-slate-300">
                  {i.infraction_type} · {formatDate(i.created_at)}
                </span>
                <StatusBadge status={i.status} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {trackingEvents.length > 0 && (
        <div id="vehicle-detail-tracking" className="scroll-mt-3">
          <p className="text-sm font-semibold text-stone-900 dark:text-stone-100 mb-2 flex items-center gap-1.5">
            <MapPin className="h-4 w-4" />
            Tracking
          </p>
          <VehicleTrackingTimeline events={trackingEvents.slice(0, 8)} />
        </div>
      )}
    </div>
  );
}

function FineTotal({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: number;
  emphasis?: boolean;
}) {
  return (
    <div className="rounded-md bg-stone-50 dark:bg-slate-900/60 p-2">
      <p className="text-[11px] text-stone-500 dark:text-slate-400">{label}</p>
      <p
        className={
          emphasis
            ? "font-bold text-red-700 dark:text-red-300"
            : "font-bold text-stone-900 dark:text-stone-100"
        }
      >
        {formatCurrency(value)}
      </p>
    </div>
  );
}
