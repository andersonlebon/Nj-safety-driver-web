"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { submitDocumentsForReview } from "@/app/driver/actions";

export function SubmitForReviewButton() {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      loading={pending}
      onClick={() => {
        startTransition(async () => {
          const result = await submitDocumentsForReview();
          if (!result.ok) alert(result.error);
          else window.location.reload();
        });
      }}
    >
      Submit all documents for verification
    </Button>
  );
}
