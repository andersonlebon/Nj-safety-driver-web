"use client";

import { Modal } from "@/components/ui/Modal";
import { VehicleDetailContent } from "./VehicleDetailContent";
import type { TrackingEvent } from "@/lib/tracking";
import type { Database } from "@/lib/types/database";

type Vehicle = Database["public"]["Tables"]["vehicles"]["Row"];
type Infraction = Database["public"]["Tables"]["infractions"]["Row"];

export function VehicleDetailModal({
  open,
  onClose,
  vehicle,
  photoUrl,
  owner,
  infractions,
  trackingEvents,
  agentSearchUrl,
  showOwner = true,
}: {
  open: boolean;
  onClose: () => void;
  vehicle: Vehicle;
  photoUrl?: string | null;
  owner?: { full_name: string | null; email: string | null; phone: string | null } | null;
  infractions?: Infraction[];
  trackingEvents?: TrackingEvent[];
  agentSearchUrl?: string;
  showOwner?: boolean;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Vehicle ${vehicle.plate_number}`}
      description="Full registration, fines, and activity history."
      className="max-w-xl"
    >
      <VehicleDetailContent
        vehicle={vehicle}
        photoUrl={photoUrl}
        owner={owner}
        infractions={infractions}
        trackingEvents={trackingEvents}
        agentSearchUrl={agentSearchUrl}
        showOwner={showOwner}
      />
    </Modal>
  );
}
