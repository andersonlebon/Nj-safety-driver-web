import { redirect } from "next/navigation";
import { AuthDialogCard } from "@/components/ui/AuthDialogCard";
import {
  getSessionUser,
  getProfiles,
  getDriverWorkspacesForUser,
} from "@/lib/auth";
import { setActiveProfileCookie } from "@/lib/auth/profiles";
import { destinationForProfile } from "@/lib/auth/profile-session";
import { getTranslations } from "@/i18n/server";
import { DriverRegisterForm } from "./DriverRegisterForm";

export const metadata = {
  title: "Register as driver | NJ Safety Driver",
};

export const dynamic = "force-dynamic";

function authDisplayName(user: NonNullable<Awaited<ReturnType<typeof getSessionUser>>>) {
  const meta = user.user_metadata as { full_name?: string } | undefined;
  return meta?.full_name?.trim() ?? "";
}

export default async function DriverRegisterPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?redirect=/register/driver");

  const { t } = await getTranslations();
  const driverWorkspaces = await getDriverWorkspacesForUser(user.id);
  if (driverWorkspaces.length > 0) {
    const profile = driverWorkspaces[0];
    await setActiveProfileCookie(profile.id);
    redirect(destinationForProfile(profile));
  }

  const profiles = await getProfiles();
  const accountProfile = profiles[0];
  const defaultFullName =
    accountProfile?.full_name?.trim() || authDisplayName(user);
  const defaultPhone = accountProfile?.phone ?? "";

  return (
    <AuthDialogCard>
      <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-100">
        {t("auth.driverRegister.pageTitle")}
      </h1>
      <p className="mt-1 text-sm text-stone-600 dark:text-slate-400">
        {defaultFullName
          ? t("auth.driverRegister.pageSubtitleConfirm")
          : t("auth.driverRegister.pageSubtitleNew")}
      </p>
      <div className="mt-6">
        <DriverRegisterForm
          defaultFullName={defaultFullName}
          defaultPhone={defaultPhone}
        />
      </div>
    </AuthDialogCard>
  );
}
