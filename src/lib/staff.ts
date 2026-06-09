import type { UserRole } from "@/lib/types/database";

export const STAFF_ROLES: UserRole[] = ["agent", "admin"];

export function isStaffRole(role: UserRole | string): boolean {
  return STAFF_ROLES.includes(role as UserRole);
}

/** Agents may manage drivers/vehicles/infractions like admins. */
export function canManageOperations(role: UserRole | string): boolean {
  return isStaffRole(role);
}

/** Only existing admins may grant or revoke the admin role. */
export function canAssignAdminRole(actorRole: UserRole | string): boolean {
  return actorRole === "admin";
}
