"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { friendlyError } from "@/lib/errors";
import { DEFAULT_COUNTRY, isDomesticCountry } from "@/lib/countries";
import { normalizePlateForCountry } from "@/lib/vehicles";
import type { DocumentType } from "@/lib/types/database";

export type ActionResult = { ok: true } | { ok: false; error: string };

export type CompletePayload = {
  personal: {
    full_name: string;
    phone: string;
    national_id: string;
    driver_license: string;
    address: string;
    nationality_country: string;
  };
  vehicle: {
    id: string;
    plate_number: string;
    registration_country: string;
    brand: string | null;
    model: string | null;
    color: string | null;
    year: number | null;
    insurance_status: boolean;
    inspection_status: boolean;
  };
  documents: Array<{
    doc_type: DocumentType;
    label: string | null;
    vehicle_id: string | null;
    file_path: string;
    file_name: string | null;
    expires_at: string | null;
  }>;
  skip_documents?: boolean;
};

export async function savePersonalInfo(formData: FormData): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated." };

  const full_name = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const national_id = String(formData.get("national_id") ?? "").trim();
  const driver_license = String(formData.get("driver_license") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();

  if (!full_name || !phone || !national_id || !driver_license || !address) {
    return { ok: false, error: "All personal information fields are required." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name,
      phone,
      national_id,
      driver_license,
      address,
    })
    .eq("id", user.id);

  if (error) return { ok: false, error: friendlyError(error) };

  revalidatePath("/onboarding");
  return { ok: true };
}

async function deleteStoragePaths(
  supabase: ReturnType<typeof createClient>,
  paths: string[]
) {
  if (paths.length === 0) return;
  await supabase.storage.from("documents").remove(paths);
}

export async function completeOnboarding(
  payload: CompletePayload
): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated." };

  const personal = payload.personal;
  if (
    !personal.full_name ||
    !personal.phone ||
    !personal.national_id ||
    !personal.driver_license ||
    !personal.address
  ) {
    return { ok: false, error: "Missing personal information." };
  }

  const vehicle = payload.vehicle;
  const registration_country =
    vehicle.registration_country?.trim() || DEFAULT_COUNTRY;
  const plate_number = normalizePlateForCountry(
    vehicle.plate_number,
    registration_country
  );
  if (!plate_number || !vehicle.brand || !vehicle.model) {
    return { ok: false, error: "Plate number, brand, and model are required." };
  }
  if (
    vehicle.year !== null &&
    (!Number.isFinite(vehicle.year) || vehicle.year < 1900 || vehicle.year > 2100)
  ) {
    return { ok: false, error: "Year must be a valid 4-digit number." };
  }

  if (!payload.documents || payload.documents.length === 0) {
    // Finishing without uploads is allowed — profile stays pending_documents.
  }

  const hasIdentityFront = payload.documents.some(
    (d) => d.doc_type === "identity" && d.label === "front"
  );
  const hasIdentityBack = payload.documents.some(
    (d) => d.doc_type === "identity" && d.label === "back"
  );
  const hasLicenseFront = payload.documents.some(
    (d) => d.doc_type === "driver_license" && d.label === "front"
  );
  const hasLicenseBack = payload.documents.some(
    (d) => d.doc_type === "driver_license" && d.label === "back"
  );
  const hasVehiclePhoto = payload.documents.some(
    (d) =>
      d.vehicle_id === payload.vehicle.id &&
      d.doc_type === "vehicle_photo" &&
      d.label === "front"
  );
  const hasRegistration = payload.documents.some(
    (d) =>
      d.vehicle_id === payload.vehicle.id &&
      d.doc_type === "vehicle_registration"
  );

  let profileVerification: "pending_documents" | "pending_review" =
    "pending_documents";
  if (
    hasIdentityFront &&
    hasIdentityBack &&
    hasLicenseFront &&
    hasLicenseBack &&
    hasVehiclePhoto &&
    hasRegistration
  ) {
    profileVerification = "pending_review";
  }

  // Defensive: every storage path must be scoped under the user's id, otherwise
  // storage RLS would reject it. Surface this BEFORE we touch the database.
  const ownerPrefix = `${user.id}/`;
  const badPath = payload.documents.find(
    (d) => !d.file_path.startsWith(ownerPrefix)
  );
  if (badPath) {
    return {
      ok: false,
      error: "Uploaded file paths are not scoped to your account.",
    };
  }
  const uploadedPaths = payload.documents.map((d) => d.file_path);

  const { error: profileUpdateError } = await supabase
    .from("profiles")
    .update({
      full_name: personal.full_name,
      phone: personal.phone,
      national_id: personal.national_id,
      driver_license: personal.driver_license,
      address: personal.address,
      nationality_country:
        personal.nationality_country?.trim() || DEFAULT_COUNTRY,
    })
    .eq("id", user.id);

  if (profileUpdateError) {
    await deleteStoragePaths(supabase, uploadedPaths);
    return { ok: false, error: friendlyError(profileUpdateError) };
  }

  const { error: vehicleError } = await supabase.from("vehicles").insert({
    id: vehicle.id,
    owner_id: user.id,
    plate_number,
    registration_country,
    is_foreign: !isDomesticCountry(registration_country),
    brand: vehicle.brand,
    model: vehicle.model,
    color: vehicle.color,
    year: vehicle.year,
    insurance_status: vehicle.insurance_status,
    inspection_status: vehicle.inspection_status,
    verification_status: "pending_review",
  });

  if (vehicleError) {
    await deleteStoragePaths(supabase, uploadedPaths);
    return { ok: false, error: friendlyError(vehicleError) };
  }

  await supabase.from("vehicle_tracking_events").insert({
    vehicle_id: vehicle.id,
    plate_number,
    event_type: "registration",
    notes: `Vehicle registered: ${vehicle.brand ?? ""} ${vehicle.model ?? ""}`.trim(),
  });

  const documentRows = payload.documents.map((d) => ({
    owner_id: user.id,
    vehicle_id: d.vehicle_id,
    doc_type: d.doc_type,
    label: d.label,
    file_path: d.file_path,
    file_name: d.file_name,
    expires_at: d.expires_at,
    verification_status: "pending_review" as const,
  }));

  const { error: docsError } =
    documentRows.length > 0
      ? await supabase.from("documents").insert(documentRows)
      : { error: null };

  if (docsError) {
    // Roll back the vehicle row + uploaded files so the user can retry cleanly.
    await supabase.from("vehicles").delete().eq("id", vehicle.id);
    await deleteStoragePaths(supabase, uploadedPaths);
    return { ok: false, error: friendlyError(docsError) };
  }

  if (documentRows.length === 0) {
    // No documents inserted — that's OK when skipping uploads.
  }

  const { error: markOnboardedError } = await supabase
    .from("profiles")
    .update({
      onboarded_at: new Date().toISOString(),
      verification_status: profileVerification,
    })
    .eq("id", user.id);

  if (markOnboardedError) {
    return { ok: false, error: friendlyError(markOnboardedError) };
  }

  revalidatePath("/driver");
  redirect("/driver");
}
