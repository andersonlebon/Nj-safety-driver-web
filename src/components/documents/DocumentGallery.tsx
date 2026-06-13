"use client";

import { useState } from "react";
import { FileText, ExternalLink } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { friendlyError } from "@/lib/errors";
import {
  DOC_TYPE_LABELS,
  documentTitle,
  formatDocumentDate,
  groupTitle,
  type DocRow,
  type DocumentGroupWithAttachments,
} from "@/lib/documents-display";

type Props = {
  title?: string;
  documents?: DocRow[];
  documentGroups?: DocumentGroupWithAttachments[];
  /** Pre-signed URLs keyed by file_path (server-provided) */
  signedUrls?: Record<string, string>;
  emptyMessage?: string;
  compact?: boolean;
};

export function DocumentGallery({
  title = "Documents",
  documents = [],
  documentGroups,
  signedUrls = {},
  emptyMessage = "No documents uploaded yet.",
  compact = false,
}: Props) {
  const [error, setError] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);

  const groups =
    documentGroups ??
    Object.entries(
      documents.reduce<Record<string, DocumentGroupWithAttachments>>((acc, doc) => {
        const key = `${doc.doc_type}:${doc.vehicle_id ?? "driver"}`;
        if (!acc[key]) {
          acc[key] = {
            id: key,
            doc_type: doc.doc_type,
            issued_at: null,
            expires_at: doc.expires_at,
            verification_status: doc.verification_status,
            vehicle_id: doc.vehicle_id,
            attachments: [],
          };
        }
        acc[key].attachments.push(doc);
        return acc;
      }, {})
    ).map(([, group]) => group);

  const openDoc = async (doc: DocRow) => {
    const cached = signedUrls[doc.file_path];
    if (cached) {
      if (cached.match(/\.(jpg|jpeg|png|webp|gif)/i) || doc.file_path.match(/\.(jpg|jpeg|png|webp)/i)) {
        setLightbox(cached);
      } else {
        window.open(cached, "_blank", "noopener,noreferrer");
      }
      return;
    }
    const supabase = createClient();
    const { data, error: signError } = await supabase.storage
      .from("documents")
      .createSignedUrl(doc.file_path, 3600);
    if (signError) {
      setError(friendlyError(signError));
      return;
    }
    const url = data?.signedUrl;
    if (!url) return;
    if (url.match(/\.(jpg|jpeg|png|webp)/i) || doc.file_name?.match(/\.(jpg|jpeg|png|webp)/i)) {
      setLightbox(url);
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  if (groups.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-stone-200 dark:border-slate-700 p-4 text-sm text-stone-500 dark:text-slate-400">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">{title}</p>
      {error && <Alert variant="error">{error}</Alert>}
      <div className={compact ? "space-y-3" : "space-y-3"}>
        {groups.map((group) => (
          <div
            key={group.id}
            className="rounded-lg border border-stone-200 dark:border-slate-800 p-3 bg-stone-50/40 dark:bg-slate-900/40"
          >
            <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-xs font-medium text-stone-500 dark:text-slate-400">
                  {groupTitle(group)}
                </p>
                {(group.issued_at || group.expires_at) && (
                  <p className="mt-1 text-[11px] text-stone-500 dark:text-slate-400">
                    {formatDocumentDate(group.issued_at)
                      ? `Delivered ${formatDocumentDate(group.issued_at)}`
                      : null}
                    {formatDocumentDate(group.issued_at) &&
                    formatDocumentDate(group.expires_at)
                      ? " · "
                      : null}
                    {formatDocumentDate(group.expires_at)
                      ? `Expires ${formatDocumentDate(group.expires_at)}`
                      : null}
                  </p>
                )}
              </div>
              <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-stone-600 dark:bg-slate-800 dark:text-slate-300">
                {group.attachments.length} attachment
                {group.attachments.length === 1 ? "" : "s"}
              </span>
            </div>
            <ul className="space-y-2">
              {group.attachments.map((doc) => {
                const thumb = signedUrls[doc.file_path];
                const isImage =
                  thumb &&
                  (thumb.includes("image") ||
                    doc.file_name?.match(/\.(jpg|jpeg|png|webp)/i) ||
                    doc.file_path.match(/\.(jpg|jpeg|png|webp)/i));

                return (
                  <li key={doc.id} className="flex gap-2 items-start">
                    {isImage && thumb ? (
                      <button
                        type="button"
                        onClick={() => setLightbox(thumb)}
                        className="h-14 w-20 shrink-0 rounded overflow-hidden border border-stone-200 dark:border-slate-700"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={thumb} alt="" className="h-full w-full object-cover" />
                      </button>
                    ) : (
                      <div className="h-14 w-20 shrink-0 rounded border border-stone-200 dark:border-slate-700 grid place-items-center text-stone-400">
                        <FileText className="h-5 w-5" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-stone-800 dark:text-slate-200 truncate">
                        {documentTitle(doc)}
                      </p>
                      <Button
                        type="button"
                        variant="secondary"
                        className="mt-1 text-[11px] py-1 px-2"
                        onClick={() => openDoc(doc)}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-[110] bg-black/85 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-modal
        >
          <div className="flex max-h-full max-w-full flex-col gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightbox}
              alt="Document"
              className="min-h-0 max-h-[80vh] max-w-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <div
              className="flex justify-center gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                type="button"
                variant="secondary"
                onClick={() => setLightbox(null)}
              >
                Cancel
              </Button>
              <Button type="button" onClick={() => setLightbox(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
