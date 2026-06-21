"use client";

import { Check, CircleDashed, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { RequiredMark } from "@/components/ui/RequiredMark";
import type { DocumentListSection } from "@/lib/document-group-upload-state";
import { useI18n } from "@/i18n/context";
import { cn } from "@/lib/utils";

type Props = {
  sections: DocumentListSection[];
  onUpload: (targetId: string) => void;
};

export function RequiredDocumentsList({ sections, onUpload }: Props) {
  const { t } = useI18n();

  return (
    <div className="space-y-5">
      {sections.map((section) => (
        <div key={section.id}>
          <h3 className="mb-2 text-sm font-semibold text-stone-900 dark:text-stone-100">
            {section.title}
          </h3>
          <ul className="overflow-hidden rounded-xl border border-stone-200 dark:border-slate-800 divide-y divide-stone-200 dark:divide-slate-800">
            {section.items.map((item) => (
              <li
                key={item.id}
                className="flex flex-col gap-3 bg-white/60 px-4 py-3 dark:bg-slate-900/40 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <p className="text-sm font-medium text-stone-900 dark:text-stone-100">
                      {item.title}
                      {item.required ? <RequiredMark /> : (
                        <span className="ml-1.5 text-[10px] uppercase tracking-wider text-stone-400 dark:text-slate-500">
                          {t("common.optional")}
                        </span>
                      )}
                    </p>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
                        item.isComplete
                          ? "bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300"
                          : item.uploadedCount > 0
                            ? "bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-200"
                            : "bg-stone-100 text-stone-600 dark:bg-slate-800 dark:text-slate-300"
                      )}
                    >
                      {item.isComplete ? (
                        <>
                          <Check className="h-3 w-3" />
                          {t("common.complete")}
                        </>
                      ) : item.uploadedCount > 0 ? (
                        t("documents.partialUpload", {
                          done: item.uploadedCount,
                          total: item.requiredCount,
                        })
                      ) : (
                        <>
                          <CircleDashed className="h-3 w-3" />
                          {t("documents.notUploaded")}
                        </>
                      )}
                    </span>
                  </div>
                  {item.description && (
                    <p className="mt-0.5 text-xs text-stone-500 dark:text-slate-400">
                      {item.description}
                    </p>
                  )}
                </div>

                <div className="shrink-0">
                  <Button
                    type="button"
                    variant={item.isComplete ? "secondary" : undefined}
                    onClick={() => onUpload(item.id)}
                  >
                    {item.isComplete ? (
                      t("documents.replaceDocument")
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-1.5" />
                        {t("common.upload")}
                      </>
                    )}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
