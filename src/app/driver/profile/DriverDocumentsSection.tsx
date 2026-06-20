import { FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { DocumentUploadDialog } from "../documents/DocumentUploadDialog";
import { DocumentList } from "../documents/DocumentList";
import { SubmitForReviewButton } from "../documents/SubmitForReviewButton";

type Props = {
  profileId: string;
};

export async function DriverDocumentsSection({ profileId }: Props) {
  const supabase = createClient();

  const [{ data: documents }, { data: vehicles }] = await Promise.all([
    supabase
      .from("documents")
      .select(
        "id, owner_id, group_id, doc_type, label, file_path, file_name, file_hash, verification_status, expires_at, vehicle_id, uploaded_at"
      )
      .eq("owner_id", profileId)
      .order("uploaded_at", { ascending: false }),
    supabase
      .from("vehicles")
      .select("id, plate_number")
      .eq("owner_id", profileId)
      .order("created_at", { ascending: true }),
  ]);

  return (
    <section id="documents" className="scroll-mt-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
            Documents
          </h2>
          <p className="text-sm text-stone-500 dark:text-slate-400 mt-0.5">
            Upload identity, license, vehicle photos, and certificates. Set
            expiration dates so we can remind you before they expire.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 shrink-0">
          <DocumentUploadDialog ownerId={profileId} vehicles={vehicles ?? []} />
          <SubmitForReviewButton />
        </div>
      </div>

      <Card>
        <CardBody>
          <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 mb-4">
            Uploaded documents
          </h3>
          {!documents || documents.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-8 w-8" />}
              title="No documents uploaded"
              description='Click "Upload document" to add your first file.'
            />
          ) : (
            <DocumentList documents={documents} />
          )}
        </CardBody>
      </Card>
    </section>
  );
}
