-- Core data additions for Nj-Drive workflow fixes.

CREATE TYPE "public"."transaction_status" AS ENUM (
  'initialized',
  'pending',
  'unpaid',
  'paid'
);

ALTER TABLE "public"."documents"
  ADD COLUMN IF NOT EXISTS "file_hash" text;

CREATE INDEX IF NOT EXISTS "documents_owner_doc_hash_idx"
  ON "public"."documents" ("owner_id", "doc_type", "file_hash")
  WHERE "file_hash" IS NOT NULL;

CREATE TABLE IF NOT EXISTS "public"."transactions" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "infraction_id" uuid NOT NULL REFERENCES "public"."infractions"("id") ON DELETE cascade,
  "amount" numeric(10, 2) NOT NULL DEFAULT '0',
  "status" "public"."transaction_status" NOT NULL DEFAULT 'initialized',
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "transactions_infraction_id_unique" UNIQUE ("infraction_id")
);

CREATE TABLE IF NOT EXISTS "public"."infraction_templates" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "code" text NOT NULL UNIQUE,
  "label" text NOT NULL,
  "amount" numeric(10, 2) NOT NULL DEFAULT '0',
  "points" integer NOT NULL DEFAULT 0,
  "category" text NOT NULL DEFAULT 'safety',
  "active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "public"."driver_messages" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "driver_id" uuid NOT NULL REFERENCES "public"."profiles"("id") ON DELETE cascade,
  "sender_id" uuid REFERENCES "public"."profiles"("id") ON DELETE set null,
  "body" text NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

INSERT INTO "public"."infraction_templates" ("code", "label", "amount", "points", "category")
VALUES
  ('speeding', 'Speeding', 25000, 2, 'safety'),
  ('running_red_light', 'Running red light', 30000, 2, 'safety'),
  ('illegal_parking', 'Illegal parking', 10000, 1, 'parking'),
  ('reckless_driving', 'Reckless driving', 50000, 4, 'conduct'),
  ('driving_without_insurance', 'Driving without insurance', 75000, 5, 'documents'),
  ('expired_inspection', 'Expired inspection', 40000, 3, 'documents'),
  ('no_seatbelt', 'No seatbelt', 10000, 1, 'safety')
ON CONFLICT ("code") DO UPDATE
SET
  "label" = EXCLUDED."label",
  "amount" = EXCLUDED."amount",
  "points" = EXCLUDED."points",
  "category" = EXCLUDED."category",
  "active" = true,
  "updated_at" = now();

INSERT INTO "public"."transactions" ("infraction_id", "amount", "status", "created_at", "updated_at")
SELECT "id", "fine_amount", "status"::text::"public"."transaction_status", "created_at", now()
FROM "public"."infractions"
ON CONFLICT ("infraction_id") DO NOTHING;

