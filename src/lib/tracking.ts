import type { TrackingEventType } from "@/lib/types/database";

export const TRACKING_EVENT_LABELS: Record<TrackingEventType, string> = {
  infraction: "Infraction recorded",
  agent_checkin: "Agent check-in",
  registration: "Vehicle registered",
  verification: "Verification update",
  note: "Note",
};

export type TrackingEvent = {
  id: string;
  event_type: TrackingEventType;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  notes: string | null;
  created_at: string;
  plate_number?: string;
  recorded_by_name?: string | null;
};

export function lastKnownLocation(
  events: TrackingEvent[]
): { location: string; at: string } | null {
  const withLocation = events.find(
    (e) => e.location && e.location.trim().length > 0
  );
  if (!withLocation?.location) return null;
  return { location: withLocation.location, at: withLocation.created_at };
}

export function mapsLink(
  location: string | null,
  lat: number | null,
  lng: number | null
): string | null {
  if (lat != null && lng != null) {
    return `https://www.google.com/maps?q=${lat},${lng}`;
  }
  if (location?.trim()) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.trim())}`;
  }
  return null;
}
