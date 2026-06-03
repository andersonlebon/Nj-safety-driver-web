"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { friendlyError } from "@/lib/errors";
import { requireRoleForAction } from "@/lib/auth";
import { isDomesticCountry } from "@/lib/countries";
import { normalizePlateForCountry } from "@/lib/vehicles";
import {
  TRANSIT_ID_DOC_TYPE,
  TRANSIT_ID_LABEL_BACK,
  TRANSIT_ID_LABEL_FRONT,
  assessTransitIdAuthenticity,
} from "@/lib/transit-id-documents";

export type AgentActionResult = { ok: true; vehicleId?: string } | { ok: false; error: string };

export async function logVehicleCheckIn(input: {
  plate: string;
  country?: string;
  vehicleId: string | null;
  location: string;
  notes: string | null;
}): Promise<AgentActionResult> {
  try {
    const auth = await requireRoleForAction(["agent", "admin"]);
    if ("ok" in auth) return auth;
    const agent = auth;

    const country = input.country ?? "GA";
    const plate = normalizePlateForCountry(input.plate, country);
    if (!plate) return { ok: false, error: "Invalid plate number." };
    if (!input.location.trim()) {
      return { ok: false, error: "Location is required." };
    }

    const supabase = createClient();
    const { error } = await supabase.from("vehicle_tracking_events").insert({
      vehicle_id: input.vehicleId,
      plate_number: plate,
      registration_country: country,
      event_type: "agent_checkin",
      location: input.location.trim(),
      recorded_by: agent.id,
      notes: input.notes,
    });

    if (error) return { ok: false, error: friendlyError(error) };

    revalidatePath("/agent/search");
    revalidatePath("/admin/tracking");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: friendlyError(err) };
  }
}

type TransitIdUpload = {
  file_path: string;
  file_name: string;
  expires_at?: string | null;
};

export async function registerBorderVehicle(input: {
  plate_number: string;
  registration_country: string;
  brand: string;
  model: string;
  color: string;
  year: string;
  border_checkpoint: string;
  transit_driver_name: string;
  transit_driver_phone: string;
  transit_passport_id: string;
  foreign_notes: string;
  id_documents: {
    front: TransitIdUpload;
    back: TransitIdUpload;
  };
}): Promise<AgentActionResult> {
  try {
    const auth = await requireRoleForAction(["agent", "admin"]);
    if ("ok" in auth) return auth;
    const agent = auth;

    const country = input.registration_country || "GA";
    const plate = normalizePlateForCountry(input.plate_number, country);
    if (!plate) return { ok: false, error: "Plate number is required." };
    if (!input.border_checkpoint.trim()) {
      return { ok: false, error: "Border checkpoint is required." };
    }
    if (!input.transit_driver_name.trim()) {
      return { ok: false, error: "Driver name is required for border registration." };
    }
    if (!input.transit_passport_id.trim()) {
      return { ok: false, error: "Passport or national ID number is required." };
    }
    const idCheck = assessTransitIdAuthenticity([
      { label: TRANSIT_ID_LABEL_FRONT, file_path: input.id_documents.front.file_path, file_name: input.id_documents.front.file_name },
      { label: TRANSIT_ID_LABEL_BACK, file_path: input.id_documents.back.file_path, file_name: input.id_documents.back.file_name },
    ]);
    if (!idCheck.complete) {
      return {
        ok: false,
        error: idCheck.warnings[0] ?? "Upload clear photos of both sides of the passport or ID.",
      };
    }

    const supabase = createClient();
    const { data: inserted, error } = await supabase
      .from("vehicles")
      .insert({
        owner_id: null,
        plate_number: plate,
        registration_country: country,
        is_foreign: !isDomesticCountry(country),
        is_border_transit: true,
        border_checkpoint: input.border_checkpoint.trim(),
        border_entry_at: new Date().toISOString(),
        transit_driver_name: input.transit_driver_name.trim(),
        transit_driver_phone: input.transit_driver_phone.trim() || null,
        transit_passport_id: input.transit_passport_id.trim() || null,
        foreign_notes: input.foreign_notes.trim() || null,
        brand: input.brand.trim() || null,
        model: input.model.trim() || null,
        color: input.color.trim() || null,
        year: input.year ? Number(input.year) : null,
        verification_status: "pending_review",
      })
      .select("id")
      .single();

    if (error) return { ok: false, error: friendlyError(error) };
    if (!inserted?.id) {
      return { ok: false, error: "Registration saved but no vehicle id was returned." };
    }

    const { error: trackingError } = await supabase
      .from("vehicle_tracking_events")
      .insert({
        vehicle_id: inserted.id,
        plate_number: plate,
        registration_country: country,
        event_type: "registration",
        location: input.border_checkpoint.trim(),
        recorded_by: agent.id,
        notes: "Border transit registration",
      });

    if (trackingError) {
      await supabase.from("vehicles").delete().eq("id", inserted.id);
      return {
        ok: false,
        error: `Vehicle registered but tracking log failed: ${friendlyError(trackingError)}`,
      };
    }

    const docRows = [
      {
        owner_id: agent.id,
        vehicle_id: inserted.id,
        doc_type: TRANSIT_ID_DOC_TYPE,
        label: TRANSIT_ID_LABEL_FRONT,
        file_path: input.id_documents.front.file_path,
        file_name: input.id_documents.front.file_name,
        expires_at: input.id_documents.front.expires_at ?? null,
        verification_status: "pending_review" as const,
      },
      {
        owner_id: agent.id,
        vehicle_id: inserted.id,
        doc_type: TRANSIT_ID_DOC_TYPE,
        label: TRANSIT_ID_LABEL_BACK,
        file_path: input.id_documents.back.file_path,
        file_name: input.id_documents.back.file_name,
        expires_at: input.id_documents.back.expires_at ?? null,
        verification_status: "pending_review" as const,
      },
    ];

    const { error: docsError } = await supabase.from("documents").insert(docRows);
    if (docsError) {
      await supabase.from("vehicles").delete().eq("id", inserted.id);
      return { ok: false, error: friendlyError(docsError) };
    }

    revalidatePath("/agent/border");
    revalidatePath("/agent/search");
    revalidatePath("/admin/vehicles");
    revalidatePath("/admin/tracking");
    return { ok: true, vehicleId: inserted.id };
  } catch (err) {
    return { ok: false, error: friendlyError(err) };
  }
}
