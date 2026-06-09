"use client";

import { useState, useTransition } from "react";
import { Car, Eye } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { CountryBadge } from "@/components/vehicles/CountryBadge";
import { StaffDocumentsLoader } from "@/components/documents/StaffDocumentsLoader";
import { VehicleDetailContent } from "@/components/vehicles/VehicleDetailContent";
import { VehicleVerificationActions } from "./VehicleVerificationActions";
import { formatDate } from "@/lib/utils";
import { VERIFICATION_LABELS } from "@/lib/verification";
import { isForeignVehicle } from "@/lib/vehicles";
import type { TrackingEvent } from "@/lib/tracking";
import type { TransitIdDocRow, TransitIdDocUrls } from "@/lib/transit-id-documents";
import {
  assessTransitIdAuthenticity,
  TRANSIT_ID_DOC_TYPE,
  TRANSIT_ID_LABEL_BACK,
  TRANSIT_ID_LABEL_FRONT,
} from "@/lib/transit-id-documents";
import type { Database, VerificationStatus } from "@/lib/types/database";
import { vehicleDetailSectionLinks } from "@/lib/vehicle-detail-sections";

type Vehicle = Database["public"]["Tables"]["vehicles"]["Row"];
type Infraction = Database["public"]["Tables"]["infractions"]["Row"];

