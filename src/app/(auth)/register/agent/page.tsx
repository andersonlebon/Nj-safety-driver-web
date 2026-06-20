import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AuthDialogCard } from "@/components/ui/AuthDialogCard";
import { getSessionUser, getProfiles } from "@/lib/auth";
import { AgentRegisterForm } from "./AgentRegisterForm";

export const metadata = {
  title: "Apply as agent | NJ Safety Driver",
};

export const dynamic = "force-dynamic";

export default async function AgentRegisterPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?redirect=/register/agent");

  const profiles = await getProfiles();
  const staffProfile = profiles.find((p) => p.role === "staff");

  if (staffProfile) {
    const supabase = createClient();
    const { data: sp } = await supabase
      .from("staff_profiles")
      .select("application_status")
      .eq("profile_id", staffProfile.id)
      .single();

    if (sp?.application_status === "pending") redirect("/register/agent/pending");
    redirect("/profile");
  }

  const anyProfile = profiles[0];

  return (
    <AuthDialogCard className="max-w-lg">
      <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-100">
        Apply as a field agent
      </h1>
      <p className="mt-1 text-sm text-stone-600 dark:text-slate-400">
        Submit an application to become a traffic enforcement agent. An
        administrator will review and approve access.
      </p>
      <div className="mt-6">
        <AgentRegisterForm
          defaultFullName={anyProfile?.full_name ?? ""}
          defaultPhone={anyProfile?.phone ?? ""}
        />
      </div>
    </AuthDialogCard>
  );
}
