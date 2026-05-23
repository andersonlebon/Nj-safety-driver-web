import { FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { DocumentUploader } from "./DocumentUploader";
import { DocumentList } from "./DocumentList";

export default async function DriverDocumentsPage() {
  const profile = await getCurrentProfile();
  const supabase = createClient();

  const { data: documents } = await supabase
    .from("documents")
    .select("*")
    .eq("owner_id", profile!.id)
    .order("uploaded_at", { ascending: false });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documents"
        description="Upload identity, license, and insurance documents."
      />

      <Card>
        <CardBody>
          <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 mb-4">
            Upload a document
          </h3>
          <DocumentUploader ownerId={profile!.id} />
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
