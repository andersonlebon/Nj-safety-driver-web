"use client";

import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/context";
import { paymentStatusLabel } from "@/i18n/labels";
import type { PaymentStatus } from "@/lib/types/database";

export function StatusBadge({
  status,
  className,
}: {
  status: PaymentStatus;
  className?: string;
}) {
  const { t } = useI18n();
  const map: Record<PaymentStatus, string> = {
    paid: "badge-paid",
    unpaid: "badge-unpaid",
    pending: "badge-pending",
  };
  return (
    <span className={cn(map[status], className)}>
      {paymentStatusLabel(t, status)}
    </span>
  );
}
