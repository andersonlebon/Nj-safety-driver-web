import { Car } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { parseTableQuery } from "@/lib/pagination";
import { AdminVehiclesTable } from "@/app/admin/AdminVehiclesTable";
import { loadVehicleDirectoryPaginated } from "@/lib/queries/vehicles";

export const dynamic = "force-dynamic";

export default async function AgentVehiclesPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  await requireRole(["agent", "admin"]);
  const supabase = createClient();
  const tableQuery = parseTableQuery(searchParams);
  const pageData = await loadVehicleDirectoryPaginated(supabase, tableQuery);

  return (
    <div>
      <PageHeader
        title="Vehicles"
        description="View registered vehicles, plates, driver ownership, documents, and tracking context."
      />
      {pageData.error && (
        <div className="mb-4">
          <Alert variant="error">{pageData.error.message}</Alert>
        </div>
      )}
      <Card>
        <CardBody>
          <AdminVehiclesTable
            pathname="/agent/vehicles"
            query={pageData.query}
            totalCount={pageData.totalCount}
            vehicles={pageData.rows}
            ownerMap={pageData.ownerMap}
            photoUrls={pageData.photoUrls}
            canManageVehicles={false}
          />
        </CardBody>
      </Card>
    </div>
  );
}
