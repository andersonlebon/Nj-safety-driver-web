import {
  LayoutDashboard,
  Users,
  Car,
  ShieldCheck,
  AlertTriangle,
  Radar,
  Search,
} from "lucide-react";
import { Sidebar, type NavItem } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { requireRole } from "@/lib/auth";

const navItems: NavItem[] = [
  { href: "/admin", label: "Overview", icon: <LayoutDashboard className="h-4 w-4" /> },
  { href: "/admin/drivers", label: "Drivers", icon: <Users className="h-4 w-4" /> },
  { href: "/admin/vehicles", label: "Vehicles", icon: <Car className="h-4 w-4" /> },
  { href: "/admin/tracking", label: "Tracking", icon: <Radar className="h-4 w-4" /> },
  { href: "/admin/infractions", label: "Infractions", icon: <AlertTriangle className="h-4 w-4" /> },
  { href: "/agent/search", label: "Plate search", icon: <Search className="h-4 w-4" /> },
];

const adminOnlyNavItems: NavItem[] = [
  { href: "/admin/agents", label: "Agents", icon: <ShieldCheck className="h-4 w-4" /> },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireRole(["admin", "agent"]);
  const items =
    profile.role === "admin" ? [...navItems, ...adminOnlyNavItems] : navItems;
  const workspaceLabel =
    profile.role === "admin" ? "Administrator" : "Agent operations";
  const title = profile.role === "admin" ? "Admin dashboard" : "Staff dashboard";

  return (
    <div className="min-h-screen flex">
      <Sidebar items={items} workspaceLabel={workspaceLabel} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          title={title}
          userName={profile.full_name}
          userEmail={profile.email}
          roleLabel={profile.role === "admin" ? "Administrator" : "Field agent"}
        />
        <main className="flex-1 px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
