import { Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireStaffProfile } from "@/lib/auth";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { parseTableQuery } from "@/lib/pagination";
import { AdminDriversTable } from "@/app/staff/AdminDriversTable";
import { loadDriverDirectoryPaginated } from "@/lib/queries/drivers";
import { getTranslations } from "@/i18n/server";

export const dynamic = "force-dynamic";

export default async function AgentDriversPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const { profile: me, staffProfile } = await requireStaffProfile();
  const supabase = createClient();
  const tableQuery = parseTableQuery(searchParams);
  const pageData = await loadDriverDirectoryPaginated(supabase, tableQuery);
  const { t } = await getTranslations();

  return (
    <div>
      <PageHeader
        title={t("staff.drivers.page.title")}
        description={t("staff.drivers.page.description")}
      />
      <Card>
        <CardBody>
          <AdminDriversTable
            pathname="/staff/drivers"
            query={pageData.query}
            totalCount={pageData.totalCount}
            drivers={pageData.rows}
            staffId={me.id}
            staffName={me.full_name ?? me.email ?? t("staff.shared.staffMemberFallback")}
            staffRole={staffProfile.staff_role}
            vehiclesByDriver={pageData.vehiclesByDriver}
            canManageDrivers
          />
        </CardBody>
      </Card>
    </div>
  );
}
