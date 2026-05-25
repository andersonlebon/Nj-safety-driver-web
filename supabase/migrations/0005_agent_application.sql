DO $$ BEGIN
  CREATE TYPE "public"."agent_application_status" AS ENUM('pending', 'approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
ALTER TABLE "public"."profiles" ADD COLUMN IF NOT EXISTS "agent_application_status" "agent_application_status";
--> statement-breakpoint
ALTER TABLE "public"."profiles" ADD COLUMN IF NOT EXISTS "agent_badge_id" text;
--> statement-breakpoint
ALTER TABLE "public"."profiles" ADD COLUMN IF NOT EXISTS "agent_application_note" text;
