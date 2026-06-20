import { sql } from "drizzle-orm";
import {
  boolean,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// ── Top-level workspace roles ────────────────────────────────────────────────
export const profileRole = pgEnum("profile_role", ["driver", "staff"]);

// ── Sub-roles within the staff workspace ────────────────────────────────────
export const staffRoleEnum = pgEnum("staff_role", ["agent", "admin"]);

// ── Shared domain enums ──────────────────────────────────────────────────────
export const paymentStatus = pgEnum("payment_status", [
  "unpaid",
  "paid",
  "pending",
]);
export const transactionStatus = pgEnum("transaction_status", [
  "initialized",
  "pending",
  "unpaid",
  "paid",
]);
export const documentType = pgEnum("document_type", [
  "identity",
  "driver_license",
  "insurance",
  "technical_inspection",
  "vehicle_photo",
  "vehicle_registration",
  "passport",
  "other",
]);
export const verificationStatus = pgEnum("verification_status", [
  "pending_documents",
  "pending_review",
  "active",
  "rejected",
]);
export const trackingEventType = pgEnum("tracking_event_type", [
  "infraction",
  "agent_checkin",
  "registration",
  "verification",
  "note",
]);
export const agentApplicationStatus = pgEnum("agent_application_status", [
  "pending",
  "approved",
  "rejected",
]);

// ── profiles ─────────────────────────────────────────────────────────────────
// One row per workspace. A user can have both a driver row and a staff row.
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().default(sql`uuid_generate_v4()`),
  userId: uuid("user_id").notNull(),
  role: profileRole("role").notNull(),
  fullName: text("full_name"),
  phone: text("phone"),
  nationalId: text("national_id"),
  driverLicense: text("driver_license"),
  address: text("address"),
  email: text("email"),
  nationalityCountry: text("nationality_country").default("GA"),
  onboardedAt: timestamp("onboarded_at", { withTimezone: true }),
  verificationStatus: verificationStatus("verification_status")
    .notNull()
    .default("pending_documents"),
  adminMessage: text("admin_message"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

// ── driver_profiles ───────────────────────────────────────────────────────────
export const driverProfiles = pgTable("driver_profiles", {
  profileId: uuid("profile_id")
    .primaryKey()
    .references(() => profiles.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

// ── staff_profiles ────────────────────────────────────────────────────────────
// Sub-role row for every staff profile. staff_role='admin' has elevated access.
export const staffProfiles = pgTable("staff_profiles", {
  profileId: uuid("profile_id")
    .primaryKey()
    .references(() => profiles.id, { onDelete: "cascade" }),
  staffRole: staffRoleEnum("staff_role").notNull().default("agent"),
  badgeId: text("badge_id"),
  applicationStatus: agentApplicationStatus("application_status").default(
    "pending"
  ),
  applicationNote: text("application_note"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

// ── vehicles ──────────────────────────────────────────────────────────────────
export const vehicles = pgTable("vehicles", {
  id: uuid("id").primaryKey().default(sql`uuid_generate_v4()`),
  ownerId: uuid("owner_id").references(() => profiles.id, {
    onDelete: "cascade",
  }),
  plateNumber: text("plate_number").notNull(),
  registrationCountry: text("registration_country").notNull().default("GA"),
  isForeign: boolean("is_foreign").notNull().default(false),
  isBorderTransit: boolean("is_border_transit").notNull().default(false),
  borderCheckpoint: text("border_checkpoint"),
  borderEntryAt: timestamp("border_entry_at", { withTimezone: true }),
  transitDriverName: text("transit_driver_name"),
  transitDriverPhone: text("transit_driver_phone"),
  transitPassportId: text("transit_passport_id"),
  foreignNotes: text("foreign_notes"),
  brand: text("brand"),
  model: text("model"),
  color: text("color"),
  year: integer("year"),
  insuranceStatus: boolean("insurance_status").notNull().default(false),
  inspectionStatus: boolean("inspection_status").notNull().default(false),
  verificationStatus: verificationStatus("verification_status")
    .notNull()
    .default("pending_review"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

// ── document_groups ───────────────────────────────────────────────────────────
export const documentGroups = pgTable("document_groups", {
  id: uuid("id").primaryKey().default(sql`uuid_generate_v4()`),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  vehicleId: uuid("vehicle_id").references(() => vehicles.id, {
    onDelete: "cascade",
  }),
  docType: documentType("doc_type").notNull(),
  issuedAt: timestamp("issued_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  verificationStatus: verificationStatus("verification_status")
    .notNull()
    .default("pending_review"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

// ── documents ─────────────────────────────────────────────────────────────────
export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().default(sql`uuid_generate_v4()`),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  vehicleId: uuid("vehicle_id").references(() => vehicles.id, {
    onDelete: "cascade",
  }),
  groupId: uuid("group_id").references(() => documentGroups.id, {
    onDelete: "cascade",
  }),
  docType: documentType("doc_type").notNull(),
  label: text("label"),
  filePath: text("file_path").notNull(),
  fileName: text("file_name"),
  fileHash: text("file_hash"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  verificationStatus: verificationStatus("verification_status")
    .notNull()
    .default("pending_review"),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

// ── infractions ───────────────────────────────────────────────────────────────
export const infractions = pgTable("infractions", {
  id: uuid("id").primaryKey().default(sql`uuid_generate_v4()`),
  plateNumber: text("plate_number").notNull(),
  vehicleId: uuid("vehicle_id").references(() => vehicles.id, {
    onDelete: "set null",
  }),
  driverId: uuid("driver_id").references(() => profiles.id, {
    onDelete: "set null",
  }),
  agentId: uuid("agent_id").references(() => profiles.id, {
    onDelete: "set null",
  }),
  infractionType: text("infraction_type").notNull(),
  description: text("description"),
  location: text("location"),
  fineAmount: numeric("fine_amount", { precision: 10, scale: 2 })
    .notNull()
    .default("0"),
  status: paymentStatus("status").notNull().default("unpaid"),
  evidencePath: text("evidence_path"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

// ── transactions ──────────────────────────────────────────────────────────────
export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().default(sql`uuid_generate_v4()`),
  infractionId: uuid("infraction_id")
    .notNull()
    .references(() => infractions.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull().default("0"),
  status: transactionStatus("status").notNull().default("initialized"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

// ── infraction_templates ──────────────────────────────────────────────────────
export const infractionTemplates = pgTable("infraction_templates", {
  id: uuid("id").primaryKey().default(sql`uuid_generate_v4()`),
  code: text("code").notNull().unique(),
  label: text("label").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull().default("0"),
  points: integer("points").notNull().default(0),
  category: text("category").notNull().default("safety"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

// ── driver_messages ───────────────────────────────────────────────────────────
export const driverMessages = pgTable("driver_messages", {
  id: uuid("id").primaryKey().default(sql`uuid_generate_v4()`),
  driverId: uuid("driver_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  senderId: uuid("sender_id").references(() => profiles.id, {
    onDelete: "set null",
  }),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

// ── vehicle_tracking_events ───────────────────────────────────────────────────
export const vehicleTrackingEvents = pgTable("vehicle_tracking_events", {
  id: uuid("id").primaryKey().default(sql`uuid_generate_v4()`),
  vehicleId: uuid("vehicle_id").references(() => vehicles.id, {
    onDelete: "set null",
  }),
  plateNumber: text("plate_number").notNull(),
  registrationCountry: text("registration_country").default("GA"),
  eventType: trackingEventType("event_type").notNull(),
  location: text("location"),
  latitude: numeric("latitude", { precision: 10, scale: 7 }),
  longitude: numeric("longitude", { precision: 10, scale: 7 }),
  recordedBy: uuid("recorded_by").references(() => profiles.id, {
    onDelete: "set null",
  }),
  infractionId: uuid("infraction_id").references(() => infractions.id, {
    onDelete: "set null",
  }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

// ── Drizzle inferred types ────────────────────────────────────────────────────
export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
export type DriverProfile = typeof driverProfiles.$inferSelect;
export type StaffProfile = typeof staffProfiles.$inferSelect;
export type Vehicle = typeof vehicles.$inferSelect;
export type NewVehicle = typeof vehicles.$inferInsert;
export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
export type DocumentGroup = typeof documentGroups.$inferSelect;
export type NewDocumentGroup = typeof documentGroups.$inferInsert;
export type Infraction = typeof infractions.$inferSelect;
export type NewInfraction = typeof infractions.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type InfractionTemplateRow = typeof infractionTemplates.$inferSelect;
export type DriverMessage = typeof driverMessages.$inferSelect;
