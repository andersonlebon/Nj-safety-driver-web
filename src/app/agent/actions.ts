"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { friendlyError } from "@/lib/errors";
import { requireRole } from "@/lib/auth";
import { isDomesticCountry } from "@/lib/countries";
import { normalizePlateForCountry } from "@/lib/vehicles";

export type AgentActionResult = { ok: true; vehicleId?: string } | { ok: false; error: string };

export async function logVehicleCheckIn(input: {
  plate: string;
  country?: string;
  vehicleId: string | null;
  location: string;
  notes: string | null;
}): Promise<AgentActionResult> {
  const agent = await requireRole(["agent", "admin"]);
  const country = input.country ?? "GA";
  const plate = normalizePlateForCountry(input.plate, country);
  if (!plate) return { ok: false, error: "Invalid plate number." };
  if (!input.location.trim()) {
    return { ok: false, error: "Location is required." };
  }

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

  revalidatePath("/agent/search");
  revalidatePath("/admin/tracking");
  return { ok: true };
}

export async function registerBorderVehicle(input: {
  plate_number: string;
  registration_country: string;
  brand: string;
  model: string;
  color: string;
  year: string;
  border_checkpoint: string;
  transit_driver_name: string;
  transit_driver_phone: string;
  transit_passport_id: string;
  foreign_notes: string;
}): Promise<AgentActionResult> {
  const agent = await requireRole(["agent", "admin"]);
  const country = input.registration_country || "GA";
  const plate = normalizePlateForCountry(input.plate_number, country);
  if (!plate) return { ok: false, error: "Plate number is required." };
  if (!input.border_checkpoint.trim()) {
    return { ok: false, error: "Border checkpoint is required." };
  }
  if (!input.transit_driver_name.trim()) {
    return { ok: false, error: "Driver name is required for border registration." };
  }

  const supabase = createClient();
  const { data: inserted, error } = await supabase
    .from("vehicles")
    .insert({
      owner_id: null,
      plate_number: plate,
      registration_country: country,
      is_foreign: !isDomesticCountry(country),
      is_border_transit: true,
      border_checkpoint: input.border_checkpoint.trim(),
      border_entry_at: new Date().toISOString(),
      transit_driver_name: input.transit_driver_name.trim(),
      transit_driver_phone: input.transit_driver_phone.trim() || null,
      transit_passport_id: input.transit_passport_id.trim() || null,
      foreign_notes: input.foreign_notes.trim() || null,
      brand: input.brand.trim() || null,
      model: input.model.trim() || null,
      color: input.color.trim() || null,
      year: input.year ? Number(input.year) : null,
      verification_status: "pending_review",
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: friendlyError(error) };

  await supabase.from("vehicle_tracking_events").insert({
    vehicle_id: inserted.id,
    plate_number: plate,
    registration_country: country,
    event_type: "registration",
    location: input.border_checkpoint.trim(),
    recorded_by: agent.id,
    notes: "Border transit registration",
  });

  revalidatePath("/agent/border");
  revalidatePath("/agent/search");
  revalidatePath("/admin/vehicles");
  revalidatePath("/admin/tracking");
  return { ok: true, vehicleId: inserted.id };
}
