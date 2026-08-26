import bcrypt from "bcryptjs";
import { db, usersTable, ordersTable, quotationsTable, subOrdersTable, saveDb } from "@workspace/db";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("🌱 Seeding SmartWarehouse database...");

  // Clear existing records to ensure fresh demo state
  await db.delete(subOrdersTable);
  await db.delete(quotationsTable);
  await db.delete(ordersTable);
  await db.delete(usersTable);

  const passwordHash = await bcrypt.hash("password123", 10);

  // 1. Create Users
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

  console.log("✅ Users created:");
  console.log("   - Admin:    admin@example.com    / password123");
  console.log("   - Buyer:    buyer@example.com    / password123");
  console.log("   - Dealer 1: dealer1@example.com  / password123 (Apex Materials)");
  console.log("   - Dealer 2: dealer2@example.com  / password123 (BuildPro Supplies)");
  console.log("   - Dealer 3: dealer3@example.com  / password123 (Zenith Aggregates)");

  // 2. Create Order 1: Cement (Quoted status, ready for Auto Allocate)
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

  // Dealer Quotations for Order 1
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
      pricePerUnit: 340, // Lowest price
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

  // 3. Create Order 2: Steel (Allocated status with sub-orders)
  const [order2] = await db
    .insert(ordersTable)
    .values({
      buyerId: buyer.id,
      material: "steel",
      totalQty: 500,
      location: "Metro Rail Viaduct Pier 42-48",
      deliveryDate: "2026-09-20",
      notes: "TMT 550D Rebars in 12m lengths.",
      status: "allocated",
    })
    .returning();

  await db.insert(quotationsTable).values([
    {
      orderId: order2.id,
      dealerId: dealer1.id,
      pricePerUnit: 680,
      availableQty: 300,
      deliveryDate: "2026-09-18",
    },
    {
      orderId: order2.id,
      dealerId: dealer2.id,
      pricePerUnit: 700,
      availableQty: 400,
      deliveryDate: "2026-09-19",
    },
  ]);

  await db.insert(subOrdersTable).values([
    {
      orderId: order2.id,
      dealerId: dealer1.id,
      allocatedQty: 300,
      pricePerUnit: 680,
      status: "dispatched",
    },
    {
      orderId: order2.id,
      dealerId: dealer2.id,
      allocatedQty: 200,
      pricePerUnit: 700,
      status: "allocated",
    },
  ]);

  // 4. Create Order 3: Sand (Delivered status)
  const [order3] = await db
    .insert(ordersTable)
    .values({
      buyerId: buyer.id,
      material: "sand",
      totalQty: 200,
      location: "Highway Bridge Overpass, Km 14.5",
      deliveryDate: "2026-08-30",
      notes: "River sand washed and filtered.",
      status: "delivered",
    })
    .returning();

  await db.insert(subOrdersTable).values([
    {
      orderId: order3.id,
      dealerId: dealer3.id,
      allocatedQty: 200,
      pricePerUnit: 120,
      status: "delivered",
    },
  ]);

  saveDb();
  console.log("✅ Orders, quotations, and allocations seeded successfully!");
}

seed().catch((e) => {
  console.error("❌ Seed failed:", e);
  process.exit(1);
});
