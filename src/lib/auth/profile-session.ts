import type { ProfileRole, StaffRole } from "@/lib/types/database";
import type { Profile, StaffProfile } from "@/types";

export const ACTIVE_PROFILE_COOKIE = "nj_active_profile";

/** Ordered list of staff sub-roles for display. */
export const STAFF_ROLE_ORDER: StaffRole[] = ["admin", "agent"];

export type ProfileSummary = {
  id: string;
  role: ProfileRole;
  full_name?: string | null;
  email?: string | null;
  onboarded_at: string | null;
};

/** Where to send a user after selecting a profile. */
export function destinationForProfile(
  profile: Pick<Profile, "role" | "onboarded_at">
): string {
  if (profile.role === "driver") {
    return profile.onboarded_at ? "/driver" : "/onboarding";
  }
  return "/staff";
}

/** Display label for a staff sub-role. */
export function staffRoleLabel(staffRole: StaffRole): string {
  return staffRole === "admin" ? "Administrator" : "Field Agent";
}

/** Whether a staff profile is active (approved agent or any admin). */
export function isStaffActive(staffProfile: StaffProfile): boolean {
  if (staffProfile.staff_role === "admin") return true;
  return staffProfile.application_status === "approved";
}
