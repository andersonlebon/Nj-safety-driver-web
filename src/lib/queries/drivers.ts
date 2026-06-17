import type { SupabaseClient } from "@supabase/supabase-js";
import {
  paginatedResult,
  rangeForPage,
  type PaginatedResult,
  type TableQuery,
} from "@/lib/pagination";
import { applyTableQueryFilters } from "@/lib/queries/table-filters";
import type { Database } from "@/lib/types/database";

type Driver = Database["public"]["Tables"]["profiles"]["Row"];

type VehicleSummary = Pick<
  Database["public"]["Tables"]["vehicles"]["Row"],
  "id" | "owner_id" | "plate_number" | "registration_country" | "brand" | "model" | "verification_status"
>;

const DRIVER_DIRECTORY_FILTER =
  "agent_application_status.is.null,agent_application_status.neq.pending,agent_application_status.eq.rejected";

export type DriverDirectoryPageData = PaginatedResult<Driver> & {
  vehiclesByDriver: Record<string, VehicleSummary[]>;
};

export async function loadDriverDirectoryPaginated(
  supabase: SupabaseClient<Database>,
  tableQuery: TableQuery
): Promise<DriverDirectoryPageData> {
  const { from, to } = rangeForPage(tableQuery.page, tableQuery.pageSize);

  let query = supabase
    .from("profiles")
    .select("*", { count: "exact" })
    .eq("role", "driver")
    .or(DRIVER_DIRECTORY_FILTER)
    .order("created_at", { ascending: false });

  query = applyTableQueryFilters(query, tableQuery, {
    searchColumns: [
      { column: "full_name" },
      { column: "email" },
      { column: "phone" },
      { column: "driver_license" },
      { column: "national_id" },
    ],
    statusColumn: "verification_status",
    dateColumn: "created_at",
  });

  const { data, count, error } = await query.range(from, to);
  if (error) throw error;

  const drivers = (data ?? []) as Driver[];
  const driverIds = drivers.map((driver) => driver.id);

  const { data: vehicles } =
    driverIds.length > 0
      ? await supabase
          .from("vehicles")
          .select(
            "id, owner_id, plate_number, registration_country, brand, model, verification_status"
          )
          .in("owner_id", driverIds)
          .order("created_at", { ascending: false })
      : { data: [] as VehicleSummary[] };

  const vehiclesByDriver: Record<string, VehicleSummary[]> = {};
  for (const id of driverIds) {
    vehiclesByDriver[id] = [];
  }
  for (const vehicle of vehicles ?? []) {
    if (!vehicle.owner_id) continue;
    vehiclesByDriver[vehicle.owner_id]?.push(vehicle);
  }

  return {
    ...paginatedResult(drivers, count ?? 0, tableQuery),
    vehiclesByDriver,
  };
}

/** @deprecated Use loadDriverDirectoryPaginated. */
export async function loadDriverDirectoryPageData(
  supabase: SupabaseClient<Database>
) {
  return loadDriverDirectoryPaginated(supabase, {
    page: 1,
    pageSize: 500,
    q: "",
    status: "",
    dateFrom: "",
    dateTo: "",
  });
}
