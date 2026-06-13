import { Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireRole } from "@/lib/auth";
import { driverDirectoryQuery } from "@/lib/driver-profiles";
import { AdminDriversTable } from "../AdminDriversTable";

export const dynamic = "force-dynamic";

export default async function AdminDriversPage() {
  const me = await requireRole(["admin", "agent"]);
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
        description="Review driver accounts. Click a row or View details to approve, reject, or change roles."
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
              canManageDrivers
            />
          )}
        </CardBody>
      </Card>
    </div>
  );
}
