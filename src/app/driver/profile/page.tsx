import { requireDriverProfile } from "@/lib/auth";
import { loadProfilePhotoUrl } from "@/lib/queries/profile-photo";
import { createClient } from "@/lib/supabase/server";
import { Card, CardBody } from "@/components/ui/Card";
import { ProfilePhotoEditor } from "@/components/profile/ProfilePhotoEditor";
import { ProfileEditDialog } from "./ProfileEditDialog";
import { DriverDocumentsSection } from "./DriverDocumentsSection";
import { DriverProfileCommentsPanel } from "./DriverProfileCommentsPanel";
import { DriverProfilePageTabs } from "./DriverProfilePageTabs";
import { formatDate } from "@/lib/utils";
import { OnboardingWizard } from "@/app/onboarding/OnboardingWizard";
import type { Profile } from "@/types";

function PersonalInfoCard({ profile }: { profile: Profile }) {
  return (
    <Card>
      <CardBody>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
          <div>
            <dt className="text-stone-500 dark:text-slate-400">Full name</dt>
            <dd className="font-medium text-stone-900 dark:text-stone-100 mt-0.5">
              {profile.full_name || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-stone-500 dark:text-slate-400">Email</dt>
            <dd className="font-medium text-stone-900 dark:text-stone-100 mt-0.5">
              {profile.email || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-stone-500 dark:text-slate-400">Phone</dt>
            <dd className="font-medium text-stone-900 dark:text-stone-100 mt-0.5">
              {profile.phone || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-stone-500 dark:text-slate-400">National ID</dt>
            <dd className="font-medium text-stone-900 dark:text-stone-100 mt-0.5">
              {profile.national_id || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-stone-500 dark:text-slate-400">Driver license</dt>
            <dd className="font-medium text-stone-900 dark:text-stone-100 mt-0.5">
              {profile.driver_license || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-stone-500 dark:text-slate-400">Member since</dt>
            <dd className="font-medium text-stone-900 dark:text-stone-100 mt-0.5">
              {formatDate(profile.created_at)}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-stone-500 dark:text-slate-400">Address</dt>
            <dd className="font-medium text-stone-900 dark:text-stone-100 mt-0.5">
              {profile.address || "—"}
            </dd>
          </div>
        </dl>
      </CardBody>
    </Card>
  );
}

export default async function DriverProfilePage() {
  const { profile } = await requireDriverProfile();
  const supabase = await createClient();
  const photoUrl = await loadProfilePhotoUrl(supabase, profile.id);
  const displayName = profile.full_name?.trim() || profile.email || "Driver";

  if (!profile.onboarded_at) {
    const initialStep: 1 | 2 | 3 =
      profile.full_name && profile.national_id ? 2 : 1;

    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-100">
            Complete your profile
          </h1>
          <p className="mt-1 text-sm text-stone-500 dark:text-slate-400">
            Add your personal details, documents, and vehicle to activate your driver account.
          </p>
        </div>
        <OnboardingWizard
          initialStep={initialStep}
          userId={profile.id}
          initialProfile={{
            full_name: profile.full_name ?? "",
            phone: profile.phone ?? "",
            national_id: profile.national_id ?? "",
            driver_license: profile.driver_license ?? "",
            address: profile.address ?? "",
            nationality_country: profile.nationality_country ?? "GA",
          }}
        />
      </div>
    );
  }

  return (
    <DriverProfilePageTabs
      personalInfo={
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-stone-900 dark:text-stone-100">
                Personal information
              </h2>
              <p className="mt-1 text-sm text-stone-500 dark:text-slate-400">
                Manage your profile, documents, and messages with staff.
              </p>
            </div>
            <div className="shrink-0">
              <ProfileEditDialog profile={profile} />
            </div>
          </div>
          <Card>
            <CardBody>
              <ProfilePhotoEditor
                profileId={profile.id}
                photoUrl={photoUrl}
                displayName={displayName}
              />
            </CardBody>
          </Card>
          <PersonalInfoCard profile={profile} />
        </div>
      }
      documents={<DriverDocumentsSection profileId={profile.id} />}
      comments={
        <DriverProfileCommentsPanel
          driverProfileId={profile.id}
          driverName={profile.full_name ?? profile.email ?? "Driver"}
        />
      }
    />
  );
}
