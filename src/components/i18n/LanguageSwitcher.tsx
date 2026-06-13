"use client";

import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/context";
import type { Locale } from "@/i18n/config";

export function LanguageSwitcher({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  const { locale, setLocale, t } = useI18n();

  const options: { value: Locale; label: string }[] = [
    { value: "en", label: t("language.english") },
    { value: "fr", label: t("language.french") },
  ];

  return (
    <div
      className={cn(
        "inline-flex rounded-lg border border-stone-200 bg-white/80 p-0.5 dark:border-slate-700 dark:bg-slate-900/80",
        className
      )}
      role="group"
      aria-label={t("language.label")}
    >
      {options.map((option) => {
        const active = locale === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setLocale(option.value)}
            aria-pressed={active}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-semibold transition-colors",
              compact && "px-2 py-0.5",
              active
                ? "bg-brand-700 text-white shadow-sm"
                : "text-stone-600 hover:text-stone-900 dark:text-slate-300 dark:hover:text-white"
            )}
          >
            {option.value.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
