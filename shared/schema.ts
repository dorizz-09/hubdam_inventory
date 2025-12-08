import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Barracks table
export const barracks = pgTable("barracks", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  location: text("location").notNull(),
  photoUrl: text("photo_url"),
  verified: boolean("verified").notNull().default(false),
  picId: integer("pic_id").references(() => pics.id),
});

// Person in Charge (PIC) table
export const pics = pgTable("pics", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  rank: text("rank"),
});

// Admin table
export const admins = pgTable("admins", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
});

// Inventory table
export const inventory = pgTable("inventory", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  barackId: integer("barack_id").notNull().references(() => barracks.id, { onDelete: "cascade" }),
  itemName: text("item_name").notNull(),
  quantity: integer("quantity").notNull().default(0),
  status: text("status").notNull().default("APBN"),
});

// Members table
export const members = pgTable("members", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  barackId: integer("barack_id").notNull().references(() => barracks.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  rank: text("rank"),
  role: text("role"),
});

// Relations
export const barracksRelations = relations(barracks, ({ one, many }) => ({
  pic: one(pics, {
    fields: [barracks.picId],
    references: [pics.id],
  }),
  inventory: many(inventory),
  members: many(members),
}));

export const picsRelations = relations(pics, ({ many }) => ({
  barracks: many(barracks),
}));

export const inventoryRelations = relations(inventory, ({ one }) => ({
  barracks: one(barracks, {
    fields: [inventory.barackId],
    references: [barracks.id],
  }),
}));

export const membersRelations = relations(members, ({ one }) => ({
  barracks: one(barracks, {
    fields: [members.barackId],
    references: [barracks.id],
  }),
}));

// Insert schemas
export const insertBarrackSchema = createInsertSchema(barracks).omit({
  id: true,
  verified: true,
  picId: true,
}).extend({
  picName: z.string().optional(),
  picPassword: z.string().optional(),
});

export const insertPicSchema = createInsertSchema(pics).omit({
  id: true,
  passwordHash: true,
}).extend({
  password: z.string().min(6),
});

export const insertAdminSchema = createInsertSchema(admins).omit({
  id: true,
  passwordHash: true,
}).extend({
  password: z.string().min(6),
});

export const insertInventorySchema = createInsertSchema(inventory).omit({
  id: true,
});

export const insertMemberSchema = createInsertSchema(members).omit({
  id: true,
});

// Select types
export type Barrack = typeof barracks.$inferSelect;
export type Pic = typeof pics.$inferSelect;
export type Admin = typeof admins.$inferSelect;
export type InventoryItem = typeof inventory.$inferSelect;
export type Member = typeof members.$inferSelect;

// Insert types
export type InsertBarrack = z.infer<typeof insertBarrackSchema>;
export type InsertPic = z.infer<typeof insertPicSchema>;
export type InsertAdmin = z.infer<typeof insertAdminSchema>;
export type InsertInventory = z.infer<typeof insertInventorySchema>;
export type InsertMember = z.infer<typeof insertMemberSchema>;

// Additional schemas for authentication
export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export type LoginCredentials = z.infer<typeof loginSchema>;

// Barrack detail type (includes relations)
export type BarrackDetail = Barrack & {
  pic: Pic | null;
  inventory: InventoryItem[];
  members: Member[];
};
