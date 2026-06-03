import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { VehicleDetailContent } from "@/components/vehicles/VehicleDetailContent";
import { signDocumentPaths } from "@/lib/storage-urls";
import type { TrackingEvent } from "@/lib/tracking";

export default async function DriverVehicleDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const profile = await requireRole(["driver", "admin"]);
  const supabase = createClient();

  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (!vehicle || vehicle.owner_id !== profile.id) {
    notFound();
  }

  const country = vehicle.registration_country ?? "GA";

  const [{ data: photoDoc }, { data: infractions }, { data: trackingRows }] =
    await Promise.all([
      supabase
        .from("documents")
        .select("file_path")
        .eq("vehicle_id", vehicle.id)
        .eq("doc_type", "vehicle_photo")
        .eq("label", "front")
        .maybeSingle(),
      supabase
        .from("infractions")
        .select("*")
        .eq("plate_number", vehicle.plate_number)
        .eq("registration_country", country)
        .order("created_at", { ascending: false }),
      supabase
        .from("vehicle_tracking_events")
        .select("*")
        .eq("plate_number", vehicle.plate_number)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

  let photoUrl: string | null = null;
  if (photoDoc?.file_path) {
    const signed = await signDocumentPaths([photoDoc.file_path]);
    photoUrl = signed[photoDoc.file_path] ?? null;
  }

  const trackingEvents: TrackingEvent[] = (trackingRows ?? []).map((e) => ({
    id: e.id,
    event_type: e.event_type,
    location: e.location,
    latitude: e.latitude != null ? Number(e.latitude) : null,
    longitude: e.longitude != null ? Number(e.longitude) : null,
    notes: e.notes,
    created_at: e.created_at,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title={vehicle.plate_number}
        description="Vehicle registration, fines, and tracking history."
        actions={
          <Link
            href="/driver/vehicles"
            className="inline-flex items-center gap-1.5 text-sm text-brand-700 dark:text-brand-300 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to vehicles
          </Link>
        }
      />

      <Card>
        <CardBody>
          <VehicleDetailContent
            vehicle={vehicle}
            photoUrl={photoUrl}
            infractions={infractions ?? []}
            trackingEvents={trackingEvents}
            showOwner={false}
          />
        </CardBody>
      </Card>
    </div>
  );
}
