import type { PaymentStatus } from "@/lib/types/database";
import type { VerificationStatus } from "@/lib/verification";
import type { Translator } from "@/i18n/translate";

export function verificationStatusLabel(
  t: Translator,
  status: VerificationStatus
): string {
  return t(`status.verification.${status}`);
}

export function paymentStatusLabel(t: Translator, status: PaymentStatus): string {
  return t(`status.payment.${status}`);
}

export function staffRoleLabel(
  t: Translator,
  role: "admin" | "agent"
): string {
  return role === "admin" ? t("roles.admin") : t("roles.agent");
}

export function documentExpiryLabel(
  t: Translator,
  expiresAt: string | null | undefined
): {
  label: string;
  variant: "success" | "warning" | "error" | "neutral";
} {
  if (!expiresAt) {
    return { label: t("status.documentExpiry.noExpiry"), variant: "neutral" };
  }
  const expiry = new Date(expiresAt);
  const now = new Date();
  const days = Math.ceil(
    (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (days < 0) {
    return {
      label: t("status.documentExpiry.expiredDays", { days: Math.abs(days) }),
      variant: "error",
    };
  }
  if (days <= 30) {
    return {
      label: t("status.documentExpiry.expiresInDays", { days }),
      variant: "warning",
    };
  }
  return {
    label: t("status.documentExpiry.validUntil", {
      date: expiry.toLocaleDateString(),
    }),
    variant: "success",
  };
}

const DOCUMENT_VALIDATION_KEYS: Record<string, string> = {
  "Delivered date is required for this document.":
    "driver.documents.validation.deliveredRequired",
  "Delivered date cannot be in the future.":
    "driver.documents.validation.deliveredFuture",
  "Expiration date is required for this document.":
    "driver.documents.validation.expirationRequired",
  "Expiration date must be today or in the future.":
    "driver.documents.validation.expirationPast",
  "Expiration date must be on or after the delivered date.":
    "driver.documents.validation.expirationBeforeDelivered",
};

export function translateDocumentValidationError(
  t: Translator,
  message: string | null
): string | null {
  if (!message) return null;
  const key = DOCUMENT_VALIDATION_KEYS[message];
  return key ? t(key) : message;
}
