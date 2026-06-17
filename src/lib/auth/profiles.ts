import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Database, UserRole } from "@/lib/types/database";
import { ACTIVE_PROFILE_COOKIE, type ProfileSummary } from "./profile-session";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export async function getActiveProfileIdFromCookie(): Promise<string | null> {
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

export async function listProfilesForUser(userId: string): Promise<ProfileSummary[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, role, full_name, email, onboarded_at, agent_application_status")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  const rows = data ?? [];
  if (rows.length > 0) return rows as ProfileSummary[];

  const { data: legacy } = await supabase
    .from("profiles")
    .select("id, role, full_name, email, onboarded_at, agent_application_status")
    .eq("id", userId)
    .maybeSingle();

  return legacy ? [legacy as ProfileSummary] : [];
}

export async function resolveActiveProfile(
  userId: string,
  preferredProfileId?: string | null
): Promise<Profile | null> {
  const profiles = await listProfilesForUser(userId);
  if (profiles.length === 0) return null;

  const cookieId = preferredProfileId ?? (await getActiveProfileIdFromCookie());
  if (cookieId) {
    const match = profiles.find((profile) => profile.id === cookieId);
    if (match) {
      return loadProfileById(match.id);
    }
  }

  if (profiles.length === 1) {
    const only = profiles[0];
    await setActiveProfileCookie(only.id);
    return loadProfileById(only.id);
  }

  return null;
}

async function loadProfileById(profileId: string): Promise<Profile | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", profileId)
    .maybeSingle<Profile>();
  return data ?? null;
}

export type CreateProfileInput = {
  userId: string;
  role: UserRole;
  email?: string | null;
  full_name?: string | null;
  phone?: string | null;
  agent_badge_id?: string | null;
  agent_application_status?: Profile["agent_application_status"];
  verification_status?: Profile["verification_status"];
};

/**
 * Create an additional typed profile for an existing auth user.
 * Uses the service role so RLS does not block admin promotion flows.
 */
export async function createTypedProfile(
  input: CreateProfileInput
): Promise<{ ok: true; profileId: string } | { ok: false; error: string }> {
  const admin = createAdminClient();

  const { data: existingLink } = await admin
    .from("user_profile_links")
    .select("profile_id")
    .eq("user_id", input.userId)
    .eq("profile_type", input.role)
    .maybeSingle();

  if (existingLink?.profile_id) {
    return { ok: true, profileId: existingLink.profile_id };
  }

  const profileId = crypto.randomUUID();

  const { error: profileError } = await admin.from("profiles").insert({
    id: profileId,
    user_id: input.userId,
    role: input.role,
    email: input.email ?? null,
    full_name: input.full_name ?? null,
    phone: input.phone ?? null,
    agent_badge_id: input.agent_badge_id ?? null,
    agent_application_status: input.agent_application_status ?? null,
    verification_status: input.verification_status ?? undefined,
  });

  if (profileError) {
    return { ok: false, error: profileError.message };
  }

  const { error: linkError } = await admin.from("user_profile_links").insert({
    user_id: input.userId,
    profile_id: profileId,
    profile_type: input.role,
  });

  if (linkError) {
    await admin.from("profiles").delete().eq("id", profileId);
    return { ok: false, error: linkError.message };
  }

  return { ok: true, profileId };
}

export async function userOwnsProfile(
  userId: string,
  profileId: string
): Promise<boolean> {
  const profiles = await listProfilesForUser(userId);
  return profiles.some((profile) => profile.id === profileId);
}
