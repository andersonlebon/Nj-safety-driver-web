import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getActiveProfileIdFromCookie,
  listProfilesForUser,
  resolveActiveProfile,
  setActiveProfileCookie,
} from "@/lib/auth/profiles";
import { loginPathForRole } from "@/lib/auth/profile-session";
import type { Database, UserRole } from "@/lib/types/database";

/**
 * Roles that are NEVER granted via user-controlled metadata. Privileged roles
 * are only assignable through /setup or admin promotion flows.
 */

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export const getSessionUser = cache(async () => {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/**
 * Returns the active typed profile for the signed-in auth user.
 * Uses the active-profile cookie when set; otherwise auto-selects when only
 * one profile exists.
 */
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const user = await getSessionUser();
  if (!user) return null;

  const active = await resolveActiveProfile(user.id);
  if (active) return active;

  const supabase = createClient();
  const profiles = await listProfilesForUser(user.id);

  if (profiles.length > 1) {
    return null;
  }

  const { data: existing } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle<Profile>();

  if (existing) {
    await setActiveProfileCookie(existing.id);
    return existing;
  }

  const meta = (user.user_metadata ?? {}) as { full_name?: string };

  const { data: created } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      user_id: user.id,
      email: user.email ?? null,
      full_name: meta.full_name ?? null,
      role: "driver",
    })
    .select("*")
    .single<Profile>();

  if (created) {
    await setActiveProfileCookie(created.id);
  }

  return created ?? null;
});

export async function requireActiveProfileSelection(): Promise<Profile> {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const profiles = await listProfilesForUser(user.id);
  if (profiles.length <= 1) {
    const profile = await getCurrentProfile();
    if (profile) return profile;
    redirect("/login");
  }

  const cookieId = await getActiveProfileIdFromCookie();
  if (!cookieId) {
    redirect("/auth/select-profile");
  }

  const profile = await getCurrentProfile();
  if (!profile) redirect("/auth/select-profile");
  return profile;
}

export async function requireRole(allowed: UserRole[]): Promise<Profile> {
  const profile = await requireActiveProfileSelection();
  if (!allowed.includes(profile.role)) {
    redirect(loginPathForRole(profile.role));
  }
  return profile;
}

export async function requireRoleForAction(
  allowed: UserRole[]
): Promise<Profile | { ok: false; error: string }> {
  try {
    const user = await getSessionUser();
    if (!user) {
      return { ok: false, error: "Your session expired. Please sign in again." };
    }

    const profile = await getCurrentProfile();
    if (!profile) {
      return {
        ok: false,
        error: "Choose which profile to continue with before performing this action.",
      };
    }

    if (!allowed.includes(profile.role)) {
      return { ok: false, error: "You do not have permission to perform this action." };
    }
    return profile;
  } catch {
    return {
      ok: false,
      error: "Network problem. Please check your connection and try again.",
    };
  }
}

export { listProfilesForUser, createTypedProfile } from "@/lib/auth/profiles";
export type { LoginPortal, ProfileSummary } from "@/lib/auth/profile-session";
export {
  loginPathForRole,
  portalLabel,
  portalLoginPath,
  resolvePostLogin,
} from "@/lib/auth/profile-session";
