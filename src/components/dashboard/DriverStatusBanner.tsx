"use client";

import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock, XCircle } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { useI18n } from "@/i18n/context";
import { verificationStatusLabel } from "@/i18n/labels";
import type { VerificationStatus } from "@/lib/types/database";

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
  const { t } = useI18n();

  if (verificationStatus === "active" && !adminMessage) {
    return null;
  }

  const documentsHref = onboardedAt ? "/driver/profile#files" : "/driver/profile";

  const completeLabel = !onboardedAt
    ? t("driver.shell.banner.ctaCompleteProfile")
    : verificationStatus === "rejected"
      ? t("driver.shell.banner.ctaUpdateDocuments")
      : t("driver.shell.banner.ctaUploadDocuments");

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
                  {t("driver.shell.banner.accountStatus", {
                    status: verificationStatusLabel(t, verificationStatus),
                  })}
                </p>
                {verificationStatus === "pending_documents" && (
                  <p className="text-sm mt-1 opacity-90">
                    {t("driver.shell.banner.pendingDocumentsBody")}
                  </p>
                )}
                {verificationStatus === "pending_review" && (
                  <p className="text-sm mt-1 opacity-90">
                    {t("driver.shell.banner.pendingReviewBody")}
                  </p>
                )}
                {verificationStatus === "rejected" && (
                  <p className="text-sm mt-1 opacity-90">
                    {t("driver.shell.banner.rejectedBody")}
                  </p>
                )}
              </div>
            </div>
            {(verificationStatus === "pending_documents" ||
              verificationStatus === "rejected") && (
              <Link
                href={documentsHref}
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
              <p className="font-medium">
                {t("driver.shell.banner.adminMessageTitle")}
              </p>
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
