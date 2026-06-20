import { createClient } from "@/lib/supabase/client";
import { buildDocumentGroups } from "@/lib/documents-display";
import type { DocRow, DocumentGroupWithAttachments } from "@/lib/documents-display";
import type { StaffDocumentsParams } from "@/types";

const DOC_SELECT =
  "id, group_id, doc_type, label, file_path, file_name, verification_status, expires_at, vehicle_id";
const GROUP_SELECT =
  "id, doc_type, issued_at, expires_at, verification_status, vehicle_id";

export type StaffDocumentsBundle = {
  documents: DocRow[];
  documentGroups: DocumentGroupWithAttachments[];
  signedUrls: Record<string, string>;
};

/**
 * Client-side fetcher for staff document galleries. Called only from React Query
 * hooks — do not invoke directly from components.
 */
export async function fetchStaffDocumentsBundle(
  params: StaffDocumentsParams
): Promise<StaffDocumentsBundle> {
  const { ownerId, vehicleId, scope = "all" } = params;
  if (!ownerId && !vehicleId) {
    return { documents: [], documentGroups: [], signedUrls: {} };
  }

  const supabase = createClient();
  const queries = [];
  const groupQueries = [];

  if (ownerId) {
    let ownerQuery = supabase
      .from("documents")
      .select(DOC_SELECT)
      .eq("owner_id", ownerId)
      .order("uploaded_at", { ascending: false });
    if (scope === "driver") {
      ownerQuery = ownerQuery.is("vehicle_id", null);
    }
    queries.push(ownerQuery);

    let ownerGroupQuery = supabase
      .from("document_groups")
      .select(GROUP_SELECT)
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: false });
    if (scope === "driver") {
      ownerGroupQuery = ownerGroupQuery.is("vehicle_id", null);
    }
    groupQueries.push(ownerGroupQuery);
  }

  if (vehicleId && scope !== "driver") {
    queries.push(
      supabase
        .from("documents")
        .select(DOC_SELECT)
        .eq("vehicle_id", vehicleId)
        .order("uploaded_at", { ascending: false })
    );
    groupQueries.push(
      supabase
        .from("document_groups")
        .select(GROUP_SELECT)
        .eq("vehicle_id", vehicleId)
        .order("created_at", { ascending: false })
    );
  }

  const [results, groupResults] = await Promise.all([
    Promise.all(queries),
    Promise.all(groupQueries),
  ]);

  const merged = new Map<string, DocRow>();
  for (const { data } of results) {
    for (const row of (data ?? []) as DocRow[]) {
      merged.set(row.id, row);
    }
  }
  const documents = [...merged.values()];
  const documentGroups = buildDocumentGroups(
    groupResults.flatMap(({ data }) => data ?? []),
    documents
  );

  const paths = documents.map((d) => d.file_path).filter(Boolean);
  const signedEntries = await Promise.all(
    paths.map(async (path) => {
      const { data } = await supabase.storage
        .from("documents")
        .createSignedUrl(path, 3600);
      return [path, data?.signedUrl ?? ""] as const;
    })
  );

  return {
    documents,
    documentGroups,
    signedUrls: Object.fromEntries(signedEntries),
  };
}
