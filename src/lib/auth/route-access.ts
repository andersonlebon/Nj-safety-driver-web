import type { ProfileRole, StaffRole } from "@/lib/types/database";

export type RouteProfile = {
  id: string;
  user_id: string;
  role: ProfileRole;
  onboarded_at: string | null;
};

export type RouteStaffProfile = {
  profile_id: string;
  staff_role: StaffRole;
  application_status: string | null;
};

export type RouteRoleResolution =
  | { kind: "none" }
  | { kind: "active"; profileId: string; role: ProfileRole; shouldSetCookie: boolean };

/**
 * Resolves the active route profile from the cookie.
 * Returns 'none' if no valid profile is found for the route.
 */
export function resolveRouteProfile(
  profiles: RouteProfile[],
  activeProfileId: string | null,
  requiredRole: ProfileRole
): RouteRoleResolution {
  const matching = profiles.filter((p) => p.role === requiredRole);
  if (matching.length === 0) return { kind: "none" };

  // Use the active cookie profile if it matches
  const active = matching.find((p) => p.id === activeProfileId);
  if (active) {
    return { kind: "active", profileId: active.id, role: active.role, shouldSetCookie: false };
  }

  // Auto-select if only one option
  if (matching.length === 1) {
    return { kind: "active", profileId: matching[0].id, role: matching[0].role, shouldSetCookie: true };
  }

  return { kind: "none" };
}

/** Checks if a staff profile is active (approved agent or any admin). */
export function isStaffProfileActive(staffProfile: RouteStaffProfile): boolean {
  if (staffProfile.staff_role === "admin") return true;
  return staffProfile.application_status === "approved";
}
