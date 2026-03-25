import { pgTable, text, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const ordersTable = pgTable("orders", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  buyerId: text("buyer_id").notNull(),
  material: text("material", { enum: ["cement", "steel", "sand"] }).notNull(),
  totalQty: numeric("total_qty", { precision: 12, scale: 2 }).notNull(),
  location: text("location").notNull(),
  deliveryDate: text("delivery_date").notNull(),
  notes: text("notes"),
  status: text("status", {
    enum: ["requested", "quoted", "allocated", "dispatched", "delivered"],
  })
    .notNull()
    .default("requested"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertOrderSchema = createInsertSchema(ordersTable).omit({
  id: true,
  createdAt: true,
  status: true,
});

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof ordersTable.$inferSelect;
