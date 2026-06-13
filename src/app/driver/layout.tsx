import {
  LayoutDashboard,
  User,
  Car,
  FileText,
  AlertTriangle,
  Wallet,
} from "lucide-react";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import type { NavItem } from "@/components/dashboard/Sidebar";
import { DriverStatusBanner } from "@/components/dashboard/DriverStatusBanner";
import { requireRole } from "@/lib/auth";
import { getTranslations } from "@/i18n/server";

export default async function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireRole(["driver", "admin"]);
  const { t } = await getTranslations();

  if (
    profile.role === "driver" &&
    profile.agent_application_status === "pending"
  ) {
    redirect("/register/agent/pending");
  }

  if (profile.role === "driver" && !profile.onboarded_at) {
    redirect("/onboarding");
  }

  const navItems: NavItem[] = [
    {
      href: "/driver",
      label: t("nav.overview"),
      icon: <LayoutDashboard className="h-4 w-4" />,
    },
    {
      href: "/driver/profile",
      label: t("nav.personalInfo"),
      icon: <User className="h-4 w-4" />,
    },
    {
      href: "/driver/vehicles",
      label: t("nav.vehicles"),
      icon: <Car className="h-4 w-4" />,
    },
    {
      href: "/driver/documents",
      label: t("nav.documents"),
      icon: <FileText className="h-4 w-4" />,
    },
    {
      href: "/driver/infractions",
      label: t("nav.infractions"),
      icon: <AlertTriangle className="h-4 w-4" />,
    },
    {
      href: "/driver/payments",
      label: t("nav.payments"),
      icon: <Wallet className="h-4 w-4" />,
    },
  ];

  return (
    <DashboardShell
      items={navItems}
      workspaceLabel={t("workspaces.driver")}
      title={t("dashboards.driver")}
      userName={profile.full_name}
      userEmail={profile.email}
      roleLabel={t("roles.driver")}
      banner={
        profile.role === "driver" ? (
          <DriverStatusBanner
            verificationStatus={profile.verification_status ?? "pending_documents"}
            adminMessage={profile.admin_message}
          />
        ) : null
      }
    >
      {children}
    </DashboardShell>
  );
}
