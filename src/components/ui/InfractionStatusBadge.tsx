"use client";

import { StatusBadge } from "@/components/ui/StatusBadge";
import { useI18n } from "@/i18n/context";
import type { PaymentStatus, TransactionStatus } from "@/lib/types/database";

export type InfractionDisplayStatus = PaymentStatus | TransactionStatus;

export function InfractionStatusBadge({
  status,
}: {
  status: InfractionDisplayStatus;
}) {
  const { t } = useI18n();

  if (status === "initialized") {
    return (
      <span className="badge-pending">
        {t("status.transaction.initialized")}
      </span>
    );
  }
  return <StatusBadge status={status as PaymentStatus} />;
}
