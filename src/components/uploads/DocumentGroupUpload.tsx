"use client";

import { Check } from "lucide-react";
import { Input } from "@/components/ui/Input";
import {
  EvidenceSlot,
  type EvidenceSlotStatus,
  type EvidenceSlotValue,
} from "@/components/uploads/EvidenceSlot";
import {
  documentRequiresExpiry,
  documentRequiresIssuedDate,
  todayIsoDate,
} from "@/lib/document-rules";
import {
  translateAttachmentTitle,
  translateDocumentGroupDescription,
  translateDocumentGroupTitle,
} from "@/lib/document-i18n";
import type {
  AttachmentDefinition,
  DocumentGroupDates,
  DocumentGroupDefinition,
} from "@/lib/document-definitions";
import { useI18n } from "@/i18n/context";
import { cn } from "@/lib/utils";

type Props = {
  group: DocumentGroupDefinition;
  required?: boolean;
  attachments: Record<string, EvidenceSlotValue>;
  statuses?: Record<string, EvidenceSlotStatus>;
  errors?: Record<string, string | undefined>;
  dates?: DocumentGroupDates;
  onAttachmentChange: (attachmentKey: string, value: EvidenceSlotValue) => void;
  onDatesChange?: (dates: DocumentGroupDates) => void;
  disabled?: boolean;
  className?: string;
};

function attachmentComplete(
  attachment: AttachmentDefinition,
  value: EvidenceSlotValue | undefined
): boolean {
  if (!attachment.required) return true;
  return Boolean(value?.file);
}

export function DocumentGroupUpload({
  group,
  required = false,
  attachments,
  statuses = {},
  errors = {},
  dates = { issuedAt: "", expiresAt: "" },
  onAttachmentChange,
  onDatesChange,
  disabled,
  className,
}: Props) {
  const { t } = useI18n();
  const showIssued = documentRequiresIssuedDate(group.docType);
  const showExpiry = documentRequiresExpiry(group.docType);
  const title = translateDocumentGroupTitle(group, t);
  const description = translateDocumentGroupDescription(group, t);
  const requiredAttachments = group.attachments.filter((item) =>
    required ? item.required : false
  );
  const uploadedRequired = requiredAttachments.filter((item) =>
    attachmentComplete(item, attachments[item.key])
  ).length;
  const allRequiredAttachments = group.attachments.filter((item) => item.required);
  const isComplete =
    allRequiredAttachments.every((item) => attachmentComplete(item, attachments[item.key])) &&
    (!showIssued || Boolean(dates.issuedAt)) &&
    (!showExpiry || Boolean(dates.expiresAt));

  return (
    <section
      className={cn(
        "rounded-xl border border-stone-200 bg-white/60 p-3.5 dark:border-slate-800 dark:bg-slate-900/40",
        isComplete && "border-brand-500/40 bg-brand-50/20 dark:bg-brand-950/10",
        className
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h5 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
            {title}
            {required ? (
              <span className="ml-1 text-red-500" aria-hidden>
                *
              </span>
            ) : (
              <span className="ml-1.5 text-[10px] uppercase tracking-wider text-stone-400 dark:text-slate-500">
                {t("common.optional")}
              </span>
            )}
          </h5>
          {description && (
            <p className="mt-0.5 text-xs text-stone-500 dark:text-slate-400">
              {description}
            </p>
          )}
        </div>
        {required && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-medium text-stone-600 dark:bg-slate-800 dark:text-slate-300">
            {isComplete ? (
              <>
                <Check className="h-3.5 w-3.5 text-brand-600" />
                {t("common.complete")}
              </>
            ) : (
              <>
                {uploadedRequired}/{requiredAttachments.length || allRequiredAttachments.length}{" "}
                {t("common.files")}
              </>
            )}
          </span>
        )}
      </div>

      {(showIssued || showExpiry) && (
        <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {showIssued && (
            <Input
              label={t("common.deliveredDate")}
              type="date"
              name={`${group.key}-issued-at`}
              value={dates.issuedAt}
              onChange={(e) =>
                onDatesChange?.({ ...dates, issuedAt: e.target.value })
              }
              max={todayIsoDate()}
              required={required}
              disabled={disabled}
            />
          )}
          {showExpiry && (
            <Input
              label={t("common.expirationDate")}
              type="date"
              name={`${group.key}-expires-at`}
              value={dates.expiresAt}
              onChange={(e) =>
                onDatesChange?.({ ...dates, expiresAt: e.target.value })
              }
              min={dates.issuedAt || todayIsoDate()}
              required={required}
              disabled={disabled}
            />
          )}
        </div>
      )}

      <div className="flex gap-3 overflow-x-auto pb-1">
        {group.attachments.map((attachment) => (
          <div
            key={attachment.key}
            className={cn(
              "min-w-[min(100%,18rem)] flex-1",
              group.attachments.length > 1 && "sm:min-w-[14rem] sm:max-w-[18rem]"
            )}
          >
            <EvidenceSlot
              layout="list"
              title={translateAttachmentTitle(attachment.key, attachment.title, t)}
              required={required && attachment.required}
              accept={attachment.accept}
              value={attachments[attachment.key] ?? { file: null, previewUrl: null }}
              onChange={(next) => onAttachmentChange(attachment.key, next)}
              status={statuses[attachment.key] ?? "idle"}
              errorMessage={errors[attachment.key]}
              disabled={disabled}
              compactPreview
            />
          </div>
        ))}
      </div>
    </section>
  );
}
