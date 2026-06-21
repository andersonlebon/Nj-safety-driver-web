import Link from "next/link";
import { Suspense } from "react";
import { unstable_cache } from "next/cache";
import { ShieldCheck } from "lucide-react";
import { LoginForm } from "./LoginForm";
import { AuthDialogCard } from "@/components/ui/AuthDialogCard";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTranslations } from "@/i18n/server";

export const dynamic = "force-dynamic";

/**
 * Whether any admin exists controls the first-run setup banner. This only ever
 * flips false → true (once), so a cached value avoids a service-role DB query
 * on every login page view. A short TTL keeps the banner correct shortly after
 * initial setup.
 */
const adminExists = unstable_cache(
  async (): Promise<boolean> => {
    try {
      const admin = createAdminClient();
      const { count } = await admin
        .from("staff_profiles")
        .select("profile_id", { count: "exact", head: true })
        .eq("staff_role", "admin");
      return (count ?? 0) > 0;
    } catch {
      return true;
    }
  },
  ["login-admin-exists"],
  { revalidate: 300, tags: ["admin-exists"] }
);

export default async function LoginPage() {
  const hasAdmin = await adminExists();
  const { t } = await getTranslations();

  return (
    <AuthDialogCard>
      {!hasAdmin && (
        <Link
          href="/setup"
          className="mb-6 flex items-start gap-3 rounded-xl border border-brand-200 dark:border-brand-900/40 bg-brand-50/60 dark:bg-brand-950/30 p-3 hover:bg-brand-50 dark:hover:bg-brand-950/50 transition-colors"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand-600 text-white">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <span className="text-sm">
            <span className="block font-medium text-brand-900 dark:text-brand-200">
              {t("auth.firstTimeSetup")}
            </span>
            <span className="text-brand-800/80 dark:text-brand-300/80">
              {t("auth.bootstrapHint")}
            </span>
          </span>
        </Link>
      )}
      <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-100">
        Sign in
      </h1>
      <p className="mt-1 text-sm text-stone-600 dark:text-slate-400">
        {t("auth.signInHint")}
      </p>
      <div className="mt-6">
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
      <p className="mt-6 text-sm text-stone-600 dark:text-slate-400">
        {t("auth.noAccount")}{" "}
        <Link
          href="/register"
          className="text-brand-700 dark:text-brand-300 font-medium hover:underline"
        >
          {t("auth.createAccount")}
        </Link>
      </p>
    </AuthDialogCard>
  );
}
