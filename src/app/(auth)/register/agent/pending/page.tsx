import Link from "next/link";
import { redirect } from "next/navigation";
import { Clock } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { getSessionUser, getProfiles } from "@/lib/auth";
import { getProfileWithStaff } from "@/lib/auth/profiles";
import { getTranslations } from "@/i18n/server";

export const metadata = {
  title: "Application pending | NJ Safety Driver",
};

export default async function AgentPendingPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login?redirect=/register/agent/pending");
  }

  const { t } = await getTranslations();
  const profiles = await getProfiles();
  const staffProfiles = profiles.filter((p) => p.role === "staff");

  for (const sp of staffProfiles) {
    const withSub = await getProfileWithStaff(sp.id);
    const sub = withSub?.staffProfile;
    if (!sub) continue;
    if (sub.staff_role === "admin" || sub.application_status === "approved") {
      redirect("/staff");
    }
  }

  const pendingProfile = staffProfiles[0]
    ? await getProfileWithStaff(staffProfiles[0].id)
    : null;
  const sub = pendingProfile?.staffProfile;

  if (!sub) redirect("/register/agent");

  if (sub.application_status === "rejected") {
    return (
      <Card>
        <CardBody className="text-center space-y-4">
          <Alert variant="error">
            {t("auth.agentRegister.rejectedTitle")}
            {pendingProfile?.admin_message && (
              <span className="block mt-2">{pendingProfile.admin_message}</span>
            )}
          </Alert>
          <Link href="/" className="btn-secondary inline-block">
            {t("auth.agentRegister.backToHome")}
          </Link>
        </CardBody>
      </Card>
    );
  }

  if (sub.application_status !== "pending") {
    redirect("/register/agent");
  }

  return (
    <Card>
      <CardBody className="text-center space-y-4 py-8">
        <div className="mx-auto h-14 w-14 rounded-full bg-brand-100 dark:bg-brand-950 grid place-items-center text-brand-700 dark:text-brand-300">
          <Clock className="h-7 w-7" />
        </div>
        <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-100">
          {t("auth.agentRegister.pendingTitle")}
        </h1>
        <p className="text-sm text-stone-600 dark:text-slate-400 max-w-md mx-auto">
          {t("auth.agentRegister.pendingDescription")}
        </p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
          <form action="/signout" method="POST">
            <Button type="submit" variant="secondary">
              {t("auth.agentRegister.signOut")}
            </Button>
          </form>
          <Link href="/">
            <Button type="button" variant="secondary">
              {t("auth.agentRegister.backToHome")}
            </Button>
          </Link>
        </div>
      </CardBody>
    </Card>
  );
}
