import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { createAdminClient } from "@/lib/supabase/admin";
import { getProfiles } from "@/lib/auth";
import { adminInstallationExists } from "@/lib/auth/bootstrap-admin";
import { getTranslations } from "@/i18n/server";
import { SetupForm } from "./SetupForm";

export const dynamic = "force-dynamic";

const ALLOWED_SETUP_EMAIL = "buyananderson@gmail.com";

export default async function SetupPage() {
  const profiles = await getProfiles();
  if (profiles.some((p) => p.role === "staff")) {
    redirect("/staff");
  }

  const { t } = await getTranslations();
  const admin = createAdminClient();
  const locked = await adminInstallationExists(admin);

  return (
    <div className="w-full max-w-md">
      <div className="flex items-center justify-center mb-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="h-9 w-9 rounded-lg bg-brand-600 grid place-items-center text-white">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <span className="font-semibold text-stone-900 dark:text-stone-100">
            {t("setup.brandName")}
          </span>
        </Link>
      </div>

      <Card>
        <CardBody>
          {locked ? (
            <div className="text-center py-2">
              <div className="mx-auto h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-950/40 grid place-items-center text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h1 className="mt-4 text-xl font-semibold text-stone-900 dark:text-stone-100">
                {t("setup.lockedTitle")}
              </h1>
              <p className="mt-2 text-sm text-stone-600 dark:text-slate-400">
                {t("setup.lockedDescription")}
              </p>
              <div className="mt-6">
                <Link
                  href="/login"
                  className="btn-primary w-full inline-flex justify-center"
                >
                  {t("setup.goToSignIn")}
                </Link>
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-100">
                {t("setup.title")}
              </h1>
              <p className="mt-1 text-sm text-stone-600 dark:text-slate-400">
                {t("setup.description")}
              </p>
              <p className="mt-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
                {t("setup.authorizedEmailHint", { email: ALLOWED_SETUP_EMAIL })}
              </p>
              <div className="mt-6">
                <SetupForm />
              </div>
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
