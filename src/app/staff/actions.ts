"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { friendlyError } from "@/lib/errors";
import { requireStaffProfileForAction, requireAdminProfileForAction } from "@/lib/auth";
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
import type { PaymentStatus, TransactionStatus } from "@/lib/types/database";
import {
  buildStaffProfileComment,
  type DriverProfileComment,
} from "@/lib/driver-profile-comments";
import {
  appendDriverProfileComment,
  fetchDriverProfileComments,
} from "@/lib/driver-profile-comments-store";

export type StaffActionResult = { ok: true; vehicleId?: string } | { ok: false; error: string };

export async function logVehicleCheckIn(input: {
  plate: string;
  country?: string;
  vehicleId: string | null;
  location: string;
  notes: string | null;
}): Promise<StaffActionResult> {
  try {
    const auth = await requireStaffProfileForAction();
    if ("ok" in auth) return auth;
    const agent = auth.profile;

    const country = input.country ?? "GA";
    const plate = normalizePlateForCountry(input.plate, country);
    if (!plate) return { ok: false, error: "Invalid plate number." };
    if (!input.location.trim()) return { ok: false, error: "Location is required." };

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

    revalidatePath("/staff/search");
    revalidatePath("/staff/tracking");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: friendlyError(err) };
  }
}

type TransitIdUpload = { file_path: string; file_name: string };

export async function registerBorderVehicle(input: {
  vehicle_id: string;
  border_checkpoint: string;
  foreign_notes: string;
  id_documents?: { front: TransitIdUpload; back: TransitIdUpload } | null;
  border_direction?: "entry" | "exit";
}): Promise<StaffActionResult> {
  try {
    const auth = await requireStaffProfileForAction();
    if ("ok" in auth) return auth;
    const agent = auth.profile;

    if (!input.vehicle_id) return { ok: false, error: "Select an existing driver vehicle." };
    if (!input.border_checkpoint.trim()) return { ok: false, error: "Border checkpoint is required." };

    const supabase = createClient();
    const { data: vehicle } = await supabase
      .from("vehicles")
      .select("id, owner_id, plate_number, registration_country")
      .eq("id", input.vehicle_id)
      .not("owner_id", "is", null)
      .maybeSingle();

    if (!vehicle) {
      return { ok: false, error: "Border crossings must be linked to an existing driver vehicle." };
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
      return { ok: false, error: `Border crossing saved but tracking log failed: ${friendlyError(trackingError)}` };
    }

    if (input.id_documents?.front && input.id_documents?.back) {
      const idCheck = assessTransitIdAuthenticity([
        { label: TRANSIT_ID_LABEL_FRONT, file_path: input.id_documents.front.file_path, file_name: input.id_documents.front.file_name },
        { label: TRANSIT_ID_LABEL_BACK, file_path: input.id_documents.back.file_path, file_name: input.id_documents.back.file_name },
      ]);
      if (idCheck.complete) {
        const documentOwnerId = vehicle.owner_id ?? agent.id;
        await supabase.from("documents").insert([
          {
            owner_id: documentOwnerId,
            vehicle_id: vehicle.id,
            doc_type: TRANSIT_ID_DOC_TYPE,
            label: TRANSIT_ID_LABEL_FRONT,
            file_path: input.id_documents.front.file_path,
            file_name: input.id_documents.front.file_name,
            expires_at: null,
            verification_status: "pending_review" as const,
          },
          {
            owner_id: documentOwnerId,
            vehicle_id: vehicle.id,
            doc_type: TRANSIT_ID_DOC_TYPE,
            label: TRANSIT_ID_LABEL_BACK,
            file_path: input.id_documents.back.file_path,
            file_name: input.id_documents.back.file_name,
            expires_at: null,
            verification_status: "pending_review" as const,
          },
        ]);
      }
    }

    revalidatePath("/staff/border");
    revalidatePath("/staff/search");
    revalidatePath("/staff/vehicles");
    revalidatePath("/staff/tracking");
    return { ok: true, vehicleId: vehicle.id };
  } catch (err) {
    return { ok: false, error: friendlyError(err) };
  }
}

