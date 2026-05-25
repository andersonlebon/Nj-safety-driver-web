DO $$ BEGIN
  CREATE TYPE "public"."verification_status" AS ENUM(
    'pending_documents',
    'pending_review',
    'active',
    'rejected'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
ALTER TABLE "public"."profiles" ADD COLUMN IF NOT EXISTS "verification_status" "verification_status" DEFAULT 'pending_documents' NOT NULL;
--> statement-breakpoint
ALTER TABLE "public"."profiles" ADD COLUMN IF NOT EXISTS "admin_message" text;
--> statement-breakpoint
ALTER TABLE "public"."vehicles" ADD COLUMN IF NOT EXISTS "verification_status" "verification_status" DEFAULT 'pending_review' NOT NULL;
--> statement-breakpoint
ALTER TABLE "public"."documents" ADD COLUMN IF NOT EXISTS "expires_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "public"."documents" ADD COLUMN IF NOT EXISTS "verification_status" "verification_status" DEFAULT 'pending_review' NOT NULL;
