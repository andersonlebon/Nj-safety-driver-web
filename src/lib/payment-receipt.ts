import type { PaymentMethod } from "@/lib/types/database";

export function paymentReceiptStoragePath(
  authUserId: string,
  infractionId: string,
  extension: string
): string {
  const safeExt = extension.replace(/^\./, "").toLowerCase();
  return `${authUserId}/payments/${infractionId}/${Date.now()}.${safeExt}`;
}

export const ACTIVE_PAYMENT_METHODS: PaymentMethod[] = ["manual"];

export const PLANNED_PAYMENT_METHODS: PaymentMethod[] = [
  "mobile_money",
  "card",
  "bank_transfer",
];
