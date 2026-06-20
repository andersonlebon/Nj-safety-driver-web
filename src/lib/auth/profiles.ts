import { cache } from "react";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { friendlyError } from "@/lib/errors";
import { ACTIVE_PROFILE_COOKIE } from "@/lib/auth/profile-session";
import type { ProfileRole, StaffRole } from "@/lib/types/database";
import type {
  Profile,
  ProfileWithDriver,
  ProfileWithStaff,
  DriverProfile,
  StaffProfile,
} from "@/types";

// ── Cookie helpers ────────────────────────────────────────────────────────────

export async function getActiveProfileId(): Promise<string | null> {
  const store = cookies();
  return store.get(ACTIVE_PROFILE_COOKIE)?.value ?? null;
}

export async function setActiveProfileCookie(profileId: string): Promise<void> {
  const store = cookies();
  store.set(ACTIVE_PROFILE_COOKIE, profileId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearActiveProfileCookie(): Promise<void> {
  const store = cookies();
  store.delete(ACTIVE_PROFILE_COOKIE);
}

// ── Profile fetch helpers ─────────────────────────────────────────────────────

/** Returns all profile rows for the given auth user ID. */
export const getProfilesForUser = cache(
  async (userId: string): Promise<Profile[]> => {
    const supabase = createClient();
    const [{ data: byUserId }, { data: byId }] = await Promise.all([
      supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true }),
      supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle<Profile>(),
    ]);

    const merged = new Map<string, Profile>();
    for (const row of byUserId ?? []) merged.set(row.id, row as Profile);
    if (byId) merged.set(byId.id, byId);

    return Array.from(merged.values()).sort((a, b) =>
      a.created_at.localeCompare(b.created_at)
    );
  }
);

/** Driver workspaces owned by the user (role=driver or legacy driver_profiles row). */
export const getDriverWorkspacesForUser = cache(
  async (userId: string): Promise<ProfileWithDriver[]> => {
    const profiles = await getProfilesForUser(userId);
    const results: ProfileWithDriver[] = [];
    const seen = new Set<string>();

    for (const profile of profiles) {
      const enriched = await getProfileWithDriver(profile.id);
      if (!enriched || seen.has(enriched.id)) continue;
      if (enriched.role === "driver" || enriched.driverProfile) {
        seen.add(enriched.id);
        results.push(enriched);
      }
    }

    return results;
  }
);

/** Returns a single profile enriched with its driver sub-row. */
export async function getProfileWithDriver(
  profileId: string
): Promise<ProfileWithDriver | null> {
  const supabase = createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", profileId)
    .maybeSingle<Profile>();
  if (!profile) return null;

  const { data: driverProfile } = await supabase
    .from("driver_profiles")
    .select("*")
    .eq("profile_id", profileId)
    .maybeSingle<DriverProfile>();

  if (profile.role !== "driver" && !driverProfile) return null;

  return { ...profile, driverProfile: driverProfile ?? null };
}

/** Returns a single profile enriched with its staff sub-row. */
export async function getProfileWithStaff(
  profileId: string
): Promise<ProfileWithStaff | null> {
  const supabase = createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", profileId)
    .maybeSingle<Profile>();
  if (!profile || profile.role !== "staff") return null;

  const { data: staffProfile } = await supabase
    .from("staff_profiles")
    .select("*")
    .eq("profile_id", profileId)
    .maybeSingle<StaffProfile>();

  return { ...profile, staffProfile: staffProfile ?? null };
}

// ── Registration ──────────────────────────────────────────────────────────────

export type RegisterDriverInput = {
  userId: string;
  email?: string | null;
  fullName?: string | null;
  phone?: string | null;
  nationalId?: string | null;
  driverLicense?: string | null;
  address?: string | null;
  nationalityCountry?: string | null;
};

