/**
 * Central TypeScript entry point.
 * Import all domain and database types from `@/types`.
 */
export type {
  AgentApplicationStatus,
  Database,
  DocumentType,
  Json,
  PaymentMethod,
  PaymentStatus,
  ProfileRole,
  StaffRole,
  TrackingEventType,
  TransactionStatus,
  VerificationStatus,
} from "@/lib/types/database";

import type { Database } from "@/lib/types/database";

// ── Table row aliases ────────────────────────────────────────────────────────

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export type DriverProfile =
  Database["public"]["Tables"]["driver_profiles"]["Row"];

export type StaffProfile =
  Database["public"]["Tables"]["staff_profiles"]["Row"];

export type Vehicle = Database["public"]["Tables"]["vehicles"]["Row"];
export type VehicleInsert = Database["public"]["Tables"]["vehicles"]["Insert"];

export type Document = Database["public"]["Tables"]["documents"]["Row"];
export type DocumentGroup =
  Database["public"]["Tables"]["document_groups"]["Row"];

export type Infraction = Database["public"]["Tables"]["infractions"]["Row"];
export type Transaction = Database["public"]["Tables"]["transactions"]["Row"];
export type InfractionTemplate =
  Database["public"]["Tables"]["infraction_templates"]["Row"];
export type VehicleTrackingEvent =
  Database["public"]["Tables"]["vehicle_tracking_events"]["Row"];

// ── Profile with sub-profile ─────────────────────────────────────────────────

/** Driver profile row with its driver_profiles sub-row. */
export type ProfileWithDriver = Profile & {
  driverProfile: DriverProfile | null;
};

/** Staff profile row with its staff_profiles sub-row. */
export type ProfileWithStaff = Profile & {
  staffProfile: StaffProfile | null;
};

/** Either kind of enriched profile — used in helpers that return any profile. */
export type AnyProfileWithSub = ProfileWithDriver | ProfileWithStaff;

// ── Shared API / UI shapes ───────────────────────────────────────────────────

export type StaffDocumentsScope = "all" | "driver" | "vehicle";

export type StaffDocumentsParams = {
  ownerId?: string | null;
  vehicleId?: string | null;
  scope?: StaffDocumentsScope;
};
