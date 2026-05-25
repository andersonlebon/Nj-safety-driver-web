"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { friendlyError } from "@/lib/errors";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import type { Database, DocumentType } from "@/lib/types/database";

type VehicleOption = Pick<
  Database["public"]["Tables"]["vehicles"]["Row"],
  "id" | "plate_number"
>;

const docTypes: { value: DocumentType; label: string; scope: "driver" | "vehicle" }[] = [
  { value: "identity", label: "Identity document", scope: "driver" },
  { value: "driver_license", label: "Driving license", scope: "driver" },
  { value: "vehicle_photo", label: "Vehicle photo", scope: "vehicle" },
  { value: "vehicle_registration", label: "Vehicle registration (carte grise)", scope: "vehicle" },
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
    case "vehicle_photo":
    case "vehicle_registration":
    case "insurance":
    case "technical_inspection":
      return "vehicles/_unassigned";
    case "other":
    default:
      return "other";
  }
}

export function DocumentUploader({
  ownerId,
  vehicles,
}: {
  ownerId: string;
  vehicles: VehicleOption[];
}) {
  const router = useRouter();
  const [docType, setDocType] = useState<DocumentType>("identity");
  const [vehicleId, setVehicleId] = useState<string>("");
  const [label, setLabel] = useState<string>("");
  const [expiresAt, setExpiresAt] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentScope =
    docTypes.find((d) => d.value === docType)?.scope ?? "driver";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please choose a file to upload.");
      return;
    }
    setLoading(true);
    setError(null);

    const effectiveVehicleId = currentScope === "vehicle" ? vehicleId || null : null;
    if (currentScope === "vehicle" && !effectiveVehicleId && vehicles.length > 0) {
      setError("Please pick a vehicle for this document.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
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

    const { error: dbError } = await supabase.from("documents").insert({
      owner_id: ownerId,
      vehicle_id: effectiveVehicleId,
      doc_type: docType,
      label: label.trim() || null,
      file_path: path,
      file_name: file.name,
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      verification_status: "pending_review",
    });

    if (dbError) {
      await supabase.storage.from("documents").remove([path]);
      setError(friendlyError(dbError));
      setLoading(false);
      return;
    }

    setFile(null);
    setLabel("");
    setExpiresAt("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    setLoading(false);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Document type"
          name="doc_type"
          value={docType}
          onChange={(e) => setDocType(e.target.value as DocumentType)}
        >
          {docTypes.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </Select>
        {currentScope === "vehicle" && vehicles.length > 0 && (
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
        <Input
          label="Expiration date"
          type="date"
          name="expires_at"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
          min={new Date().toISOString().slice(0, 10)}
        />
        <Input
          ref={fileInputRef}
          label="File"
          type="file"
          name="file"
          accept="image/jpeg,image/png,image/webp,image/heic,application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          required
        />
      </div>
      <div>
        <Button type="submit" loading={loading}>
          Upload
        </Button>
      </div>
    </form>
  );
}
