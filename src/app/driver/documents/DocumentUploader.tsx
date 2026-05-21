"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import type { DocumentType } from "@/lib/types/database";

const docTypes: { value: DocumentType; label: string }[] = [
  { value: "identity", label: "Identity document" },
  { value: "driver_license", label: "Driving license" },
  { value: "insurance", label: "Insurance" },
  { value: "technical_inspection", label: "Technical inspection" },
  { value: "other", label: "Other" },
];

export function DocumentUploader({ ownerId }: { ownerId: string }) {
  const router = useRouter();
  const [docType, setDocType] = useState<DocumentType>("identity");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please choose a file to upload.");
      return;
    }
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const ext = file.name.split(".").pop() || "bin";
    const path = `${ownerId}/${docType}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(path, file, { cacheControl: "3600", upsert: false });

    if (uploadError) {
      setError(uploadError.message);
      setLoading(false);
      return;
    }

    const { error: dbError } = await supabase.from("documents").insert({
      owner_id: ownerId,
      doc_type: docType,
      file_path: path,
      file_name: file.name,
    });

    if (dbError) {
      setError(dbError.message);
      setLoading(false);
      return;
    }

    setFile(null);
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
        <Input
          ref={fileInputRef}
          label="File"
          type="file"
          name="file"
          accept="image/*,application/pdf"
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