/** Only staff (agent or admin) may file infractions. */
export async function fileInfraction(input: FileInfractionInput): Promise<StaffActionResult> {
  try {
    const auth = await requireStaffProfileForAction();
    if ("ok" in auth) return auth;
    const staff = auth.profile;

    const country = input.registration_country || "GA";
    const plate = normalizePlateForCountry(input.plate_number, country);
    if (!plate) return { ok: false, error: "Plate number is required." };
    if (!input.infraction_type.trim()) return { ok: false, error: "Infraction type is required." };

    const supabase = createClient();
    const { data: dbTemplate } = await supabase
      .from("infraction_templates")
      .select("code, label, amount, points, category, active")
      .eq("code", input.infraction_template_code)
      .eq("active", true)
      .maybeSingle();
    const template = dbTemplate ?? findInfractionTemplate(input.infraction_template_code);
    if (!template) return { ok: false, error: "Select a valid infraction template." };
    if (input.infraction_type !== template.label || Number(input.fine_amount) !== Number(template.amount)) {
      return { ok: false, error: "Infraction amount must match the selected prebuilt template." };
    }

    const infractionStatus: PaymentStatus = input.status === "paid" ? "paid" : "unpaid";
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
      const { error: transactionError } = await supabase.from("transactions").insert({
        infraction_id: inserted.id,
        amount: Number(template.amount),
        status: input.status,
      });
      if (transactionError) {
        return { ok: false, error: `Infraction filed but transaction failed: ${friendlyError(transactionError)}` };
      }
      const { error: trackingError } = await supabase.from("vehicle_tracking_events").insert({
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
        return { ok: false, error: `Infraction filed but tracking log failed: ${friendlyError(trackingError)}` };
      }
    }

    revalidatePath("/staff/search");
    revalidatePath("/staff/infractions");
    revalidatePath("/driver/infractions");
    revalidatePath("/driver/payments");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: friendlyError(err) };
  }
}

/** Payment status updates — any staff member. */
export async function updateInfractionPaymentStatus(
  infractionId: string,
  status: PaymentStatus | TransactionStatus
): Promise<StaffActionResult> {
  try {
    const auth = await requireStaffProfileForAction();
    if ("ok" in auth) return auth;

    if (!infractionId) return { ok: false, error: "Missing infraction id." };
    const transactionStatus: TransactionStatus =
      status === "paid" ? "paid"
      : status === "pending" ? "pending"
      : status === "initialized" ? "initialized"
      : "unpaid";
    const nextInfractionStatus: PaymentStatus =
      transactionStatus === "paid" ? "paid" : "unpaid";

    const supabase = createClient();
    const { data: updated, error } = await supabase
      .from("infractions")
      .update({ status: nextInfractionStatus })
      .eq("id", infractionId)
      .select("id, fine_amount")
      .single();

    if (error) return { ok: false, error: friendlyError(error) };

    const { error: transactionError } = await supabase.from("transactions").upsert(
      { infraction_id: updated.id, amount: Number(updated.fine_amount), status: transactionStatus },
      { onConflict: "infraction_id" }
    );
    if (transactionError) return { ok: false, error: friendlyError(transactionError) };

    revalidatePath("/staff/infractions");
    revalidatePath("/staff/search");
    revalidatePath("/driver/infractions");
    revalidatePath("/driver/payments");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: friendlyError(err) };
  }
}

/** Approve a driver profile — any staff member can do this. */
export async function approveDriverProfile(
  driverProfileId: string
): Promise<StaffActionResult> {
  try {
    const auth = await requireStaffProfileForAction();
    if ("ok" in auth) return auth;

    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ verification_status: "active" })
      .eq("id", driverProfileId)
      .eq("role", "driver");

    if (error) return { ok: false, error: friendlyError(error) };

    revalidatePath("/staff/drivers");
    revalidatePath("/driver");
    revalidatePath("/driver/profile");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: friendlyError(err) };
  }
}

/** Reject and lock a driver profile — any staff member can do this. */
export async function rejectDriverProfile(
  driverProfileId: string,
  message: string
): Promise<StaffActionResult> {
  try {
    const auth = await requireStaffProfileForAction();
    if ("ok" in auth) return auth;

    const trimmed = message.trim();
    if (!trimmed) {
      return { ok: false, error: "A message explaining the rejection is required." };
    }

    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        verification_status: "rejected",
        admin_message: trimmed,
      })
      .eq("id", driverProfileId)
      .eq("role", "driver");

    if (error) return { ok: false, error: friendlyError(error) };

    revalidatePath("/staff/drivers");
    revalidatePath("/driver");
    revalidatePath("/driver/profile");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: friendlyError(err) };
  }
}

/** Approve a vehicle — any staff member can do this. */
export async function approveVehicleAsStaff(
  vehicleId: string
): Promise<StaffActionResult> {
  try {
    const auth = await requireStaffProfileForAction();
    if ("ok" in auth) return auth;

    const supabase = createClient();
    const { error } = await supabase
      .from("vehicles")
      .update({ verification_status: "active" })
      .eq("id", vehicleId);

    if (error) return { ok: false, error: friendlyError(error) };

    revalidatePath("/staff/vehicles");
    revalidatePath("/staff/drivers");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: friendlyError(err) };
  }
}

/** Reject / lock a vehicle — any staff member can do this. */
export async function rejectVehicleAsStaff(
  vehicleId: string
): Promise<StaffActionResult> {
  try {
    const auth = await requireStaffProfileForAction();
    if ("ok" in auth) return auth;

    const supabase = createClient();
    const { error } = await supabase
      .from("vehicles")
      .update({ verification_status: "rejected" })
      .eq("id", vehicleId);

    if (error) return { ok: false, error: friendlyError(error) };

    revalidatePath("/staff/vehicles");
    revalidatePath("/staff/drivers");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: friendlyError(err) };
  }
}

