import type { DocumentType } from "@/lib/types/database";

export const NON_EXPIRING_DOCUMENT_TYPES: readonly DocumentType[] = [
  "identity",
  "vehicle_photo",
  "passport",
  "other",
];

export function documentRequiresExpiry(docType: DocumentType): boolean {
  return !NON_EXPIRING_DOCUMENT_TYPES.includes(docType);
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function validateFutureExpiry(
  expiresAt: string | null | undefined,
  docType: DocumentType
): string | null {
  if (!documentRequiresExpiry(docType)) return null;
  if (!expiresAt) return null;

  const dateOnly = expiresAt.slice(0, 10);
  if (dateOnly < todayIsoDate()) {
    return "Expiration date must be today or in the future.";
  }
  return null;
}

