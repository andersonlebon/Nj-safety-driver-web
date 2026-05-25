"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { friendlyError } from "@/lib/errors";
import { requireRole } from "@/lib/auth";
import { normalizePlate } from "@/lib/utils";

export type AgentActionResult = { ok: true } | { ok: false; error: string };

export async function logVehicleCheckIn(input: {
  plate: string;
  vehicleId: string | null;
  location: string;
  notes: string | null;
}): Promise<AgentActionResult> {
  const agent = await requireRole(["agent", "admin"]);
  const plate = normalizePlate(input.plate);
  if (!plate) return { ok: false, error: "Invalid plate number." };
  if (!input.location.trim()) {
    return { ok: false, error: "Location is required." };
  }

  const supabase = createClient();
  const { error } = await supabase.from("vehicle_tracking_events").insert({
    vehicle_id: input.vehicleId,
    plate_number: plate,
    event_type: "agent_checkin",
    location: input.location.trim(),
    recorded_by: agent.id,
    notes: input.notes,
  });

  if (error) return { ok: false, error: friendlyError(error) };

  revalidatePath("/agent/search");
  revalidatePath("/admin/tracking");
  return { ok: true };
}
