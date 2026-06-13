"use client";

import { useEffect, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { DocumentGallery } from "@/components/documents/DocumentGallery";
import type { DocRow, DocumentGroupWithAttachments } from "@/lib/documents-display";
import { buildDocumentGroups } from "@/lib/documents-display";

type Props = {
  ownerId?: string | null;
  vehicleId?: string | null;
  title?: string;
  sectionId?: string;
  scope?: "all" | "driver" | "vehicle";
};

export function StaffDocumentsLoader({
  ownerId,
  vehicleId,
  title = "Uploaded documents",
  sectionId = "staff-detail-documents",
  scope = "all",
}: Props) {
  const [documents, setDocuments] = useState<DocRow[]>([]);
  const [documentGroups, setDocumentGroups] = useState<DocumentGroupWithAttachments[]>([]);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!ownerId && !vehicleId) return;

    startTransition(async () => {
      const supabase = createClient();
      const select =
        "id, group_id, doc_type, label, file_path, file_name, verification_status, expires_at, vehicle_id";
      const groupSelect =
        "id, doc_type, issued_at, expires_at, verification_status, vehicle_id";
      const queries = [];
      const groupQueries = [];

      if (ownerId) {
        let ownerQuery = supabase
          .from("documents")
          .select(select)
          .eq("owner_id", ownerId)
          .order("uploaded_at", { ascending: false });
        if (scope === "driver") {
          ownerQuery = ownerQuery.is("vehicle_id", null);
        }
        queries.push(ownerQuery);
        let ownerGroupQuery = supabase
          .from("document_groups")
          .select(groupSelect)
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
            .select(select)
            .eq("vehicle_id", vehicleId)
            .order("uploaded_at", { ascending: false })
        );
        groupQueries.push(
          supabase
            .from("document_groups")
            .select(groupSelect)
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
      const docs = [...merged.values()];
      setDocuments(docs);
      setDocumentGroups(
        buildDocumentGroups(
          groupResults.flatMap(({ data }) => data ?? []),
          docs
        )
      );

      const paths = docs.map((d) => d.file_path).filter(Boolean);
      const signedEntries = await Promise.all(
        paths.map(async (path) => {
          const { data } = await supabase.storage
            .from("documents")
            .createSignedUrl(path, 3600);
          return [path, data?.signedUrl ?? ""] as const;
        })
      );
      setSignedUrls(Object.fromEntries(signedEntries));
    });
  }, [ownerId, scope, vehicleId]);

  return (
    <div id={sectionId} className="scroll-mt-3">
      <DocumentGallery
        title={title}
        documents={documents}
        documentGroups={documentGroups}
        signedUrls={signedUrls}
        emptyMessage="No identity, license, or vehicle documents uploaded yet."
      />
    </div>
  );
}
