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

export const userRole = pgEnum("user_role", ["driver", "agent", "admin"]);
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

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().notNull(),
  role: userRole("role").notNull().default("driver"),
  fullName: text("full_name"),
  phone: text("phone"),
  nationalId: text("national_id").unique(),
  driverLicense: text("driver_license").unique(),
  address: text("address"),
  email: text("email"),
  onboardedAt: timestamp("onboarded_at", { withTimezone: true }),
  verificationStatus: verificationStatus("verification_status")
    .notNull()
    .default("pending_documents"),
  adminMessage: text("admin_message"),
  agentApplicationStatus: agentApplicationStatus("agent_application_status"),
  agentBadgeId: text("agent_badge_id"),
  agentApplicationNote: text("agent_application_note"),
  nationalityCountry: text("nationality_country").default("GA"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

export const vehicles = pgTable("vehicles", {
  id: uuid("id").primaryKey().default(sql`uuid_generate_v4()`),
  ownerId: uuid("owner_id").references(() => profiles.id, { onDelete: "cascade" }),
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

export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().default(sql`uuid_generate_v4()`),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  vehicleId: uuid("vehicle_id").references(() => vehicles.id, {
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

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
export type Vehicle = typeof vehicles.$inferSelect;
export type NewVehicle = typeof vehicles.$inferInsert;
export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
export type Infraction = typeof infractions.$inferSelect;
export type NewInfraction = typeof infractions.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type InfractionTemplateRow = typeof infractionTemplates.$inferSelect;
export type DriverMessage = typeof driverMessages.$inferSelect;
