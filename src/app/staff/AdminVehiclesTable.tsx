"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Car, Eye } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { PaginatedTableFrame } from "@/components/table";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { CountryBadge } from "@/components/vehicles/CountryBadge";
import { VehicleDetailModal } from "./VehicleDetailModal";
import { formatDate } from "@/lib/utils";
import { useI18n } from "@/i18n/context";
import { verificationStatusLabel } from "@/i18n/labels";
import type { TableQuery } from "@/lib/pagination";
import { isForeignVehicle } from "@/lib/vehicles";
import type { TrackingEvent } from "@/lib/tracking";
import type { TransitIdDocRow, TransitIdDocUrls } from "@/lib/transit-id-documents";
import {
  TRANSIT_ID_DOC_TYPE,
  TRANSIT_ID_LABEL_BACK,
  TRANSIT_ID_LABEL_FRONT,
} from "@/lib/transit-id-documents";
import type { VehicleOwnerProfile } from "@/lib/vehicle-owner-profile";
import type { Database, TransactionStatus, VerificationStatus } from "@/lib/types/database";

type Vehicle = Database["public"]["Tables"]["vehicles"]["Row"];
type Infraction = Database["public"]["Tables"]["infractions"]["Row"];

export function AdminVehiclesTable({
  pathname,
  query,
  totalCount,
  preserveParams,
  showStatusFilter = true,
  vehicles,
  ownerMap,
  photoUrls,
  canManageVehicles = true,
  staffName,
  initialOpenVehicleId,
}: {
  pathname: string;
  query: TableQuery;
  totalCount: number;
  preserveParams?: Record<string, string>;
  showStatusFilter?: boolean;
  vehicles: Vehicle[];
  ownerMap: Record<string, VehicleOwnerProfile>;
  photoUrls: Record<string, string>;
  canManageVehicles?: boolean;
  staffName: string;
  initialOpenVehicleId?: string;
}) {
  const { t } = useI18n();
  const emDash = t("staff.shared.emDash");
  const verificationFilterOptions = useMemo(
    () => [
      { value: "active", label: t("staff.vehicles.table.filterActive") },
      { value: "pending_review", label: t("staff.vehicles.table.filterPendingReview") },
      { value: "rejected", label: t("staff.vehicles.table.filterRejected") },
    ],
    [t]
  );
  const [selected, setSelected] = useState<Vehicle | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [infractions, setInfractions] = useState<Infraction[]>([]);
  const [transactionStatusByInfraction, setTransactionStatusByInfraction] =
    useState<Record<string, TransactionStatus>>({});
  const [trackingEvents, setTrackingEvents] = useState<TrackingEvent[]>([]);
  const [transitIdDocuments, setTransitIdDocuments] = useState<TransitIdDocRow[]>([]);
  const [transitIdUrls, setTransitIdUrls] = useState<TransitIdDocUrls>({
    front: null,
    back: null,
  });
  const [, startTransition] = useTransition();
  const openedFromUrl = useRef(false);

  const open = (vehicle: Vehicle) => {
    setSelected(vehicle);
    setDetailsLoading(true);
    setInfractions([]);
    setTransactionStatusByInfraction({});
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
      const infractionIds = (inf ?? []).map((row) => row.id);
      if (infractionIds.length > 0) {
        const { data: transactions } = await supabase
          .from("transactions")
          .select("infraction_id, status")
          .in("infraction_id", infractionIds);
        setTransactionStatusByInfraction(
          Object.fromEntries(
            (transactions ?? []).map((transaction) => [
              transaction.infraction_id,
              transaction.status,
            ])
          )
        );
      }
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
      setDetailsLoading(false);
    });
  };

  useEffect(() => {
    if (!initialOpenVehicleId || openedFromUrl.current) return;
    const match = vehicles.find((vehicle) => vehicle.id === initialOpenVehicleId);
    if (match) {
      openedFromUrl.current = true;
      open(match);
    }
  }, [initialOpenVehicleId, vehicles]);

  const close = () => setSelected(null);

  const selectedOwner = selected?.owner_id
    ? ownerMap[selected.owner_id]
    : null;

  return (
    <>
      <PaginatedTableFrame
        pathname={pathname}
        query={query}
        totalCount={totalCount}
        preserveParams={preserveParams}
        statusOptions={showStatusFilter ? verificationFilterOptions : undefined}
        statusLabel={t("staff.vehicles.table.statusLabel")}
        searchPlaceholder={t("staff.vehicles.table.searchPlaceholder")}
        emptyIcon={<Car className="h-8 w-8" />}
        emptyTitle={t("staff.vehicles.table.emptyTitle")}
        unfilteredHint={t("staff.vehicles.table.unfilteredHint", { count: totalCount })}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-stone-500 dark:text-slate-400 border-b border-stone-200 dark:border-slate-800">
              <tr>
                <th className="py-2 pr-4 font-medium">{t("staff.vehicles.table.photo")}</th>
                <th className="py-2 pr-4 font-medium">{t("staff.vehicles.table.plate")}</th>
                <th className="py-2 pr-4 font-medium">{t("staff.vehicles.table.country")}</th>
                <th className="py-2 pr-4 font-medium">{t("staff.vehicles.table.vehicle")}</th>
                <th className="py-2 pr-4 font-medium">{t("staff.vehicles.table.owner")}</th>
                <th className="py-2 pr-4 font-medium">{t("staff.vehicles.table.insurance")}</th>
                <th className="py-2 pr-4 font-medium">{t("staff.vehicles.table.inspection")}</th>
                <th className="py-2 pr-4 font-medium">{t("staff.vehicles.table.registered")}</th>
                <th className="py-2 pr-4 font-medium">{t("staff.vehicles.table.status")}</th>
                <th className="py-2 pr-4 font-medium w-28">{t("staff.vehicles.table.actions")}</th>
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
                        {t("staff.vehicles.table.transitBadge")}
                      </span>
                    )}
                  </td>
                  <td className="py-2 pr-4 text-stone-700 dark:text-slate-300">
                    {[v.brand, v.model, v.color, v.year]
                      .filter(Boolean)
                      .join(" • ") || emDash}
                  </td>
                  <td className="py-2 pr-4 text-stone-700 dark:text-slate-300">
                    {owner?.full_name ||
                      owner?.email ||
                      v.transit_driver_name ||
                      emDash}
                  </td>
                  <td className="py-2 pr-4">
                    <span
                      className={
                        v.insurance_status ? "badge-paid" : "badge-unpaid"
                      }
                    >
                      {v.insurance_status
                        ? t("staff.vehicles.table.insuranceValid")
                        : t("staff.vehicles.table.insuranceMissing")}
                    </span>
                  </td>
                  <td className="py-2 pr-4">
                    <span
                      className={
                        v.inspection_status ? "badge-paid" : "badge-unpaid"
                      }
                    >
                      {v.inspection_status
                        ? t("staff.vehicles.table.inspectionValid")
                        : t("staff.vehicles.table.inspectionMissing")}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-stone-700 dark:text-slate-300">
                    {formatDate(v.created_at)}
                  </td>
                  <td className="py-2 pr-4">
                    <span className={statusClass}>
                      {verificationStatusLabel(t, status)}
                    </span>
                  </td>
                  <td className="py-2 pr-4" onClick={(e) => e.stopPropagation()}>
                    <Button
                      type="button"
                      className="text-xs py-1.5 px-3 min-w-[6.5rem] shadow-sm"
                      onClick={() => open(v)}
                    >
                      <Eye className="h-3.5 w-3.5 mr-1" />
                      {t("staff.vehicles.table.viewDetails")}
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      </PaginatedTableFrame>

      {selected && (
        <VehicleDetailModal
          vehicle={selected}
          open={Boolean(selected)}
          onClose={close}
          photoUrl={photoUrls[selected.id]}
          owner={selectedOwner}
          infractions={infractions}
          transactionStatusByInfraction={transactionStatusByInfraction}
          trackingEvents={trackingEvents}
          transitIdDocuments={transitIdDocuments}
          transitIdUrls={transitIdUrls}
          detailsLoading={detailsLoading}
          canManageVehicles={canManageVehicles}
          staffName={staffName}
          borderTransitHint={
            selected.is_border_transit &&
            !selected.owner_id &&
            transitIdDocuments.length === 0 ? (
              <Alert variant="info">
                {t("staff.vehicles.table.borderTransitHint")}
              </Alert>
            ) : undefined
          }
        />
      )}
    </>
  );
}
