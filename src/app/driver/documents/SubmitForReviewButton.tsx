"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { NotificationDialog } from "@/components/ui/NotificationDialog";
import { submitDocumentsForReview } from "@/app/driver/actions";

export function SubmitForReviewButton() {
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
        Submit all documents for verification
      </Button>

      <NotificationDialog
        open={notification !== null}
        onClose={() => setNotification(null)}
        title="Cannot submit yet"
        message={notification ?? ""}
        variant="warning"
      />
    </>
  );
}