export function AdminVehiclesTable({
  vehicles,
  ownerMap,
  photoUrls,
}: {
  vehicles: Vehicle[];
  ownerMap: Record<
    string,
    { full_name: string | null; email: string | null }
  >;
  photoUrls: Record<string, string>;
}) {
  const [selected, setSelected] = useState<Vehicle | null>(null);
  const [infractions, setInfractions] = useState<Infraction[]>([]);
  const [trackingEvents, setTrackingEvents] = useState<TrackingEvent[]>([]);
  const [transitIdDocuments, setTransitIdDocuments] = useState<TransitIdDocRow[]>([]);
  const [transitIdUrls, setTransitIdUrls] = useState<TransitIdDocUrls>({
    front: null,
    back: null,
  });
  const [, startTransition] = useTransition();

  const open = (vehicle: Vehicle) => {
    setSelected(vehicle);
    setInfractions([]);
    setTrackingEvents([]);
    setTransitIdDocuments([]);
    setTransitIdUrls({ front: null, back: null });
    startTransition(async () => {
      const supabase = createClient();
      const country = vehicle.registration_country ?? "GA";
      const [{ data: inf }, { data: tracking }, { data: idDocs }] = await Promise.all([
        supabase
          .from("infractions")
          .select("*")
          .eq("plate_number", vehicle.plate_number)
          .eq("registration_country", country)
          .order("created_at", { ascending: false }),
        supabase
          .from("vehicle_tracking_events")
          .select("*")
          .eq("plate_number", vehicle.plate_number)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("documents")
          .select("label, file_path, file_name, verification_status")
          .eq("vehicle_id", vehicle.id)
          .eq("doc_type", TRANSIT_ID_DOC_TYPE),
      ]);
      setInfractions(inf ?? []);
      const docs = (idDocs ?? []) as TransitIdDocRow[];
      setTransitIdDocuments(docs);
      const paths = docs.map((d) => d.file_path).filter(Boolean);
      const signedEntries = await Promise.all(
        paths.map(async (path) => {
          const { data } = await supabase.storage
            .from("documents")
            .createSignedUrl(path, 3600);
          return [path, data?.signedUrl ?? ""] as const;
        })
      );
      const signed = Object.fromEntries(signedEntries);
      const frontPath = docs.find((d) => d.label === TRANSIT_ID_LABEL_FRONT)?.file_path;
      const backPath = docs.find((d) => d.label === TRANSIT_ID_LABEL_BACK)?.file_path;
      setTransitIdUrls({
        front: frontPath ? signed[frontPath] ?? null : null,
        back: backPath ? signed[backPath] ?? null : null,
      });
      setTrackingEvents(
        (tracking ?? []).map((e) => ({
          id: e.id,
          event_type: e.event_type,
          location: e.location,
          latitude: e.latitude != null ? Number(e.latitude) : null,
          longitude: e.longitude != null ? Number(e.longitude) : null,
          notes: e.notes,
          created_at: e.created_at,
        }))
      );
    });
  };

  const close = () => setSelected(null);

  const selectedOwner = selected?.owner_id
    ? ownerMap[selected.owner_id]
    : null;

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-stone-500 dark:text-slate-400 border-b border-stone-200 dark:border-slate-800">
            <tr>
              <th className="py-2 pr-4 font-medium">Photo</th>
              <th className="py-2 pr-4 font-medium">Plate</th>
              <th className="py-2 pr-4 font-medium">Country</th>
              <th className="py-2 pr-4 font-medium">Vehicle</th>
              <th className="py-2 pr-4 font-medium">Owner</th>
              <th className="py-2 pr-4 font-medium">Insurance</th>
              <th className="py-2 pr-4 font-medium">Inspection</th>
              <th className="py-2 pr-4 font-medium">Registered</th>
              <th className="py-2 pr-4 font-medium">Status</th>
              <th className="py-2 pr-4 font-medium w-28">Actions</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((v) => {
              const owner = v.owner_id ? ownerMap[v.owner_id] : null;
              const photoUrl = photoUrls[v.id];
              const status = (v.verification_status ??
                "pending_review") as VerificationStatus;
              const statusClass =
                status === "active"
                  ? "badge-paid"
                  : status === "rejected"
                    ? "badge-unpaid"
                    : "badge-pending";
              const foreign = isForeignVehicle(
                v.registration_country,
                v.is_foreign
              );

              return (
                <tr
                  key={v.id}
                  className="border-b border-stone-100 dark:border-slate-800 last:border-0 cursor-pointer hover:bg-stone-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  onClick={() => open(v)}
                >
                  <td className="py-2 pr-4">
                    {photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={photoUrl}
                        alt=""
                        className="h-12 w-16 rounded-lg object-cover border border-stone-200 dark:border-slate-700"
                      />
                    ) : (
                      <div className="h-12 w-16 rounded-lg bg-stone-100 dark:bg-slate-800 grid place-items-center text-stone-400">
                        <Car className="h-5 w-5" />
                      </div>
                    )}
                  </td>
                  <td className="py-2 pr-4 font-mono font-medium text-stone-900 dark:text-stone-100">
                    {v.plate_number}
                  </td>
                  <td className="py-2 pr-4">
                    <CountryBadge code={v.registration_country} />
                    {foreign && (
                      <span className="ml-1 badge-pending text-[10px]">
                        Transit
                      </span>
                    )}
                  </td>
                  <td className="py-2 pr-4 text-stone-700 dark:text-slate-300">
                    {[v.brand, v.model, v.color, v.year]
                      .filter(Boolean)
                      .join(" • ") || "—"}
                  </td>
                  <td className="py-2 pr-4 text-stone-700 dark:text-slate-300">
                    {owner?.full_name ||
                      owner?.email ||
                      v.transit_driver_name ||
                      "—"}
                  </td>
                  <td className="py-2 pr-4">
                    <span
                      className={
                        v.insurance_status ? "badge-paid" : "badge-unpaid"
                      }
                    >
                      {v.insurance_status ? "Valid" : "Missing"}
                    </span>
                  </td>
                  <td className="py-2 pr-4">
                    <span
                      className={
                        v.inspection_status ? "badge-paid" : "badge-unpaid"
                      }
                    >
                      {v.inspection_status ? "Valid" : "Missing"}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-stone-700 dark:text-slate-300">
                    {formatDate(v.created_at)}
                  </td>
                  <td className="py-2 pr-4">
                    <span className={statusClass}>
                      {VERIFICATION_LABELS[status]}
                    </span>
                  </td>
                  <td className="py-2 pr-4" onClick={(e) => e.stopPropagation()}>
                    <Button
                      type="button"
                      className="text-xs py-1.5 px-3 min-w-[6.5rem] shadow-sm"
                      onClick={() => open(v)}
                    >
                      <Eye className="h-3.5 w-3.5 mr-1" />
                      View details
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selected && (
        <Modal
          open
          onClose={close}
          title={`Vehicle ${selected.plate_number}`}
          description="Jump to any section below — verification actions stay pinned at the bottom."
          className="max-w-4xl"
          sectionNav={vehicleDetailSectionLinks({
            showId:
              selected.is_border_transit ||
              Boolean(selected.transit_passport_id) ||
              transitIdDocuments.length > 0,
            showOwner: Boolean(
              selectedOwner ||
                selected.transit_driver_name ||
                selected.transit_driver_phone
            ),
            hasInfractions: infractions.length > 0,
            hasTracking: trackingEvents.length > 0,
          }).concat(
            selected.owner_id || transitIdDocuments.length > 0
              ? [{ id: "vehicle-detail-documents", label: "Documents" }]
              : []
          )}
          footer={
            <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-3 sm:justify-between">
              <Button type="button" variant="secondary" onClick={close} className="w-full sm:w-auto">
                Close
              </Button>
              <div className="flex-1 min-w-0 w-full">
                <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-slate-400 mb-2">
                  Verification
                </p>
                <VehicleVerificationActions
                  vehicleId={selected.id}
                  status={
                    (selected.verification_status ??
                      "pending_review") as VerificationStatus
                  }
                />
              </div>
            </div>
          }
        >
          <div className="space-y-4">
            <VehicleDetailContent
              vehicle={selected}
              photoUrl={photoUrls[selected.id]}
              owner={
                selectedOwner
                  ? {
                      full_name: selectedOwner.full_name,
                      email: selectedOwner.email,
                      phone: null,
                    }
                  : selected.transit_driver_name
                    ? {
                        full_name: selected.transit_driver_name,
                        email: null,
                        phone: selected.transit_driver_phone,
                      }
                    : null
              }
              infractions={infractions}
              trackingEvents={trackingEvents}
              showOwner
              transitIdDocuments={transitIdDocuments}
              transitIdUrls={transitIdUrls}
              showIdAuthenticityCheck
            />
            <StaffDocumentsLoader
              ownerId={selected.owner_id}
              vehicleId={selected.id}
              title="Driver & vehicle documents"
              sectionId="vehicle-detail-documents"
            />
            {selected.is_border_transit &&
              !selected.owner_id &&
              transitIdDocuments.length === 0 && (
                <Alert variant="info">
                  No linked driver account — ask the visitor to register at{" "}
                  <strong>/register</strong> with nationality and vehicle country,
                  then re-search this plate.
                </Alert>
              )}
          </div>
        </Modal>
      )}
    </>
  );
}
