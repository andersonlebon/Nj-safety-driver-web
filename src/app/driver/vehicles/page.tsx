import { Car } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireDriverProfile } from "@/lib/auth";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { AddVehicleDialog } from "./AddVehicleDialog";
import { VehicleList } from "./VehicleList";
import { signDocumentPaths } from "@/lib/storage-urls";
import { loadDriverVehicleLastLocations } from "@/lib/queries/vehicles";

export default async function DriverVehiclesPage() {
  const { profile } = await requireDriverProfile();
  const supabase = createClient();

  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("*")
    .eq("owner_id", profile.id)
    .order("created_at", { ascending: false });

  const vehicleIds = (vehicles ?? []).map((v) => v.id);
  const { data: photos } =
    vehicleIds.length > 0
      ? await supabase
          .from("documents")
          .select("vehicle_id, file_path")
          .in("vehicle_id", vehicleIds)
          .eq("doc_type", "vehicle_photo")
          .eq("label", "front")
      : { data: [] as { vehicle_id: string | null; file_path: string }[] };

  const photoPaths: Record<string, string> = {};
  for (const p of photos ?? []) {
    if (p.vehicle_id) photoPaths[p.vehicle_id] = p.file_path;
  }
  const signedPhotos = await signDocumentPaths(Object.values(photoPaths));
  const photoUrls: Record<string, string> = {};
  for (const [vehicleId, path] of Object.entries(photoPaths)) {
    photoUrls[vehicleId] = signedPhotos[path] ?? "";
  }

  const lastLocations = await loadDriverVehicleLastLocations(
    supabase,
    (vehicles ?? []).map((v) => ({ id: v.id, plate_number: v.plate_number }))
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vehicles"
        description="Register and manage your vehicles."
        actions={<AddVehicleDialog ownerId={profile.id} />}
      />

      <Card>
        <CardBody>
          <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 mb-4">
            Your vehicles
          </h3>
          {!vehicles || vehicles.length === 0 ? (
            <EmptyState
              icon={<Car className="h-8 w-8" />}
              title="No vehicles registered"
              description='Click "Add vehicle" to register your first car.'
            />
          ) : (
            <VehicleList
              vehicles={vehicles}
              photoUrls={photoUrls}
              lastLocations={lastLocations}
            />
          )}
        </CardBody>
      </Card>
    </div>
  );
}
