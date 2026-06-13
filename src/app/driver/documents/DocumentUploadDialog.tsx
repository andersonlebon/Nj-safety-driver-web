"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { friendlyError } from "@/lib/errors";
import { FormDialog } from "@/components/ui/FormDialog";
import { StepWizard, StepWizardFooter } from "@/components/ui/StepWizard";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import {
  documentRequiresExpiry,
  documentRequiresIssuedDate,
  todayIsoDate,
  validateDocumentDates,
} from "@/lib/document-rules";
import { saveDocumentAttachment } from "@/lib/document-groups-client";
import { sha256File } from "@/lib/file-hash";
import {
  EvidenceSlot,
  PHOTO_OR_PDF_ACCEPT,
  type EvidenceSlotValue,
} from "@/components/uploads/EvidenceSlot";
import type { Database, DocumentType } from "@/lib/types/database";

type VehicleOption = Pick<
  Database["public"]["Tables"]["vehicles"]["Row"],
  "id" | "plate_number"
>;

const STEPS = ["Document type", "Details", "Upload file"];

const docTypes: {
  value: DocumentType;
  label: string;
  scope: "driver" | "vehicle";
}[] = [
  { value: "identity", label: "Identity document", scope: "driver" },
  { value: "driver_license", label: "Driving license", scope: "driver" },
  { value: "vehicle_photo", label: "Vehicle photo", scope: "vehicle" },
  { value: "vehicle_registration", label: "Vehicle registration", scope: "vehicle" },
  { value: "insurance", label: "Insurance certificate", scope: "vehicle" },
  { value: "technical_inspection", label: "Technical inspection", scope: "vehicle" },
  { value: "other", label: "Other", scope: "driver" },
];

function folderFor(docType: DocumentType, vehicleId: string | null): string {
  if (vehicleId) return `vehicles/${vehicleId}`;
  switch (docType) {
    case "identity":
      return "identity";
    case "driver_license":
      return "license";
    default:
      return "other";
  }
}

