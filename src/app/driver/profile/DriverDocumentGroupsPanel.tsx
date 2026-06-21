"use client";

import { Check } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { DocumentGroupUpload } from "@/components/uploads/DocumentGroupUpload";
import { RequiredDocumentsList } from "@/components/uploads/RequiredDocumentsList";
import { usePersistedDocumentGroupUpload } from "@/components/uploads/usePersistedDocumentGroupUpload";
import type {
  ExistingDocument,
  ExistingGroup,
  VehicleRow,
} from "@/lib/document-group-upload-state";
import { useI18n } from "@/i18n/context";
import { SubmitForReviewButton } from "../documents/SubmitForReviewButton";

type Props = {
  ownerId: string;
  documents: ExistingDocument[];
  documentGroups: ExistingGroup[];
  signedUrls: Record<string, string>;
  vehicles: VehicleRow[];
};

export function DriverDocumentGroupsPanel({
  ownerId,
  documents,
  documentGroups,
  signedUrls,
  vehicles,
}: Props) {
  const { t } = useI18n();
  const {
    listSections,
    activeTarget,
    activeUploadProps,
    openUpload,
    closeUpload,
    hasUploadsInProgress,
    requiredComplete,
  } = usePersistedDocumentGroupUpload({
    ownerId,
    documents,
    documentGroups,
    signedUrls,
    vehicles,
  });

  return (
    <section id="files" className="scroll-mt-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
            Documents
          </h2>
          <p className="text-sm text-stone-500 dark:text-slate-400 mt-0.5">
            Upload each required document below. Tap a row to add or replace files.
          </p>
        </div>
        <div className="shrink-0">
          <SubmitForReviewButton />
        </div>
      </div>

      <Alert variant="warning">{t("onboarding.documentsWarning")}</Alert>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <p className="text-xs text-stone-500 dark:text-slate-400">
          {t("onboarding.documentsHint")}
        </p>
        <span className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-full bg-brand-50 dark:bg-brand-950/40 px-3 py-1 text-xs font-medium text-brand-700 dark:text-brand-300">
          <Check className="h-3.5 w-3.5" />
          {t("onboarding.requiredComplete", requiredComplete)}
        </span>
      </div>

      <RequiredDocumentsList sections={listSections} onUpload={openUpload} />

      <Modal
        open={Boolean(activeTarget && activeUploadProps)}
        onClose={closeUpload}
        title={activeTarget?.title ?? ""}
        description={activeTarget?.description}
        className="max-w-2xl"
        footer={
          <div className="flex justify-end">
            <Button
              type="button"
              onClick={closeUpload}
              disabled={hasUploadsInProgress}
            >
              {hasUploadsInProgress ? t("common.uploading") : t("common.close")}
            </Button>
          </div>
        }
      >
        {activeUploadProps && (
          <DocumentGroupUpload
            group={activeUploadProps.group}
            required={activeUploadProps.required}
            attachments={activeUploadProps.attachments}
            statuses={activeUploadProps.statuses}
            errors={activeUploadProps.errors}
            dates={activeUploadProps.dates}
            onAttachmentChange={activeUploadProps.onAttachmentChange}
            onDatesChange={activeUploadProps.onDatesChange}
            disabled={hasUploadsInProgress}
            className="border-0 bg-transparent p-0 dark:bg-transparent"
          />
        )}
      </Modal>
    </section>
  );
}
