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

type AdminClient = any;

const INFRACTION_TEMPLATES = [
  { code: "SPEEDING_1_14",        label: "Speeding (1–14 mph over limit)",         amount: "95.00",  points: 2, category: "safety" },
  { code: "SPEEDING_15_29",       label: "Speeding (15–29 mph over limit)",        amount: "200.00", points: 4, category: "safety" },
  { code: "SPEEDING_30_PLUS",     label: "Speeding (30+ mph over limit)",          amount: "200.00", points: 5, category: "safety" },
  { code: "RECKLESS_DRIVING",     label: "Reckless Driving",                       amount: "200.00", points: 5, category: "safety" },
  { code: "CARELESS_DRIVING",     label: "Careless Driving",                       amount: "85.00",  points: 2, category: "safety" },
  { code: "RED_LIGHT",            label: "Failure to Observe Traffic Signal",      amount: "85.00",  points: 2, category: "safety" },
  { code: "STOP_SIGN",            label: "Failure to Stop at Stop Sign",           amount: "85.00",  points: 2, category: "safety" },
  { code: "IMPROPER_PASSING",     label: "Improper Passing",                       amount: "85.00",  points: 4, category: "safety" },
  { code: "TAILGATING",           label: "Following Too Closely",                  amount: "85.00",  points: 5, category: "safety" },
  { code: "UNSAFE_LANE_CHANGE",   label: "Unsafe Lane Change",                     amount: "85.00",  points: 3, category: "safety" },
  { code: "FAILURE_TO_YIELD",     label: "Failure to Yield Right-of-Way",          amount: "85.00",  points: 2, category: "safety" },
  { code: "IMPROPER_TURN",        label: "Improper Turn",                          amount: "85.00",  points: 3, category: "safety" },
  { code: "DISTRACTED_DRIVING",   label: "Distracted Driving",                     amount: "200.00", points: 3, category: "safety" },
  { code: "CELL_PHONE",           label: "Handheld Device While Driving",          amount: "200.00", points: 3, category: "safety" },
  { code: "FAILURE_TO_SIGNAL",    label: "Failure to Signal",                      amount: "54.00",  points: 2, category: "equipment" },
  { code: "SEATBELT_DRIVER",      label: "Seatbelt Violation (Driver)",            amount: "46.00",  points: 0, category: "equipment" },
  { code: "SEATBELT_PASSENGER",   label: "Seatbelt Violation (Passenger)",         amount: "46.00",  points: 0, category: "equipment" },
  { code: "EXPIRED_REGISTRATION", label: "Expired Vehicle Registration",           amount: "54.00",  points: 0, category: "registration" },
  { code: "EXPIRED_INSPECTION",   label: "Expired Vehicle Inspection",             amount: "54.00",  points: 0, category: "registration" },
  { code: "NO_INSURANCE",         label: "Operating Without Insurance",            amount: "500.00", points: 0, category: "insurance" },
];

async function seedPlatformData(admin: AdminClient): Promise<void> {
  const { error } = await admin
    .from("infraction_templates")
    .upsert(INFRACTION_TEMPLATES, { onConflict: "code", ignoreDuplicates: true });

  if (error) {
    console.error("seedPlatformData: infraction_templates upsert failed", error.message);
  }
}

export type SetupResult =
  | { ok: true }
  | { ok: false; error: string };

const ALLOWED_SETUP_EMAIL = "buyananderson@gmail.com";

export async function bootstrapAdmin(formData: FormData): Promise<SetupResult> {
  const full_name = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm_password") ?? "");

  try {
    if (!full_name || !email || !password) {
      return { ok: false, error: "All fields are required." };
    }

    if (email !== ALLOWED_SETUP_EMAIL) {
      return {
        ok: false,
        error: `This setup is restricted. Only ${ALLOWED_SETUP_EMAIL} may create the first administrator account.`,
      };
    }
    if (password.length < 8) {
      return { ok: false, error: "Password must be at least 8 characters." };
    }
    if (password !== confirm) {
      return { ok: false, error: "Passwords do not match." };
    }

    const admin = createAdminClient();

    if (await adminInstallationExists(admin)) {
      return { ok: false, error: "Setup is already complete. Sign in at /login." };
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
          "An account with that email already exists. Sign in at /login or use a different email.",
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

    await seedPlatformData(admin);

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
        error: `Admin account created. Please sign in at /login. (${friendlyError(signInErr)})`,
      };
    }

    redirect("/staff");
  } catch (error) {
    console.error("bootstrapAdmin unexpected failure", { email, error });
    return {
      ok: false,
      error: "Setup failed unexpectedly. Check the server console for details and try again.",
    };
  }
}
