import { cache } from "react";
import { getSessionUser } from "@/lib/auth";
import { getDriverWorkspacesForUser } from "@/lib/auth/profiles";

export type ProfileSwitcherMode = "switch" | "add-driver";

/** Whether the user menu should offer profile switching or adding a driver profile. */
export const getProfileSwitcherMode = cache(
  async (): Promise<ProfileSwitcherMode | null> => {
    const user = await getSessionUser();
    if (!user) return null;

    const driverWorkspaces = await getDriverWorkspacesForUser(user.id);
    return driverWorkspaces.length > 0 ? "switch" : "add-driver";
  }
);
