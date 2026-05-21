import { Car } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { VehicleForm } from "./VehicleForm";
import { VehicleList } from "./VehicleList";

export default async function DriverVehiclesPage() {
  const profile = await getCurrentProfile();
  const supabase = createClient();

  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("*")
    .eq("owner_id", profile!.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vehicles"
        description="Register and manage your vehicles."
      />

      <Card>
        <CardBody>
          <h3 className="text-sm font-semibold text-slate-900 mb-4">
            Register a new vehicle
          </h3>
          <VehicleForm ownerId={profile!.id} />
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <h3 className="text-sm font-semibold text-slate-900 mb-4">
            Your vehicles
          </h3>
          {!vehicles || vehicles.length === 0 ? (
            <EmptyState
              icon={<Car className="h-8 w-8" />}
              title="No vehicles registered"
              description="Add your first vehicle using the form above."
            />
          ) : (
            <VehicleList vehicles={vehicles} />
          )}
        </CardBody>
      </Card>
    </div>
  );
}
