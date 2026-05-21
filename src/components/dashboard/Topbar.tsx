import { LogOut } from "lucide-react";

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
    <header className="border-b border-slate-200 bg-white">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
          <p className="text-xs text-slate-500">{roleLabel}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium text-slate-900">{displayName}</p>
            {userEmail && (
              <p className="text-xs text-slate-500">{userEmail}</p>
            )}
          </div>
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
