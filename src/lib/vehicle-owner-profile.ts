import type { VerificationStatus } from "@/lib/types/database";

/** Driver profile fields shown on the staff vehicle owner tab. */
export type VehicleOwnerProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  national_id: string | null;
  driver_license: string | null;
  address: string | null;
  nationality_country: string | null;
  verification_status: VerificationStatus | null;
};

export const VEHICLE_OWNER_PROFILE_SELECT =
  "id, full_name, email, phone, national_id, driver_license, address, nationality_country, verification_status";
