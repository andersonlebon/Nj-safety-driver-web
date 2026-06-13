-- Logical documents with multiple attachments and document-level dates.

CREATE TABLE IF NOT EXISTS "public"."document_groups" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
  "owner_id" uuid NOT NULL REFERENCES "public"."profiles"("id") ON DELETE CASCADE,
  "vehicle_id" uuid REFERENCES "public"."vehicles"("id") ON DELETE CASCADE,
  "doc_type" "public"."document_type" NOT NULL,
  "issued_at" timestamp with time zone,
  "expires_at" timestamp with time zone,
  "verification_status" "public"."verification_status" DEFAULT 'pending_review' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "public"."documents"
  ADD COLUMN IF NOT EXISTS "group_id" uuid REFERENCES "public"."document_groups"("id") ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS "document_groups_owner_idx"
  ON "public"."document_groups" ("owner_id");

CREATE INDEX IF NOT EXISTS "document_groups_vehicle_idx"
  ON "public"."document_groups" ("vehicle_id");

CREATE INDEX IF NOT EXISTS "documents_group_id_idx"
  ON "public"."documents" ("group_id");

-- Backfill groups from existing attachment rows.
INSERT INTO "public"."document_groups" (
  "owner_id",
  "vehicle_id",
  "doc_type",
  "expires_at",
  "verification_status",
  "created_at"
)
SELECT DISTINCT ON (
  "owner_id",
  COALESCE("vehicle_id", '00000000-0000-0000-0000-000000000000'::uuid),
  "doc_type"
)
  "owner_id",
  "vehicle_id",
  "doc_type",
  "expires_at",
  "verification_status",
  "uploaded_at"
FROM "public"."documents"
WHERE "group_id" IS NULL
ORDER BY
  "owner_id",
  COALESCE("vehicle_id", '00000000-0000-0000-0000-000000000000'::uuid),
  "doc_type",
  "uploaded_at" ASC;

UPDATE "public"."documents" AS "d"
SET "group_id" = "g"."id"
FROM "public"."document_groups" AS "g"
WHERE "d"."group_id" IS NULL
  AND "d"."owner_id" = "g"."owner_id"
  AND "d"."doc_type" = "g"."doc_type"
  AND ("d"."vehicle_id" IS NOT DISTINCT FROM "g"."vehicle_id");

-- Attachments should not carry expiry metadata anymore.
UPDATE "public"."documents"
SET "expires_at" = NULL
WHERE "group_id" IS NOT NULL;
