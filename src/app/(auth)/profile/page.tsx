import { redirect } from "next/navigation";
import Link from "next/link";
import { Car, Shield } from "lucide-react";
import { getSessionUser, getProfiles, getActiveProfileId, getDriverWorkspacesForUser } from "@/lib/auth";
import { getProfileWithStaff } from "@/lib/auth/profiles";
import { AuthDialogCard } from "@/components/ui/AuthDialogCard";
import { ProfileCard, PendingStaffCard } from "./RoleCard";

export const dynamic = "force-dynamic";

function RegisterDriverCard() {
  return (
    <Link
      href="/register/driver"
      className="flex items-center gap-3 rounded-xl border border-stone-200 dark:border-stone-700 p-4 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300">
        <Car className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="font-medium text-stone-900 dark:text-stone-100">
          Register as Driver
        </p>
        <p className="text-sm text-stone-500 dark:text-slate-400">
          Manage your vehicle, documents, and infractions
        </p>
      </div>
    </Link>
  );
}

function RegisterStaffCard() {
  return (
    <Link
      href="/register/agent"
      className="flex items-center gap-3 rounded-xl border border-stone-200 dark:border-stone-700 p-4 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300">
        <Shield className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="font-medium text-stone-900 dark:text-stone-100">
          Apply as Field Agent
        </p>
        <p className="text-sm text-stone-500 dark:text-slate-400">
          Issue infractions and manage driver compliance
        </p>
      </div>
    </Link>
  );
}

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: { error?: string; redirect?: string };
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const profiles = await getProfiles();
  const driverWorkspaces = await getDriverWorkspacesForUser(user.id);
  const activeProfileId = await getActiveProfileId();
  const redirectTo = searchParams.redirect?.startsWith("/")
    ? searchParams.redirect
    : undefined;

  const staffProfiles = profiles.filter((p) => p.role === "staff");

  // Load staff sub-rows to know agent vs admin and application_status
  const staffWithSub = await Promise.all(
    staffProfiles.map((p) => getProfileWithStaff(p.id))
  );

  const displayName = profiles[0]?.full_name || profiles[0]?.email || user.email;

  const hasDriverProfile = driverWorkspaces.length > 0;
  const hasStaffProfile = staffProfiles.length > 0;
  const selectableCount =
    driverWorkspaces.length +
    staffWithSub.filter(
      (p) =>
        p?.staffProfile &&
        (p.staffProfile.staff_role === "admin" ||
          p.staffProfile.application_status === "approved")
    ).length;

  return (
    <AuthDialogCard>
      <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-100">
        {selectableCount > 1 ? "Choose how to continue" : "Your account"}
      </h1>
      <p className="mt-1 text-sm text-stone-500 dark:text-slate-400">
        Signed in as {displayName}
      </p>

      {searchParams.error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {searchParams.error}
        </div>
      )}

      <div className="mt-6 space-y-3">
        {/* Driver profiles */}
        {driverWorkspaces.map((p) => (
          <ProfileCard
            key={p.id}
            profileId={p.id}
            role="driver"
            redirectTo={redirectTo}
            isActive={activeProfileId === p.id}
          />
        ))}
        {!hasDriverProfile && <RegisterDriverCard />}

        {/* Staff profiles */}
        {staffWithSub.map((p) => {
          if (!p) return null;
          const sp = p.staffProfile;
          if (!sp) return null;
          const isPending =
            sp.staff_role === "agent" && sp.application_status === "pending";
          const isRejected =
            sp.staff_role === "agent" && sp.application_status === "rejected";

          if (isPending) return <PendingStaffCard key={p.id} />;
          if (isRejected) return null; // Don't show rejected applications

          return (
            <ProfileCard
              key={p.id}
              profileId={p.id}
              role="staff"
              staffRole={sp.staff_role}
              redirectTo={redirectTo}
              isActive={activeProfileId === p.id}
            />
          );
        })}
        {!hasStaffProfile && <RegisterStaffCard />}
      </div>

      <form
        action="/signout"
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
