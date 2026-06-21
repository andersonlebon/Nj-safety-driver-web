export const PROFILE_PHOTO_DOC_TYPE = "other" as const;
export const PROFILE_PHOTO_LABEL = "profile_photo";
/** Legacy onboarding selfie label; still read for existing users. */
export const LEGACY_PORTRAIT_LABEL = "portrait";

export const PROFILE_PHOTO_LABELS = [PROFILE_PHOTO_LABEL, LEGACY_PORTRAIT_LABEL] as const;

/** Storage path under the documents bucket (first segment must be auth user id for RLS). */
export function profilePhotoStoragePath(
  userId: string,
  profileId: string,
  extension: string
): string {
  return `${userId}/profile/${profileId}-${Date.now()}.${extension}`;
}

export function extensionForImageFile(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (fromName && fromName.length <= 5) return fromName;
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/heic") return "heic";
  return "jpg";
}
