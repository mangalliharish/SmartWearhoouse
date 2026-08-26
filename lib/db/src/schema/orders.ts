import { sqliteTable, text, real, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const ordersTable = sqliteTable("orders", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  buyerId: text("buyer_id").notNull(),
  material: text("material", { enum: ["cement", "steel", "sand"] }).notNull(),
  totalQty: real("total_qty").notNull(),
  location: text("location").notNull(),
  deliveryDate: text("delivery_date").notNull(),
  notes: text("notes"),
  status: text("status", {
    enum: ["requested", "quoted", "allocated", "dispatched", "delivered"],
  })
    .notNull()
    .default("requested"),
  createdAt: integer("created_at", { mode: "timestamp" }).defaultNow().notNull(),
});

export const insertOrderSchema = createInsertSchema(ordersTable).omit({
  id: true,
  createdAt: true,
  status: true,
});

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof ordersTable.$inferSelect;
