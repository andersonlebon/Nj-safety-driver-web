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
import { getTranslations } from "@/i18n/server";
import type { Translator } from "@/i18n/translate";
import { OnboardingWizard } from "@/app/onboarding/OnboardingWizard";
import type { Profile } from "@/types";

function PersonalInfoCard({
  profile,
  t,
}: {
  profile: Profile;
  t: Translator;
}) {
  const empty = t("driver.profile.personal.emptyValue");

  return (
    <Card>
      <CardBody>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
          <div>
            <dt className="text-stone-500 dark:text-slate-400">
              {t("driver.profile.personal.fullName")}
            </dt>
            <dd className="font-medium text-stone-900 dark:text-stone-100 mt-0.5">
              {profile.full_name || empty}
            </dd>
          </div>
          <div>
            <dt className="text-stone-500 dark:text-slate-400">
              {t("driver.profile.personal.email")}
            </dt>
            <dd className="font-medium text-stone-900 dark:text-stone-100 mt-0.5">
              {profile.email || empty}
            </dd>
          </div>
          <div>
            <dt className="text-stone-500 dark:text-slate-400">
              {t("driver.profile.personal.phone")}
            </dt>
            <dd className="font-medium text-stone-900 dark:text-stone-100 mt-0.5">
              {profile.phone || empty}
            </dd>
          </div>
          <div>
            <dt className="text-stone-500 dark:text-slate-400">
              {t("driver.profile.personal.nationalId")}
            </dt>
            <dd className="font-medium text-stone-900 dark:text-stone-100 mt-0.5">
              {profile.national_id || empty}
            </dd>
          </div>
          <div>
            <dt className="text-stone-500 dark:text-slate-400">
              {t("driver.profile.personal.driverLicense")}
            </dt>
            <dd className="font-medium text-stone-900 dark:text-stone-100 mt-0.5">
              {profile.driver_license || empty}
            </dd>
          </div>
          <div>
            <dt className="text-stone-500 dark:text-slate-400">
              {t("driver.profile.personal.memberSince")}
            </dt>
            <dd className="font-medium text-stone-900 dark:text-stone-100 mt-0.5">
              {formatDate(profile.created_at)}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-stone-500 dark:text-slate-400">
              {t("driver.profile.personal.address")}
            </dt>
            <dd className="font-medium text-stone-900 dark:text-stone-100 mt-0.5">
              {profile.address || empty}
            </dd>
          </div>
        </dl>
      </CardBody>
    </Card>
  );
}

export default async function DriverProfilePage() {
  const { profile } = await requireDriverProfile();
  const { t } = await getTranslations();
  const supabase = await createClient();
  const photoUrl = await loadProfilePhotoUrl(supabase, profile.id);
  const displayName =
    profile.full_name?.trim() ||
    profile.email ||
    t("driver.profile.personal.fallbackName");

  if (!profile.onboarded_at) {
    const initialStep: 1 | 2 | 3 =
      profile.full_name && profile.national_id ? 2 : 1;

    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-100">
            {t("driver.profile.onboarding.title")}
          </h1>
          <p className="mt-1 text-sm text-stone-500 dark:text-slate-400">
            {t("driver.profile.onboarding.description")}
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
                {t("driver.profile.personal.title")}
              </h2>
              <p className="mt-1 text-sm text-stone-500 dark:text-slate-400">
                {t("driver.profile.personal.description")}
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
          <PersonalInfoCard profile={profile} t={t} />
        </div>
      }
      documents={<DriverDocumentsSection profileId={profile.id} />}
      comments={
        <DriverProfileCommentsPanel
          driverProfileId={profile.id}
          driverName={profile.full_name ?? profile.email ?? t("driver.profile.personal.fallbackName")}
        />
      }
    />
  );
}
