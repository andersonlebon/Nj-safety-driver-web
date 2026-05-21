"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Download } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { formatDate } from "@/lib/utils";
import type { Database, DocumentType } from "@/lib/types/database";

type Doc = Database["public"]["Tables"]["documents"]["Row"];

const labels: Record<DocumentType, string> = {
  identity: "Identity",
  driver_license: "Driving license",
  insurance: "Insurance",
  technical_inspection: "Technical inspection",
  other: "Other",
};

export function DocumentList({ documents }: { documents: Doc[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async (doc: Doc) => {
    setBusyId(doc.id);
    setError(null);
    const supabase = createClient();
    const { data, error: signError } = await supabase.storage
      .from("documents")
      .createSignedUrl(doc.file_path, 60);
    if (signError) {
      setError(signError.message);
      setBusyId(null);
      return;
    }
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
    setBusyId(null);
  };

  const handleDelete = async (doc: Doc) => {
    if (!confirm("Delete this document?")) return;
    setBusyId(doc.id);
    setError(null);
    const supabase = createClient();
    const { error: storageError } = await supabase.storage
      .from("documents")
      .remove([doc.file_path]);
    if (storageError && !storageError.message.toLowerCase().includes("not found")) {
      setError(storageError.message);
      setBusyId(null);
      return;
    }
    const { error: dbError } = await supabase
      .from("documents")
      .delete()
      .eq("id", doc.id);
    if (dbError) {
      setError(dbError.message);
      setBusyId(null);
      return;
    }
    setBusyId(null);
    router.refresh();
  };

  return (
    <div className="space-y-3">
      {error && <Alert variant="error">{error}</Alert>}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500 border-b border-slate-200">
            <tr>
              <th className="py-2 pr-4 font-medium">Type</th>
              <th className="py-2 pr-4 font-medium">File</th>
              <th className="py-2 pr-4 font-medium">Uploaded</th>
              <th className="py-2 pr-4 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {documents.map((d) => (
              <tr key={d.id} className="border-b border-slate-100 last:border-0">
                <td className="py-2 pr-4 font-medium text-slate-900">
                  {labels[d.doc_type]}
                </td>
                <td className="py-2 pr-4 text-slate-700">
                  {d.file_name || d.file_path.split("/").pop()}
                </td>
                <td className="py-2 pr-4 text-slate-700">
                  {formatDate(d.uploaded_at)}
                </td>
                <td className="py-2 pr-4 text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="secondary"
                      type="button"
                      onClick={() => handleDownload(d)}
                      loading={busyId === d.id}
                    >
                      <Download className="h-4 w-4" />
                      View
                    </Button>
                    <Button
                      variant="danger"
                      type="button"
                      onClick={() => handleDelete(d)}
                      loading={busyId === d.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
