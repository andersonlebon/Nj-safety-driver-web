import type { SupabaseClient } from "@supabase/supabase-js";
import { signDocumentPaths } from "@/lib/storage-urls";
import type { Database } from "@/lib/types/database";

type VehicleRow = Database["public"]["Tables"]["vehicles"]["Row"];

export type VehicleDirectoryFilters = {
  verificationStatus?: VehicleRow["verification_status"];
  origin?: "foreign" | "domestic";
};

export async function loadVehicleDirectoryPageData(
  supabase: SupabaseClient<Database>,
  filters?: VehicleDirectoryFilters
) {
  let query = supabase
    .from("vehicles")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters?.verificationStatus) {
    query = query.eq("verification_status", filters.verificationStatus);
  }

  if (filters?.origin === "foreign") {
    query = query.eq("is_foreign", true);
  } else if (filters?.origin === "domestic") {
    query = query.or("is_foreign.eq.false,is_foreign.is.null");
  }

  const { data: vehicles, error } = await query;

  const ownerIds = [
    ...new Set(
      (vehicles ?? [])
        .map((vehicle) => vehicle.owner_id)
        .filter((id): id is string => id != null)
    ),
  ];

  const [{ data: owners }, { data: photos }] = await Promise.all([
    ownerIds.length > 0
      ? supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", ownerIds)
      : Promise.resolve({
          data: [] as { id: string; full_name: string | null; email: string | null }[],
        }),
    (vehicles ?? []).length > 0
      ? supabase
          .from("documents")
          .select("vehicle_id, file_path")
          .in(
            "vehicle_id",
            (vehicles ?? []).map((vehicle) => vehicle.id)
          )
          .eq("doc_type", "vehicle_photo")
          .eq("label", "front")
      : Promise.resolve({
          data: [] as { vehicle_id: string | null; file_path: string }[],
        }),
  ]);

  const ownerMap = Object.fromEntries((owners ?? []).map((owner) => [owner.id, owner]));

  const photoByVehicle: Record<string, string> = {};
  for (const photo of photos ?? []) {
    if (photo.vehicle_id) photoByVehicle[photo.vehicle_id] = photo.file_path;
  }

  const signed = await signDocumentPaths(Object.values(photoByVehicle));
  const photoUrls: Record<string, string> = {};
  for (const [vehicleId, path] of Object.entries(photoByVehicle)) {
    photoUrls[vehicleId] = signed[path] ?? "";
  }

  return {
    vehicles: (vehicles ?? []) as VehicleRow[],
    ownerMap,
    photoUrls,
    error,
  };
}

export async function loadDriverVehicleLastLocations(
  supabase: SupabaseClient<Database>,
  vehicles: Array<{ id: string; plate_number: string }>
) {
  const plates = vehicles.map((vehicle) => vehicle.plate_number);
  if (plates.length === 0) return {} as Record<string, { location: string; at: string }>;

  const { data: trackingRows } = await supabase
    .from("vehicle_tracking_events")
    .select("vehicle_id, plate_number, location, created_at")
    .in("plate_number", plates)
    .not("location", "is", null)
    .order("created_at", { ascending: false })
    .limit(Math.min(plates.length * 5, 100));

  const lastLocations: Record<string, { location: string; at: string }> = {};
  for (const row of trackingRows ?? []) {
    const vehicleId =
      row.vehicle_id ?? vehicles.find((v) => v.plate_number === row.plate_number)?.id;
    if (!vehicleId || lastLocations[vehicleId] || !row.location) continue;
    lastLocations[vehicleId] = { location: row.location, at: row.created_at };
  }

  return lastLocations;
}
