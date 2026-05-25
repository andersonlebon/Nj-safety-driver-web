"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  CreditCard,
  Download,
  FileText,
  IdCard,
  RefreshCw,
  Trash2,
  Upload,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { friendlyError } from "@/lib/errors";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { formatDate } from "@/lib/utils";
import { documentExpiryState } from "@/lib/verification";
import type { Database, DocumentType } from "@/lib/types/database";

type Doc = Database["public"]["Tables"]["documents"]["Row"];

const labels: Record<DocumentType, string> = {
  identity: "National ID",
  driver_license: "Driver's license",
  insurance: "Insurance",
  technical_inspection: "Technical inspection",
  vehicle_photo: "Vehicle photo",
  vehicle_registration: "Vehicle registration",
  other: "Other",
};

type CategoryKey =
  | "identity"
  | "driver_license"
  | "vehicle_photos"
  | "vehicle_papers"
  | "other";

const CATEGORIES: {
  key: CategoryKey;
  title: string;
  icon: typeof IdCard;
  match: (doc: Doc) => boolean;
}[] = [
  {
    key: "identity",
    title: "Identity",
    icon: IdCard,
    match: (d) => d.doc_type === "identity",
  },
  {
    key: "driver_license",
    title: "Driver's license",
    icon: CreditCard,
    match: (d) => d.doc_type === "driver_license",
  },
  {
    key: "vehicle_photos",
    title: "Vehicle photos",
    icon: Camera,
    match: (d) => d.doc_type === "vehicle_photo",
  },
  {
    key: "vehicle_papers",
    title: "Vehicle papers",
    icon: FileText,
    match: (d) =>
      d.doc_type === "vehicle_registration" ||
      d.doc_type === "insurance" ||
      d.doc_type === "technical_inspection",
  },
  {
    key: "other",
    title: "Other",
    icon: FileText,
    match: (d) => d.doc_type === "other",
  },
];

function extOf(file: File): string {
  return file.name.split(".").pop()?.toLowerCase() || "bin";
}

function folderOfPath(filePath: string): string {
  const parts = filePath.split("/");
  parts.pop();
  return parts.join("/");
}

