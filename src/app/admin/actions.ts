"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { friendlyError } from "@/lib/errors";
import { requireRole } from "@/lib/auth";
import { canAssignAdminRole } from "@/lib/staff";
import type { UserRole } from "@/lib/types/database";

const ROLES: readonly UserRole[] = ["driver", "agent", "admin"] as const;

export type AdminActionResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Change another user's role. Admin-only. Refuses self-demotion to prevent
 * the "I locked myself out of my own dashboard" mistake — the very first
 * admin can only be removed from the database directly.
 *
 * RLS: `profiles_update_self_or_admin` already allows admins to update any
 * row, so the regular SSR client (anon key + admin session cookie) is enough
 * here — we don't need the service role.
 */
export async function updateUserRole(
  userId: string,
  role: UserRole
): Promise<AdminActionResult> {
  const me = await requireRole(["admin", "agent"]);

  if (!ROLES.includes(role)) {
    return { ok: false, error: `Unknown role: ${role}` };
  }

  if (!userId) {
    return { ok: false, error: "Missing user id." };
  }

  if (role === "admin" && !canAssignAdminRole(me.role)) {
    return {
      ok: false,
      error: "Only administrators can assign or remove the admin role.",
    };
  }

  if (userId === me.id && role !== "admin") {
    return {
      ok: false,
      error:
        "You cannot demote yourself. Ask another administrator, or change the role directly in the database.",
    };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId);

  if (error) {
    return { ok: false, error: friendlyError(error) };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/drivers");
  revalidatePath("/admin/agents");
  return { ok: true };
}

export async function updateDriverVerification(
  userId: string,
  status: "active" | "rejected" | "pending_review",
  adminMessage?: string | null
): Promise<AdminActionResult> {
  await requireRole(["admin", "agent"]);
  if (!userId) return { ok: false, error: "Missing user id." };

  const supabase = createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      verification_status: status,
      admin_message: adminMessage?.trim() || null,
    })
    .eq("id", userId)
    .eq("role", "driver");

  if (error) return { ok: false, error: friendlyError(error) };

  revalidatePath("/admin/drivers");
  revalidatePath("/admin/vehicles");
  revalidatePath("/driver");
  return { ok: true };
}

export async function reviewAgentApplication(
  userId: string,
  decision: "approve" | "reject",
  message?: string | null
): Promise<AdminActionResult> {
  await requireRole(["admin"]);
  if (!userId) return { ok: false, error: "Missing user id." };

  const supabase = createClient();

  if (decision === "approve") {
    const { error } = await supabase
      .from("profiles")
      .update({
        role: "agent",
        agent_application_status: "approved",
        admin_message: null,
      })
      .eq("id", userId)
      .eq("agent_application_status", "pending");

    if (error) return { ok: false, error: friendlyError(error) };
  } else {
    const { error } = await supabase
      .from("profiles")
      .update({
        agent_application_status: "rejected",
        admin_message: message?.trim() || "Application not approved at this time.",
      })
      .eq("id", userId)
      .eq("agent_application_status", "pending");

    if (error) return { ok: false, error: friendlyError(error) };
  }

  revalidatePath("/admin/agents");
  revalidatePath("/register/agent/pending");
  return { ok: true };
}

export async function updateVehicleVerification(
  vehicleId: string,
  status: "active" | "rejected" | "pending_review"
): Promise<AdminActionResult> {
  await requireRole(["admin", "agent"]);
  if (!vehicleId) return { ok: false, error: "Missing vehicle id." };

  const supabase = createClient();

  const { error } = await supabase
    .from("vehicles")
    .update({ verification_status: status })
    .eq("id", vehicleId);

  if (error) return { ok: false, error: friendlyError(error) };

  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("plate_number")
    .eq("id", vehicleId)
    .maybeSingle();

  if (vehicle) {
    await supabase.from("vehicle_tracking_events").insert({
      vehicle_id: vehicleId,
      plate_number: vehicle.plate_number,
      event_type: "verification",
      notes: `Vehicle status set to ${status}`,
    });
  }

  revalidatePath("/admin/vehicles");
  revalidatePath("/driver/vehicles");
  return { ok: true };
}
