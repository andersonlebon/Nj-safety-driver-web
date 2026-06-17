import { Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { requireRole } from "@/lib/auth";
import { parseTableQuery } from "@/lib/pagination";
import { loadDriverDirectoryPaginated } from "@/lib/queries/drivers";
import { AdminDriversTable } from "../AdminDriversTable";

export const dynamic = "force-dynamic";

export default async function AdminDriversPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const me = await requireRole(["admin", "agent"]);
  const supabase = createClient();
  const tableQuery = parseTableQuery(searchParams);
  const pageData = await loadDriverDirectoryPaginated(supabase, tableQuery);

  return (
    <div>
      <PageHeader
        title="Drivers"
        description="Review driver accounts. Click a row or View details to approve, reject, or change roles."
      />
      <Card>
        <CardBody>
          <AdminDriversTable
            pathname="/admin/drivers"
            query={pageData.query}
            totalCount={pageData.totalCount}
            drivers={pageData.rows}
            staffId={me.id}
            staffRole={me.role}
            vehiclesByDriver={pageData.vehiclesByDriver}
            canManageDrivers
          />
        </CardBody>
      </Card>
    </div>
  );
}
