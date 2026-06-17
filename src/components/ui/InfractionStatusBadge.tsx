import { StatusBadge } from "@/components/ui/StatusBadge";
import type { PaymentStatus, TransactionStatus } from "@/lib/types/database";

export type InfractionDisplayStatus = PaymentStatus | TransactionStatus;

export function InfractionStatusBadge({
  status,
}: {
  status: InfractionDisplayStatus;
}) {
  if (status === "initialized") {
    return <span className="badge-pending">Initialized</span>;
  }
  return <StatusBadge status={status as PaymentStatus} />;
}
