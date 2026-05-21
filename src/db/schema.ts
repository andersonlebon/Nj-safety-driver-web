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
export const documentType = pgEnum("document_type", [
  "identity",
  "driver_license",
  "insurance",
  "technical_inspection",
  "other",
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
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

export const vehicles = pgTable("vehicles", {
  id: uuid("id").primaryKey().default(sql`uuid_generate_v4()`),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  plateNumber: text("plate_number").notNull().unique(),
  brand: text("brand"),
  model: text("model"),
  color: text("color"),
  year: integer("year"),
  insuranceStatus: boolean("insurance_status").notNull().default(false),
  inspectionStatus: boolean("inspection_status").notNull().default(false),
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
  docType: documentType("doc_type").notNull(),
  filePath: text("file_path").notNull(),
  fileName: text("file_name"),
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

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
export type Vehicle = typeof vehicles.$inferSelect;
export type NewVehicle = typeof vehicles.$inferInsert;
export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
export type Infraction = typeof infractions.$inferSelect;
export type NewInfraction = typeof infractions.$inferInsert;
