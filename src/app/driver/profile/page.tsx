import { requireDriverProfile } from "@/lib/auth";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { ProfileEditDialog } from "./ProfileEditDialog";
import { formatDate } from "@/lib/utils";

export default async function DriverProfilePage() {
  const { profile } = await requireDriverProfile();
  return (
    <div>
      <PageHeader
        title="Personal information"
        description="Your official profile on the national road safety platform."
        actions={<ProfileEditDialog profile={profile} />}
      />
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
    </div>
  );
}
