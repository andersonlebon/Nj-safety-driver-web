import type { SupabaseClient } from "@supabase/supabase-js";
import { driverDirectoryQuery } from "@/lib/driver-profiles";
import type { Database } from "@/lib/types/database";

type VehicleSummary = Pick<
  Database["public"]["Tables"]["vehicles"]["Row"],
  "id" | "owner_id" | "plate_number" | "registration_country" | "brand" | "model" | "verification_status"
>;

export async function loadDriverDirectoryPageData(
  supabase: SupabaseClient<Database>
) {
  const { data: drivers } = await driverDirectoryQuery(supabase);
  const driverIds = (drivers ?? []).map((driver) => driver.id);

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

  return { drivers: drivers ?? [], vehiclesByDriver };
}
