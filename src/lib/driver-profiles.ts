import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

type Client = SupabaseClient<Database>;

/**
 * Driver directory rows: real drivers only — excludes approved agents (role != driver)
 * and pending agent applicants still on role driver.
 */
export function driverDirectoryQuery(supabase: Client) {
  return supabase
    .from("profiles")
    .select("*")
    .eq("role", "driver")
    .or(
      "agent_application_status.is.null,agent_application_status.neq.pending,agent_application_status.eq.rejected"
    )
    .order("created_at", { ascending: false });
}
