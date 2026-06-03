-- Foreign & border-crossing vehicles: country on plate, transit registration without owner account

ALTER TABLE "public"."profiles" ADD COLUMN IF NOT EXISTS "nationality_country" text DEFAULT 'GA';
--> statement-breakpoint
ALTER TABLE "public"."vehicles" ADD COLUMN IF NOT EXISTS "registration_country" text NOT NULL DEFAULT 'GA';
--> statement-breakpoint
ALTER TABLE "public"."vehicles" ADD COLUMN IF NOT EXISTS "is_foreign" boolean NOT NULL DEFAULT false;
--> statement-breakpoint
ALTER TABLE "public"."vehicles" ADD COLUMN IF NOT EXISTS "is_border_transit" boolean NOT NULL DEFAULT false;
--> statement-breakpoint
ALTER TABLE "public"."vehicles" ADD COLUMN IF NOT EXISTS "border_checkpoint" text;
--> statement-breakpoint
ALTER TABLE "public"."vehicles" ADD COLUMN IF NOT EXISTS "border_entry_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "public"."vehicles" ADD COLUMN IF NOT EXISTS "transit_driver_name" text;
--> statement-breakpoint
ALTER TABLE "public"."vehicles" ADD COLUMN IF NOT EXISTS "transit_driver_phone" text;
--> statement-breakpoint
ALTER TABLE "public"."vehicles" ADD COLUMN IF NOT EXISTS "transit_passport_id" text;
--> statement-breakpoint
ALTER TABLE "public"."vehicles" ADD COLUMN IF NOT EXISTS "foreign_notes" text;
--> statement-breakpoint
ALTER TABLE "public"."vehicles" ALTER COLUMN "owner_id" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "public"."infractions" ADD COLUMN IF NOT EXISTS "registration_country" text DEFAULT 'GA';
--> statement-breakpoint
ALTER TABLE "public"."vehicle_tracking_events" ADD COLUMN IF NOT EXISTS "registration_country" text DEFAULT 'GA';
