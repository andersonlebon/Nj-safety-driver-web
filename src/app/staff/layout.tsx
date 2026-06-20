import {
  LayoutDashboard,
  Search,
  AlertTriangle,
  Globe,
  Users,
  Car,
  ShieldCheck,
  Radar,
  ListChecks,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import type { NavItem } from "@/components/dashboard/Sidebar";
import { requireStaffProfile } from "@/lib/auth";
import { staffRoleLabel } from "@/lib/auth/profile-session";
import { getTranslations } from "@/i18n/server";

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile, staffProfile } = await requireStaffProfile();
  const { t } = await getTranslations();

  const isAdmin = staffProfile.staff_role === "admin";

  const sharedNav: NavItem[] = [
    {
      href: "/staff",
      label: t("nav.overview"),
      icon: <LayoutDashboard className="h-4 w-4" />,
    },
    {
      href: "/staff/search",
      label: t("nav.plateSearch"),
      icon: <Search className="h-4 w-4" />,
    },
    {
      href: "/staff/drivers",
      label: t("nav.drivers"),
      icon: <Users className="h-4 w-4" />,
    },
    {
      href: "/staff/vehicles",
      label: t("nav.vehicles"),
      icon: <Car className="h-4 w-4" />,
    },
    {
      href: "/staff/border",
      label: t("nav.borderControl"),
      icon: <Globe className="h-4 w-4" />,
    },
    {
      href: "/staff/infractions",
      label: t("nav.infractions"),
      icon: <AlertTriangle className="h-4 w-4" />,
    },
  ];

  const adminNav: NavItem[] = isAdmin
    ? [
        {
          href: "/staff/agents",
          label: t("nav.agents"),
          icon: <ShieldCheck className="h-4 w-4" />,
        },
        {
          href: "/staff/tracking",
          label: t("nav.tracking"),
          icon: <Radar className="h-4 w-4" />,
        },
        {
          href: "/staff/infraction-templates",
          label: t("nav.templates"),
          icon: <ListChecks className="h-4 w-4" />,
        },
      ]
    : [];

  const roleLabel = staffRoleLabel(staffProfile.staff_role);

  return (
    <DashboardShell
      items={[...sharedNav, ...adminNav]}
      workspaceLabel={isAdmin ? t("workspaces.admin") : t("workspaces.agent")}
      title={isAdmin ? t("dashboards.admin") : t("dashboards.agent")}
      userName={profile.full_name}
      userEmail={profile.email}
      roleLabel={roleLabel}
    >
      {children}
    </DashboardShell>
  );
}
