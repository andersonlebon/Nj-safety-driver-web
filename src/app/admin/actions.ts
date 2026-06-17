"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { friendlyError } from "@/lib/errors";
import { requireRole, requireRoleForAction, createTypedProfile } from "@/lib/auth";
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
  const auth = await requireRoleForAction(["admin"]);
  if ("ok" in auth) return auth;
  const me = auth;

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
  const { data: targetProfile, error: loadError } = await supabase
    .from("profiles")
    .select("id, user_id, email, full_name, phone, agent_badge_id")
    .eq("id", userId)
    .maybeSingle();

  if (loadError || !targetProfile) {
    return { ok: false, error: "Profile not found." };
  }

  const authUserId = targetProfile.user_id ?? targetProfile.id;

  if (role === "admin" || role === "agent") {
    const created = await createTypedProfile({
      userId: authUserId,
      role,
      email: targetProfile.email,
      full_name: targetProfile.full_name,
      phone: targetProfile.phone,
      agent_badge_id: targetProfile.agent_badge_id,
      agent_application_status: role === "agent" ? "approved" : null,
    });

    if (!created.ok) {
      return { ok: false, error: created.error };
    }

    revalidatePath("/admin");
    revalidatePath("/admin/drivers");
    revalidatePath("/admin/agents");
    return { ok: true };
  }

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
  const auth = await requireRoleForAction(["admin"]);
  if ("ok" in auth) return auth;
  if (!userId) return { ok: false, error: "Missing user id." };

  const supabase = createClient();
  const message = adminMessage?.trim() || null;
  const { error } = await supabase
    .from("profiles")
    .update({
      verification_status: status,
      admin_message: message,
    })
    .eq("id", userId)
    .eq("role", "driver");

  if (error) return { ok: false, error: friendlyError(error) };

  if (message) {
    const { error: messageError } = await supabase
      .from("driver_messages")
      .insert({
        driver_id: userId,
        sender_id: auth.id,
        body: message,
      });

    if (messageError) {
      return { ok: false, error: friendlyError(messageError) };
    }
  }

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
    const { data: applicant, error: loadError } = await supabase
      .from("profiles")
      .select("id, user_id, email, full_name, phone, agent_badge_id")
      .eq("id", userId)
      .eq("agent_application_status", "pending")
      .maybeSingle();

    if (loadError || !applicant) {
      return { ok: false, error: "Pending application not found." };
    }

    const authUserId = applicant.user_id ?? applicant.id;

    const created = await createTypedProfile({
      userId: authUserId,
      role: "agent",
      email: applicant.email,
      full_name: applicant.full_name,
      phone: applicant.phone,
      agent_badge_id: applicant.agent_badge_id,
      agent_application_status: "approved",
    });

    if (!created.ok) {
      return { ok: false, error: created.error };
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        agent_application_status: "approved",
        admin_message: null,
      })
      .eq("id", userId);

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
  await requireRole(["admin"]);
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

export async function saveInfractionTemplate(formData: FormData): Promise<AdminActionResult> {
  const auth = await requireRoleForAction(["admin"]);
  if ("ok" in auth) return auth;

  const id = String(formData.get("id") ?? "").trim();
  const label = String(formData.get("label") ?? "").trim();
  const amount = Number(formData.get("amount") ?? 0);
  const points = Number(formData.get("points") ?? 0);
  const category = String(formData.get("category") ?? "safety").trim() || "safety";
  const active = formData.get("active") !== "false";

  if (!label) return { ok: false, error: "Infraction label is required." };
  if (!Number.isFinite(amount) || amount < 0) {
    return { ok: false, error: "Amount must be a valid positive number." };
  }
  if (!Number.isInteger(points) || points < 0) {
    return { ok: false, error: "Points must be a valid positive integer." };
  }

  const code =
    String(formData.get("code") ?? "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") ||
    label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");

  const supabase = createClient();
  const payload = {
    code,
    label,
    amount,
    points,
    category,
    active,
  };
  const { error } = id
    ? await supabase.from("infraction_templates").update(payload).eq("id", id)
    : await supabase.from("infraction_templates").insert(payload);

  if (error) return { ok: false, error: friendlyError(error) };

  revalidatePath("/admin/infraction-templates");
  revalidatePath("/admin/infractions");
  revalidatePath("/agent/infractions");
  revalidatePath("/agent/search");
  return { ok: true };
}
