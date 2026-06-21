import { createClient } from "@/lib/supabase/server";
import { signDocumentPaths } from "@/lib/storage-urls";
import { DriverDocumentGroupsPanel } from "./DriverDocumentGroupsPanel";

type Props = {
  profileId: string;
};

export async function DriverDocumentsSection({ profileId }: Props) {
  const supabase = createClient();

  const [{ data: documents }, { data: documentGroups }, { data: vehicles }] =
    await Promise.all([
      supabase
        .from("documents")
        .select(
          "id, group_id, doc_type, label, file_path, file_name, file_hash, vehicle_id"
        )
        .eq("owner_id", profileId)
        .order("uploaded_at", { ascending: false }),
      supabase
        .from("document_groups")
        .select("id, doc_type, issued_at, expires_at, vehicle_id")
        .eq("owner_id", profileId),
      supabase
        .from("vehicles")
        .select("id, plate_number, insurance_status, inspection_status")
        .eq("owner_id", profileId)
        .order("created_at", { ascending: true }),
    ]);

  const signedUrls = await signDocumentPaths(
    (documents ?? []).map((doc) => doc.file_path)
  );

  return (
    <DriverDocumentGroupsPanel
      ownerId={profileId}
      documents={documents ?? []}
      documentGroups={documentGroups ?? []}
      signedUrls={signedUrls}
      vehicles={vehicles ?? []}
    />
  );
}
