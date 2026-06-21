import {
  DRIVER_DOCUMENT_GROUPS,
  VEHICLE_DOCUMENT_GROUPS,
  type DocumentGroupDefinition,
} from "@/lib/document-definitions";
import type { DocumentType } from "@/lib/types/database";

type DocLike = {
  doc_type: DocumentType;
  label: string | null;
  vehicle_id: string | null;
};

export function matchDocumentToAttachment(
  doc: DocLike
): { group: DocumentGroupDefinition; attachmentKey: string } | null {
  const catalog = doc.vehicle_id ? VEHICLE_DOCUMENT_GROUPS : DRIVER_DOCUMENT_GROUPS;

  for (const group of catalog) {
    if (group.key === "portrait") {
      if (doc.doc_type !== "other") continue;
      const attachment = group.attachments.find((item) => item.key === "portrait");
      if (attachment && (doc.label === "portrait" || doc.label === attachment.label)) {
        return { group, attachmentKey: attachment.key };
      }
      continue;
    }

    if (group.docType !== doc.doc_type) continue;

    for (const attachment of group.attachments) {
      if (attachment.label != null) {
        if (doc.label === attachment.label) {
          return { group, attachmentKey: attachment.key };
        }
        continue;
      }

      if (group.attachments.length === 1) {
        return { group, attachmentKey: attachment.key };
      }
    }
  }

  return null;
}
