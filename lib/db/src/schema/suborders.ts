import { sqliteTable, text, real, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const subOrdersTable = sqliteTable("sub_orders", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  orderId: text("order_id").notNull(),
  dealerId: text("dealer_id").notNull(),
  allocatedQty: real("allocated_qty").notNull(),
  pricePerUnit: real("price_per_unit").notNull(),
  status: text("status", { enum: ["allocated", "dispatched", "delivered"] })
    .notNull()
    .default("allocated"),
  createdAt: integer("created_at", { mode: "timestamp" }).defaultNow().notNull(),
});

export const insertSubOrderSchema = createInsertSchema(subOrdersTable).omit({
  id: true,
  createdAt: true,
  status: true,
});

export type InsertSubOrder = z.infer<typeof insertSubOrderSchema>;
export type SubOrder = typeof subOrdersTable.$inferSelect;