export function DocumentUploadDialog({
  ownerId,
  vehicles,
}: {
  ownerId: string;
  vehicles: VehicleOption[];
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [docType, setDocType] = useState<DocumentType>("identity");
  const [vehicleId, setVehicleId] = useState("");
  const [label, setLabel] = useState("");
  const [issuedAt, setIssuedAt] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [evidence, setEvidence] = useState<EvidenceSlotValue>({
    file: null,
    previewUrl: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scope = docTypes.find((d) => d.value === docType)?.scope ?? "driver";
  const requiresIssued = documentRequiresIssuedDate(docType);
  const requiresExpiry = documentRequiresExpiry(docType);

  const reset = () => {
    setStep(0);
    setDocType("identity");
    setVehicleId("");
    setLabel("");
    setIssuedAt("");
    setExpiresAt("");
    setEvidence({ file: null, previewUrl: null });
    setError(null);
  };

  const validateStep = (): string | null => {
    if (step === 0) return null;
    if (step === 1) {
      if (scope === "vehicle" && vehicles.length > 0 && !vehicleId) {
        return "Please select a vehicle for this document.";
      }
      const expiryError = validateDocumentDates(
        docType,
        issuedAt || null,
        expiresAt || null
      );
      if (expiryError) return expiryError;
      return null;
    }
    if (!evidence.file) return "Please add a photo or PDF to upload.";
    return null;
  };

  const upload = async (close: () => void) => {
    const err = validateStep();
    if (err) {
      setError(err);
      return;
    }
    const file = evidence.file!;
    setLoading(true);
    setError(null);

    const effectiveVehicleId = scope === "vehicle" ? vehicleId || null : null;
    const supabase = createClient();
    const fileHash = await sha256File(file);
    const { data: duplicate } = await supabase
      .from("documents")
      .select("id")
      .eq("owner_id", ownerId)
      .eq("file_hash", fileHash)
      .limit(1)
      .maybeSingle();

    if (duplicate) {
      setError("This exact file is already uploaded. Use Replace on the existing document if needed.");
      setLoading(false);
      return;
    }

    const ext = file.name.split(".").pop() || "bin";
    const folder = folderFor(docType, effectiveVehicleId);
    const path = `${ownerId}/${folder}/${docType}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(path, file, { cacheControl: "3600", upsert: false });

    if (uploadError) {
      setError(friendlyError(uploadError));
      setLoading(false);
      return;
    }

    const saveResult = await saveDocumentAttachment({
      supabase,
      ownerId,
      vehicleId: effectiveVehicleId,
      docType,
      label: label.trim() || null,
      issuedAt: issuedAt ? new Date(issuedAt).toISOString() : null,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      filePath: path,
      fileName: file.name,
      fileHash,
    });

    if (!saveResult.ok) {
      await supabase.storage.from("documents").remove([path]);
      setError(saveResult.error);
      setLoading(false);
      return;
    }

    setLoading(false);
    reset();
    close();
    router.refresh();
  };

  return (
    <FormDialog
      triggerLabel={
        <>
          <Upload className="h-4 w-4 mr-1.5" />
          Upload document
        </>
      }
      title="Upload a document"
      description="Add identity, license, or vehicle papers in a few guided steps."
      modalClassName="max-w-lg"
    >
      {({ close }) => (
        <div>
          <StepWizard steps={STEPS} currentStep={step} onStepChange={setStep} />
          {error && (
            <Alert variant="error" className="mb-4">
              {error}
            </Alert>
          )}

          {step === 0 && (
            <Select
              label="What are you uploading?"
              name="doc_type"
              value={docType}
                onChange={(e) => {
                  const next = e.target.value as DocumentType;
                  setDocType(next);
                  if (!documentRequiresIssuedDate(next) && !documentRequiresExpiry(next)) {
                    setIssuedAt("");
                    setExpiresAt("");
                  }
                }}
            >
              {docTypes.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </Select>
          )}

          {step === 1 && (
            <div className="space-y-4">
              {scope === "vehicle" && vehicles.length > 0 && (
                <Select
                  label="Vehicle"
                  name="vehicle_id"
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                >
                  <option value="">— select a vehicle —</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.plate_number}
                    </option>
                  ))}
                </Select>
              )}
              <Input
                label="Label (optional)"
                name="label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. front, back, 2025"
              />
              {requiresIssued && (
                <Input
                  label="Delivered date"
                  type="date"
                  name="issued_at"
                  value={issuedAt}
                  onChange={(e) => setIssuedAt(e.target.value)}
                  max={todayIsoDate()}
                />
              )}
              {requiresExpiry ? (
                <Input
                  label="Expiration date"
                  type="date"
                  name="expires_at"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  min={issuedAt || todayIsoDate()}
                />
              ) : !requiresIssued ? (
                <Alert variant="info">
                  This document type does not need validity dates.
                </Alert>
              ) : null}
            </div>
          )}

          {step === 2 && (
            <EvidenceSlot
              title={docTypes.find((d) => d.value === docType)?.label ?? "Document"}
              description="Drag and drop or tap to choose a clear photo or PDF."
              required
              accept={PHOTO_OR_PDF_ACCEPT}
              value={evidence}
              onChange={setEvidence}
              expiresAt={expiresAt}
              onExpiresAtChange={setExpiresAt}
              showExpiry={false}
            />
          )}

          <StepWizardFooter
            step={step}
            totalSteps={STEPS.length}
            loading={loading}
            onBack={() => {
              setError(null);
              setStep((s) => Math.max(0, s - 1));
            }}
            onCancel={close}
            onNext={() => {
              const err = validateStep();
              if (err) {
                setError(err);
                return;
              }
              setError(null);
              setStep((s) => Math.min(STEPS.length - 1, s + 1));
            }}
            onSubmit={() => upload(close)}
            submitLabel="Upload document"
          />
        </div>
      )}
    </FormDialog>
  );
}
