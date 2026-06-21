import type {
  PaymentStatus,
  TransactionStatus,
} from "@/lib/types/database";
import type { LedgerStatus } from "@/lib/transactions";

export type InfractionPaymentSummary = {
  totalDue: number;
  amountPaid: number;
  remaining: number;
  transactionCount: number;
  ledgerStatus: LedgerStatus;
  hasPendingReview: boolean;
};

export function summarizeInfractionPayment(input: {
  fineAmount: number | string;
  amountPaid?: number | string | null;
  paymentTransactionCount?: number | null;
  infractionStatus: PaymentStatus;
  transactions?: Array<{ status: TransactionStatus }>;
}): InfractionPaymentSummary {
  const totalDue = Number(input.fineAmount);
  const amountPaid = Number(input.amountPaid ?? 0);
  const transactionCount =
    input.paymentTransactionCount ??
    input.transactions?.filter((row) => row.status !== "rejected").length ??
    0;
  const hasPendingReview =
    input.transactions?.some((row) => row.status === "pending") ?? false;
  const remaining = Math.max(totalDue - amountPaid, 0);

  let ledgerStatus: LedgerStatus = input.infractionStatus;
  if (input.infractionStatus === "paid" || amountPaid >= totalDue) {
    ledgerStatus = "paid";
  } else if (hasPendingReview || amountPaid > 0 || input.infractionStatus === "pending") {
    ledgerStatus = "pending";
  } else {
    ledgerStatus = "unpaid";
  }

  return {
    totalDue,
    amountPaid,
    remaining,
    transactionCount,
    ledgerStatus,
    hasPendingReview,
  };
}

export function canSubmitManualPayment(summary: InfractionPaymentSummary): boolean {
  return summary.ledgerStatus !== "paid" && summary.remaining > 0;
}
