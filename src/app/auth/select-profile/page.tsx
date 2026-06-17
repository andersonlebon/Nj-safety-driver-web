import Link from "next/link";
import { Suspense } from "react";
import { getSessionUser, listProfilesForUser } from "@/lib/auth";
import { ProfilePicker } from "./ProfilePicker";
import { AuthDialogCard } from "@/components/ui/AuthDialogCard";
import { Alert } from "@/components/ui/Alert";
import type { LoginPortal } from "@/lib/auth/profile-session";
import { profilesForPortal } from "@/lib/auth/profile-session";

export const dynamic = "force-dynamic";

export default async function SelectProfilePage({
  searchParams,
}: {
  searchParams?: {
    redirect?: string;
    portal?: string;
    error?: string;
  };
}) {
  const user = await getSessionUser();
  if (!user) {
    return (
      <AuthDialogCard>
        <Alert variant="error">Your session expired. Please sign in again.</Alert>
        <p className="mt-4 text-sm">
          <Link href="/login" className="text-brand-700 font-medium hover:underline">
            Back to sign-in
          </Link>
        </p>
      </AuthDialogCard>
    );
  }

  const allProfiles = await listProfilesForUser(user.id);
  const portal = (searchParams?.portal as LoginPortal | undefined) ?? undefined;
  const profiles = portal ? profilesForPortal(allProfiles, portal) : allProfiles;

  return (
    <AuthDialogCard>
      <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-100">
        Choose a profile
      </h1>
      <p className="mt-1 text-sm text-stone-600 dark:text-slate-400">
        This account has more than one profile. Pick which role you want to continue with.
      </p>
      {searchParams?.error && (
        <div className="mt-4">
          <Alert variant="error">{searchParams.error}</Alert>
        </div>
      )}
      <div className="mt-6">
        <Suspense>
          <ProfilePicker
            profiles={profiles}
            redirectTo={searchParams?.redirect}
            portal={portal}
          />
        </Suspense>
      </div>
    </AuthDialogCard>
  );
}
