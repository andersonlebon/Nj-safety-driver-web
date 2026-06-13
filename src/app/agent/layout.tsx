import { LayoutDashboard, Search, AlertTriangle, Globe, Users, Car } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import type { NavItem } from "@/components/dashboard/Sidebar";
import { requireRole } from "@/lib/auth";
import { getTranslations } from "@/i18n/server";

export default async function AgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireRole(["agent", "admin"]);
  const { t } = await getTranslations();

  const navItems: NavItem[] = [
    {
      href: "/agent",
      label: t("nav.overview"),
      icon: <LayoutDashboard className="h-4 w-4" />,
    },
    {
      href: "/agent/search",
      label: t("nav.plateSearch"),
      icon: <Search className="h-4 w-4" />,
    },
    {
      href: "/agent/drivers",
      label: t("nav.drivers"),
      icon: <Users className="h-4 w-4" />,
    },
    {
      href: "/agent/vehicles",
      label: t("nav.vehicles"),
      icon: <Car className="h-4 w-4" />,
    },
    {
      href: "/agent/border",
      label: t("nav.borderControl"),
      icon: <Globe className="h-4 w-4" />,
    },
    {
      href: "/agent/infractions",
      label: t("nav.infractions"),
      icon: <AlertTriangle className="h-4 w-4" />,
    },
  ];

  return (
    <DashboardShell
      items={navItems}
      workspaceLabel={t("workspaces.agent")}
      title={t("dashboards.agent")}
      userName={profile.full_name}
      userEmail={profile.email}
      roleLabel={t("roles.agent")}
    >
      {children}
    </DashboardShell>
  );
}
