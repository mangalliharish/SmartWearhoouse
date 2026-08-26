import { Router, type IRouter } from "express";
import { db, subOrdersTable, usersTable, ordersTable, saveDb } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authenticateToken, requireRole, type AuthRequest } from "../middlewares/auth.js";

const router: IRouter = Router();

router.get("/:orderId", authenticateToken, async (req: AuthRequest, res) => {
  const orderId = String(req.params.orderId);
  try {
    const subOrders = await db
      .select({
        id: subOrdersTable.id,
        orderId: subOrdersTable.orderId,
        dealerId: subOrdersTable.dealerId,
        allocatedQty: subOrdersTable.allocatedQty,
        pricePerUnit: subOrdersTable.pricePerUnit,
        status: subOrdersTable.status,
        createdAt: subOrdersTable.createdAt,
        dealerName: usersTable.name,
        material: ordersTable.material,
        location: ordersTable.location,
      })
      .from(subOrdersTable)
      .leftJoin(usersTable, eq(subOrdersTable.dealerId, usersTable.id))
      .leftJoin(ordersTable, eq(subOrdersTable.orderId, ordersTable.id))
      .where(eq(subOrdersTable.orderId, orderId));

    res.json(subOrders);
  } catch (err) {
    req.log.error({ err }, "Get suborders error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch(
  "/:subOrderId/status",
  authenticateToken,
  requireRole("dealer"),
  async (req: AuthRequest, res) => {
    const subOrderId = String(req.params.subOrderId);
    const { status } = req.body;

    if (!status || !["dispatched", "delivered"].includes(status)) {
      res.status(400).json({ error: "Valid status (dispatched or delivered) is required" });
      return;
    }

    try {
      const [existing] = await db
        .select()
        .from(subOrdersTable)
        .where(eq(subOrdersTable.id, subOrderId))
        .limit(1);

      if (!existing) {
        res.status(404).json({ error: "Sub-order not found" });
        return;
      }

      if (existing.dealerId !== req.userId) {
        res.status(403).json({ error: "Not authorized to update this sub-order" });
        return;
      }

      const [updated] = await db
        .update(subOrdersTable)
        .set({ status })
        .where(eq(subOrdersTable.id, subOrderId))
        .returning();

      const dealer = await db
        .select({ name: usersTable.name })
        .from(usersTable)
        .where(eq(usersTable.id, updated.dealerId))
        .limit(1);

      const order = await db
        .select({ material: ordersTable.material, location: ordersTable.location })
        .from(ordersTable)
        .where(eq(ordersTable.id, updated.orderId))
        .limit(1);

      if (status === "delivered") {
        const allSubOrders = await db
          .select()
          .from(subOrdersTable)
          .where(eq(subOrdersTable.orderId, updated.orderId));

        const allDelivered = allSubOrders.every((so) =>
          so.id === subOrderId ? true : so.status === "delivered"
        );

        if (allDelivered) {
          await db
            .update(ordersTable)
            .set({ status: "delivered" })
            .where(eq(ordersTable.id, updated.orderId));
        } else {
          const anyDispatched = allSubOrders.some((so) =>
            so.id === subOrderId ? status === "dispatched" : so.status === "dispatched"
          );
          if (anyDispatched || status === "dispatched") {
            await db
              .update(ordersTable)
              .set({ status: "dispatched" })
              .where(eq(ordersTable.id, updated.orderId));
          }
        }
      } else if (status === "dispatched") {
        await db
          .update(ordersTable)
          .set({ status: "dispatched" })
          .where(eq(ordersTable.id, updated.orderId));
      }

      saveDb();

      res.json({
        ...updated,
        dealerName: dealer[0]?.name || "",
        material: order[0]?.material || "",
        location: order[0]?.location || "",
      });
    } catch (err) {
      req.log.error({ err }, "Update suborder status error");
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

router.get(
  "/dealer/mine",
  authenticateToken,
  requireRole("dealer"),
  async (req: AuthRequest, res) => {
    try {
      const subOrders = await db
        .select({
          id: subOrdersTable.id,
          orderId: subOrdersTable.orderId,
          dealerId: subOrdersTable.dealerId,
          allocatedQty: subOrdersTable.allocatedQty,
          pricePerUnit: subOrdersTable.pricePerUnit,
          status: subOrdersTable.status,
          createdAt: subOrdersTable.createdAt,
          dealerName: usersTable.name,
          material: ordersTable.material,
          location: ordersTable.location,
        })
        .from(subOrdersTable)
        .leftJoin(usersTable, eq(subOrdersTable.dealerId, usersTable.id))
        .leftJoin(ordersTable, eq(subOrdersTable.orderId, ordersTable.id))
        .where(eq(subOrdersTable.dealerId, req.userId!));

      res.json(subOrders);
    } catch (err) {
      req.log.error({ err }, "Get dealer suborders error");
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
