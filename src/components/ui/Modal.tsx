"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/context";
import {
  ModalSectionNav,
  type ModalSectionLink,
} from "@/components/ui/ModalSectionNav";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  /** Sticky footer — stays visible while the body scrolls */
  footer?: React.ReactNode;
  /** Quick-jump pills under the title (sticky with header) */
  sectionNav?: ModalSectionLink[];
};

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  className,
  footer,
  sectionNav,
}: Props) {
  const { t } = useI18n();
  const scrollBodyId = useId().replace(/:/g, "");
  const structured = Boolean(footer || sectionNav);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        aria-label={t("common.close")}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={cn(
          "relative z-10 w-full sm:rounded-2xl",
          "border border-stone-200/80 dark:border-slate-700/80",
          "bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-luxury",
          "ring-1 ring-brand-600/10 dark:ring-brand-500/15",
          structured
            ? "flex flex-col max-h-[min(92dvh,100%)] sm:max-h-[min(90vh,920px)] overflow-hidden"
            : "max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl",
          className
        )}
      >
        <div className="gabon-dialog-accent" aria-hidden />
        <div
          className={cn(
            "shrink-0 border-b border-stone-200 dark:border-slate-800 px-4 sm:px-5 py-4",
            structured && "bg-white/95 dark:bg-slate-900/95 backdrop-blur-md"
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h2
                id="modal-title"
                className="text-base font-semibold text-stone-900 dark:text-stone-100"
              >
                {title}
              </h2>
              {description && (
                <p className="text-sm text-stone-500 dark:text-slate-400 mt-0.5">
                  {description}
                </p>
              )}
              {sectionNav && sectionNav.length > 0 && (
                <ModalSectionNav
                  links={sectionNav}
                  scrollContainerId={scrollBodyId}
                />
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-lg p-1.5 text-stone-500 hover:bg-stone-100 dark:hover:bg-slate-800"
              aria-label={t("common.close")}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div
          id={scrollBodyId}
          className={cn(
            "px-4 sm:px-5 py-4",
            structured && "flex-1 overflow-y-auto overscroll-contain"
          )}
        >
          {children}
        </div>

        {footer && (
          <div
            className={cn(
              "shrink-0 border-t border-stone-200 dark:border-slate-800",
              "bg-white/95 dark:bg-slate-900/95 backdrop-blur-md",
              "px-4 sm:px-5 py-3 sm:py-4",
              "pb-[max(0.75rem,env(safe-area-inset-bottom))]"
            )}
          >
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
