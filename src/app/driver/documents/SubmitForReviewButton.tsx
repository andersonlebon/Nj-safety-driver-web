"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { NotificationDialog } from "@/components/ui/NotificationDialog";
import { useI18n } from "@/i18n/context";
import { submitDocumentsForReview } from "@/app/driver/actions";

export function SubmitForReviewButton() {
  const { t } = useI18n();
  const [pending, startTransition] = useTransition();
  const [notification, setNotification] = useState<string | null>(null);

  return (
    <>
      <Button
        type="button"
        loading={pending}
        onClick={() => {
          startTransition(async () => {
            const result = await submitDocumentsForReview();
            if (!result.ok) setNotification(result.error);
            else window.location.reload();
          });
        }}
      >
        {t("driver.documents.submit.button")}
      </Button>

      <NotificationDialog
        open={notification !== null}
        onClose={() => setNotification(null)}
        title={t("driver.documents.submit.dialogTitle")}
        message={notification ?? ""}
        variant="warning"
      />
    </>
  );
}
