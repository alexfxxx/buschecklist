import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  boolean,
  uuid,
  unique,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Checklist submissions table
export const checklists = pgTable("checklists", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  vehicleNumber: varchar("vehicle_number").notNull(),
  submissionDate: timestamp("submission_date").defaultNow(),
  
  // Inspection items (true = pass, false = fail)
  parkingBrake: boolean("parking_brake").notNull(),
  fluidLevels: boolean("fluid_levels").notNull(),
  tires: boolean("tires").notNull(),
  engineFluids: boolean("engine_fluids").notNull(),
  lights: boolean("lights").notNull(),
  doorsAndSeatbelts: boolean("doors_and_seatbelts").notNull(),
  emergencyEquipment: boolean("emergency_equipment").notNull(),
  
  // Additional notes
  notes: text("notes"),
  
  // Status
  status: varchar("status").notNull().default("completed"), // "completed", "draft"
  overallStatus: varchar("overall_status").notNull(), // "all_passed", "needs_attention"
});

// Relations - removed since we no longer use user authentication

// Schemas for validation
export const insertChecklistSchema = createInsertSchema(checklists).omit({
  id: true,
  submissionDate: true,
  overallStatus: true,
}).extend({
  vehicleNumber: z.string().min(1, "Vehicle number is required"),
  parkingBrake: z.boolean({
    required_error: "Parking brake inspection is required",
  }),
  fluidLevels: z.boolean({
    required_error: "Fluid levels inspection is required",
  }),
  tires: z.boolean({
    required_error: "Tire inspection is required",
  }),
  engineFluids: z.boolean({
    required_error: "Engine fluids inspection is required",
  }),
  lights: z.boolean({
    required_error: "Lights inspection is required",
  }),
  doorsAndSeatbelts: z.boolean({
    required_error: "Doors and seatbelts inspection is required",
  }),
  emergencyEquipment: z.boolean({
    required_error: "Emergency equipment inspection is required",
  }),
  notes: z.string().optional(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertChecklist = z.infer<typeof insertChecklistSchema>;
export type Checklist = typeof checklists.$inferSelect;
