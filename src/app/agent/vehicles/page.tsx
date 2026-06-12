import { Car } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Alert } from "@/components/ui/Alert";
import { AdminVehiclesTable } from "@/app/admin/AdminVehiclesTable";
import { signDocumentPaths } from "@/lib/storage-urls";
import type { Database } from "@/lib/types/database";

export const dynamic = "force-dynamic";

type Vehicle = Database["public"]["Tables"]["vehicles"]["Row"];

export default async function AgentVehiclesPage() {
  await requireRole(["agent", "admin"]);
  const supabase = createClient();

  const { data: vehicles, error } = await supabase
    .from("vehicles")
    .select("*")
    .order("created_at", { ascending: false });

  const ownerIds = [
    ...new Set(
      (vehicles ?? [])
        .map((vehicle) => vehicle.owner_id)
        .filter((id): id is string => id != null)
    ),
  ];
  const { data: owners } =
    ownerIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", ownerIds)
      : { data: [] as { id: string; full_name: string | null; email: string | null }[] };

  const ownerMap = Object.fromEntries((owners ?? []).map((owner) => [owner.id, owner]));

  const vehicleIds = (vehicles ?? []).map((vehicle) => vehicle.id);
  const { data: photos } =
    vehicleIds.length > 0
      ? await supabase
          .from("documents")
          .select("vehicle_id, file_path")
          .in("vehicle_id", vehicleIds)
          .eq("doc_type", "vehicle_photo")
          .eq("label", "front")
      : { data: [] as { vehicle_id: string | null; file_path: string }[] };

  const photoByVehicle: Record<string, string> = {};
  for (const photo of photos ?? []) {
    if (photo.vehicle_id) photoByVehicle[photo.vehicle_id] = photo.file_path;
  }

  const signed = await signDocumentPaths(Object.values(photoByVehicle));
  const photoUrls: Record<string, string> = {};
  for (const [vehicleId, path] of Object.entries(photoByVehicle)) {
    photoUrls[vehicleId] = signed[path] ?? "";
  }

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
          {!vehicles || vehicles.length === 0 ? (
            <EmptyState
              icon={<Car className="h-8 w-8" />}
              title="No vehicles"
              description="Vehicles registered by drivers will appear here."
            />
          ) : (
            <AdminVehiclesTable
              vehicles={vehicles as Vehicle[]}
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

