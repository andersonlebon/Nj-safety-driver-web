"use client";

import { LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { useI18n } from "@/i18n/context";

export function Topbar({
  title,
  userName,
  userEmail,
  roleLabel,
}: {
  title: string;
  userName?: string | null;
  userEmail?: string | null;
  roleLabel: string;
}) {
  const { t } = useI18n();
  const displayName = userName?.trim() || userEmail || t("common.user");

  return (
    <header className="glass-panel border-b border-stone-200/80 dark:border-slate-800/80">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-stone-900 dark:text-stone-100">
            {title}
          </h1>
          <p className="text-xs text-stone-500 dark:text-slate-400">{roleLabel}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-stone-900 dark:text-stone-100">
              {displayName}
            </p>
            {userEmail && (
              <p className="text-xs text-stone-500 dark:text-slate-400">{userEmail}</p>
            )}
          </div>
          <LanguageSwitcher compact />
          <ThemeToggle />
          <form action="/auth/signout" method="POST">
            <button
              type="submit"
              className="btn-secondary"
              aria-label={t("common.signOut")}
              title={t("common.signOut")}
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">{t("common.signOut")}</span>
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
