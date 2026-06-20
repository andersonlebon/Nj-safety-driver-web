import type { StaffRole } from "@/lib/types/database";

export const STAFF_ROLES: StaffRole[] = ["agent", "admin"];

export function isStaffRole(role: StaffRole | string): boolean {
  return STAFF_ROLES.includes(role as StaffRole);
}

export function canManageOperations(role: StaffRole | string): boolean {
  return isStaffRole(role);
}

export function canAssignAdminRole(actorRole: StaffRole | string): boolean {
  return actorRole === "admin";
}
