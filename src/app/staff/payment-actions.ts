"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { friendlyError } from "@/lib/errors";
import { requireAdminProfileForAction } from "@/lib/auth";

export type StaffPaymentActionResult = { ok: true } | { ok: false; error: string };

export async function approvePaymentTransaction(
  transactionId: string
): Promise<StaffPaymentActionResult> {
  try {
    const auth = await requireAdminProfileForAction();
    if ("ok" in auth) return auth;
    const { profile } = auth;

    if (!transactionId) return { ok: false, error: "Missing transaction id." };

    const supabase = createClient();
    const { data: transaction, error: loadError } = await supabase
      .from("transactions")
      .select("id, status")
      .eq("id", transactionId)
      .maybeSingle();

    if (loadError) return { ok: false, error: friendlyError(loadError) };
    if (!transaction) return { ok: false, error: "Transaction not found." };
    if (transaction.status !== "pending") {
      return { ok: false, error: "Only pending payments can be approved." };
    }

    const { error } = await supabase
      .from("transactions")
      .update({
        status: "paid",
        reviewed_by: profile.id,
        reviewed_at: new Date().toISOString(),
        rejection_reason: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", transactionId);

    if (error) return { ok: false, error: friendlyError(error) };

    revalidatePath("/staff/payments");
    revalidatePath("/staff/infractions");
    revalidatePath("/driver/payments");
    revalidatePath("/driver/infractions");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: friendlyError(err) };
  }
}

export async function rejectPaymentTransaction(
  transactionId: string,
  reason: string
): Promise<StaffPaymentActionResult> {
  try {
    const auth = await requireAdminProfileForAction();
    if ("ok" in auth) return auth;
    const { profile } = auth;

    if (!transactionId) return { ok: false, error: "Missing transaction id." };
    const trimmedReason = reason.trim();
    if (!trimmedReason) return { ok: false, error: "Enter a rejection reason." };

    const supabase = createClient();
    const { data: transaction, error: loadError } = await supabase
      .from("transactions")
      .select("id, status")
      .eq("id", transactionId)
      .maybeSingle();

    if (loadError) return { ok: false, error: friendlyError(loadError) };
    if (!transaction) return { ok: false, error: "Transaction not found." };
    if (transaction.status !== "pending") {
      return { ok: false, error: "Only pending payments can be rejected." };
    }

    const { error } = await supabase
      .from("transactions")
      .update({
        status: "rejected",
        reviewed_by: profile.id,
        reviewed_at: new Date().toISOString(),
        rejection_reason: trimmedReason,
        updated_at: new Date().toISOString(),
      })
      .eq("id", transactionId);

    if (error) return { ok: false, error: friendlyError(error) };

    revalidatePath("/staff/payments");
    revalidatePath("/staff/infractions");
    revalidatePath("/driver/payments");
    revalidatePath("/driver/infractions");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: friendlyError(err) };
  }
}
