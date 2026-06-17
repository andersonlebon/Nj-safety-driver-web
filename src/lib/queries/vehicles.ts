import type { SupabaseClient } from "@supabase/supabase-js";
import { signDocumentPaths } from "@/lib/storage-urls";
import {
  paginatedResult,
  rangeForPage,
  type PaginatedResult,
  type TableQuery,
} from "@/lib/pagination";
import { applyTableQueryFilters } from "@/lib/queries/table-filters";
import type { Database } from "@/lib/types/database";

type VehicleRow = Database["public"]["Tables"]["vehicles"]["Row"];

export type VehicleDirectoryFilters = {
  verificationStatus?: VehicleRow["verification_status"];
  origin?: "foreign" | "domestic";
};

export type VehicleDirectoryPageData = PaginatedResult<VehicleRow> & {
  ownerMap: Record<string, { full_name: string | null; email: string | null }>;
  photoUrls: Record<string, string>;
  error: { message: string } | null;
};

export async function loadVehicleDirectoryPaginated(
  supabase: SupabaseClient<Database>,
  tableQuery: TableQuery,
  filters?: VehicleDirectoryFilters
): Promise<VehicleDirectoryPageData> {
  const { from, to } = rangeForPage(tableQuery.page, tableQuery.pageSize);

  let query = supabase
    .from("vehicles")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (filters?.verificationStatus) {
    query = query.eq("verification_status", filters.verificationStatus);
  }

  if (filters?.origin === "foreign") {
    query = query.eq("is_foreign", true);
  } else if (filters?.origin === "domestic") {
    query = query.or("is_foreign.eq.false,is_foreign.is.null");
  }

  query = applyTableQueryFilters(query, tableQuery, {
    searchColumns: [
      { column: "plate_number" },
      { column: "brand" },
      { column: "model" },
      { column: "color" },
      { column: "transit_driver_name" },
    ],
    statusColumn: tableQuery.status && !filters?.verificationStatus ? "verification_status" : undefined,
    dateColumn: "created_at",
  });

  const { data, count, error } = await query.range(from, to);

  const vehicles = (data ?? []) as VehicleRow[];

  const ownerIds = [
    ...new Set(
      vehicles
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
    vehicles.length > 0
      ? supabase
          .from("documents")
          .select("vehicle_id, file_path")
          .in(
            "vehicle_id",
            vehicles.map((vehicle) => vehicle.id)
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
    ...paginatedResult(vehicles, count ?? 0, tableQuery),
    ownerMap,
    photoUrls,
    error: error ? { message: error.message } : null,
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

/** @deprecated Use loadVehicleDirectoryPaginated. */
export async function loadVehicleDirectoryPageData(
  supabase: SupabaseClient<Database>,
  filters?: VehicleDirectoryFilters
) {
  const result = await loadVehicleDirectoryPaginated(
    supabase,
    { page: 1, pageSize: 500, q: "", status: "", dateFrom: "", dateTo: "" },
    filters
  );
  return {
    vehicles: result.rows,
    ownerMap: result.ownerMap,
    photoUrls: result.photoUrls,
    error: result.error,
  };
}
