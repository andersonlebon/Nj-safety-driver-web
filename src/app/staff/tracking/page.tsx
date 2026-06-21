import { MapPin, Radar } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate, normalizePlate } from "@/lib/utils";
import { lastKnownLocation, type TrackingEvent } from "@/lib/tracking";
import {
  LastKnownLocationBadge,
  VehicleTrackingTimeline,
} from "@/components/tracking/VehicleTrackingTimeline";
import { getTranslations } from "@/i18n/server";

export const dynamic = "force-dynamic";

export default async function AdminTrackingPage({
  searchParams,
}: {
  searchParams?: { plate?: string };
}) {
  const { t } = await getTranslations();
  const emDash = t("staff.shared.emDash");
  const supabase = createClient();
  const filterPlate = searchParams?.plate
    ? normalizePlate(searchParams.plate)
    : null;

  let vehicleQuery = supabase
    .from("vehicles")
    .select("*")
    .order("created_at", { ascending: false });

  if (filterPlate) {
    vehicleQuery = vehicleQuery.eq("plate_number", filterPlate);
  }

  const { data: vehicles } = await vehicleQuery.limit(50);

  const plates = (vehicles ?? []).map((v) => v.plate_number);
  const { data: allEvents } =
    plates.length > 0
      ? await supabase
          .from("vehicle_tracking_events")
          .select(
            "id, plate_number, vehicle_id, event_type, location, latitude, longitude, notes, created_at"
          )
          .in("plate_number", plates)
          .order("created_at", { ascending: false })
          .limit(300)
      : { data: [] };

  const eventsByPlate: Record<string, TrackingEvent[]> = {};
  for (const e of allEvents ?? []) {
    const list = eventsByPlate[e.plate_number] ?? [];
    list.push({
      id: e.id,
      event_type: e.event_type,
      location: e.location,
      latitude: e.latitude != null ? Number(e.latitude) : null,
      longitude: e.longitude != null ? Number(e.longitude) : null,
      notes: e.notes,
      created_at: e.created_at,
      plate_number: e.plate_number,
    });
    eventsByPlate[e.plate_number] = list;
  }

  const ownerIds = [...new Set((vehicles ?? []).map((v) => v.owner_id))];
  const { data: owners } =
    ownerIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", ownerIds)
      : { data: [] };
  const ownerMap = Object.fromEntries(
    (owners ?? []).map((o) => [o.id, o.full_name])
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("staff.tracking.page.title")}
        description={t("staff.tracking.page.description")}
      />

      <Card>
        <CardBody>
          <form className="flex flex-col sm:flex-row gap-2" action="/staff/tracking">
            <input
              name="plate"
              defaultValue={searchParams?.plate ?? ""}
              placeholder={t("staff.tracking.page.filterPlaceholder")}
              className="input flex-1"
            />
            <button type="submit" className="btn-primary">
              {t("staff.tracking.page.search")}
            </button>
            {filterPlate && (
              <Link href="/staff/tracking" className="btn-secondary text-center">
                {t("staff.tracking.page.clear")}
              </Link>
            )}
          </form>
        </CardBody>
      </Card>

      {!vehicles || vehicles.length === 0 ? (
        <EmptyState
          icon={<Radar className="h-8 w-8" />}
          title={t("staff.tracking.page.emptyTitle")}
          description={t("staff.tracking.page.emptyDescription")}
        />
      ) : (
        <div className="space-y-4">
          {vehicles.map((v) => {
            const events = eventsByPlate[v.plate_number] ?? [];
            const last = lastKnownLocation(events);
            return (
              <Card key={v.id}>
                <CardBody className="space-y-4">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div>
                      <p className="font-mono font-semibold text-lg text-stone-900 dark:text-stone-100">
                        {v.plate_number}
                      </p>
                      <p className="text-sm text-stone-600 dark:text-slate-400">
                        {[v.brand, v.model, v.color].filter(Boolean).join(" · ") ||
                          emDash}
                        {" · "}
                        {t("staff.tracking.page.ownerPrefix", {
                          name: ownerMap[v.owner_id] ?? emDash,
                        })}
                      </p>
                      <p className="text-xs text-stone-500 dark:text-slate-500 mt-1">
                        {t("staff.tracking.page.registeredMeta", {
                          date: formatDate(v.created_at),
                          count: events.length,
                        })}
                      </p>
                    </div>
                    {last && (
                      <div className="w-full lg:max-w-xs">
                        <LastKnownLocationBadge
                          location={last.location}
                          at={last.at}
                        />
                      </div>
                    )}
                  </div>
                  <details className="group">
                    <summary className="cursor-pointer text-sm font-medium text-brand-700 dark:text-brand-300 flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {t("staff.tracking.page.viewTimeline")}
                    </summary>
                    <div className="mt-3">
                      <VehicleTrackingTimeline events={events.slice(0, 15)} />
                    </div>
                  </details>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
