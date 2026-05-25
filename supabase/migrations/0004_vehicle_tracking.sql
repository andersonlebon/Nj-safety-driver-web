DO $$ BEGIN
  CREATE TYPE "public"."tracking_event_type" AS ENUM(
    'infraction',
    'agent_checkin',
    'registration',
    'verification',
    'note'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "public"."vehicle_tracking_events" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
  "vehicle_id" uuid REFERENCES "public"."vehicles"("id") ON DELETE SET NULL,
  "plate_number" text NOT NULL,
  "event_type" "tracking_event_type" NOT NULL,
  "location" text,
  "latitude" numeric(10, 7),
  "longitude" numeric(10, 7),
  "recorded_by" uuid REFERENCES "public"."profiles"("id") ON DELETE SET NULL,
  "infraction_id" uuid REFERENCES "public"."infractions"("id") ON DELETE SET NULL,
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "vehicle_tracking_events_plate_idx"
  ON "public"."vehicle_tracking_events" ("plate_number");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "vehicle_tracking_events_vehicle_idx"
  ON "public"."vehicle_tracking_events" ("vehicle_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "vehicle_tracking_events_created_idx"
  ON "public"."vehicle_tracking_events" ("created_at" DESC);
