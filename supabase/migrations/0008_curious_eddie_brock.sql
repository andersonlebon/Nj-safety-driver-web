CREATE TYPE "public"."agent_application_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."profile_role" AS ENUM('driver', 'staff');--> statement-breakpoint
CREATE TYPE "public"."staff_role" AS ENUM('agent', 'admin');--> statement-breakpoint
CREATE TYPE "public"."tracking_event_type" AS ENUM('infraction', 'agent_checkin', 'registration', 'verification', 'note');--> statement-breakpoint
CREATE TYPE "public"."transaction_status" AS ENUM('initialized', 'pending', 'unpaid', 'paid');--> statement-breakpoint
CREATE TYPE "public"."verification_status" AS ENUM('pending_documents', 'pending_review', 'active', 'rejected');--> statement-breakpoint
ALTER TYPE "public"."document_type" ADD VALUE 'vehicle_photo' BEFORE 'other';--> statement-breakpoint
ALTER TYPE "public"."document_type" ADD VALUE 'vehicle_registration' BEFORE 'other';--> statement-breakpoint
ALTER TYPE "public"."document_type" ADD VALUE 'passport' BEFORE 'other';--> statement-breakpoint
CREATE TABLE "document_groups" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"owner_id" uuid NOT NULL,
	"vehicle_id" uuid,
	"doc_type" "document_type" NOT NULL,
	"issued_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"verification_status" "verification_status" DEFAULT 'pending_review' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "driver_messages" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"driver_id" uuid NOT NULL,
	"sender_id" uuid,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "driver_profiles" (
	"profile_id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "infraction_templates" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"code" text NOT NULL,
	"label" text NOT NULL,
	"amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"points" integer DEFAULT 0 NOT NULL,
	"category" text DEFAULT 'safety' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "infraction_templates_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "staff_profiles" (
	"profile_id" uuid PRIMARY KEY NOT NULL,
	"staff_role" "staff_role" DEFAULT 'agent' NOT NULL,
	"badge_id" text,
	"application_status" "agent_application_status" DEFAULT 'pending',
	"application_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"infraction_id" uuid NOT NULL,
	"amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"status" "transaction_status" DEFAULT 'initialized' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicle_tracking_events" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"vehicle_id" uuid,
	"plate_number" text NOT NULL,
	"registration_country" text DEFAULT 'GA',
	"event_type" "tracking_event_type" NOT NULL,
	"location" text,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"recorded_by" uuid,
	"infraction_id" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "profiles" DROP CONSTRAINT IF EXISTS "profiles_national_id_unique";--> statement-breakpoint
ALTER TABLE "profiles" DROP CONSTRAINT IF EXISTS "profiles_driver_license_unique";--> statement-breakpoint
ALTER TABLE "vehicles" DROP CONSTRAINT IF EXISTS "vehicles_plate_number_unique";--> statement-breakpoint
ALTER TABLE "profiles" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4();--> statement-breakpoint
ALTER TABLE "profiles" ALTER COLUMN "role" SET DATA TYPE "public"."profile_role" USING "role"::text::"public"."profile_role";--> statement-breakpoint
ALTER TABLE "profiles" ALTER COLUMN "role" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "vehicles" ALTER COLUMN "owner_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "vehicle_id" uuid;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "group_id" uuid;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "label" text;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "file_hash" text;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "verification_status" "verification_status" DEFAULT 'pending_review' NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "user_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "nationality_country" text DEFAULT 'GA';--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "onboarded_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "verification_status" "verification_status" DEFAULT 'pending_documents' NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "admin_message" text;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "registration_country" text DEFAULT 'GA' NOT NULL;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "is_foreign" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "is_border_transit" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "border_checkpoint" text;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "border_entry_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "transit_driver_name" text;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "transit_driver_phone" text;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "transit_passport_id" text;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "foreign_notes" text;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "verification_status" "verification_status" DEFAULT 'pending_review' NOT NULL;--> statement-breakpoint
ALTER TABLE "document_groups" ADD CONSTRAINT "document_groups_owner_id_profiles_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_groups" ADD CONSTRAINT "document_groups_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "driver_messages" ADD CONSTRAINT "driver_messages_driver_id_profiles_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "driver_messages" ADD CONSTRAINT "driver_messages_sender_id_profiles_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "driver_profiles" ADD CONSTRAINT "driver_profiles_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_profiles" ADD CONSTRAINT "staff_profiles_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_infraction_id_infractions_id_fk" FOREIGN KEY ("infraction_id") REFERENCES "public"."infractions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_tracking_events" ADD CONSTRAINT "vehicle_tracking_events_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_tracking_events" ADD CONSTRAINT "vehicle_tracking_events_recorded_by_profiles_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_tracking_events" ADD CONSTRAINT "vehicle_tracking_events_infraction_id_infractions_id_fk" FOREIGN KEY ("infraction_id") REFERENCES "public"."infractions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_group_id_document_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."document_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
DROP TYPE IF EXISTS "public"."user_role" CASCADE;