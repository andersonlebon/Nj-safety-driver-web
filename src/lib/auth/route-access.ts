import type { ProfileSummary } from "@/lib/auth/profile-session";

export type RouteProfile = Pick<
  ProfileSummary,
  "id" | "role" | "onboarded_at" | "agent_application_status"
>;

export type RouteProfileResolution =
  | { kind: "none" }
  | { kind: "select" }
  | { kind: "active"; profile: RouteProfile; shouldSetCookie: boolean };

export function resolveRouteProfile(
  profiles: RouteProfile[],
  activeProfileId?: string | null
): RouteProfileResolution {
  if (profiles.length === 0) {
    return { kind: "none" };
  }

  if (activeProfileId) {
    const active = profiles.find((profile) => profile.id === activeProfileId);
    if (active) {
      return { kind: "active", profile: active, shouldSetCookie: false };
    }
  }

  if (profiles.length === 1) {
    return { kind: "active", profile: profiles[0], shouldSetCookie: true };
  }

  return { kind: "select" };
}
