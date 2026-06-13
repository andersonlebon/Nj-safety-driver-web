import type { Database } from "@/lib/types/database";

export type DocRow = Pick<
  Database["public"]["Tables"]["documents"]["Row"],
  "id" | "group_id" | "doc_type" | "label" | "file_path" | "file_name" | "verification_status" | "expires_at" | "vehicle_id"
>;

export type DocumentGroupRow = Pick<
  Database["public"]["Tables"]["document_groups"]["Row"],
  "id" | "doc_type" | "issued_at" | "expires_at" | "verification_status" | "vehicle_id"
>;

export type DocumentGroupWithAttachments = DocumentGroupRow & {
  attachments: DocRow[];
};

export const DOC_TYPE_LABELS: Record<string, string> = {
  identity: "National ID",
  driver_license: "Driver's license",
  vehicle_photo: "Vehicle photo",
  vehicle_registration: "Registration (carte grise)",
  insurance: "Insurance",
  technical_inspection: "Technical inspection",
  passport: "Passport / travel ID",
  other: "Other",
};

export function documentTitle(doc: DocRow): string {
  const base = DOC_TYPE_LABELS[doc.doc_type] ?? doc.doc_type;
  if (doc.label) return `${base} — ${doc.label}`;
  return base;
}

export function groupTitle(group: DocumentGroupRow): string {
  return DOC_TYPE_LABELS[group.doc_type] ?? group.doc_type;
}

export function groupDocumentsByType(docs: DocRow[]): Record<string, DocRow[]> {
  const groups: Record<string, DocRow[]> = {};
  for (const doc of docs) {
    const key = doc.doc_type;
    if (!groups[key]) groups[key] = [];
    groups[key].push(doc);
  }
  return groups;
}

export function buildDocumentGroups(
  groups: DocumentGroupRow[],
  attachments: DocRow[]
): DocumentGroupWithAttachments[] {
  const byGroupId = new Map<string, DocRow[]>();
  const legacyByType = new Map<string, DocRow[]>();

  for (const attachment of attachments) {
    if (attachment.group_id) {
      const current = byGroupId.get(attachment.group_id) ?? [];
      current.push(attachment);
      byGroupId.set(attachment.group_id, current);
      continue;
    }

    const legacyKey = `${attachment.doc_type}:${attachment.vehicle_id ?? "driver"}`;
    const current = legacyByType.get(legacyKey) ?? [];
    current.push(attachment);
    legacyByType.set(legacyKey, current);
  }

  const grouped = groups.map((group) => ({
    ...group,
    attachments: byGroupId.get(group.id) ?? [],
  }));

  for (const [legacyKey, legacyAttachments] of legacyByType.entries()) {
    if (legacyAttachments.length === 0) continue;
    const [docType] = legacyKey.split(":");
    grouped.push({
      id: `legacy-${legacyKey}`,
      doc_type: legacyAttachments[0].doc_type,
      issued_at: null,
      expires_at: legacyAttachments.find((item) => item.expires_at)?.expires_at ?? null,
      verification_status:
        legacyAttachments[0].verification_status ?? "pending_review",
      vehicle_id: legacyAttachments[0].vehicle_id,
      attachments: legacyAttachments,
    });
  }

  return grouped.sort((a, b) => groupTitle(a).localeCompare(groupTitle(b)));
}

export function formatDocumentDate(value: string | null | undefined): string | null {
  if (!value) return null;
  return value.slice(0, 10);
}
