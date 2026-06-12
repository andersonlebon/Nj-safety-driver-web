"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { friendlyError } from "@/lib/errors";
import { requireRoleForAction } from "@/lib/auth";
import { isDomesticCountry } from "@/lib/countries";
import { normalizePlateForCountry } from "@/lib/vehicles";
import type { FileInfractionInput } from "@/lib/infractions";
import { findInfractionTemplate } from "@/lib/infraction-templates";
import {
  TRANSIT_ID_DOC_TYPE,
  TRANSIT_ID_LABEL_BACK,
  TRANSIT_ID_LABEL_FRONT,
  assessTransitIdAuthenticity,
} from "@/lib/transit-id-documents";
import type { PaymentStatus } from "@/lib/types/database";

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
  vehicle_id: string;
  border_checkpoint: string;
  foreign_notes: string;
  id_documents?: {
    front: TransitIdUpload;
    back: TransitIdUpload;
  } | null;
  border_direction?: "entry" | "exit";
}): Promise<AgentActionResult> {
  try {
    const auth = await requireRoleForAction(["agent", "admin"]);
    if ("ok" in auth) return auth;
    const agent = auth;

    if (!input.vehicle_id) {
      return { ok: false, error: "Select an existing driver vehicle." };
    }
    if (!input.border_checkpoint.trim()) {
      return { ok: false, error: "Border checkpoint is required." };
    }
    const supabase = createClient();
    const { data: vehicle } = await supabase
      .from("vehicles")
      .select("id, owner_id, plate_number, registration_country")
      .eq("id", input.vehicle_id)
      .not("owner_id", "is", null)
      .maybeSingle();

    if (!vehicle) {
      return {
        ok: false,
        error: "Border crossings must be linked to an existing driver vehicle.",
      };
    }

    const country = vehicle.registration_country || "GA";
    const plate = normalizePlateForCountry(vehicle.plate_number, country);
    if (!plate) return { ok: false, error: "Vehicle plate is invalid." };

    const { error } = await supabase
      .from("vehicles")
      .update({
        is_foreign: !isDomesticCountry(country),
        is_border_transit: true,
        border_checkpoint: input.border_checkpoint.trim(),
        border_entry_at: new Date().toISOString(),
        foreign_notes: input.foreign_notes.trim() || null,
        verification_status: "pending_review",
      })
      .eq("id", vehicle.id);

    if (error) return { ok: false, error: friendlyError(error) };

    const { error: trackingError } = await supabase
      .from("vehicle_tracking_events")
      .insert({
        vehicle_id: vehicle.id,
        plate_number: plate,
        registration_country: country,
        event_type: "registration",
        location: input.border_checkpoint.trim(),
        recorded_by: agent.id,
        notes: input.border_direction
          ? `Border ${input.border_direction}: ${input.border_checkpoint.trim()}`
          : "Border transit registration",
      });

    if (trackingError) {
      return {
        ok: false,
        error: `Border crossing saved but tracking log failed: ${friendlyError(trackingError)}`,
      };
    }

    if (input.id_documents?.front && input.id_documents?.back) {
      const idCheck = assessTransitIdAuthenticity([
        { label: TRANSIT_ID_LABEL_FRONT, file_path: input.id_documents.front.file_path, file_name: input.id_documents.front.file_name },
        { label: TRANSIT_ID_LABEL_BACK, file_path: input.id_documents.back.file_path, file_name: input.id_documents.back.file_name },
      ]);
      if (idCheck.complete) {
        const documentOwnerId = vehicle.owner_id ?? agent.id;
        const docRows = [
          {
            owner_id: documentOwnerId,
            vehicle_id: vehicle.id,
            doc_type: TRANSIT_ID_DOC_TYPE,
            label: TRANSIT_ID_LABEL_FRONT,
            file_path: input.id_documents.front.file_path,
            file_name: input.id_documents.front.file_name,
            expires_at: input.id_documents.front.expires_at ?? null,
            verification_status: "pending_review" as const,
          },
          {
            owner_id: documentOwnerId,
            vehicle_id: vehicle.id,
            doc_type: TRANSIT_ID_DOC_TYPE,
            label: TRANSIT_ID_LABEL_BACK,
            file_path: input.id_documents.back.file_path,
            file_name: input.id_documents.back.file_name,
            expires_at: input.id_documents.back.expires_at ?? null,
            verification_status: "pending_review" as const,
          },
        ];
        await supabase.from("documents").insert(docRows);
      }
    }

    revalidatePath("/agent/border");
    revalidatePath("/agent/search");
    revalidatePath("/admin/vehicles");
    revalidatePath("/admin/tracking");
    return { ok: true, vehicleId: vehicle.id };
  } catch (err) {
    return { ok: false, error: friendlyError(err) };
  }
}

