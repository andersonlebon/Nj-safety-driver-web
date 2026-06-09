import { createClient } from "@/lib/supabase/server";
import { signDocumentPaths } from "@/lib/storage-urls";
import type { DocRow } from "@/lib/documents-display";

export async function loadDocumentsForOwner(ownerId: string): Promise<{
  documents: DocRow[];
  signedUrls: Record<string, string>;
}> {
  const supabase = createClient();
  const { data } = await supabase
    .from("documents")
    .select(
      "id, doc_type, label, file_path, file_name, verification_status, expires_at, vehicle_id"
    )
    .eq("owner_id", ownerId)
    .order("uploaded_at", { ascending: false });

  const documents = (data ?? []) as DocRow[];
  const signedUrls = await signDocumentPaths(
    documents.map((d) => d.file_path).filter(Boolean)
  );
  return { documents, signedUrls };
}

export async function loadDocumentsForVehicle(
  vehicleId: string,
  ownerId?: string | null
): Promise<{ documents: DocRow[]; signedUrls: Record<string, string> }> {
  const supabase = createClient();
  const { data } = await supabase
    .from("documents")
    .select(
      "id, doc_type, label, file_path, file_name, verification_status, expires_at, vehicle_id"
    )
    .eq("vehicle_id", vehicleId)
    .order("uploaded_at", { ascending: false });

  let documents = (data ?? []) as DocRow[];

  if (ownerId) {
    const { data: ownerDocs } = await supabase
      .from("documents")
      .select(
        "id, doc_type, label, file_path, file_name, verification_status, expires_at, vehicle_id"
      )
      .eq("owner_id", ownerId)
      .is("vehicle_id", null)
      .in("doc_type", ["identity", "driver_license", "other", "passport"]);

    const personal = (ownerDocs ?? []) as DocRow[];
    const ids = new Set(documents.map((d) => d.id));
    for (const d of personal) {
      if (!ids.has(d.id)) documents.push(d);
    }
  }

  const signedUrls = await signDocumentPaths(
    documents.map((d) => d.file_path).filter(Boolean)
  );
  return { documents, signedUrls };
}
