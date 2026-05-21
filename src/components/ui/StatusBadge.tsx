import { cn } from "@/lib/utils";
import type { PaymentStatus } from "@/lib/types/database";

export function StatusBadge({
  status,
  className,
}: {
  status: PaymentStatus;
  className?: string;
}) {
  const map: Record<PaymentStatus, string> = {
    paid: "badge-paid",
    unpaid: "badge-unpaid",
    pending: "badge-pending",
  };
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return <span className={cn(map[status], className)}>{label}</span>;
}
