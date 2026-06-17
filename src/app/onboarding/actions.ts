"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { friendlyError } from "@/lib/errors";
import { DEFAULT_COUNTRY, isDomesticCountry } from "@/lib/countries";
import { normalizePlateForCountry } from "@/lib/vehicles";
import {
  normalizeExpiryForDocument,
  normalizeIssuedForDocument,
  validateDocumentDates,
} from "@/lib/document-rules";
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
  document_groups: Array<{
    doc_type: DocumentType;
    vehicle_id: string | null;
    issued_at: string | null;
    expires_at: string | null;
    attachments: Array<{
      label: string | null;
      file_path: string;
      file_name: string | null;
      file_hash: string | null;
    }>;
  }>;
  skip_documents?: boolean;
};

async function rollbackOnboardingWrites(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  vehicleId: string,
  uploadedPaths: string[]
) {
  await supabase.from("documents").delete().eq("owner_id", userId);
  await supabase.from("document_groups").delete().eq("owner_id", userId);
  await supabase.from("vehicles").delete().eq("id", vehicleId).eq("owner_id", userId);
  await deleteStoragePaths(supabase, uploadedPaths);
}

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
  const nationality_country =
    String(formData.get("nationality_country") ?? DEFAULT_COUNTRY).trim() ||
    DEFAULT_COUNTRY;

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
      nationality_country,
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

function groupHasAttachments(
  group: CompletePayload["document_groups"][number],
  label: string
): boolean {
  return group.attachments.some((attachment) => attachment.label === label);
}

export async function completeOnboarding(
  payload: CompletePayload
): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated." };

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("onboarded_at")
    .eq("id", user.id)
    .maybeSingle();

  if (existingProfile?.onboarded_at) {
    revalidatePath("/driver");
    return { ok: true };
  }

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

  const identityGroup = payload.document_groups.find(
    (group) => group.doc_type === "identity" && !group.vehicle_id
  );
  const licenseGroup = payload.document_groups.find(
    (group) => group.doc_type === "driver_license" && !group.vehicle_id
  );
  const vehiclePhotoGroup = payload.document_groups.find(
    (group) =>
      group.vehicle_id === payload.vehicle.id && group.doc_type === "vehicle_photo"
  );
  const registrationGroup = payload.document_groups.find(
    (group) =>
      group.vehicle_id === payload.vehicle.id &&
      group.doc_type === "vehicle_registration"
  );

  let profileVerification: "pending_documents" | "pending_review" =
    "pending_documents";
  if (
    identityGroup &&
    groupHasAttachments(identityGroup, "front") &&
    groupHasAttachments(identityGroup, "back") &&
    licenseGroup &&
    groupHasAttachments(licenseGroup, "front") &&
    groupHasAttachments(licenseGroup, "back") &&
    vehiclePhotoGroup &&
    groupHasAttachments(vehiclePhotoGroup, "front") &&
    registrationGroup &&
    registrationGroup.attachments.length > 0
  ) {
    profileVerification = "pending_review";
  }

  const ownerPrefix = `${user.id}/`;
  const allAttachments = payload.document_groups.flatMap((group) => group.attachments);
  const badPath = allAttachments.find(
    (attachment) => !attachment.file_path.startsWith(ownerPrefix)
  );
  if (badPath) {
    return {
      ok: false,
      error: "Uploaded file paths are not scoped to your account.",
    };
  }
  const uploadedPaths = allAttachments.map((attachment) => attachment.file_path);

  const duplicateHash = allAttachments.find((attachment, index, attachments) => {
    if (!attachment.file_hash) return false;
    return (
      attachments.findIndex((other) => other.file_hash === attachment.file_hash) !==
      index
    );
  });
  if (duplicateHash) {
    await deleteStoragePaths(supabase, uploadedPaths);
    return {
      ok: false,
      error: "Duplicate document image detected. Please replace one attachment before submitting.",
    };
  }

  for (const group of payload.document_groups) {
    const dateError = validateDocumentDates(
      group.doc_type,
      group.issued_at,
      group.expires_at
    );
    if (dateError) {
      await deleteStoragePaths(supabase, uploadedPaths);
      return { ok: false, error: dateError };
    }
  }

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
    return {
      ok: false,
      error: `Unable to save your profile: ${friendlyError(profileUpdateError)}`,
    };
  }

  // Remove a stale vehicle row from a prior failed finalize attempt (same id).
  await supabase
    .from("vehicles")
    .delete()
    .eq("id", vehicle.id)
    .eq("owner_id", user.id);

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
    return {
      ok: false,
      error: `Vehicle could not be saved: ${friendlyError(vehicleError)}`,
    };
  }

  await supabase.from("vehicle_tracking_events").insert({
    vehicle_id: vehicle.id,
    plate_number,
    event_type: "registration",
    notes: `Vehicle registered: ${vehicle.brand ?? ""} ${vehicle.model ?? ""}`.trim(),
  });

  for (const group of payload.document_groups) {
    const { data: createdGroup, error: groupError } = await supabase
      .from("document_groups")
      .insert({
        owner_id: user.id,
        vehicle_id: group.vehicle_id,
        doc_type: group.doc_type,
        issued_at: normalizeIssuedForDocument(group.issued_at, group.doc_type),
        expires_at: normalizeExpiryForDocument(group.expires_at, group.doc_type),
        verification_status: "pending_review",
      })
      .select("id")
      .single();

    if (groupError || !createdGroup) {
      await rollbackOnboardingWrites(supabase, user.id, vehicle.id, uploadedPaths);
      return {
        ok: false,
        error: `Document could not be saved: ${friendlyError(groupError)}`,
      };
    }

    const attachmentRows = group.attachments.map((attachment) => ({
      owner_id: user.id,
      vehicle_id: group.vehicle_id,
      group_id: createdGroup.id,
      doc_type: group.doc_type,
      label: attachment.label,
      file_path: attachment.file_path,
      file_name: attachment.file_name,
      file_hash: attachment.file_hash,
      expires_at: null,
      verification_status: "pending_review" as const,
    }));

    const { error: attachmentError } = await supabase
      .from("documents")
      .insert(attachmentRows);

    if (attachmentError) {
      await rollbackOnboardingWrites(supabase, user.id, vehicle.id, uploadedPaths);
      return {
        ok: false,
        error: `Document upload failed: ${friendlyError(attachmentError)}`,
      };
    }
  }

  const { error: markOnboardedError } = await supabase
    .from("profiles")
    .update({
      onboarded_at: new Date().toISOString(),
      verification_status: profileVerification,
    })
    .eq("id", user.id);

  if (markOnboardedError) {
    await rollbackOnboardingWrites(supabase, user.id, vehicle.id, uploadedPaths);
    return {
      ok: false,
      error: `Unable to complete onboarding: ${friendlyError(markOnboardedError)}`,
    };
  }

  revalidatePath("/driver");
  return { ok: true };
}
