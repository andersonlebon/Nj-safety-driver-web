import { Car } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Alert } from "@/components/ui/Alert";
import { AdminVehiclesTable } from "@/app/admin/AdminVehiclesTable";
import { loadVehicleDirectoryPageData } from "@/lib/queries/vehicles";

export const dynamic = "force-dynamic";

export default async function AgentVehiclesPage() {
  await requireRole(["agent", "admin"]);
  const supabase = createClient();
  const { vehicles, ownerMap, photoUrls, error } =
    await loadVehicleDirectoryPageData(supabase);

  return (
    <div>
      <PageHeader
        title="Vehicles"
        description="View registered vehicles, plates, driver ownership, documents, and tracking context."
      />
      {error && (
        <div className="mb-4">
          <Alert variant="error">{error.message}</Alert>
        </div>
      )}
      <Card>
        <CardBody>
          {vehicles.length === 0 ? (
            <EmptyState
              icon={<Car className="h-8 w-8" />}
              title="No vehicles"
              description="Vehicles registered by drivers will appear here."
            />
          ) : (
            <AdminVehiclesTable
              vehicles={vehicles}
              ownerMap={ownerMap}
              photoUrls={photoUrls}
              canManageVehicles={false}
            />
          )}
        </CardBody>
      </Card>
    </div>
  );
}
