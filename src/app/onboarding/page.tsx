import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { requireDriverProfile } from "@/lib/auth";
import { getTranslations } from "@/i18n/server";
import { OnboardingWizard } from "./OnboardingWizard";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const { profile } = await requireDriverProfile();
  const { t } = await getTranslations();

  if (profile.onboarded_at) {
    redirect("/driver");
  }

  const initialStep: 1 | 2 | 3 =
    profile.full_name && profile.national_id ? 2 : 1;

  return (
    <div className="w-full max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="h-9 w-9 rounded-lg bg-brand-600 grid place-items-center text-white">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <span className="font-semibold text-stone-900 dark:text-stone-100">
            {t("app.legacyName")}
          </span>
        </Link>
        <form action="/signout" method="post">
          <button
            type="submit"
            className="text-sm text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-stone-100"
          >
            {t("common.signOut")}
          </button>
        </form>
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
