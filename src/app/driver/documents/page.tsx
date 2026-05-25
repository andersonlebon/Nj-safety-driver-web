import { FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { DocumentUploader } from "./DocumentUploader";
import { DocumentList } from "./DocumentList";
import { SubmitForReviewButton } from "./SubmitForReviewButton";

export default async function DriverDocumentsPage() {
  const profile = await requireRole(["driver", "admin"]);
  const supabase = createClient();

  const [{ data: documents }, { data: vehicles }] = await Promise.all([
    supabase
      .from("documents")
      .select("*")
      .eq("owner_id", profile.id)
      .order("uploaded_at", { ascending: false }),
    supabase
      .from("vehicles")
      .select("id, plate_number")
      .eq("owner_id", profile.id)
      .order("created_at", { ascending: true }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documents"
        description="Upload identity, license, vehicle photos, and certificates. Set expiration dates so we can remind you before they expire."
        actions={<SubmitForReviewButton />}
      />

      <Card>
        <CardBody>
          <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 mb-4">
            Upload a document
          </h3>
          <DocumentUploader ownerId={profile.id} vehicles={vehicles ?? []} />
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 mb-4">
            Uploaded documents
          </h3>
          {!documents || documents.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-8 w-8" />}
              title="No documents uploaded"
              description="Use the form above to upload your first document."
            />
          ) : (
            <DocumentList documents={documents} />
          )}
        </CardBody>
      </Card>
    </div>
  );
}
