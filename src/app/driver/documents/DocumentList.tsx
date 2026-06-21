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
import { sha256File } from "@/lib/file-hash";
import { hasDuplicateDocumentHash } from "@/lib/document-duplicate";
import { useI18n } from "@/i18n/context";
import { documentExpiryLabel } from "@/i18n/labels";
import type { Database, DocumentType } from "@/lib/types/database";

type Doc = Database["public"]["Tables"]["documents"]["Row"];

type CategoryKey =
  | "identity"
  | "driver_license"
  | "vehicle_photos"
  | "vehicle_papers"
  | "other";

const CATEGORY_DEFS: {
  key: CategoryKey;
  titleKey: string;
  icon: typeof IdCard;
  match: (doc: Doc) => boolean;
}[] = [
  {
    key: "identity",
    titleKey: "driver.documents.legacyList.categoryIdentity",
    icon: IdCard,
    match: (d) => d.doc_type === "identity",
  },
  {
    key: "driver_license",
    titleKey: "driver.documents.legacyList.categoryDriverLicense",
    icon: CreditCard,
    match: (d) => d.doc_type === "driver_license",
  },
  {
    key: "vehicle_photos",
    titleKey: "driver.documents.legacyList.categoryVehiclePhotos",
    icon: Camera,
    match: (d) => d.doc_type === "vehicle_photo",
  },
  {
    key: "vehicle_papers",
    titleKey: "driver.documents.legacyList.categoryVehiclePapers",
    icon: FileText,
    match: (d) =>
      d.doc_type === "vehicle_registration" ||
      d.doc_type === "insurance" ||
      d.doc_type === "technical_inspection",
  },
  {
    key: "other",
    titleKey: "driver.documents.legacyList.categoryOther",
    icon: FileText,
    match: (d) => d.doc_type === "other",
  },
];

const DOC_TYPE_LABEL_KEYS: Record<DocumentType, string> = {
  identity: "driver.documents.legacyList.typeIdentity",
  driver_license: "driver.documents.legacyList.typeDriverLicense",
  insurance: "driver.documents.legacyList.typeInsurance",
  technical_inspection: "driver.documents.legacyList.typeInspection",
  vehicle_photo: "driver.documents.legacyList.typeVehiclePhoto",
  vehicle_registration: "driver.documents.legacyList.typeRegistration",
  passport: "driver.documents.legacyList.typePassport",
  other: "driver.documents.legacyList.typeOther",
};

function extOf(file: File): string {
  return file.name.split(".").pop()?.toLowerCase() || "bin";
}

function folderOfPath(filePath: string): string {
  const parts = filePath.split("/");
  parts.pop();
  return parts.join("/");
}

export function DocumentList({ documents }: { documents: Doc[] }) {
  const { t } = useI18n();
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [replaceTarget, setReplaceTarget] = useState<Doc | null>(null);
  const emptyValue = t("driver.infractions.emptyValue");

  const grouped = useMemo(() => {
    return CATEGORY_DEFS.map((c) => ({
      ...c,
      title: t(c.titleKey),
      docs: documents.filter(c.match),
    })).filter((c) => c.docs.length > 0);
  }, [documents, t]);

  const docTypeLabel = (docType: DocumentType) => t(DOC_TYPE_LABEL_KEYS[docType]);

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
    if (!confirm(t("driver.documents.legacyList.confirmDelete"))) return;
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
    const fileHash = await sha256File(file);
    const duplicate = await hasDuplicateDocumentHash(supabase, target.owner_id, fileHash, {
      excludeDocumentId: target.id,
      vehicleId: target.vehicle_id,
    });
    if (duplicate) {
      setError(t("driver.documents.legacyList.errorDuplicateFile"));
      setBusyId(null);
      return;
    }
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
      file_hash: fileHash,
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
                    <th className="py-2 px-3 font-medium">
                      {t("driver.documents.legacyList.columnType")}
                    </th>
                    <th className="py-2 px-3 font-medium">
                      {t("driver.documents.legacyList.columnLabel")}
                    </th>
                    <th className="py-2 px-3 font-medium">
                      {t("driver.documents.legacyList.columnFile")}
                    </th>
                    <th className="py-2 px-3 font-medium">
                      {t("driver.documents.legacyList.columnUploaded")}
                    </th>
                    <th className="py-2 px-3 font-medium">
                      {t("driver.documents.legacyList.columnExpiry")}
                    </th>
                    <th className="py-2 px-3 font-medium text-right">
                      {t("driver.documents.legacyList.columnActions")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {category.docs.map((d) => (
                    <tr
                      key={d.id}
                      className="border-t border-stone-100 dark:border-slate-800"
                    >
                      <td className="py-2 px-3 font-medium text-stone-900 dark:text-stone-100">
                        {docTypeLabel(d.doc_type)}
                      </td>
                      <td className="py-2 px-3 text-stone-600 dark:text-slate-400">
                        {d.label ?? emptyValue}
                      </td>
                      <td className="py-2 px-3 text-stone-700 dark:text-slate-300">
                        {d.file_name || d.file_path.split("/").pop()}
                      </td>
                      <td className="py-2 px-3 text-stone-700 dark:text-slate-300">
                        {formatDate(d.uploaded_at)}
                      </td>
                      <td className="py-2 px-3">
                        {(() => {
                          const exp = documentExpiryLabel(t, d.expires_at);
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
                            {t("driver.documents.legacyList.actionView")}
                          </Button>
                          <Button
                            variant="secondary"
                            type="button"
                            onClick={() => startReplace(d)}
                            loading={busyId === d.id}
                            title={t("driver.documents.legacyList.actionReplaceTitle")}
                          >
                            <RefreshCw className="h-4 w-4" />
                            {t("driver.documents.legacyList.actionReplace")}
                          </Button>
                          <Button
                            variant="danger"
                            type="button"
                            onClick={() => handleDelete(d)}
                            loading={busyId === d.id}
                            title={t("driver.documents.legacyList.actionDeleteTitle")}
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
        {t("driver.documents.legacyList.replaceHint")}
      </p>
    </div>
  );
}
