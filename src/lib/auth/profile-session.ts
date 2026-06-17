import type { UserRole } from "@/lib/types/database";

export const ACTIVE_PROFILE_COOKIE = "nj_active_profile_id";

export type LoginPortal = "driver" | "agent" | "admin";

export type ProfileSummary = {
  id: string;
  role: UserRole;
  full_name?: string | null;
  email?: string | null;
  onboarded_at: string | null;
  agent_application_status: string | null;
};

const PORTAL_LABELS: Record<LoginPortal, string> = {
  driver: "Driver",
  agent: "Agent",
  admin: "Administrator",
};

const PORTAL_LOGIN_PATHS: Record<LoginPortal, string> = {
  driver: "/login",
  agent: "/login/agent",
  admin: "/login/admin",
};

export function portalToRole(portal: LoginPortal): UserRole {
  return portal;
}

export function rolePortal(role: UserRole): LoginPortal {
  return role;
}

export function portalLabel(portal: LoginPortal): string {
  return PORTAL_LABELS[portal];
}

export function portalLoginPath(portal: LoginPortal): string {
  return PORTAL_LOGIN_PATHS[portal];
}

export function loginPathForRole(role: UserRole): string {
  return portalLoginPath(rolePortal(role));
}

/** Profiles eligible for a given login portal. */
export function profilesForPortal(
  profiles: ProfileSummary[],
  portal: LoginPortal
): ProfileSummary[] {
  const role = portalToRole(portal);
  return profiles.filter((profile) => profile.role === role);
}

export function isAgentProfileReady(profile: ProfileSummary): boolean {
  if (profile.role !== "agent") return true;
  return profile.agent_application_status === "approved";
}

export function destinationForProfile(profile: ProfileSummary): string {
  if (profile.role === "driver" && !profile.onboarded_at) {
    return "/onboarding";
  }
  return `/${profile.role}`;
}

export type LoginResolution =
  | { kind: "forbidden"; message: string; suggestedPortal?: LoginPortal }
  | { kind: "select"; profiles: ProfileSummary[]; portal?: LoginPortal }
  | { kind: "continue"; profile: ProfileSummary; redirectTo: string };

/**
 * Decide what happens after credentials are verified.
 * Portal login rejects users without a matching profile type.
 */
export function resolvePostLogin(
  profiles: ProfileSummary[],
  options?: { portal?: LoginPortal; redirectTo?: string }
): LoginResolution {
  const redirectOverride = options?.redirectTo?.trim();
  const portal = options?.portal;

  if (profiles.length === 0) {
    return {
      kind: "forbidden",
      message: "No profile is linked to this account. Contact support.",
    };
  }

  if (portal) {
    const matching = profilesForPortal(profiles, portal);
    if (matching.length === 0) {
      const available = [...new Set(profiles.map((profile) => profile.role))];
      const suggested = available[0];
      return {
        kind: "forbidden",
        message: `This account does not have ${portalLabel(portal).toLowerCase()} access. Use the ${portalLabel(suggested).toLowerCase()} sign-in instead.`,
        suggestedPortal: rolePortal(suggested),
      };
    }

    const ready = matching.filter(isAgentProfileReady);
    if (ready.length === 0) {
      return {
        kind: "forbidden",
        message: "Your agent application is still pending approval.",
      };
    }

    if (ready.length === 1) {
      const profile = ready[0];
      return {
        kind: "continue",
        profile,
        redirectTo: redirectOverride || destinationForProfile(profile),
      };
    }

    return {
      kind: "select",
      profiles: ready,
      portal,
    };
  }

  const ready = profiles.filter(isAgentProfileReady);
  if (ready.length === 0) {
    return {
      kind: "forbidden",
      message: "Your agent application is still pending approval.",
    };
  }

  if (ready.length === 1) {
    const profile = ready[0];
    return {
      kind: "continue",
      profile,
      redirectTo: redirectOverride || destinationForProfile(profile),
    };
  }

  return {
    kind: "select",
    profiles: ready,
  };
}

export function profileDisplayName(profile: ProfileSummary): string {
  return profile.full_name || profile.email || `${profile.role} profile`;
}
