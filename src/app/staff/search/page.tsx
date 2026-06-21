import { Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { normalizePlateForCountry } from "@/lib/vehicles";
import { DEFAULT_COUNTRY } from "@/lib/countries";
import { lastKnownLocation, type TrackingEvent } from "@/lib/tracking";
import { signDocumentPaths } from "@/lib/storage-urls";
import { LogVehicleCheckIn } from "@/components/tracking/LogVehicleCheckIn";
import { SearchPlateDialog } from "./SearchPlateDialog";
import { CreateInfractionDialog } from "./CreateInfractionDialog";
import { PlateSearchResults } from "./PlateSearchResults";
import { requireStaffProfile } from "@/lib/auth";
import { getTranslations } from "@/i18n/server";

export default async function StaffSearchPage({
  searchParams,
}: {
  searchParams: { plate?: string; country?: string };
}) {
  const rawPlate = searchParams.plate?.trim();
  const country = searchParams.country?.trim() || DEFAULT_COUNTRY;
  const plate = rawPlate ? normalizePlateForCountry(rawPlate, country) : null;

  await requireStaffProfile();
  const { t } = await getTranslations();
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
  let vehiclePhotoUrl: string | null = null;

  if (vehicle?.id) {
    const [ownerResult, photoResult] = await Promise.all([
      vehicle.owner_id
        ? supabase
            .from("profiles")
            .select("id, full_name, phone, email, national_id, driver_license, address")
            .eq("id", vehicle.owner_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      supabase
        .from("documents")
        .select("file_path")
        .eq("vehicle_id", vehicle.id)
        .eq("doc_type", "vehicle_photo")
        .eq("label", "front")
        .maybeSingle(),
    ]);
    owner = ownerResult.data;
    if (photoResult.data?.file_path) {
      const signed = await signDocumentPaths([photoResult.data.file_path]);
      vehiclePhotoUrl = signed[photoResult.data.file_path] ?? null;
    }
  }

  const infractions = infractionsResult.data ?? [];

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
        title={t("staff.search.page.title")}
        description={t("staff.search.page.description")}
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

      {!plate && (
        <EmptyState
          icon={<Search className="h-8 w-8" />}
          title={t("staff.search.empty.title")}
          description={t("staff.search.empty.description")}
        />
      )}

      {plate && (
        <PlateSearchResults
          plate={plate}
          country={country}
          vehicle={vehicle}
          owner={owner}
          infractions={infractions}
          trackingEvents={trackingEvents}
          lastLocation={lastLocation}
          vehiclePhotoUrl={vehiclePhotoUrl}
          checkInAction={
            <LogVehicleCheckIn
              plate={plate}
              country={country}
              vehicleId={vehicle?.id ?? null}
            />
          }
        />
      )}
    </div>
  );
}
