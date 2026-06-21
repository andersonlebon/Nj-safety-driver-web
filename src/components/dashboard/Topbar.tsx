"use client";

import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { UserMenu } from "@/components/dashboard/UserMenu";
import type { ProfileSwitcherMode } from "@/lib/auth/user-menu-profile";

export function Topbar({
  title,
  userName,
  userEmail,
  roleLabel,
  accountHref,
  avatarUrl,
  profileSwitcherMode,
}: {
  title: string;
  userName?: string | null;
  userEmail?: string | null;
  roleLabel: string;
  accountHref: string;
  avatarUrl?: string | null;
  profileSwitcherMode?: ProfileSwitcherMode | null;
}) {
  return (
    <header className="glass-panel sticky top-0 z-[100] border-b border-stone-200/80 dark:border-slate-800/80">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-stone-900 dark:text-stone-100">
            {title}
          </h1>
          <p className="text-xs text-stone-500 dark:text-slate-400">{roleLabel}</p>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher compact />
          <ThemeToggle />
          <UserMenu
            userName={userName}
            userEmail={userEmail}
            roleLabel={roleLabel}
            accountHref={accountHref}
            avatarUrl={avatarUrl}
            profileSwitcherMode={profileSwitcherMode}
          />
        </div>
      </div>
    </header>
  );
}
