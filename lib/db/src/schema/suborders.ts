import { pgTable, text, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const subOrdersTable = pgTable("sub_orders", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  orderId: text("order_id").notNull(),
  dealerId: text("dealer_id").notNull(),
  allocatedQty: numeric("allocated_qty", { precision: 12, scale: 2 }).notNull(),
  pricePerUnit: numeric("price_per_unit", { precision: 12, scale: 2 }).notNull(),
  status: text("status", { enum: ["allocated", "dispatched", "delivered"] })
    .notNull()
    .default("allocated"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSubOrderSchema = createInsertSchema(subOrdersTable).omit({
  id: true,
  createdAt: true,
  status: true,
});

export type InsertSubOrder = z.infer<typeof insertSubOrderSchema>;
export type SubOrder = typeof subOrdersTable.$inferSelect;
