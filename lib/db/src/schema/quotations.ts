import { sqliteTable, text, real, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const quotationsTable = sqliteTable("quotations", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  orderId: text("order_id").notNull(),
  dealerId: text("dealer_id").notNull(),
  pricePerUnit: real("price_per_unit").notNull(),
  availableQty: real("available_qty").notNull(),
  deliveryDate: text("delivery_date").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).defaultNow().notNull(),
});

export const insertQuotationSchema = createInsertSchema(quotationsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertQuotation = z.infer<typeof insertQuotationSchema>;
export type Quotation = typeof quotationsTable.$inferSelect;
