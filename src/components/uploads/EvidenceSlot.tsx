"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Check,
  FileText,
  Image as ImageIcon,
  Loader2,
  UploadCloud,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const MAX_EVIDENCE_BYTES = 10 * 1024 * 1024;

export const PHOTO_ACCEPT = "image/jpeg,image/png,image/webp,image/heic";
export const PHOTO_OR_PDF_ACCEPT = `${PHOTO_ACCEPT},application/pdf`;

export type EvidenceSlotStatus =
  | "idle"
  | "ready"
  | "uploading"
  | "uploaded"
  | "error";

export type EvidenceSlotValue = {
  file: File | null;
  previewUrl: string | null;
};

type Props = {
  title: string;
  description?: string;
  required?: boolean;
  accept?: string;
  maxBytes?: number;
  value: EvidenceSlotValue;
  onChange: (next: EvidenceSlotValue) => void;
  status?: EvidenceSlotStatus;
  errorMessage?: string;
  disabled?: boolean;
};

function bytesToMb(n: number) {
  return (n / (1024 * 1024)).toFixed(1);
}

function isImage(file: File | null): boolean {
  if (!file) return false;
  return file.type.startsWith("image/") && !file.type.includes("heic");
}

function isPdf(file: File | null): boolean {
  return !!file && file.type === "application/pdf";
}

export function EvidenceSlot({
  title,
  description,
  required,
  accept = PHOTO_OR_PDF_ACCEPT,
  maxBytes = MAX_EVIDENCE_BYTES,
  value,
  onChange,
  status = "idle",
  errorMessage,
  disabled,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const acceptedTypes = accept.split(",").map((s) => s.trim());

  useEffect(() => {
    return () => {
      if (value.previewUrl && value.previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(value.previewUrl);
      }
    };
  }, [value.previewUrl]);

  const accept_check = useCallback(
    (file: File): string | null => {
      if (file.size > maxBytes) {
        return `File is too large (${bytesToMb(file.size)} MB). Max ${bytesToMb(
          maxBytes
        )} MB.`;
      }
      const type = file.type || "";
      const matches = acceptedTypes.some((t) => {
        if (t.endsWith("/*")) return type.startsWith(t.slice(0, -1));
        return t === type;
      });
      if (!matches && type) {
        return "Unsupported file type. Use JPG, PNG, WEBP, HEIC, or PDF.";
      }
      return null;
    },
    [acceptedTypes, maxBytes]
  );

  const handleFile = useCallback(
    (file: File | null) => {
      setLocalError(null);
      if (!file) {
        onChange({ file: null, previewUrl: null });
        return;
      }
      const err = accept_check(file);
      if (err) {
        setLocalError(err);
        return;
      }
      const previewUrl = isImage(file) ? URL.createObjectURL(file) : null;
      onChange({ file, previewUrl });
    },
    [accept_check, onChange]
  );

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    const file = e.dataTransfer.files?.[0] ?? null;
    handleFile(file);
  };

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    handleFile(file);
    if (inputRef.current) inputRef.current.value = "";
  };

  const clearSelection = () => {
    setLocalError(null);
    onChange({ file: null, previewUrl: null });
  };

  const hasFile = Boolean(value.file);
  const isUploading = status === "uploading";
  const isDone = status === "uploaded";
  const isBusy = isUploading || disabled;
  const shownError = errorMessage ?? localError;

  return (
    <div
      className={cn(
        "rounded-xl border-2 border-dashed transition-colors",
        "border-stone-300 dark:border-slate-700",
        "bg-stone-50/40 dark:bg-slate-900/40",
        dragOver && "border-brand-500 bg-brand-50/60 dark:bg-brand-950/30",
        isDone && "border-brand-500/60 bg-brand-50/30 dark:bg-brand-950/20",
        shownError && "border-red-400 bg-red-50/40 dark:bg-red-950/20",
        isBusy && "opacity-90"
      )}
      onDragOver={(e) => {
        e.preventDefault();
        if (!isBusy) setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
    >
      <div className="p-3 sm:p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-medium text-stone-900 dark:text-stone-100">
              {title}
              {required ? (
                <span className="ml-1 text-red-500" aria-hidden>
                  *
                </span>
              ) : (
                <span className="ml-1.5 text-[10px] uppercase tracking-wider text-stone-400 dark:text-slate-500">
                  optional
                </span>
              )}
            </p>
            {description && (
              <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
                {description}
              </p>
            )}
          </div>
          {isDone && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-700 dark:text-brand-300">
              <Check className="h-3.5 w-3.5" />
              Uploaded
            </span>
          )}
        </div>

        <div className="relative rounded-lg overflow-hidden border border-stone-200/70 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="aspect-[4/3] w-full grid place-items-center text-stone-400 dark:text-slate-500">
            {hasFile && value.previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={value.previewUrl}
                alt={title}
                className="h-full w-full object-cover"
              />
            ) : hasFile && isPdf(value.file) ? (
              <div className="flex flex-col items-center gap-1 text-stone-500 dark:text-slate-400">
                <FileText className="h-8 w-8" />
                <span className="text-[11px]">PDF</span>
              </div>
            ) : hasFile ? (
              <div className="flex flex-col items-center gap-1 text-stone-500 dark:text-slate-400">
                <ImageIcon className="h-8 w-8" />
                <span className="text-[11px]">File ready</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={isBusy}
                className="flex flex-col items-center gap-1 px-3 py-4 text-center hover:text-stone-600 dark:hover:text-slate-300 transition-colors"
              >
                <UploadCloud className="h-7 w-7" />
                <span className="text-xs font-medium">
                  Drop or click to upload
                </span>
                <span className="text-[10px] text-stone-400 dark:text-slate-500">
                  JPG, PNG, WEBP, HEIC{accept.includes("pdf") ? ", or PDF" : ""} —
                  max {bytesToMb(maxBytes)} MB
                </span>
              </button>
            )}
          </div>

          {isUploading && (
            <div className="absolute inset-0 grid place-items-center bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-brand-700 dark:text-brand-300 text-xs font-medium">
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          <p className="min-w-0 truncate text-[11px] text-stone-500 dark:text-slate-400">
            {hasFile ? value.file!.name : "No file selected"}
          </p>
          <div className="flex items-center gap-1">
            {hasFile && (
              <button
                type="button"
                onClick={clearSelection}
                disabled={isBusy}
                className={cn(
                  "inline-flex items-center gap-1 text-[11px] font-medium",
                  "text-stone-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400",
                  "disabled:opacity-50"
                )}
                aria-label="Remove file"
              >
                <X className="h-3.5 w-3.5" />
                Remove
              </button>
            )}
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={isBusy}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-700 dark:text-brand-300 hover:text-brand-800 dark:hover:text-brand-200 disabled:opacity-50"
            >
              <UploadCloud className="h-3.5 w-3.5" />
              {hasFile ? "Replace" : "Choose file"}
            </button>
          </div>
        </div>

        {shownError && (
          <p className="text-xs text-red-600 dark:text-red-400">{shownError}</p>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={onPick}
        disabled={isBusy}
      />
    </div>
  );
}
