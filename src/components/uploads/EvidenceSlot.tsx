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
import { RequiredMark } from "@/components/ui/RequiredMark";
import { useI18n } from "@/i18n/context";
import {
  MAX_EVIDENCE_BYTES,
  PHOTO_ACCEPT,
  PHOTO_OR_PDF_ACCEPT,
} from "@/lib/upload-limits";

export { MAX_EVIDENCE_BYTES, PHOTO_ACCEPT, PHOTO_OR_PDF_ACCEPT };

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
  expiresAt?: string;
  onExpiresAtChange?: (value: string) => void;
  showExpiry?: boolean;
  disabled?: boolean;
  compactPreview?: boolean;
  layout?: "card" | "list";
};

function bytesToMb(n: number) {
  return (n / (1024 * 1024)).toFixed(1);
}

function previewUrlForFile(file: File): string | null {
  if (!file.type.startsWith("image/") || file.type === "application/pdf") {
    return null;
  }
  return URL.createObjectURL(file);
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
  expiresAt,
  onExpiresAtChange,
  showExpiry = false,
  disabled,
  compactPreview = true,
  layout = "card",
}: Props) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

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
        return t("evidence.unsupportedFileType");
      }
      return null;
    },
    [acceptedTypes, maxBytes, t]
  );

  const handleFile = useCallback(
    (file: File | null) => {
      setLocalError(null);
      if (!file) {
        setPreviewOpen(false);
        onChange({ file: null, previewUrl: null });
        return;
      }
      const err = accept_check(file);
      if (err) {
        setLocalError(err);
        return;
      }
      const previewUrl = previewUrlForFile(file);
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
    setPreviewOpen(false);
    onChange({ file: null, previewUrl: null });
  };

  const hasFile = Boolean(value.file);
  const hasRemotePreview = Boolean(!value.file && value.previewUrl);
  const hasSelection = hasFile || hasRemotePreview;
  const isUploading = status === "uploading";
  const isDone = status === "uploaded";
  const isBusy = isUploading || disabled;
  const shownError = errorMessage ?? localError;
  const isListLayout = layout === "list";
  const isRemotePdf =
    hasRemotePreview &&
    (value.previewUrl!.toLowerCase().includes(".pdf") ||
      value.previewUrl!.toLowerCase().includes("application/pdf"));

  const titleBlock = (
    <div className="min-w-0">
      <p className="text-sm font-medium text-stone-900 dark:text-stone-100">
        {title}
        {required ? <RequiredMark /> : (
          <span className="ml-1.5 text-[10px] uppercase tracking-wider text-stone-400 dark:text-slate-500">
            {t("common.optional")}
          </span>
        )}
      </p>
      {description && !isListLayout && (
        <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
          {description}
        </p>
      )}
    </div>
  );

  const openFilePicker = () => {
    if (!isBusy) inputRef.current?.click();
  };

  const previewBox = (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border border-stone-200/70 bg-white dark:border-slate-800 dark:bg-slate-900",
        isListLayout ? "aspect-square w-full" : "w-full"
      )}
    >
      <div
        className={cn(
          "grid h-full w-full place-items-center text-stone-400 dark:text-slate-500",
          !isListLayout && (compactPreview ? "h-28 sm:h-32" : "aspect-[4/3]")
        )}
      >
        {hasSelection && value.previewUrl && !isRemotePdf ? (
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="group relative h-full w-full"
            aria-label={t("evidence.previewAria", { title })}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value.previewUrl}
              alt={title}
              className="h-full w-full object-cover"
            />
            <span className="absolute inset-x-0 bottom-0 bg-black/55 px-1 py-0.5 text-[9px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
              {t("common.preview")}
            </span>
          </button>
        ) : hasSelection && (isPdf(value.file) || isRemotePdf) ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-0.5 bg-stone-100 text-stone-500 dark:bg-slate-800 dark:text-slate-400">
            <FileText className={cn(isListLayout ? "h-8 w-8" : "h-10 w-10")} />
            <span className="max-w-[90%] truncate px-2 text-[10px]">
              {value.file?.name}
            </span>
          </div>
        ) : hasFile ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-0.5 bg-stone-100 text-stone-500 dark:bg-slate-800 dark:text-slate-400">
            <ImageIcon className={cn(isListLayout ? "h-8 w-8" : "h-10 w-10")} />
            <span className="max-w-[90%] truncate px-2 text-[10px]">
              {value.file?.name}
            </span>
          </div>
        ) : (
          <button
            type="button"
            onClick={openFilePicker}
            disabled={isBusy}
            className={cn(
              "flex h-full w-full flex-col items-center justify-center gap-1 px-2 text-center transition-colors hover:bg-stone-50 hover:text-stone-600 dark:hover:bg-slate-800/80 dark:hover:text-slate-300",
              isListLayout ? "py-4" : compactPreview ? "py-3" : "py-4"
            )}
          >
            <UploadCloud className={cn(isListLayout ? "h-7 w-7" : "h-7 w-7")} />
            <span className="text-xs font-medium">{t("common.upload")}</span>
            {!isListLayout && (
              <span className="text-[10px] text-stone-400 dark:text-slate-500">
                {t("evidence.fileFormats", {
                  pdfSuffix: accept.includes("pdf")
                    ? t("evidence.fileFormatsPdfSuffix")
                    : "",
                  maxMb: bytesToMb(maxBytes),
                })}
              </span>
            )}
          </button>
        )}
      </div>

      {hasSelection && !isBusy && (
        <div className="absolute right-1.5 top-1.5 flex items-center gap-1">
          <button
            type="button"
            onClick={openFilePicker}
            className="rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] font-medium text-white hover:bg-black/70"
          >
            {t("common.replace")}
          </button>
          <button
            type="button"
            onClick={clearSelection}
            className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-black/55 text-white hover:bg-black/70"
            aria-label={t("evidence.removeFile")}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {isUploading && (
        <div className="absolute inset-0 grid place-items-center bg-white/70 backdrop-blur-sm dark:bg-slate-900/70">
          <Loader2 className="h-4 w-4 animate-spin text-brand-700 dark:text-brand-300" />
        </div>
      )}

      {isDone && !isUploading && (
        <div className="absolute left-1.5 top-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-white shadow-sm">
          <Check className="h-3.5 w-3.5" />
        </div>
      )}
    </div>
  );

  const actionRow =
    !isListLayout && hasSelection ? (
      <p className="truncate text-[11px] text-stone-500 dark:text-slate-400">
        {value.file?.name ?? t("evidence.uploaded")}
      </p>
    ) : null;

  const expiryField =
    showExpiry && hasFile && onExpiresAtChange ? (
      <div className={cn(isListLayout && "sm:max-w-xs")}>
        <label className="mb-1 block text-xs font-medium text-stone-700 dark:text-slate-300">
          {t("common.expirationDate")}
          {required ? <RequiredMark /> : (
            <span className="ml-1 font-normal text-stone-400 dark:text-slate-500">
              {t("evidence.recommended")}
            </span>
          )}
        </label>
        <input
          type="date"
          value={expiresAt ?? ""}
          onChange={(e) => onExpiresAtChange(e.target.value)}
          disabled={isBusy}
          className="input w-full text-sm"
          min={new Date().toISOString().slice(0, 10)}
        />
      </div>
    ) : null;

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
      {isListLayout ? (
        <div className="flex flex-col gap-2 p-3 sm:p-3.5">
          <div className="flex items-start justify-between gap-2">
            {titleBlock}
            {isDone && (
              <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-brand-700 dark:text-brand-300">
                <Check className="h-3.5 w-3.5" />
                {t("evidence.done")}
              </span>
            )}
          </div>
          {previewBox}
          {shownError && (
            <p className="text-xs text-red-600 dark:text-red-400">{shownError}</p>
          )}
          {expiryField}
        </div>
      ) : (
        <div className={cn("flex flex-col gap-3", compactPreview ? "p-3" : "p-3 sm:p-4")}>
          <div className="flex items-start justify-between gap-2">
            {titleBlock}
            {isDone && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-700 dark:text-brand-300">
                <Check className="h-3.5 w-3.5" />
                {t("evidence.uploaded")}
              </span>
            )}
          </div>

          {previewBox}
          {actionRow}

          {shownError && (
            <p className="text-xs text-red-600 dark:text-red-400">{shownError}</p>
          )}
          {expiryField}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={onPick}
        disabled={isBusy}
      />

      {previewOpen && value.previewUrl && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={t("evidence.previewDialogAria", { title })}
          onClick={() => setPreviewOpen(false)}
        >
          <div className="flex max-h-full max-w-full flex-col gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value.previewUrl}
              alt={title}
              className="max-h-[82vh] max-w-[92vw] rounded-lg object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              type="button"
              onClick={() => setPreviewOpen(false)}
              className="mx-auto inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-stone-900 shadow-lg hover:bg-stone-100"
            >
              <X className="h-4 w-4" />
              {t("evidence.closePreview")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
