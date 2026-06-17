import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

type AdminClient = SupabaseClient<Database>;

export async function adminInstallationExists(admin: AdminClient): Promise<boolean> {
  const [{ data: adminRoleProfiles }, { data: adminTypedProfiles }] = await Promise.all([
    admin.from("profiles").select("id, user_id, role").eq("role", "admin"),
    admin.from("admin_profiles").select("profile_id"),
  ]);

  const adminProfileIds = new Set<string>();
  for (const row of adminRoleProfiles ?? []) {
    adminProfileIds.add(row.id);
  }
  for (const row of adminTypedProfiles ?? []) {
    adminProfileIds.add(row.profile_id);
  }

  for (const profileId of adminProfileIds) {
    const { data: profile } = await admin
      .from("profiles")
      .select("id, user_id, role")
      .eq("id", profileId)
      .maybeSingle();

    if (!profile) {
      await admin.from("admin_profiles").delete().eq("profile_id", profileId);
      await admin.from("user_profile_links").delete().eq("profile_id", profileId);
      continue;
    }

    const authId = profile.user_id ?? profile.id;
    const { data: authUser, error } = await admin.auth.admin.getUserById(authId);

    if (error || !authUser.user) {
      await deleteProfileGraph(admin, profile.id);
      continue;
    }

    if (profile.role !== "admin") {
      await admin.from("admin_profiles").delete().eq("profile_id", profile.id);
      continue;
    }

    return true;
  }

  return false;
}

/** Returns a user-facing message when multi-profile migrations were not applied. */
export async function getSetupSchemaError(admin: AdminClient): Promise<string | null> {
  const { error: profileError } = await admin.from("profiles").select("user_id").limit(1);
  if (profileError) {
    const message = profileError.message.toLowerCase();
    if (message.includes("user_id") || message.includes("column")) {
      return "Database setup is incomplete: the profiles.user_id column is missing. Run npm run db:push against production, then retry.";
    }
  }

  const { error: linkError } = await admin.from("user_profile_links").select("id").limit(1);
  if (linkError) {
    const message = linkError.message.toLowerCase();
    if (
      message.includes("user_profile_links") ||
      message.includes("does not exist") ||
      message.includes("schema cache")
    ) {
      return "Database setup is incomplete: the user_profile_links table is missing. Run npm run db:push against production, then retry.";
    }
  }

  const { error: adminProfileError } = await admin
    .from("admin_profiles")
    .select("profile_id")
    .limit(1);
  if (adminProfileError) {
    const message = adminProfileError.message.toLowerCase();
    if (message.includes("admin_profiles") || message.includes("does not exist")) {
      return "Database setup is incomplete: admin_profiles table is missing. Run npm run db:push against production, then retry.";
    }
  }

  return null;
}

async function deleteProfileGraph(admin: AdminClient, profileId: string): Promise<void> {
  await admin.from("user_profile_links").delete().eq("profile_id", profileId);
  await admin.from("driver_profiles").delete().eq("profile_id", profileId);
  await admin.from("agent_profiles").delete().eq("profile_id", profileId);
  await admin.from("admin_profiles").delete().eq("profile_id", profileId);
  await admin.from("profiles").delete().eq("id", profileId);
}

export async function removeOrphanProfilesForEmail(
  admin: AdminClient,
  email: string
): Promise<void> {
  const normalized = email.trim().toLowerCase();
  const { data: rows } = await admin
    .from("profiles")
    .select("id, user_id")
    .eq("email", normalized);

  for (const row of rows ?? []) {
    const authId = row.user_id ?? row.id;
    const { data: authUser, error } = await admin.auth.admin.getUserById(authId);
    if (error || !authUser.user) {
      await deleteProfileGraph(admin, row.id);
    }
  }
}

export async function findAuthUserByEmail(
  admin: AdminClient,
  email: string
): Promise<{ id: string; email?: string } | null> {
  const normalized = email.trim().toLowerCase();
  let page = 1;

  while (page <= 5) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;

    const match = data.users.find((user) => user.email?.toLowerCase() === normalized);
    if (match) return { id: match.id, email: match.email ?? undefined };

    if (data.users.length < 200) break;
    page += 1;
  }

  return null;
}

export async function finalizeBootstrapAdminProfile(
  admin: AdminClient,
  input: { userId: string; email: string; full_name: string }
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { userId, email, full_name } = input;

  await admin.from("user_profile_links").delete().eq("user_id", userId);
  await admin.from("user_profile_links").delete().eq("profile_id", userId);
  await admin.from("driver_profiles").delete().eq("profile_id", userId);
  await admin.from("agent_profiles").delete().eq("profile_id", userId);
  await admin.from("admin_profiles").delete().eq("profile_id", userId);

  const { data: existing } = await admin
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (existing) {
    const { error } = await admin
      .from("profiles")
      .update({
        role: "admin",
        user_id: userId,
        email,
        full_name,
        agent_application_status: null,
        verification_status: "active",
      })
      .eq("id", userId);

    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await admin.from("profiles").insert({
      id: userId,
      user_id: userId,
      email,
      full_name,
      role: "admin",
      verification_status: "active",
    });

    if (error) return { ok: false, error: error.message };
  }

  // The sync_user_profile_link trigger fires when the profile role is updated
  // to "admin" above and may have already inserted this row. Use upsert so we
  // don't fail with a unique constraint violation.
  const { error: linkError } = await admin.from("user_profile_links").upsert(
    { user_id: userId, profile_id: userId, profile_type: "admin" },
    { onConflict: "user_id,profile_type" }
  );

  if (linkError) return { ok: false, error: linkError.message };

  const { data: adminRow } = await admin
    .from("admin_profiles")
    .select("profile_id")
    .eq("profile_id", userId)
    .maybeSingle();

  if (!adminRow) {
    const { error: adminProfileError } = await admin
      .from("admin_profiles")
      .insert({ profile_id: userId });
    if (adminProfileError) return { ok: false, error: adminProfileError.message };
  }

  return { ok: true };
}

export async function rollbackBootstrapAttempt(
  admin: AdminClient,
  input: { userId: string; email: string }
): Promise<void> {
  await deleteProfileGraph(admin, input.userId);
  await removeOrphanProfilesForEmail(admin, input.email);
  await admin.auth.admin.deleteUser(input.userId).catch(() => {});
}
