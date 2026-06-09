import type { PaymentStatus } from "@/lib/types/database";

/** Infraction types agents and admins can file in the field. */
export const INFRACTION_TYPES = [
  "Speeding",
  "Running red light",
  "Illegal parking",
  "Reckless driving",
  "Driving without insurance",
  "Expired inspection",
  "No seatbelt",
  "Other",
] as const;

export type InfractionType = (typeof INFRACTION_TYPES)[number];

export const STAFF_INFRACTION_ROLES = ["agent", "admin"] as const;

export function canFileInfractions(role: string): boolean {
  return STAFF_INFRACTION_ROLES.includes(role as (typeof STAFF_INFRACTION_ROLES)[number]);
}

export type FileInfractionInput = {
  plate_number: string;
  registration_country: string;
  vehicle_id: string | null;
  driver_id: string | null;
  infraction_type: string;
  description: string;
  location: string;
  fine_amount: string;
  status: PaymentStatus;
  evidence_path: string | null;
};
