import { requireStaffProfile } from "@/lib/auth";
import { AdminOverviewPage } from "./AdminOverviewPage";
import { AgentOverviewPage } from "./AgentOverviewPage";

export default async function StaffOverviewPage() {
  const { staffProfile } = await requireStaffProfile();

  if (staffProfile.staff_role === "admin") {
    return <AdminOverviewPage />;
  }

  return <AgentOverviewPage />;
}
