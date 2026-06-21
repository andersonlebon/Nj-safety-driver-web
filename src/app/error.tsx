"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/i18n/context";
import {
  isRecoverableClientError,
  reloadOnceForChunkError,
} from "@/lib/chunk-load-error";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useI18n();
  const recoverable = isRecoverableClientError(error);

  useEffect(() => {
    if (recoverable) reloadOnceForChunkError();
  }, [recoverable]);

  const handleRetry = () => {
    if (recoverable) window.location.reload();
    else reset();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-100">
        {t("errors.somethingWentWrong")}
      </h1>
      <p className="mt-2 max-w-md text-sm text-stone-600 dark:text-slate-400">
        {recoverable
          ? t("errors.connectionIssue")
          : error.message || t("errors.unexpected")}
      </p>
      <div className="mt-6">
        <Button onClick={handleRetry}>
          {recoverable ? t("errors.reloadNow") : t("errors.tryAgain")}
        </Button>
      </div>
    </div>
  );
}