/** Only agents and admins may file infractions (enforced server-side). */
export async function fileInfraction(
  input: FileInfractionInput
): Promise<AgentActionResult> {
  try {
    const auth = await requireRoleForAction(["agent", "admin"]);
    if ("ok" in auth) return auth;
    const staff = auth;

    const country = input.registration_country || "GA";
    const plate = normalizePlateForCountry(input.plate_number, country);
    if (!plate) return { ok: false, error: "Plate number is required." };
    if (!input.infraction_type.trim()) {
      return { ok: false, error: "Infraction type is required." };
    }
    const supabase = createClient();
    const { data: dbTemplate } = await supabase
      .from("infraction_templates")
      .select("code, label, amount, points, category, active")
      .eq("code", input.infraction_template_code)
      .eq("active", true)
      .maybeSingle();
    const template = dbTemplate ?? findInfractionTemplate(input.infraction_template_code);
    if (!template) {
      return { ok: false, error: "Select a valid infraction template." };
    }
    if (
      input.infraction_type !== template.label ||
      Number(input.fine_amount) !== Number(template.amount)
    ) {
      return {
        ok: false,
        error: "Infraction amount must match the selected prebuilt template.",
      };
    }

    const infractionStatus: PaymentStatus =
      input.status === "paid" ? "paid" : "unpaid";
    const { data: inserted, error } = await supabase
      .from("infractions")
      .insert({
        plate_number: plate,
        registration_country: country,
        vehicle_id: input.vehicle_id,
        driver_id: input.driver_id,
        agent_id: staff.id,
        infraction_type: template.label,
        description: input.description.trim() || null,
        location: input.location.trim() || null,
        fine_amount: Number(template.amount),
        status: infractionStatus,
        evidence_path: input.evidence_path,
      })
      .select("id")
      .single();

    if (error) return { ok: false, error: friendlyError(error) };

    if (inserted?.id) {
      const { error: transactionError } = await supabase
        .from("transactions")
        .insert({
          infraction_id: inserted.id,
          amount: Number(template.amount),
          status: input.status,
        });

      if (transactionError) {
        return {
          ok: false,
          error: `Infraction filed but transaction failed: ${friendlyError(transactionError)}`,
        };
      }

      const { error: trackingError } = await supabase
        .from("vehicle_tracking_events")
        .insert({
          vehicle_id: input.vehicle_id,
          plate_number: plate,
          registration_country: country,
          event_type: "infraction",
          location: input.location.trim() || null,
          recorded_by: staff.id,
          infraction_id: inserted.id,
          notes: input.infraction_type.trim(),
        });

      if (trackingError) {
        return {
          ok: false,
          error: `Infraction filed but tracking log failed: ${friendlyError(trackingError)}`,
        };
      }
    }

    revalidatePath("/agent/search");
    revalidatePath("/agent/infractions");
    revalidatePath("/admin/infractions");
    revalidatePath("/admin");
    revalidatePath("/driver/infractions");
    revalidatePath("/driver/payments");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: friendlyError(err) };
  }
}

/** Payment status updates — agents and admins only. */
export async function updateInfractionPaymentStatus(
  infractionId: string,
  status: PaymentStatus
): Promise<AgentActionResult> {
  try {
    const auth = await requireRoleForAction(["agent", "admin"]);
    if ("ok" in auth) return auth;

    if (!infractionId) return { ok: false, error: "Missing infraction id." };
    const nextInfractionStatus: PaymentStatus =
      status === "paid" ? "paid" : "unpaid";

    const supabase = createClient();
    const { data: updated, error } = await supabase
      .from("infractions")
      .update({ status: nextInfractionStatus })
      .eq("id", infractionId)
      .select("id, fine_amount")
      .single();

    if (error) return { ok: false, error: friendlyError(error) };

    const { error: transactionError } = await supabase
      .from("transactions")
      .upsert(
        {
          infraction_id: updated.id,
          amount: Number(updated.fine_amount),
          status,
        },
        { onConflict: "infraction_id" }
      );

    if (transactionError) {
      return { ok: false, error: friendlyError(transactionError) };
    }

    revalidatePath("/agent/infractions");
    revalidatePath("/admin/infractions");
    revalidatePath("/agent/search");
    revalidatePath("/driver/infractions");
    revalidatePath("/driver/payments");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: friendlyError(err) };
  }
}
