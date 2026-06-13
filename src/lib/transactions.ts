import type { PaymentStatus, TransactionStatus } from "@/lib/types/database";

export type LedgerStatus = PaymentStatus | TransactionStatus;

export function resolveLedgerStatus(
  infractionStatus: PaymentStatus,
  transactionStatus?: TransactionStatus | null
): LedgerStatus {
  if (transactionStatus) return transactionStatus;
  return infractionStatus;
}

export function infractionStatusFromLedger(
  status: LedgerStatus
): PaymentStatus {
  return status === "paid" ? "paid" : "unpaid";
}

export function ledgerStatusCounts(
  rows: Array<{ status: LedgerStatus }>
): Record<"paid" | "pending" | "unpaid", number> {
  return rows.reduce(
    (counts, row) => {
      if (row.status === "paid") counts.paid += 1;
      else if (row.status === "pending") counts.pending += 1;
      else counts.unpaid += 1;
      return counts;
    },
    { paid: 0, pending: 0, unpaid: 0 }
  );
}
