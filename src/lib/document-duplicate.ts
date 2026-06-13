import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

type Client = SupabaseClient<Database>;

export async function hasDuplicateDocumentHash(
  supabase: Client,
  ownerId: string,
  fileHash: string,
  options?: { excludeDocumentId?: string; vehicleId?: string | null }
): Promise<boolean> {
  let query = supabase
    .from("documents")
    .select("id")
    .eq("owner_id", ownerId)
    .eq("file_hash", fileHash)
    .limit(1);

  if (options?.excludeDocumentId) {
    query = query.neq("id", options.excludeDocumentId);
  }

  if (options?.vehicleId) {
    query = query.eq("vehicle_id", options.vehicleId);
  } else if (options?.vehicleId === null) {
    query = query.is("vehicle_id", null);
  }

  const { data } = await query.maybeSingle();
  return Boolean(data);
}
