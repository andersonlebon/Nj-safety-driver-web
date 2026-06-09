import type { Database } from "@/lib/types/database";

export type DocRow = Pick<
  Database["public"]["Tables"]["documents"]["Row"],
  "id" | "doc_type" | "label" | "file_path" | "file_name" | "verification_status" | "expires_at" | "vehicle_id"
>;

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

export function groupDocumentsByType(docs: DocRow[]): Record<string, DocRow[]> {
  const groups: Record<string, DocRow[]> = {};
  for (const doc of docs) {
    const key = doc.doc_type;
    if (!groups[key]) groups[key] = [];
    groups[key].push(doc);
  }
  return groups;
}
