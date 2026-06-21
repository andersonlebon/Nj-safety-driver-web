"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, MessageSquare, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Modal } from "@/components/ui/Modal";
import { Alert } from "@/components/ui/Alert";
import { updateDriverVerification } from "@/app/staff/actions";
import type { VerificationStatus } from "@/lib/types/database";
import { VERIFICATION_LABELS } from "@/lib/verification";

type Props = {
  userId: string;
  status: VerificationStatus;
  adminMessage: string | null;
  /** Hide approve — use when approve is shown elsewhere (e.g. modal footer). */
  hideApprove?: boolean;
  /** Hide reject — use when reject is shown elsewhere (e.g. modal footer). */
  hideReject?: boolean;
  /** Inline button row without extra wrapper spacing. */
  compact?: boolean;
};

export function DriverVerificationPanel({
  userId,
  status,
  adminMessage,
  hideApprove = false,
  hideReject = false,
  compact = false,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [messageOpen, setMessageOpen] = useState(false);
  const [message, setMessage] = useState(adminMessage ?? "");
  const [feedback, setFeedback] = useState<{
    variant: "success" | "error";
    message: string;
  } | null>(null);

  const run = (
    next: "active" | "rejected" | "pending_review",
    msg?: string | null,
    successMessage = "Driver verification updated."
  ) => {
    setFeedback(null);
    startTransition(async () => {
      const result = await updateDriverVerification(userId, next, msg);
      if (!result.ok) {
        setFeedback({ variant: "error", message: result.error });
        return;
      }
      setFeedback({ variant: "success", message: successMessage });
      setMessageOpen(false);
      router.refresh();
    });
  };

  return (
    <div className={compact ? "contents" : "flex flex-col gap-3"}>
      <div className="flex flex-wrap gap-2">
        {!hideApprove && (
          <Button
            type="button"
            loading={pending}
            onClick={() => run("active")}
          >
            <Check className="h-4 w-4 mr-1.5" />
            Approve driver
          </Button>
        )}
        {!hideReject && (
          <Button
            type="button"
            variant="danger"
            loading={pending}
            onClick={() => setMessageOpen(true)}
          >
            <X className="h-4 w-4 mr-1.5" />
            Reject / message
          </Button>
        )}
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            setMessage(adminMessage ?? "");
            setMessageOpen(true);
          }}
        >
          <MessageSquare className="h-4 w-4 mr-1.5" />
          Send message
        </Button>
      </div>
      {feedback && !compact && (
        <Alert variant={feedback.variant}>{feedback.message}</Alert>
      )}

      <Modal
        open={messageOpen}
        onClose={() => setMessageOpen(false)}
        title="Message to driver"
        description="The driver will see this as a required action on their dashboard."
      >
        <div className="space-y-4">
          {feedback && <Alert variant={feedback.variant}>{feedback.message}</Alert>}
          <Textarea
            label="Instructions"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            placeholder="Example: Please renew your driver's license — the photo is blurry."
          />
          <div className="flex flex-wrap gap-2 justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setMessageOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="secondary"
              loading={pending}
              disabled={!message.trim()}
              onClick={() => {
                run("pending_review", message, "Message sent to driver.");
              }}
            >
              Send message
            </Button>
            <Button
              type="button"
              variant="danger"
              loading={pending}
              disabled={!message.trim()}
              onClick={() => {
                run("rejected", message, "Driver rejected and message sent.");
              }}
            >
              Reject account
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export function VerificationStatusBadge({
  status,
}: {
  status: VerificationStatus;
}) {
  const cls =
    status === "active"
      ? "badge-paid"
      : status === "rejected"
        ? "badge-unpaid"
        : status === "pending_review"
          ? "badge-pending"
          : "badge-pending";
  return <span className={cls}>{VERIFICATION_LABELS[status]}</span>;
}
