import type { SupabaseClient } from "@supabase/supabase-js";
import { friendlyError } from "@/lib/errors";
import {
  parseDriverProfileComments,
  type DriverProfileComment,
} from "@/lib/driver-profile-comments";
import type { Database } from "@/lib/types/database";

type Client = SupabaseClient<Database>;

export async function fetchDriverProfileComments(
  supabase: Client,
  driverProfileId: string
): Promise<DriverProfileComment[]> {
  const { data, error } = await (supabase as SupabaseClient<any>)
    .from("driver_profiles")
    .select("profile_comments")
    .eq("profile_id", driverProfileId)
    .maybeSingle();

  if (error) {
    console.error("fetchDriverProfileComments:", error.message);
    return [];
  }

  return parseDriverProfileComments(data?.profile_comments);
}

export async function appendDriverProfileComment(
  supabase: Client,
  driverProfileId: string,
  comment: DriverProfileComment
): Promise<
  { ok: true; comments: DriverProfileComment[] } | { ok: false; error: string }
> {
  const client = supabase as SupabaseClient<any>;

  const { data: existing, error: readError } = await client
    .from("driver_profiles")
    .select("profile_comments")
    .eq("profile_id", driverProfileId)
    .maybeSingle();

  if (readError) {
    return { ok: false, error: friendlyError(readError) };
  }

  const comments = parseDriverProfileComments(existing?.profile_comments);
  const next = [...comments, comment];

  if (existing) {
    const { error } = await client
      .from("driver_profiles")
      .update({ profile_comments: next })
      .eq("profile_id", driverProfileId);
    if (error) return { ok: false, error: friendlyError(error) };
  } else {
    const { error } = await client.from("driver_profiles").insert({
      profile_id: driverProfileId,
      profile_comments: next,
    });
    if (error) return { ok: false, error: friendlyError(error) };
  }

  return { ok: true, comments: next };
}