/** Approve an agent application — admin only. */
export async function approveAgentApplication(
  staffProfileId: string
): Promise<StaffActionResult> {
  try {
    const auth = await requireAdminProfileForAction();
    if ("ok" in auth) return auth;

    const supabase = createClient();
    const { error } = await supabase
      .from("staff_profiles")
      .update({ application_status: "approved" })
      .eq("profile_id", staffProfileId)
      .eq("staff_role", "agent");

    if (error) return { ok: false, error: friendlyError(error) };

    revalidatePath("/staff/agents");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: friendlyError(err) };
  }
}

/** Reject an agent application — admin only. */
export async function rejectAgentApplication(
  staffProfileId: string,
  message?: string
): Promise<StaffActionResult> {
  try {
    const auth = await requireAdminProfileForAction();
    if ("ok" in auth) return auth;

    const supabase = createClient();
    const { error: spError } = await supabase
      .from("staff_profiles")
      .update({ application_status: "rejected" })
      .eq("profile_id", staffProfileId);

    if (spError) return { ok: false, error: friendlyError(spError) };

    if (message) {
      await supabase
        .from("profiles")
        .update({ admin_message: message })
        .eq("id", staffProfileId);
    }

    revalidatePath("/staff/agents");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: friendlyError(err) };
  }
}

/** Promote an agent to admin — admin only. */
export async function promoteAgentToAdmin(
  staffProfileId: string
): Promise<StaffActionResult> {
  try {
    const auth = await requireAdminProfileForAction();
    if ("ok" in auth) return auth;

    const { promoteStaffToAdmin } = await import("@/lib/auth/profiles");
    const result = await promoteStaffToAdmin(staffProfileId);
    if (!result.ok) return result;

    revalidatePath("/staff/agents");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: friendlyError(err) };
  }
}

/** Update driver verification status — admin only. */
export async function updateDriverVerification(
  driverProfileId: string,
  status: "active" | "rejected" | "pending_review",
  adminMessage?: string | null
): Promise<StaffActionResult> {
  try {
    const auth = await requireAdminProfileForAction();
    if ("ok" in auth) return auth;

    const supabase = createClient();
    const update: Record<string, unknown> = { verification_status: status };
    if (adminMessage !== undefined) update.admin_message = adminMessage;

    const { error } = await supabase
      .from("profiles")
      .update(update)
      .eq("id", driverProfileId)
      .eq("role", "driver");

    if (error) return { ok: false, error: friendlyError(error) };

    revalidatePath("/staff/drivers");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: friendlyError(err) };
  }
}

/** Update vehicle verification status — admin only. */
export async function updateVehicleVerification(
  vehicleId: string,
  status: "active" | "rejected" | "pending_review"
): Promise<StaffActionResult> {
  try {
    const auth = await requireAdminProfileForAction();
    if ("ok" in auth) return auth;

    const supabase = createClient();
    const { error } = await supabase
      .from("vehicles")
      .update({ verification_status: status })
      .eq("id", vehicleId);

    if (error) return { ok: false, error: friendlyError(error) };

    revalidatePath("/staff/vehicles");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: friendlyError(err) };
  }
}

type InfractionTemplateUpsert = {
  code: string;
  label: string;
  amount: string;
  points?: number | null;
  category?: string | null;
};

/** Save (upsert) an infraction template — admin only. */
export async function saveInfractionTemplate(
  template: InfractionTemplateUpsert
): Promise<StaffActionResult> {
  try {
    const auth = await requireAdminProfileForAction();
    if ("ok" in auth) return auth;

    const supabase = createClient();
    const { error } = await supabase
      .from("infraction_templates")
      .upsert(template, { onConflict: "code" });

    if (error) return { ok: false, error: friendlyError(error) };

    revalidatePath("/staff/infraction-templates");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: friendlyError(err) };
  }
}

export async function getDriverProfileCommentsForStaff(
  driverProfileId: string
): Promise<DriverProfileComment[]> {
  const auth = await requireStaffProfileForAction();
  if ("ok" in auth) return [];

  const supabase = createClient();
  return fetchDriverProfileComments(supabase, driverProfileId);
}

export async function postDriverProfileCommentAsStaff(
  driverProfileId: string,
  message: string
): Promise<StaffActionResult> {
  try {
    const auth = await requireStaffProfileForAction();
    if ("ok" in auth) return auth;

    const trimmed = message.trim();
    if (!trimmed) return { ok: false, error: "Comment cannot be empty." };

    const supabase = createClient();
    const result = await appendDriverProfileComment(
      supabase,
      driverProfileId,
      buildStaffProfileComment(auth.profile, trimmed)
    );

    if (!result.ok) return result;

    revalidatePath("/staff/drivers");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: friendlyError(err) };
  }
}
