"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import type { UserRole } from "@/lib/types/database";

const ROLES: readonly UserRole[] = ["driver", "agent", "admin"] as const;

export type AdminActionResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Change another user's role. Admin-only. Refuses self-demotion to prevent
 * the "I locked myself out of my own dashboard" mistake — the very first
 * admin can only be removed from the database directly.
 *
 * RLS: `profiles_update_self_or_admin` already allows admins to update any
 * row, so the regular SSR client (anon key + admin session cookie) is enough
 * here — we don't need the service role.
 */
export async function updateUserRole(
  userId: string,
  role: UserRole
): Promise<AdminActionResult> {
  const me = await requireRole(["admin"]);

  if (!ROLES.includes(role)) {
    return { ok: false, error: `Unknown role: ${role}` };
  }

  if (!userId) {
    return { ok: false, error: "Missing user id." };
  }

  if (userId === me.id && role !== "admin") {
    return {
      ok: false,
      error:
        "You cannot demote yourself. Ask another administrator, or change the role directly in the database.",
    };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/drivers");
  revalidatePath("/admin/agents");
  return { ok: true };
}
