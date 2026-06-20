"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchStaffDocumentsBundle } from "@/lib/api/documents";
import { queryKeys } from "@/lib/query-keys";
import type { StaffDocumentsParams } from "@/types";

export function useStaffDocuments(params: StaffDocumentsParams) {
  const { ownerId, vehicleId, scope = "all" } = params;
  const enabled = Boolean(ownerId || vehicleId);

  return useQuery({
    queryKey: queryKeys.documents.staffBundle({ ownerId, vehicleId, scope }),
    queryFn: () => fetchStaffDocumentsBundle({ ownerId, vehicleId, scope }),
    enabled,
    staleTime: 60_000,
  });
}
