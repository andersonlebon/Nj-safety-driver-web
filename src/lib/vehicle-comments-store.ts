import type { SupabaseClient } from "@supabase/supabase-js";
import { friendlyError } from "@/lib/errors";
import {
  parseDriverProfileComments,
  type DriverProfileComment,
} from "@/lib/driver-profile-comments";
import type { Database } from "@/lib/types/database";

type Client = SupabaseClient<Database>;

export type VehicleComment = DriverProfileComment;

export async function fetchVehicleComments(
  supabase: Client,
  vehicleId: string
): Promise<VehicleComment[]> {
  const client = supabase as SupabaseClient<any>;
  const { data, error } = await client
    .from("vehicles")
    .select("vehicle_comments")
    .eq("id", vehicleId)
    .maybeSingle();

  if (error) {
    console.error("fetchVehicleComments:", error.message);
    return [];
  }

  return parseDriverProfileComments(data?.vehicle_comments);
}

export async function appendVehicleComment(
  supabase: Client,
  vehicleId: string,
  comment: VehicleComment
): Promise<
  { ok: true; comments: VehicleComment[] } | { ok: false; error: string }
> {
  const client = supabase as SupabaseClient<any>;

  const { data: existing, error: readError } = await client
    .from("vehicles")
    .select("vehicle_comments")
    .eq("id", vehicleId)
    .maybeSingle();

  if (readError) {
    return { ok: false, error: friendlyError(readError) };
  }
  if (!existing) {
    return { ok: false, error: "Vehicle not found." };
  }

  const comments = parseDriverProfileComments(existing.vehicle_comments);
  const next = [...comments, comment];

  const { error } = await client
    .from("vehicles")
    .update({ vehicle_comments: next })
    .eq("id", vehicleId);

  if (error) return { ok: false, error: friendlyError(error) };

  return { ok: true, comments: next };
}
