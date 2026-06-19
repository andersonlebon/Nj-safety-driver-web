"use server";

import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { registerRole } from "@/lib/auth/profiles";

export type DriverRegisterResult =
  | { ok: true }
  | { ok: false; error: string };

export async function registerAsDriver(input: {
  full_name: string;
  phone: string;
}): Promise<DriverRegisterResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "You must be signed in." };

  const full_name = input.full_name.trim();
  const phone = input.phone.trim();

  if (!full_name) {
    return { ok: false, error: "Full name is required." };
  }

  const result = await registerRole({
    userId: user.id,
    role: "driver",
    email: user.email,
    fullName: full_name,
    phone: phone || null,
    verificationStatus: "pending_documents",
  });

  if (!result.ok) return { ok: false, error: result.error };

  redirect("/onboarding");
}
