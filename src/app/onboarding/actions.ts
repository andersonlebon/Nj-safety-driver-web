"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { normalizePlate } from "@/lib/utils";
import type { DocumentType } from "@/lib/types/database";

export type ActionResult = { ok: true } | { ok: false; error: string };

export type CompletePayload = {
  personal: {
    full_name: string;
    phone: string;
    national_id: string;
    driver_license: string;
    address: string;
  };
  vehicle: {
    id: string;
    plate_number: string;
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
  }>;
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

  if (error) return { ok: false, error: error.message };

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
  const plate_number = normalizePlate(vehicle.plate_number);
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
    return { ok: false, error: "At least one evidence file is required." };
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
    })
    .eq("id", user.id);

  if (profileUpdateError) {
    await deleteStoragePaths(supabase, uploadedPaths);
    return { ok: false, error: profileUpdateError.message };
  }

  const { error: vehicleError } = await supabase.from("vehicles").insert({
    id: vehicle.id,
    owner_id: user.id,
    plate_number,
    brand: vehicle.brand,
    model: vehicle.model,
    color: vehicle.color,
    year: vehicle.year,
    insurance_status: vehicle.insurance_status,
    inspection_status: vehicle.inspection_status,
  });

  if (vehicleError) {
    await deleteStoragePaths(supabase, uploadedPaths);
    return { ok: false, error: vehicleError.message };
  }

  const documentRows = payload.documents.map((d) => ({
    owner_id: user.id,
    vehicle_id: d.vehicle_id,
    doc_type: d.doc_type,
    label: d.label,
    file_path: d.file_path,
    file_name: d.file_name,
  }));

  const { error: docsError } = await supabase
    .from("documents")
    .insert(documentRows);

  if (docsError) {
    // Roll back the vehicle row + uploaded files so the user can retry cleanly.
    await supabase.from("vehicles").delete().eq("id", vehicle.id);
    await deleteStoragePaths(supabase, uploadedPaths);
    return { ok: false, error: docsError.message };
  }

  const { error: markOnboardedError } = await supabase
    .from("profiles")
    .update({ onboarded_at: new Date().toISOString() })
    .eq("id", user.id);

  if (markOnboardedError) {
    return { ok: false, error: markOnboardedError.message };
  }

  revalidatePath("/driver");
  redirect("/driver");
}
