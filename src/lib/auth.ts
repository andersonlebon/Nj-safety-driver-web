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

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  return profile;
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
