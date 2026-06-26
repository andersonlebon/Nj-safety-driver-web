"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { friendlyError } from "@/lib/errors";
import { requireDriverProfileForAction } from "@/lib/auth";
import type { DocumentType } from "@/lib/types/database";
import {
  buildDriverProfileComment,
  type DriverProfileComment,
} from "@/lib/driver-profile-comments";
import {
  appendDriverProfileComment,
  fetchDriverProfileComments,
} from "@/lib/driver-profile-comments-store";
import {
  appendVehicleComment,
  fetchVehicleComments,
} from "@/lib/vehicle-comments-store";

export type DriverActionResult = { ok: true } | { ok: false; error: string };

const REQUIRED_PERSONAL: Array<{ doc_type: DocumentType; label: string }> = [
  { doc_type: "identity", label: "front" },
  { doc_type: "identity", label: "back" },
  { doc_type: "driver_license", label: "front" },
  { doc_type: "driver_license", label: "back" },
];

export async function submitDocumentsForReview(): Promise<DriverActionResult> {
  const auth = await requireDriverProfileForAction();
  if ("ok" in auth) return auth;
  const { profile } = auth;

  const supabase = createClient();
  const { data: docs } = await supabase
    .from("documents")
    .select("doc_type, label, vehicle_id")
    .eq("owner_id", profile.id);

  const uploaded = docs ?? [];
  const missingPersonal = REQUIRED_PERSONAL.filter(
    (req) =>
      !uploaded.some(
        (d) => d.doc_type === req.doc_type && d.label === req.label
      )
  );

  if (missingPersonal.length > 0) {
    return {
      ok: false,
      error:
        "Upload your National ID (front & back) and driver's license (front & back) before submitting for review.",
    };
  }

  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("id")
    .eq("owner_id", profile.id);

  if (!vehicles || vehicles.length === 0) {
    return {
      ok: false,
      error: "Register at least one vehicle before submitting for review.",
    };
  }

  for (const vehicle of vehicles) {
    const hasPhoto = uploaded.some(
      (d) =>
        d.vehicle_id === vehicle.id &&
        d.doc_type === "vehicle_photo" &&
        d.label === "front"
    );
    const hasRegistration = uploaded.some(
      (d) =>
        d.vehicle_id === vehicle.id &&
        d.doc_type === "vehicle_registration"
    );
    if (!hasPhoto || !hasRegistration) {
      return {
        ok: false,
        error:
          "Each vehicle needs a front photo and registration card (carte grise) before review.",
      };
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({ verification_status: "pending_review", admin_message: null })
    .eq("id", profile.id);

  if (error) return { ok: false, error: friendlyError(error) };

  revalidatePath("/driver");
  revalidatePath("/driver/profile");
  revalidatePath("/admin/drivers");
  return { ok: true };
}

export async function getDriverProfileCommentsForDriver(): Promise<
  DriverProfileComment[]
> {
  const auth = await requireDriverProfileForAction();
  if ("ok" in auth) return [];

  const supabase = createClient();
  return fetchDriverProfileComments(supabase, auth.profile.id);
}

export async function postDriverProfileCommentAsDriver(
  _driverProfileId: string,
  message: string
): Promise<DriverActionResult> {
  try {
    const auth = await requireDriverProfileForAction();
    if ("ok" in auth) return auth;

    const trimmed = message.trim();
    if (!trimmed) return { ok: false, error: "Comment cannot be empty." };

    const supabase = createClient();
    const result = await appendDriverProfileComment(
      supabase,
      auth.profile.id,
      buildDriverProfileComment(auth.profile, trimmed)
    );

    if (!result.ok) return result;

    revalidatePath("/driver/profile");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: friendlyError(err) };
  }
}

async function requireOwnedVehicleForAction(
  supabase: ReturnType<typeof createClient>,
  profileId: string,
  vehicleId: string
): Promise<DriverActionResult | { ok: true; vehicleId: string }> {
  if (!vehicleId) return { ok: false, error: "Missing vehicle id." };

  const { data, error } = await supabase
    .from("vehicles")
    .select("id, owner_id")
    .eq("id", vehicleId)
    .maybeSingle();

  if (error) return { ok: false, error: friendlyError(error) };
  if (!data || data.owner_id !== profileId) {
    return { ok: false, error: "Vehicle not found." };
  }

  return { ok: true, vehicleId: data.id };
}

export async function getVehicleCommentsForDriver(
  vehicleId: string
): Promise<DriverProfileComment[]> {
  const auth = await requireDriverProfileForAction();
  if ("ok" in auth) return [];

  const supabase = createClient();
  const access = await requireOwnedVehicleForAction(
    supabase,
    auth.profile.id,
    vehicleId
  );
  if (!("vehicleId" in access)) return [];

  return fetchVehicleComments(supabase, access.vehicleId);
}

export async function postVehicleCommentAsDriver(
  vehicleId: string,
  message: string
): Promise<DriverActionResult> {
  try {
    const auth = await requireDriverProfileForAction();
    if ("ok" in auth) return auth;

    const trimmed = message.trim();
    if (!trimmed) return { ok: false, error: "Comment cannot be empty." };

    const supabase = createClient();
    const access = await requireOwnedVehicleForAction(
      supabase,
      auth.profile.id,
      vehicleId
    );
    if (!("vehicleId" in access)) return access;

    const result = await appendVehicleComment(
      supabase,
      access.vehicleId,
      buildDriverProfileComment(auth.profile, trimmed)
    );

    if (!result.ok) return result;

    revalidatePath("/driver/vehicles");
    revalidatePath(`/driver/vehicles/${access.vehicleId}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: friendlyError(err) };
  }
}
