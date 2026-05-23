import {
  LayoutDashboard,
  Users,
  Car,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { Sidebar, type NavItem } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { requireRole } from "@/lib/auth";

const navItems: NavItem[] = [
  { href: "/admin", label: "Overview", icon: <LayoutDashboard className="h-4 w-4" /> },
  { href: "/admin/drivers", label: "Drivers", icon: <Users className="h-4 w-4" /> },
  { href: "/admin/vehicles", label: "Vehicles", icon: <Car className="h-4 w-4" /> },
  { href: "/admin/agents", label: "Agents", icon: <ShieldCheck className="h-4 w-4" /> },
  { href: "/admin/infractions", label: "Infractions", icon: <AlertTriangle className="h-4 w-4" /> },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireRole(["admin"]);
  return (
    <div className="min-h-screen flex bg-stone-50 dark:bg-slate-950">
      <Sidebar items={navItems} workspaceLabel="Administrator" />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          title="Admin dashboard"
          userName={profile.full_name}
          userEmail={profile.email}
          roleLabel="Administrator"
        />
        <main className="flex-1 px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
