import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database, UserRole } from "@/lib/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export async function getSessionUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Returns the current user's profile.
 * If the auth user exists but the profiles row is missing (e.g. signup happened
 * before the auth trigger was installed, or RLS blocked the trigger), this
 * will lazily create the row from the user's metadata.
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: existing } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle<Profile>();

  if (existing) return existing;

  const meta = (user.user_metadata ?? {}) as {
    full_name?: string;
    role?: UserRole;
  };

  const { data: created } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      email: user.email ?? null,
      full_name: meta.full_name ?? null,
      role: meta.role ?? "driver",
    })
    .select("*")
    .single<Profile>();

  return created ?? null;
}

export async function requireRole(allowed: UserRole[]): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/login");
  }
  if (!allowed.includes(profile.role)) {
    redirect(`/${profile.role}`);
  }
  return profile;
}
