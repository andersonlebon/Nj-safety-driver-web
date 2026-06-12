import type { PaymentStatus } from "@/lib/types/database";
import { INFRACTION_TEMPLATES } from "@/lib/infraction-templates";

/** Infraction types agents and admins can file in the field. */
export const INFRACTION_TYPES = INFRACTION_TEMPLATES.map(
  (template) => template.label
);

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
  infraction_template_code: string;
  infraction_type: string;
  description: string;
  location: string;
  fine_amount: string;
  status: PaymentStatus;
  evidence_path: string | null;
};
