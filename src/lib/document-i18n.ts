import type { DocumentGroupDefinition } from "@/lib/document-definitions";
import type { Translator } from "@/i18n/translate";

const GROUP_TITLE_KEYS: Record<string, string> = {
  identity: "documents.nationalId",
  driver_license: "documents.driverLicense",
  vehicle_photo: "documents.vehiclePhotos",
  vehicle_registration: "documents.registration",
  vehicle_insurance: "documents.insurance",
  vehicle_inspection: "documents.inspection",
};

const GROUP_DESCRIPTION_KEYS: Record<string, string> = {
  identity: "documents.nationalIdHint",
  driver_license: "documents.driverLicenseHint",
  vehicle_photo: "documents.vehiclePhotosHint",
  vehicle_insurance: "documents.insuranceHint",
  vehicle_inspection: "documents.inspectionHint",
};

const ATTACHMENT_TITLE_KEYS: Record<string, string> = {
  front: "documents.front",
  back: "documents.back",
  rear: "documents.rear",
  registration: "documents.registrationCard",
  insurance: "documents.certificate",
  inspection: "documents.certificate",
};

export function translateDocumentGroupTitle(
  group: DocumentGroupDefinition,
  t: Translator
): string {
  const key = GROUP_TITLE_KEYS[group.key];
  return key ? t(key) : group.title;
}

export function translateDocumentGroupDescription(
  group: DocumentGroupDefinition,
  t: Translator
): string | undefined {
  const key = GROUP_DESCRIPTION_KEYS[group.key];
  if (key) return t(key);
  return group.description;
}

export function translateAttachmentTitle(
  attachmentKey: string,
  fallback: string,
  t: Translator
): string {
  const key = ATTACHMENT_TITLE_KEYS[attachmentKey];
  return key ? t(key) : fallback;
}
