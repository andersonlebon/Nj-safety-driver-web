import type { EvidenceSlotStatus, EvidenceSlotValue } from "@/components/uploads/EvidenceSlot";
import {
  DRIVER_DOCUMENT_GROUPS,
  VEHICLE_DOCUMENT_GROUPS,
  type DocumentGroupDates,
  type DocumentGroupDefinition,
} from "@/lib/document-definitions";
import { matchDocumentToAttachment } from "@/lib/document-group-matching";
import { validateDocumentDates } from "@/lib/document-rules";
import { formatDocumentDate } from "@/lib/documents-display";
import type { Database, DocumentType } from "@/lib/types/database";

export type ExistingDocument = Pick<
  Database["public"]["Tables"]["documents"]["Row"],
  "id" | "doc_type" | "label" | "file_path" | "file_name" | "file_hash" | "vehicle_id" | "group_id"
>;

export type ExistingGroup = Pick<
  Database["public"]["Tables"]["document_groups"]["Row"],
  "id" | "doc_type" | "issued_at" | "expires_at" | "vehicle_id"
>;

export type VehicleRow = Pick<
  Database["public"]["Tables"]["vehicles"]["Row"],
  "id" | "plate_number" | "insurance_status" | "inspection_status"
>;

export type GroupAttachmentsState = Record<string, Record<string, EvidenceSlotValue>>;
export type GroupStatusState = Record<string, Record<string, EvidenceSlotStatus>>;
export type GroupErrorState = Record<string, Record<string, string | undefined>>;
export type GroupDatesState = Record<string, DocumentGroupDates>;

export type UploadedMeta = {
  path: string;
  fileName: string;
  fileHash: string;
  documentId: string;
};

export type GroupUploadedMetaState = Record<
  string,
  Record<string, UploadedMeta | undefined>
>;

export type DocumentUploadTarget = {
  id: string;
  scope: "driver" | "vehicle";
  groupKey: string;
  vehicleId: string | null;
  group: DocumentGroupDefinition;
  required: boolean;
};

export type DocumentListItem = DocumentUploadTarget & {
  title: string;
  description?: string;
  isComplete: boolean;
  uploadedCount: number;
  requiredCount: number;
};

export type DocumentListSection = {
  id: string;
  title: string;
  items: DocumentListItem[];
};

export function emptyGroupAttachments(
  groups: readonly DocumentGroupDefinition[]
): GroupAttachmentsState {
  return Object.fromEntries(
    groups.map((group) => [
      group.key,
      Object.fromEntries(
        group.attachments.map((attachment) => [
          attachment.key,
          { file: null, previewUrl: null },
        ])
      ),
    ])
  );
}

export function emptyGroupDates(
  groups: readonly DocumentGroupDefinition[]
): GroupDatesState {
  return Object.fromEntries(
    groups.map((group) => [group.key, { issuedAt: "", expiresAt: "" }])
  );
}

export function extensionFor(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (fromName && fromName.length <= 5) return fromName;
  if (file.type === "application/pdf") return "pdf";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/heic") return "heic";
  return "jpg";
}

export function vehicleForRequiredChecks(vehicle: VehicleRow) {
  return {
    insurance_status: vehicle.insurance_status ? "true" : "false",
    inspection_status: vehicle.inspection_status ? "true" : "false",
  } as const;
}

export function uploadTargetId(vehicleId: string | null, groupKey: string): string {
  return `${vehicleId ?? "driver"}:${groupKey}`;
}

export function parseUploadTargetId(id: string): { vehicleId: string | null; groupKey: string } {
  const [scope, groupKey] = id.split(":");
  return {
    vehicleId: scope === "driver" ? null : scope,
    groupKey,
  };
}

export function groupScopeKey(
  scope: "driver" | "vehicle",
  docType: DocumentType,
  vehicleId: string | null
): string {
  return scope === "driver" ? `driver:${docType}` : `vehicle:${vehicleId}:${docType}`;
}

export function errorKey(vehicleId: string | null, groupKey: string): string {
  return vehicleId ? `${vehicleId}:${groupKey}` : groupKey;
}

export function attachmentHasUpload(
  value: EvidenceSlotValue | undefined,
  status: EvidenceSlotStatus | undefined
): boolean {
  return (
    status === "uploaded" &&
    Boolean(value?.file || value?.previewUrl)
  );
}

export function isGroupUploadComplete(
  group: DocumentGroupDefinition,
  required: boolean,
  attachments: Record<string, EvidenceSlotValue> | undefined,
  dates: DocumentGroupDates | undefined,
  statuses: Record<string, EvidenceSlotStatus> | undefined
): boolean {
  const requiredAttachments = group.attachments.filter((item) =>
    required ? item.required : false
  );
  const attachmentsToCheck =
    requiredAttachments.length > 0
      ? requiredAttachments
      : group.attachments.filter((item) => item.required);

  if (
    !attachmentsToCheck.every((item) =>
      attachmentHasUpload(attachments?.[item.key], statuses?.[item.key])
    )
  ) {
    return false;
  }

  return !validateDocumentDates(group.docType, dates?.issuedAt, dates?.expiresAt);
}

