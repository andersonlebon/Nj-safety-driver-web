import { Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { parseTableQuery } from "@/lib/pagination";
import { AdminDriversTable } from "@/app/admin/AdminDriversTable";
import { loadDriverDirectoryPaginated } from "@/lib/queries/drivers";

export const dynamic = "force-dynamic";

export default async function AgentDriversPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const { profile: me, role: myRole } = await requireRole(["agent", "admin"]);
  const supabase = createClient();
  const tableQuery = parseTableQuery(searchParams);
  const pageData = await loadDriverDirectoryPaginated(supabase, tableQuery);

  return (
    <div>
      <PageHeader
        title="Drivers"
        description="View driver profiles, documents, and registered vehicle plates."
      />
      <Card>
        <CardBody>
          <AdminDriversTable
            pathname="/agent/drivers"
            query={pageData.query}
            totalCount={pageData.totalCount}
            drivers={pageData.rows}
            staffId={me.id}
            staffRole={myRole}
            vehiclesByDriver={pageData.vehiclesByDriver}
            canManageDrivers={false}
          />
        </CardBody>
      </Card>
    </div>
  );
}
