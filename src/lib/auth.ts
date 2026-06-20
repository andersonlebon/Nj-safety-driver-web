import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getActiveProfileId,
  getProfilesForUser,
  getProfileWithDriver,
  getProfileWithStaff,
  getDriverWorkspacesForUser,
  setActiveProfileCookie,
} from "@/lib/auth/profiles";
import type { ProfileRole, StaffRole } from "@/lib/types/database";
import type {
  Profile,
  ProfileWithDriver,
  ProfileWithStaff,
  StaffProfile,
} from "@/types";

// ── Session ───────────────────────────────────────────────────────────────────

export const getSessionUser = cache(async () => {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ?? null;
});

// ── Profile list ──────────────────────────────────────────────────────────────

/** All profile rows for the current session user. */
export const getProfiles = cache(async (): Promise<Profile[]> => {
  const user = await getSessionUser();
  if (!user) return [];
  return getProfilesForUser(user.id);
});

// ── Active profile ────────────────────────────────────────────────────────────

/**
 * Returns the enriched active profile (driver or staff) based on the cookie.
 * Falls back to the first available profile if only one exists.
 */
export const getActiveDriverProfile = cache(
  async (): Promise<ProfileWithDriver | null> => {
    const user = await getSessionUser();
    if (!user) return null;
    const activeId = await getActiveProfileId();
    if (activeId) {
      const p = await getProfileWithDriver(activeId);
      if (p?.user_id === user.id) return p;
    }
    // Auto-select if only one driver workspace
    const workspaces = await getDriverWorkspacesForUser(user.id);
    if (workspaces.length === 1) {
      const p = workspaces[0];
      await setActiveProfileCookie(p.id);
      return p;
    }
    return null;
  }
);

export const getActiveStaffProfile = cache(
  async (): Promise<ProfileWithStaff | null> => {
    const user = await getSessionUser();
    if (!user) return null;
    const activeId = await getActiveProfileId();
    if (activeId) {
      const p = await getProfileWithStaff(activeId);
      if (p?.user_id === user.id) return p;
    }
    // Auto-select if only one staff profile
    const all = await getProfilesForUser(user.id);
    const staffProfiles = all.filter((p) => p.role === "staff");
    if (staffProfiles.length === 1) {
      const p = await getProfileWithStaff(staffProfiles[0].id);
      if (p) {
        await setActiveProfileCookie(p.id);
        return p;
      }
    }
    return null;
  }
);

// ── Guards ────────────────────────────────────────────────────────────────────

/** Ensures authenticated session. Redirects to /login if not. */
export async function requireAuth(): Promise<{
  user: NonNullable<Awaited<ReturnType<typeof getSessionUser>>>;
}> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return { user };
}

/**
 * Requires an active driver profile.
 * Redirects to /profile to pick one if missing.
 */
export async function requireDriverProfile(): Promise<{
  profile: ProfileWithDriver;
}> {
  await requireAuth();
  const profile = await getActiveDriverProfile();
  if (!profile) redirect("/profile");
  return { profile };
}

/**
 * Requires an active staff profile.
 * Redirects to /profile to pick one if missing.
 */
export async function requireStaffProfile(): Promise<{
  profile: ProfileWithStaff;
  staffProfile: StaffProfile;
}> {
  await requireAuth();
  const profile = await getActiveStaffProfile();
  if (!profile) redirect("/profile");
  if (!profile.staffProfile) redirect("/profile");
  return { profile, staffProfile: profile.staffProfile };
}

/**
 * Requires an active staff profile with admin sub-role.
 * Redirects to /staff if the staff member is only an agent.
 */
export async function requireAdminProfile(): Promise<{
  profile: ProfileWithStaff;
  staffProfile: StaffProfile;
}> {
  const { profile, staffProfile } = await requireStaffProfile();
  if (staffProfile.staff_role !== "admin") redirect("/staff");
  return { profile, staffProfile };
}

// ── Action guards (return errors instead of redirecting) ──────────────────────

export async function requireDriverProfileForAction(): Promise<
  { profile: ProfileWithDriver } | { ok: false; error: string }
> {
  try {
    const user = await getSessionUser();
    if (!user) return { ok: false, error: "Session expired. Please sign in again." };
    const profile = await getActiveDriverProfile();
    if (!profile) return { ok: false, error: "No driver profile found." };
    return { profile };
  } catch {
    return { ok: false, error: "Network error. Please try again." };
  }
}

export async function requireStaffProfileForAction(): Promise<
  { profile: ProfileWithStaff; staffProfile: StaffProfile } | { ok: false; error: string }
> {
  try {
    const user = await getSessionUser();
    if (!user) return { ok: false, error: "Session expired. Please sign in again." };
    const profile = await getActiveStaffProfile();
    if (!profile) return { ok: false, error: "No staff profile found." };
    if (!profile.staffProfile)
      return { ok: false, error: "Staff profile incomplete." };
    return { profile, staffProfile: profile.staffProfile };
  } catch {
    return { ok: false, error: "Network error. Please try again." };
  }
}

export async function requireAdminProfileForAction(): Promise<
  { profile: ProfileWithStaff; staffProfile: StaffProfile } | { ok: false; error: string }
> {
  const result = await requireStaffProfileForAction();
  if ("ok" in result) return result;
  if (result.staffProfile.staff_role !== "admin")
    return { ok: false, error: "This action requires administrator access." };
  return result;
}

// ── Backwards-compat shims ────────────────────────────────────────────────────
// These let old callers compile while we migrate pages one-by-one.

/**
 * @deprecated Use requireDriverProfile() or requireStaffProfile() instead.
 * Kept temporarily so pages that haven't been migrated yet don't break.
 */
export async function requireRole(
  allowed: ProfileRole[]
): Promise<{ profile: ProfileWithDriver | ProfileWithStaff; role: ProfileRole }> {
  if (allowed.includes("driver")) {
    const { profile } = await requireDriverProfile();
    return { profile, role: "driver" };
  }
  const { profile } = await requireStaffProfile();
  return { profile, role: "staff" };
}

/**
 * @deprecated Use requireDriverProfileForAction() or requireStaffProfileForAction().
 */
export async function requireRoleForAction(
  allowed: ProfileRole[]
): Promise<
  | { profile: ProfileWithDriver | ProfileWithStaff; role: ProfileRole }
  | { ok: false; error: string }
> {
  if (allowed.includes("driver")) {
    const result = await requireDriverProfileForAction();
    if ("ok" in result) return result;
    return { profile: result.profile, role: "driver" };
  }
  const result = await requireStaffProfileForAction();
  if ("ok" in result) return result;
  return { profile: result.profile, role: "staff" };
}

// ── Re-exports ────────────────────────────────────────────────────────────────

export {
  registerDriverProfile,
  registerStaffProfile,
  promoteStaffToAdmin,
  setActiveProfileCookie,
  clearActiveProfileCookie,
  getActiveProfileId,
  getDriverWorkspacesForUser,
} from "@/lib/auth/profiles";

export {
  destinationForProfile,
  staffRoleLabel,
  isStaffActive,
  ACTIVE_PROFILE_COOKIE,
} from "@/lib/auth/profile-session";

export {
  completeLoginAfterSignIn,
  selectActiveProfile,
  selectActiveProfileAndRedirect,
} from "@/lib/auth/actions";
