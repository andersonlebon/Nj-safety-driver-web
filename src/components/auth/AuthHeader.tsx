"use client";

import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { useI18n } from "@/i18n/context";

export function AuthHeader() {
  const { t } = useI18n();

  return (
    <header className="glass-panel border-b border-stone-200/80 dark:border-slate-800/80">
      <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-700 text-white shadow-sm ring-1 ring-brand-600/20">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <span className="font-semibold text-stone-900 dark:text-stone-100 tracking-tight">
            {t("app.legacyName")}
          </span>
          <span className="hidden sm:inline text-xs text-stone-500 dark:text-slate-400 ml-1">
            — {t("app.tagline")}
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <LanguageSwitcher compact />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
