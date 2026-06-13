import type { DocumentType } from "@/lib/types/database";
import { PHOTO_ACCEPT, PHOTO_OR_PDF_ACCEPT } from "@/components/uploads/EvidenceSlot";

export type AttachmentDefinition = {
  key: string;
  label: string | null;
  title: string;
  fileBase: string;
  accept: string;
  required: boolean;
};

export type DocumentGroupDefinition = {
  key: string;
  docType: DocumentType;
  title: string;
  description?: string;
  scope: "driver" | "vehicle";
  folder: string;
  required: boolean | "if_insured" | "if_inspected";
  attachments: readonly AttachmentDefinition[];
};

export const DRIVER_DOCUMENT_GROUPS: readonly DocumentGroupDefinition[] = [
  {
    key: "identity",
    docType: "identity",
    title: "National ID",
    description: "Upload the front and back of your national identity card.",
    scope: "driver",
    folder: "identity",
    required: true,
    attachments: [
      {
        key: "front",
        label: "front",
        title: "Front",
        fileBase: "front",
        accept: PHOTO_ACCEPT,
        required: true,
      },
      {
        key: "back",
        label: "back",
        title: "Back",
        fileBase: "back",
        accept: PHOTO_ACCEPT,
        required: true,
      },
    ],
  },
  {
    key: "driver_license",
    docType: "driver_license",
    title: "Driver's license",
    description: "Upload the front and back of your driving license.",
    scope: "driver",
    folder: "license",
    required: true,
    attachments: [
      {
        key: "front",
        label: "front",
        title: "Front",
        fileBase: "front",
        accept: PHOTO_ACCEPT,
        required: true,
      },
      {
        key: "back",
        label: "back",
        title: "Back",
        fileBase: "back",
        accept: PHOTO_ACCEPT,
        required: true,
      },
    ],
  },
  {
    key: "portrait",
    docType: "other",
    title: "Portrait / selfie",
    description: "Helps an agent confirm your identity in person.",
    scope: "driver",
    folder: "portrait",
    required: false,
    attachments: [
      {
        key: "portrait",
        label: "portrait",
        title: "Photo",
        fileBase: "portrait",
        accept: PHOTO_ACCEPT,
        required: false,
      },
    ],
  },
] as const;

export const VEHICLE_DOCUMENT_GROUPS: readonly DocumentGroupDefinition[] = [
  {
    key: "vehicle_photo",
    docType: "vehicle_photo",
    title: "Vehicle photos",
    description: "Clear photos help agents identify your vehicle.",
    scope: "vehicle",
    folder: "vehicles",
    required: true,
    attachments: [
      {
        key: "front",
        label: "front",
        title: "Front",
        fileBase: "photo-front",
        accept: PHOTO_ACCEPT,
        required: true,
      },
      {
        key: "rear",
        label: "rear",
        title: "Rear / side",
        fileBase: "photo-rear",
        accept: PHOTO_ACCEPT,
        required: false,
      },
    ],
  },
  {
    key: "vehicle_registration",
    docType: "vehicle_registration",
    title: "Vehicle registration (carte grise)",
    scope: "vehicle",
    folder: "vehicles",
    required: true,
    attachments: [
      {
        key: "registration",
        label: "carte_grise",
        title: "Registration card",
        fileBase: "registration",
        accept: PHOTO_OR_PDF_ACCEPT,
        required: true,
      },
    ],
  },
  {
    key: "vehicle_insurance",
    docType: "insurance",
    title: "Insurance certificate",
    description: "Required only if you marked your vehicle as insured.",
    scope: "vehicle",
    folder: "vehicles",
    required: "if_insured",
    attachments: [
      {
        key: "insurance",
        label: null,
        title: "Certificate",
        fileBase: "insurance",
        accept: PHOTO_OR_PDF_ACCEPT,
        required: true,
      },
    ],
  },
  {
    key: "vehicle_inspection",
    docType: "technical_inspection",
    title: "Technical inspection certificate",
    description: "Required only if you marked your inspection as valid.",
    scope: "vehicle",
    folder: "vehicles",
    required: "if_inspected",
    attachments: [
      {
        key: "inspection",
        label: null,
        title: "Certificate",
        fileBase: "inspection",
        accept: PHOTO_OR_PDF_ACCEPT,
        required: true,
      },
    ],
  },
] as const;

export type DocumentGroupDates = {
  issuedAt: string;
  expiresAt: string;
};

export function isDocumentGroupRequired(
  group: DocumentGroupDefinition,
  vehicle?: { insurance_status: string; inspection_status: string }
): boolean {
  if (group.required === true) return true;
  if (group.required === "if_insured") {
    return vehicle?.insurance_status === "true";
  }
  if (group.required === "if_inspected") {
    return vehicle?.inspection_status === "true";
  }
  return false;
}

export function findDocumentGroup(key: string): DocumentGroupDefinition | null {
  return (
    [...DRIVER_DOCUMENT_GROUPS, ...VEHICLE_DOCUMENT_GROUPS].find(
      (group) => group.key === key
    ) ?? null
  );
}
