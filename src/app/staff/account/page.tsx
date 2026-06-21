import { requireStaffProfile } from "@/lib/auth";
import { staffRoleLabel } from "@/lib/auth/profile-session";
import { loadProfilePhotoUrl } from "@/lib/queries/profile-photo";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { ProfilePhotoEditor } from "@/components/profile/ProfilePhotoEditor";
import { VerificationStatusBadge } from "@/app/staff/DriverVerificationPanel";
import { formatDate } from "@/lib/utils";
import { getTranslations } from "@/i18n/server";
import type { AgentApplicationStatus } from "@/lib/types/database";

function applicationStatusLabel(
  status: AgentApplicationStatus | null | undefined,
  t: Awaited<ReturnType<typeof getTranslations>>["t"]
) {
  if (!status) return "—";
  const key = `staffAccount.applicationStatus.${status}` as const;
  return t(key);
}

export default async function StaffAccountPage() {
  const { profile, staffProfile } = await requireStaffProfile();
  const { t } = await getTranslations();
  const supabase = await createClient();
  const photoUrl = await loadProfilePhotoUrl(supabase, profile.id);
  const roleLabel = staffRoleLabel(staffProfile.staff_role);
  const displayName = profile.full_name?.trim() || profile.email || t("common.user");

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("staffAccount.title")}
        description={t("staffAccount.description")}
      />

      <Card>
        <CardBody>
          <ProfilePhotoEditor
            profileId={profile.id}
            photoUrl={photoUrl}
            displayName={displayName}
          />
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-stone-500 dark:text-slate-400">
                {t("staffAccount.fullName")}
              </dt>
              <dd className="mt-0.5 font-medium text-stone-900 dark:text-stone-100">
                {profile.full_name || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-stone-500 dark:text-slate-400">
                {t("staffAccount.email")}
              </dt>
              <dd className="mt-0.5 font-medium text-stone-900 dark:text-stone-100">
                {profile.email || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-stone-500 dark:text-slate-400">
                {t("staffAccount.phone")}
              </dt>
              <dd className="mt-0.5 font-medium text-stone-900 dark:text-stone-100">
                {profile.phone || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-stone-500 dark:text-slate-400">
                {t("staffAccount.role")}
              </dt>
              <dd className="mt-0.5 font-medium text-stone-900 dark:text-stone-100">
                {roleLabel}
              </dd>
            </div>
            <div>
              <dt className="text-stone-500 dark:text-slate-400">
                {t("staffAccount.badgeId")}
              </dt>
              <dd className="mt-0.5 font-medium text-stone-900 dark:text-stone-100">
                {staffProfile.badge_id || "—"}
              </dd>
            </div>
            {staffProfile.staff_role === "agent" && (
              <div>
                <dt className="text-stone-500 dark:text-slate-400">
                  {t("staffAccount.agentApplication")}
                </dt>
                <dd className="mt-0.5 font-medium text-stone-900 dark:text-stone-100">
                  {applicationStatusLabel(staffProfile.application_status, t)}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-stone-500 dark:text-slate-400">
                {t("staffAccount.verification")}
              </dt>
              <dd className="mt-1">
                <VerificationStatusBadge status={profile.verification_status} />
              </dd>
            </div>
            <div>
              <dt className="text-stone-500 dark:text-slate-400">
                {t("staffAccount.memberSince")}
              </dt>
              <dd className="mt-0.5 font-medium text-stone-900 dark:text-stone-100">
                {formatDate(profile.created_at)}
              </dd>
            </div>
            {profile.address && (
              <div className="sm:col-span-2">
                <dt className="text-stone-500 dark:text-slate-400">
                  {t("staffAccount.address")}
                </dt>
                <dd className="mt-0.5 font-medium text-stone-900 dark:text-stone-100">
                  {profile.address}
                </dd>
              </div>
            )}
          </dl>
        </CardBody>
      </Card>
    </div>
  );
}