export function groupUploadProgress(
  group: DocumentGroupDefinition,
  required: boolean,
  attachments: Record<string, EvidenceSlotValue> | undefined,
  statuses: Record<string, EvidenceSlotStatus> | undefined
): { uploadedCount: number; requiredCount: number } {
  const requiredAttachments = group.attachments.filter((item) =>
    required ? item.required : item.required
  );
  const targets =
    requiredAttachments.length > 0
      ? requiredAttachments
      : group.attachments.filter((item) => item.required);

  const uploadedCount = targets.filter((item) =>
    attachmentHasUpload(attachments?.[item.key], statuses?.[item.key])
  ).length;

  return { uploadedCount, requiredCount: targets.length || group.attachments.length };
}

export function buildDocumentUploadState(
  documents: ExistingDocument[],
  documentGroups: ExistingGroup[],
  signedUrls: Record<string, string>
) {
  const driverGroups = emptyGroupAttachments(DRIVER_DOCUMENT_GROUPS);
  const driverDates = emptyGroupDates(DRIVER_DOCUMENT_GROUPS);
  const driverUploadedMeta: GroupUploadedMetaState = {};
  const driverGroupStatus: GroupStatusState = {};

  const vehicleGroupsById: Record<string, GroupAttachmentsState> = {};
  const vehicleDatesById: Record<string, GroupDatesState> = {};
  const vehicleUploadedMetaById: Record<string, GroupUploadedMetaState> = {};
  const vehicleGroupStatusById: Record<string, GroupStatusState> = {};

  const groupIds: Record<string, string> = {};

  for (const group of documentGroups) {
    const scopeKey = group.vehicle_id
      ? `vehicle:${group.vehicle_id}:${group.doc_type}`
      : `driver:${group.doc_type}`;
    groupIds[scopeKey] = group.id;

    const dates = {
      issuedAt: formatDocumentDate(group.issued_at) ?? "",
      expiresAt: formatDocumentDate(group.expires_at) ?? "",
    };

    if (group.vehicle_id) {
      if (!vehicleDatesById[group.vehicle_id]) {
        vehicleDatesById[group.vehicle_id] = emptyGroupDates(VEHICLE_DOCUMENT_GROUPS);
      }
      const def = VEHICLE_DOCUMENT_GROUPS.find((item) => item.docType === group.doc_type);
      if (def) vehicleDatesById[group.vehicle_id][def.key] = dates;
    } else {
      const def = DRIVER_DOCUMENT_GROUPS.find((item) => item.docType === group.doc_type);
      if (def) driverDates[def.key] = dates;
      if (group.doc_type === "other") {
        driverDates.portrait = dates;
      }
    }
  }

  for (const doc of documents) {
    const match = matchDocumentToAttachment(doc);
    if (!match) continue;

    const { group, attachmentKey } = match;
    const previewUrl = signedUrls[doc.file_path] || null;
    const slotValue: EvidenceSlotValue = { file: null, previewUrl };

    if (doc.vehicle_id) {
      if (!vehicleGroupsById[doc.vehicle_id]) {
        vehicleGroupsById[doc.vehicle_id] = emptyGroupAttachments(VEHICLE_DOCUMENT_GROUPS);
        vehicleUploadedMetaById[doc.vehicle_id] = {};
        vehicleGroupStatusById[doc.vehicle_id] = {};
      }
      vehicleGroupsById[doc.vehicle_id][group.key] = {
        ...vehicleGroupsById[doc.vehicle_id][group.key],
        [attachmentKey]: slotValue,
      };
      vehicleUploadedMetaById[doc.vehicle_id][group.key] = {
        ...vehicleUploadedMetaById[doc.vehicle_id][group.key],
        [attachmentKey]: {
          path: doc.file_path,
          fileName: doc.file_name ?? doc.file_path.split("/").pop() ?? "document",
          fileHash: doc.file_hash ?? "",
          documentId: doc.id,
        },
      };
      vehicleGroupStatusById[doc.vehicle_id][group.key] = {
        ...vehicleGroupStatusById[doc.vehicle_id][group.key],
        [attachmentKey]: "uploaded",
      };
    } else {
      driverGroups[group.key] = {
        ...driverGroups[group.key],
        [attachmentKey]: slotValue,
      };
      driverUploadedMeta[group.key] = {
        ...driverUploadedMeta[group.key],
        [attachmentKey]: {
          path: doc.file_path,
          fileName: doc.file_name ?? doc.file_path.split("/").pop() ?? "document",
          fileHash: doc.file_hash ?? "",
          documentId: doc.id,
        },
      };
      driverGroupStatus[group.key] = {
        ...driverGroupStatus[group.key],
        [attachmentKey]: "uploaded",
      };
    }
  }

  return {
    driverGroups,
    driverDates,
    driverUploadedMeta,
    driverGroupStatus,
    vehicleGroupsById,
    vehicleDatesById,
    vehicleUploadedMetaById,
    vehicleGroupStatusById,
    groupIds,
  };
}
