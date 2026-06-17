-- Multi-profile auth: one auth user can own multiple typed profiles.

ALTER TABLE "public"."profiles"
  ADD COLUMN IF NOT EXISTS "user_id" uuid;

UPDATE "public"."profiles"
SET "user_id" = "id"
WHERE "user_id" IS NULL;

ALTER TABLE "public"."profiles"
  ALTER COLUMN "user_id" SET NOT NULL;

CREATE TABLE IF NOT EXISTS "public"."user_profile_links" (
  "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "user_id" uuid NOT NULL,
  "profile_id" uuid NOT NULL REFERENCES "public"."profiles"("id") ON DELETE CASCADE,
  "profile_type" "public"."user_role" NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "user_profile_links_user_profile_unique" UNIQUE ("user_id", "profile_id"),
  CONSTRAINT "user_profile_links_user_type_unique" UNIQUE ("user_id", "profile_type")
);

INSERT INTO "public"."user_profile_links" ("user_id", "profile_id", "profile_type")
SELECT "user_id", "id", "role"
FROM "public"."profiles"
ON CONFLICT ("user_id", "profile_type") DO NOTHING;

CREATE INDEX IF NOT EXISTS "profiles_user_id_idx" ON "public"."profiles" ("user_id");
CREATE INDEX IF NOT EXISTS "user_profile_links_user_id_idx" ON "public"."user_profile_links" ("user_id");