export function DocumentList({ documents }: { documents: Doc[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [replaceTarget, setReplaceTarget] = useState<Doc | null>(null);

  const grouped = useMemo(() => {
    return CATEGORIES.map((c) => ({
      ...c,
      docs: documents.filter(c.match),
    })).filter((c) => c.docs.length > 0);
  }, [documents]);

  const handleDownload = async (doc: Doc) => {
    setBusyId(doc.id);
    setError(null);
    const supabase = createClient();
    const { data, error: signError } = await supabase.storage
      .from("documents")
      .createSignedUrl(doc.file_path, 60);
    if (signError) {
      setError(friendlyError(signError));
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
    if (
      storageError &&
      !storageError.message.toLowerCase().includes("not found")
    ) {
      setError(friendlyError(storageError));
      setBusyId(null);
      return;
    }
    const { error: dbError } = await supabase
      .from("documents")
      .delete()
      .eq("id", doc.id);
    if (dbError) {
      setError(friendlyError(dbError));
      setBusyId(null);
      return;
    }
    setBusyId(null);
    router.refresh();
  };

  const startReplace = (doc: Doc) => {
    setError(null);
    setReplaceTarget(doc);
    replaceInputRef.current?.click();
  };

  const handleReplacePick = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0] ?? null;
    e.target.value = "";
    const target = replaceTarget;
    setReplaceTarget(null);
    if (!file || !target) return;

    setBusyId(target.id);
    setError(null);
    const supabase = createClient();
    const ext = extOf(file);
    const folder = folderOfPath(target.file_path);
    const base = target.label
      ? `${target.doc_type}-${target.label}`
      : target.doc_type;
    const newPath = `${folder}/${base}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(newPath, file, { cacheControl: "3600", upsert: false });
    if (uploadError) {
      setError(friendlyError(uploadError));
      setBusyId(null);
      return;
    }

    const { error: insertError } = await supabase.from("documents").insert({
      owner_id: target.owner_id,
      vehicle_id: target.vehicle_id,
      doc_type: target.doc_type,
      label: target.label,
      file_path: newPath,
      file_name: file.name,
      expires_at: target.expires_at,
      verification_status: "pending_review",
    });
    if (insertError) {
      await supabase.storage.from("documents").remove([newPath]);
      setError(friendlyError(insertError));
      setBusyId(null);
      return;
    }

    await supabase.storage.from("documents").remove([target.file_path]);
    await supabase.from("documents").delete().eq("id", target.id);

    setBusyId(null);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {error && <Alert variant="error">{error}</Alert>}

      <input
        ref={replaceInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,application/pdf"
        className="hidden"
        onChange={handleReplacePick}
      />

      {grouped.map((category) => {
        const Icon = category.icon;
        return (
          <section key={category.key} className="space-y-2">
            <div className="flex items-center gap-2">
              <Icon
                className="h-4 w-4 text-brand-700 dark:text-brand-300"
                aria-hidden
              />
              <h4 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                {category.title}
              </h4>
              <span className="text-xs text-stone-500 dark:text-slate-400">
                ({category.docs.length})
              </span>
            </div>
            <div className="overflow-x-auto rounded-lg border border-stone-200 dark:border-slate-800">
              <table className="w-full text-sm">
                <thead className="text-left bg-stone-50/60 dark:bg-slate-900/60 text-stone-500 dark:text-slate-400">
                  <tr>
                    <th className="py-2 px-3 font-medium">Type</th>
                    <th className="py-2 px-3 font-medium">Label</th>
                    <th className="py-2 px-3 font-medium">File</th>
                    <th className="py-2 px-3 font-medium">Uploaded</th>
                    <th className="py-2 px-3 font-medium">Expiry</th>
                    <th className="py-2 px-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {category.docs.map((d) => (
                    <tr
                      key={d.id}
                      className="border-t border-stone-100 dark:border-slate-800"
                    >
                      <td className="py-2 px-3 font-medium text-stone-900 dark:text-stone-100">
                        {labels[d.doc_type]}
                      </td>
                      <td className="py-2 px-3 text-stone-600 dark:text-slate-400">
                        {d.label ?? "—"}
                      </td>
                      <td className="py-2 px-3 text-stone-700 dark:text-slate-300">
                        {d.file_name || d.file_path.split("/").pop()}
                      </td>
                      <td className="py-2 px-3 text-stone-700 dark:text-slate-300">
                        {formatDate(d.uploaded_at)}
                      </td>
                      <td className="py-2 px-3">
                        {(() => {
                          const exp = documentExpiryState(d.expires_at);
                          return (
                            <span
                              className={
                                exp.variant === "error"
                                  ? "badge-unpaid"
                                  : exp.variant === "warning"
                                    ? "badge-pending"
                                    : exp.variant === "success"
                                      ? "badge-paid"
                                      : "text-stone-500 dark:text-slate-400 text-xs"
                              }
                            >
                              {exp.label}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="py-2 px-3">
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
                            variant="secondary"
                            type="button"
                            onClick={() => startReplace(d)}
                            loading={busyId === d.id}
                            title="Replace this file"
                          >
                            <RefreshCw className="h-4 w-4" />
                            Replace
                          </Button>
                          <Button
                            variant="danger"
                            type="button"
                            onClick={() => handleDelete(d)}
                            loading={busyId === d.id}
                            title="Delete this document"
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
          </section>
        );
      })}

      <p className="text-xs text-stone-500 dark:text-slate-400 flex items-center gap-1.5">
        <Upload className="h-3.5 w-3.5" />
        Use “Replace” to keep the same slot but swap the file — the old version is
        removed automatically.
      </p>
    </div>
  );
}
