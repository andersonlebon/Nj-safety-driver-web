"use client";

import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { useI18n } from "@/i18n/context";

export function LandingNavbar() {
  const { t } = useI18n();

  return (
    <header className="sticky top-0 z-10 glass-panel border-b border-stone-200/80 dark:border-slate-800/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2.5 shrink-0 min-w-0">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-700 text-white shadow-sm ring-1 ring-brand-600/20">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-stone-900 dark:text-stone-100 tracking-tight leading-tight truncate">
              {t("app.legacyName")}
            </p>
            <p className="text-xs text-stone-500 dark:text-stone-400 leading-tight truncate hidden sm:block">
              {t("app.tagline")}
            </p>
          </div>
        </Link>

        <nav className="flex items-center gap-2 shrink-0">
          <LanguageSwitcher className="shrink-0" />
          <ThemeToggle />
          <Link
            href="/login"
            className="btn-secondary text-sm hidden sm:inline-flex"
          >
            {t("landing.header.login")}
          </Link>
          <Link href="/register" className="btn-primary text-sm whitespace-nowrap">
            {t("landing.header.register")}
          </Link>
        </nav>
      </div>
    </header>
  );
}
