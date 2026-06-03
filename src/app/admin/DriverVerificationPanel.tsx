"use client";

import { useState, useTransition } from "react";
import { Check, MessageSquare, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Modal } from "@/components/ui/Modal";
import { updateDriverVerification } from "@/app/admin/actions";
import type { VerificationStatus } from "@/lib/types/database";
import { VERIFICATION_LABELS } from "@/lib/verification";

type Props = {
  userId: string;
  status: VerificationStatus;
  adminMessage: string | null;
};

export function DriverVerificationPanel({
  userId,
  status,
  adminMessage,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [messageOpen, setMessageOpen] = useState(false);
  const [message, setMessage] = useState(adminMessage ?? "");

  const run = (
    next: "active" | "rejected" | "pending_review",
    msg?: string | null
  ) => {
    startTransition(async () => {
      const result = await updateDriverVerification(userId, next, msg);
      if (!result.ok) alert(result.error);
      else window.location.reload();
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          loading={pending}
          onClick={() => run("active")}
        >
          <Check className="h-4 w-4 mr-1.5" />
          Approve driver
        </Button>
        <Button
          type="button"
          variant="danger"
          loading={pending}
          onClick={() => setMessageOpen(true)}
        >
          <X className="h-4 w-4 mr-1.5" />
          Reject / message
        </Button>
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

      <Modal
        open={messageOpen}
        onClose={() => setMessageOpen(false)}
        title="Message to driver"
        description="The driver will see this as a required action on their dashboard."
      >
        <div className="space-y-4">
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
              onClick={() => {
                run("pending_review", message);
                setMessageOpen(false);
              }}
            >
              Save message only
            </Button>
            <Button
              type="button"
              variant="danger"
              loading={pending}
              onClick={() => {
                run("rejected", message);
                setMessageOpen(false);
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
