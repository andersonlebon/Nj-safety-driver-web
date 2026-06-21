import { createClient } from "@/lib/supabase/client";
import type { TrackingEvent } from "@/lib/tracking";
import {
  TRANSIT_ID_DOC_TYPE,
  TRANSIT_ID_LABEL_BACK,
  TRANSIT_ID_LABEL_FRONT,
  type TransitIdDocRow,
  type TransitIdDocUrls,
} from "@/lib/transit-id-documents";
import {
  VEHICLE_OWNER_PROFILE_SELECT,
  type VehicleOwnerProfile,
} from "@/lib/vehicle-owner-profile";
import { DEFAULT_COUNTRY } from "@/lib/countries";
import type { Database, TransactionStatus } from "@/lib/types/database";

type Vehicle = Database["public"]["Tables"]["vehicles"]["Row"];
type Infraction = Database["public"]["Tables"]["infractions"]["Row"];

export type StaffVehicleDetailBundle = {
  vehicle: Vehicle;
  photoUrl: string | null;
  owner: VehicleOwnerProfile | null;
  infractions: Infraction[];
  transactionStatusByInfraction: Record<string, TransactionStatus>;
  trackingEvents: TrackingEvent[];
  transitIdDocuments: TransitIdDocRow[];
  transitIdUrls: TransitIdDocUrls;
};

export async function fetchStaffVehicleDetailBundle(input: {
  plateNumber: string;
  registrationCountry?: string | null;
  vehicleId?: string | null;
}): Promise<StaffVehicleDetailBundle | null> {
  const supabase = createClient();
  const country = input.registrationCountry?.trim() || DEFAULT_COUNTRY;

  let vehicle: Vehicle | null = null;

  if (input.vehicleId) {
    const { data } = await supabase
      .from("vehicles")
      .select("*")
      .eq("id", input.vehicleId)
      .maybeSingle();
    vehicle = data;
  }

  if (!vehicle) {
    const { data } = await supabase
      .from("vehicles")
      .select("*")
      .eq("plate_number", input.plateNumber)
      .eq("registration_country", country)
      .maybeSingle();
    vehicle = data;
  }

  if (!vehicle) return null;

  const resolvedCountry = vehicle.registration_country ?? country;

  const [{ data: inf }, { data: tracking }, { data: idDocs }, { data: photoDoc }, ownerResult] =
    await Promise.all([
      supabase
        .from("infractions")
        .select("*")
        .eq("plate_number", vehicle.plate_number)
        .eq("registration_country", resolvedCountry)
        .order("created_at", { ascending: false }),
      supabase
        .from("vehicle_tracking_events")
        .select("*")
        .eq("plate_number", vehicle.plate_number)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("documents")
        .select("label, file_path, file_name, verification_status")
        .eq("vehicle_id", vehicle.id)
        .eq("doc_type", TRANSIT_ID_DOC_TYPE),
      supabase
        .from("documents")
        .select("file_path")
        .eq("vehicle_id", vehicle.id)
        .eq("doc_type", "vehicle_photo")
        .eq("label", "front")
        .maybeSingle(),
      vehicle.owner_id
        ? supabase
            .from("profiles")
            .select(VEHICLE_OWNER_PROFILE_SELECT)
            .eq("id", vehicle.owner_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

  const infractions = inf ?? [];
  const infractionIds = infractions.map((row) => row.id);
  let transactionStatusByInfraction: Record<string, TransactionStatus> = {};

  if (infractionIds.length > 0) {
    const { data: transactions } = await supabase
      .from("transactions")
      .select("infraction_id, status")
      .in("infraction_id", infractionIds);
    transactionStatusByInfraction = Object.fromEntries(
      (transactions ?? []).map((transaction) => [
        transaction.infraction_id,
        transaction.status,
      ])
    );
  }

  const docs = (idDocs ?? []) as TransitIdDocRow[];
  const paths = [
    ...docs.map((doc) => doc.file_path).filter(Boolean),
    ...(photoDoc?.file_path ? [photoDoc.file_path] : []),
  ];
  const signedEntries = await Promise.all(
    paths.map(async (path) => {
      const { data } = await supabase.storage
        .from("documents")
        .createSignedUrl(path, 3600);
      return [path, data?.signedUrl ?? ""] as const;
    })
  );
  const signed = Object.fromEntries(signedEntries);

  const frontPath = docs.find((doc) => doc.label === TRANSIT_ID_LABEL_FRONT)?.file_path;
  const backPath = docs.find((doc) => doc.label === TRANSIT_ID_LABEL_BACK)?.file_path;

  return {
    vehicle,
    photoUrl: photoDoc?.file_path ? signed[photoDoc.file_path] ?? null : null,
    owner: (ownerResult.data as VehicleOwnerProfile | null) ?? null,
    infractions,
    transactionStatusByInfraction,
    trackingEvents: (tracking ?? []).map((event) => ({
      id: event.id,
      event_type: event.event_type,
      location: event.location,
      latitude: event.latitude != null ? Number(event.latitude) : null,
      longitude: event.longitude != null ? Number(event.longitude) : null,
      notes: event.notes,
      created_at: event.created_at,
    })),
    transitIdDocuments: docs,
    transitIdUrls: {
      front: frontPath ? signed[frontPath] ?? null : null,
      back: backPath ? signed[backPath] ?? null : null,
    },
  };
}
