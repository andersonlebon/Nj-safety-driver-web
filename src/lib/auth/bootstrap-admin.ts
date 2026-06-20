type AdminClient = any;

export async function adminInstallationExists(admin: AdminClient): Promise<boolean> {
  const { data, error } = await admin
    .from("staff_profiles")
    .select("profile_id")
    .eq("staff_role", "admin")
    .limit(1);

  if (error) return false;
  if (!data || data.length === 0) return false;

  const firstRow = data[0] as { profile_id: string };

  // Verify the profile row has a valid auth user
  const { data: profile } = await admin
    .from("profiles")
    .select("id, user_id")
    .eq("id", firstRow.profile_id)
    .maybeSingle();

  if (!profile) {
    // Orphan — clean up
    await admin.from("staff_profiles").delete().eq("profile_id", firstRow.profile_id);
    return false;
  }

  const { data: authUser, error: authError } = await admin.auth.admin.getUserById(
    profile.user_id
  );
  if (authError || !authUser.user) {
    await admin.from("staff_profiles").delete().eq("profile_id", firstRow.profile_id);
    await admin.from("profiles").delete().eq("id", firstRow.profile_id);
    return false;
  }

  return true;
}

export async function getSetupSchemaError(admin: AdminClient): Promise<string | null> {
  const { error: profileError } = await admin.from("profiles").select("id").limit(1);
  if (profileError) {
    const msg = profileError.message.toLowerCase();
    if (msg.includes("profiles") || msg.includes("column")) {
      return "Database setup is incomplete: profiles table issue. Run npm run db:push, then retry.";
    }
  }

  const { error: staffError } = await admin
    .from("staff_profiles")
    .select("profile_id")
    .limit(1);
  if (staffError) {
    const msg = staffError.message.toLowerCase();
    if (msg.includes("staff_profiles") || msg.includes("does not exist")) {
      return "Database setup is incomplete: staff_profiles table is missing. Run npm run db:push, then retry.";
    }
  }

  return null;
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
    const { data: authUser, error } = await admin.auth.admin.getUserById(row.user_id);
    if (error || !authUser.user) {
      await admin.from("driver_profiles").delete().eq("profile_id", row.id);
      await admin.from("staff_profiles").delete().eq("profile_id", row.id);
      await admin.from("profiles").delete().eq("id", row.id);
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
    const match = data.users.find((u: { id: string; email?: string }) => u.email?.toLowerCase() === normalized);
    if (match) return { id: match.id, email: match.email };
    if (data.users.length < 200) break;
    page++;
  }
  return null;
}

export async function finalizeBootstrapAdminProfile(
  admin: AdminClient,
  input: { userId: string; email: string; full_name: string }
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { userId, email, full_name } = input;

  // Remove any stale typed rows
  await admin.from("driver_profiles").delete().eq("profile_id", userId);
  await admin.from("staff_profiles").delete().eq("profile_id", userId);

  // Upsert the profiles row as staff
  const { data: existing } = await admin
    .from("profiles")
    .select("id")
    .eq("user_id", userId)
    .eq("role", "staff")
    .maybeSingle();

  let profileId: string;

  if (existing) {
    profileId = existing.id;
    const { error } = await admin
      .from("profiles")
      .update({ email, full_name, verification_status: "active" })
      .eq("id", profileId);
    if (error) return { ok: false, error: error.message };
  } else {
    // Also clean up any other profiles for this user
    await admin.from("profiles").delete().eq("user_id", userId);

    const { data: created, error } = await admin
      .from("profiles")
      .insert({
        user_id: userId,
        email,
        full_name,
        role: "staff",
        verification_status: "active",
      })
      .select("id")
      .single();
    if (error || !created) return { ok: false, error: error?.message ?? "Insert failed." };
    profileId = created.id;
  }

  const { error: staffError } = await admin
    .from("staff_profiles")
    .upsert(
      { profile_id: profileId, staff_role: "admin" },
      { onConflict: "profile_id" }
    );
  if (staffError) return { ok: false, error: staffError.message };

  return { ok: true };
}

export async function rollbackBootstrapAttempt(
  admin: AdminClient,
  input: { userId: string; email: string }
): Promise<void> {
  await admin.from("driver_profiles").delete().eq("profile_id", input.userId);
  await admin.from("staff_profiles").delete().eq("profile_id", input.userId);
  await admin.from("profiles").delete().eq("user_id", input.userId);
  await removeOrphanProfilesForEmail(admin, input.email);
  await admin.auth.admin.deleteUser(input.userId).catch((err: unknown) =>
    console.error("Failed to delete auth user during rollback", err)
  );
}
