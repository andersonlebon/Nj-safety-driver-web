import {
  LayoutDashboard,
  User,
  Car,
  FileText,
  AlertTriangle,
  Wallet,
} from "lucide-react";
import { redirect } from "next/navigation";
import { Sidebar, type NavItem } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { requireRole } from "@/lib/auth";

const navItems: NavItem[] = [
  { href: "/driver", label: "Overview", icon: <LayoutDashboard className="h-4 w-4" /> },
  { href: "/driver/profile", label: "Personal info", icon: <User className="h-4 w-4" /> },
  { href: "/driver/vehicles", label: "Vehicles", icon: <Car className="h-4 w-4" /> },
  { href: "/driver/documents", label: "Documents", icon: <FileText className="h-4 w-4" /> },
  { href: "/driver/infractions", label: "Infractions", icon: <AlertTriangle className="h-4 w-4" /> },
  { href: "/driver/payments", label: "Payments", icon: <Wallet className="h-4 w-4" /> },
];

export default async function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireRole(["driver", "admin"]);

  if (profile.role === "driver" && !profile.onboarded_at) {
    redirect("/onboarding");
  }

  return (
    <div className="min-h-screen flex bg-stone-50 dark:bg-slate-950">
      <Sidebar items={navItems} workspaceLabel="Driver workspace" />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          title="Driver dashboard"
          userName={profile.full_name}
          userEmail={profile.email}
          roleLabel="Driver account"
        />
        <main className="flex-1 px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
