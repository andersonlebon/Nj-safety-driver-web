import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getActiveRoleFromCookie,
  getProfileForUser,
  setActiveRoleCookie,
  clearActiveRoleCookie,
} from "@/lib/auth/profiles";
import { availableRoles } from "@/lib/auth/profile-session";
import type { Database, UserRole } from "@/lib/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export const getSessionUser = cache(async () => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user ?? null;
});

/**
 * Returns the single profile for the current session user.
 * Creates one if it doesn't exist yet (new sign-ups).
 */
export const getProfile = cache(async (): Promise<Profile | null> => {
  const user = await getSessionUser();
  if (!user) return null;

  const existing = await getProfileForUser(user.id);
  if (existing) return existing;

  // Auto-create a blank profile for brand-new sign-ups
  const supabase = createClient();
  const meta = (user.user_metadata ?? {}) as { full_name?: string };
  const { data: created } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      user_id: user.id,
      email: user.email ?? null,
      full_name: meta.full_name ?? null,
      profile_types: [],
    })
    .select("*")
    .single<Profile>();

  return created ?? null;
});

export async function getActiveRole(): Promise<UserRole | null> {
  return getActiveRoleFromCookie();
}

/**
 * Ensures session + profile exist. Redirects to /login if not.
 */
export async function requireAuth(): Promise<{ user: Awaited<ReturnType<typeof getSessionUser>>; profile: Profile }> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const profile = await getProfile();
  if (!profile) redirect("/login");
  return { user: user!, profile };
}

/**
 * Requires that the current user has one of the given roles in their profile_types
 * AND that their active_role cookie matches an allowed role.
 * Redirects to /profile if not.
 */
export async function requireRole(allowed: UserRole[]): Promise<{ profile: Profile; role: UserRole }> {
  const { profile } = await requireAuth();
  const activeRole = await getActiveRoleFromCookie();
  const roles = availableRoles({
    id: profile.id,
    profile_types: (profile.profile_types as UserRole[]) ?? [],
    full_name: profile.full_name,
    email: profile.email,
    onboarded_at: profile.onboarded_at,
    agent_application_status: profile.agent_application_status,
  });

  // Accept active cookie role if valid, else try any allowed role they have
  const role = activeRole && roles.includes(activeRole) && allowed.includes(activeRole)
    ? activeRole
    : roles.find((r) => allowed.includes(r));

  if (!role) redirect("/profile");

  // Sync the cookie if it's stale
  if (role !== activeRole) {
    await setActiveRoleCookie(role);
  }

  return { profile, role };
}

/**
 * Same as requireRole but returns an error object instead of redirecting.
 * Use in server actions.
 */
export async function requireRoleForAction(
  allowed: UserRole[]
): Promise<{ profile: Profile; role: UserRole } | { ok: false; error: string }> {
  try {
    const user = await getSessionUser();
    if (!user) return { ok: false, error: "Your session expired. Please sign in again." };

    const profile = await getProfile();
    if (!profile) return { ok: false, error: "Profile not found. Please sign in again." };

    const types = (profile.profile_types as UserRole[]) ?? [];
    const role = types.find((r) => allowed.includes(r));
    if (!role) return { ok: false, error: "You do not have permission to perform this action." };

    return { profile, role };
  } catch {
    return { ok: false, error: "Network problem. Please check your connection and try again." };
  }
}

export { registerRole, promoteToAdmin, clearActiveRoleCookie, setActiveRoleCookie } from "@/lib/auth/profiles";
export type { ProfileSummary } from "@/lib/auth/profile-session";
export { availableRoles, destinationForRole } from "@/lib/auth/profile-session";
