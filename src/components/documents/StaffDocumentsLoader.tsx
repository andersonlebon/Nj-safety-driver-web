"use client";

import { DocumentGallery } from "@/components/documents/DocumentGallery";
import { useStaffDocuments } from "@/hooks/queries/use-staff-documents";
import type { StaffDocumentsScope } from "@/types";

type Props = {
  ownerId?: string | null;
  vehicleId?: string | null;
  title?: string;
  sectionId?: string;
  scope?: StaffDocumentsScope;
};

export function StaffDocumentsLoader({
  ownerId,
  vehicleId,
  title = "Uploaded documents",
  sectionId = "staff-detail-documents",
  scope = "all",
}: Props) {
  const { data, isLoading, isError } = useStaffDocuments({
    ownerId,
    vehicleId,
    scope,
  });

  if (!ownerId && !vehicleId) {
    return null;
  }

  if (isLoading) {
    return (
      <div
        id={sectionId}
        className="scroll-mt-3 h-32 animate-pulse rounded-lg bg-stone-100 dark:bg-slate-800/60"
        aria-label="Loading documents"
      />
    );
  }

  if (isError || !data) {
    return (
      <div id={sectionId} className="scroll-mt-3 text-sm text-red-600 dark:text-red-400">
        Could not load documents. Please try again.
      </div>
    );
  }

  return (
    <div id={sectionId} className="scroll-mt-3">
      <DocumentGallery
        title={title}
        documents={data.documents}
        documentGroups={data.documentGroups}
        signedUrls={data.signedUrls}
        emptyMessage="No identity, license, or vehicle documents uploaded yet."
      />
    </div>
  );
}
