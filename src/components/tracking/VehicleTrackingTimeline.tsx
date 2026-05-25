import {
  AlertTriangle,
  Car,
  ClipboardCheck,
  MapPin,
  Shield,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import {
  mapsLink,
  TRACKING_EVENT_LABELS,
  type TrackingEvent,
} from "@/lib/tracking";
import type { TrackingEventType } from "@/lib/types/database";

const ICONS: Record<TrackingEventType, typeof MapPin> = {
  infraction: AlertTriangle,
  agent_checkin: MapPin,
  registration: Car,
  verification: Shield,
  note: ClipboardCheck,
};

export function VehicleTrackingTimeline({
  events,
  compact,
}: {
  events: TrackingEvent[];
  compact?: boolean;
}) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-stone-500 dark:text-slate-400">
        No tracking history yet.
      </p>
    );
  }

  return (
    <ol className={compact ? "space-y-2" : "space-y-3"}>
      {events.map((event) => {
        const Icon = ICONS[event.event_type];
        const href = mapsLink(
          event.location,
          event.latitude,
          event.longitude
        );
        return (
          <li
            key={event.id}
            className="flex gap-3 rounded-lg border border-stone-200 dark:border-slate-800 bg-stone-50/50 dark:bg-slate-900/40 p-3"
          >
            <div className="h-8 w-8 shrink-0 rounded-full bg-brand-100 dark:bg-brand-950 grid place-items-center text-brand-700 dark:text-brand-300">
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-stone-900 dark:text-stone-100">
                {TRACKING_EVENT_LABELS[event.event_type]}
              </p>
              {event.notes && (
                <p className="text-xs text-stone-600 dark:text-slate-400 mt-0.5">
                  {event.notes}
                </p>
              )}
              {event.location && (
                <p className="text-xs text-stone-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                  <MapPin className="h-3 w-3 shrink-0" />
                  {href ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-700 dark:text-brand-300 hover:underline truncate"
                    >
                      {event.location}
                    </a>
                  ) : (
                    <span className="truncate">{event.location}</span>
                  )}
                </p>
              )}
              <p className="text-[11px] text-stone-400 dark:text-slate-500 mt-1">
                {formatDate(event.created_at)}
                {event.recorded_by_name
                  ? ` · ${event.recorded_by_name}`
                  : ""}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function LastKnownLocationBadge({
  location,
  at,
}: {
  location: string;
  at: string;
}) {
  const href = mapsLink(location, null, null);
  return (
    <div className="rounded-lg border border-brand-200 dark:border-brand-900 bg-brand-50/60 dark:bg-brand-950/30 px-3 py-2 text-xs">
      <p className="font-medium text-brand-800 dark:text-brand-200 flex items-center gap-1">
        <MapPin className="h-3.5 w-3.5" />
        Last known location
      </p>
      <p className="mt-0.5 text-stone-700 dark:text-slate-300">
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            {location}
          </a>
        ) : (
          location
        )}
      </p>
      <p className="text-stone-500 dark:text-slate-400 mt-0.5">
        {formatDate(at)}
      </p>
    </div>
  );
}
