import { Router, type IRouter } from "express";
import { db, quotationsTable, usersTable, ordersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authenticateToken, requireRole, type AuthRequest } from "../middlewares/auth.js";

const router: IRouter = Router();

router.post("/", authenticateToken, requireRole("dealer"), async (req: AuthRequest, res) => {
  const { orderId, pricePerUnit, availableQty, deliveryDate } = req.body;

  if (!orderId || !pricePerUnit || !availableQty || !deliveryDate) {
    res.status(400).json({ error: "All fields are required" });
    return;
  }

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

    const [quotation] = await db
      .insert(quotationsTable)
      .values({
        orderId,
        dealerId: req.userId!,
        pricePerUnit: String(pricePerUnit),
        availableQty: String(availableQty),
        deliveryDate,
      })
      .returning();

    const dealer = await db
      .select({ name: usersTable.name })
      .from(usersTable)
      .where(eq(usersTable.id, req.userId!))
      .limit(1);

    await db
      .update(ordersTable)
      .set({ status: "quoted" })
      .where(eq(ordersTable.id, orderId));

    res.status(201).json({ ...quotation, dealerName: dealer[0]?.name || "" });
  } catch (err) {
    req.log.error({ err }, "Submit quotation error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:orderId", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const quotations = await db
      .select({
        id: quotationsTable.id,
        orderId: quotationsTable.orderId,
        dealerId: quotationsTable.dealerId,
        pricePerUnit: quotationsTable.pricePerUnit,
        availableQty: quotationsTable.availableQty,
        deliveryDate: quotationsTable.deliveryDate,
        createdAt: quotationsTable.createdAt,
        dealerName: usersTable.name,
      })
      .from(quotationsTable)
      .leftJoin(usersTable, eq(quotationsTable.dealerId, usersTable.id))
      .where(eq(quotationsTable.orderId, req.params.orderId));

    res.json(quotations);
  } catch (err) {
    req.log.error({ err }, "Get quotations error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
