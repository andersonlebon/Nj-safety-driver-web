import { Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { AdminDriversTable } from "@/app/admin/AdminDriversTable";
import { loadDriverDirectoryPageData } from "@/lib/queries/drivers";

export const dynamic = "force-dynamic";

export default async function AgentDriversPage() {
  const me = await requireRole(["agent", "admin"]);
  const supabase = createClient();
  const { drivers, vehiclesByDriver } = await loadDriverDirectoryPageData(supabase);

  return (
    <div>
      <PageHeader
        title="Drivers"
        description="View driver profiles, documents, and registered vehicle plates."
      />
      <Card>
        <CardBody>
          {drivers.length === 0 ? (
            <EmptyState
              icon={<Users className="h-8 w-8" />}
              title="No drivers"
              description="Driver accounts will appear here once people register."
            />
          ) : (
            <AdminDriversTable
              drivers={drivers}
              staffId={me.id}
              staffRole={me.role}
              vehiclesByDriver={vehiclesByDriver}
              canManageDrivers={false}
            />
          )}
        </CardBody>
      </Card>
    </div>
  );
}
