export const MAX_EVIDENCE_BYTES = 10 * 1024 * 1024;

export const PHOTO_ACCEPT = "image/jpeg,image/png,image/webp,image/heic";
export const PHOTO_OR_PDF_ACCEPT = `${PHOTO_ACCEPT},application/pdf`;

export const ACCEPTED_PHOTO_TYPES = new Set(
  PHOTO_ACCEPT.split(",").map((value) => value.trim())
);
