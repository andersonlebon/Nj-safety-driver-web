import type { SupabaseClient } from "@supabase/supabase-js";
import {
  normalizeExpiryForDocument,
  normalizeIssuedForDocument,
  validateDocumentDates,
} from "@/lib/document-rules";
import { hasDuplicateDocumentHash } from "@/lib/document-duplicate";
import type { Database, DocumentType } from "@/lib/types/database";

type Client = SupabaseClient<Database>;

type SaveAttachmentInput = {
  supabase: Client;
  ownerId: string;
  vehicleId: string | null;
  docType: DocumentType;
  label: string | null;
  issuedAt: string | null;
  expiresAt: string | null;
  filePath: string;
  fileName: string;
  fileHash: string;
};

export async function saveDocumentAttachment(
  input: SaveAttachmentInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  const dateError = validateDocumentDates(
    input.docType,
    input.issuedAt,
    input.expiresAt
  );
  if (dateError) return { ok: false, error: dateError };

  const duplicate = await hasDuplicateDocumentHash(
    input.supabase,
    input.ownerId,
    input.fileHash,
    { vehicleId: input.vehicleId }
  );
  if (duplicate) {
    return {
      ok: false,
      error: "Duplicate document image detected. Please choose a different photo.",
    };
  }

  let groupQuery = input.supabase
    .from("document_groups")
    .select("id")
    .eq("owner_id", input.ownerId)
    .eq("doc_type", input.docType);

  groupQuery = input.vehicleId
    ? groupQuery.eq("vehicle_id", input.vehicleId)
    : groupQuery.is("vehicle_id", null);

  const { data: existingGroup } = await groupQuery.maybeSingle();

  let groupId = existingGroup?.id;
  const normalizedIssued = normalizeIssuedForDocument(input.issuedAt, input.docType);
  const normalizedExpiry = normalizeExpiryForDocument(input.expiresAt, input.docType);

  if (!groupId) {
    const { data: createdGroup, error: groupError } = await input.supabase
      .from("document_groups")
      .insert({
        owner_id: input.ownerId,
        vehicle_id: input.vehicleId,
        doc_type: input.docType,
        issued_at: normalizedIssued,
        expires_at: normalizedExpiry,
        verification_status: "pending_review",
      })
      .select("id")
      .single();

    if (groupError || !createdGroup) {
      return { ok: false, error: groupError?.message ?? "Could not create document record." };
    }
    groupId = createdGroup.id;
  } else if (normalizedIssued || normalizedExpiry) {
    await input.supabase
      .from("document_groups")
      .update({
        issued_at: normalizedIssued,
        expires_at: normalizedExpiry,
      })
      .eq("id", groupId);
  }

  const { error: attachmentError } = await input.supabase.from("documents").insert({
    owner_id: input.ownerId,
    vehicle_id: input.vehicleId,
    group_id: groupId,
    doc_type: input.docType,
    label: input.label,
    file_path: input.filePath,
    file_name: input.fileName,
    file_hash: input.fileHash,
    expires_at: null,
    verification_status: "pending_review",
  });

  if (attachmentError) {
    return { ok: false, error: attachmentError.message };
  }

  return { ok: true };
}
