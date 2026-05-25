"use client";

import { useState, useTransition } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Modal } from "@/components/ui/Modal";
import { reviewAgentApplication } from "@/app/admin/actions";
import type { Database } from "@/lib/types/database";

type Applicant = Database["public"]["Tables"]["profiles"]["Row"];

export function AgentApplicationReview({ applicants }: { applicants: Applicant[] }) {
  if (applicants.length === 0) return null;

  return (
    <div className="space-y-3">
      {applicants.map((a) => (
        <ApplicantRow key={a.id} applicant={a} />
      ))}
    </div>
  );
}

function ApplicantRow({ applicant }: { applicant: Applicant }) {
  const [pending, startTransition] = useTransition();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [message, setMessage] = useState("");

  const approve = () => {
    startTransition(async () => {
      const result = await reviewAgentApplication(applicant.id, "approve");
      if (!result.ok) alert(result.error);
      else window.location.reload();
    });
  };

  const reject = () => {
    startTransition(async () => {
      const result = await reviewAgentApplication(
        applicant.id,
        "reject",
        message
      );
      if (!result.ok) alert(result.error);
      else window.location.reload();
    });
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-stone-200 dark:border-slate-800 p-4 bg-stone-50/50 dark:bg-slate-900/40">
      <div className="min-w-0">
        <p className="font-medium text-stone-900 dark:text-stone-100">
          {applicant.full_name || applicant.email}
        </p>
        <p className="text-sm text-stone-600 dark:text-slate-400">
          {applicant.email}
          {applicant.phone ? ` · ${applicant.phone}` : ""}
        </p>
        {applicant.agent_badge_id && (
          <p className="text-xs text-stone-500 dark:text-slate-500 mt-1">
            Badge: {applicant.agent_badge_id}
          </p>
        )}
        {applicant.agent_application_note && (
          <p className="text-xs text-stone-500 dark:text-slate-400 mt-1 italic">
            {applicant.agent_application_note}
          </p>
        )}
      </div>
      <div className="flex gap-2 shrink-0">
        <Button
          type="button"
          loading={pending}
          onClick={approve}
          className="text-sm py-2 px-3"
        >
          <Check className="h-4 w-4 mr-1" />
          Approve
        </Button>
        <Button
          type="button"
          variant="danger"
          loading={pending}
          onClick={() => setRejectOpen(true)}
          className="text-sm py-2 px-3"
        >
          <X className="h-4 w-4 mr-1" />
          Reject
        </Button>
      </div>

      <Modal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title="Reject application"
        description="Optional message shown to the applicant."
      >
        <div className="space-y-4">
          <Textarea
            label="Reason (optional)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setRejectOpen(false)}
            >
              Cancel
            </Button>
            <Button type="button" variant="danger" loading={pending} onClick={reject}>
              Reject application
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
