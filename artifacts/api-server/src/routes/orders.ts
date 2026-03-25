import { Router, type IRouter } from "express";
import { db, ordersTable, usersTable, quotationsTable, subOrdersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { authenticateToken, requireRole, type AuthRequest } from "../middlewares/auth.js";

const router: IRouter = Router();

router.get("/", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const orders = await db
      .select({
        id: ordersTable.id,
        buyerId: ordersTable.buyerId,
        material: ordersTable.material,
        totalQty: ordersTable.totalQty,
        location: ordersTable.location,
        deliveryDate: ordersTable.deliveryDate,
        notes: ordersTable.notes,
        status: ordersTable.status,
        createdAt: ordersTable.createdAt,
        buyerName: usersTable.name,
      })
      .from(ordersTable)
      .leftJoin(usersTable, eq(ordersTable.buyerId, usersTable.id))
      .orderBy(desc(ordersTable.createdAt));

    const filtered =
      req.userRole === "buyer"
        ? orders.filter((o) => o.buyerId === req.userId)
        : orders;

    res.json(filtered);
  } catch (err) {
    req.log.error({ err }, "Get orders error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", authenticateToken, requireRole("buyer"), async (req: AuthRequest, res) => {
  const { material, totalQty, location, deliveryDate, notes } = req.body;

  if (!material || !totalQty || !location || !deliveryDate) {
    res.status(400).json({ error: "material, totalQty, location, and deliveryDate are required" });
    return;
  }

  if (!["cement", "steel", "sand"].includes(material)) {
    res.status(400).json({ error: "Invalid material type" });
    return;
  }

  try {
    const [order] = await db
      .insert(ordersTable)
      .values({
        buyerId: req.userId!,
        material,
        totalQty: String(totalQty),
        location,
        deliveryDate,
        notes: notes || null,
      })
      .returning();

    const buyer = await db
      .select({ name: usersTable.name })
      .from(usersTable)
      .where(eq(usersTable.id, req.userId!))
      .limit(1);

    res.status(201).json({ ...order, buyerName: buyer[0]?.name || "" });
  } catch (err) {
    req.log.error({ err }, "Create order error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:orderId", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const [order] = await db
      .select({
        id: ordersTable.id,
        buyerId: ordersTable.buyerId,
        material: ordersTable.material,
        totalQty: ordersTable.totalQty,
        location: ordersTable.location,
        deliveryDate: ordersTable.deliveryDate,
        notes: ordersTable.notes,
        status: ordersTable.status,
        createdAt: ordersTable.createdAt,
        buyerName: usersTable.name,
      })
      .from(ordersTable)
      .leftJoin(usersTable, eq(ordersTable.buyerId, usersTable.id))
      .where(eq(ordersTable.id, req.params.orderId))
      .limit(1);

    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    res.json(order);
  } catch (err) {
    req.log.error({ err }, "Get order error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post(
  "/:orderId/allocate",
  authenticateToken,
  requireRole("admin"),
  async (req: AuthRequest, res) => {
    const { orderId } = req.params;

    try {
      const [order] = await db
        .select()
        .from(ordersTable)
        .where(eq(ordersTable.id, orderId))
        .limit(1);

      if (!order) {
        res.status(404).json({ error: "Order not found" });
        return;
      }

      const quotations = await db
        .select({
          id: quotationsTable.id,
          dealerId: quotationsTable.dealerId,
          pricePerUnit: quotationsTable.pricePerUnit,
          availableQty: quotationsTable.availableQty,
          dealerName: usersTable.name,
        })
        .from(quotationsTable)
        .leftJoin(usersTable, eq(quotationsTable.dealerId, usersTable.id))
        .where(eq(quotationsTable.orderId, orderId));

      if (quotations.length === 0) {
        res.status(400).json({ error: "No quotations found for this order" });
        return;
      }

      const sorted = [...quotations].sort(
        (a, b) => parseFloat(a.pricePerUnit) - parseFloat(b.pricePerUnit)
      );

      let remaining = parseFloat(order.totalQty);
      const allocations: {
        dealerId: string;
        dealerName: string | null;
        allocatedQty: number;
        pricePerUnit: number;
      }[] = [];

      for (const q of sorted) {
        if (remaining <= 0) break;
        const available = parseFloat(q.availableQty);
        const allocated = Math.min(available, remaining);
        allocations.push({
          dealerId: q.dealerId,
          dealerName: q.dealerName,
          allocatedQty: allocated,
          pricePerUnit: parseFloat(q.pricePerUnit),
        });
        remaining -= allocated;
      }

      if (remaining > 0) {
        res.status(400).json({
          error: `Insufficient supply. ${remaining} units unallocated after all quotations.`,
        });
        return;
      }

      await db.delete(subOrdersTable).where(eq(subOrdersTable.orderId, orderId));

      const subOrders = await db
        .insert(subOrdersTable)
        .values(
          allocations.map((a) => ({
            orderId,
            dealerId: a.dealerId,
            allocatedQty: String(a.allocatedQty),
            pricePerUnit: String(a.pricePerUnit),
          }))
        )
        .returning();

      await db
        .update(ordersTable)
        .set({ status: "allocated" })
        .where(eq(ordersTable.id, orderId));

      const enriched = subOrders.map((so, i) => ({
        ...so,
        dealerName: allocations[i].dealerName,
        material: order.material,
        location: order.location,
      }));

      res.json(enriched);
    } catch (err) {
      req.log.error({ err }, "Auto allocate error");
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
