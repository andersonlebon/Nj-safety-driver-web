"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { friendlyError } from "@/lib/errors";
import { getSessionUser, requireDriverProfileForAction } from "@/lib/auth";
import {
  paymentReceiptStoragePath,
} from "@/lib/payment-receipt";
import { canSubmitManualPayment, summarizeInfractionPayment } from "@/lib/payments";
import {
  ACCEPTED_PHOTO_TYPES,
  MAX_EVIDENCE_BYTES,
} from "@/lib/upload-limits";

export type PaymentActionResult = { ok: true } | { ok: false; error: string };

function extensionForReceipt(file: File): string | null {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && ["jpg", "jpeg", "png", "webp", "heic", "pdf"].includes(fromName)) {
    return fromName === "jpeg" ? "jpg" : fromName;
  }
  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/heic") return "heic";
  if (file.type === "application/pdf") return "pdf";
  return null;
}

export async function submitManualInfractionPayment(
  formData: FormData
): Promise<PaymentActionResult> {
  try {
    const auth = await requireDriverProfileForAction();
    if ("ok" in auth) return auth;
    const { profile } = auth;

    const user = await getSessionUser();
    if (!user) return { ok: false, error: "Session expired. Please sign in again." };

    const infractionId = String(formData.get("infractionId") ?? "").trim();
    const amountRaw = String(formData.get("amount") ?? "").trim();
    const receipt = formData.get("receipt");

    if (!infractionId) return { ok: false, error: "Missing infraction." };
    if (!(receipt instanceof File) || receipt.size === 0) {
      return { ok: false, error: "Upload a payment receipt image or PDF." };
    }

    const amount = Number(amountRaw);
    if (!Number.isFinite(amount) || amount <= 0) {
      return { ok: false, error: "Enter a valid payment amount." };
    }

    if (receipt.size > MAX_EVIDENCE_BYTES) {
      return { ok: false, error: "Receipt must be 10 MB or smaller." };
    }

    const ext = extensionForReceipt(receipt);
    if (!ext) {
      return { ok: false, error: "Use a JPG, PNG, WEBP, HEIC, or PDF receipt." };
    }
    if (!receipt.type.startsWith("image/") && receipt.type !== "application/pdf") {
      if (!ACCEPTED_PHOTO_TYPES.has(receipt.type) && receipt.type !== "application/pdf") {
        return { ok: false, error: "Use a JPG, PNG, WEBP, HEIC, or PDF receipt." };
      }
    }

    const supabase = createClient();
    const { data: infraction, error: infractionError } = await supabase
      .from("infractions")
      .select("id, driver_id, fine_amount, amount_paid, payment_transaction_count, status")
      .eq("id", infractionId)
      .eq("driver_id", profile.id)
      .maybeSingle();

    if (infractionError) return { ok: false, error: friendlyError(infractionError) };
    if (!infraction) return { ok: false, error: "Infraction not found." };

    const summary = summarizeInfractionPayment({
      fineAmount: infraction.fine_amount,
      amountPaid: infraction.amount_paid,
      paymentTransactionCount: infraction.payment_transaction_count,
      infractionStatus: infraction.status,
    });

    if (!canSubmitManualPayment(summary)) {
      return { ok: false, error: "This infraction is already fully paid." };
    }

    const { data: pendingRows } = await supabase
      .from("transactions")
      .select("id")
      .eq("infraction_id", infractionId)
      .eq("status", "pending")
      .limit(1);

    if ((pendingRows ?? []).length > 0) {
      return {
        ok: false,
        error: "A payment is already awaiting review for this infraction.",
      };
    }

    const storagePath = paymentReceiptStoragePath(user.id, infractionId, ext);
    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(storagePath, receipt, {
        upsert: false,
        contentType: receipt.type || undefined,
      });

    if (uploadError) return { ok: false, error: friendlyError(uploadError) };

    const { error: insertError } = await supabase.from("transactions").insert({
      infraction_id: infractionId,
      amount,
      payment_method: "manual",
      receipt_path: storagePath,
      submitted_by: profile.id,
      status: "pending",
      updated_at: new Date().toISOString(),
    });

    if (insertError) {
      await supabase.storage.from("documents").remove([storagePath]);
      return { ok: false, error: friendlyError(insertError) };
    }

    revalidatePath("/driver/payments");
    revalidatePath("/driver/infractions");
    revalidatePath("/staff/payments");
    revalidatePath("/staff/infractions");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: friendlyError(err) };
  }
}

export async function loadInfractionTransactionsForDriver(infractionId: string) {
  const auth = await requireDriverProfileForAction();
  if ("ok" in auth) return [];

  const supabase = createClient();
  const { data: infraction } = await supabase
    .from("infractions")
    .select("id")
    .eq("id", infractionId)
    .eq("driver_id", auth.profile.id)
    .maybeSingle();

  if (!infraction) return [];

  const { data, error } = await supabase
    .from("transactions")
    .select("id, amount, status, payment_method, created_at, reviewed_at, rejection_reason")
    .eq("infraction_id", infractionId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return data ?? [];
}
