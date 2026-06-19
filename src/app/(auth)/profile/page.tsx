import { redirect } from "next/navigation";
import Link from "next/link";
import { Car, Shield, Clock } from "lucide-react";
import { getSessionUser, getProfile } from "@/lib/auth";
import { availableRoles } from "@/lib/auth/profile-session";
import { RoleCard } from "./RoleCard";
import { AuthDialogCard } from "@/components/ui/AuthDialogCard";
import type { UserRole } from "@/lib/types/database";

export const dynamic = "force-dynamic";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: { error?: string; redirect?: string };
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const profile = await getProfile();
  const profileTypes: UserRole[] = (profile?.profile_types as UserRole[]) ?? [];

  const roles = profile
    ? availableRoles({
        id: profile.id,
        profile_types: profileTypes,
        full_name: profile.full_name,
        email: profile.email,
        onboarded_at: profile.onboarded_at,
        agent_application_status: profile.agent_application_status,
      })
    : [];

  const hasDriver = profileTypes.includes("driver");
  const hasAgent = profileTypes.includes("agent");
  const agentPending = hasAgent && profile?.agent_application_status !== "approved";

  const redirectTo = searchParams.redirect?.startsWith("/") ? searchParams.redirect : undefined;

  return (
    <AuthDialogCard>
      <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-100">
        {roles.length > 1 ? "Choose how to continue" : "Your account"}
      </h1>
      <p className="mt-1 text-sm text-stone-500 dark:text-slate-400">
        {profile?.full_name
          ? `Signed in as ${profile.full_name}`
          : user.email}
      </p>

      {searchParams.error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {searchParams.error}
        </div>
      )}

      <div className="mt-6 space-y-3">
        {/* Active role cards */}
        {roles.map((role) => (
          <RoleCard
            key={role}
            role={role}
            profile={profile!}
            redirectTo={redirectTo}
          />
        ))}

        {/* Pending agent status */}
        {agentPending && (
          <div className="flex items-center gap-3 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
              <Clock className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="font-medium text-stone-900 dark:text-stone-100">Field Agent</p>
              <p className="text-sm text-amber-700 dark:text-amber-400">
                Application pending administrator approval
              </p>
            </div>
          </div>
        )}

        {/* Add driver option */}
        {!hasDriver && (
          <Link
            href="/register/driver"
            className="flex items-center gap-3 rounded-xl border border-stone-200 dark:border-stone-700 p-4 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300">
              <Car className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="font-medium text-stone-900 dark:text-stone-100">Register as Driver</p>
              <p className="text-sm text-stone-500 dark:text-slate-400">
                Manage your vehicle, documents, and infractions
              </p>
            </div>
          </Link>
        )}

        {/* Add agent option */}
        {!hasAgent && (
          <Link
            href="/register/agent"
            className="flex items-center gap-3 rounded-xl border border-stone-200 dark:border-stone-700 p-4 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300">
              <Shield className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="font-medium text-stone-900 dark:text-stone-100">Apply as Field Agent</p>
              <p className="text-sm text-stone-500 dark:text-slate-400">
                Issue infractions and manage driver compliance
              </p>
            </div>
          </Link>
        )}
      </div>

      <form
        action="/auth/signout"
        method="POST"
        className="mt-6 border-t border-stone-100 dark:border-stone-800 pt-4"
      >
        <button
          type="submit"
          className="text-sm text-stone-500 dark:text-slate-400 hover:text-stone-700 dark:hover:text-slate-200"
        >
          Sign out
        </button>
      </form>
    </AuthDialogCard>
  );
}
