import { createClient } from "@/lib/supabase/server";
import {
  COMPLIANCE_LOCK_ADMIN_MESSAGE,
  computeComplianceScore,
  isComplianceScoreLocked,
} from "@/lib/compliance";

type ServerSupabase = ReturnType<typeof createClient>;

export async function syncComplianceLockForDriver(
  supabase: ServerSupabase,
  driverId: string
): Promise<void> {
  const { data: infractions } = await supabase
    .from("infractions")
    .select("points")
    .eq("driver_id", driverId);

  const score = computeComplianceScore(infractions ?? []);
  if (!isComplianceScoreLocked(score)) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("verification_status, role")
    .eq("id", driverId)
    .maybeSingle();

  if (!profile || profile.role !== "driver") return;
  if (profile.verification_status !== "active") return;

  await supabase
    .from("profiles")
    .update({
      verification_status: "rejected",
      admin_message: COMPLIANCE_LOCK_ADMIN_MESSAGE,
    })
    .eq("id", driverId);
}
