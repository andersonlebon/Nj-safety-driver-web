import { describe, expect, it } from "vitest";
import { resolveRouteProfile, type RouteProfile } from "@/lib/auth/route-access";

const driverProfile = (overrides?: Partial<RouteProfile>): RouteProfile => ({
  id: "driver-1",
  role: "driver",
  onboarded_at: "2024-01-01T00:00:00.000Z",
  agent_application_status: null,
  ...overrides,
});

const adminProfile = (overrides?: Partial<RouteProfile>): RouteProfile => ({
  id: "admin-1",
  role: "admin",
  onboarded_at: null,
  agent_application_status: null,
  ...overrides,
});

describe("resolveRouteProfile", () => {
  it("returns none when no profiles exist", () => {
    expect(resolveRouteProfile([], null)).toEqual({ kind: "none" });
  });

  it("uses the active profile cookie when it matches", () => {
    expect(resolveRouteProfile([driverProfile(), adminProfile()], "admin-1")).toEqual({
      kind: "active",
      profile: adminProfile(),
      shouldSetCookie: false,
    });
  });

  it("repairs the cookie when there is only one profile", () => {
    expect(resolveRouteProfile([driverProfile()], null)).toEqual({
      kind: "active",
      profile: driverProfile(),
      shouldSetCookie: true,
    });
  });

  it("requires profile selection when multiple profiles exist and the cookie is missing", () => {
    expect(resolveRouteProfile([driverProfile(), adminProfile()], null)).toEqual({
      kind: "select",
    });
  });

  it("requires profile selection when the cookie points to a stale profile", () => {
    expect(resolveRouteProfile([driverProfile(), adminProfile()], "missing")).toEqual({
      kind: "select",
    });
  });
});
