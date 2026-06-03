"use client";

import { useState } from "react";
import { ShieldCheck, ShieldAlert } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import {
  assessTransitIdAuthenticity,
  type TransitIdDocRow,
  type TransitIdDocUrls,
} from "@/lib/transit-id-documents";

type Props = {
  passportNumber?: string | null;
  documents: TransitIdDocRow[];
  urls: TransitIdDocUrls;
  /** When true, show admin-oriented authenticity checklist */
  showAuthenticityCheck?: boolean;
};

function IdImage({
  label,
  url,
  onOpen,
}: {
  label: string;
  url: string | null;
  onOpen: (url: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-stone-600 dark:text-slate-400">{label}</p>
      <button
        type="button"
        onClick={() => url && onOpen(url)}
        disabled={!url}
        className="aspect-[3/2] w-full rounded-lg overflow-hidden border border-stone-200 dark:border-slate-700 bg-stone-100 dark:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={label} className="h-full w-full object-cover" />
        ) : (
          <span className="grid h-full min-h-[5rem] place-items-center text-xs text-stone-400">
            Not uploaded
          </span>
        )}
      </button>
    </div>
  );
}

export function TransitIdDocumentGallery({
  passportNumber,
  documents,
  urls,
  showAuthenticityCheck = false,
}: Props) {
  const [lightbox, setLightbox] = useState<string | null>(null);
  const check = assessTransitIdAuthenticity(documents);

  if (!passportNumber && documents.length === 0) return null;

  return (
    <div className="rounded-lg border border-stone-200 dark:border-slate-800 p-4 space-y-3 bg-stone-50/50 dark:bg-slate-900/40">
      <div className="flex items-start gap-2">
        {check.complete ? (
          <ShieldCheck className="h-4 w-4 text-brand-700 dark:text-brand-400 shrink-0 mt-0.5" />
        ) : (
          <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        )}
        <div>
          <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
            Passport / ID verification
          </p>
          {passportNumber && (
            <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5 font-mono">
              No. {passportNumber}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <IdImage
          label="Front (photo page)"
          url={urls.front}
          onOpen={setLightbox}
        />
        <IdImage
          label="Back (security / barcode)"
          url={urls.back}
          onOpen={setLightbox}
        />
      </div>

      {showAuthenticityCheck && (
        <div className="text-xs space-y-1.5">
          <p className="font-medium text-stone-700 dark:text-slate-300">
            Authenticity checklist
          </p>
          <ul className="list-disc pl-4 text-stone-600 dark:text-slate-400 space-y-0.5">
            <li className={check.frontOnFile ? "text-brand-700 dark:text-brand-300" : ""}>
              Front of document on file {check.frontOnFile ? "✓" : "—"}
            </li>
            <li className={check.backOnFile ? "text-brand-700 dark:text-brand-300" : ""}>
              Back of document on file {check.backOnFile ? "✓" : "—"}
            </li>
            <li>Compare name and photo on front with the driver present</li>
            <li>Confirm security features on the back match the document type</li>
          </ul>
        </div>
      )}

      {check.warnings.length > 0 && (
        <Alert variant="warning">
          {check.warnings.join(" ")}
        </Alert>
      )}

      {lightbox && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"
          role="dialog"
          aria-modal
          onClick={() => setLightbox(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox}
            alt="ID document"
            className="max-h-full max-w-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
