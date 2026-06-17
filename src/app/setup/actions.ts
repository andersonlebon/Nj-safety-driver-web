"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { setActiveProfileCookie } from "@/lib/auth/profiles";
import { friendlyError } from "@/lib/errors";

export type SetupResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Returns true if at least one admin profile already exists.
 * Uses the service-role client so RLS cannot mask the count.
 */
async function adminExists(): Promise<boolean> {
  const admin = createAdminClient();
  const { count, error } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin");
  if (error) {
    throw new Error(`Failed to check for existing admins: ${error.message}`);
  }
  return (count ?? 0) > 0;
}

export async function bootstrapAdmin(formData: FormData): Promise<SetupResult> {
  const full_name = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm_password") ?? "");

  if (!full_name || !email || !password) {
    return { ok: false, error: "All fields are required." };
  }
  if (password.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters." };
  }
  if (password !== confirm) {
    return { ok: false, error: "Passwords do not match." };
  }

  // Race-safe re-check: even if someone hit this action directly, post-bootstrap
  // it must refuse to run.
  if (await adminExists()) {
    throw new Error("Setup is locked");
  }

  const admin = createAdminClient();

  // 1. Create the auth user via the privileged Admin API. `email_confirm: true`
  //    skips the inbox confirmation hop so the new admin can sign in immediately.
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name },
  });

  if (createErr || !created.user) {
    return {
      ok: false,
      error: createErr ? friendlyError(createErr) : "Failed to create user.",
    };
  }

  const userId = created.user.id;

  // 2. Explicitly upsert the profiles row with role='admin'. We do NOT rely on
  //    the `handle_new_user` trigger's metadata path: that path is now hardened
  //    to ALWAYS default to 'driver' (see post-migrations) to prevent
  //    privilege escalation via the public signup endpoint.
  const { error: upsertErr } = await admin
    .from("profiles")
    .upsert(
      {
        id: userId,
        user_id: userId,
        email,
        full_name,
        role: "admin",
      },
      { onConflict: "id" }
    );

  if (upsertErr) {
    await admin.auth.admin.deleteUser(userId).catch(() => {});
    return {
      ok: false,
      error: `We couldn't finish creating your admin account. ${friendlyError(upsertErr)}`,
    };
  }

  await admin.from("user_profile_links").upsert(
    {
      user_id: userId,
      profile_id: userId,
      profile_type: "admin",
    },
    { onConflict: "user_id,profile_type" }
  );

  // 3. Sign the new admin in via the regular SSR client so the auth cookies
  //    land on the response and the next request is already authenticated.
  const supabase = createClient();
  const { error: signInErr } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (signInErr) {
    return {
      ok: false,
      error: `Admin account created. Please sign in at /login/admin. (${friendlyError(signInErr)})`,
    };
  }

  await setActiveProfileCookie(userId);
  redirect("/admin");
}
