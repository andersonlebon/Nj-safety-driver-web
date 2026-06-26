import { Car } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireStaffProfile } from "@/lib/auth";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { parseTableQuery } from "@/lib/pagination";
import { AdminVehiclesTable } from "@/app/staff/AdminVehiclesTable";
import { loadVehicleDirectoryPaginated } from "@/lib/queries/vehicles";
import { getTranslations } from "@/i18n/server";

export const dynamic = "force-dynamic";

export default async function AgentVehiclesPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const { profile: me } = await requireStaffProfile();
  const supabase = createClient();
  const tableQuery = parseTableQuery(searchParams);
  const pageData = await loadVehicleDirectoryPaginated(supabase, tableQuery);
  const openVehicleRaw = searchParams?.openVehicle;
  const openVehicleId = Array.isArray(openVehicleRaw)
    ? openVehicleRaw[0]
    : openVehicleRaw;
  const { t } = await getTranslations();

  return (
    <div>
      <PageHeader
        title={t("staff.vehicles.page.title")}
        description={t("staff.vehicles.page.description")}
      />
      {pageData.error && (
        <div className="mb-4">
          <Alert variant="error">{pageData.error.message}</Alert>
        </div>
      )}
      <Card>
        <CardBody>
          <AdminVehiclesTable
            pathname="/staff/vehicles"
            query={pageData.query}
            totalCount={pageData.totalCount}
            vehicles={pageData.rows}
            ownerMap={pageData.ownerMap}
            photoUrls={pageData.photoUrls}
            canManageVehicles
            staffName={me.full_name ?? me.email ?? t("staff.shared.staffMemberFallback")}
            initialOpenVehicleId={openVehicleId || undefined}
          />
        </CardBody>
      </Card>
    </div>
  );
}
