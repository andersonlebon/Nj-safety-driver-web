"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { registerStaffProfile } from "@/lib/auth/profiles";
import { friendlyError } from "@/lib/errors";

export type AgentRegisterResult =
  | { ok: true }
  | { ok: false; error: string };

export async function submitAgentApplication(input: {
  full_name: string;
  phone: string;
  agent_badge_id: string;
  note: string;
}): Promise<AgentRegisterResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: "You must be signed in to apply." };

  const full_name = input.full_name.trim();
  const phone = input.phone.trim();
  const agent_badge_id = input.agent_badge_id.trim();
  const note = input.note.trim();

  if (!full_name || !phone) {
    return { ok: false, error: "Full name and phone are required." };
  }

  const result = await registerStaffProfile({
    userId: user.id,
    email: user.email,
    fullName: full_name,
    phone,
    staffRole: "agent",
    badgeId: agent_badge_id || null,
    applicationNote: note || null,
    applicationStatus: "pending",
  });

  if (!result.ok) return { ok: false, error: friendlyError(result.error) };

  revalidatePath("/staff/agents");
  redirect("/register/agent/pending");
}
