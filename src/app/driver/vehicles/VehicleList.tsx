"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Car, ExternalLink, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { friendlyError } from "@/lib/errors";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { CountryBadge } from "@/components/vehicles/CountryBadge";
import { VehicleDetailModal } from "@/components/vehicles/VehicleDetailModal";
import { useI18n } from "@/i18n/context";
import { verificationStatusLabel } from "@/i18n/labels";
import type { TrackingEvent } from "@/lib/tracking";
import type { Database } from "@/lib/types/database";

type Vehicle = Database["public"]["Tables"]["vehicles"]["Row"];
type Infraction = Database["public"]["Tables"]["infractions"]["Row"];

export function VehicleList({
  vehicles,
  photoUrls,
  lastLocations,
}: {
  vehicles: Vehicle[];
  photoUrls: Record<string, string>;
  lastLocations?: Record<string, { location: string; at: string }>;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Vehicle | null>(null);
  const [infractions, setInfractions] = useState<Infraction[]>([]);
  const [trackingEvents, setTrackingEvents] = useState<TrackingEvent[]>([]);
  const [, startTransition] = useTransition();

  const openDetail = (v: Vehicle) => {
    setSelected(v);
    setInfractions([]);
    setTrackingEvents([]);
    startTransition(async () => {
      const supabase = createClient();
      const country = v.registration_country ?? "GA";
      const [{ data: inf }, { data: tracking }] = await Promise.all([
        supabase
          .from("infractions")
          .select("*")
          .eq("plate_number", v.plate_number)
          .eq("registration_country", country)
          .order("created_at", { ascending: false }),
        supabase
          .from("vehicle_tracking_events")
          .select("*")
          .eq("plate_number", v.plate_number)
          .order("created_at", { ascending: false })
          .limit(20),
      ]);
      setInfractions(inf ?? []);
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

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(t("driver.vehicles.card.confirmDelete"))) return;
    setDeletingId(id);
    setError(null);
    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("vehicles")
      .delete()
      .eq("id", id);
    if (deleteError) setError(friendlyError(deleteError));
    setDeletingId(null);
    router.refresh();
  };

  return (
    <div className="space-y-3">
      {error && <Alert variant="error">{error}</Alert>}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {vehicles.map((v) => {
          const photo = photoUrls[v.id];
          const status = v.verification_status ?? "pending_review";
          const statusClass =
            status === "active"
              ? "badge-paid"
              : status === "rejected"
                ? "badge-unpaid"
                : "badge-pending";
          return (
            <article
              key={v.id}
              role="button"
              tabIndex={0}
              onClick={() => openDetail(v)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openDetail(v);
                }
              }}
              className="rounded-xl border border-stone-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 cursor-pointer hover:ring-2 hover:ring-brand-500/30 transition-shadow"
            >
              <div className="aspect-[16/10] bg-stone-100 dark:bg-slate-800 relative">
                {photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photo}
                    alt={v.plate_number}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full grid place-items-center text-stone-400">
                    <Car className="h-10 w-10" />
                  </div>
                )}
                <span className={`absolute top-2 right-2 ${statusClass}`}>
                  {verificationStatusLabel(t, status)}
                </span>
              </div>
              <div className="p-4 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-mono font-semibold text-stone-900 dark:text-stone-100">
                    {v.plate_number}
                  </p>
                  <CountryBadge code={v.registration_country} />
                </div>
                <p className="text-sm text-stone-600 dark:text-slate-400">
                  {[v.brand, v.model, v.color, v.year]
                    .filter(Boolean)
                    .join(" • ") || t("driver.infractions.emptyValue")}
                </p>
                {lastLocations?.[v.id] && (
                  <p className="text-xs text-stone-500 dark:text-slate-400 flex items-start gap-1">
                    <span className="shrink-0">{t("driver.vehicles.card.lastSeen")}</span>
                    <span>{lastLocations[v.id].location}</span>
                  </p>
                )}
                <div className="flex gap-2 text-xs">
                  <span
                    className={
                      v.insurance_status ? "badge-paid" : "badge-unpaid"
                    }
                  >
                    {t("driver.vehicles.card.insurance")}
                  </span>
                  <span
                    className={
                      v.inspection_status ? "badge-paid" : "badge-unpaid"
                    }
                  >
                    {t("driver.vehicles.card.inspection")}
                  </span>
                </div>
                <div className="pt-2 flex justify-between items-center">
                  <Link
                    href={`/driver/vehicles/${v.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs text-brand-700 dark:text-brand-300 hover:underline inline-flex items-center gap-1"
                  >
                    {t("driver.vehicles.card.fullPage")}
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                  <Button
                    variant="danger"
                    type="button"
                    onClick={(e) => handleDelete(v.id, e)}
                    loading={deletingId === v.id}
                    aria-label={t("driver.vehicles.card.deleteAria")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {selected && (
        <VehicleDetailModal
          open
          onClose={() => setSelected(null)}
          vehicle={selected}
          photoUrl={photoUrls[selected.id]}
          infractions={infractions}
          trackingEvents={trackingEvents}
          showOwner={false}
        />
      )}
    </div>
  );
}
