import { cache } from "react";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Database, UserRole } from "@/lib/types/database";

export const ACTIVE_ROLE_COOKIE = "nj_active_role";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

// ─── Cookie helpers ───────────────────────────────────────────────────────────

export async function getActiveRoleFromCookie(): Promise<UserRole | null> {
  const store = cookies();
  const value = store.get(ACTIVE_ROLE_COOKIE)?.value;
  if (!value) return null;
  if (value === "driver" || value === "agent" || value === "admin") return value;
  return null;
}

export async function setActiveRoleCookie(role: UserRole): Promise<void> {
  const store = cookies();
  store.set(ACTIVE_ROLE_COOKIE, role, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearActiveRoleCookie(): Promise<void> {
  const store = cookies();
  store.delete(ACTIVE_ROLE_COOKIE);
}

// ─── Profile fetch ────────────────────────────────────────────────────────────

export const getProfileForUser = cache(async (userId: string): Promise<Profile | null> => {
  const supabase = createClient();
  // First try id = userId (canonical), then user_id = userId
  const { data: byId } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle<Profile>();
  if (byId) return byId;

  const { data: byUserId } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle<Profile>();
  return byUserId ?? null;
});

// ─── Role management ──────────────────────────────────────────────────────────

export async function addRoleToProfile(
  profileId: string,
  role: UserRole
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = createAdminClient();
  const { error } = await admin.rpc("append_profile_type", {
    p_profile_id: profileId,
    p_role: role,
  });
  if (error) {
    // Fallback: fetch + update if RPC not available
    const { data: existing } = await admin
      .from("profiles")
      .select("profile_types")
      .eq("id", profileId)
      .maybeSingle();
    if (!existing) return { ok: false, error: "Profile not found." };
    const current: UserRole[] = (existing.profile_types as UserRole[]) ?? [];
    if (current.includes(role)) return { ok: true };
    const { error: updateError } = await admin
      .from("profiles")
      .update({ profile_types: [...current, role] })
      .eq("id", profileId);
    if (updateError) return { ok: false, error: updateError.message };
  }
  return { ok: true };
}

export async function ensureTypedProfileRow(
  profileId: string,
  role: UserRole,
  data?: { badgeId?: string | null }
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = createAdminClient();

  if (role === "driver") {
    const { error } = await admin
      .from("driver_profiles")
      .upsert({ profile_id: profileId }, { onConflict: "profile_id" });
    if (error) return { ok: false, error: error.message };
  } else if (role === "agent") {
    const { error } = await admin
      .from("agent_profiles")
      .upsert({ profile_id: profileId, badge_id: data?.badgeId ?? null }, { onConflict: "profile_id" });
    if (error) return { ok: false, error: error.message };
  } else if (role === "admin") {
    const { error } = await admin
      .from("admin_profiles")
      .upsert({ profile_id: profileId }, { onConflict: "profile_id" });
    if (error) return { ok: false, error: error.message };
  }
  return { ok: true };
}

export type RegisterRoleInput = {
  userId: string;
  role: UserRole;
  email?: string | null;
  fullName?: string | null;
  phone?: string | null;
  badgeId?: string | null;
  agentApplicationStatus?: "pending" | "approved" | "rejected" | null;
  agentApplicationNote?: string | null;
  verificationStatus?: "pending_documents" | "pending_review" | "active" | "rejected";
};

/**
 * Ensures a profile exists for the user, then adds the given role to their
 * profile_types and creates the typed profile row. Idempotent.
 */
export async function registerRole(
  input: RegisterRoleInput
): Promise<{ ok: true; profileId: string } | { ok: false; error: string }> {
  const admin = createAdminClient();

  // Ensure profile exists (create if missing)
  const { data: existing } = await admin
    .from("profiles")
    .select("id, profile_types")
    .eq("id", input.userId)
    .maybeSingle();

  let profileId: string;

  if (!existing) {
    const { data: created, error: createError } = await admin
      .from("profiles")
      .insert({
        id: input.userId,
        user_id: input.userId,
        email: input.email ?? null,
        full_name: input.fullName ?? null,
        phone: input.phone ?? null,
        profile_types: [input.role],
        agent_application_status: input.agentApplicationStatus ?? null,
        agent_application_note: input.agentApplicationNote ?? null,
        verification_status: input.verificationStatus ?? "pending_documents",
      })
      .select("id")
      .single();
    if (createError || !created) {
      return { ok: false, error: createError?.message ?? "Failed to create profile." };
    }
    profileId = created.id;
  } else {
    profileId = existing.id;
    const current: UserRole[] = (existing.profile_types as UserRole[]) ?? [];
    if (!current.includes(input.role)) {
      const { error } = await admin
        .from("profiles")
        .update({ profile_types: [...current, input.role] })
        .eq("id", profileId);
      if (error) return { ok: false, error: error.message };
    }
    // Also update personal info if provided
    const patch: Record<string, unknown> = {};
    if (input.fullName) patch.full_name = input.fullName;
    if (input.phone) patch.phone = input.phone;
    if (input.agentApplicationStatus !== undefined)
      patch.agent_application_status = input.agentApplicationStatus;
    if (input.agentApplicationNote !== undefined)
      patch.agent_application_note = input.agentApplicationNote;
    if (Object.keys(patch).length > 0) {
      await admin.from("profiles").update(patch).eq("id", profileId);
    }
  }

  // Ensure typed row
  const typed = await ensureTypedProfileRow(profileId, input.role, { badgeId: input.badgeId });
  if (!typed.ok) return typed;

  return { ok: true, profileId };
}

export async function promoteToAdmin(
  actingAdminProfileId: string,
  targetProfileId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = createAdminClient();

  // Verify target profile exists and has 'agent' role
  const { data: target } = await admin
    .from("profiles")
    .select("id, profile_types")
    .eq("id", targetProfileId)
    .maybeSingle();

  if (!target) return { ok: false, error: "Profile not found." };

  const types: UserRole[] = (target.profile_types as UserRole[]) ?? [];
  if (types.includes("admin")) return { ok: true }; // Already admin

  // Add admin to profile_types
  const { error: updateError } = await admin
    .from("profiles")
    .update({ profile_types: [...types, "admin"] })
    .eq("id", targetProfileId);
  if (updateError) return { ok: false, error: updateError.message };

  // Create admin_profiles row
  const { error: adminRowError } = await admin
    .from("admin_profiles")
    .upsert({ profile_id: targetProfileId }, { onConflict: "profile_id" });
  if (adminRowError) return { ok: false, error: adminRowError.message };

  return { ok: true };
}
