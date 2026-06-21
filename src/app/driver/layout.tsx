import {
  LayoutDashboard,
  User,
  Car,
  AlertTriangle,
  Wallet,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import type { NavItem } from "@/components/dashboard/Sidebar";
import { DriverStatusBanner } from "@/components/dashboard/DriverStatusBanner";
import { requireDriverProfile } from "@/lib/auth";
import { loadProfilePhotoUrl } from "@/lib/queries/profile-photo";
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "@/i18n/server";

export default async function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requireDriverProfile();
  const { t } = await getTranslations();
  const supabase = await createClient();
  const avatarUrl = await loadProfilePhotoUrl(supabase, profile.id);

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
      accountHref="/driver/profile"
      avatarUrl={avatarUrl}
      banner={
        <DriverStatusBanner
          verificationStatus={profile.verification_status ?? "pending_documents"}
          adminMessage={profile.admin_message}
          onboardedAt={profile.onboarded_at}
        />
      }
    >
      {children}
    </DashboardShell>
  );
}
