import {
  LayoutDashboard,
  Users,
  Car,
  ShieldCheck,
  AlertTriangle,
  Radar,
  ListChecks,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import type { NavItem } from "@/components/dashboard/Sidebar";
import { requireRole } from "@/lib/auth";
import { getTranslations } from "@/i18n/server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireRole(["admin"]);
  const { t } = await getTranslations();

  const navItems: NavItem[] = [
    {
      href: "/admin",
      label: t("nav.overview"),
      icon: <LayoutDashboard className="h-4 w-4" />,
    },
    {
      href: "/admin/drivers",
      label: t("nav.drivers"),
      icon: <Users className="h-4 w-4" />,
    },
    {
      href: "/admin/vehicles",
      label: t("nav.vehicles"),
      icon: <Car className="h-4 w-4" />,
    },
    {
      href: "/admin/tracking",
      label: t("nav.tracking"),
      icon: <Radar className="h-4 w-4" />,
    },
    {
      href: "/admin/infractions",
      label: t("nav.infractions"),
      icon: <AlertTriangle className="h-4 w-4" />,
    },
    {
      href: "/admin/infraction-templates",
      label: t("nav.templates"),
      icon: <ListChecks className="h-4 w-4" />,
    },
  ];

  const adminOnlyNavItems: NavItem[] = [
    {
      href: "/admin/agents",
      label: t("nav.agents"),
      icon: <ShieldCheck className="h-4 w-4" />,
    },
  ];

  const items = [...navItems, ...adminOnlyNavItems];

  return (
    <DashboardShell
      items={items}
      workspaceLabel={t("workspaces.admin")}
      title={t("dashboards.admin")}
      userName={profile.full_name}
      userEmail={profile.email}
      roleLabel={t("roles.admin")}
    >
      {children}
    </DashboardShell>
  );
}