/** Creates a driver profile row + driver_profiles sub-row. Idempotent. */
export async function registerDriverProfile(
  input: RegisterDriverInput
): Promise<{ ok: true; profileId: string } | { ok: false; error: string }> {
  const admin = createAdminClient() as any;

  // Check if this user already has a driver profile (incl. legacy id = userId)
  const { data: byUserId } = await admin
    .from("profiles")
    .select("id")
    .eq("user_id", input.userId)
    .eq("role", "driver")
    .maybeSingle();

  const { data: byId } = !byUserId
    ? await admin
        .from("profiles")
        .select("id")
        .eq("id", input.userId)
        .eq("role", "driver")
        .maybeSingle()
    : { data: null };

  const existing = byUserId ?? byId;

  let profileId: string;

  if (existing) {
    profileId = existing.id;
    // Update personal info
    const patch: Record<string, unknown> = {};
    if (input.fullName !== undefined) patch.full_name = input.fullName;
    if (input.phone !== undefined) patch.phone = input.phone;
    if (input.nationalId !== undefined) patch.national_id = input.nationalId;
    if (input.driverLicense !== undefined)
      patch.driver_license = input.driverLicense;
    if (input.address !== undefined) patch.address = input.address;
    if (input.nationalityCountry !== undefined)
      patch.nationality_country = input.nationalityCountry;
    if (Object.keys(patch).length > 0) {
      await admin.from("profiles").update(patch).eq("id", profileId);
    }
  } else {
    const { data: created, error } = await admin
      .from("profiles")
      .insert({
        user_id: input.userId,
        role: "driver",
        email: input.email ?? null,
        full_name: input.fullName ?? null,
        phone: input.phone ?? null,
        national_id: input.nationalId ?? null,
        driver_license: input.driverLicense ?? null,
        address: input.address ?? null,
        nationality_country: input.nationalityCountry ?? "GA",
        verification_status: "pending_documents",
      })
      .select("id")
      .single();

    if (error || !created)
      return {
        ok: false,
        error: friendlyError(error ?? "Failed to create driver profile."),
      };
    profileId = created.id;
  }

  // Ensure driver_profiles sub-row exists
  const { error: subError } = await admin
    .from("driver_profiles")
    .upsert({ profile_id: profileId }, { onConflict: "profile_id" });
  if (subError) return { ok: false, error: friendlyError(subError) };

  return { ok: true, profileId };
}

export type RegisterStaffInput = {
  userId: string;
  staffRole?: StaffRole;
  email?: string | null;
  fullName?: string | null;
  phone?: string | null;
  badgeId?: string | null;
  applicationStatus?: "pending" | "approved" | "rejected";
  applicationNote?: string | null;
};

/** Creates a staff profile row + staff_profiles sub-row. Idempotent. */
export async function registerStaffProfile(
  input: RegisterStaffInput
): Promise<{ ok: true; profileId: string } | { ok: false; error: string }> {
  const admin = createAdminClient() as any;
  const staffRole: StaffRole = input.staffRole ?? "agent";

  // Check if this user already has a staff profile
  const { data: existing } = await admin
    .from("profiles")
    .select("id")
    .eq("user_id", input.userId)
    .eq("role", "staff")
    .maybeSingle();

  let profileId: string;

  if (existing) {
    profileId = existing.id;
    const patch: Record<string, unknown> = {};
    if (input.fullName !== undefined) patch.full_name = input.fullName;
    if (input.phone !== undefined) patch.phone = input.phone;
    if (Object.keys(patch).length > 0) {
      await admin.from("profiles").update(patch).eq("id", profileId);
    }
  } else {
    const { data: created, error } = await admin
      .from("profiles")
      .insert({
        user_id: input.userId,
        role: "staff",
        email: input.email ?? null,
        full_name: input.fullName ?? null,
        phone: input.phone ?? null,
        verification_status: "pending_review",
      })
      .select("id")
      .single();

    if (error || !created)
      return {
        ok: false,
        error: friendlyError(error ?? "Failed to create staff profile."),
      };
    profileId = created.id;
  }

  // Ensure staff_profiles sub-row exists
  const { error: subError } = await admin
    .from("staff_profiles")
    .upsert(
      {
        profile_id: profileId,
        staff_role: staffRole,
        badge_id: input.badgeId ?? null,
        application_status: input.applicationStatus ?? "pending",
        application_note: input.applicationNote ?? null,
      },
      { onConflict: "profile_id" }
    );
  if (subError) return { ok: false, error: friendlyError(subError) };

  return { ok: true, profileId };
}

// ── Promotion ─────────────────────────────────────────────────────────────────

/** Promotes an existing agent staff profile to admin. */
export async function promoteStaffToAdmin(
  staffProfileId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = createAdminClient() as any;

  const { error } = await admin
    .from("staff_profiles")
    .update({ staff_role: "admin" })
    .eq("profile_id", staffProfileId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// ── Backwards-compat alias ────────────────────────────────────────────────────
// Used by the setup/bootstrap flow which registers the first admin.
export { ACTIVE_PROFILE_COOKIE };

/** @deprecated Use registerStaffProfile with staffRole:'admin' instead. */
export async function registerRole(input: {
  userId: string;
  role: ProfileRole;
  email?: string | null;
  fullName?: string | null;
  phone?: string | null;
  badgeId?: string | null;
  agentApplicationStatus?: "pending" | "approved" | "rejected" | null;
  agentApplicationNote?: string | null;
  verificationStatus?: "pending_documents" | "pending_review" | "active" | "rejected";
}): Promise<{ ok: true; profileId: string } | { ok: false; error: string }> {
  if (input.role === "driver") {
    return registerDriverProfile({
      userId: input.userId,
      email: input.email,
      fullName: input.fullName,
      phone: input.phone,
    });
  }
  return registerStaffProfile({
    userId: input.userId,
    staffRole: "agent",
    email: input.email,
    fullName: input.fullName,
    phone: input.phone,
    badgeId: input.badgeId,
    applicationStatus: input.agentApplicationStatus ?? "pending",
    applicationNote: input.agentApplicationNote,
  });
}
