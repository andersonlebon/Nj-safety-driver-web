import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database, UserRole } from "@/lib/types/database";

/**
 * Roles that are NEVER granted via user-controlled metadata. The lazy
 * profile-create path used to read `role` from `user_metadata`, which let
 * a malicious signup self-promote by passing `data: { role: "admin" }`.
 * Privileged roles are now only assignable through:
 *   - `/setup` (the one-time first-admin bootstrap), or
 *   - the admin role-promotion UI (which goes through `updateUserRole`).
 */

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

/**
 * Cached: only one network round-trip per request, even if the layout, the
 * page, and a child component all call it.
 */
export const getSessionUser = cache(async () => {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/**
 * Returns the current user's profile.
 * If the auth user exists but the profiles row is missing (e.g. signup happened
 * before the auth trigger was installed, or RLS blocked the trigger), this
 * will lazily create the row from the user's metadata.
 *
 * Cached per request so layouts and pages share the same result.
 */
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: existing } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle<Profile>();

  if (existing) return existing;

  const meta = (user.user_metadata ?? {}) as {
    full_name?: string;
  };

  const { data: created } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      email: user.email ?? null,
      full_name: meta.full_name ?? null,
      // Hardened: ignore any `role` value sitting in user_metadata. New rows
      // always default to 'driver'; staff roles are only granted by /setup
      // (first admin) or by an existing admin via the role-promotion UI.
      role: "driver",
    })
    .select("*")
    .single<Profile>();

  return created ?? null;
});

export async function requireRole(allowed: UserRole[]): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/login");
  }
  if (!allowed.includes(profile.role)) {
    redirect(`/${profile.role}`);
  }
  return profile;
}
