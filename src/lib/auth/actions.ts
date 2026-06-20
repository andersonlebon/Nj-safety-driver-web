"use server";

import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import {
  setActiveProfileCookie,
  getProfilesForUser,
  getProfileWithDriver,
  getProfileWithStaff,
} from "@/lib/auth/profiles";
import { destinationForProfile } from "@/lib/auth/profile-session";

export type AuthActionResult =
  | { ok: true; redirectTo: string }
  | { ok: false; error: string };

/**
 * Called after supabase.auth.signInWithPassword() succeeds on the client.
 * Sends the user to /profile to pick their active workspace.
 */
export async function completeLoginAfterSignIn(options?: {
  redirectTo?: string;
}): Promise<AuthActionResult> {
  const user = await getSessionUser();
  if (!user) {
    return { ok: false, error: "Your session expired. Please sign in again." };
  }

  const dest = options?.redirectTo?.startsWith("/")
    ? `/profile?redirect=${encodeURIComponent(options.redirectTo)}`
    : "/profile";

  return { ok: true, redirectTo: dest };
}

/**
 * Selects an active profile by ID, sets the cookie, and returns a redirect URL.
 */
export async function selectActiveProfile(
  profileId: string,
  redirectTo?: string
): Promise<AuthActionResult> {
  const user = await getSessionUser();
  if (!user) {
    return { ok: false, error: "Your session expired. Please sign in again." };
  }

  // Verify the profile belongs to the current user
  const profiles = await getProfilesForUser(user.id);
  const profile = profiles.find((p) => p.id === profileId);
  if (!profile) {
    return { ok: false, error: "Profile not found." };
  }

  // For staff, check application_status before allowing selection
  if (profile.role === "staff") {
    const withStaff = await getProfileWithStaff(profileId);
    const sp = withStaff?.staffProfile;
    if (!sp) {
      return { ok: false, error: "Staff profile is incomplete." };
    }
    if (sp.staff_role === "agent" && sp.application_status !== "approved") {
      return { ok: false, error: "Your agent application is still pending approval." };
    }
  }

  await setActiveProfileCookie(profileId);

  const destination = destinationForProfile(profile);
  const safeDest = redirectTo?.startsWith("/") ? redirectTo : destination;

  return { ok: true, redirectTo: safeDest };
}

export async function selectActiveProfileAndRedirect(
  formData: FormData
): Promise<void> {
  const profileId = String(formData.get("profile_id") ?? "").trim();
  const redirectTo = String(formData.get("redirect") ?? "").trim();

  if (!profileId) {
    redirect("/profile?error=" + encodeURIComponent("Please select a profile."));
  }

  const result = await selectActiveProfile(profileId, redirectTo || undefined);
  if (!result.ok) {
    redirect("/profile?error=" + encodeURIComponent(result.error));
  }
  redirect(result.redirectTo);
}
