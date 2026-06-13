import { Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { AdminDriversTable } from "@/app/admin/AdminDriversTable";
import { driverDirectoryQuery } from "@/lib/driver-profiles";

export const dynamic = "force-dynamic";

export default async function AgentDriversPage() {
  const me = await requireRole(["agent", "admin"]);
  const supabase = createClient();

  const { data: drivers } = await driverDirectoryQuery(supabase);

  const driverIds = (drivers ?? []).map((driver) => driver.id);
  const { data: vehicles } =
    driverIds.length > 0
      ? await supabase
          .from("vehicles")
          .select("id, owner_id, plate_number, registration_country, brand, model, verification_status")
          .in("owner_id", driverIds)
          .order("created_at", { ascending: false })
      : { data: [] };

  const vehiclesByDriver = Object.fromEntries(
    driverIds.map((id) => [
      id,
      (vehicles ?? []).filter((vehicle) => vehicle.owner_id === id),
    ])
  );

  return (
    <div>
      <PageHeader
        title="Drivers"
        description="View driver profiles, documents, and registered vehicle plates."
      />
      <Card>
        <CardBody>
          {!drivers || drivers.length === 0 ? (
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

