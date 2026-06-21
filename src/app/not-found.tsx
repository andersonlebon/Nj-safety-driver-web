import Link from "next/link";
import { getTranslations } from "@/i18n/server";

export default async function NotFound() {
  const { t } = await getTranslations();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <p className="text-sm font-medium text-brand-700 dark:text-brand-400">404</p>
      <h1 className="mt-2 text-2xl font-semibold text-stone-900 dark:text-stone-100">
        {t("errors.notFoundTitle")}
      </h1>
      <p className="mt-2 max-w-md text-sm text-stone-600 dark:text-slate-400">
        {t("errors.notFoundDescription")}
      </p>
      <Link href="/" className="btn-primary mt-6">
        {t("errors.goHome")}
      </Link>
    </div>
  );
}
