import { getTranslations } from "@/i18n/server";

export default async function Loading() {
  const { t } = await getTranslations();

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div
        className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent"
        aria-label={t("common.loadingPage")}
      />
    </div>
  );
}
