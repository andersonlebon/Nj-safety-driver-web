import type { StaffDocumentsParams } from "@/types";

/**
 * Central React Query key factory. Every Supabase-backed query must use a key
 * from here so invalidation stays predictable across hooks and mutations.
 */
export const queryKeys = {
  documents: {
    all: ["documents"] as const,
    staffBundle: (params: StaffDocumentsParams) =>
      ["documents", "staff-bundle", params] as const,
  },
  vehicles: {
    all: ["vehicles"] as const,
    detail: (vehicleId: string) => ["vehicles", "detail", vehicleId] as const,
    plateContext: (plate: string, country: string) =>
      ["vehicles", "plate", plate, country] as const,
  },
  infractions: {
    all: ["infractions"] as const,
    byDriver: (driverId: string) => ["infractions", "driver", driverId] as const,
    byPlate: (plate: string, country: string) =>
      ["infractions", "plate", plate, country] as const,
  },
  profiles: {
    all: ["profiles"] as const,
    detail: (profileId: string) => ["profiles", "detail", profileId] as const,
  },
} as const;
