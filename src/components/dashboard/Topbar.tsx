import { LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

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
  const displayName = userName?.trim() || userEmail || "User";
  return (
    <header className="border-b border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-stone-900 dark:text-stone-100">
            {title}
          </h1>
          <p className="text-xs text-stone-500 dark:text-slate-400">{roleLabel}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium text-stone-900 dark:text-stone-100">
              {displayName}
            </p>
            {userEmail && (
              <p className="text-xs text-stone-500 dark:text-slate-400">{userEmail}</p>
            )}
          </div>
          <ThemeToggle />
          <form action="/auth/signout" method="POST">
            <button
              type="submit"
              className="btn-secondary"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
