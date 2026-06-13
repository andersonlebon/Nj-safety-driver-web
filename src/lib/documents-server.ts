import { createClient } from "@/lib/supabase/server";
import { signDocumentPaths } from "@/lib/storage-urls";
import type {
  DocRow,
  DocumentGroupRow,
  DocumentGroupWithAttachments,
} from "@/lib/documents-display";
import { buildDocumentGroups } from "@/lib/documents-display";

export async function loadDocumentsForOwner(ownerId: string): Promise<{
  documents: DocRow[];
  documentGroups: DocumentGroupWithAttachments[];
  signedUrls: Record<string, string>;
}> {
  const supabase = createClient();
  const [{ data: attachments }, { data: groups }] = await Promise.all([
    supabase
      .from("documents")
      .select(
        "id, group_id, doc_type, label, file_path, file_name, verification_status, expires_at, vehicle_id"
      )
      .eq("owner_id", ownerId)
      .order("uploaded_at", { ascending: false }),
    supabase
      .from("document_groups")
      .select("id, doc_type, issued_at, expires_at, verification_status, vehicle_id")
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: false }),
  ]);

  const documents = (attachments ?? []) as DocRow[];
  const documentGroups = buildDocumentGroups(
    (groups ?? []) as DocumentGroupRow[],
    documents
  );
  const signedUrls = await signDocumentPaths(
    documents.map((d) => d.file_path).filter(Boolean)
  );
  return { documents, documentGroups, signedUrls };
}

export async function loadDocumentsForVehicle(
  vehicleId: string,
  ownerId?: string | null
): Promise<{
  documents: DocRow[];
  documentGroups: DocumentGroupWithAttachments[];
  signedUrls: Record<string, string>;
}> {
  const supabase = createClient();
  const [{ data: vehicleAttachments }, { data: vehicleGroups }] = await Promise.all([
    supabase
      .from("documents")
      .select(
        "id, group_id, doc_type, label, file_path, file_name, verification_status, expires_at, vehicle_id"
      )
      .eq("vehicle_id", vehicleId)
      .order("uploaded_at", { ascending: false }),
    supabase
      .from("document_groups")
      .select("id, doc_type, issued_at, expires_at, verification_status, vehicle_id")
      .eq("vehicle_id", vehicleId)
      .order("created_at", { ascending: false }),
  ]);

  let documents = (vehicleAttachments ?? []) as DocRow[];
  let groups = (vehicleGroups ?? []) as DocumentGroupRow[];

  if (ownerId) {
    const [{ data: ownerAttachments }, { data: ownerGroups }] = await Promise.all([
      supabase
        .from("documents")
        .select(
          "id, group_id, doc_type, label, file_path, file_name, verification_status, expires_at, vehicle_id"
        )
        .eq("owner_id", ownerId)
        .is("vehicle_id", null)
        .in("doc_type", ["identity", "driver_license", "other", "passport"]),
      supabase
        .from("document_groups")
        .select("id, doc_type, issued_at, expires_at, verification_status, vehicle_id")
        .eq("owner_id", ownerId)
        .is("vehicle_id", null),
    ]);

    const personal = (ownerAttachments ?? []) as DocRow[];
    const personalGroups = (ownerGroups ?? []) as DocumentGroupRow[];
    const ids = new Set(documents.map((d) => d.id));
    for (const doc of personal) {
      if (!ids.has(doc.id)) documents.push(doc);
    }
    const groupIds = new Set(groups.map((group) => group.id));
    for (const group of personalGroups) {
      if (!groupIds.has(group.id)) groups.push(group);
    }
  }

  const documentGroups = buildDocumentGroups(groups, documents);
  const signedUrls = await signDocumentPaths(
    documents.map((d) => d.file_path).filter(Boolean)
  );
  return { documents, documentGroups, signedUrls };
}
