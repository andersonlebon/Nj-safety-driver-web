import { describe, expect, it } from "vitest";
import {
  destinationForProfile,
  profilesForPortal,
  resolvePostLogin,
  type ProfileSummary,
} from "@/lib/auth/profile-session";

const driverProfile = (overrides?: Partial<ProfileSummary>): ProfileSummary => ({
  id: "driver-1",
  role: "driver",
  full_name: "Driver One",
  email: "driver@example.com",
  onboarded_at: "2024-01-01T00:00:00.000Z",
  agent_application_status: null,
  ...overrides,
});

const agentProfile = (overrides?: Partial<ProfileSummary>): ProfileSummary => ({
  id: "agent-1",
  role: "agent",
  full_name: "Agent One",
  email: "agent@example.com",
  onboarded_at: null,
  agent_application_status: "approved",
  ...overrides,
});

const adminProfile = (overrides?: Partial<ProfileSummary>): ProfileSummary => ({
  id: "admin-1",
  role: "admin",
  full_name: "Admin One",
  email: "admin@example.com",
  onboarded_at: null,
  agent_application_status: null,
  ...overrides,
});

describe("resolvePostLogin", () => {
  it("rejects admin portal when only a driver profile exists", () => {
    const result = resolvePostLogin([driverProfile()], { portal: "admin" });
    expect(result.kind).toBe("forbidden");
    if (result.kind === "forbidden") {
      expect(result.suggestedPortal).toBe("driver");
    }
  });

  it("rejects driver portal when only an agent profile exists", () => {
    const result = resolvePostLogin([agentProfile()], { portal: "driver" });
    expect(result.kind).toBe("forbidden");
    if (result.kind === "forbidden") {
      expect(result.suggestedPortal).toBe("agent");
    }
  });

  it("auto-continues with the only matching portal profile", () => {
    const result = resolvePostLogin([driverProfile(), adminProfile()], {
      portal: "admin",
    });
    expect(result).toEqual({
      kind: "continue",
      profile: adminProfile(),
      redirectTo: "/admin",
    });
  });

  it("sends multi-profile accounts to profile selection without a portal", () => {
    const result = resolvePostLogin([driverProfile(), adminProfile()]);
    expect(result.kind).toBe("select");
    if (result.kind === "select") {
      expect(result.profiles).toHaveLength(2);
    }
  });

  it("routes new drivers to onboarding", () => {
    const result = resolvePostLogin(
      [driverProfile({ onboarded_at: null })],
      { portal: "driver" }
    );
    expect(result).toEqual({
      kind: "continue",
      profile: driverProfile({ onboarded_at: null }),
      redirectTo: "/onboarding",
    });
  });

  it("blocks pending agent applications", () => {
    const result = resolvePostLogin(
      [agentProfile({ agent_application_status: "pending" })],
      { portal: "agent" }
    );
    expect(result.kind).toBe("forbidden");
  });
});

describe("profilesForPortal", () => {
  it("filters profiles by portal role", () => {
    const profiles = [driverProfile(), agentProfile(), adminProfile()];
    expect(profilesForPortal(profiles, "agent")).toEqual([agentProfile()]);
  });
});

describe("destinationForProfile", () => {
  it("returns role home for onboarded drivers", () => {
    expect(destinationForProfile(driverProfile())).toBe("/driver");
  });
});
