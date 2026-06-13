import type { DocumentType } from "@/lib/types/database";

export const DOCUMENTS_WITH_ISSUED_DATE: readonly DocumentType[] = [
  "identity",
  "passport",
  "driver_license",
  "vehicle_registration",
  "insurance",
  "technical_inspection",
];

export const DOCUMENTS_WITH_EXPIRY: readonly DocumentType[] = [
  "identity",
  "passport",
  "driver_license",
  "vehicle_registration",
  "insurance",
  "technical_inspection",
];

export const NON_DATING_DOCUMENT_TYPES: readonly DocumentType[] = [
  "vehicle_photo",
  "other",
];

export function documentRequiresIssuedDate(docType: DocumentType): boolean {
  return DOCUMENTS_WITH_ISSUED_DATE.includes(docType);
}

export function documentRequiresExpiry(docType: DocumentType): boolean {
  return DOCUMENTS_WITH_EXPIRY.includes(docType);
}

export function documentHasDates(docType: DocumentType): boolean {
  return documentRequiresIssuedDate(docType) || documentRequiresExpiry(docType);
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function normalizeIssuedForDocument(
  issuedAt: string | null | undefined,
  docType: DocumentType
): string | null {
  if (!documentRequiresIssuedDate(docType)) return null;
  return issuedAt ?? null;
}

export function normalizeExpiryForDocument(
  expiresAt: string | null | undefined,
  docType: DocumentType
): string | null {
  if (!documentRequiresExpiry(docType)) return null;
  return expiresAt ?? null;
}

export function validateIssuedDate(
  issuedAt: string | null | undefined,
  docType: DocumentType
): string | null {
  if (!documentRequiresIssuedDate(docType)) return null;
  if (!issuedAt) return "Delivered date is required for this document.";

  const dateOnly = issuedAt.slice(0, 10);
  if (dateOnly > todayIsoDate()) {
    return "Delivered date cannot be in the future.";
  }
  return null;
}

export function validateFutureExpiry(
  expiresAt: string | null | undefined,
  docType: DocumentType,
  issuedAt?: string | null
): string | null {
  if (!documentRequiresExpiry(docType)) return null;
  if (!expiresAt) return "Expiration date is required for this document.";

  const expiryOnly = expiresAt.slice(0, 10);
  if (expiryOnly < todayIsoDate()) {
    return "Expiration date must be today or in the future.";
  }

  if (issuedAt) {
    const issuedOnly = issuedAt.slice(0, 10);
    if (expiryOnly < issuedOnly) {
      return "Expiration date must be on or after the delivered date.";
    }
  }

  return null;
}

export function validateDocumentDates(
  docType: DocumentType,
  issuedAt?: string | null,
  expiresAt?: string | null
): string | null {
  return (
    validateIssuedDate(issuedAt, docType) ??
    validateFutureExpiry(expiresAt, docType, issuedAt)
  );
}
