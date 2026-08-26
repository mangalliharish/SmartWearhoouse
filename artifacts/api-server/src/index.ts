import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";

// Load .env from artifacts/api-server and root directory
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootEnvPath = path.resolve(__dirname, "..", "..", "..", ".env");
const localEnvPath = path.resolve(__dirname, "..", ".env");

if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
}
if (fs.existsSync(localEnvPath)) {
  dotenv.config({ path: localEnvPath });
}

import app from "./app.js";
import { logger } from "./lib/logger.js";
import { db, usersTable, ordersTable, quotationsTable, subOrdersTable, dbPath, saveDb } from "@workspace/db";

// Auto-seed demo data if database has no users (e.g. fresh production deployment)
async function ensureSeedData() {
  try {
    const existing = await db.select().from(usersTable).limit(1);
    if (existing.length === 0) {
      logger.info("Initializing demo seed data for first launch...");
      const passwordHash = await bcrypt.hash("password123", 10);

      const [admin] = await db
        .insert(usersTable)
        .values({
          name: "SmartWarehouse Admin",
          email: "admin@example.com",
          passwordHash,
          role: "admin",
        })
        .returning();

      const [buyer] = await db
        .insert(usersTable)
        .values({
          name: "Metro Construction Co.",
          email: "buyer@example.com",
          passwordHash,
          role: "buyer",
        })
        .returning();

      const [dealer1] = await db
        .insert(usersTable)
        .values({
          name: "Apex Materials Corp",
          email: "dealer1@example.com",
          passwordHash,
          role: "dealer",
        })
        .returning();

      const [dealer2] = await db
        .insert(usersTable)
        .values({
          name: "BuildPro Supplies Ltd",
          email: "dealer2@example.com",
          passwordHash,
          role: "dealer",
        })
        .returning();

      const [dealer3] = await db
        .insert(usersTable)
        .values({
          name: "Zenith Aggregates Co",
          email: "dealer3@example.com",
          passwordHash,
          role: "dealer",
        })
        .returning();

      // Sample Quoted Order
      const [order1] = await db
        .insert(ordersTable)
        .values({
          buyerId: buyer.id,
          material: "cement",
          totalQty: 1000,
          location: "Downtown High-Rise Site, Tower 2, Sector 4",
          deliveryDate: "2026-09-15",
          notes: "Grade 53 OPC Cement. Urgent requirement for foundation casting.",
          status: "quoted",
        })
        .returning();

      await db.insert(quotationsTable).values([
        {
          orderId: order1.id,
          dealerId: dealer1.id,
          pricePerUnit: 350,
          availableQty: 400,
          deliveryDate: "2026-09-14",
        },
        {
          orderId: order1.id,
          dealerId: dealer2.id,
          pricePerUnit: 340,
          availableQty: 300,
          deliveryDate: "2026-09-12",
        },
        {
          orderId: order1.id,
          dealerId: dealer3.id,
          pricePerUnit: 360,
          availableQty: 500,
          deliveryDate: "2026-09-13",
        },
      ]);

      saveDb();
      logger.info("Demo seed data created successfully");
    }
  } catch (err) {
    logger.warn({ err }, "Auto-seed initialization warning");
  }
}

// Use PORT from env or fallback to 8080
const port = Number(process.env.PORT) || 8080;

ensureSeedData().finally(() => {
  app.listen(port, () => {
    logger.info(`SmartWarehouse server running on port ${port}`);
    logger.info(`Database connected at: ${dbPath}`);
  });
});