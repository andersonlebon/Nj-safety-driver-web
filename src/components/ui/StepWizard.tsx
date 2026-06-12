"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  steps: string[];
  currentStep: number;
  onStepChange?: (index: number) => void;
  className?: string;
};

export function StepWizard({
  steps,
  currentStep,
  onStepChange,
  className,
}: Props) {
  return (
    <nav
      aria-label="Form progress"
      className={cn("mb-6", className)}
    >
      <ol className="flex items-center gap-1 sm:gap-2">
        {steps.map((label, index) => {
          const done = index < currentStep;
          const active = index === currentStep;
          const clickable = onStepChange && (done || active);

          return (
            <li key={label} className="flex flex-1 items-center min-w-0">
              <button
                type="button"
                disabled={!clickable}
                onClick={() => clickable && onStepChange?.(index)}
                className={cn(
                  "flex w-full flex-col items-center gap-1 min-w-0",
                  clickable ? "cursor-pointer" : "cursor-default"
                )}
              >
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold border-2 transition-colors",
                    done &&
                      "border-brand-600 bg-brand-600 text-white dark:border-brand-500 dark:bg-brand-500",
                    active &&
                      "border-gold-500 bg-gold-50 text-brand-800 dark:bg-gold-950/40 dark:text-gold-200 dark:border-gold-400",
                    !done &&
                      !active &&
                      "border-stone-300 text-stone-400 dark:border-slate-600 dark:text-slate-500"
                  )}
                >
                  {done ? <Check className="h-3.5 w-3.5" /> : index + 1}
                </span>
                <span
                  className={cn(
                    "text-[10px] sm:text-xs font-medium text-center truncate w-full px-0.5",
                    active
                      ? "text-brand-800 dark:text-brand-200"
                      : "text-stone-500 dark:text-slate-400"
                  )}
                >
                  {label}
                </span>
              </button>
              {index < steps.length - 1 && (
                <span
                  className={cn(
                    "hidden sm:block h-0.5 flex-1 mx-1 rounded-full min-w-[8px]",
                    index < currentStep
                      ? "bg-brand-500"
                      : "bg-stone-200 dark:bg-slate-700"
                  )}
                  aria-hidden
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function StepWizardFooter({
  step,
  totalSteps,
  onBack,
  onCancel,
  onNext,
  onSubmit,
  loading,
  nextLabel = "Continue",
  submitLabel = "Submit",
}: {
  step: number;
  totalSteps: number;
  onBack?: () => void;
  onCancel?: () => void;
  onNext?: () => void;
  onSubmit?: () => void;
  loading?: boolean;
  nextLabel?: string;
  submitLabel?: string;
}) {
  const isLast = step >= totalSteps - 1;

  return (
    <div className="flex justify-between gap-3 pt-2 border-t border-stone-200 dark:border-slate-800 mt-4">
      <button
        type="button"
        onClick={step === 0 ? onCancel : onBack}
        disabled={(step === 0 && !onCancel) || loading}
        className="text-sm font-medium text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-stone-200 disabled:opacity-40"
      >
        {step === 0 ? "Cancel" : "Back"}
      </button>
      {isLast ? (
        <button
          type="button"
          onClick={onSubmit}
          disabled={loading}
          className="btn-primary text-sm py-2 px-4"
        >
          {loading ? "Please wait…" : submitLabel}
        </button>
      ) : (
        <button
          type="button"
          onClick={onNext}
          disabled={loading}
          className="btn-primary text-sm py-2 px-4"
        >
          {nextLabel}
        </button>
      )}
    </div>
  );
}
