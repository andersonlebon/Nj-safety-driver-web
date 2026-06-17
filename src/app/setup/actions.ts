"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { setActiveProfileCookie } from "@/lib/auth/profiles";
import { friendlyError } from "@/lib/errors";
import {
  adminInstallationExists,
  finalizeBootstrapAdminProfile,
  findAuthUserByEmail,
  getSetupSchemaError,
  removeOrphanProfilesForEmail,
  rollbackBootstrapAttempt,
} from "@/lib/auth/bootstrap-admin";

export type SetupResult =
  | { ok: true }
  | { ok: false; error: string };

export async function bootstrapAdmin(formData: FormData): Promise<SetupResult> {
  const full_name = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm_password") ?? "");

  try {
    if (!full_name || !email || !password) {
      return { ok: false, error: "All fields are required." };
    }
    if (password.length < 8) {
      return { ok: false, error: "Password must be at least 8 characters." };
    }
    if (password !== confirm) {
      return { ok: false, error: "Passwords do not match." };
    }

    const admin = createAdminClient();

    if (await adminInstallationExists(admin)) {
      return { ok: false, error: "Setup is already complete. Sign in at /login/admin." };
    }

    const schemaError = await getSetupSchemaError(admin);
    if (schemaError) {
      console.error("bootstrapAdmin schema check failed", { email, schemaError });
      return { ok: false, error: schemaError };
    }

    await removeOrphanProfilesForEmail(admin, email);

    const existingAuth = await findAuthUserByEmail(admin, email);
    if (existingAuth) {
      return {
        ok: false,
        error:
          "An account with that email already exists. Sign in at /login/admin or use a different email.",
      };
    }

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    });

    if (createErr || !created.user) {
      console.error("bootstrapAdmin createUser failed", {
        email,
        error: createErr?.message ?? "missing user in response",
      });
      return {
        ok: false,
        error: createErr ? friendlyError(createErr) : "Failed to create user.",
      };
    }

    const userId = created.user.id;

    const finalized = await finalizeBootstrapAdminProfile(admin, {
      userId,
      email,
      full_name,
    });

    if (!finalized.ok) {
      console.error("bootstrapAdmin finalizeBootstrapAdminProfile failed", {
        email,
        userId,
        error: finalized.error,
      });
      await rollbackBootstrapAttempt(admin, { userId, email });
      return {
        ok: false,
        error: `We couldn't finish creating your admin account. ${friendlyError({ message: finalized.error })}`,
      };
    }

    const supabase = createClient();
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInErr) {
      console.error("bootstrapAdmin signInWithPassword failed", {
        email,
        userId,
        error: signInErr.message,
      });
      return {
        ok: false,
        error: `Admin account created. Please sign in at /login/admin. (${friendlyError(signInErr)})`,
      };
    }

    await setActiveProfileCookie(userId);
    redirect("/admin");
  } catch (error) {
    console.error("bootstrapAdmin unexpected failure", { email, error });
    return {
      ok: false,
      error: "Setup failed unexpectedly. Check the server console for details and try again.",
    };
  }
}
