"use client";

import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock, XCircle } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import type { VerificationStatus } from "@/lib/types/database";
import { VERIFICATION_LABELS } from "@/lib/verification";

type Props = {
  verificationStatus: VerificationStatus;
  adminMessage: string | null;
  onboardedAt: string | null;
};

export function DriverStatusBanner({
  verificationStatus,
  adminMessage,
  onboardedAt,
}: Props) {
  if (verificationStatus === "active" && !adminMessage) {
    return null;
  }

  const completeHref = onboardedAt
    ? "/driver/profile#documents"
    : "/driver/profile";

  const completeLabel = !onboardedAt
    ? "Complete profile"
    : verificationStatus === "rejected"
      ? "Update documents"
      : "Upload documents";

  return (
    <div className="mb-6 space-y-3">
      {verificationStatus !== "active" && (
        <Alert
          variant={
            verificationStatus === "rejected"
              ? "error"
              : verificationStatus === "pending_review"
                ? "warning"
                : "warning"
          }
        >
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="flex gap-2">
              {verificationStatus === "rejected" ? (
                <XCircle className="h-5 w-5 shrink-0 mt-0.5" />
              ) : verificationStatus === "pending_review" ? (
                <Clock className="h-5 w-5 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-medium">
                  Account status: {VERIFICATION_LABELS[verificationStatus]}
                </p>
                {verificationStatus === "pending_documents" && (
                  <p className="text-sm mt-1 opacity-90">
                    Your profile is not fully active yet. Complete your personal
                    information and upload the required documents on your profile
                    page.
                  </p>
                )}
                {verificationStatus === "pending_review" && (
                  <p className="text-sm mt-1 opacity-90">
                    An administrator is reviewing your documents. You can still
                    browse your dashboard while you wait.
                  </p>
                )}
                {verificationStatus === "rejected" && (
                  <p className="text-sm mt-1 opacity-90">
                    Your account was not approved. Review the message below and
                    update your profile or documents.
                  </p>
                )}
              </div>
            </div>
            {(verificationStatus === "pending_documents" ||
              verificationStatus === "rejected") && (
              <Link
                href={completeHref}
                className="btn-secondary shrink-0 text-sm py-2 px-3 text-center"
              >
                {completeLabel}
              </Link>
            )}
          </div>
        </Alert>
      )}

      {adminMessage && (
        <Alert variant={verificationStatus === "rejected" ? "error" : "warning"}>
          <div className="flex gap-2">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Action required from administrator</p>
              <p className="text-sm mt-1 whitespace-pre-wrap">{adminMessage}</p>
            </div>
          </div>
        </Alert>
      )}

      {verificationStatus === "active" && adminMessage && (
        <Alert variant="success">
          <div className="flex gap-2">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <p className="text-sm">{adminMessage}</p>
          </div>
        </Alert>
      )}
    </div>
  );
}
