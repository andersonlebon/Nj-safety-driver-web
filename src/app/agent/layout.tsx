import { LayoutDashboard, Search, AlertTriangle, Globe } from "lucide-react";
import { Sidebar, type NavItem } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { requireRole } from "@/lib/auth";

const navItems: NavItem[] = [
  { href: "/agent", label: "Overview", icon: <LayoutDashboard className="h-4 w-4" /> },
  { href: "/agent/search", label: "Plate search", icon: <Search className="h-4 w-4" /> },
  { href: "/agent/border", label: "Border transit", icon: <Globe className="h-4 w-4" /> },
  { href: "/agent/infractions", label: "Infractions", icon: <AlertTriangle className="h-4 w-4" /> },
];

export default async function AgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireRole(["agent", "admin"]);
  return (
    <div className="min-h-screen flex">
      <Sidebar items={navItems} workspaceLabel="Agent workspace" />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          title="Agent dashboard"
          userName={profile.full_name}
          userEmail={profile.email}
          roleLabel="Field agent"
        />
        <main className="flex-1 px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
