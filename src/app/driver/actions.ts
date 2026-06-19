"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { friendlyError } from "@/lib/errors";
import { requireRole } from "@/lib/auth";
import type { DocumentType } from "@/lib/types/database";

export type DriverActionResult = { ok: true } | { ok: false; error: string };

const REQUIRED_PERSONAL: Array<{ doc_type: DocumentType; label: string }> = [
  { doc_type: "identity", label: "front" },
  { doc_type: "identity", label: "back" },
  { doc_type: "driver_license", label: "front" },
  { doc_type: "driver_license", label: "back" },
];

export async function submitDocumentsForReview(): Promise<DriverActionResult> {
  const { profile, role } = await requireRole(["driver", "admin"]);
  if (role !== "driver") {
    return { ok: false, error: "Only drivers can submit documents for review." };
  }

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
  revalidatePath("/driver/documents");
  revalidatePath("/admin/drivers");
  return { ok: true };
}
