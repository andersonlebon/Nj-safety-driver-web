"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { friendlyError } from "@/lib/errors";

export type AgentRegisterResult =
  | { ok: true; needsEmailConfirmation?: boolean }
  | { ok: false; error: string };

export async function submitAgentApplication(input: {
  full_name: string;
  email: string;
  password: string;
  phone: string;
  agent_badge_id: string;
  note: string;
}): Promise<AgentRegisterResult> {
  const supabase = createClient();

  const full_name = input.full_name.trim();
  const email = input.email.trim();
  const phone = input.phone.trim();
  const agent_badge_id = input.agent_badge_id.trim();
  const note = input.note.trim();

  if (!full_name || !email || !phone) {
    return { ok: false, error: "Full name, email, and phone are required." };
  }
  if (input.password.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters." };
  }

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password: input.password,
    options: {
      data: { full_name },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/login`,
    },
  });

  if (signUpError) {
    return { ok: false, error: friendlyError(signUpError) };
  }

  const userId = signUpData.user?.id;
  if (!userId) {
    return { ok: false, error: "Account could not be created. Please try again." };
  }

  if (!signUpData.session) {
    const admin = createAdminClient();
    const { error: profileError } = await admin
      .from("profiles")
      .update({
        full_name,
        email,
        phone,
        agent_badge_id: agent_badge_id || null,
        agent_application_note: note || null,
        agent_application_status: "pending",
      })
      .eq("id", userId);

    if (profileError) {
      return { ok: false, error: friendlyError(profileError) };
    }

    revalidatePath("/admin/agents");
    return { ok: true, needsEmailConfirmation: true };
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      full_name,
      email,
      phone,
      agent_badge_id: agent_badge_id || null,
      agent_application_note: note || null,
      agent_application_status: "pending",
    })
    .eq("id", userId);

  if (profileError) {
    return { ok: false, error: friendlyError(profileError) };
  }

  revalidatePath("/admin/agents");
  redirect("/register/agent/pending");
}
