import Link from "next/link";
import { RegisterForm } from "./RegisterForm";
import { AuthDialogCard } from "@/components/ui/AuthDialogCard";
import { getTranslations } from "@/i18n/server";

export async function generateMetadata() {
  const { t } = await getTranslations();
  return {
    title: `${t("auth.registerTitle")} | ${t("app.legacyName")}`,
  };
}

export default async function RegisterPage() {
  const { t } = await getTranslations();

  return (
    <AuthDialogCard>
      <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-100">
        {t("auth.registerTitle")}
      </h1>
      <p className="mt-1 text-sm text-stone-600 dark:text-slate-400">
        {t("auth.registerHint")}
      </p>
      <div className="mt-6">
        <RegisterForm />
      </div>
      <p className="mt-6 text-sm text-stone-600 dark:text-slate-400">
        {t("auth.alreadyHaveAccount")}{" "}
        <Link
          href="/login"
          className="text-brand-700 dark:text-brand-300 font-medium hover:underline"
        >
          {t("auth.signIn")}
        </Link>
      </p>
      <p className="mt-3 text-sm text-stone-600 dark:text-slate-400">
        {t("auth.fieldAgent")}{" "}
        <Link
          href="/register/agent"
          className="text-brand-700 dark:text-brand-300 font-medium hover:underline"
        >
          {t("auth.applyAsAgent")}
        </Link>
      </p>
    </AuthDialogCard>
  );
}
