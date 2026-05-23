-- =====================================================================
-- 0002 — Onboarding evidence uploads
--
-- Extends the documents table so it can store both driver-scoped and
-- vehicle-scoped photographic/PDF evidence captured during onboarding.
--
-- Changes:
--   1. Extend the document_type enum with `vehicle_photo` and
--      `vehicle_registration`.
--   2. Add a nullable documents.vehicle_id (FK → vehicles, cascade delete)
--      so vehicle-scoped docs link back to their vehicle while driver-
--      scoped docs (identity, driver_license, …) keep vehicle_id = null.
--   3. Add a nullable documents.label so the UI can record a side or
--      free-form descriptor ("front", "back", "rear", …) without needing
--      one enum value per side.
--
-- Every statement is idempotent so re-running `npm run db:push` is safe.
-- =====================================================================

ALTER TYPE "public"."document_type" ADD VALUE IF NOT EXISTS 'vehicle_photo';--> statement-breakpoint
ALTER TYPE "public"."document_type" ADD VALUE IF NOT EXISTS 'vehicle_registration';--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "vehicle_id" uuid;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "label" text;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "documents"
    ADD CONSTRAINT "documents_vehicle_id_vehicles_id_fk"
    FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id")
    ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
