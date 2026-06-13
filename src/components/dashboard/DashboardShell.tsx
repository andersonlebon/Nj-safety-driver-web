import type { ReactNode } from "react";
import { Sidebar, type NavItem } from "@/components/dashboard/Sidebar";
import { MobileNav } from "@/components/dashboard/MobileNav";
import { Topbar } from "@/components/dashboard/Topbar";

export function DashboardShell({
  items,
  workspaceLabel,
  title,
  userName,
  userEmail,
  roleLabel,
  banner,
  children,
}: {
  items: NavItem[];
  workspaceLabel: string;
  title: string;
  userName?: string | null;
  userEmail?: string | null;
  roleLabel: string;
  banner?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen flex pb-[4.5rem] md:pb-0">
      <Sidebar items={items} workspaceLabel={workspaceLabel} />
      <MobileNav items={items} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          title={title}
          userName={userName}
          userEmail={userEmail}
          roleLabel={roleLabel}
        />
        <main className="flex-1 px-4 sm:px-6 py-6">
          {banner}
          {children}
        </main>
      </div>
    </div>
  );
}
