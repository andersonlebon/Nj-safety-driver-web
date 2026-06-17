"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  destinationForProfile,
  resolvePostLogin,
  type LoginPortal,
} from "@/lib/auth/profile-session";
import {
  listProfilesForUser,
  setActiveProfileCookie,
  userOwnsProfile,
} from "@/lib/auth/profiles";
import { getSessionUser } from "@/lib/auth";

export type AuthActionResult =
  | { ok: true; redirectTo: string }
  | { ok: false; error: string; suggestedLogin?: string };

export async function completeLoginAfterSignIn(options: {
  portal?: LoginPortal;
  redirectTo?: string;
}): Promise<AuthActionResult> {
  const user = await getSessionUser();
  if (!user) {
    return { ok: false, error: "Your session expired. Please sign in again." };
  }

  const profiles = await listProfilesForUser(user.id);
  const resolution = resolvePostLogin(profiles, options);

  if (resolution.kind === "forbidden") {
    const supabase = createClient();
    await supabase.auth.signOut();
    return {
      ok: false,
      error: resolution.message,
      suggestedLogin: resolution.suggestedPortal
        ? resolution.suggestedPortal === "driver"
          ? "/login"
          : `/login/${resolution.suggestedPortal}`
        : undefined,
    };
  }

  if (resolution.kind === "select") {
    const params = new URLSearchParams();
    if (options.redirectTo) params.set("redirect", options.redirectTo);
    if (resolution.portal) params.set("portal", resolution.portal);
    const qs = params.toString();
    return { ok: true, redirectTo: qs ? `/auth/select-profile?${qs}` : "/auth/select-profile" };
  }

  await setActiveProfileCookie(resolution.profile.id);
  return { ok: true, redirectTo: resolution.redirectTo };
}

export async function selectActiveProfile(formData: FormData): Promise<AuthActionResult> {
  const user = await getSessionUser();
  if (!user) {
    return { ok: false, error: "Your session expired. Please sign in again." };
  }

  const profileId = String(formData.get("profile_id") ?? "").trim();
  const redirectTo = String(formData.get("redirect") ?? "").trim();
  const portal = String(formData.get("portal") ?? "").trim() as LoginPortal | "";

  if (!profileId) {
    return { ok: false, error: "Choose a profile to continue." };
  }

  const owns = await userOwnsProfile(user.id, profileId);
  if (!owns) {
    return { ok: false, error: "That profile does not belong to your account." };
  }

  const profiles = await listProfilesForUser(user.id);
  const profile = profiles.find((row) => row.id === profileId);
  if (!profile) {
    return { ok: false, error: "Profile not found." };
  }

  if (portal && profile.role !== portal) {
    return {
      ok: false,
      error: `That profile is not valid for ${portal} access.`,
    };
  }

  await setActiveProfileCookie(profileId);
  return {
    ok: true,
    redirectTo: redirectTo || destinationForProfile(profile),
  };
}

export async function selectActiveProfileAndRedirect(formData: FormData): Promise<void> {
  const result = await selectActiveProfile(formData);
  if (!result.ok) {
    redirect(`/auth/select-profile?error=${encodeURIComponent(result.error)}`);
  }
  redirect(result.redirectTo);
}
